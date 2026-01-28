import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function grantTestAccess() {
  try {
    // Get email from command line argument or use default test user
    const email = process.argv[2] || 'test@growtools.com';
    
    console.log(`Granting test access to: ${email}...`);
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.log(`User not found. Creating test user with email: ${email}`);
      
      // Create test user if doesn't exist
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('test123', 10);
      
      user = await prisma.user.create({
        data: {
          email,
          name: 'Test User',
          role: 'TEST_USER',
          passwordHash,
        },
      });
      
      console.log('✅ Test user created successfully!');
      console.log(`Email: ${user.email}`);
      console.log(`Password: test123`);
    } else {
      // Update existing user to TEST_USER role
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'TEST_USER',
        },
      });
      
      console.log('✅ Test access granted successfully!');
    }
    
    console.log(`\nUser Details:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`\nYou can now login and access all tools without payment!`);
    console.log(`\nTo revoke test access, run:`);
    console.log(`  npm run revoke-test-access ${email}`);
    
  } catch (error: any) {
    console.error('❌ Error granting test access:', error);
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

grantTestAccess();

