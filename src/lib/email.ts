import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { formatPrice } from '@/lib/utils';
import { brand } from '@/lib/brand';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using configured provider (Resend or SMTP)
 * In development, if email provider is not configured, logs OTP to console
 */
// Helper to check if Resend API is properly configured
function isResendConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY;
  return !!(
    apiKey && 
    apiKey.trim() !== '' && 
    apiKey.startsWith('re_') &&
    !apiKey.includes('your_api_key') &&
    !apiKey.includes('placeholder')
  );
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER || 'resend';
  const fromEmail = process.env.EMAIL_FROM || brand.supportEmail;
  const fromName = process.env.EMAIL_FROM_NAME || brand.name;
  const isDevelopment = process.env.NODE_ENV === 'development';

  try {
    if (provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      
      // Check if Resend is properly configured
      if (!isResendConfigured()) {
        // Try SMTP fallback if configured
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          console.warn('⚠️  Resend not configured. Falling back to SMTP...');
          await sendViaSMTP({ to, subject, html, text, from: `${fromName} <${fromEmail}>` });
          if (isDevelopment) {
            console.log(`✓ Email sent via SMTP to ${to}: ${subject}`);
          }
          return;
        }
        // In development, log to console as fallback
        if (isDevelopment) {
          console.warn('⚠️  RESEND_API_KEY not configured. Logging email to console instead.');
          logEmailToConsole({ to, subject, html });
          return;
        }
        // In production, throw error to ensure proper configuration
        throw new Error('RESEND_API_KEY is not configured. Please set RESEND_API_KEY environment variable.');
      }
      
      // Use the 'from' email with optional name format
      // Resend supports: "Name <email@domain.com>" or just "email@domain.com"
      const fromAddress = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
      await sendViaResend({ to, subject, html, text, from: fromAddress });
    } else if (provider === 'smtp') {
      const host = process.env.SMTP_HOST;
      const user = process.env.SMTP_USER;
      
      // Development fallback: if SMTP is not configured, log to console
      if (isDevelopment && (!host || !user)) {
        console.warn('⚠️  SMTP not configured. Logging email to console instead.');
        logEmailToConsole({ to, subject, html });
        return;
      }
      
      await sendViaSMTP({ to, subject, html, text, from: `${fromName} <${fromEmail}>` });
    } else {
      throw new Error(`Unknown email provider: ${provider}`);
    }

    // Log success (server-side only, no secrets)
    if (isDevelopment) {
      console.log(`✓ Email sent to ${to}: ${subject}`);
    }
  } catch (error: any) {
    console.error('Email sending error:', error.message);
    
    // Auto-fallback to SMTP if Resend fails due to testing mode or domain issues
    if (provider === 'resend' && (error.message?.includes('testing emails') || error.message?.includes('domain') || error.statusCode === 403)) {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.warn('⚠️  Resend failed. Automatically falling back to SMTP...');
        try {
          await sendViaSMTP({ to, subject, html, text, from: `${fromName} <${fromEmail}>` });
          if (isDevelopment) {
            console.log(`✓ Email sent via SMTP fallback to ${to}: ${subject}`);
          } else {
            console.log(`✓ Email sent via SMTP fallback`);
          }
          return; // Success with SMTP fallback - don't throw error
        } catch (smtpError: any) {
          console.error('SMTP fallback also failed:', smtpError.message);
          // Continue to console logging fallback
        }
      } else {
        console.warn('⚠️  SMTP not configured. Cannot fallback from Resend.');
      }
    }
    
    // In development, if email fails, try to extract and log OTP for testing
    if (isDevelopment) {
      console.warn('⚠️  Email sending failed. Attempting to log OTP to console for testing...');
      try {
        logEmailToConsole({ to, subject, html });
        console.log('✓ OTP logged to console above. Registration will continue.');
        return; // Don't throw error in dev mode if we logged to console
      } catch (logError) {
        // If logging fails, continue with error
      }
    }
    
    // In production, provide helpful error messages
    if (error.message?.includes('RESEND_API_KEY')) {
      throw new Error('Email service is not configured. Please contact support.');
    }
    if (error.message?.includes('domain')) {
      throw new Error('Email domain not verified. Please contact support.');
    }
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('Email service temporarily unavailable. Please try again later.');
    }
    
    // Generic error for production
    throw new Error('Failed to send email. Please try again later.');
  }
}

