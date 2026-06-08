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
  error?: React.ReactNode;
  loading?: boolean;
  submitLabel?: string;
  identifierLabel?: string;
  identifierPlaceholder?: string;
  identifierType?: "email" | "text";
  footer?: React.ReactNode;
  showOptions?: boolean;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

const DarkInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm transition-colors focus-within:border-emerald-400/50 focus-within:bg-white/15">
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
            className="flex items-start gap-3 rounded-2xl p-4 w-72 shrink-0"
            style={{ background: "rgba(14,45,28,0.90)", border: "1px solid rgba(52,211,153,0.15)" }}
          >
            <img src={t.avatarSrc} className="h-9 w-9 object-cover rounded-xl shrink-0" alt={t.name} />
            <div className="leading-snug">
              <p className="text-sm font-semibold text-white">{t.name}</p>
              <p className="text-xs text-emerald-400">{t.handle}</p>
              <p className="mt-1 text-xs text-white/65 leading-relaxed">{t.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light tracking-tighter text-white">Welcome</span>,
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

      {/* Left column: premium dark green */}
      <section
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: "linear-gradient(150deg, #0e2d1c 0%, #071510 100%)" }}
      >
        {/* Subtle glow */}
        <div className="glow-blob glow-blob--emerald w-[480px] h-64 top-0 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-white">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-white/55">{description}</p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-white/65">{identifierLabel}</label>
                <DarkInputWrapper>
                  <input
                    name="identifier"
                    type={identifierType}
                    autoComplete={identifierType === "email" ? "email" : "username email"}
                    placeholder={identifierPlaceholder}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder:text-white/35"
                  />
                </DarkInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-white/65">Password</label>
                <DarkInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={submitLabel.toLowerCase().includes("create") ? "new-password" : "current-password"}
                      placeholder="Enter your password"
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
                </DarkInputWrapper>
              </div>

              {showOptions && (
                <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                    <span className="text-white/80">Keep me signed in</span>
                  </label>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); onResetPassword?.(); }}
                    className="hover:underline text-emerald-400 transition-colors"
                  >
                    Reset password
                  </a>
                </div>
              )}

              {error && (
                <div className="animate-element rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-300">
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

            {/* Divider — flex pattern works on any background */}
            <div className="animate-element animate-delay-700 flex items-center gap-3">
              <span className="flex-1 border-t border-white/15" />
              <span className="text-sm text-white/40">Or continue with</span>
              <span className="flex-1 border-t border-white/15" />
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-white/15 rounded-2xl py-4 text-white hover:bg-white/10 transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-white/50">
              {footer ?? (
                <>
                  New to Augmenta?{" "}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }}
                    className="text-emerald-400 hover:underline transition-colors"
                  >
                    Create Account
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Right column: white — gem floats directly on white */}
      <section className="hidden md:flex flex-1 relative p-4">
        <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl overflow-hidden bg-white flex flex-col">
          {/* Gem fills available space */}
          <div className="flex-1 relative z-10">
            <HeroGem />
          </div>

          {/* Testimonials — dark cards on white */}
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
