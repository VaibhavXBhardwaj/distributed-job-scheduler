import dotenv from 'dotenv';
dotenv.config();

import prisma from './lib/prisma';
import redis from './lib/redis';
import { executeJob, calculateBackoffMs } from './services/executor';
import { generateFailureSummary } from './services/aiSummary';

const WORKER_NAME = process.env.WORKER_NAME || `worker-${Date.now()}`;
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 2000;
const HEARTBEAT_INTERVAL_MS = Number(process.env.HEARTBEAT_INTERVAL_MS) || 10000;

let workerId: string | null = null;
let isShuttingDown = false;
let isProcessing = false;

async function registerWorker() {
  const worker = await prisma.worker.create({
    data: {
      name: WORKER_NAME,
      status: 'ONLINE',
      lastHeartbeatAt: new Date(),
    },
  });
  workerId = worker.id;
  console.log(`[worker] registered as ${WORKER_NAME} (id: ${workerId})`);
}

async function sendHeartbeat() {
  if (!workerId) return;
  try {
    await prisma.worker.update({
      where: { id: workerId },
      data: { lastHeartbeatAt: new Date(), status: 'ONLINE' },
    });
    await prisma.workerHeartbeat.create({
      data: { workerId },
    });
  } catch (err) {
    console.error('[worker] heartbeat failed:', err);
  }
}

async function claimNextJob() {
  if (!workerId) return null;

  return prisma.$transaction(async (tx) => {
    const candidates: { id: string }[] = await tx.$queryRawUnsafe(
      `
      SELECT j.id FROM jobs j
      JOIN queues q ON j."queueId" = q.id
      WHERE j.status IN ('QUEUED', 'SCHEDULED')
        AND q."isPaused" = false
        AND (j."scheduledAt" IS NULL OR j."scheduledAt" <= NOW())
        AND NOT EXISTS (
          SELECT 1 FROM job_dependencies jd
          JOIN jobs pj ON jd."prerequisiteJobId" = pj.id
          WHERE jd."dependentJobId" = j.id AND pj.status != 'COMPLETED'
        )
        AND (
          SELECT COUNT(*) FROM jobs rj
          WHERE rj."queueId" = j."queueId" AND rj.status = 'RUNNING'
        ) < q."concurrencyLimit"
      ORDER BY j.priority DESC, j."createdAt" ASC
      LIMIT 1
      FOR UPDATE OF j SKIP LOCKED
      `
    );

    if (candidates.length === 0) {
      return null;
    }

    const jobId = candidates[0].id;

    const job = await tx.job.update({
      where: { id: jobId },
      data: {
        status: 'CLAIMED',
        claimedByWorkerId: workerId,
        claimedAt: new Date(),
      },
      include: { queue: { include: { retryPolicy: true } } },
    });

    return job;
  });
}

async function processJob(job: any) {
  console.log(`[worker] processing job ${job.id} (${job.name}), attempt ${job.attempts + 1}`);

  await prisma.job.update({
    where: { id: job.id },
    data: { status: 'RUNNING', startedAt: new Date(), attempts: job.attempts + 1 },
  });

  const executionStart = new Date();
  const result = await executeJob(job.name, job.payload);

  await prisma.jobExecution.create({
    data: {
      jobId: job.id,
      workerId: workerId!,
      attemptNumber: job.attempts + 1,
      status: result.success ? 'COMPLETED' : 'FAILED',
      startedAt: executionStart,
      finishedAt: new Date(),
      errorMessage: result.errorMessage,
      errorStack: result.errorStack,
    },
  });

  if (result.success) {
    await prisma.job.update({
      where: { id: job.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    await prisma.jobLog.create({
      data: { jobId: job.id, level: 'info', message: 'Job completed successfully' },
    });
    console.log(`[worker] job ${job.id} completed`);
    return;
  }

  const newAttempts = job.attempts + 1;
  const maxAttempts = job.maxAttempts;

  if (newAttempts >= maxAttempts) {
    const aiSummary = await generateFailureSummary(
      job.name,
      result.errorMessage || 'Unknown error',
      result.errorStack,
      newAttempts
    );

    await prisma.$transaction([
      prisma.job.update({
        where: { id: job.id },
        data: { status: 'DEAD_LETTER', failedAt: new Date() },
      }),
      prisma.deadLetterJob.create({
        data: {
          jobId: job.id,
          reason: result.errorMessage || 'Max retries exceeded',
          aiSummary: aiSummary || undefined,
        },
      }),
    ]);
    await prisma.jobLog.create({
      data: { jobId: job.id, level: 'error', message: `Job moved to DLQ after ${newAttempts} attempts` },
    });
    console.log(`[worker] job ${job.id} moved to DLQ after ${newAttempts} attempts`);
  } else {
    const retryPolicy = job.queue.retryPolicy;
    const delayMs = calculateBackoffMs(
      retryPolicy?.backoffStrategy || 'EXPONENTIAL',
      retryPolicy?.baseDelayMs || 1000,
      retryPolicy?.maxDelayMs || 60000,
      newAttempts
    );

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'SCHEDULED',
        scheduledAt: new Date(Date.now() + delayMs),
        claimedByWorkerId: null,
        claimedAt: null,
      },
    });
    await prisma.jobLog.create({
      data: { jobId: job.id, level: 'warn', message: `Job failed, retrying in ${delayMs}ms (attempt ${newAttempts}/${maxAttempts})` },
    });
    console.log(`[worker] job ${job.id} failed, retrying in ${delayMs}ms`);
  }
}

async function pollLoop() {
  if (isShuttingDown || isProcessing) return;

  isProcessing = true;
  try {
    const job = await claimNextJob();
    if (job) {
      await processJob(job);
    }
  } catch (err) {
    console.error('[worker] error in poll loop:', err);
  } finally {
    isProcessing = false;
  }
}

async function shutdown() {
  console.log('[worker] shutting down gracefully...');
  isShuttingDown = true;

  if (workerId) {
    await prisma.worker.update({
      where: { id: workerId },
      data: { status: 'OFFLINE' },
    }).catch(() => {});
  }

  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function start() {
  await registerWorker();
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  setInterval(pollLoop, POLL_INTERVAL_MS);
  console.log(`[worker] polling every ${POLL_INTERVAL_MS}ms, heartbeat every ${HEARTBEAT_INTERVAL_MS}ms`);
}

start().catch((err) => {
  console.error('[worker] failed to start:', err);
  process.exit(1);
});
