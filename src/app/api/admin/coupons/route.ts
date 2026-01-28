import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const couponSchema = z.object({
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().int().min(0),
  minAmount: z.number().int().optional(),
  maxDiscount: z.number().int().optional(),
  maxUses: z.number().int().optional(),
  validFrom: z.string().optional(), // Accept date string or ISO datetime
  validUntil: z.string().optional().nullable(), // Accept date string or ISO datetime
  isActive: z.boolean().optional(),
});

// GET - List all coupons
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ coupons });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

// POST - Create new coupon
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = couponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if coupon code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects
    // If it's just a date (YYYY-MM-DD), set to start of day in local timezone
    const validFromDate = data.validFrom 
      ? (() => {
          if (data.validFrom.includes('T')) {
            return new Date(data.validFrom);
          } else {
            // Parse YYYY-MM-DD and set to start of day in local timezone
            const [year, month, day] = data.validFrom.split('-').map(Number);
            return new Date(year, month - 1, day, 0, 0, 0, 0);
          }
        })()
      : new Date();
    const validUntilDate = data.validUntil 
      ? (() => {
          if (data.validUntil.includes('T')) {
            return new Date(data.validUntil);
          } else {
            // Parse YYYY-MM-DD and set to end of day in local timezone
            const [year, month, day] = data.validUntil.split('-').map(Number);
            return new Date(year, month - 1, day, 23, 59, 59, 999);
          }
        })()
      : null;

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minAmount: data.minAmount,
        maxDiscount: data.maxDiscount,
        maxUses: data.maxUses,
        validFrom: validFromDate,
        validUntil: validUntilDate,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
