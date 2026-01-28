import { PrismaClient, ToolCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedBundles } from './seed-bundles';

const prisma = new PrismaClient();

const tools = [
  {
    name: 'ChatGPT Plus',
    slug: 'chatgpt-plus',
    category: 'AI_WRITING' as ToolCategory,
    toolUrl: 'https://chat.openai.com',
    priceMonthly: 5000, // ₹50 (in paise)
    shortDescription: 'Access to GPT-4 with faster response times and priority access',
    description: 'Get unlimited access to GPT-4, our most capable model, with faster response times and priority access during peak hours. Perfect for writing, coding, and creative tasks.',
    icon: '🤖',
    sortOrder: 1,
  },
  {
    name: 'Claude Pro',
    slug: 'claude-pro',
    category: 'AI_WRITING' as ToolCategory,
    toolUrl: 'https://claude.ai',
    priceMonthly: 6000, // ₹60 (in paise)
    shortDescription: 'Extended context and priority access to Claude 3',
    description: 'Experience Claude 3 with 5x more usage, priority access during high-traffic periods, and early access to new features.',
    icon: '🎨',
    sortOrder: 2,
  },
  {
    name: 'Gemini Advanced',
    slug: 'gemini-advanced',
    category: 'AI_WRITING' as ToolCategory,
    toolUrl: 'https://gemini.google.com',
    priceMonthly: 5500, // ₹55 (in paise)
    shortDescription: 'Google\'s most capable AI model with multimodal capabilities',
    description: 'Access Google\'s most advanced AI model with enhanced reasoning, coding, and creative abilities. Includes 2TB Google One storage.',
    icon: '💎',
    sortOrder: 3,
  },
  {
    name: 'Jasper AI',
    slug: 'jasper-ai',
    category: 'AI_WRITING' as ToolCategory,
    toolUrl: 'https://app.jasper.ai',
    priceMonthly: 7000, // ₹70 (in paise)
    shortDescription: 'AI content creation and SEO writing assistant',
    description: 'Professional AI writing assistant for marketers, bloggers, and content creators. Generate SEO-optimized content, blog posts, and marketing copy.',
    icon: '📝',
    sortOrder: 4,
  },
  {
    name: 'Midjourney',
    slug: 'midjourney',
    category: 'DESIGN' as ToolCategory,
    toolUrl: 'https://www.midjourney.com',
    priceMonthly: 9000, // ₹90 (in paise)
    shortDescription: 'AI image generation with stunning quality',
    description: 'Create breathtaking AI-generated images from text descriptions. Perfect for designers, artists, and creative professionals.',
    icon: '🎨',
    sortOrder: 5,
  },
  {
    name: 'Canva Pro',
    slug: 'canva-pro',
    category: 'DESIGN' as ToolCategory,
    toolUrl: 'https://www.canva.com',
    priceMonthly: 4000, // ₹40 (in paise)
    shortDescription: 'Professional design platform with AI features',
    description: 'Access premium templates, remove backgrounds instantly, resize designs with Magic Resize, and use the brand kit feature.',
    icon: '🖼️',
    sortOrder: 6,
  },
  {
    name: 'Grammarly Premium',
    slug: 'grammarly-premium',
    category: 'PRODUCTIVITY' as ToolCategory,
    toolUrl: 'https://app.grammarly.com',
    priceMonthly: 3500, // ₹35 (in paise)
    shortDescription: 'Advanced grammar and style checking with AI',
    description: 'Get full-sentence rewrites, tone adjustments, plagiarism detection, and advanced grammar suggestions powered by AI.',
    icon: '✍️',
    sortOrder: 7,
  },
  {
    name: 'GitHub Copilot',
    slug: 'github-copilot',
    category: 'CODE_DEV' as ToolCategory,
    toolUrl: 'https://github.com/features/copilot',
    priceMonthly: 3000, // ₹30 (in paise)
    shortDescription: 'AI pair programmer for faster coding',
    description: 'Your AI pair programmer that helps you write code faster with whole-line and full function suggestions.',
    icon: '💻',
    sortOrder: 8,
  },
  {
    name: 'Notion AI',
    slug: 'notion-ai',
    category: 'PRODUCTIVITY' as ToolCategory,
    toolUrl: 'https://www.notion.so',
    priceMonthly: 5000, // ₹50 (in paise)
    shortDescription: 'AI-powered workspace for notes and docs',
    description: 'Transform your workspace with AI that helps you write better, think bigger, and work faster. Includes all Notion features.',
    icon: '📔',
    sortOrder: 9,
  },
  {
    name: 'Perplexity Pro',
    slug: 'perplexity-pro',
    category: 'AI_WRITING' as ToolCategory,
    toolUrl: 'https://www.perplexity.ai',
    priceMonthly: 5500, // ₹55 (in paise)
    shortDescription: 'AI-powered search and research assistant',
    description: 'Get accurate answers with citations, upload and analyze files, and access advanced AI models including GPT-4 and Claude.',
    icon: '🔍',
    sortOrder: 10,
  },
];

async function main() {

  // Create admin user
  const adminEmail = 'hearterzarya@gmail.com';
  const adminPassword = 'admin123';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN', // Ensure role is ADMIN if user exists
      passwordHash: adminPasswordHash, // Update password if user exists
    },
    create: {
      email: adminEmail,
      name: 'Admin User',
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
    },
  });

  // Create tools
  for (const tool of tools) {
    const createdTool = await prisma.tool.upsert({
      where: { slug: tool.slug },
      update: {},
      create: tool,
    });
    console.log(`Created tool: ${createdTool.name}`);
  }

  // Create bundles (and link tools where possible)
  await seedBundles(prisma);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
