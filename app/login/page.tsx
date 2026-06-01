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

function LoginPageContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const configured = isSupabaseConfigured();

  async function signInWithPassword() {
    setMessage("");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = next;
  }

  async function signUpWithPassword() {
    setMessage("");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email,
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
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {message && <div className="assumptionNote">{message}</div>}
            <div className="assetGrid">
              <button className="button accent" type="button" onClick={signInWithPassword}>
                Sign in
              </button>
              <button className="button secondary" type="button" onClick={signUpWithPassword}>
                Create account
              </button>
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
