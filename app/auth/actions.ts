"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
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
