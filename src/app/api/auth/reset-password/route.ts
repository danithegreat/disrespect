import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma();
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    if (resetRecord.used || resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Reset link has expired" },
        { status: 400 }
      );
    }

    // Update password
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    // Invalidate all sessions for this user
    await prisma.session.deleteMany({ where: { userId: resetRecord.userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
