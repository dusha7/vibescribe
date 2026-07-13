import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {
      inks: 50,
    },
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      password: hashedPassword,
      sparks: 50,
      inks: 50,
    },
  });

  // Create welcome transaction for test user if not exists
  const existingTx = await prisma.transaction.findFirst({
    where: {
      userId: user.id,
      type: 'PURCHASE',
      description: { contains: 'Welcome' },
    },
  });

  if (!existingTx) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 50,
        type: 'PURCHASE',
        description: 'Welcome bonus \ud83d\udd8b\ufe0f',
      },
    });
  }

  console.log('Seed completed. Test user created.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
