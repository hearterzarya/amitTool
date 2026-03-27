import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { merchantReferenceId, transactionId } = body;

        if (!merchantReferenceId || !transactionId) {
            return NextResponse.json(
                { error: 'Merchant reference ID and Transaction ID are required' },
                { status: 400 }
            );
        }

        // Find payment
        const payment = await prisma.payment.findUnique({
            where: { merchantReferenceId },
        });

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        // Verify user owns this payment
        if (payment.userId !== (session.user as any).id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Update payment with transaction ID
        const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                transactionId: transactionId,
                status: 'PENDING', // Still pending until admin approval
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Payment details submitted for verification',
            payment: {
                id: updatedPayment.id,
                status: updatedPayment.status,
                merchantReferenceId: updatedPayment.merchantReferenceId,
                transactionId: updatedPayment.transactionId
            }
        });

    } catch (error: any) {
        console.error('Error submitting payment verification:', error);

        // Handle unique constraint error for transaction ID
        if (error.code === 'P2002' && error.meta?.target?.includes('transactionId')) {
            return NextResponse.json(
                { error: 'This Transaction ID has already been used. Please check or contact support.' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to submit payment details' },
            { status: 500 }
        );
    }
}
