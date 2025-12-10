import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWeekStart, CATEGORIES } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const weeksBack = parseInt(searchParams.get("weeks") || "8", 10);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeksBack * 7);
  const weekStart = getWeekStart(startDate);

  const disrespects = await prisma.disrespect.findMany({
    where: {
      userId: user.id,
      weekStart: { gte: weekStart },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ disrespects });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { category, note, isShared } = await request.json();

    if (!category || !Object.keys(CATEGORIES).includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const weekStart = getWeekStart();

    const disrespect = await prisma.disrespect.create({
      data: {
        userId: user.id,
        category,
        note: note || null,
        weekStart,
        isShared: isShared || false,
      },
    });

    return NextResponse.json({ disrespect });
  } catch (error) {
    console.error("Create disrespect error:", error);
    return NextResponse.json(
      { error: "Failed to log disrespect" },
      { status: 500 }
    );
  }
}
