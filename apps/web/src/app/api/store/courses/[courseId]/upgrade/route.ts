/**
 * Course Upgrade Order API
 * Module: Commercial Store (src/app/api/store/courses/[courseId]/upgrade/route.ts)
 *
 * Allows students with an active RECORDED enrollment to upgrade to the interactive LIVE batch
 * by paying the prorated or configured upgrade delta price.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRazorpayOrder } from '@/lib/razorpay';
import { MINIMUM_TRANSACTION_FLOOR_PAISE } from '@/lib/referral';

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to upgrade your course.' },
        { status: 401 },
      );
    }

    const { courseId } = params;
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 });
    }

    // 1. Fetch course details and offerings
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        offerings: {
          where: { isActive: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    // 2. Verify student's current enrollment status
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.userId,
        courseId,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!existingEnrollment) {
      return NextResponse.json(
        { error: 'You do not have an active enrollment in this course to upgrade.' },
        { status: 400 },
      );
    }

    if (existingEnrollment.accessType === 'LIVE') {
      return NextResponse.json(
        { error: 'You already possess active Live batch access for this course.' },
        { status: 400 },
      );
    }

    // 3. Find Live Offering
    const liveOffering = course.offerings.find((o) => o.accessType === 'LIVE');
    const recordedOffering = course.offerings.find((o) => o.accessType === 'RECORDED');

    // 4. Calculate upgrade price (liveUpgradePrice field or price difference)
    let upgradePricePaise = course.liveUpgradePrice;

    if (!upgradePricePaise || upgradePricePaise <= 0) {
      if (liveOffering && recordedOffering) {
        upgradePricePaise = Math.max(
          MINIMUM_TRANSACTION_FLOOR_PAISE,
          liveOffering.pricePaise - recordedOffering.pricePaise,
        );
      } else if (liveOffering) {
        upgradePricePaise = liveOffering.pricePaise;
      } else {
        upgradePricePaise = 99900; // Default ₹999 upgrade fallback
      }
    }

    // Enforce minimum floor
    const finalUpgradePricePaise = Math.max(MINIMUM_TRANSACTION_FLOOR_PAISE, upgradePricePaise);

    // 5. Create PENDING upgrade Order in DB
    const dbOrder = await prisma.order.create({
      data: {
        userId: session.userId,
        subtotalPaise: finalUpgradePricePaise,
        discountPaise: 0,
        totalPaise: finalUpgradePricePaise,
        currency: 'INR',
        status: 'PENDING',
        items: {
          create: [
            {
              courseId: course.id,
              offeringId: liveOffering?.id ?? null,
              courseTitleSnapshot: course.title,
              offeringTitleSnapshot: `Live Batch Upgrade: ${course.title}`,
              accessType: 'LIVE',
              unitPricePaise: finalUpgradePricePaise,
            },
          ],
        },
      },
    });

    // 6. Create Razorpay order
    let razorpayOrderId = `mock_upgrade_${dbOrder.id}`;
    try {
      const rzpOrder = await createRazorpayOrder({
        amountPaise: finalUpgradePricePaise,
        currency: 'INR',
        receipt: dbOrder.id,
        notes: {
          orderId: dbOrder.id,
          userId: session.userId,
          courseId: course.id,
          upgradeType: 'RECORDED_TO_LIVE',
        },
      });
      razorpayOrderId = rzpOrder.id;
    } catch (err) {
      console.warn('[upgrade] Razorpay order creation in mock mode:', err);
    }

    await prisma.order.update({
      where: { id: dbOrder.id },
      data: { razorpayOrderId },
    });

    return NextResponse.json({
      success: true,
      orderId: dbOrder.id,
      razorpayOrderId,
      amountPaise: finalUpgradePricePaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '',
      course: {
        id: course.id,
        title: course.title,
        upgradeTo: 'LIVE',
      },
    });
  } catch (error: any) {
    console.error('[upgrade] Course upgrade order creation failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate course upgrade.' },
      { status: 500 },
    );
  }
}
