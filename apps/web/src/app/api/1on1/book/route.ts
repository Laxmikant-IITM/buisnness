/**
 * One-on-One Tutoring & Mentorship Booking API
 * Module: Tutoring & Mentorship (src/app/api/1on1/book/route.ts)
 *
 * Handles student appointment bookings for dedicated 1:1 doubt-clearing and mentorship sessions.
 * Enforces a strict daily limit of 3 active bookings per student email to prevent slot hoarding,
 * persists the reservation into OneOnOneBooking, and logs the appointment to ActivityLog.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const Book1on1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  level: z.string().min(1, 'Academic level is required'),
  subjects: z.array(z.string()).min(1, 'Please select at least one subject'),
  slotDate: z.string().min(1, 'Slot date is required (YYYY-MM-DD)'),
  slotTime: z.string().min(1, 'Slot time is required'),
  plan: z.string().min(1, 'Mentorship plan is required'),
  notes: z.string().optional(),
  userNotes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json().catch(() => ({}));
    const parseResult = Book1on1Schema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid booking details.', details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const {
      name,
      email,
      phone,
      level,
      subjects,
      slotDate,
      slotTime,
      plan,
      notes,
      userNotes,
    } = parseResult.data;

    const normalizedEmail = email.trim().toLowerCase();

    // Parse date and construct UTC boundaries for the day
    const bookingDate = new Date(slotDate);
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json({ error: 'Invalid slot date format.' }, { status: 400 });
    }

    // Ensure slot date is not in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (bookingDate < now) {
      return NextResponse.json(
        { error: 'Cannot book appointments for past dates.' },
        { status: 400 },
      );
    }

    const dayStart = new Date(bookingDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(bookingDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    // Enforce 3 booking daily limit per student
    const existingBookingsCount = await prisma.oneOnOneBooking.count({
      where: {
        email: normalizedEmail,
        slotDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: { not: 'CANCELLED' },
      },
    });

    if (existingBookingsCount >= 3) {
      return NextResponse.json(
        {
          error:
            'You have reached the daily limit of 3 one-on-one sessions for this date. Please select another day.',
        },
        { status: 429 },
      );
    }

    // Check if slot time on that day is already reserved
    const slotConflict = await prisma.oneOnOneBooking.findFirst({
      where: {
        slotDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        slotTime,
        status: 'CONFIRMED',
      },
    });

    if (slotConflict) {
      return NextResponse.json(
        { error: `The ${slotTime} slot on this date is already booked. Please choose an alternate slot.` },
        { status: 409 },
      );
    }

    // Persist booking record
    const booking = await prisma.oneOnOneBooking.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        level: level.trim(),
        subjects,
        slotDate: bookingDate,
        slotTime: slotTime.trim(),
        plan: plan.trim(),
        notes: notes?.trim() || null,
        userNotes: userNotes?.trim() || null,
        status: 'CONFIRMED',
        userId: session?.userId || null,
      },
    });

    // Log to ActivityLog
    await prisma.activityLog.create({
      data: {
        userId: session?.userId || null,
        action: 'ONE_ON_ONE_BOOKED',
        entity: 'OneOnOneBooking',
        entityId: booking.id,
        details: {
          slotDate: slotDate,
          slotTime: slotTime,
          plan: plan,
          subjects: subjects,
          email: normalizedEmail,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'One-on-one session confirmed successfully.',
      booking: {
        id: booking.id,
        name: booking.name,
        email: booking.email,
        level: booking.level,
        subjects: booking.subjects,
        slotDate: booking.slotDate.toISOString().split('T')[0],
        slotTime: booking.slotTime,
        plan: booking.plan,
        status: booking.status,
      },
    });
  } catch (error: any) {
    console.error('[book-1on1] Error creating booking:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to complete appointment booking.' },
      { status: 500 },
    );
  }
}
