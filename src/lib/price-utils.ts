/**
 * Price calculation utilities
 * Centralized logic for handling BigInt prices and duration-based pricing
 */

export type Duration = '1month' | '3months' | '6months' | '1year';
export type PlanType = 'shared' | 'private';

/**
 * Convert BigInt or number to number safely
 */
export function toNumber(value: number | bigint | null | undefined): number {
  if (!value) return 0;
  return typeof value === 'bigint' ? Number(value) : value;
}

/**
 * Tool price fields interface
 */
export interface ToolPriceFields {
  priceMonthly?: number | bigint | null;
  sharedPlanPrice?: number | bigint | null;
  privatePlanPrice?: number | bigint | null;
  sharedPlanPrice1Month?: number | bigint | null;
  sharedPlanPrice3Months?: number | bigint | null;
  sharedPlanPrice6Months?: number | bigint | null;
  sharedPlanPrice1Year?: number | bigint | null;
  privatePlanPrice1Month?: number | bigint | null;
  privatePlanPrice3Months?: number | bigint | null;
  privatePlanPrice6Months?: number | bigint | null;
  privatePlanPrice1Year?: number | bigint | null;
}

/**
 * Get base price for a plan (shared or private)
 * Returns price in paise
 */
export function getBasePrice(
  tool: ToolPriceFields,
  plan: PlanType
): number {
  const MAX_VALID_PRICE = 1000000000; // ₹10M in paise
  
  if (plan === 'shared') {
    // Check sharedPlanPrice first
    if (tool.sharedPlanPrice) {
      const price = toNumber(tool.sharedPlanPrice);
      if (price > 0 && price <= MAX_VALID_PRICE) {
        return price;
      }
    }
    // Fallback to priceMonthly
    if (tool.priceMonthly) {
      const price = toNumber(tool.priceMonthly);
      if (price > 0 && price <= MAX_VALID_PRICE) {
        return price;
      }
    }
    return 0;
  } else {
    // Check privatePlanPrice first
    if (tool.privatePlanPrice) {
      const price = toNumber(tool.privatePlanPrice);
      if (price > 0 && price <= MAX_VALID_PRICE) {
        return price;
      }
    }
    // Fallback to priceMonthly
    if (tool.priceMonthly) {
      const price = toNumber(tool.priceMonthly);
      if (price > 0 && price <= MAX_VALID_PRICE) {
        return price;
      }
    }
    return 0;
  }
}

/**
 * Get 1-month price for a plan (checks duration-specific field first)
 * Returns price in paise
 */
export function getOneMonthPrice(
  tool: ToolPriceFields,
  plan: PlanType,
  basePrice: number
): number {
  const MAX_VALID_PRICE = 1000000000; // ₹10M in paise
  
  if (plan === 'shared') {
    const price1Month = tool.sharedPlanPrice1Month;
    if (price1Month) {
      const price = toNumber(price1Month);
      if (price > 0 && price <= MAX_VALID_PRICE) {
        return price;
      }
    }
    // Fallback to basePrice if valid
    return basePrice > 0 && basePrice <= MAX_VALID_PRICE ? basePrice : 0;
  } else {
    const price1Month = tool.privatePlanPrice1Month;
    if (price1Month) {
      const price = toNumber(price1Month);
      if (price > 0 && price <= MAX_VALID_PRICE) {
        return price;
      }
    }
    // Fallback to basePrice if valid
    return basePrice > 0 && basePrice <= MAX_VALID_PRICE ? basePrice : 0;
  }
}

/**
 * Get price for a specific duration
 * Uses admin-set duration-specific prices, falls back to 1-month price
 * Returns price in paise
 */
export function getPriceForDuration(
  tool: ToolPriceFields,
  plan: PlanType,
  duration: Duration,
  oneMonthPrice: number
): number {
  const MAX_VALID_PRICE = 1000000000; // ₹10M in paise
  
  if (plan === 'shared') {
    switch (duration) {
      case '1month':
        return oneMonthPrice > 0 && oneMonthPrice <= MAX_VALID_PRICE ? oneMonthPrice : 0;
      case '3months': {
        const price3Months = tool.sharedPlanPrice3Months;
        if (price3Months) {
          const price = toNumber(price3Months);
          if (price > 0 && price <= MAX_VALID_PRICE) {
            return price;
          }
        }
        // Fallback: calculate from 1-month price if no specific price set
        return oneMonthPrice > 0 && oneMonthPrice <= MAX_VALID_PRICE ? oneMonthPrice * 3 : 0;
      }
      case '6months': {
        const price6Months = tool.sharedPlanPrice6Months;
        if (price6Months) {
          const price = toNumber(price6Months);
          if (price > 0 && price <= MAX_VALID_PRICE) {
            return price;
          }
        }
        // Fallback: calculate from 1-month price if no specific price set
        return oneMonthPrice > 0 && oneMonthPrice <= MAX_VALID_PRICE ? oneMonthPrice * 6 : 0;
      }
      case '1year': {
        const price1Year = tool.sharedPlanPrice1Year;
        if (price1Year) {
          const price = toNumber(price1Year);
          if (price > 0 && price <= MAX_VALID_PRICE) {
            return price;
          }
        }
        // Fallback: calculate from 1-month price if no specific price set
        return oneMonthPrice > 0 && oneMonthPrice <= MAX_VALID_PRICE ? oneMonthPrice * 12 : 0;
      }
      default:
        return oneMonthPrice > 0 && oneMonthPrice <= MAX_VALID_PRICE ? oneMonthPrice : 0;
    }
  } else {
    switch (duration) {
      case '1month':
        return oneMonthPrice > 0 && oneMonthPrice <= MAX_VALID_PRICE ? oneMonthPrice : 0;
      case '3months': {
        const price3Months = tool.privatePlanPrice3Months;
        if (price3Months) {
          const price = toNumber(price3Months);
          if (price > 0 && price <= MAX_VALID_PRICE) {
            return price;
          }
        }
        // Fallback: calculate from 1-month price if no specific price set
        return oneMonthPrice > 0 && oneMonthPrice <= MAX_VALID_PRICE ? oneMonthPrice * 3 : 0;
      }
      case '6months': {
        const price6Months = tool.privatePlanPrice6Months;
        if (price6Months) {
          const price = toNumber(price6Months);
          if (price > 0 && price <= MAX_VALID_PRICE) {
            return price;
          }
        }
        // Fallback: calculate from 1-month price if no specific price set
        return oneMonthPrice > 0 && oneMonthPrice <= MAX_VALID_PRICE ? oneMonthPrice * 6 : 0;
      }
      case '1year': {
        const price1Year = tool.privatePlanPrice1Year;
        if (price1Year) {
          const price = toNumber(price1Year);
          if (price > 0 && price <= MAX_VALID_PRICE) {
            return price;
          }
        }
        // Fallback: calculate from 1-month price if no specific price set
        return oneMonthPrice > 0 && oneMonthPrice <= MAX_VALID_PRICE ? oneMonthPrice * 12 : 0;
      }
      default:
        return oneMonthPrice > 0 && oneMonthPrice <= MAX_VALID_PRICE ? oneMonthPrice : 0;
    }
  }
}

