import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'dev-insecure-secret-change-in-production';

export function generateCSRFToken(): string {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');
  // Sign it with secret to prevent tampering
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex');
  return `${token}.${signature}`;
}

export function verifyCSRFToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [tokenPart, signature] = parts;
  
  // Recreate signature
  const expectedSignature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(tokenPart)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
