import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { storyId, format } = await req.json();
  const story = await db.story.findFirst({ where: { id: storyId, userId: session.user.id } });
  if (!story) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const count = await db.chapter.count({ where: { storyId } });
  const chapter = await db.chapter.create({ data: { storyId, chapterNumber: count + 1, format: format ?? "STANDARD", status: "GENERATING" } });
  return NextResponse.json({ chapterId: chapter.id });
}