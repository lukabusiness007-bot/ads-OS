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
      eyebrow: "Verified previews — no 3D team required",
      heading: "Fewer returns. More confident buyers.",
      body: "Upload product photos — we generate and verify the 3D preview. Shoppers see size and scale before buying, so fewer orders come back.",
      cta: "Open dashboard",
      ctaSecondary: "See sample product page",
    },
    platforms: {
      label: "Works alongside your existing ecommerce stack",
    },
    problem: {
      eyebrow: "The merchant problem",
      heading: "Shoppers guess on size. When they guess wrong, you pay for it.",
      p1: "Static photos do not communicate scale or fit. When the item arrives and the proportions are off, the return costs 15–25 % of item value in pick-up, handling, and restock. For most SMB furniture stores, that is the margin on the order.",
      p2: "Veridian keeps the offer narrow: upload photos, get a verified 3D preview, live in 5–7 days. One avoided return on a €500 sofa covers a month of hosted pages.",
    },
    trustStrip: [
      "Live in 5–7 days from photo upload",
      "Up to 10× less than a traditional 3D studio",
      "Human-reviewed before publishing",
      "AR + analytics included",
    ],
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
      heading: "Start from a clean dashboard",
      body: "Your workspace starts empty for testing. Add a product, attach a real 3D model, then publish and measure live engagement.",
      cta: "Go to dashboard",
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
          "A typical pilot uses a per-approved-model fee and a monthly hosted-page subscription. Starter models are €30–50, standard verified models are €70–120, and hosted pages are €49–99 per month.",
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
    comparison: {
      eyebrow: "Why not just hire a studio?",
      heading: "Veridian vs. traditional 3D studio",
      colVeridian: "Veridian",
      colStudio: "Traditional 3D studio",
      rows: [
        { aspect: "Time to live page", veridian: "5–7 days", studio: "6–12 weeks" },
        { aspect: "Cost per approved model", veridian: "€30–120", studio: "€300–1,200" },
        { aspect: "Hosted page included", veridian: "✓ Included", studio: "Not included" },
        { aspect: "Human quality review", veridian: "✓ Included", studio: "Varies by studio" },
        { aspect: "Analytics included", veridian: "✓ Included", studio: "Not included" },
        { aspect: "Pilot-friendly (10–25 SKUs)", veridian: "✓ Built for this", studio: "Minimum order may apply" },
      ],
    },
    finalCta: {
      eyebrow: "Ready for a focused pilot?",
      heading: "Book a pilot demo for your first 10–25 products",
      body: "See how guided photo upload, human review, hosted links, and analytics fit into your current ecommerce workflow.",
      cta: "Open dashboard",
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
      eyebrow: "Verifikovani pregledi — bez 3D tima",
      heading: "Manje vraćanja. Sigurniji kupac.",
      body: "Otpremite fotografije — mi generišemo i proveravamo 3D pregled. Kupac vidi razmeru i detalje pre kupovine i ređe vraća.",
      cta: "Otvori kontrolnu tablu",
      ctaSecondary: "Pogledajte primer stranice",
    },
    platforms: {
      label: "Radi uz vaš postojeći e-commerce sistem",
    },
    problem: {
      eyebrow: "Problem trgovca",
      heading: "Kupci pogađaju dimenzije. Kada pogreše, vi plaćate.",
      p1: "Statičke fotografije ne komuniciraju razmeru ni uklapanje. Kada artikal stigne, a proporcije nisu dobre, povrat košta 15–25 % vrednosti u preuzimanju, rukovanju i ponovnom skladištenju. Za većinu SMB prodavnica nameštaja, to je marža na toj narudžbini.",
      p2: "Veridian zadržava ponudu usku: otpremite fotografije, dobijte verifikovani 3D pregled, živo za 5–7 dana. Jedan izbegnut povrat sofe od €500 pokriva mesec hostovanih stranica.",
    },
    trustStrip: [
      "Živo za 5–7 dana od otpremanja fotografija",
      "Do 10× jeftinije od tradicionalnog 3D studija",
      "Recenzija od strane čoveka pre objavljivanja",
      "AR + analitika uključena",
    ],
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
      heading: "Počnite od prazne kontrolne table",
      body: "Radni prostor počinje prazan za testiranje. Dodajte proizvod, povežite pravi 3D model, zatim objavite i merite stvarni angažman.",
      cta: "Idi na kontrolnu tablu",
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
          "Tipičan pilot koristi naknadu po odobrenom modelu i mesečnu pretplatu za hostovanje. Starter modeli €30–50, standardni verifikovani €70–120, hostovane stranice €49–99 mesečno.",
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
    comparison: {
      eyebrow: "Zašto ne angažovati studio?",
      heading: "Veridian vs. tradicionalni 3D studio",
      colVeridian: "Veridian",
      colStudio: "Tradicionalni 3D studio",
      rows: [
        { aspect: "Vreme do žive stranice", veridian: "5–7 dana", studio: "6–12 nedelja" },
        { aspect: "Cena po odobrenom modelu", veridian: "€30–120", studio: "€300–1.200" },
        { aspect: "Hostovana stranica uključena", veridian: "✓ Uključeno", studio: "Nije uključeno" },
        { aspect: "Recenzija kvaliteta", veridian: "✓ Uključeno", studio: "Zavisi od studija" },
        { aspect: "Analitika uključena", veridian: "✓ Uključeno", studio: "Nije uključeno" },
        { aspect: "Pogodno za pilot (10–25 SKU)", veridian: "✓ Napravljeno za ovo", studio: "Može biti minimum narudžbine" },
      ],
    },
    finalCta: {
      eyebrow: "Spremni za fokusirani pilot?",
      heading: "Zakažite pilot demo za prvih 10–25 proizvoda",
      body: "Pogledajte kako vođeno otpremanje fotografija, ljudska recenzija, hostovani linkovi i analitika se uklapaju u vaš postojeći e-commerce tok rada.",
      cta: "Otvori kontrolnu tablu",
      ctaSecondary: "Pogledajte primer stranice",
    },
  },
} as const
