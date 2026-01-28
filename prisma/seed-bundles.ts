import type { PrismaClient } from '@prisma/client';

const bundles = [
  {
    name: 'AI Content & Design Suite',
    slug: 'ai-content-design-suite',
    description: 'Complete suite for creators, bloggers, freelancers, businesses, and students. Includes AI writing, grammar tools, design software, AI image generation, and basic video editing.',
    shortDescription: 'Perfect for content creators, bloggers, and businesses',
    icon: '✍️',
    priceMonthly: 29900, // ₹299/month
    priceSixMonth: 149500, // ₹1495 for 6 months (save ~17%)
    priceYearly: 269900, // ₹2699/year (save ~25%)
    features: 'ChatGPT Plus, Claude Pro, Jasper AI, Grammarly Premium, QuillBot, Canva Pro, Adobe Express, Midjourney, Leonardo AI, CapCut Pro, VEED.io',
    targetAudience: 'Creators, bloggers, freelancers, businesses, students',
    isActive: true,
    isTrending: true,
    sortOrder: 1,
    tools: [
      'chatgpt-plus',
      'claude-pro',
      'jasper-ai',
      'grammarly',
      'quillbot',
      'canva-pro',
      'midjourney',
    ],
  },
  {
    name: 'SEO, Traffic & Growth Suite',
    slug: 'seo-traffic-growth-suite',
    description: 'Comprehensive SEO and growth tools for bloggers, niche sites, agencies, and affiliate marketers. Includes keyword research, content optimization, WordPress SEO, and social scheduling.',
    shortDescription: 'Essential tools for SEO professionals and content marketers',
    icon: '📈',
    priceMonthly: 39900, // ₹399/month
    priceSixMonth: 199500, // ₹1995 for 6 months
    priceYearly: 359900, // ₹3599/year
    features: 'Ahrefs, SEMrush, Surfer SEO, NeuronWriter, Keywords Everywhere, AnswerThePublic, Rank Math Pro, Yoast Premium, Publer, Hootsuite',
    targetAudience: 'Bloggers, niche sites, agencies, affiliate marketers',
    isActive: true,
    isTrending: true,
    sortOrder: 2,
    tools: [
      'ahrefs',
      'semrush',
      'surfer-seo',
      'rank-math-pro',
      'yoast-premium',
    ],
  },
  {
    name: 'Video & Social Media Suite',
    slug: 'video-social-media-suite',
    description: 'Complete video editing and social media toolkit for YouTubers, Instagram creators, and agencies. Includes professional video editing, short-form AI tools, YouTube growth tools, and thumbnail creators.',
    shortDescription: 'Perfect for YouTubers, Instagram creators, and agencies',
    icon: '🎬',
    priceMonthly: 34900, // ₹349/month
    priceSixMonth: 174500, // ₹1745 for 6 months
    priceYearly: 314900, // ₹3149/year
    features: 'CapCut Pro, Adobe Premiere Pro, Opus Clip, InVideo AI, VidIQ Boost, TubeBuddy Legend, Canva Pro, Thumbnail Blaster, TrendTok',
    targetAudience: 'YouTubers, Instagram creators, agencies',
    isActive: true,
    isTrending: true,
    sortOrder: 3,
    tools: [
      'capcut-pro',
      'adobe-premiere-pro',
      'opus-clip',
      'invideo-ai',
      'vidiq-boost',
      'tubebuddy-legend',
    ],
  },
  {
    name: 'Income, Freelancing & Business Suite',
    slug: 'income-freelancing-business-suite',
    description: 'Complete business toolkit for freelancers, agencies, and e-commerce sellers. Includes proposal tools, project management, email marketing, funnels, and e-commerce tools.',
    shortDescription: 'Essential tools for freelancers, agencies, and e-commerce sellers',
    icon: '💼',
    priceMonthly: 37900, // ₹379/month
    priceSixMonth: 189500, // ₹1895 for 6 months
    priceYearly: 341900, // ₹3419/year
    features: 'ChatGPT Plus, Better Proposals, Resume.io, Notion AI, ClickUp, Trello, Systeme.io, MailerLite, Brevo, Helium 10, SellerApp, Canva Pro',
    targetAudience: 'Freelancers, agencies, e-commerce sellers',
    isActive: true,
    isTrending: true,
    sortOrder: 4,
    tools: [
      'chatgpt-plus',
      'notion-ai',
      'clickup',
      'trello',
      'systeme-io',
      'mailerlite',
    ],
  },
  {
    name: 'Student & Productivity Suite',
    slug: 'student-productivity-suite',
    description: 'Complete study and productivity toolkit for school, college, TNPSC, SSC, UPSC, and NEET students. Includes AI study assistants, note-taking tools, PDF tools, writing assistance, and revision tools.',
    shortDescription: 'Perfect for students preparing for competitive exams',
    icon: '📚',
    priceMonthly: 19900, // ₹199/month
    priceSixMonth: 99500, // ₹995 for 6 months
    priceYearly: 179900, // ₹1799/year
    features: 'ChatGPT Plus, Question AI, Notion AI, Obsidian Premium, iLovePDF Pro, SmallPDF Pro, Grammarly, QuillBot, Anki Pro',
    targetAudience: 'School, college, TNPSC, SSC, UPSC, NEET students',
    isActive: true,
    isTrending: true,
    sortOrder: 5,
    tools: [
      'chatgpt-plus',
      'notion-ai',
      'ilovepdf-pro',
      'smallpdf-pro',
      'grammarly',
      'quillbot',
    ],
  },
];

export async function seedBundles(prisma: PrismaClient) {
  console.log('🌱 Seeding bundles...');

  for (const bundleData of bundles) {
    const { tools: toolSlugs, ...bundleInfo } = bundleData;
    
    // Check if bundle already exists
    const existingBundle = await prisma.bundle.findUnique({
      where: { slug: bundleInfo.slug },
    });

    if (existingBundle) {
      console.log(`⏭️  Bundle "${bundleInfo.name}" already exists, skipping...`);
      continue;
    }

    // Create bundle
    const bundle = await prisma.bundle.create({
      data: bundleInfo,
    });

    console.log(`✅ Created bundle: ${bundle.name}`);

    // Link tools to bundle
    if (toolSlugs && toolSlugs.length > 0) {
      for (let i = 0; i < toolSlugs.length; i++) {
        const toolSlug = toolSlugs[i];
        try {
          const tool = await prisma.tool.findUnique({
            where: { slug: toolSlug },
          });

          if (tool) {
            await prisma.bundleTool.create({
              data: {
                bundleId: bundle.id,
                toolId: tool.id,
                sortOrder: i,
              },
            });
            console.log(`  ✅ Linked tool: ${tool.name}`);
          } else {
            console.log(`  ⚠️  Tool not found: ${toolSlug}`);
          }
        } catch (error) {
          console.log(`  ⚠️  Error linking tool ${toolSlug}:`, error);
        }
      }
    }
  }

  console.log('✨ Bundle seeding completed!');
}

// Allow running this file directly: `tsx prisma/seed-bundles.ts`
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient: RuntimePrismaClient } = require('@prisma/client');
  const prisma = new RuntimePrismaClient();

  seedBundles(prisma)
    .catch((e) => {
      console.error('❌ Error seeding bundles:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