/**
 * Log email content to console (development only)
 */
function logEmailToConsole({ to, subject, html }: { to: string; subject: string; html: string }): void {
  // Extract OTP code from HTML if it's an OTP email
  const otpMatch = html.match(/(\d{6})/);
  const otpCode = otpMatch ? otpMatch[1] : null;
  
  // Extract reset link if it's a password reset email
  const resetLinkMatch = html.match(/href="([^"]*reset-password[^"]*)"/);
  const resetLink = resetLinkMatch ? resetLinkMatch[1] : null;
  
  console.log('\n' + '='.repeat(60));
  console.log('📧 EMAIL (Development Mode - Not Actually Sent)');
  console.log('='.repeat(60));
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  if (otpCode) {
    console.log(`\n🔐 OTP CODE: ${otpCode}`);
    console.log('   (Use this code to verify email)');
  }
  if (resetLink) {
    console.log(`\n🔗 Reset Link: ${resetLink}`);
  }
  console.log('='.repeat(60) + '\n');
}

/**
 * Send email via Resend
 */
async function sendViaResend({
  to,
  subject,
  html,
  text,
  from,
}: SendEmailOptions & { from: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  
  // Validate API key format
  if (!apiKey || !apiKey.trim() || !apiKey.startsWith('re_')) {
    throw new Error('RESEND_API_KEY is invalid. It must start with "re_"');
  }

  const resend = new Resend(apiKey.trim());

  const { error, data } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text fallback
  });

  if (error) {
    console.error('Resend API error:', error);
    
    // Create error object with statusCode for fallback detection
    const resendError: any = new Error(error.message || 'Failed to send email');
    resendError.statusCode = error.statusCode;
    resendError.name = error.name;
    resendError.message = error.message;
    
    // Provide more helpful error messages
    if (error.statusCode === 403 && error.message?.includes('testing emails')) {
      const allowedEmail = error.message.match(/\(([^)]+)\)/)?.[1] || 'your verified email';
      resendError.message = `Resend is in testing mode. You can only send emails to ${allowedEmail}. To send to other recipients:\n1. Go to resend.com/domains and verify your domain\n2. Update EMAIL_FROM in .env.local to use your verified domain\n3. Restart your development server`;
    } else if (error.message?.includes('domain') || error.message?.includes('verify')) {
      resendError.message = 'Email domain not verified. Please verify your domain in Resend dashboard at resend.com/domains.';
    } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      resendError.message = 'Email sending quota exceeded. Please check your Resend account limits.';
    }
    
    throw resendError; // Throw error with statusCode for fallback detection
  }

  // Log email ID for debugging (both dev and prod, but only ID, no secrets)
  if (data?.id) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✓ Email sent successfully. Resend ID: ${data.id}`);
    }
    // In production, you might want to log to a monitoring service
  }
}

/**
 * Send email via SMTP
 */
async function sendViaSMTP({
  to,
  subject,
  html,
  text,
  from,
}: SendEmailOptions & { from: string }): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is incomplete. Please check SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local');
  }

  // Remove spaces from password if present (Gmail app passwords sometimes have spaces)
  const cleanPass = pass.replace(/\s/g, '');

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    auth: {
      user: user,
      pass: cleanPass,
    },
  });

  // Verify connection before sending
  try {
    await transporter.verify();
  } catch (verifyError: any) {
    console.error('SMTP connection verification failed:', verifyError.message);
    throw new Error(`SMTP connection failed: ${verifyError.message}`);
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  });

  // Log success
  if (process.env.NODE_ENV === 'development') {
    console.log(`✓ SMTP email sent successfully. Message ID: ${info.messageId}`);
  }
}

/**
 * Generate OTP email HTML template
 */
export function generateOtpEmailHtml(code: string, purpose: 'verification' | 'login' = 'verification'): string {
  const title = purpose === 'verification' 
    ? 'Verify Your Email Address' 
    : 'Your Login Code';
  
  const message = purpose === 'verification'
    ? 'Please use this code to verify your email address and complete your registration.'
    : 'Use this code to sign in to your account.';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${brand.name}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">${title}</h2>
    
    <p style="color: #4b5563; font-size: 16px; margin-bottom: 30px;">
      ${message}
    </p>
    
    <div style="background: #f3f4f6; border: 2px dashed #9ca3af; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
        ${code}
      </div>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      This code will expire in <strong>10 minutes</strong>.
    </p>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      If you didn't request this code, please ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ${brand.name}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate order confirmation email HTML template for tool purchase
 */
export function generateOrderConfirmationEmailHtml({
  customerName,
  orderNumber,
  toolName,
  planType,
  amount,
  paymentDate,
  activationStatus,
  credentials,
  dashboardUrl,
}: {
  customerName: string;
  orderNumber: string;
  toolName: string;
  planType: 'SHARED' | 'PRIVATE';
  amount: number;
  paymentDate: Date;
  activationStatus?: 'ACTIVE' | 'PENDING';
  credentials?: { email: string; password: string };
  dashboardUrl: string;
}): string {
  // Use formatPrice for consistent INR formatting across the application
  const amountInRupees = formatPrice(amount);
  const formattedDate = paymentDate.toLocaleString('en-IN', { 
    dateStyle: 'long', 
    timeStyle: 'short' 
  });

  const isActive = activationStatus === 'ACTIVE';
  const isShared = planType === 'SHARED';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${toolName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${brand.name}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">Order Confirmation</h2>
    
    <p style="color: #4b5563; font-size: 16px;">
      Hi ${customerName || 'Customer'},
    </p>
    
    <p style="color: #4b5563; font-size: 16px;">
      Thank you for your purchase! Your order has been confirmed and payment received successfully.
    </p>
    
    <!-- Order Details -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #1f2937; margin-top: 0; font-size: 18px; margin-bottom: 15px;">Order Details</h3>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px;">Order Number:</span>
        <span style="color: #1f2937; font-weight: 600; font-size: 14px; margin-left: 8px;">${orderNumber}</span>
      </div>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px;">Tool:</span>
        <span style="color: #1f2937; font-weight: 600; font-size: 14px; margin-left: 8px;">${toolName}</span>
      </div>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px;">Plan Type:</span>
        <span style="color: #1f2937; font-weight: 600; font-size: 14px; margin-left: 8px;">${isShared ? 'Shared Plan' : 'Private Plan'}</span>
      </div>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px;">Amount Paid:</span>
        <span style="color: #1f2937; font-weight: 600; font-size: 14px; margin-left: 8px;">${amountInRupees}</span>
      </div>
      
      <div>
        <span style="color: #6b7280; font-size: 14px;">Payment Date:</span>
        <span style="color: #1f2937; font-weight: 600; font-size: 14px; margin-left: 8px;">${formattedDate}</span>
      </div>
    </div>

    ${isActive && credentials ? `
    <!-- Active Subscription with Credentials -->
    <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span style="background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-right: 10px;">ACTIVE</span>
        <h3 style="color: #166534; margin: 0; font-size: 18px;">Your Subscription is Active!</h3>
      </div>
      
      <p style="color: #166534; font-size: 14px; margin-bottom: 15px;">
        Your ${isShared ? 'shared' : 'private'} plan is now active. Use the credentials below to access your tool:
      </p>
      
      <div style="background: white; border: 1px solid #86efac; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
        <div style="margin-bottom: 10px;">
          <span style="color: #6b7280; font-size: 12px; display: block; margin-bottom: 4px;">Email:</span>
          <span style="color: #1f2937; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 600;">${credentials.email}</span>
        </div>
        <div>
          <span style="color: #6b7280; font-size: 12px; display: block; margin-bottom: 4px;">Password:</span>
          <span style="color: #1f2937; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 600;">${credentials.password}</span>
        </div>
      </div>
      
      ${isShared ? `
      <p style="color: #dc2626; font-size: 12px; margin: 0; padding: 10px; background: #fef2f2; border-radius: 4px;">
        ⚠️ <strong>Important:</strong> This is a shared account (4-5 users). Keep your credentials secure and do not share them publicly.
      </p>
      ` : ''}
    </div>
    ` : !isActive ? `
    <!-- Pending Activation -->
    <div style="background: #fffbeb; border: 2px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-right: 10px;">PENDING</span>
        <h3 style="color: #92400e; margin: 0; font-size: 18px;">Activation Pending</h3>
      </div>
      
      <p style="color: #92400e; font-size: 14px; margin-bottom: 15px;">
        Your Private Plan purchase is confirmed! Your subscription will be activated by our team shortly.
      </p>
      
      <div style="background: white; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px;">
        <p style="color: #78350f; font-size: 13px; margin: 0 0 10px 0; font-weight: 600;">What happens next?</p>
        <ul style="color: #78350f; font-size: 13px; margin: 0; padding-left: 20px;">
          <li>Our team will review your purchase</li>
          <li>You'll receive activation confirmation via email</li>
          <li>Private credentials will be assigned to your account</li>
          <li>You'll get instant access once activated</li>
        </ul>
      </div>
      
      <div style="margin-top: 15px; text-align: center;">
        <a href="https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent(`Hi! I just purchased a Private Plan. Order: ${orderNumber}`)}" 
           style="display: inline-block; background: #25D366; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Contact Support on WhatsApp
        </a>
      </div>
    </div>
    ` : ''}

    <!-- Action Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View My Dashboard
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      If you have any questions or need assistance, please contact our support team via WhatsApp or email.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ${brand.name}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate order confirmation email HTML template for bundle purchase
 */
export function generateBundleOrderConfirmationEmailHtml({
  customerName,
  orderNumber,
  bundleName,
  tools,
  planName,
  amount,
  paymentDate,
  dashboardUrl,
}: {
  customerName: string;
  orderNumber: string;
  bundleName: string;
  tools: Array<{ name: string }>;
  planName: string;
  amount: number;
  paymentDate: Date;
  dashboardUrl: string;
}): string {
  // Use formatPrice for consistent INR formatting across the application
  const amountInRupees = formatPrice(amount);
  const formattedDate = paymentDate.toLocaleString('en-IN', { 
    dateStyle: 'long', 
    timeStyle: 'short' 
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle Order Confirmation - ${bundleName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${brand.name}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">Bundle Order Confirmation</h2>
    
    <p style="color: #4b5563; font-size: 16px;">
      Hi ${customerName || 'Customer'},
    </p>
    
    <p style="color: #4b5563; font-size: 16px;">
      Thank you for your purchase! Your bundle order has been confirmed and payment received successfully.
    </p>
    
    <!-- Order Details -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #1f2937; margin-top: 0; font-size: 18px; margin-bottom: 15px;">Order Details</h3>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px;">Order Number:</span>
        <span style="color: #1f2937; font-weight: 600; font-size: 14px; margin-left: 8px;">${orderNumber}</span>
      </div>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px;">Bundle:</span>
        <span style="color: #1f2937; font-weight: 600; font-size: 14px; margin-left: 8px;">${bundleName}</span>
      </div>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px;">Plan:</span>
        <span style="color: #1f2937; font-weight: 600; font-size: 14px; margin-left: 8px;">${planName}</span>
      </div>
      
      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px;">Amount Paid:</span>
        <span style="color: #1f2937; font-weight: 600; font-size: 14px; margin-left: 8px;">${amountInRupees}</span>
      </div>
      
      <div>
        <span style="color: #6b7280; font-size: 14px;">Payment Date:</span>
        <span style="color: #1f2937; font-weight: 600; font-size: 14px; margin-left: 8px;">${formattedDate}</span>
      </div>
    </div>

    <!-- Tools Included -->
    <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span style="background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-right: 10px;">ACTIVE</span>
        <h3 style="color: #166534; margin: 0; font-size: 18px;">Tools Included (${tools.length})</h3>
      </div>
      
      <p style="color: #166534; font-size: 14px; margin-bottom: 15px;">
        Your subscriptions for the following tools are now active:
      </p>
      
      <div style="background: white; border: 1px solid #86efac; border-radius: 6px; padding: 15px;">
        <ul style="color: #166534; font-size: 14px; margin: 0; padding-left: 20px;">
          ${tools.map(tool => `<li style="margin-bottom: 8px;">${tool.name}</li>`).join('')}
        </ul>
      </div>
      
      <p style="color: #166534; font-size: 13px; margin-top: 15px; margin-bottom: 0;">
        All tools are accessible via your dashboard. Credentials for each tool are available in your account.
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View My Dashboard
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      If you have any questions or need assistance, please contact our support team via WhatsApp or email.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ${brand.name}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate password reset email HTML template
 */
export function generatePasswordResetEmailHtml(resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${brand.name}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">Reset Your Password</h2>
    
    <p style="color: #4b5563; font-size: 16px; margin-bottom: 30px;">
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="color: #667eea; font-size: 12px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
      ${resetLink}
    </p>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      This link will expire in <strong>30 minutes</strong>.
    </p>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ${brand.name}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}
