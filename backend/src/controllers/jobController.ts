import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const createJobSchema = z.object({
  queueId: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['IMMEDIATE', 'DELAYED', 'SCHEDULED', 'RECURRING', 'BATCH']).optional(),
  payload: z.record(z.string(), z.any()),
  priority: z.number().int().optional(),
  maxAttempts: z.number().int().min(1).optional(),
  scheduledAt: z.string().datetime().optional(),
  cronExpression: z.string().optional(),
  dependsOnJobIds: z.array(z.string().uuid()).optional(),
});

export async function createJob(req: AuthRequest, res: Response) {
  try {
    const data = createJobSchema.parse(req.body);

    const queue = await prisma.queue.findFirst({
      where: { id: data.queueId, project: { organizationId: req.user!.organizationId } },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const jobType = data.type ?? 'IMMEDIATE';

    if (jobType === 'SCHEDULED' && !data.scheduledAt) {
      return res.status(400).json({ error: 'scheduledAt is required for SCHEDULED jobs' });
    }
    if (jobType === 'RECURRING' && !data.cronExpression) {
      return res.status(400).json({ error: 'cronExpression is required for RECURRING jobs' });
    }

    let initialStatus: 'QUEUED' | 'SCHEDULED' = 'QUEUED';
    if (jobType === 'DELAYED' || jobType === 'SCHEDULED' || jobType === 'RECURRING') {
      initialStatus = 'SCHEDULED';
    }

    const job = await prisma.job.create({
      data: {
        queueId: data.queueId,
        name: data.name,
        type: jobType,
        status: initialStatus,
        payload: data.payload,
        priority: data.priority ?? 0,
        maxAttempts: data.maxAttempts ?? 3,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        cronExpression: data.cronExpression,
      },
    });

    if (jobType === 'RECURRING' && data.cronExpression) {
      await prisma.scheduledJob.create({
        data: {
          jobId: job.id,
          cronExpression: data.cronExpression,
          nextRunAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
        },
      });
    }

    if (data.dependsOnJobIds && data.dependsOnJobIds.length > 0) {
      await prisma.jobDependency.createMany({
        data: data.dependsOnJobIds.map((prereqId) => ({
          dependentJobId: job.id,
          prerequisiteJobId: prereqId,
        })),
        skipDuplicates: true,
      });
    }

    return res.status(201).json({ job });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listJobs(req: AuthRequest, res: Response) {
  try {
    const { queueId, status } = req.query;

    const jobs = await prisma.job.findMany({
      where: {
        queue: { project: { organizationId: req.user!.organizationId } },
        ...(queueId ? { queueId: String(queueId) } : {}),
        ...(status ? { status: String(status) as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json({ jobs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getJob(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;

    const job = await prisma.job.findFirst({
      where: { id, queue: { project: { organizationId: req.user!.organizationId } } },
      include: {
        executions: { orderBy: { startedAt: 'desc' } },
        logs: { orderBy: { timestamp: 'desc' }, take: 50 },
        dependsOn: { include: { prerequisiteJob: true } },
        dlqEntry: true,
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json({ job });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function cancelJob(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;

    const job = await prisma.job.findFirst({
      where: { id, queue: { project: { organizationId: req.user!.organizationId } } },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status === 'COMPLETED' || job.status === 'RUNNING') {
      return res.status(400).json({
        error: `Cannot cancel a job with status ${job.status}`,
      });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return res.json({ job: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
