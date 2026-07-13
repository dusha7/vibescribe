export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { inks: true, name: true, email: true, image: true, referralCode: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Also count stories and characters
    const [storyCount, characterCount] = await Promise.all([
      prisma.story.count({ where: { userId: session.user.id } }),
      prisma.character.count({ where: { userId: session.user.id } }),
    ]);
    return NextResponse.json({ ...user, storyCount, characterCount });
  } catch (error: any) {
    console.error('Balance error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
