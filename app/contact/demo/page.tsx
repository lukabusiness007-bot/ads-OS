import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing-nav";
import { buildSeoMetadata, jsonLd, faqPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Book a Furniture AR Pilot Demo",
  description:
    "Book an Augmenta pilot demo and see how guided photo upload, human review, hosted product links, and analytics fit your furniture catalog.",
  path: "/contact/demo",
  lang: "en",
  alternates: { en: "/contact/demo", sr: "/contact/demo", "x-default": "/contact/demo" }
});

export default function DemoContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(faqPageJsonLd([
          {
            question: "Which furniture products are best for an AR pilot?",
            answer: "Start with high-consideration products where shoppers most often ask about size, scale, fit, or material — sofas, dining tables, chairs, and large shelving units are typical first picks.",
          },
          {
            question: "How should my team photograph products?",
            answer: "Use 4 clean product photos: front, side or three-quarter angle, back, and a material detail shot. Consistent lighting and a plain background give the best generation results.",
          },
          {
            question: "What does the quality review check?",
            answer: "A human reviewer checks model resemblance, scale, orientation, file loading, and AR readiness before the page is published. You only pay for approved models.",
          },
        ]))}
      />
      <MarketingNav lang="en" />

      <main className="pt-24">
        <section className="mx-auto grid max-w-5xl gap-10 px-6 py-20 lg:grid-cols-[1fr_0.85fr] lg:items-start">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-emerald-700">
              Pilot demo
            </p>
            <h1 className="mb-5 text-4xl font-semibold leading-tight text-zinc-900 text-balance md:text-5xl">
              See how AR product pages would work for your first 10-25 furniture SKUs.
            </h1>
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-zinc-500">
              We will review your catalog fit, photo workflow, model quality expectations, hosted links, and the
              analytics you need before you publish a paid pilot.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="mailto:hello@veridianar.com?subject=Augmenta%20pilot%20demo">
                  Email us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/p/northline-home/arc-oak-dining-chair">View sample page</Link>
              </Button>
            </div>
          </div>

          <aside className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900">What we cover</h2>
            <div className="grid gap-3">
              {[
                "Which products are best for a first pilot",
                "How your team should photograph each item",
                "What quality review checks before publishing",
                "Where hosted links fit into your store, ads, emails, or QR codes",
                "How to read AR clicks and store CTA clicks"
              ].map((item) => (
                <div className="flex gap-3 rounded-md border border-zinc-200 bg-white p-3" key={item}>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-sm font-medium leading-relaxed text-zinc-700">{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
