import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const chapterId = searchParams.get("chapterId");
  if (!chapterId) return NextResponse.json({ error: "Missing chapterId" }, { status: 400 });

  const chapter = await db.chapter.findFirst({
    where: {
      id: chapterId,
      story: { userId: session.user.id },
    },
    select: {
      status: true,
    },
  });

  if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ status: chapter.status, segments: [] });
}
