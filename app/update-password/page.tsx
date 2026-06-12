"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function UpdatePasswordPage() {
  const configured = isSupabaseConfigured();
  // Without Supabase there is no recovery session to find — skip straight to
  // the invalid-link state instead of probing in the effect.
  const [hasSession, setHasSession] = useState<boolean | null>(configured ? null : false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!configured) return;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user));
    });
  }, [configured]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    window.setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1500);
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
            Set a new password
          </h1>

          {hasSession === null && (
            <p className="animate-element animate-delay-200 text-white/55">Checking your reset link…</p>
          )}

          {hasSession === false && (
            <div className="animate-element animate-delay-200 flex flex-col gap-4">
              <p className="text-white/65">
                This password reset link is invalid or has expired. Request a new one to continue.
              </p>
              <Link href="/reset-password" className="text-[#6ee7b7] hover:underline transition-colors">
                Request a new link
              </Link>
            </div>
          )}

          {hasSession === true && success && (
            <p className="animate-element animate-delay-200 text-white/65">
              Your password has been updated. Redirecting to your dashboard…
            </p>
          )}

          {hasSession === true && !success && (
            <>
              <p className="animate-element animate-delay-200 text-white/55">
                Choose a new password for your account.
              </p>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-white/65">New password</label>
                  <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm transition-colors focus-within:border-[#6ee7b7]/50 focus-within:bg-white/15">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="new-password"
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-white placeholder:text-white/35"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-white/45 hover:text-white transition-colors" />
                        ) : (
                          <Eye className="w-5 h-5 text-white/45 hover:text-white transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="animate-element animate-delay-400">
                  <label className="text-sm font-medium text-white/65">Confirm new password</label>
                  <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm transition-colors focus-within:border-[#6ee7b7]/50 focus-within:bg-white/15">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                  className="animate-element animate-delay-500 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Please wait…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
