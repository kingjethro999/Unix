"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { query } from "@/lib/db";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  redirectUrl: z.string().optional(),
});
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).optional(),
  redirectUrl: z.string().optional(),
});

function safeRedirect(value: string | undefined, fallback: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export async function signInAction(input: z.infer<typeof signInSchema>) {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success)
    return { error: "Enter a valid email address and password." };
  const result = await query<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [parsed.data.email.trim().toLowerCase()],
  );
  const user = result.rows[0];
  if (
    !user ||
    !(await verifyPassword(parsed.data.password, user.password_hash))
  )
    return { error: "Email or password is incorrect." };
  await createSession(user.id);
  redirect(safeRedirect(parsed.data.redirectUrl, "/create"));
}

export async function signUpAction(input: z.infer<typeof signUpSchema>) {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success)
    return { error: "Check the account details and try again." };
  try {
    const result = await query<{ id: string }>(
      "INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id",
      [
        parsed.data.email.trim().toLowerCase(),
        await hashPassword(parsed.data.password),
        parsed.data.fullName?.trim() || null,
      ],
    );
    await createSession(result.rows[0].id);
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "23505"
    )
      return { error: "An account with that email already exists." };
    throw error;
  }
  redirect(safeRedirect(parsed.data.redirectUrl, "/create"));
}

export async function signOutAction() {
  await destroySession();
  redirect("/");
}

const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});
const passwordResetSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8),
});

function resetTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordResetAction(input: { email: string }) {
  const parsed = passwordResetRequestSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid email address." };

  const email = parsed.data.email.trim().toLowerCase();
  const account = await query<{ id: string; email: string }>(
    "SELECT id, email FROM users WHERE email = $1",
    [email],
  );
  const user = account.rows[0];
  if (!user) return { ok: true };

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await query("DELETE FROM password_reset_tokens WHERE user_id = $1", [
    user.id,
  ]);
  await query(
    "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [user.id, resetTokenHash(token), expiresAt],
  );

  const smtpUser = process.env.GMAIL_SMTP_USER;
  const smtpPassword = process.env.GMAIL_APP_PASSWORD;
  if (!smtpUser || !smtpPassword) return { ok: true };

  const nodemailer = (await import("nodemailer")).default;
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  await nodemailer
    .createTransport({
      service: "gmail",
      auth: { user: smtpUser, pass: smtpPassword },
    })
    .sendMail({
      from: smtpUser,
      to: user.email,
      subject: "Reset your Unix password",
      text: `Reset your Unix password: ${resetUrl}\n\nThis link expires in one hour. If you did not ask for it, you can ignore this email.`,
      html: `<p>Reset your Unix password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in one hour. If you did not ask for it, you can ignore this email.</p>`,
    });
  return { ok: true };
}

export async function resetPasswordAction(input: {
  token: string;
  password: string;
}) {
  const parsed = passwordResetSchema.safeParse(input);
  if (!parsed.success)
    return { error: "Choose a password with at least eight characters." };
  const tokenHash = resetTokenHash(parsed.data.token);
  const result = await query<{ id: string; user_id: string }>(
    `DELETE FROM password_reset_tokens
      WHERE token_hash = $1 AND expires_at > now() AND used_at IS NULL
      RETURNING id, user_id`,
    [tokenHash],
  );
  const reset = result.rows[0];
  if (!reset)
    return {
      error: "This reset link is invalid or has expired. Request a new one.",
    };

  await query(
    "UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2",
    [await hashPassword(parsed.data.password), reset.user_id],
  );
  await query("DELETE FROM sessions WHERE user_id = $1", [reset.user_id]);
  return { ok: true };
}
