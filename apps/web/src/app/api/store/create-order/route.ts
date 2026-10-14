/**
 * Store Order Creation API
 * Module: Commercial Store (src/app/api/store/create-order/route.ts)
 *
 * Implements strict server-side price calculation, discount verification (coupons,
 * referrals, and coin balance), minimum transaction floor enforcement (>= ₹1.00 / 100 paise),
 * upstream Razorpay order creation, and database persistence of PENDING orders with item snapshots.
 *
 * Rules:
 * - Never trust client-submitted prices or totals.
 * - Always fetch base prices directly from CourseOffering or BundleOffering tables.
 * - Store all financial values in integer paise.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRazorpayOrder } from '@/lib/razorpay';
import { validateCoupon } from '@/lib/coupons';
import {
  validateReferralCode,
  calculateRefereeDiscount,
  calculateCoinRedemption,
  MINIMUM_TRANSACTION_FLOOR_PAISE,
} from '@/lib/referral';

/**
 * Zod validation schema for incoming order creation request.
 */
const CreateOrderSchema = z.object({
  offeringId: z.string().optional(),
  courseIds: z.array(z.string()).optional(),
  bundleId: z.string().optional(),
  couponCode: z.string().optional(),
  referralCode: z.string().optional(),
  redeemCoins: z.union([z.boolean(), z.number().int().min(0)]).optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to purchase a course.' },
        { status: 401 },
      );
    }

    // 2. Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const parseResult = CreateOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid order input data.', details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const {
      offeringId,
      courseIds,
      bundleId,
      couponCode,
      referralCode,
      redeemCoins,
    } = parseResult.data;

    if (!offeringId && !bundleId && (!courseIds || courseIds.length === 0)) {
      return NextResponse.json(
        { error: 'Please specify a course offering, course ID, or bundle ID.' },
        { status: 400 },
      );
    }

    // 3. Resolve Items & Strict Server-Side Subtotal Calculation
    interface ResolvedItem {
      courseId: string;
      offeringId?: string;
      courseTitle: string;
      offeringTitle: string;
      accessType: string;
      unitPricePaise: number;
    }

    const resolvedItems: ResolvedItem[] = [];
    let calculatedSubtotalPaise = 0;

    if (bundleId) {
      // Purchasing a Course Bundle
      const bundle = await prisma.courseBundle.findUnique({
        where: { id: bundleId },
        include: {
          offerings: { where: { isActive: true } },
          items: {
            include: { course: true },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!bundle || !bundle.isActive) {
        return NextResponse.json(
          { error: 'The selected course package is not available.' },
          { status: 404 },
        );
      }

      // Pick selected offering or first active offering
      const chosenOffering = offeringId
        ? bundle.offerings.find((o) => o.id === offeringId)
        : bundle.offerings[0];

      if (!chosenOffering) {
        return NextResponse.json(
          { error: 'No active pricing option found for this package.' },
          { status: 400 },
        );
      }

      calculatedSubtotalPaise = chosenOffering.discountPricePaise ?? chosenOffering.pricePaise;

      // Distribute bundle across included courses
      const itemCount = bundle.items.length || 1;
      const pricePerCourse = Math.floor(calculatedSubtotalPaise / itemCount);

      bundle.items.forEach((item, index) => {
        // Handle rounding difference on last item
        const itemPrice =
          index === bundle.items.length - 1
            ? calculatedSubtotalPaise - pricePerCourse * (bundle.items.length - 1)
            : pricePerCourse;

        resolvedItems.push({
          courseId: item.courseId,
          offeringId: chosenOffering.id,
          courseTitle: item.course.title,
          offeringTitle: `${bundle.name} (${chosenOffering.name})`,
          accessType: chosenOffering.accessType,
          unitPricePaise: itemPrice,
        });
      });
    } else if (offeringId) {
      // Single Offering Purchase
      const offering = await prisma.courseOffering.findUnique({
        where: { id: offeringId },
        include: { course: true },
      });

      if (!offering || !offering.isActive) {
        return NextResponse.json(
          { error: 'The selected course offering is inactive or not found.' },
          { status: 404 },
        );
      }

      calculatedSubtotalPaise = offering.pricePaise;
      resolvedItems.push({
        courseId: offering.courseId,
        offeringId: offering.id,
        courseTitle: offering.course.title,
        offeringTitle: offering.name,
        accessType: offering.accessType,
        unitPricePaise: offering.pricePaise,
      });
    } else if (courseIds && courseIds.length > 0) {
      // Course IDs provided - lookup default active offering for each
      const courses = await prisma.course.findMany({
        where: { id: { in: courseIds } },
        include: {
          offerings: { where: { isActive: true }, take: 1 },
        },
      });

      for (const course of courses) {
        const offering = course.offerings[0];
        if (!offering) {
          return NextResponse.json(
            { error: `Course "${course.title}" has no active offerings available.` },
            { status: 400 },
          );
        }
        calculatedSubtotalPaise += offering.pricePaise;
        resolvedItems.push({
          courseId: course.id,
          offeringId: offering.id,
          courseTitle: course.title,
          offeringTitle: offering.name,
          accessType: offering.accessType,
          unitPricePaise: offering.pricePaise,
        });
      }
    }

    if (calculatedSubtotalPaise <= 0 || resolvedItems.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order total calculated. Please verify cart items.' },
        { status: 400 },
      );
    }

    // 4. Validate & Apply Coupon Code
    let couponDiscountPaise = 0;
    let validatedCouponId: string | null = null;

    if (couponCode) {
      const couponResult = await validateCoupon({
        code: couponCode,
        subtotalPaise: calculatedSubtotalPaise,
        userId: session.userId,
        userEmail: session.email,
        bundleId,
        courseIds: resolvedItems.map((i) => i.courseId),
      });

      if (!couponResult.isValid) {
        return NextResponse.json({ error: couponResult.error }, { status: 400 });
      }

      couponDiscountPaise = couponResult.discountPaise;
      validatedCouponId = couponResult.coupon?.id ?? null;
    }

    // Current price after coupon deduction
    const priceAfterCoupon = Math.max(0, calculatedSubtotalPaise - couponDiscountPaise);

    // 5. Validate & Apply Referral Code (5% referee discount)
    let referralDiscountPaise = 0;
    let validatedReferrerId: string | null = null;
    let validatedReferralCode: string | null = null;

    if (referralCode) {
      const refResult = await validateReferralCode(referralCode, session.userId, session.email);
      if (!refResult.isValid) {
        return NextResponse.json({ error: refResult.error }, { status: 400 });
      }

      referralDiscountPaise = calculateRefereeDiscount(priceAfterCoupon);
      validatedReferrerId = refResult.referrerUser?.id ?? null;
      validatedReferralCode = referralCode.trim().toUpperCase();
    }

    // Current price after referral deduction
    const priceAfterReferral = Math.max(0, priceAfterCoupon - referralDiscountPaise);

    // 6. Validate & Apply Coin Redemption (Max 50 coins / ₹50 per order)
    let coinDiscountPaise = 0;
    let coinsRedeemed = 0;

    if (redeemCoins) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { walletBalance: true },
      });

      const userWalletBalance = user?.walletBalance ?? 0;
      const redemptionResult = calculateCoinRedemption(
        userWalletBalance,
        redeemCoins,
        priceAfterReferral,
      );

      coinDiscountPaise = redemptionResult.coinDiscountPaise;
      coinsRedeemed = redemptionResult.coinsRedeemed;
    }

    // 7. Calculate Total Discounts & Enforce Mandatory ₹1 (100 paise) Floor
    const totalDiscountPaise = couponDiscountPaise + referralDiscountPaise + coinDiscountPaise;
    const finalCalculatedPaise = calculatedSubtotalPaise - totalDiscountPaise;

    // Strict Floor Enforcement: Razorpay orders cannot be charged below 100 paise
    const finalTotalPaise = Math.max(MINIMUM_TRANSACTION_FLOOR_PAISE, finalCalculatedPaise);

    // 8. Create PENDING Order in Database first to obtain stable Order CUID
    const dbOrder = await prisma.order.create({
      data: {
        userId: session.userId,
        couponId: validatedCouponId,
        subtotalPaise: calculatedSubtotalPaise,
        discountPaise: totalDiscountPaise,
        totalPaise: finalTotalPaise,
        currency: 'INR',
        status: 'PENDING',
        items: {
          create: resolvedItems.map((item) => ({
            courseId: item.courseId,
            offeringId: item.offeringId,
            courseTitleSnapshot: item.courseTitle,
            offeringTitleSnapshot: item.offeringTitle,
            accessType: item.accessType,
            unitPricePaise: item.unitPricePaise,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 9. Create Upstream Razorpay Order
    let razorpayOrderId = `mock_order_${dbOrder.id}`;
    try {
      const rzpOrder = await createRazorpayOrder({
        amountPaise: finalTotalPaise,
        currency: 'INR',
        receipt: dbOrder.id,
        notes: {
          orderId: dbOrder.id,
          userId: session.userId,
          userEmail: session.email,
          referralCode: validatedReferralCode || '',
          referrerId: validatedReferrerId || '',
          coinsRedeemed: String(coinsRedeemed),
          couponCode: couponCode ? couponCode.trim().toUpperCase() : '',
          subtotalPaise: String(calculatedSubtotalPaise),
          totalDiscountPaise: String(totalDiscountPaise),
        },
      });
      razorpayOrderId = rzpOrder.id;
    } catch (rzpErr) {
      console.warn('[create-order] Razorpay API call failed or in mock mode:', rzpErr);
      if (process.env.NODE_ENV === 'production' && process.env.RAZORPAY_KEY_ID) {
        // Rollback order creation in production if upstream fails
        await prisma.order.delete({ where: { id: dbOrder.id } }).catch(() => null);
        throw rzpErr;
      }
    }

    // Update order with razorpayOrderId
    await prisma.order.update({
      where: { id: dbOrder.id },
      data: { razorpayOrderId },
    });

    // 10. Return secure order payload to frontend
    return NextResponse.json({
      success: true,
      orderId: dbOrder.id,
      razorpayOrderId,
      amountPaise: finalTotalPaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '',
      summary: {
        subtotalPaise: calculatedSubtotalPaise,
        couponDiscountPaise,
        referralDiscountPaise,
        coinDiscountPaise,
        totalDiscountPaise,
        finalTotalPaise,
        coinsRedeemed,
      },
    });
  } catch (error: any) {
    console.error('[create-order] Order creation failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create order. Please try again.' },
      { status: 500 },
    );
  }
}
