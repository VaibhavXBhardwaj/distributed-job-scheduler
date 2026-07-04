import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const registerWorkerSchema = z.object({
  name: z.string().min(1),
});

export async function registerWorker(req: AuthRequest, res: Response) {
  try {
    const data = registerWorkerSchema.parse(req.body);

    const worker = await prisma.worker.create({
      data: {
        name: data.name,
        status: 'ONLINE',
        lastHeartbeatAt: new Date(),
      },
    });

    return res.status(201).json({ worker });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function heartbeat(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { cpuLoad, memoryMb } = req.body as { cpuLoad?: number; memoryMb?: number };

    const worker = await prisma.worker.findUnique({ where: { id } });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    await prisma.worker.update({
      where: { id },
      data: { lastHeartbeatAt: new Date(), status: 'ONLINE' },
    });

    await prisma.workerHeartbeat.create({
      data: { workerId: id, cpuLoad, memoryMb },
    });

    return res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function claimJob(req: AuthRequest, res: Response) {
  const { workerId, queueId } = req.body as { workerId: string; queueId?: string };

  if (!workerId) {
    return res.status(400).json({ error: 'workerId is required' });
  }

  try {
    const claimedJob = await prisma.$transaction(async (tx) => {
      const candidates: { id: string }[] = await tx.$queryRawUnsafe(
        `
        SELECT j.id FROM jobs j
        JOIN queues q ON j."queueId" = q.id
        WHERE j.status = 'QUEUED'
          AND q."isPaused" = false
          ${queueId ? `AND j."queueId" = '${queueId}'` : ''}
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
      });

      return job;
    });

    if (!claimedJob) {
      return res.status(204).send();
    }

    return res.json({ job: claimedJob });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
