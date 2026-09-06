// Rate limiter using Upstash Redis for distributed rate limiting
// Supports multiple instances and auto-scaling

interface RedisRateLimitEntry {
  count: number;
  resetTime: number;
}

// Use Upstash Redis in production, fallback to in-memory for development
const useRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Fallback in-memory storage for development
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

const requestCounts = new Map<string, RateLimitEntry>();

async function redisIncrement(
  key: string,
  windowMs: number
): Promise<number> {
  if (!useRedis) {
    return 0; // Signal to use in-memory
  }

  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL!;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN!;

    // Use Redis INCR with expiration
    const response = await fetch(`${redisUrl}/incr/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redisToken}`,
      },
    });

    if (!response.ok) {
      console.error('Redis INCR failed:', response.statusText);
      return -1;
    }

    const data = await response.json() as { result: number };
    const count = data.result;

    // Set expiration on first request
    if (count === 1) {
      const expireUrl = `${redisUrl}/expire/${key}/${Math.ceil(windowMs / 1000)}`;
      await fetch(expireUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${redisToken}`,
        },
      });
    }

    return count;
  } catch (error) {
    console.error('Redis rate limiter error:', error instanceof Error ? error.message : String(error));
    return -1; // Signal error
  }
}

async function redisGetStatus(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ remaining: number; resetTime: number }> {
  if (!useRedis) {
    return { remaining: maxRequests, resetTime: Date.now() + windowMs };
  }

  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL!;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN!;

    const response = await fetch(`${redisUrl}/get/${key}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${redisToken}`,
      },
    });

    if (!response.ok) {
      return { remaining: maxRequests, resetTime: Date.now() + windowMs };
    }

    const data = await response.json() as { result: string | null };
    const count = data.result ? parseInt(data.result, 10) : 0;

    return {
      remaining: Math.max(0, maxRequests - count),
      resetTime: Date.now() + windowMs,
    };
  } catch (error) {
    console.error('Redis status error:', error instanceof Error ? error.message : String(error));
    return { remaining: maxRequests, resetTime: Date.now() + windowMs };
  }
}

export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): Promise<boolean> {
  if (!identifier) {
    return false; // Reject if no identifier
  }

  // Try Redis first
  if (useRedis) {
    try {
      const count = await redisIncrement(identifier, windowMs);
      if (count > 0 && count <= maxRequests) {
        return true;
      }
      if (count > maxRequests) {
        return false;
      }
      // If count is -1, error occurred, try in-memory fallback
    } catch (error) {
      console.error('Rate limit check error:', error);
    }
  }

  // Fallback: in-memory rate limiting
  const now = Date.now();
  const key = identifier;
  const current = requestCounts.get(key);

  if (!current || now >= current.resetTime) {
    // Window has expired or no record exists - create new record
    requestCounts.set(key, {
      count: 1,
      resetTime: now + windowMs,
      firstRequestTime: now,
    });
    return true;
  }

  if (current.count >= maxRequests) {
    // Rate limit exceeded
    return false;
  }

  // Increment and allow
  current.count++;
  return true;
}

export async function getRateLimitStatus(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): Promise<{ remaining: number; resetTime: number }> {
  // Try Redis first
  if (useRedis) {
    try {
      return await redisGetStatus(identifier, maxRequests, windowMs);
    } catch (error) {
      console.error('Rate limit status error:', error);
    }
  }

  // Fallback: in-memory
  const now = Date.now();
  const current = requestCounts.get(identifier);

  if (!current || now >= current.resetTime) {
    return { remaining: maxRequests, resetTime: now + windowMs };
  }

  return {
    remaining: Math.max(0, maxRequests - current.count),
    resetTime: current.resetTime,
  };
}

// Cleanup old entries periodically (every 5 minutes)
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  let deletedCount = 0;

  for (const [key, value] of requestCounts.entries()) {
    if (now >= value.resetTime) {
      requestCounts.delete(key);
      deletedCount++;
    }
  }

  // Log cleanup in non-production
  if (process.env.NODE_ENV !== 'production' && deletedCount > 0) {
    console.debug(`[Rate Limit] Cleaned up ${deletedCount} expired entries`);
  }
}, 300000); // 5 minutes

// Allow process to exit even if this interval is active
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}
