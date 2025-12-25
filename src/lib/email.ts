import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const resend = getResend();

  if (!resend) {
    console.log("\n========== DEV MODE: Password Reset ==========");
    console.log(`Email: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("===============================================\n");
    return;
  }

  const { error } = await resend.emails.send({
    from: "Disrespect <noreply@resend.dev>",
    to: email,
    subject: "Reset your password",
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });

  if (error) {
    console.error("Email error:", error);
    throw new Error("Failed to send email");
  }
}
