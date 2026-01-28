import { sendEmail, generateOrderConfirmationEmailHtml, generateBundleOrderConfirmationEmailHtml } from './email';
import { prisma } from './prisma';
import { brand } from './brand';

/**
 * Send order confirmation email after successful payment
 */
export async function sendOrderConfirmationEmail(paymentId: string): Promise<void> {
  try {
    // Fetch payment with all related data
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        tool: true,
        bundle: {
          include: {
            tools: {
              include: {
                tool: true,
              },
            },
          },
        },
      },
    });

    if (!payment || !payment.user) {
      console.error('Payment or user not found for order confirmation email');
      return;
    }

    // Only send email for successful payments
    if (payment.status !== 'SUCCESS') {
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      brand.websiteUrl;
    const dashboardUrl = `${baseUrl}/dashboard`;

    const customerName = payment.user.name || payment.user.email.split('@')[0];
    const orderNumber = payment.merchantReferenceId;
    const amount = payment.amount;
    const paymentDate = payment.successDate || payment.createdAt;

    if (payment.toolId && payment.tool) {
      // Single tool purchase
      const planType = (payment.planType || 'SHARED') as 'SHARED' | 'PRIVATE';
      
      // Get subscription details if available
      const subscription = await prisma.toolSubscription.findFirst({
        where: {
          userId: payment.userId,
          toolId: payment.toolId,
        },
        include: {
          sharedCredentials: true,
          privateCredentials: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const activationStatus = subscription?.activationStatus || 'PENDING';
      let credentials: { email: string; password: string } | undefined;

      if (subscription && activationStatus === 'ACTIVE') {
        if (planType === 'SHARED' && subscription.sharedCredentials) {
          const password = subscription.sharedCredentials.password;
          // Only include credentials if they're not placeholders
          if (password && !password.includes('PLACEHOLDER') && !password.includes('@example.com')) {
            credentials = {
              email: subscription.sharedCredentials.email,
              password: password, // May be encrypted - will be shown as-is
            };
          }
        } else if (planType === 'PRIVATE' && subscription.privateCredentials) {
          const password = subscription.privateCredentials.password;
          // Only include credentials if they're not placeholders
          if (password && !password.includes('PLACEHOLDER')) {
            credentials = {
              email: subscription.privateCredentials.email,
              password: password, // May be encrypted - will be shown as-is
            };
          }
        }
      }

      await sendEmail({
        to: payment.user.email,
        subject: `Order Confirmation - ${payment.tool.name}`,
        html: generateOrderConfirmationEmailHtml({
          customerName,
          orderNumber,
          toolName: payment.tool.name,
          planType,
          amount,
          paymentDate,
          activationStatus: activationStatus as 'ACTIVE' | 'PENDING',
          credentials,
          dashboardUrl,
        }),
      });
    } else if (payment.bundleId && payment.bundle) {
      // Bundle purchase
      const tools = payment.bundle.tools.map(bt => ({
        name: bt.tool.name,
      }));

      await sendEmail({
        to: payment.user.email,
        subject: `Bundle Order Confirmation - ${payment.bundle.name}`,
        html: generateBundleOrderConfirmationEmailHtml({
          customerName,
          orderNumber,
          bundleName: payment.bundle.name,
          tools,
          planName: payment.planName || 'Monthly Plan',
          amount,
          paymentDate,
          dashboardUrl,
        }),
      });
    }
  } catch (error: any) {
    // Don't fail payment processing if email fails
    // Log error with context for debugging
    console.error('Failed to send order confirmation email:', {
      paymentId,
      error: error.message,
      emailProvider: process.env.EMAIL_PROVIDER || 'resend',
      hasResendKey: !!process.env.RESEND_API_KEY,
      // Don't log the actual API key
    });
    
    // In production, you might want to send this to an error tracking service
    // For now, we just log and continue
  }
}
