import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const validateCouponSchema = z.object({
  code: z.string().min(1),
  amount: z.number().int().min(0), // Amount in paise
});

// POST - Validate coupon code
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Ensure amount is an integer (convert if needed)
    if (body.amount !== undefined) {
      body.amount = Math.floor(Number(body.amount));
    }
    
    const validation = validateCouponSchema.safeParse(body);

    if (!validation.success) {
      console.error('Coupon validation schema error:', validation.error.issues);
      return NextResponse.json(
        { 
          error: validation.error.issues[0].message,
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { code, amount } = validation.data;
    
    console.log('Validating coupon:', { code, amount });

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 404 }
      );
    }

    // Check if active
    if (!coupon.isActive) {
      return NextResponse.json(
        { error: 'Coupon is not active' },
        { status: 400 }
      );
    }

    // Check validity dates
    // Compare dates at day level to avoid timezone issues
    const now = new Date();
    const validFromDate = new Date(coupon.validFrom);
    // Set both to start of day for comparison
    const nowStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const validFromStartOfDay = new Date(validFromDate.getFullYear(), validFromDate.getMonth(), validFromDate.getDate());
    
    if (validFromStartOfDay > nowStartOfDay) {
      return NextResponse.json(
        { error: 'Coupon is not yet valid' },
        { status: 400 }
      );
    }

    if (coupon.validUntil) {
      const validUntilDate = new Date(coupon.validUntil);
      const validUntilEndOfDay = new Date(validUntilDate.getFullYear(), validUntilDate.getMonth(), validUntilDate.getDate(), 23, 59, 59);
      
      if (validUntilEndOfDay < now) {
        return NextResponse.json(
          { error: 'Coupon has expired' },
          { status: 400 }
        );
      }
    }

    // Check minimum amount
    if (coupon.minAmount && amount < coupon.minAmount) {
      return NextResponse.json(
        { 
          error: `Minimum purchase amount is ₹${(coupon.minAmount / 100).toFixed(2)}`,
          minAmount: coupon.minAmount,
        },
        { status: 400 }
      );
    }

    // Check max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: 'Coupon has reached maximum usage limit' },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.floor((amount * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
      if (discountAmount > amount) {
        discountAmount = amount; // Can't discount more than the amount
      }
    }

    const finalAmount = amount - discountAmount;

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount,
      finalAmount,
      originalAmount: amount,
    });
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
