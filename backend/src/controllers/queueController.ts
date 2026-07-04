import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const createQueueSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2),
  concurrencyLimit: z.number().int().min(1).optional(),
  priority: z.number().int().optional(),
  maxRetries: z.number().int().min(0).optional(),
  backoffStrategy: z.enum(['FIXED', 'LINEAR', 'EXPONENTIAL']).optional(),
  baseDelayMs: z.number().int().min(0).optional(),
  maxDelayMs: z.number().int().min(0).optional(),
});

export async function createQueue(req: AuthRequest, res: Response) {
  try {
    const data = createQueueSchema.parse(req.body);

    const project = await prisma.project.findFirst({
      where: { id: data.projectId, organizationId: req.user!.organizationId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const queue = await prisma.queue.create({
      data: {
        name: data.name,
        projectId: data.projectId,
        concurrencyLimit: data.concurrencyLimit ?? 5,
        priority: data.priority ?? 0,
        retryPolicy: {
          create: {
            maxRetries: data.maxRetries ?? 3,
            backoffStrategy: data.backoffStrategy ?? 'EXPONENTIAL',
            baseDelayMs: data.baseDelayMs ?? 1000,
            maxDelayMs: data.maxDelayMs ?? 60000,
          },
        },
      },
      include: { retryPolicy: true },
    });

    return res.status(201).json({ queue });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listQueues(req: AuthRequest, res: Response) {
  try {
    const { projectId } = req.query;

    const queues = await prisma.queue.findMany({
      where: {
        project: { organizationId: req.user!.organizationId },
        ...(projectId ? { projectId: String(projectId) } : {}),
      },
      include: { retryPolicy: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ queues });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getQueue(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const queue = await prisma.queue.findFirst({
      where: { id, project: { organizationId: req.user!.organizationId } },
      include: { retryPolicy: true },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const statusCounts = await prisma.job.groupBy({
      by: ['status'],
      where: { queueId: id },
      _count: { status: true },
    });

    const stats = statusCounts.reduce((acc, row) => {
      acc[row.status] = row._count.status;
      return acc;
    }, {} as Record<string, number>);

    return res.json({ queue, stats });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function pauseResumeQueue(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { action } = req.body as { action: 'pause' | 'resume' };

    if (action !== 'pause' && action !== 'resume') {
      return res.status(400).json({ error: "action must be 'pause' or 'resume'" });
    }

    const queue = await prisma.queue.findFirst({
      where: { id, project: { organizationId: req.user!.organizationId } },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const updated = await prisma.queue.update({
      where: { id },
      data: { isPaused: action === 'pause' },
    });

    return res.json({ queue: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
