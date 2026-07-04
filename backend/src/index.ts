import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import prisma from './lib/prisma';
import redis from './lib/redis';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisPing = await redis.ping();

    res.json({
      status: 'ok',
      db: 'connected',
      redis: redisPing === 'PONG' ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err instanceof Error ? err.message : 'unknown error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
});
