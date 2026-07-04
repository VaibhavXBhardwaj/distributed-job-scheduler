import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export async function createProject(req: AuthRequest, res: Response) {
  try {
    const data = createProjectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId: req.user!.organizationId,
        createdById: req.user!.userId,
      },
    });

    return res.status(201).json({ project });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listProjects(req: AuthRequest, res: Response) {
  try {
    const projects = await prisma.project.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ projects });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProject(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;

    const project = await prisma.project.findFirst({
      where: { id, organizationId: req.user!.organizationId },
      include: { queues: true },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json({ project });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteProject(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;

    const project = await prisma.project.findFirst({
      where: { id, organizationId: req.user!.organizationId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({ where: { id } });

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
