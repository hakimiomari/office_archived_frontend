"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/config/auth";

/**
 * Public self-signup form. Hits `POST /auth/register` which:
 *   - creates the Company,
 *   - auto-assigns the Basic plan (PERPETUAL),
 *   - creates the first user as COMPANY_ADMIN with the seeded `admin` role,
 *   - sets the same access/refresh cookies as /auth/sign-in,
 *   - and the hook redirects to /dashboard on success.
 */
export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { register, isRegistering } = useAuth();

  const [form, setForm] = useState({
    companyName: "",
    companySlug: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Live slug preview — admin can override, otherwise we derive it from
  // company name (lowercased, hyphenated, ascii-safe).
  const previewSlug = useMemo(() => {
    if (form.companySlug.trim()) return form.companySlug.trim().toLowerCase();
    return deriveSlug(form.companyName);
  }, [form.companyName, form.companySlug]);

  const passwordsMatch =
    form.password.length === 0 || form.password === form.confirmPassword;
  const passwordTooShort =
    form.password.length > 0 && form.password.length < 6;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordsMatch || passwordTooShort) return;
    await register(null, {
      companyName: form.companyName,
      companySlug: form.companySlug.trim() || undefined,
      name: form.name,
      email: form.email,
      password: form.password,
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your company</CardTitle>
          <CardDescription>
            Free Basic plan · no credit card · upgrade any time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            {/* Company */}
            <div className="grid gap-3">
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
                placeholder="Acme Trading Co."
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="companySlug">
                URL slug{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="companySlug"
                value={form.companySlug}
                onChange={(e) =>
                  setForm({ ...form, companySlug: e.target.value })
                }
                placeholder={previewSlug || "acme"}
                pattern="[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
                title="Lowercase letters, digits and hyphens. Cannot start or end with a hyphen."
              />
              {form.companyName && (
                <p className="text-xs text-muted-foreground">
                  Your tenant URL slug will be{" "}
                  <span className="font-mono">{previewSlug}</span>.
                </p>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Admin user */}
            <div className="grid gap-3">
              <Label htmlFor="name">Your full name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe"
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@acme.com"
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
              {passwordTooShort && (
                <p className="text-xs text-destructive">
                  Password must be at least 6 characters.
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                required
              />
              {!passwordsMatch && (
                <p className="text-xs text-destructive">
                  Passwords do not match.
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                isRegistering ||
                !form.companyName ||
                !form.name ||
                !form.email ||
                !form.password ||
                !passwordsMatch ||
                passwordTooShort
              }
              className="w-full cursor-pointer"
            >
              {isRegistering && <Loader2 className="animate-spin" />}
              Create company
            </Button>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <a href="/login" className="underline underline-offset-4">
                Sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
      <p className="text-muted-foreground text-center text-xs">
        By creating an account you agree to our{" "}
        <a href="#" className="underline underline-offset-4">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}

/** Mirrors the backend's slug derivation so the preview matches the
 *  value the server will actually persist. */
function deriveSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036F]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || ""
  );
}
