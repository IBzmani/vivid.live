/**
 * @file lib/antiAbuse.ts
 * @description Free tier fraud prevention, disposable email filtering,
 * and rate-limiting guards to prevent bot / Sybil compute draining.
 */

// Common disposable / temp email providers used by bot farms
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'yopmail.com',
  'dispostable.com',
  'trashmail.com',
  'getairmail.com',
  'fakeinbox.com',
  'crazymailing.com',
  'burnermail.io',
  'throwawaymail.com',
  'inboxkitten.com',
  'temp-mail.org',
  'tempail.com',
  'mohmal.com'
]);

/**
 * Validates whether an email is from a known temporary/disposable service.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return true;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : true;
}

/**
 * In-memory rate-limiter for API routes (window-based).
 */
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 30, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || record.expiresAt < now) {
    rateLimitMap.set(identifier, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}
