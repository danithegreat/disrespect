import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.toLowerCase().trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const prisma = await getPrisma();

  // Find users matching query (username or name), excluding self
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: user.id } },
        { searchable: true },
        {
          OR: [
            { username: { contains: query } },
            { name: { contains: query } },
          ],
        },
      ],
    },
    select: {
      id: true,
      username: true,
      name: true,
    },
    take: 5,
  });

  // Check existing friendships
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userId: user.id, friendId: { in: users.map((u) => u.id) } },
        { friendId: user.id, userId: { in: users.map((u) => u.id) } },
      ],
    },
  });

  const friendshipMap = new Map<string, string>();
  friendships.forEach((f) => {
    const otherId = f.userId === user.id ? f.friendId : f.userId;
    friendshipMap.set(otherId, f.status);
  });

  const usersWithStatus = users.map((u) => ({
    ...u,
    friendshipStatus: friendshipMap.get(u.id) || null,
  }));

  return NextResponse.json({ users: usersWithStatus });
}
