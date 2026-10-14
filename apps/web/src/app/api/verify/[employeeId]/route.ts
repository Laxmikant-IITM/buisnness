/**
 * Public Employee & Educator Verification API
 * Module: Staff & Credentials
 * 
 * Allows students, employers, and partner institutions to verify
 * the authenticity and active credentials of GenZ IITian instructors,
 * teaching assistants, and staff members.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: {
    employeeId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const rawId = params.employeeId?.trim();

    if (!rawId) {
      return NextResponse.json(
        { error: 'Employee or Certificate ID is required' },
        { status: 400 }
      );
    }

    // Lookup employee by unique employeeId (e.g. GZ-EDU-102)
    const employee = await prisma.employee.findUnique({
      where: { employeeId: rawId },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        department: true,
        role: true,
        tenure: true,
        status: true,
        photoUrl: true,
        createdAt: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { verified: false, error: 'No credential record found matching this ID' },
        { status: 404 }
      );
    }

    // Log the public verification audit event asynchronously
    await prisma.employeeLog.create({
      data: {
        employeeId: employee.id,
        actorEmail: 'public-verification-portal',
        actionType: 'VERIFY',
        details: JSON.stringify({
          queriedAt: new Date().toISOString(),
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        }),
      },
    }).catch((err) => {
      console.error('[EmployeeVerification] Audit logging failed:', err);
    });

    return NextResponse.json({
      verified: true,
      employee: {
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        department: employee.department,
        role: employee.role,
        tenure: employee.tenure,
        status: employee.status,
        photoUrl: employee.photoUrl,
        issueDate: employee.createdAt,
      },
    });
  } catch (error) {
    console.error('[EmployeeVerification] Lookup failed:', error);
    return NextResponse.json(
      { error: 'Internal verification service error' },
      { status: 500 }
    );
  }
}
