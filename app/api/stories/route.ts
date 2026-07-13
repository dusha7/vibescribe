export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const stories = await prisma.story.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        genre: true,
        format: true,
        prompt: true,
        tropes: true,
        createdAt: true,
      },
    });

    const serialized = (stories ?? []).map((s: any) => ({
      ...s,
      createdAt: s?.createdAt?.toISOString?.() ?? '',
    }));

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error('Stories error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storyId = searchParams?.get('id');
    if (!storyId) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story?.userId !== session.user.id) {
      return NextResponse.json({ error: 'История не найдена' }, { status: 404 });
    }

    await prisma.story.delete({ where: { id: storyId } });
    return NextResponse.json({ message: 'Удалено' });
  } catch (error: any) {
    console.error('Delete story error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
