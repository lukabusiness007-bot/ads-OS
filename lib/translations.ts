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
      login: "Log in",
    },
    hero: {
      eyebrow: "Furniture AR previews from 4 photos",
      heading: "They can’t buy what they can’t picture.",
      body: "Your furniture already looks good. The problem is your customers can’t picture it at home. Augmenta turns product photos into 3D/AR pages so shoppers can see size, shape, and style before they leave your store.",
      cta: "Show my products in their room",
      ctaSecondary: "See a furniture demo",
    },
    platforms: {
      label: "Works alongside your existing ecommerce stack",
    },
    problem: {
      eyebrow: "The merchant problem",
      heading: "Your shoppers are buying furniture from flat photos. That is why they hesitate, ask questions, and return products.",
      p1: "Scale is hard to judge online. A chair looks smaller. A sofa feels deeper. A lamp looks right until it is in the room.",
      p2: "Augmenta gives every key product a 3D/AR preview so buyers can inspect size, shape, and fit before checkout. It is built to increase buyer confidence, reduce hesitation, and give shoppers a stronger reason to buy.",
    },
    trustStrip: [
      "No 3D team needed",
      "GLB + USDZ included",
      "Human-reviewed before publishing",
      "Only pay for approved models",
    ],
    howItWorks: {
      eyebrow: "How it works",
      heading: "A simple path from product photos to a live hosted page.",
    },
    workflow: [
      { step: "Add product", copy: "Enter the product name, dimensions, category, and store URL." },
      { step: "Upload photos", copy: "Use 4 clean product photos: front, side or angle, back, and material detail." },
      { step: "Generate model", copy: "Meshy creates the 3D asset while Augmenta packages the web and AR files." },
      { step: "Review before live", copy: "Approve the visual preview before shoppers can see it." },
      { step: "Publish anywhere", copy: "Use the hosted link on product pages, ads, emails, or QR codes." },
      { step: "Track results", copy: "Track page views, AR clicks, and clicks back to your store." },
    ],
    seoSections: [
      {
        heading: "Built for furniture stores, not 3D teams",
        body: "Your team should not have to manage modeling software, file formats, or AR packaging just to test product previews. Add the product details and photos; Augmenta turns them into a hosted shopping page."
      },
      {
        heading: "From 4 product photos to a live AR page",
        body: "Keep the upload simple. Start with clear views that show the full product shape, then publish a verified page your shoppers can open from your store, ads, emails, or QR codes."
      },
      {
        heading: "Help shoppers judge size before checkout",
        body: "Furniture is a confidence purchase. 3D and AR help buyers understand scale, depth, and style before they commit, without promising exact CAD or manufacturing precision."
      },
      {
        heading: "Verified visual previews, not CAD manufacturing files",
        body: "Augmenta is designed for ecommerce confidence. The public page shows a checked visual preview with dimensions, AR launch, and a CTA back to your store."
      }
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
      body: "Augmenta checks model resemblance, scale, orientation, file loading, and AR readiness before a page goes live.",
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
          "Shopify can display 3D models if you already have the right files. Augmenta helps create, check, host, publish, and measure AR product pages without asking your team to manage a 3D pipeline.",
      },
    ],
    comparison: {
      eyebrow: "Why not just hire a studio?",
      heading: "Augmenta vs. traditional 3D studio",
      colAugmenta: "Augmenta",
      colStudio: "Traditional 3D studio",
      rows: [
        { aspect: "Time to live page", veridian: "15 min", studio: "6–12 weeks" },
        { aspect: "Cost per approved model", veridian: "€30–120", studio: "€300–1,200" },
        { aspect: "Hosted page included", veridian: "✓ Included", studio: "Not included" },
        { aspect: "Human quality review", veridian: "✓ Included", studio: "Varies by studio" },
        { aspect: "Analytics included", veridian: "✓ Included", studio: "Not included" },
        { aspect: "Pilot-friendly (10–25 SKUs)", veridian: "✓ Built for this", studio: "Minimum order may apply" },
      ],
    },
    stats: [
      { value: "4 photos", label: "is all you upload" },
      { value: "5–7 days", label: "to a live AR page" },
      { value: "GLB + USDZ", label: "both formats included" },
      { value: "Human review", label: "before every publish" },
    ],
    finalCta: {
      eyebrow: "Ready for a focused pilot?",
      heading: "Start with the furniture products shoppers hesitate on most",
      body: "Show them the product in 3D and AR, then measure whether they inspect it and click back to your store.",
      cta: "Show my products in their room",
      ctaSecondary: "See a furniture demo",
    },
  },

  sr: {
    nav: {
      features: "Funkcije",
      howItWorks: "Kako funkcioniše",
      pricing: "Cene",
      faq: "Pitanja",
      samplePage: "Primer stranice",
      bookDemo: "Zakažite demo",
      login: "Prijava",
    },
    hero: {
      eyebrow: "AR pregledi nameštaja iz 4 fotografije",
      heading: "Ne mogu kupiti ono što ne mogu da zamisle.",
      body: "Vaš nameštaj već izgleda dobro. Problem je što kupac ne može lako da ga zamisli kod kuće. Augmenta pretvara fotografije proizvoda u 3D/AR stranice kako bi kupac video veličinu, oblik i stil pre nego što napusti prodavnicu.",
      cta: "Prikaži moje proizvode u sobi",
      ctaSecondary: "Pogledajte demo nameštaja",
    },
    platforms: {
      label: "Radi uz vaš postojeći e-commerce sistem",
    },
    problem: {
      eyebrow: "Problem trgovca",
      heading: "Vaši kupci kupuju nameštaj sa ravnih fotografija. Zato oklevaju, postavljaju pitanja i vraćaju proizvode.",
      p1: "Razmera je teška za procenu online. Stolica deluje manja. Sofa izgleda plića. Lampa izgleda dobro dok ne stigne u prostor.",
      p2: "Augmenta daje ključnim proizvodima 3D/AR pregled kako bi kupci proverili veličinu, oblik i uklapanje pre kupovine. Napravljen je da poveća sigurnost kupca, smanji oklevanje i da jači razlog za kupovinu.",
    },
    trustStrip: [
      "Bez internog 3D tima",
      "GLB + USDZ uključeni",
      "Pregled od strane čoveka pre objave",
      "Plaćanje po odobrenom modelu",
    ],
    howItWorks: {
      eyebrow: "Kako funkcioniše",
      heading: "Jednostavan put od fotografija do objavljene stranice.",
    },
    workflow: [
      { step: "Dodajte proizvod", copy: "Unesite naziv, dimenzije, kategoriju i URL prodavnice." },
      { step: "Otpremite slike", copy: "Koristite 4 jasne fotografije: prednju, bočnu ili ugaonu, zadnju i detalj materijala ako postoji." },
      { step: "Generišite model", copy: "Meshy kreira 3D asset, a Augmenta pakuje web i AR fajlove." },
      { step: "Pregled pre objave", copy: "Odobrite vizuelni pregled pre nego što ga kupci vide." },
      { step: "Objavite bilo gde", copy: "Koristite hostovani link na product page-u, u oglasima, emailovima ili QR kodovima." },
      { step: "Pratite rezultate", copy: "Pratite preglede stranica, AR klikove i klikove nazad u vašu prodavnicu." },
    ],
    seoSections: [
      {
        heading: "Napravljeno za prodavnice nameštaja, ne za 3D timove",
        body: "Vaš tim ne treba da vodi softver za modelovanje, formate fajlova i AR pakovanje samo da bi testirao 3D pregled. Dodajte podatke i fotografije; Augmenta pravi hostovanu prodajnu stranicu."
      },
      {
        heading: "Od 4 fotografije do žive AR stranice",
        body: "Upload ostaje jednostavan. Počnite sa jasnim uglovima koji prikazuju oblik proizvoda, zatim objavite proverenu stranicu iz prodavnice, oglasa, emaila ili QR koda."
      },
      {
        heading: "Pomozite kupcu da proceni veličinu pre checkouta",
        body: "Nameštaj se kupuje kada postoji sigurnost. 3D i AR pomažu kupcu da razume razmeru, dubinu i stil pre odluke, bez obećanja CAD ili proizvodne preciznosti."
      },
      {
        heading: "Verifikovani vizuelni pregledi, ne CAD fajlovi",
        body: "Augmenta je napravljen za e-commerce sigurnost. Javna stranica prikazuje proveren vizuelni pregled, dimenzije, AR pokretanje i CTA nazad ka prodavnici."
      }
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
      body: "Augmenta proverava sličnost modela, razmeru, orijentaciju, učitavanje fajla i AR spremnost pre nego što stranica bude objavljena.",
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
          "Shopify može da prikaže 3D modele ako već imate prave fajlove. Augmenta pomaže da kreirate, proverite, hostujete, objavite i merite AR stranice proizvoda bez upravljanja 3D pipelinom.",
      },
    ],
    comparison: {
      eyebrow: "Zašto ne angažovati studio?",
      heading: "Augmenta vs. tradicionalni 3D studio",
      colAugmenta: "Augmenta",
      colStudio: "Tradicionalni 3D studio",
      rows: [
        { aspect: "Vreme do žive stranice", veridian: "15 min", studio: "6–12 nedelja" },
        { aspect: "Cena po odobrenom modelu", veridian: "€30–120", studio: "€300–1.200" },
        { aspect: "Hostovana stranica uključena", veridian: "✓ Uključeno", studio: "Nije uključeno" },
        { aspect: "Recenzija kvaliteta", veridian: "✓ Uključeno", studio: "Zavisi od studija" },
        { aspect: "Analitika uključena", veridian: "✓ Uključeno", studio: "Nije uključeno" },
        { aspect: "Pogodno za pilot (10–25 SKU)", veridian: "✓ Napravljeno za ovo", studio: "Može biti minimum narudžbine" },
      ],
    },
    stats: [
      { value: "4 fotografije", label: "je sve što otpremate" },
      { value: "5–7 dana", label: "do žive AR stranice" },
      { value: "GLB + USDZ", label: "oba formata uključena" },
      { value: "Ljudski pregled", label: "pre svake objave" },
    ],
    finalCta: {
      eyebrow: "Spremni za fokusirani pilot?",
      heading: "Počnite sa proizvodima oko kojih kupci najviše oklevaju",
      body: "Prikažite proizvod u 3D i AR, zatim merite da li ga kupci pregledaju i vraćaju se ka prodavnici.",
      cta: "Prikaži moje proizvode u sobi",
      ctaSecondary: "Pogledajte demo nameštaja",
    },
  },
} as const
