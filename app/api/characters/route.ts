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
    const characters = await prisma.character.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(
      characters.map((c: any) => ({ ...c, createdAt: c.createdAt?.toISOString?.() ?? '' }))
    );
  } catch (error: any) {
    console.error('Characters GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { name, age, appearance, race, profession, traits, backstory } = body ?? {};
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const character = await prisma.character.create({
      data: {
        userId: session.user.id,
        name,
        age: age ?? null,
        appearance: appearance ?? null,
        race: race ?? null,
        profession: profession ?? null,
        traits: traits ?? null,
        backstory: backstory ?? null,
      },
    });
    return NextResponse.json({ ...character, createdAt: character.createdAt?.toISOString?.() ?? '' }, { status: 201 });
  } catch (error: any) {
    console.error('Characters POST error:', error);
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    const character = await prisma.character.findUnique({ where: { id } });
    if (!character || character.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.character.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Characters DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 });
  }
}
