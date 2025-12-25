import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = await getPrisma();
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userId: user.id, status: "accepted" },
        { friendId: user.id, status: "accepted" },
      ],
    },
    include: {
      user: { select: { id: true, name: true, email: true, username: true } },
      friend: { select: { id: true, name: true, email: true, username: true } },
    },
  });

  const friends = friendships.map((f) =>
    f.userId === user.id ? f.friend : f.user
  );

  const pendingRequests = await prisma.friendship.findMany({
    where: { friendId: user.id, status: "pending" },
    include: {
      user: { select: { id: true, name: true, email: true, username: true } },
    },
  });

  return NextResponse.json({
    friends,
    pendingRequests: pendingRequests.map((r) => ({
      id: r.id,
      from: r.user,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prisma = await getPrisma();
    const { friendId } = await request.json();

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID required" }, { status: 400 });
    }

    if (friendId === user.id) {
      return NextResponse.json(
        { error: "Cannot add yourself" },
        { status: 400 }
      );
    }

    const friend = await prisma.user.findUnique({ where: { id: friendId } });
    if (!friend) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: friendId },
          { userId: friendId, friendId: user.id },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Friend request already exists" },
        { status: 400 }
      );
    }

    await prisma.friendship.create({
      data: {
        userId: user.id,
        friendId: friendId,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, friendName: friend.name });
  } catch (error) {
    console.error("Add friend error:", error);
    return NextResponse.json(
      { error: "Failed to send friend request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prisma = await getPrisma();
    const { friendshipId, action } = await request.json();

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship || friendship.friendId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (action === "accept") {
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: "accepted" },
      });
    } else if (action === "reject") {
      await prisma.friendship.delete({ where: { id: friendshipId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Friend action error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