/**
 * Calculate discount percentage between original and final price
 */
export function calculateDiscountPercent(
  originalPrice: number,
  finalPrice: number
): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
}

/**
 * Check if a duration is enabled for a plan
 * A duration is enabled if it has a price set and the price is greater than 0
 */
export function isDurationEnabled(
  tool: ToolPriceFields,
  plan: PlanType,
  duration: Duration
): boolean {
  if (plan === 'shared') {
    switch (duration) {
      case '1month':
        // 1 month is always enabled if the plan itself is enabled
        return true;
      case '3months':
        return tool.sharedPlanPrice3Months ? toNumber(tool.sharedPlanPrice3Months) > 0 : false;
      case '6months':
        return tool.sharedPlanPrice6Months ? toNumber(tool.sharedPlanPrice6Months) > 0 : false;
      case '1year':
        return tool.sharedPlanPrice1Year ? toNumber(tool.sharedPlanPrice1Year) > 0 : false;
      default:
        return false;
    }
  } else {
    switch (duration) {
      case '1month':
        // 1 month is always enabled if the plan itself is enabled
        return true;
      case '3months':
        return tool.privatePlanPrice3Months ? toNumber(tool.privatePlanPrice3Months) > 0 : false;
      case '6months':
        return tool.privatePlanPrice6Months ? toNumber(tool.privatePlanPrice6Months) > 0 : false;
      case '1year':
        return tool.privatePlanPrice1Year ? toNumber(tool.privatePlanPrice1Year) > 0 : false;
      default:
        return false;
    }
  }
}

/**
 * Get list of enabled durations for a plan
 */
export function getEnabledDurations(
  tool: ToolPriceFields,
  plan: PlanType
): Duration[] {
  const durations: Duration[] = ['1month', '3months', '6months', '1year'];
  return durations.filter(duration => isDurationEnabled(tool, plan, duration));
}

/**
 * Get minimum/starting price for a tool
 * Professional price calculation algorithm that:
 * 1. Validates all prices against reasonable limits
 * 2. Filters out corrupted/invalid data
 * 3. Returns the lowest valid starting price
 * 4. Ensures consistent pricing across the application
 * 
 * Priority order:
 * 1. 1-month plan-specific prices (most accurate)
 * 2. Base plan prices (sharedPlanPrice/privatePlanPrice)
 * 3. Fallback to priceMonthly
 * 
 * @param tool - Tool with price fields
 * @returns Minimum valid price in paise, or 0 if no valid price found
 */
export function getMinimumStartingPrice(tool: ToolPriceFields): number {
  const MAX_VALID_PRICE = 1000000000; // ₹10M in paise (safety limit)
  const MIN_VALID_PRICE = 1; // Minimum 1 paise
  const validPrices: number[] = [];

  // Helper to safely validate and add price to array
  const addIfValid = (value: number | bigint | null | undefined) => {
    if (value === null || value === undefined) return;
    const price = toNumber(value);
    // Validate: must be positive, within reasonable bounds, and not corrupted
    if (price >= MIN_VALID_PRICE && price <= MAX_VALID_PRICE) {
      validPrices.push(price);
    }
  };

  // Priority 1: Check 1-month plan-specific prices (most accurate starting prices)
  addIfValid(tool.sharedPlanPrice1Month);
  addIfValid(tool.privatePlanPrice1Month);

  // Priority 2: Check base plan prices (if 1-month prices not set)
  addIfValid(tool.sharedPlanPrice);
  addIfValid(tool.privatePlanPrice);

  // Priority 3: Fallback to base monthly price (if no plan-specific prices set)
  addIfValid(tool.priceMonthly);

  // Return minimum valid price, or 0 if none found
  return validPrices.length > 0 ? Math.min(...validPrices) : 0;
}
