import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma();
    const { email, password, name, username, inviteToken } = await request.json();

    if (!email || !password || !name || !username) {
      return NextResponse.json(
        { error: "Email, password, name, and username are required" },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric, underscores, 3-20 chars)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters, letters, numbers, and underscores only" },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const existingUsername = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, username: username.toLowerCase() },
    });

    // If signed up via invite, create bidirectional friendship
    if (inviteToken) {
      const invite = await prisma.invite.findUnique({
        where: { token: inviteToken },
      });

      if (invite && new Date() <= invite.expiresAt) {
        // Create friendship in both directions (auto-accepted)
        await prisma.friendship.createMany({
          data: [
            { userId: invite.userId, friendId: user.id, status: "accepted" },
            { userId: user.id, friendId: invite.userId, status: "accepted" },
          ],
        });
      }
    }

    const token = await createSession(user.id);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, username: user.username },
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
