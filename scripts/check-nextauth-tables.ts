/**
 * Script to check if NextAuth tables exist in the database
 * Run with: tsx scripts/check-nextauth-tables.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('Checking NextAuth tables...\n');

    // Check accounts table
    try {
      const accountCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM accounts`;
      console.log('✅ accounts table exists');
      console.log(`   Records: ${JSON.stringify(accountCount)}`);
    } catch (error: any) {
      console.log('❌ accounts table missing or error:', error.message);
    }

    // Check sessions table
    try {
      const sessionCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sessions`;
      console.log('✅ sessions table exists');
      console.log(`   Records: ${JSON.stringify(sessionCount)}`);
    } catch (error: any) {
      console.log('❌ sessions table missing or error:', error.message);
    }

    // Check verification_tokens table
    try {
      const tokenCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM verification_tokens`;
      console.log('✅ verification_tokens table exists');
      console.log(`   Records: ${JSON.stringify(tokenCount)}`);
    } catch (error: any) {
      console.log('❌ verification_tokens table missing or error:', error.message);
    }

    // Check users table
    try {
      const userCount = await prisma.user.count();
      console.log('✅ users table exists');
      console.log(`   Total users: ${userCount}`);
    } catch (error: any) {
      console.log('❌ users table missing or error:', error.message);
    }

    console.log('\n✅ Database check complete!');
  } catch (error: any) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
