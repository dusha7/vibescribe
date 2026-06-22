import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title } = await req.json();
  const story = await db.story.create({ data: { userId: session.user.id, title: title ?? "Untitled Story" } });
  return NextResponse.json({ storyId: story.id });
}