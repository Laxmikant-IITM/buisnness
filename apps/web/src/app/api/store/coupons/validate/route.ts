/**
 * Coupon Quote & Validation API
 * Module: Commercial Pricing (src/app/api/store/coupons/validate/route.ts)
 *
 * Provides real-time quote validation for checkout previews, calculating exact
 * percentage or fixed discounts in integer paise without committing orders.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { validateCoupon } from '@/lib/coupons';

const ValidateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code cannot be empty'),
  subtotalPaise: z.number().int().min(0, 'Subtotal must be a positive integer in paise'),
  courseIds: z.array(z.string()).optional(),
  bundleId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json().catch(() => ({}));
    const parseResult = ValidateCouponSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          valid: false,
          discountPaise: 0,
          message: 'Invalid request format.',
          details: parseResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { code, subtotalPaise, courseIds, bundleId } = parseResult.data;

    const validation = await validateCoupon({
      code,
      subtotalPaise,
      userId: session?.userId,
      userEmail: session?.email,
      courseIds,
      bundleId,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          valid: false,
          discountPaise: 0,
          effectiveTotalPaise: subtotalPaise,
          message: validation.error || 'Coupon could not be applied.',
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      valid: true,
      code: validation.coupon?.code,
      discountType: validation.coupon?.discountType,
      discountValue: validation.coupon?.discountValue,
      discountPaise: validation.discountPaise,
      effectiveTotalPaise: validation.effectiveTotalPaise,
      message: `Coupon "${validation.coupon?.code}" applied successfully!`,
    });
  } catch (error: any) {
    console.error('[validate-coupon] Error validating coupon:', error);
    return NextResponse.json(
      {
        valid: false,
        discountPaise: 0,
        message: 'Unable to validate coupon at this time.',
      },
      { status: 500 },
    );
  }
}
