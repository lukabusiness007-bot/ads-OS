"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const configured = isSupabaseConfigured();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!configured) {
      setError("Password reset is not enabled in this environment yet.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/update-password")}`,
    });
    setLoading(false);
    // Always show the same confirmation, regardless of whether the account
    // exists, so this form can't be used to enumerate registered emails.
    setSubmitted(true);
  }

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center p-6"
      style={{ background: "linear-gradient(150deg, #17201a 0%, #0c1a10 100%)" }}
    >
      <div className="relative w-full max-w-md">
        <div className="glow-blob glow-blob--emerald w-[480px] h-64 top-0 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="animate-element animate-delay-100">
            <Logo theme="dark" markClassName="h-9 w-auto" wordmarkClassName="text-2xl font-semibold leading-none tracking-tight" />
          </div>
          <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight text-white">
            Reset your password
          </h1>

          {submitted ? (
            <div className="animate-element animate-delay-200 flex flex-col gap-4">
              <p className="text-white/65">
                If an account exists for <strong className="text-white">{email}</strong>, we&apos;ve
                sent a link to reset your password. Check your inbox.
              </p>
              <Link href="/login" className="text-[#6ee7b7] hover:underline transition-colors">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="animate-element animate-delay-200 text-white/55">
                Enter the email address on your account and we&apos;ll send you a link to reset your
                password.
              </p>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-white/65">Email address</label>
                  <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm transition-colors focus-within:border-[#6ee7b7]/50 focus-within:bg-white/15">
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder:text-white/35"
                    />
                  </div>
                </div>

                {error && (
                  <div className="animate-element rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="animate-element animate-delay-400 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Please wait…" : "Send reset link"}
                </button>
              </form>

              <p className="animate-element animate-delay-500 text-center text-sm text-white/50">
                <Link href="/login" className="text-[#6ee7b7] hover:underline transition-colors">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
