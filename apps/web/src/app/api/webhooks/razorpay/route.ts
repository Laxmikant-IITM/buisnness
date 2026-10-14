/**
 * Razorpay Webhook Ingestion API
 * Module: Commercial Payments (src/app/api/webhooks/razorpay/route.ts)
 *
 * Provides idempotent, asynchronous event processing for Razorpay webhooks:
 * 1. Cryptographically verifies incoming request signatures via HMAC-SHA256 (x-razorpay-signature).
 * 2. Deduplicates events using PaymentEvent unique provider ID index.
 * 3. Handles `payment.captured` and `order.paid`:
 *    - Settles the order to PAID if not already marked.
 *    - Automatically grants course enrollments (RECORDED, LIVE, etc.).
 *    - Records coupon usage and updates referral reward balances.
 * 4. Handles `payment.failed`:
 *    - Updates pending orders to FAILED and records audit diagnostics.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';
import {
  calculateReferrerReward,
  checkMilestoneBonus,
  getUpdatedQuarterlyStats,
} from '@/lib/referral';

export async function POST(request: Request) {
  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body.' }, { status: 400 });
  }

  const signature = request.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing x-razorpay-signature header.' }, { status: 400 });
  }

  // 1. Verify HMAC-SHA256 Signature
  const isValid = verifyWebhookSignature({
    rawBody,
    signature,
  });

  const isBypass =
    process.env.NODE_ENV !== 'production' && !process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!isValid && !isBypass) {
    console.error('[razorpay-webhook] Cryptographic signature mismatch.');
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  // 2. Parse Event JSON
  let eventPayload: any;
  try {
    eventPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const eventType = eventPayload.event;
  const eventId =
    eventPayload.event_id ||
    eventPayload.id ||
    eventPayload.payload?.payment?.entity?.id ||
    `evt_${Date.now()}`;

  // 3. Idempotency Check with PaymentEvent
  const existingEvent = await prisma.paymentEvent.findUnique({
    where: { providerEventId: eventId },
  });

  if (existingEvent && existingEvent.processedAt) {
    return NextResponse.json({ status: 'already_processed', eventId });
  }

  const now = new Date();

  // Create or register initial PaymentEvent
  const paymentEventRecord = await prisma.paymentEvent.upsert({
    where: { providerEventId: eventId },
    create: {
      providerEventId: eventId,
      eventType: eventType || 'unknown',
      receivedAt: now,
    },
    update: {},
  });

  try {
    // 4. Handle Payment Captured or Order Paid
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = eventPayload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        const order = await prisma.order.findUnique({
          where: { razorpayOrderId },
          include: {
            items: { include: { offering: true } },
            user: true,
          },
        });

        if (order && order.status !== 'PAID') {
          await prisma.$transaction(async (tx) => {
            // Settle Order
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: 'PAID',
                razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
              },
            });

            // Grant active Enrollments
            for (const item of order.items) {
              const durationDays = item.offering?.durationDays;
              const expiresAt = durationDays
                ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
                : null;

              await tx.enrollment.upsert({
                where: {
                  userId_courseId_accessType: {
                    userId: order.userId,
                    courseId: item.courseId,
                    accessType: item.accessType,
                  },
                },
                create: {
                  userId: order.userId,
                  courseId: item.courseId,
                  offeringId: item.offeringId,
                  accessType: item.accessType,
                  status: 'ACTIVE',
                  startsAt: now,
                  expiresAt,
                },
                update: {
                  status: 'ACTIVE',
                  offeringId: item.offeringId,
                  expiresAt,
                },
              });
            }

            // Coupon usage
            if (order.couponId) {
              const exists = await tx.couponUsage.findUnique({
                where: { orderId: order.id },
              });
              if (!exists) {
                await tx.couponUsage.create({
                  data: {
                    couponId: order.couponId,
                    userId: order.userId,
                    orderId: order.id,
                    usedAt: now,
                  },
                });
                await tx.coupon.update({
                  where: { id: order.couponId },
                  data: { currentUses: { increment: 1 } },
                });
              }
            }

            // Inspect notes for referral & coins
            const notes = paymentEntity?.notes || {};
            const refCode = notes.referralCode ? String(notes.referralCode).trim().toUpperCase() : null;
            const coinsRedeemed = notes.coinsRedeemed ? Number(notes.coinsRedeemed) : 0;

            if (refCode) {
              const referrer = await tx.user.findUnique({
                where: { referralCode: refCode },
              });
              if (referrer && referrer.id !== order.userId) {
                const reward = calculateReferrerReward(order.totalPaise);
                const qStats = getUpdatedQuarterlyStats({
                  quarterlyReferrals: referrer.quarterlyReferrals,
                  quarterStartDate: referrer.quarterStartDate,
                });
                const newLifetime = referrer.lifetimeReferrals + 1;
                const newQuarterly = qStats.quarterlyReferrals + 1;
                const milestone = await checkMilestoneBonus(referrer.lifetimeReferrals, newLifetime);

                await tx.referralTransaction.create({
                  data: {
                    referrerEmail: referrer.email,
                    buyerEmail: order.user.email,
                    referralCode: refCode,
                    orderId: order.id,
                    originalPrice: order.subtotalPaise,
                    buyerDiscount: order.discountPaise,
                    finalPrice: order.totalPaise,
                    referrerReward: reward,
                    coinsUsed: coinsRedeemed,
                    createdAt: now,
                  },
                });

                await tx.user.update({
                  where: { id: referrer.id },
                  data: {
                    walletBalance: { increment: reward + milestone.bonusCoins },
                    lifetimeReferrals: newLifetime,
                    quarterlyReferrals: newQuarterly,
                    quarterStartDate: qStats.quarterStartDate,
                  },
                });
              }
            }

            // Deduct redeemed coins
            if (coinsRedeemed > 0) {
              await tx.user.update({
                where: { id: order.userId },
                data: { walletBalance: { decrement: coinsRedeemed } },
              });
            }

            // Activity Log
            await tx.activityLog.create({
              data: {
                userId: order.userId,
                action: 'WEBHOOK_PAYMENT_CAPTURED',
                entity: 'Order',
                entityId: order.id,
                details: {
                  eventId,
                  razorpayPaymentId,
                  totalPaise: order.totalPaise,
                },
                createdAt: now,
              },
            });

            // Outbox Event
            await tx.outboxEvent.create({
              data: {
                eventType: 'PAYMENT_RECEIPT_EMAIL',
                payload: {
                  orderId: order.id,
                  userId: order.userId,
                  email: order.user.email,
                  amountPaise: order.totalPaise,
                },
                status: 'PENDING',
                availableAt: now,
              },
            });
          });
        }
      }
    } else if (eventType === 'payment.failed') {
      // 5. Handle Payment Failed
      const paymentEntity = eventPayload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const errorDescription = paymentEntity?.error_description || 'Payment capture failed';

      if (razorpayOrderId) {
        await prisma.order.updateMany({
          where: {
            razorpayOrderId,
            status: 'PENDING',
          },
          data: {
            status: 'FAILED',
          },
        });
      }

      await prisma.paymentEvent.update({
        where: { id: paymentEventRecord.id },
        data: {
          processingError: errorDescription,
        },
      });
    }

    // Mark event processed
    await prisma.paymentEvent.update({
      where: { id: paymentEventRecord.id },
      data: {
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true, eventId, status: 'processed' });
  } catch (procErr: any) {
    console.error('[razorpay-webhook] Processing error:', procErr);
    await prisma.paymentEvent.update({
      where: { id: paymentEventRecord.id },
      data: {
        processingError: procErr?.message || 'Unknown processing error',
      },
    }).catch(() => null);

    return NextResponse.json(
      { error: 'Webhook processing error', details: procErr?.message },
      { status: 500 },
    );
  }
}
