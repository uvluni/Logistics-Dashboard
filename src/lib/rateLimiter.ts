// Simple in-memory rate limiter for API endpoints
// In production, use Redis or similar for distributed systems

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = identifier;

  const current = requestCounts.get(key);

  if (!current || now >= current.resetTime) {
    // Window has expired or no record exists
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
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

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now >= value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 300000);
