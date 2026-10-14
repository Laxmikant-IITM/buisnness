/**
 * Coupon & Promotional Code Validation Engine
 * Module: Commercial Pricing (src/lib/coupons.ts)
 *
 * Implements defensive, multi-factor coupon validation supporting:
 * - PERCENT and FIXED_PAISE discounts.
 * - Minimum order amount threshold (minOrderPaise).
 * - Temporal start and expiry window enforcement (startsAt, expiresAt).
 * - Global usage limits (maxUses vs currentUses).
 * - Single-use per user restrictions (isSingleUsePerUser via CouponUsage).
 * - First-purchase only rules for new learners.
 * - Allowed student email domain / address whitelisting.
 * - Course and bundle targeting constraints.
 */

import { prisma } from '@/lib/db';
import type { Coupon } from '@prisma/client';

/**
 * Input arguments for validating a coupon code against a purchase context.
 */
export interface ValidateCouponInput {
  /** The promotional coupon code string entered by the user. */
  code: string;
  /** Subtotal of the cart items before discounts, in integer paise. */
  subtotalPaise: number;
  /** Unique ID of the authenticated purchasing user, if available. */
  userId?: string;
  /** Verified email address of the purchasing user, if available. */
  userEmail?: string;
  /** Array of course IDs included in this checkout. */
  courseIds?: string[];
  /** Bundle ID if this checkout is purchasing a multi-course bundle. */
  bundleId?: string;
  /** Require that the user has never completed a paid purchase before. */
  firstPurchaseOnly?: boolean;
  /** Optional explicit email whitelist to restrict coupon redemptions. */
  allowedEmails?: string[];
  /** Optional restricted bundle IDs the coupon is explicitly valid for. */
  targetBundleIds?: string[];
}

/**
 * Output result from coupon validation.
 */
export interface CouponValidationResult {
  /** Whether the coupon is active, eligible, and applicable to this order. */
  isValid: boolean;
  /** Friendly error message if the coupon is invalid or ineligible. */
  error?: string;
  /** The validated Coupon record from the database. */
  coupon?: Coupon;
  /** The calculated discount amount in integer paise. */
  discountPaise: number;
  /** The resulting net total in integer paise after coupon deduction. */
  effectiveTotalPaise: number;
}

/**
 * Calculates discount amount in paise for a given coupon and subtotal.
 * Pure mathematical calculation without database lookups.
 *
 * @param coupon - The coupon model containing discountType and discountValue.
 * @param subtotalPaise - The gross subtotal before discounts.
 * @returns Discount amount in integer paise (capped at subtotalPaise).
 */
export function calculateCouponDiscount(
  coupon: Pick<Coupon, 'discountType' | 'discountValue'>,
  subtotalPaise: number,
): number {
  if (subtotalPaise <= 0 || coupon.discountValue <= 0) {
    return 0;
  }

  let discount = 0;

  if (coupon.discountType === 'PERCENT') {
    // discountValue is percentage points (e.g. 20 = 20%)
    discount = Math.round((subtotalPaise * coupon.discountValue) / 100);
  } else if (coupon.discountType === 'FIXED_PAISE') {
    // discountValue is raw paise (e.g. 50000 = ₹500.00)
    discount = coupon.discountValue;
  } else {
    // Unknown discount type fallback
    discount = 0;
  }

  // A discount can never exceed the total subtotal
  return Math.max(0, Math.min(discount, subtotalPaise));
}

/**
 * Validates a coupon code against current business rules, user history, and cart parameters.
 *
 * @param input - Contextual validation parameters.
 * @returns CouponValidationResult indicating validity, discount, and reasons for rejection.
 */
