/**
 * Safe sanitization utilities for output
 * React already escapes text content, but this adds explicit protection
 */

export function sanitizeString(input: string | null | undefined, maxLength: number = 255): string {
  if (!input) return '';
  
  const str = String(input).trim();
  
  // Remove any potential HTML/JS injection characters at the boundaries
  const sanitized = str
    .replace(/[<>\"']/g, '') // Remove HTML special chars
    .substring(0, maxLength);
  
  return sanitized;
}

export function sanitizeDriverName(name: string | null | undefined): string {
  if (!name) return '';
  
  // Driver names should only contain letters, numbers, spaces, and basic punctuation
  const sanitized = String(name)
    .trim()
    .replace(/[^a-zA-Z0-9\s\-']/g, '') // Keep only safe chars
    .substring(0, 100);
  
  return sanitized || 'Unknown';
}

export function sanitizeNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
}

export function sanitizeRoute(route: any): any {
  return {
    ...route,
    driverName: sanitizeDriverName(route.driverName),
    vehicleType: sanitizeString(route.vehicleType, 50),
  };
}
