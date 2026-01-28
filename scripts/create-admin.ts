import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = 'hearterzarya@gmail.com';
    const adminPassword = 'admin123';
    
    console.log('Creating admin user...');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    console.log('Password hashed successfully');
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    
    if (existingUser) {
      console.log('User already exists. Updating to admin...');
      const updated = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: 'ADMIN',
          passwordHash: passwordHash,
        },
      });
      console.log('✅ Admin user updated successfully!');
      console.log(`User ID: ${updated.id}`);
      console.log(`Role: ${updated.role}`);
    } else {
      const created = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Admin User',
          role: 'ADMIN',
          passwordHash: passwordHash,
        },
      });
      console.log('✅ Admin user created successfully!');
      console.log(`User ID: ${created.id}`);
      console.log(`Role: ${created.role}`);
    }
    
    // Verify the user
    const verifyUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });
    
    if (verifyUser) {
      console.log('\n✅ Verification:');
      console.log(`Email: ${verifyUser.email}`);
      console.log(`Name: ${verifyUser.name}`);
      console.log(`Role: ${verifyUser.role}`);
      console.log(`Has Password: ${!!verifyUser.passwordHash}`);
      
      // Test password
      const testPassword = await bcrypt.compare(adminPassword, verifyUser.passwordHash!);
      console.log(`Password Match Test: ${testPassword ? '✅ PASS' : '❌ FAIL'}`);
    }
    
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error);
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

createAdmin();

