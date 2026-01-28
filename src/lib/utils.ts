import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price in Indian Rupees (INR)
 * Converts paise to rupees and formats with ₹ symbol using Indian number system
 * @param paise - Price in paise (e.g., 19900 = ₹199)
 * @returns Formatted price string in INR (e.g., "₹199" or "₹199.50")
 */
export function formatPrice(paise: number | bigint): string {
  // Convert BigInt to number if needed
  const paiseNum = typeof paise === 'bigint' ? Number(paise) : paise;
  
  // Handle zero or negative values
  if (paiseNum <= 0) {
    return '₹0';
  }
  
  // Convert paise to rupees
  const rupees = paiseNum / 100;
  
  // Format using Indian number system (en-IN locale)
  // If the amount is a whole number, don't show decimals
  if (rupees % 1 === 0) {
    return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }
  
  // For decimal amounts, show 2 decimal places with Indian formatting
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
}

import { logger } from './logger';

/**
 * Professional price validation and conversion
 * Filters out corrupted prices and ensures data integrity
 * @param value - Price value (BigInt, number, or null)
 * @param maxPaise - Maximum valid price in paise (default: ₹10M)
 * @returns Valid price in paise as number, or null if invalid/corrupted
 */
const safeConvertPrice = (value: any, maxPaise: number = 1000000000): number | null => {
  if (!value) return null;
  
  // Convert BigInt to number
  const num = typeof value === 'bigint' ? Number(value) : Number(value);
  
  // Validate: must be a valid number
  if (isNaN(num) || num < 0) return null;
  
  // Professional validation: Filter out corrupted prices
  // Prices over ₹10M (1,000,000,000 paise) are considered corrupted
  // This prevents display of absurd values like ₹29,90,000/month
  if (num > maxPaise) {
    logger.warn('Price value seems corrupted and filtered out:', num, 'paise (₹' + (num / 100).toLocaleString('en-IN') + '). Returning null.');
    return null;
  }
  
  return num;
};

/**
 * Serialize tool for JSON response
 * Converts BigInt to numbers and validates/filters corrupted prices
 * This ensures all prices are valid and properly formatted
 */
export function serializeTool(tool: any): any {
  if (!tool) return tool;
  
  // Convert and validate all price fields
  const serialized = {
    ...tool,
    priceMonthly: safeConvertPrice(tool.priceMonthly) ?? 0,
    sharedPlanPrice1Month: safeConvertPrice(tool.sharedPlanPrice1Month),
    sharedPlanPrice3Months: safeConvertPrice(tool.sharedPlanPrice3Months),
    sharedPlanPrice6Months: safeConvertPrice(tool.sharedPlanPrice6Months),
    sharedPlanPrice1Year: safeConvertPrice(tool.sharedPlanPrice1Year),
    privatePlanPrice1Month: safeConvertPrice(tool.privatePlanPrice1Month),
    privatePlanPrice3Months: safeConvertPrice(tool.privatePlanPrice3Months),
    privatePlanPrice6Months: safeConvertPrice(tool.privatePlanPrice6Months),
    privatePlanPrice1Year: safeConvertPrice(tool.privatePlanPrice1Year),
    sharedPlanPrice: safeConvertPrice(tool.sharedPlanPrice),
    privatePlanPrice: safeConvertPrice(tool.privatePlanPrice),
  };
  
  return serialized;
}

// Serialize bundle (similar to serializeTool but for bundles)
export function serializeBundle(bundle: any): any {
  if (!bundle) return bundle;
  return {
    ...bundle,
    priceMonthly: safeConvertPrice(bundle.priceMonthly) ?? 0,
    priceSixMonth: safeConvertPrice(bundle.priceSixMonth),
    priceYearly: safeConvertPrice(bundle.priceYearly),
  };
}
