import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { getWeekStart, WIN_CATEGORIES } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = await getPrisma();
  const searchParams = request.nextUrl.searchParams;
  const weeksBack = parseInt(searchParams.get("weeks") || "8", 10);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeksBack * 7);
  const weekStart = getWeekStart(startDate);

  const wins = await prisma.win.findMany({
    where: {
      userId: user.id,
      weekStart: { gte: weekStart },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ wins });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prisma = await getPrisma();
    const { category, note, isShared } = await request.json();

    if (!category || !Object.keys(WIN_CATEGORIES).includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const weekStart = getWeekStart();

    const win = await prisma.win.create({
      data: {
        userId: user.id,
        category,
        note: note || null,
        weekStart,
        isShared: isShared || false,
      },
    });

    return NextResponse.json({ win });
  } catch (error) {
    console.error("Create win error:", error);
    return NextResponse.json(
      { error: "Failed to log win" },
      { status: 500 }
    );
  }
}
