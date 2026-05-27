export type Lang = "en" | "sr"

export const translations = {
  en: {
    nav: {
      features: "Features",
      howItWorks: "How it works",
      pricing: "Pricing",
      faq: "FAQ",
      samplePage: "Sample page",
      bookDemo: "Book demo",
    },
    hero: {
      eyebrow: "Without hiring a 3D team",
      heading: "Verified AR product pages for furniture stores",
      body: "Upload product photos, get a quality-checked 3D/AR product page, and give shoppers a clearer way to understand size, scale, and detail before they buy.",
      cta: "Book pilot demo",
      ctaSecondary: "See sample product page",
    },
    platforms: {
      label: "Works alongside your existing ecommerce stack",
    },
    problem: {
      eyebrow: "The merchant problem",
      heading: "Shoppers want to understand furniture spatially before they commit.",
      p1: "Static photos do not always communicate scale, depth, fit, or material detail. For many SMB stores, hiring a 3D team or managing model files adds too much operational overhead for a 10 to 25 SKU pilot.",
      p2: "Veridian keeps the offer narrow: Upload photos. We generate, check, and host the AR product page.",
    },
    howItWorks: {
      eyebrow: "How it works",
      heading: "A simple path from product photos to a live hosted page.",
    },
    workflow: [
      { step: "Add product", copy: "Enter the product name, dimensions, category, and store URL." },
      { step: "Upload photos", copy: "Use a guided checklist for front, back, side, angled, detail, and scale photos." },
      { step: "Review model", copy: "Review the visual preview after Veridian generation and manual quality checks." },
      { step: "Publish link", copy: "Publish a hosted product link after approval." },
      { step: "Track results", copy: "Track page views, AR clicks, and clicks back to your store." },
    ],
    whatYouGet: {
      eyebrow: "What you get",
      heading: "Hosted links you can add to your store, ads, emails, or QR codes.",
      body: "Give shoppers a clearer sense of size, scale, and detail before they buy, then track whether they engage and click back to your store.",
    },
    features: [
      "Hosted public product page",
      "3D viewer and AR launch where supported",
      "Merchant CTA back to store",
      "3D preview generated and verified",
      "Product-level analytics",
    ],
    quality: {
      eyebrow: "Quality & trust",
      heading: "Human-reviewed before publishing.",
      body: "Veridian checks model resemblance, scale, orientation, file loading, and AR readiness before a page goes live.",
    },
    qualityChecks: ["Resemblance", "Scale", "Orientation", "File loading", "AR readiness"],
    dashboard: {
      eyebrow: "Dashboard preview",
      heading: "Pilot Command Center",
      body: "Catalog status, next actions, published pages, AR clicks, CTA clicks, and plan usage stay visible on one merchant workspace.",
      stats: [
        { label: "Published pages", value: "1 / 25" },
        { label: "AR clicks", value: "188" },
        { label: "Store clicks", value: "94" },
        { label: "Next actions", value: "2" },
      ],
    },
    pricing: {
      eyebrow: "Pilot offer",
      heading: "Built for the first 10 to 25 furniture or home decor SKUs.",
      body: "Pricing is predictable: a per-approved-model fee plus a monthly hosted-page subscription.",
    },
    faqSection: {
      eyebrow: "FAQ",
      heading: "Answers for a paid pilot decision.",
    },
    faqItems: [
      {
        question: "Will this increase buyer confidence enough to matter?",
        answer:
          "The pilot is designed to test clearer product understanding: size and scale confidence, 3D viewer engagement, AR clicks, and clicks back to your store. We do not promise guaranteed conversion lift.",
      },
      {
        question: "How hard is setup for my team?",
        answer:
          "Your team adds a product, uploads guided photos, reviews the preview, publishes the link, and tracks results. No internal 3D team is required.",
      },
      {
        question: "What happens if the model quality is bad?",
        answer:
          "A human reviewer checks each model before publishing. If resemblance, scale, orientation, loading, or AR readiness is not acceptable, the page stays unpublished while the model is revised or regenerated.",
      },
      {
        question: "How predictable is pricing?",
        answer:
          "A typical pilot uses a per-approved-model fee and a monthly hosted-page subscription. Starter models are 30 to 50 EUR, standard verified models are 70 to 120 EUR, and hosted pages are 49 to 99 EUR per month.",
      },
      {
        question: "How do I prove this is working?",
        answer:
          "The dashboard tracks page views, viewer interactions, AR clicks, store CTA clicks, and device mix by product, so you can compare engagement across pilot SKUs.",
      },
      {
        question: "Doesn't Shopify already display 3D models?",
        answer:
          "Shopify can display 3D models if you already have the right files. Veridian helps create, check, host, publish, and measure AR product pages without asking your team to manage a 3D pipeline.",
      },
    ],
    finalCta: {
      eyebrow: "Ready for a focused pilot?",
      heading: "Book a pilot demo for your first 10–25 products",
      body: "See how guided photo upload, human review, hosted links, and analytics fit into your current ecommerce workflow.",
      cta: "Book a pilot demo",
      ctaSecondary: "See sample product page",
    },
  },

  sr: {
    nav: {
      features: "Funkcionalnosti",
      howItWorks: "Kako funkcioniše",
      pricing: "Cene",
      faq: "Pitanja",
      samplePage: "Primer stranice",
      bookDemo: "Zakažite demo",
    },
    hero: {
      eyebrow: "Bez angažovanja 3D tima",
      heading: "Verifikovane AR stranice proizvoda za prodavnice nameštaja",
      body: "Otpremite fotografije proizvoda, dobijte proverenu 3D/AR stranicu i kupcu pružite jasniji uvid u veličinu, razmeru i detalje pre kupovine.",
      cta: "Zakažite pilot demo",
      ctaSecondary: "Pogledajte primer stranice",
    },
    platforms: {
      label: "Radi uz vaš postojeći e-commerce sistem",
    },
    problem: {
      eyebrow: "Problem trgovca",
      heading: "Kupci žele da prostorno razumeju nameštaj pre nego što se odluče.",
      p1: "Statičke fotografije ne komuniciraju uvek razmeru, dubinu, uklapanje ili detalje materijala. Za mnoge SMB prodavnice, angažovanje 3D tima ili upravljanje modelima donosi previše operativnog opterećenja za pilot od 10 do 25 SKU-ova.",
      p2: "Veridian zadržava ponudu usku: Otpremite fotografije. Mi generišemo, proveravamo i hostujemo AR stranicu proizvoda.",
    },
    howItWorks: {
      eyebrow: "Kako funkcioniše",
      heading: "Jednostavan put od fotografija do objavljene stranice.",
    },
    workflow: [
      { step: "Dodajte proizvod", copy: "Unesite naziv, dimenzije, kategoriju i URL prodavnice." },
      { step: "Otpremite slike", copy: "Koristite vođenu listu za prednju, zadnju, bočnu, ugaonu, detaljnu i skalnu fotografiju." },
      { step: "Pregledajte model", copy: "Pregledajte vizuelni pregled nakon Veridian generisanja i ručnih provera kvaliteta." },
      { step: "Objavite link", copy: "Objavite hostovani link proizvoda nakon odobrenja." },
      { step: "Pratite rezultate", copy: "Pratite preglede stranica, AR klikove i klikove nazad u vašu prodavnicu." },
    ],
    whatYouGet: {
      eyebrow: "Šta dobijate",
      heading: "Hostovani linkovi koje možete dodati u prodavnicu, oglase, emailove ili QR kodove.",
      body: "Pružite kupcima jasniji osećaj veličine, razmere i detalja pre kupovine, zatim pratite da li se angažuju i kliknu nazad na vašu prodavnicu.",
    },
    features: [
      "Hostovana javna stranica proizvoda",
      "3D preglednik i AR pokretanje gde je podržano",
      "Poziv na akciju ka prodavnici",
      "Generisan i verifikovan 3D pregled",
      "Analitika na nivou proizvoda",
    ],
    quality: {
      eyebrow: "Kvalitet i poverenje",
      heading: "Pregledano od strane čoveka pre objavljivanja.",
      body: "Veridian proverava sličnost modela, razmeru, orijentaciju, učitavanje fajla i AR spremnost pre nego što stranica bude objavljena.",
    },
    qualityChecks: ["Sličnost", "Razmera", "Orijentacija", "Učitavanje fajla", "AR spremnost"],
    dashboard: {
      eyebrow: "Pregled kontrolne table",
      heading: "Pilotni komandni centar",
      body: "Status kataloga, sledeće akcije, objavljene stranice, AR klikovi, CTA klikovi i korišćenje plana vidljivi su na jednom radnom prostoru.",
      stats: [
        { label: "Objavljene stranice", value: "1 / 25" },
        { label: "AR klikovi", value: "188" },
        { label: "Klikovi ka prodavnici", value: "94" },
        { label: "Sledeće akcije", value: "2" },
      ],
    },
    pricing: {
      eyebrow: "Pilot ponuda",
      heading: "Napravljeno za prvih 10 do 25 SKU-ova nameštaja ili kućnog dekora.",
      body: "Cene su predvidive: naknada po odobrenom modelu plus mesečna pretplata za hostovanje stranica.",
    },
    faqSection: {
      eyebrow: "Česta pitanja",
      heading: "Odgovori za odluku o plaćenom pilotu.",
    },
    faqItems: [
      {
        question: "Da li će ovo dovoljno povećati poverenje kupca?",
        answer:
          "Pilot je osmišljen da testira jasnije razumevanje proizvoda: poverenje u veličinu i razmeru, angažovanje 3D preglednika, AR klikove i klikove ka prodavnici. Ne obećavamo garantovano povećanje konverzije.",
      },
      {
        question: "Koliko je teška postavka za moj tim?",
        answer:
          "Vaš tim dodaje proizvod, otprema vođene fotografije, pregleda pregled, objavljuje link i prati rezultate. Interni 3D tim nije potreban.",
      },
      {
        question: "Šta se dešava ako je kvalitet modela loš?",
        answer:
          "Ljudski recenzent proverava svaki model pre objavljivanja. Ako sličnost, razmera, orijentacija, učitavanje ili AR spremnost nisu prihvatljivi, stranica ostaje neobjavljena dok se model ne revidirava ili regeneriše.",
      },
      {
        question: "Koliko su predvidive cene?",
        answer:
          "Tipičan pilot koristi naknadu po odobrenom modelu i mesečnu pretplatu za hostovanje. Starter modeli su 30 do 50 EUR, standardni verifikovani modeli su 70 do 120 EUR, a hostovane stranice su 49 do 99 EUR mesečno.",
      },
      {
        question: "Kako da dokažem da ovo funkcioniše?",
        answer:
          "Kontrolna tabla prati preglede stranica, interakcije sa preglednikom, AR klikove, CTA klikove ka prodavnici i miks uređaja po proizvodu, tako da možete porediti angažovanje kroz pilot SKU-ove.",
      },
      {
        question: "Zar Shopify već ne prikazuje 3D modele?",
        answer:
          "Shopify može da prikaže 3D modele ako već imate prave fajlove. Veridian pomaže da kreirate, proverite, hostujete, objavite i merite AR stranice proizvoda bez upravljanja 3D pipelinom.",
      },
    ],
    finalCta: {
      eyebrow: "Spremni za fokusirani pilot?",
      heading: "Zakažite pilot demo za prvih 10–25 proizvoda",
      body: "Pogledajte kako vođeno otpremanje fotografija, ljudska recenzija, hostovani linkovi i analitika se uklapaju u vaš postojeći e-commerce tok rada.",
      cta: "Zakažite pilot demo",
      ctaSecondary: "Pogledajte primer stranice",
    },
  },
} as const