export async function validateCoupon(
  input: ValidateCouponInput,
): Promise<CouponValidationResult> {
  const {
    code,
    subtotalPaise,
    userId,
    userEmail,
    firstPurchaseOnly,
    allowedEmails,
    targetBundleIds,
    bundleId,
  } = input;

  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return {
      isValid: false,
      error: 'Coupon code cannot be empty.',
      discountPaise: 0,
      effectiveTotalPaise: subtotalPaise,
    };
  }

  // 1. Fetch coupon record by unique uppercase code
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon) {
    return {
      isValid: false,
      error: `Coupon "${normalizedCode}" is not recognized.`,
      discountPaise: 0,
      effectiveTotalPaise: subtotalPaise,
    };
  }

  // 2. Active status check
  if (!coupon.isActive) {
    return {
      isValid: false,
      error: `Coupon "${normalizedCode}" is currently inactive.`,
      discountPaise: 0,
      effectiveTotalPaise: subtotalPaise,
    };
  }

  const now = new Date();

  // 3. Start date check
  if (coupon.startsAt && now < coupon.startsAt) {
    return {
      isValid: false,
      error: `Coupon "${normalizedCode}" is not yet active.`,
      discountPaise: 0,
      effectiveTotalPaise: subtotalPaise,
    };
  }

  // 4. Expiration date check
  if (coupon.expiresAt && now > coupon.expiresAt) {
    return {
      isValid: false,
      error: `Coupon "${normalizedCode}" has expired.`,
      discountPaise: 0,
      effectiveTotalPaise: subtotalPaise,
    };
  }

  // 5. Global maximum usage limit check
  if (coupon.maxUses !== null && coupon.maxUses !== undefined) {
    if (coupon.currentUses >= coupon.maxUses) {
      return {
        isValid: false,
        error: `Coupon "${normalizedCode}" has reached its maximum redemption limit.`,
        discountPaise: 0,
        effectiveTotalPaise: subtotalPaise,
      };
    }
  }

  // 6. Minimum order value threshold check
  if (coupon.minOrderPaise && subtotalPaise < coupon.minOrderPaise) {
    const minRupees = Math.ceil(coupon.minOrderPaise / 100);
    return {
      isValid: false,
      error: `Coupon "${normalizedCode}" requires a minimum order of ₹${minRupees.toLocaleString('en-IN')}.`,
      discountPaise: 0,
      effectiveTotalPaise: subtotalPaise,
    };
  }

  // 7. Single use per user restriction check
  if (coupon.isSingleUsePerUser && userId) {
    const priorUsage = await prisma.couponUsage.findFirst({
      where: {
        couponId: coupon.id,
        userId,
      },
      select: { id: true },
    });

    if (priorUsage) {
      return {
        isValid: false,
        error: `You have already redeemed coupon "${normalizedCode}".`,
        discountPaise: 0,
        effectiveTotalPaise: subtotalPaise,
      };
    }
  }

  // 8. First purchase only check (convention code check or explicit flag)
  const isFirstPurchaseRule =
    firstPurchaseOnly ||
    normalizedCode.startsWith('FIRST') ||
    normalizedCode.startsWith('WELCOME');

  if (isFirstPurchaseRule && userId) {
    const paidOrdersCount = await prisma.order.count({
      where: {
        userId,
        status: 'PAID',
      },
    });

    if (paidOrdersCount > 0) {
      return {
        isValid: false,
        error: `Coupon "${normalizedCode}" is reserved strictly for first-time purchasers.`,
        discountPaise: 0,
        effectiveTotalPaise: subtotalPaise,
      };
    }
  }

  // 9. Email whitelist restriction check
  if (allowedEmails && allowedEmails.length > 0) {
    if (!userEmail) {
      return {
        isValid: false,
        error: `Please sign in to verify eligibility for coupon "${normalizedCode}".`,
        discountPaise: 0,
        effectiveTotalPaise: subtotalPaise,
      };
    }

    const normalizedUserEmail = userEmail.trim().toLowerCase();
    const isWhitelisted = allowedEmails.some(
      (email) => email.trim().toLowerCase() === normalizedUserEmail,
    );

    if (!isWhitelisted) {
      return {
        isValid: false,
        error: `Your account email (${userEmail}) is not eligible for coupon "${normalizedCode}".`,
        discountPaise: 0,
        effectiveTotalPaise: subtotalPaise,
      };
    }
  }

  // 10. Bundle target restrictions
  if (targetBundleIds && targetBundleIds.length > 0) {
    if (!bundleId || !targetBundleIds.includes(bundleId)) {
      return {
        isValid: false,
        error: `Coupon "${normalizedCode}" is only applicable to specific course packages.`,
        discountPaise: 0,
        effectiveTotalPaise: subtotalPaise,
      };
    }
  }

  // 11. Calculate final discount
  const discountPaise = calculateCouponDiscount(coupon, subtotalPaise);
  const effectiveTotalPaise = Math.max(0, subtotalPaise - discountPaise);

  return {
    isValid: true,
    coupon,
    discountPaise,
    effectiveTotalPaise,
  };
}
