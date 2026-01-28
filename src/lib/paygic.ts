/**
 * Paygic Payment Gateway Integration
 * Documentation: https://docs.paygic.in/
 */

const PAYGIC_BASE_URL = 'https://server.paygic.in';

export interface PaygicTokenResponse {
  status: boolean;
  statusCode: number;
  msg: string;
  data: {
    token: string;
    expires: string;
  };
}

export interface PaygicPaymentRequest {
  mid: string;
  amount: string; // Amount should be between 1-100000 and numeric
  merchantReferenceId: string;
  customer_name: string;
  customer_email: string;
  customer_mobile: string;
}

export interface PaygicPaymentResponse {
  status: boolean;
  statusCode: number;
  msg: string;
  data: {
    intent: string;
    phonePe: string;
    paytm: string;
    gpay: string;
    dynamicQR: string;
    expiry: string;
    amount: number;
    paygicReferenceId: string;
    merchantReferenceId: string;
  };
}

export interface PaygicStatusResponse {
  status: boolean;
  statusCode: number;
  txnStatus: string;
  msg: string;
  data: {
    amount: number;
    mid: string;
    paygicReferenceId: string;
    merchantReferenceId: string;
    successDate: number;
  };
}

/**
 * Create Paygic authentication token
 */
export async function createPaygicToken(): Promise<string> {
  const mid = process.env.PAYGIC_MERCHANT_ID;
  const password = process.env.PAYGIC_PASSWORD;

  if (!mid || !password) {
    throw new Error('PAYGIC_MERCHANT_ID and PAYGIC_PASSWORD must be set in environment variables');
  }

  try {
    const response = await fetch(`${PAYGIC_BASE_URL}/api/v3/createMerchantToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mid,
        password,
        expiry: false, // Token never expires
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Paygic token creation failed: ${errorText}`);
    }

    const data: PaygicTokenResponse = await response.json();
    
    if (!data.status || !data.data?.token) {
      throw new Error(data.msg || 'Failed to create Paygic token');
    }

    return data.data.token;
  } catch (error) {
    console.error('Error creating Paygic token:', error);
    throw error;
  }
}

/**
 * Create a payment request with Paygic
 */
export async function createPaygicPayment(
  token: string,
  paymentData: PaygicPaymentRequest
): Promise<PaygicPaymentResponse> {
  try {
    console.log('Paygic payment request:', {
      amount: paymentData.amount,
      amountType: typeof paymentData.amount,
      merchantReferenceId: paymentData.merchantReferenceId,
    });
    
    const response = await fetch(`${PAYGIC_BASE_URL}/api/v2/createPaymentRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Paygic payment creation failed: ${errorText}`);
    }

    const data: PaygicPaymentResponse = await response.json();
    
    if (!data.status) {
      throw new Error(data.msg || 'Failed to create payment request');
    }

    return data;
  } catch (error) {
    console.error('Error creating Paygic payment:', error);
    throw error;
  }
}

/**
 * Check payment status
 */
export async function checkPaygicStatus(
  token: string,
  merchantReferenceId: string
): Promise<PaygicStatusResponse> {
  const mid = process.env.PAYGIC_MERCHANT_ID;

  if (!mid) {
    throw new Error('PAYGIC_MERCHANT_ID must be set in environment variables');
  }

  try {
    const response = await fetch(`${PAYGIC_BASE_URL}/api/v2/checkPaymentStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token,
      },
      body: JSON.stringify({
        mid,
        merchantReferenceId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Paygic status check failed: ${errorText}`);
    }

    const data: PaygicStatusResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking Paygic status:', error);
    throw error;
  }
}

/**
 * Generate a unique merchant reference ID
 */
export function generateMerchantReferenceId(): string {
  return `GT${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

/**
 * Convert amount from rupees to paise (for internal storage)
 * Example: 999 (rupees) -> 99900 (paise)
 * Note: Paygic API expects amount in rupees, not paise
 */
export function convertToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert amount from paise to rupees
 */
export function convertToRupees(paise: number): number {
  return paise / 100;
}

