export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, referralCode } = body ?? {};

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: name ?? email?.split('@')?.[0] ?? 'User',
        password: hashedPassword,
        inks: 50,
        sparks: 50,
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 50,
        type: 'PURCHASE',
        description: 'Welcome bonus \ud83d\udd8b\ufe0f',
      },
    });

    // Handle referral bonus
    if (referralCode) {
      try {
        const referrer = await prisma.user.findFirst({ where: { referralCode } });
        if (referrer && referrer.id !== user.id) {
          // Give both referrer and new user 20 inks
          await prisma.$transaction([
            prisma.user.update({ where: { id: referrer.id }, data: { inks: { increment: 20 } } }),
            prisma.transaction.create({ data: { userId: referrer.id, amount: 20, type: 'PURCHASE', description: 'Referral bonus \ud83c\udf89' } }),
            prisma.user.update({ where: { id: user.id }, data: { inks: { increment: 20 }, referredBy: referrer.id } }),
            prisma.transaction.create({ data: { userId: user.id, amount: 20, type: 'PURCHASE', description: 'Referral welcome bonus \ud83c\udf89' } }),
          ]);
        }
      } catch (refErr) {
        console.error('Referral bonus error:', refErr);
      }
    }

    return NextResponse.json({ message: 'Account created', userId: user.id }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
