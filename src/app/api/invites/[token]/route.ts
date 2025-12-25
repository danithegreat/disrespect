import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const prisma = await getPrisma();

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    return NextResponse.json({
      valid: true,
      inviter: {
        id: invite.user.id,
        name: invite.user.name,
        username: invite.user.username,
      },
    });
  } catch (error) {
    console.error("Validate invite error:", error);
    return NextResponse.json(
      { error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}
