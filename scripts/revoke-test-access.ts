import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function revokeTestAccess() {
  try {
    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.error('❌ Error: Email is required');
      console.log('Usage: npm run revoke-test-access <email>');
      process.exit(1);
    }
    
    console.log(`Revoking test access from: ${email}...`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    if (user.role !== 'TEST_USER') {
      console.log(`⚠️  User ${email} is not a test user (current role: ${user.role})`);
    }
    
    // Update user role back to USER
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'USER',
      },
    });
    
    console.log('✅ Test access revoked successfully!');
    console.log(`\nUser Details:`);
    console.log(`  ID: ${updatedUser.id}`);
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Role: ${updatedUser.role}`);
    
  } catch (error: any) {
    console.error('❌ Error revoking test access:', error);
    if (error.code === 'P2024') {
      console.error('Database connection timeout. Check your DATABASE_URL.');
    } else if (error.code === 'P2021') {
      console.error('Database tables not found. Run: npm run db:push');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

revokeTestAccess();

