"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { resetPasswordAction } from "@/app/auth/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AuthCard
      title="Choose a new password"
      description="Use at least eight characters."
    >
      {complete ? (
        <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">
          Password changed.{" "}
          <Link className="text-primary hover:underline" href="/sign-in">
            Sign in
          </Link>
        </p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            if (password !== confirmPassword)
              return setError("Passwords do not match.");
            startTransition(async () => {
              const result = await resetPasswordAction({ token, password });
              if (result.error) return setError(result.error);
              setComplete(true);
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" type="submit" disabled={pending || !token}>
            {pending ? "Updating password…" : "Update password"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
