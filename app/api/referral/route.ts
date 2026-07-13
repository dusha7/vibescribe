export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST - generate referral code for current user
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true },
    });

    if (user?.referralCode) {
      return NextResponse.json({ code: user.referralCode });
    }

    // Generate unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.user.findFirst({ where: { referralCode: code } });
      if (!exists) break;
      code = generateCode();
      attempts++;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { referralCode: code },
    });

    return NextResponse.json({ code });
  } catch (error: any) {
    console.error('Referral error:', error);
    return NextResponse.json({ error: 'Failed to generate referral code' }, { status: 500 });
  }
}

// GET - validate a referral code (used during signup)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ valid: false });
    }

    const referrer = await prisma.user.findFirst({
      where: { referralCode: code },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      valid: !!referrer,
      referrerName: referrer?.name?.split(' ')?.[0] ?? 'A friend',
    });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
