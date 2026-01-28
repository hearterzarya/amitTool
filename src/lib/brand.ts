/**
 * Brand Configuration - Single Source of Truth
 * Update all brand-related strings here to maintain consistency
 */

export const brand = {
  name: "Amit Techsolution",
  tagline: "Premium Tech Solutions at Your Fingertips",
  description: "Subscribe to premium AI tools and software solutions. Affordable subscriptions with instant access.",
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://amit-techsolution.vercel.app",
  supportEmail: "support@amittechsolution.com",
  supportPhone: "+91 9155313223",
  whatsappNumber: "919155313223",
  whatsappMessage: "Hi! I need help with my subscription.",
} as const;

export type Brand = typeof brand;
