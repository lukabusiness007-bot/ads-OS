"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { Menu, X } from "lucide-react"
import type { Lang } from "@/lib/translations"
import { translations } from "@/lib/translations"

export function MarketingNav({ lang = "en" }: { lang?: Lang }) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const t = translations[lang].nav

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  const homePath = lang === "sr" ? "/sr" : "/"
  const pricingPath = lang === "sr" ? "/sr/pricing" : "/pricing"

  const menuItems = [
    { name: t.features, href: `${homePath}#features` },
    { name: t.howItWorks, href: `${homePath}#how-it-works` },
    { name: t.pricing, href: pricingPath },
    { name: t.faq, href: `${homePath}#faq` },
  ]

  return (
    <header>
      <nav
        data-state={menuOpen ? "active" : undefined}
        className={`group fixed z-20 w-full border-b transition-all duration-300 ${
          scrolled
            ? "bg-[#fbfaf6]/80 backdrop-blur-[20px] shadow-sm shadow-[#17201a]/6 border-transparent"
            : "bg-[#fbfaf6]/95 backdrop-blur border-[#dce2d5]"
        }`}
      >
        <div className="m-auto max-w-5xl px-6">
          <div className={`flex flex-wrap items-center justify-between gap-6 py-3 transition-all duration-300 lg:flex-nowrap lg:gap-0 ${scrolled ? "lg:py-3" : "lg:py-4"}`}>
            <div className="flex w-full justify-between lg:w-auto">
              <Link href={homePath} aria-label="augmenta3D home" className="flex items-center">
                {/* Full lockup on sm+, compact cube mark on mobile */}
                <Logo theme="light" className="hidden sm:inline-flex" markClassName="h-8 w-auto" />
                <Logo variant="mark" theme="light" className="h-8 w-auto sm:hidden" />
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

            <div className={`group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-2xl border border-[#dce2d5] bg-[#fbfaf6] p-6 shadow-xl shadow-[#17201a]/8 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none ${lang === "sr" ? "lg:gap-2" : "lg:gap-6"}`}>
              <div className={lang === "sr" ? "lg:pr-2" : "lg:pr-4"}>
                <ul className={`space-y-6 text-base lg:flex lg:space-y-0 lg:text-sm ${lang === "sr" ? "lg:gap-2" : "lg:gap-4"}`}>
                  {menuItems.map((item, i) => (
                    <li key={i}>
                      <Link
                        href={item.href}
                        className="text-[#697266] hover:text-[#17201a] block duration-150"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`flex w-full flex-col space-y-3 sm:flex-row sm:space-y-0 md:w-fit lg:border-l ${lang === "sr" ? "sm:gap-2 lg:pl-3" : "sm:gap-3 lg:pl-6"}`}>
                {/* Language switcher — shows only the other language */}
                <Link
                  href={lang === "sr" ? "/" : "/sr"}
                  className="px-2.5 py-1.5 border border-[#dce2d5] rounded-md text-sm font-semibold text-[#697266] hover:text-[#17201a] transition-colors"
                >
                  {lang === "sr" ? "EN" : "SR"}
                </Link>

                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">{t.login}</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/p/northline-home/arc-oak-dining-chair">{t.samplePage}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/contact/demo">{t.bookDemo}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
