"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordResetAction } from "@/app/auth/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <AuthCard
      title="Reset password"
      description="We’ll send a secure reset link to your email."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          startTransition(async () => {
            const result = await requestPasswordResetAction({ email });
            if (result.error) return setError(result.error);
            setNotice(
              "If an account uses that email, a reset link is on its way.",
            );
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {notice && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {notice}
          </p>
        )}
        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? "Sending link…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link className="text-primary hover:underline" href="/sign-in">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
