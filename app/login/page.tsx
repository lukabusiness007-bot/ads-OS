"use client"

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell message="Učitavanje prijave..." />}>
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
      return { email: null, error: "Pogrešno korisničko ime ili lozinka." };
    }
    const data = await res.json();
    return { email: data.email };
  } catch {
    return { email: null, error: "Nije moguće prepoznati korisničko ime." };
  }
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const intent = searchParams.get("intent");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const configured = isSupabaseConfigured();

  async function signInWithPassword() {
    setMessage("");

    const { email, error: resolveError } = await resolveIdentifier(identifier.trim());
    if (!email) {
      setMessage(resolveError ?? "Pogrešno korisničko ime ili lozinka.");
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

    setMessage(error ? error.message : "Proverite email da biste potvrdili nalog.");
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
        <p className="eyebrow">Prijava prodavca</p>
        <h1>Prijavite se na Veridian</h1>
        <p className="muted">
          {intent
            ? `Nastavite sa ${formatIntent(intent)} pilot planom, zatim kreirajte svoj prvi AR proizvod.`
            : "Pristupite svojim proizvodima, napretku generisanja, naplati, objavljenim stranicama i analitici."}
        </p>

        {!configured ? (
          <>
            <div className="assumptionNote">
              Pristup pilot nalogu još nije omogućen u ovom okruženju. Zakažite demo da biste pregledali tok rada i
              povezali produkcijski radni prostor.
            </div>
            <div className="assetGrid">
              <Link className="button accent" href={`/contact/demo${intent ? `?plan=${encodeURIComponent(intent)}` : ""}`}>
                Zakaži pilot demo
              </Link>
              <Link className="button secondary" href="/p/northline-home/arc-oak-dining-chair">
                Pogledaj primer stranice
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="identifier">Email ili korisničko ime</label>
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
              <label htmlFor="password">Lozinka</label>
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
                Prijavi se
              </button>
              {!isUsername && (
                <button className="button secondary" type="button" onClick={signUpWithPassword}>
                  Kreiraj nalog
                </button>
              )}
              <button className="button ghost" type="button" onClick={signInWithGoogle}>
                Nastavi sa Google nalogom
              </button>
            </div>
          </>
        )}

        <Link className="textLink" href="/">
          Nazad na sajt
        </Link>
      </>
    </LoginShell>
  );
}

function formatIntent(intent: string) {
  return intent
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function LoginShell({ children, message }: { children?: React.ReactNode; message?: string }) {
  return (
    <main className="authPage">
      <section className="panel form authPanel">
        {children ?? (
          <>
            <p className="eyebrow">Prijava prodavca</p>
            <h1>{message}</h1>
          </>
        )}
      </section>
    </main>
  );
}
