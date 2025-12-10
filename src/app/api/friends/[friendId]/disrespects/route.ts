import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWeekStart } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendId } = await params;

  // Verify friendship
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: user.id, friendId, status: "accepted" },
        { userId: friendId, friendId: user.id, status: "accepted" },
      ],
    },
  });

  if (!friendship) {
    return NextResponse.json({ error: "Not friends" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const weeksBack = parseInt(searchParams.get("weeks") || "8", 10);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeksBack * 7);
  const weekStart = getWeekStart(startDate);

  const disrespects = await prisma.disrespect.findMany({
    where: {
      userId: friendId,
      isShared: true,
      weekStart: { gte: weekStart },
    },
    orderBy: { createdAt: "desc" },
  });

  const friend = await prisma.user.findUnique({
    where: { id: friendId },
    select: { name: true },
  });

  return NextResponse.json({ disrespects, friendName: friend?.name });
}
