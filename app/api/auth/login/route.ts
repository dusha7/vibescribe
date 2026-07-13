export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user?.password) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 401 });
    }

    return NextResponse.json({ message: 'Успешный вход', userId: user.id });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Ошибка входа' }, { status: 500 });
  }
}
