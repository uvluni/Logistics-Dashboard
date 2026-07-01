// Rate limiter for API endpoints
// In production with multiple servers, use Redis or similar distributed system
// For now: in-memory with server-local tracking

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

const requestCounts = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): boolean {
  if (!identifier) {
    return false; // Reject if no identifier
  }

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

export function getRateLimitStatus(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): { remaining: number; resetTime: number } {
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
// Production: use Redis TTL instead
if (typeof globalThis !== 'undefined' && globalThis.setInterval) {
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
  cleanupInterval.unref?.();
}
