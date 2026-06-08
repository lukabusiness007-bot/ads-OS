"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { HeroGem } from "@/components/HeroGem";

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  /** Error / status message shown above the submit button. */
  error?: React.ReactNode;
  /** Disables the submit button and shows a loading label. */
  loading?: boolean;
  /** Submit button label. Defaults to "Sign In". */
  submitLabel?: string;
  /** First field config — lets the page accept "email or username". */
  identifierLabel?: string;
  identifierPlaceholder?: string;
  identifierType?: "email" | "text";
  /** Override the bottom footer (e.g. "Already have an account? Sign in"). */
  footer?: React.ReactNode;
  /** Hide the "Keep me signed in / Reset password" row (e.g. on register). */
  showOptions?: boolean;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/60 focus-within:bg-primary/5">
    {children}
  </div>
);

const TestimonialMarquee = ({ testimonials }: { testimonials: Testimonial[] }) => {
  const items = [...testimonials, ...testimonials];
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
      }}
    >
      <div className="flex gap-4 animate-marquee py-1">
        {items.map((t, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl bg-emerald-900/40 border border-emerald-700/40 p-4 w-72 shrink-0"
          >
            <img src={t.avatarSrc} className="h-9 w-9 object-cover rounded-xl shrink-0" alt={t.name} />
            <div className="leading-snug">
              <p className="text-sm font-semibold text-emerald-100">{t.name}</p>
              <p className="text-xs text-emerald-400">{t.handle}</p>
              <p className="mt-1 text-xs text-emerald-200/75 leading-relaxed">{t.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  error,
  loading = false,
  submitLabel = "Sign In",
  identifierLabel = "Email Address",
  identifierPlaceholder = "Enter your email address",
  identifierType = "email",
  footer,
  showOptions = true,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-[100dvw]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">{identifierLabel}</label>
                <GlassInputWrapper>
                  <input
                    name="identifier"
                    type={identifierType}
                    autoComplete={identifierType === "email" ? "email" : "username email"}
                    placeholder={identifierPlaceholder}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={submitLabel.toLowerCase().includes("create") ? "new-password" : "current-password"}
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {showOptions && (
                <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                    <span className="text-foreground/90">Keep me signed in</span>
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onResetPassword?.();
                    }}
                    className="hover:underline text-primary transition-colors"
                  >
                    Reset password
                  </a>
                </div>
              )}

              {error && (
                <div className="animate-element rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Please wait…" : submitLabel}
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">Or continue with</span>
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              {footer ?? (
                <>
                  New to Augmenta?{" "}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onCreateAccount?.();
                    }}
                    className="text-primary hover:underline transition-colors"
                  >
                    Create Account
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Right column: emerald brand panel */}
      <section className="hidden md:flex flex-1 relative p-4">
        <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl overflow-hidden bg-emerald-950 flex flex-col">
          {/* Glow accents */}
          <div className="glow-blob glow-blob--emerald w-[420px] h-64 -top-16 left-1/2 -translate-x-1/2 opacity-70" />
          <div className="glow-blob glow-blob--emerald w-56 h-40 bottom-32 -right-16 opacity-40" />

          {/* Dot grid */}
          <div className="absolute inset-0 bg-dotgrid opacity-50 pointer-events-none" />

          {/* Center: gem + tagline */}
          <div className="flex-1 flex flex-col items-center justify-center gap-5 relative z-10 px-10 text-center">
            <div className="w-44 h-44">
              <HeroGem />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Augmenta</p>
              <h2 className="text-2xl font-semibold text-white leading-snug">
                Turn photos into AR<br />product pages
              </h2>
              <p className="mt-2 text-sm text-emerald-200/60 leading-relaxed">
                Verified 3D/AR experiences your shoppers can trust.
              </p>
            </div>
          </div>

          {/* Testimonials marquee */}
          {testimonials.length > 0 && (
            <div className="relative z-10 pb-8">
              <TestimonialMarquee testimonials={testimonials} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
