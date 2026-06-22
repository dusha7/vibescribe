import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardClient } from "./dashboard-client";
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  const [stories, wallet] = await Promise.all([
    db.story.findMany({ where: { userId: session.user.id, status: { not: "DELETED" } }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { chapters: true } } }, take: 20 }),
    db.wallet.findUnique({ where: { userId: session.user.id }, select: { balanceSparks: true } }),
  ]);
  return <DashboardClient stories={stories as any} sparks={wallet?.balanceSparks ?? 0} userName={session.user.name ?? "Writer"} />;
}