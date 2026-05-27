"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import type { Lang } from "@/lib/translations"
import { translations } from "@/lib/translations"

export function MarketingNav({ lang = "en" }: { lang?: Lang }) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const t = translations[lang].nav

  const menuItems = [
    { name: t.features, href: "#features" },
    { name: t.howItWorks, href: "#how-it-works" },
    { name: t.pricing, href: "#pricing" },
    { name: t.faq, href: "#faq" },
  ]

  return (
    <header>
      <nav
        data-state={menuOpen ? "active" : undefined}
        className="group fixed z-20 w-full border-b border-dashed bg-white/90 backdrop-blur"
      >
        <div className="m-auto max-w-5xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link href={lang === "sr" ? "/sr" : "/"} aria-label="home" className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-900 text-xs font-extrabold text-white">
                  AR
                </span>
                <span className="font-bold text-zinc-900 hidden sm:block">Veridian AR Commerce</span>
              </Link>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="group-data-[state=active]:opacity-0 group-data-[state=active]:scale-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:opacity-100 group-data-[state=active]:scale-100 absolute inset-0 m-auto size-6 opacity-0 scale-0 duration-200" />
              </button>
            </div>

            <div className="group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border bg-white p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="lg:pr-4">
                <ul className="space-y-6 text-base lg:flex lg:gap-8 lg:space-y-0 lg:text-sm">
                  {menuItems.map((item, i) => (
                    <li key={i}>
                      <Link
                        href={item.href}
                        className="text-zinc-500 hover:text-zinc-900 block duration-150"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:border-l lg:pl-6">
                {/* Language switcher */}
                <div className="flex items-center gap-1 border border-zinc-200 rounded-md overflow-hidden text-sm font-semibold">
                  <Link
                    href="/"
                    className={`px-2.5 py-1.5 transition-colors ${lang === "en" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
                  >
                    EN
                  </Link>
                  <Link
                    href="/sr"
                    className={`px-2.5 py-1.5 transition-colors ${lang === "sr" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
                  >
                    SR
                  </Link>
                </div>

                <Button asChild variant="outline" size="sm">
                  <Link href="/p/northline-home/arc-oak-dining-chair">{t.samplePage}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/dashboard">{t.bookDemo}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
