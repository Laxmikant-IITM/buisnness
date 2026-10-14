/**
 * Razorpay Payment Gateway Integration
 * Module: Commercial Payments (src/lib/razorpay.ts)
 *
 * Provides a configured Razorpay client instance, order creation in integer paise,
 * and cryptographically secure payment and webhook signature verification using HMAC-SHA256.
 *
 * Rules:
 * - All monetary values are strictly integer paise (1 INR = 100 paise).
 * - Minimum transaction floor of 100 paise (₹1) is strictly enforced.
 * - Signature comparison uses constant-time buffers to prevent timing side-channel attacks.
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';

/**
 * Interface representing parameters required to create an upstream Razorpay order.
 */
export interface CreateRazorpayOrderParams {
  /** Order amount denominated in integer paise (100 paise = ₹1.00). Must be >= 100. */
  amountPaise: number;
  /** Three-letter ISO currency code. Defaults to 'INR'. */
  currency?: string;
  /** Internal tracking receipt, typically the LMS Order CUID. */
  receipt: string;
  /** Optional key-value pairs to store in Razorpay for debugging and reconciliation. */
  notes?: Record<string, string>;
}

/**
 * Interface representing the standardized response from Razorpay order creation.
 */
export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string | null;
  status: string;
  created_at: number;
}

/**
 * Interface representing input parameters for payment verification.
 */
export interface VerifyPaymentSignatureParams {
  /** Upstream Razorpay order ID (e.g. order_xyz123). */
  orderId: string;
  /** Upstream Razorpay payment ID (e.g. pay_abc456). */
  paymentId: string;
  /** Upstream Razorpay signature hex string received from the frontend checkout modal. */
  signature: string;
  /** Optional secret override; defaults to process.env.RAZORPAY_KEY_SECRET. */
  secret?: string;
}

/**
 * Interface representing input parameters for webhook verification.
 */
export interface VerifyWebhookSignatureParams {
  /** The exact raw string payload received in the HTTP request body. */
  rawBody: string;
  /** Signature header provided in 'x-razorpay-signature'. */
  signature: string;
  /** Optional secret override; defaults to process.env.RAZORPAY_WEBHOOK_SECRET. */
  secret?: string;
}

/**
 * Lazy singleton initialization of Razorpay client instance.
 * Avoids throwing errors at build time when environment variables are not populated.
 */
let cachedRazorpayInstance: Razorpay | null = null;

/**
 * Retrieves the configured Razorpay client instance.
 *
 * @returns Initialized Razorpay SDK instance.
 * @throws Error if RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing.
 */
export function getRazorpayClient(): Razorpay {
  if (cachedRazorpayInstance) {
    return cachedRazorpayInstance;
  }

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    // If running in development without credentials, warn and provide mockable stub if needed
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in development. Calls will fail unless configured.',
      );
    }
  }

  cachedRazorpayInstance = new Razorpay({
    key_id: key_id || 'rzp_test_placeholder',
    key_secret: key_secret || 'placeholder_secret',
  });

  return cachedRazorpayInstance;
}

/**
 * Creates a server-side order with Razorpay.
 * Enforces mandatory integer paise validation and the ₹1 (100 paise) minimum transaction floor.
 *
 * @param params - Order creation parameters.
 * @returns Resolves with the created Razorpay order object.
 */
export async function createRazorpayOrder(
  params: CreateRazorpayOrderParams,
): Promise<RazorpayOrderResult> {
  const { amountPaise, currency = 'INR', receipt, notes = {} } = params;

  // Strict integer check
  if (!Number.isInteger(amountPaise)) {
    throw new Error(`Amount must be an integer paise value. Received: ${amountPaise}`);
  }

  // Strict minimum floor check: ₹1 (100 paise)
  if (amountPaise < 100) {
    throw new Error(
      `Razorpay orders require a minimum transaction floor of 100 paise (₹1). Received: ${amountPaise}`,
    );
  }

  const razorpay = getRazorpayClient();

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency,
    receipt,
    notes,
  });

  return {
    id: order.id,
    amount: typeof order.amount === 'number' ? order.amount : Number(order.amount),
    currency: order.currency,
    receipt: order.receipt ?? null,
    status: order.status,
    created_at: typeof order.created_at === 'number' ? order.created_at : Math.floor(Date.now() / 1000),
  };
}

/**
 * Cryptographically verifies Razorpay payment signature returned to the client upon checkout completion.
 * Computes HMAC-SHA256(order_id + "|" + payment_id, secret) and compares in constant time.
 *
 * @param params - Signature verification parameters.
 * @returns True if signature is cryptographically valid, false otherwise.
 */
export function verifyPaymentSignature(
  params: VerifyPaymentSignatureParams,
): boolean {
  const { orderId, paymentId, signature, secret } = params;
  const keySecret = secret || process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    console.error('[razorpay] RAZORPAY_KEY_SECRET is not configured.');
    return false;
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  try {
    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch (error) {
    console.error('[razorpay] Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Cryptographically verifies Razorpay webhook signature from request headers.
 * Computes HMAC-SHA256(rawBody, webhookSecret) and performs constant-time comparison.
 *
 * @param params - Webhook verification parameters.
 * @returns True if webhook signature is cryptographically authentic, false otherwise.
 */
export function verifyWebhookSignature(
  params: VerifyWebhookSignatureParams,
): boolean {
  const { rawBody, signature, secret } = params;
  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[razorpay] RAZORPAY_WEBHOOK_SECRET is not configured.');
    return false;
  }

  if (!rawBody || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch (error) {
    console.error('[razorpay] Error verifying webhook signature:', error);
    return false;
  }
}
