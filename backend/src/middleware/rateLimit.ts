import { Request, Response, NextFunction } from 'express';
import redis from '../lib/redis';

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowSeconds, maxRequests, keyPrefix = 'ratelimit' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = (req as any).user?.userId || req.ip || 'anonymous';
      const key = `${keyPrefix}:${identifier}:${req.path}`;

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);

      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current).toString());
      res.setHeader('X-RateLimit-Reset', ttl.toString());

      if (current > maxRequests) {
        return res.status(429).json({
          error: 'Too many requests, please slow down',
          retryAfterSeconds: ttl,
        });
      }

      next();
    } catch (err) {
      console.error('[rateLimit] error, allowing request through:', err);
      next();
    }
  };
}
