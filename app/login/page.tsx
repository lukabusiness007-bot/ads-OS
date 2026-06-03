"use client"

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell message="Loading login..." />}>
      <LoginPageContent />
    </Suspense>
  );
}

function isEmailAddress(value: string) {
  return value.includes("@");
}

async function resolveIdentifier(identifier: string): Promise<{ email: string | null; error?: string }> {
  if (isEmailAddress(identifier)) {
    return { email: identifier };
  }

  // Username → email lookup via server route (uses service role, never reaches browser)
  try {
    const res = await fetch("/api/auth/resolve-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: identifier })
    });
    if (!res.ok) {
      return { email: null, error: "Invalid username or password." };
    }
    const data = await res.json();
    return { email: data.email };
  } catch {
    return { email: null, error: "Could not resolve username." };
  }
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const configured = isSupabaseConfigured();

  async function signInWithPassword() {
    setMessage("");

    const { email, error: resolveError } = await resolveIdentifier(identifier.trim());
    if (!email) {
      setMessage(resolveError ?? "Invalid username or password.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    // Check is_platform_admin via profile (client reads its own row; RLS permits this)
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_platform_admin")
      .eq("id", data.user.id)
      .single();

    if (profile?.is_platform_admin) {
      window.location.href = "/admin";
    } else {
      window.location.href = next;
    }
  }

  async function signUpWithPassword() {
    setMessage("");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email: identifier.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    setMessage(error ? error.message : "Check your email to confirm the account.");
  }

  async function signInWithGoogle() {
    setMessage("");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (error) {
      setMessage(error.message);
    }
  }

  const isUsername = identifier.trim() && !isEmailAddress(identifier.trim());

  return (
    <LoginShell>
      <>
        <p className="eyebrow">Merchant login</p>
        <h1>Sign in to Veridian</h1>
        <p className="muted">Access your products, generation jobs, billing, published pages, and analytics.</p>

        {!configured ? (
          <div className="assumptionNote">
            Supabase is not configured yet. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to
            enable real logins.
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="identifier">Email or username</label>
              <input
                id="identifier"
                type={isUsername ? "text" : "email"}
                value={identifier}
                autoComplete="username email"
                onChange={(event) => setIdentifier(event.target.value)}
                onKeyDown={(e) => e.key === "Enter" && signInWithPassword()}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(e) => e.key === "Enter" && signInWithPassword()}
              />
            </div>
            {message && <div className="assumptionNote">{message}</div>}
            <div className="assetGrid">
              <button className="button accent" type="button" onClick={signInWithPassword}>
                Sign in
              </button>
              {!isUsername && (
                <button className="button secondary" type="button" onClick={signUpWithPassword}>
                  Create account
                </button>
              )}
              <button className="button ghost" type="button" onClick={signInWithGoogle}>
                Continue with Google
              </button>
            </div>
          </>
        )}

        <Link className="textLink" href="/">
          Back to site
        </Link>
      </>
    </LoginShell>
  );
}

function LoginShell({ children, message }: { children?: React.ReactNode; message?: string }) {
  return (
    <main className="authPage">
      <section className="panel form authPanel">
        {children ?? (
          <>
            <p className="eyebrow">Merchant login</p>
            <h1>{message}</h1>
          </>
        )}
      </section>
    </main>
  );
}
