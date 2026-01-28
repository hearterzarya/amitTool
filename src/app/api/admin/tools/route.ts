import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeTool } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Helper function to convert price to paise with validation
    // Note: Form already sends prices in paise (multiplied by 100), so we just validate and convert to BigInt
    const convertToPaise = (price: number | string | undefined): bigint | null | undefined => {
      if (price === undefined) return undefined;
      if (!price || price === 0) return null;
      const numPrice = typeof price === 'string' ? parseFloat(price) : price;
      if (isNaN(numPrice) || numPrice < 0) return null;
      // Validate: max price is ₹10,000,000 (1,000,000,000 paise)
      // Since form already sends in paise, we check the paise value directly
      if (numPrice > 1000000000) {
        const rupees = numPrice / 100;
        throw new Error(`Price cannot exceed ₹10,000,000. You entered ₹${rupees.toLocaleString('en-IN')}`);
      }
      // Form already sends in paise, so just convert to BigInt
      return BigInt(Math.round(numPrice));
    };

    // Build base create data (always available fields)
    const baseCreateData: any = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      shortDescription: data.shortDescription || null,
      category: data.category,
      icon: data.icon || null,
      toolUrl: data.toolUrl,
      priceMonthly: convertToPaise(data.priceMonthly) || BigInt(0),
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      isOutOfStock: data.isOutOfStock ?? false,
      sortOrder: data.sortOrder || 0,
      cookiesExpiryDate: data.cookiesExpiryDate ? new Date(data.cookiesExpiryDate) : null,
    };

    // Try to create with plan fields first, fallback to base fields if schema not updated
    let tool;
    try {
      // Attempt create with plan fields
      const createDataWithPlans = {
        ...baseCreateData,
        // Duration-specific prices
        sharedPlanPrice1Month: convertToPaise(data.sharedPlanPrice1Month),
        sharedPlanPrice3Months: convertToPaise(data.sharedPlanPrice3Months),
        sharedPlanPrice6Months: convertToPaise(data.sharedPlanPrice6Months),
        sharedPlanPrice1Year: convertToPaise(data.sharedPlanPrice1Year),
        privatePlanPrice1Month: convertToPaise(data.privatePlanPrice1Month),
        privatePlanPrice3Months: convertToPaise(data.privatePlanPrice3Months),
        privatePlanPrice6Months: convertToPaise(data.privatePlanPrice6Months),
        privatePlanPrice1Year: convertToPaise(data.privatePlanPrice1Year),
        // Legacy fields
        sharedPlanPrice: convertToPaise(data.sharedPlanPrice),
        privatePlanPrice: convertToPaise(data.privatePlanPrice),
        sharedPlanFeatures: data.sharedPlanFeatures !== undefined ? (data.sharedPlanFeatures || null) : undefined,
        privatePlanFeatures: data.privatePlanFeatures !== undefined ? (data.privatePlanFeatures || null) : undefined,
        sharedPlanEnabled: data.sharedPlanEnabled !== undefined ? (data.sharedPlanEnabled ?? false) : undefined,
        privatePlanEnabled: data.privatePlanEnabled !== undefined ? (data.privatePlanEnabled ?? false) : undefined,
        sharedPlanName: data.sharedPlanName !== undefined ? (data.sharedPlanName || null) : undefined,
        privatePlanName: data.privatePlanName !== undefined ? (data.privatePlanName || null) : undefined,
        sharedPlanDescription: data.sharedPlanDescription !== undefined ? (data.sharedPlanDescription || null) : undefined,
        privatePlanDescription: data.privatePlanDescription !== undefined ? (data.privatePlanDescription || null) : undefined,
      };
      
      // Remove undefined fields
      Object.keys(createDataWithPlans).forEach(key => {
        if (createDataWithPlans[key] === undefined) {
          delete createDataWithPlans[key];
        }
      });

      tool = await prisma.tool.create({
        data: createDataWithPlans,
      });
    } catch (planError: any) {
      // If plan fields don't exist, create without them
      if (planError.message?.includes('Unknown argument') || 
          planError.message?.includes('sharedPlanPrice') ||
          planError.message?.includes('privatePlanPrice')) {
        console.warn('Plan fields not available, creating without them. Run: npx prisma generate && npx prisma db push');
        tool = await prisma.tool.create({
          data: baseCreateData,
        });
      } else {
        throw planError;
      }
    }

    // Convert BigInt values to numbers for JSON serialization
    return NextResponse.json(serializeTool(tool), { status: 201 });
  } catch (error: any) {
    console.error("Error creating tool:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A tool with this slug already exists" },
        { status: 400 }
      );
    }
    
    // Check if it's a column missing error
    if (error.message?.includes('Unknown column') || 
        error.message?.includes('column') ||
        error.code === 'P2021') {
      return NextResponse.json(
        { 
          error: "Database schema needs to be updated. Please run: npx prisma generate && npx prisma db push",
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create tool",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
