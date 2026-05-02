import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const BCRYPT_ROUNDS = 10;

  // ── Admin user ───────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123456', BCRYPT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: adminPassword,
      name: 'HR Administrator',
      position: 'HR Manager',
      phone: '08100000001',
      role: UserRole.ADMIN,
    },
  });

  // ── Sample employee ──────────────────────────────────────────
  const employeePassword = await bcrypt.hash('Employee@123456', BCRYPT_ROUNDS);
  const employee = await prisma.user.upsert({
    where: { email: 'john.doe@company.com' },
    update: {},
    create: {
      email: 'john.doe@company.com',
      password: employeePassword,
      name: 'John Doe',
      position: 'Software Engineer',
      phone: '08111111111',
      role: UserRole.EMPLOYEE,
    },
  });

  console.log('✅ Seed complete');
  console.log('   Admin:', admin.email);
  console.log('   Employee:', employee.email);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
