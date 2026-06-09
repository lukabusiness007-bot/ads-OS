"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SignInPage, type Testimonial } from "@/components/ui/sign-in";
import { Logo } from "@/components/Logo";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=2160&q=80";

const TESTIMONIALS: Testimonial[] = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "Sarah Chen",
    handle: "@northlinehome",
    text: "Shoppers can finally see our pieces at true scale in their room. Returns dropped almost overnight.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
    name: "Marcus Johnson",
    handle: "@marcusmakes",
    text: "Four photos in, a verified 3D/AR product page out. The whole catalogue went live in a weekend.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "The AR view does the selling for us. Confident buyers, fewer questions, cleaner checkout.",
  },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function isEmailAddress(value: string) {
  return value.includes("@");
}

async function resolveIdentifier(
  identifier: string
): Promise<{ email: string | null; error?: string }> {
  if (isEmailAddress(identifier)) {
    return { email: identifier };
  }

  // Username → email lookup via server route (uses service role, never reaches browser)
  try {
    const res = await fetch("/api/auth/resolve-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: identifier }),
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

  const [view, setView] = useState<"signin" | "register">("signin");
  const [error, setError] = useState<React.ReactNode>("");
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!configured) {
      setError("Pilot account access is not enabled in this environment yet.");
      return;
    }
    if (!identifier || !password) {
      setError("Please enter your email/username and password.");
      return;
    }

    setLoading(true);

    if (view === "register") {
      const supabase = createBrowserSupabaseClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: identifier,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setLoading(false);
      setError(
        signUpError ? signUpError.message : "Check your email to confirm the account."
      );
      return;
    }

    const { email, error: resolveError } = await resolveIdentifier(identifier);
    if (!email) {
      setLoading(false);
      setError(resolveError ?? "Invalid username or password.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_platform_admin")
      .eq("id", data.user.id)
      .single();

    window.location.href = profile?.is_platform_admin ? "/admin" : next;
  }

  async function handleGoogleSignIn() {
    setError("");
    if (!configured) {
      setError("Google sign-in is not enabled in this environment yet.");
      return;
    }
    const supabase = createBrowserSupabaseClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
    }
  }

  function handleResetPassword() {
    setError("Enter your email above, then contact support to reset your password.");
  }

  const isRegister = view === "register";

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        logo={
          <Logo
            theme="dark"
            markClassName="h-9 w-auto"
            wordmarkClassName="text-2xl font-semibold leading-none tracking-tight"
          />
        }
        title={
          <span className="font-light tracking-tighter">
            {isRegister ? "Create your" : "Welcome to"}{" "}
            <span className="font-semibold text-primary">Augmenta</span>
          </span>
        }
        description={
          isRegister
            ? "Start turning a few product photos into verified 3D/AR pages your shoppers can trust."
            : "Access your products, generation progress, billing, published pages, and analytics."
        }
        heroImageSrc={HERO_IMAGE}
        testimonials={TESTIMONIALS}
        error={error || undefined}
        loading={loading}
        submitLabel={isRegister ? "Create Account" : "Sign In"}
        identifierLabel={isRegister ? "Email Address" : "Email or username"}
        identifierPlaceholder={
          isRegister ? "Enter your email address" : "Enter your email or username"
        }
        identifierType={isRegister ? "email" : "text"}
        showOptions={!isRegister}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={() => {
          setError("");
          setView("register");
        }}
        footer={
          isRegister ? (
            <>
              Already have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setError("");
                  setView("signin");
                }}
                className="text-primary hover:underline transition-colors"
              >
                Sign in
              </a>
            </>
          ) : undefined
        }
      />
    </div>
  );
}
