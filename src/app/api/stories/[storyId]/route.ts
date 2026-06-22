import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
export async function GET(req: NextRequest, { params }: { params: { storyId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const story = await db.story.findFirst({
    where: { id: params.storyId, userId: session.user.id },
    include: { lorebook: true, chapters: { orderBy: { chapterNumber: "asc" } } }
  });
  if (!story) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(story);
}