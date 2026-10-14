/**
 * One-Time Password (OTP) Verification Service
 * Module: Authentication & Identity (apps/web/src/lib/otp.ts)
 *
 * Provides cryptographically secure 6-digit OTP generation, hashing, verification,
 * and rate limiting for registration, password reset, and passwordless authentication.
 *
 * Security Policies:
 * - Codes are 6 digits generated using crypto.randomInt (100000 - 999999).
 * - Code lifetime is strictly 10 minutes (600 seconds).
 * - Codes are salted and hashed using SHA-256 before storage; plaintext OTP is never retained in memory.
 * - Brute-force protection: Maximum 5 verification attempts allowed per OTP.
 * - Request throttling: 60-second cooldown required between successive OTP requests for an email.
 */

import crypto from 'crypto';

/** Default OTP validity window in milliseconds (10 minutes) */
export const OTP_TTL_MS = 10 * 60 * 1000;

/** Minimum cooldown before requesting a new OTP in milliseconds (60 seconds) */
export const OTP_COOLDOWN_MS = 60 * 1000;

/** Maximum allowable failed verification attempts before invalidation */
export const OTP_MAX_ATTEMPTS = 5;

/**
 * Standard purposes for OTP issuance to prevent cross-context replay attacks.
 */
export type OtpPurpose = 'REGISTRATION' | 'PASSWORD_RESET' | 'LOGIN' | 'EMAIL_VERIFICATION';

interface StoredOtpRecord {
  hashedCode: string;
  salt: string;
  expiresAt: number;
  createdAt: number;
  attempts: number;
  metadata?: Record<string, unknown>;
}

// Global cache to survive development fast-refresh and module reload
const globalForOtp = globalThis as unknown as {
  otpStore?: Map<string, StoredOtpRecord>;
};

const otpStore: Map<string, StoredOtpRecord> = globalForOtp.otpStore ?? new Map();
if (process.env.NODE_ENV !== 'production') {
  globalForOtp.otpStore = otpStore;
}

/**
 * Derives a storage key binding the target email to the explicit authorization purpose.
 */
function makeKey(email: string, purpose: string): string {
  return `${purpose.toUpperCase()}:${email.trim().toLowerCase()}`;
}

/**
 * Hashes an OTP code with a salt using SHA-256.
 */
function hashOtp(code: string, salt: string): string {
  return crypto.createHash('sha256').update(`${salt}:${code}`).digest('hex');
}

/**
 * Purges expired OTP records from the in-memory store.
 */
function pruneExpiredOtps(): void {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (record.expiresAt <= now) {
      otpStore.delete(key);
    }
  }
}

export interface GenerateOtpOptions {
  email: string;
  purpose: OtpPurpose | string;
  metadata?: Record<string, unknown>;
  ttlMs?: number;
}

export interface GenerateOtpResult {
  code: string;
  expiresAt: Date;
  cooldownSeconds: number;
}

/**
 * Generates a cryptographically random 6-digit OTP, stores its salted hash,
 * and tracks its 10-minute expiry and attempt limit.
 *
 * @param options - Generation options containing email, purpose, and optional metadata.
 * @returns Object containing the plaintext code (for delivery) and expiration timestamp.
 * @throws Error if requested within the 60-second cooldown window.
 */
export async function generateOtp(options: GenerateOtpOptions): Promise<GenerateOtpResult> {
  const { email, purpose, metadata, ttlMs = OTP_TTL_MS } = options;
  pruneExpiredOtps();

  const key = makeKey(email, purpose);
  const now = Date.now();
  const existing = otpStore.get(key);

  if (existing) {
    const elapsedSinceCreation = now - existing.createdAt;
    if (elapsedSinceCreation < OTP_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - elapsedSinceCreation) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting another code.`);
    }
  }

  // Generate 6-digit random number between 100000 and 999999
  const code = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedCode = hashOtp(code, salt);
  const expiresAt = now + ttlMs;

  otpStore.set(key, {
    hashedCode,
    salt,
    expiresAt,
    createdAt: now,
    attempts: 0,
    metadata,
  });

  // In non-production or test mode, log OTP to server console for testing convenience
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[OTP Service] Code for ${email} (${purpose}): ${code} (expires in 10 mins)`);
  }

  return {
    code,
    expiresAt: new Date(expiresAt),
    cooldownSeconds: Math.ceil(OTP_COOLDOWN_MS / 1000),
  };
}

export interface VerifyOtpOptions {
  email: string;
  code: string;
  purpose: OtpPurpose | string;
  consume?: boolean;
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Verifies a user-supplied 6-digit OTP code against the salted hash.
 * Increments attempt counter and invalidates if expired or max attempts exceeded.
 *
 * @param options - Verification options including user code, email, and purpose.
 * @returns Verification result with success boolean and error message if invalid.
 */
export async function verifyOtp(options: VerifyOtpOptions): Promise<VerifyOtpResult> {
  const { email, code, purpose, consume = true } = options;
  pruneExpiredOtps();

  const key = makeKey(email, purpose);
  const record = otpStore.get(key);

  if (!record) {
    return {
      success: false,
      error: 'Invalid or expired verification code. Please request a new code.',
    };
  }

  const now = Date.now();
  if (record.expiresAt <= now) {
    otpStore.delete(key);
    return {
      success: false,
      error: 'Verification code has expired. Please request a new code.',
    };
  }

  // Increment attempt counter
  record.attempts += 1;

  if (record.attempts > OTP_MAX_ATTEMPTS) {
    otpStore.delete(key);
    return {
      success: false,
      error: 'Maximum verification attempts exceeded. Please request a new code.',
    };
  }

  const suppliedHash = hashOtp(code.trim(), record.salt);
  const hashesMatch = crypto.timingSafeEqual(
    Buffer.from(suppliedHash, 'hex'),
    Buffer.from(record.hashedCode, 'hex')
  );

  if (!hashesMatch) {
    const remainingAttempts = OTP_MAX_ATTEMPTS - record.attempts;
    return {
      success: false,
      error: remainingAttempts > 0
        ? `Incorrect code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
        : 'Maximum verification attempts exceeded. Please request a new code.',
    };
  }

  const metadata = record.metadata;

  if (consume) {
    otpStore.delete(key);
  }

  return {
    success: true,
    metadata,
  };
}

/**
 * Checks remaining cooldown seconds for a given email and purpose.
 *
 * @param email - Target user email.
 * @param purpose - Issuance purpose.
 * @returns Number of seconds remaining in cooldown, or 0 if allowed immediately.
 */
export function getOtpCooldownSeconds(email: string, purpose: OtpPurpose | string): number {
  const key = makeKey(email, purpose);
  const record = otpStore.get(key);
  if (!record) return 0;

  const elapsed = Date.now() - record.createdAt;
  if (elapsed >= OTP_COOLDOWN_MS) return 0;

  return Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
}

/**
 * Clears any active OTP for an email and purpose.
 *
 * @param email - Target user email.
 * @param purpose - Issuance purpose.
 */
export function clearOtp(email: string, purpose: OtpPurpose | string): void {
  const key = makeKey(email, purpose);
  otpStore.delete(key);
}
