/**
 * Professional Price Validation System
 * Ensures all prices are valid, consistent, and properly formatted
 */

import { ToolPriceFields } from './price-utils';
import { logger } from './logger';

const MAX_VALID_PRICE = 1000000000; // ₹10M in paise (safety limit)
const MIN_VALID_PRICE = 1; // Minimum 1 paise

/**
 * Validate a single price value
 * @param value - Price value to validate
 * @returns true if price is valid, false otherwise
 */
export function isValidPrice(value: number | bigint | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  
  const num = typeof value === 'bigint' ? Number(value) : Number(value);
  
  // Must be a valid number, positive, and within reasonable bounds
  return !isNaN(num) && num >= MIN_VALID_PRICE && num <= MAX_VALID_PRICE;
}

/**
 * Clean and validate all prices in a tool object
 * Removes corrupted prices and ensures data integrity
 * @param tool - Tool object with price fields
 * @returns Tool object with validated prices (corrupted prices set to null)
 */
export function validateToolPrices(tool: ToolPriceFields): ToolPriceFields {
  const cleaned: any = { ...tool };
  
  // List of all price fields to validate
  const priceFields = [
    'priceMonthly',
    'sharedPlanPrice1Month',
    'sharedPlanPrice3Months',
    'sharedPlanPrice6Months',
    'sharedPlanPrice1Year',
    'privatePlanPrice1Month',
    'privatePlanPrice3Months',
    'privatePlanPrice6Months',
    'privatePlanPrice1Year',
    'sharedPlanPrice',
    'privatePlanPrice',
  ];
  
  // Validate each price field
  priceFields.forEach(field => {
    const value = (tool as any)[field];
    if (!isValidPrice(value)) {
      if (value !== null && value !== undefined) {
        logger.warn(`Invalid price filtered out for field ${field}:`, value);
      }
      cleaned[field] = null;
    }
  });
  
  return cleaned;
}

/**
 * Check if a tool has any valid prices
 * @param tool - Tool object with price fields
 * @returns true if tool has at least one valid price
 */
export function hasValidPrices(tool: ToolPriceFields): boolean {
  return isValidPrice(tool.priceMonthly) ||
         isValidPrice(tool.sharedPlanPrice1Month) ||
         isValidPrice(tool.privatePlanPrice1Month) ||
         isValidPrice(tool.sharedPlanPrice) ||
         isValidPrice(tool.privatePlanPrice);
}
