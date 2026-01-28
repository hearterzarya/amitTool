import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.number().int().min(0).optional(),
  minAmount: z.number().int().optional(),
  maxDiscount: z.number().int().optional(),
  maxUses: z.number().int().optional(),
  validFrom: z.string().optional(), // Accept date string or ISO datetime
  validUntil: z.string().optional().nullable(), // Accept date string or ISO datetime
  isActive: z.boolean().optional(),
});

// PUT - Update coupon
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: any = {};

    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.minAmount !== undefined) updateData.minAmount = data.minAmount;
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.validFrom !== undefined) {
      // Convert date string to Date object (handle both date-only and ISO datetime)
      if (data.validFrom.includes('T')) {
        updateData.validFrom = new Date(data.validFrom);
      } else {
        // Parse YYYY-MM-DD and set to start of day in local timezone
        const [year, month, day] = data.validFrom.split('-').map(Number);
        updateData.validFrom = new Date(year, month - 1, day, 0, 0, 0, 0);
      }
    }
    if (data.validUntil !== undefined) {
      // Convert date string to Date object (handle both date-only and ISO datetime)
      if (data.validUntil) {
        if (data.validUntil.includes('T')) {
          updateData.validUntil = new Date(data.validUntil);
        } else {
          // Parse YYYY-MM-DD and set to end of day in local timezone
          const [year, month, day] = data.validUntil.split('-').map(Number);
          updateData.validUntil = new Date(year, month - 1, day, 23, 59, 59, 999);
        }
      } else {
        updateData.validUntil = null;
      }
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ coupon });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

// DELETE - Delete coupon
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
