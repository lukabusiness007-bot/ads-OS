import type { SeoLang } from "./seo";

export type SeoContentPage = {
  slug: string;
  lang: SeoLang;
  alternateSlug: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  cta: string;
  secondaryCta: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

const enPages: SeoContentPage[] = [
  {
    slug: "furniture-ar",
    lang: "en",
    alternateSlug: "ar-za-namestaj",
    title: "Furniture AR For Online Stores | Augmenta",
    description:
      "Furniture AR product pages help shoppers see size, shape, and style in their room before buying online.",
    eyebrow: "Furniture AR",
    h1: "Furniture AR that helps shoppers picture the product at home",
    intro:
      "Furniture buyers hesitate because a sofa, chair, lamp, or shelf is hard to judge from flat photos. Augmenta turns 4 product photos into a verified 3D/AR page so shoppers can inspect the piece before checkout.",
    cta: "Show my products in their room",
    secondaryCta: "See a furniture demo",
    sections: [
      {
        heading: "Built for furniture stores, not 3D teams",
        body:
          "Your team uploads the product, dimensions, store URL, and a small set of clean photos. Augmenta handles the generation flow, model packaging, hosted page, and review gate."
      },
      {
        heading: "Help shoppers judge size before checkout",
        body:
          "The goal is not a manufacturing-grade CAD file. The goal is a visual shopping preview that helps buyers understand scale, orientation, and material before they commit."
      },
      {
        heading: "Use one link everywhere",
        body:
          "Add the hosted AR page to product pages, ads, emails, SMS campaigns, and QR codes in the showroom. Analytics show which products shoppers inspect and which previews drive store clicks."
      }
    ],
    faqs: [
      {
        question: "Do shoppers need an app?",
        answer: "No. The public product page opens in the browser, with AR available on supported mobile devices."
      },
      {
        question: "Is this exact CAD geometry?",
        answer:
          "No. Augmenta is positioned as a verified visual preview for ecommerce confidence, not a manufacturing or engineering file."
      }
    ]
  },
  {
    slug: "3d-product-viewer-for-furniture",
    lang: "en",
    alternateSlug: "3d-pregledac-proizvoda-za-namestaj",
    title: "3D Product Viewer For Furniture Stores | Augmenta",
    description:
      "Add a 3D product viewer to furniture pages so shoppers can rotate, inspect, and understand products before buying.",
    eyebrow: "3D product viewer",
    h1: "A 3D product viewer made for furniture shoppers",
    intro:
      "A furniture product page has to answer one question fast: will this look right in my space? A 3D viewer gives shoppers a better way to inspect shape, depth, and proportions before they leave your store.",
    cta: "Show my products in their room",
    secondaryCta: "See a furniture demo",
    sections: [
      {
        heading: "Show depth, not just the front angle",
        body:
          "Static photos usually hide the real depth of a sofa, chair, table, or shelf. A 3D viewer lets the shopper rotate the piece and understand the full form."
      },
      {
        heading: "Connect the viewer to a buying path",
        body:
          "Each hosted page keeps the store CTA visible, so shoppers can inspect the product and return to your product page when they are ready to buy."
      },
      {
        heading: "Measure actual engagement",
        body:
          "Track page views, viewer interactions, AR clicks, store clicks, and device mix so you can see which products deserve more 3D investment."
      }
    ],
    faqs: [
      {
        question: "Can I add this to Shopify?",
        answer: "Yes. The simplest first step is a hosted page link that you can add to Shopify product pages, ads, emails, or QR codes."
      },
      {
        question: "What files are created?",
        answer: "The generation flow packages web and AR assets such as GLB and USDZ when available."
      }
    ]
  },
  {
    slug: "ar-product-pages-for-furniture-stores",
    lang: "en",
    alternateSlug: "ar-stranice-proizvoda-za-prodavnice-namestaja",
    title: "AR Product Pages For Furniture Stores | Augmenta",
    description:
      "Create hosted AR product pages for furniture stores from 4 product photos, with review, analytics, and store CTAs.",
    eyebrow: "AR product pages",
    h1: "Hosted AR product pages for furniture stores",
    intro:
      "Augmenta gives every selected furniture SKU its own hosted product page with a 3D viewer, AR launch, dimensions, merchant branding, and a CTA back to the store.",
    cta: "Show my products in their room",
    secondaryCta: "See a furniture demo",
    sections: [
      {
        heading: "No plugin required to start",
        body:
          "The hosted link works as a fast pilot path. Add it to product descriptions, announcement bars, post-purchase emails, sales conversations, or QR codes."
      },
      {
        heading: "Review before publishing",
        body:
          "A quality gate keeps unfinished or poor previews out of the public page. The merchant can inspect the generated model before shoppers see it."
      },
      {
        heading: "Designed for a focused pilot",
        body:
          "Start with the products where shoppers ask the most questions about size, scale, or fit. Prove engagement before expanding across the catalog."
      }
    ],
    faqs: [
      {
        question: "How many products should I start with?",
        answer: "A focused pilot usually starts with 10-25 furniture or home-decor products."
      },
      {
        question: "Does the hosted page replace my store page?",
        answer: "No. It supports the store page and sends shoppers back through the merchant CTA."
      }
    ]
  },
  {
    slug: "shopify-furniture-ar",
    lang: "en",
    alternateSlug: "shopify-ar-za-namestaj",
    title: "Shopify Furniture AR Pages | Augmenta",
    description:
      "Use hosted AR product links with Shopify furniture stores to help shoppers preview products in their space.",
    eyebrow: "Shopify furniture AR",
    h1: "Add AR previews to Shopify furniture products without a 3D team",
    intro:
      "Shopify can display 3D models when you already have the right assets. Augmenta helps create, verify, host, and measure the AR preview link for selected furniture SKUs.",
    cta: "Show my products in their room",
    secondaryCta: "See a furniture demo",
    sections: [
      {
        heading: "Start with links before deep integrations",
        body:
          "A hosted link is the fastest path to a pilot. Add it to product pages, navigation blocks, email campaigns, or showroom QR codes while you validate engagement."
      },
      {
        heading: "Keep the product page focused",
        body:
          "Use the AR page as a confidence tool, then send shoppers back to Shopify for product details, variants, cart, and checkout."
      },
      {
        heading: "Track proof before scaling",
        body:
          "See which products get 3D interactions, AR launches, and store CTA clicks before investing in a larger catalog rollout."
      }
    ],
    faqs: [
      {
        question: "Do I need a custom Shopify app?",
        answer: "No for the pilot. A hosted product link can validate demand before custom app work."
      },
      {
        question: "Can the CTA go back to Shopify?",
        answer: "Yes. Each hosted page uses the merchant product URL as the primary buying path."
      }
    ]
  },
  {
    slug: "reduce-furniture-returns",
    lang: "en",
    alternateSlug: "smanjite-povrate-namestaja",
    title: "Reduce Furniture Returns With Better Product Previews | Augmenta",
    description:
      "Use 3D and AR previews to reduce shopper uncertainty about furniture size, scale, and fit before checkout.",
    eyebrow: "Furniture return reduction",
    h1: "Reduce furniture return risk by helping shoppers understand the product first",
    intro:
      "Furniture returns often start before the order is placed: the shopper cannot judge size, scale, or fit from static images. Augmenta is built to reduce uncertainty before checkout.",
    cta: "Show my products in their room",
    secondaryCta: "See a furniture demo",
    sections: [
      {
        heading: "Attack the hesitation before checkout",
        body:
          "A buyer who understands the product is more likely to make a confident decision. 3D and AR previews help shoppers inspect the product instead of guessing."
      },
      {
        heading: "Use previews where the question is scale",
        body:
          "Prioritize sofas, chairs, tables, shelving, lamps, and decor products where the shopper needs to understand size in context."
      },
      {
        heading: "Measure confidence signals",
        body:
          "Use viewer interaction, AR clicks, and store CTA clicks as early signals that shoppers are engaging with the product before buying."
      }
    ],
    faqs: [
      {
        question: "Can AR guarantee fewer returns?",
        answer:
          "No. The correct promise is buyer confidence and reduced uncertainty, not guaranteed return reduction."
      },
      {
        question: "Which products should get AR first?",
        answer: "Start with high-consideration products where shoppers often ask about dimensions, room fit, or materials."
      }
    ]
  },
  {
    slug: "how-to-photograph-furniture-for-3d-models",
    lang: "en",
    alternateSlug: "kako-fotografisati-namestaj-za-3d-modele",
    title: "How To Photograph Furniture For 3D Models | Augmenta",
    description:
      "A practical photo guide for creating better furniture 3D models from product images.",
    eyebrow: "Photo guide",
    h1: "How to photograph furniture for better 3D and AR previews",
    intro:
      "The better the product photos, the better the generated preview can be. Use a simple background, sharp focus, consistent lighting, and 4 views that show the full shape of the product.",
    cta: "Show my products in their room",
    secondaryCta: "See a furniture demo",
    sections: [
      {
        heading: "Capture the full outline",
        body:
          "Use a straight front view, a side or three-quarter view, a back view, and a material or detail shot when available. Keep one product in frame."
      },
      {
        heading: "Keep lighting consistent",
        body:
          "Avoid harsh reflections, dark corners, busy scenes, and mixed lighting. A clean background makes the product easier to understand."
      },
      {
        heading: "Add real dimensions",
        body:
          "Photos help create the visual model, but merchant-entered width, height, and depth should remain the source of truth for the public product page."
      }
    ],
    faqs: [
      {
        question: "How many photos should I upload?",
        answer: "Use 4 clean JPG or PNG product photos for the current generation flow."
      },
      {
        question: "Should I include room photos?",
        answer: "Room context can help shoppers, but generation photos should keep the product clear and easy to isolate."
      }
    ]
  }
];

const srPages: SeoContentPage[] = [
  {
    slug: "ar-za-namestaj",
    lang: "sr",
    alternateSlug: "furniture-ar",
    title: "AR za namestaj i online prodavnice | Augmenta",
    description:
      "AR stranice proizvoda za prodavnice namestaja pomazu kupcima da vide velicinu, oblik i stil u svom prostoru pre kupovine.",
    eyebrow: "AR za namestaj",
    h1: "AR za namestaj koji kupcu pomaze da zamisli proizvod kod kuce",
    intro:
      "Kupac namestaja okleva jer sofu, stolicu, lampu ili policu tesko procenjuje sa ravnih fotografija. Augmenta od 4 fotografije pravi verifikovanu 3D/AR stranicu proizvoda.",
    cta: "Prikazi moje proizvode u prostoru kupca",
    secondaryCta: "Pogledaj demo za namestaj",
    sections: [
      {
        heading: "Napravljeno za prodavnice namestaja, ne za 3D timove",
        body:
          "Vas tim dodaje proizvod, dimenzije, URL prodavnice i nekoliko cistih fotografija. Augmenta vodi generisanje, pakovanje modela, hostovanu stranicu i proveru kvaliteta."
      },
      {
        heading: "Pomozite kupcu da proceni velicinu pre placanja",
        body:
          "Ovo nije CAD fajl za proizvodnju. Ovo je vizuelni pregled za online kupovinu koji pomaze kupcu da razume razmeru, orijentaciju i materijal."
      },
      {
        heading: "Jedan link za prodavnicu, oglase i QR kodove",
        body:
          "Hostovanu AR stranicu mozete dodati na product page, u email, oglas, SMS ili QR kod u salonu. Analitika pokazuje koji proizvodi dobijaju paznju."
      }
    ],
    faqs: [
      {
        question: "Da li kupcu treba aplikacija?",
        answer: "Ne. Javna stranica se otvara u browseru, a AR radi na podrzanim mobilnim uredjajima."
      },
      {
        question: "Da li je ovo tacna CAD geometrija?",
        answer: "Ne. Augmenta je vizuelni pregled za sigurniju online kupovinu, ne inzenjerski ili proizvodni fajl."
      }
    ]
  },
  {
    slug: "3d-pregledac-proizvoda-za-namestaj",
    lang: "sr",
    alternateSlug: "3d-product-viewer-for-furniture",
    title: "3D pregledac proizvoda za prodavnice namestaja | Augmenta",
    description:
      "Dodajte 3D pregledac na stranice namestaja kako bi kupci mogli da rotiraju, pregledaju i razumeju proizvod pre kupovine.",
    eyebrow: "3D pregledac proizvoda",
    h1: "3D pregledac proizvoda napravljen za kupce namestaja",
    intro:
      "Stranica namestaja mora brzo da odgovori na pitanje: da li ce ovo izgledati dobro u mom prostoru? 3D pregledac kupcu daje bolji nacin da proveri oblik, dubinu i proporcije.",
    cta: "Prikazi moje proizvode u prostoru kupca",
    secondaryCta: "Pogledaj demo za namestaj",
    sections: [
      {
        heading: "Prikazite dubinu, ne samo prednju stranu",
        body:
          "Staticne fotografije cesto sakriju stvarnu dubinu sofe, stolice, stola ili police. 3D pregledac omogucava rotaciju i bolje razumevanje forme."
      },
      {
        heading: "Povezite pregled sa kupovinom",
        body:
          "Svaka hostovana stranica zadrzava CTA ka prodavnici, tako da kupac pregleda proizvod i vraca se na product page kada je spreman."
      },
      {
        heading: "Merite stvarno interesovanje",
        body:
          "Pratite preglede stranice, interakcije sa 3D modelom, AR klikove, klikove ka prodavnici i uredjaje koje kupci koriste."
      }
    ],
    faqs: [
      {
        question: "Mogu li ovo dodati na Shopify?",
        answer: "Da. Najbrzi pilot je hostovani link koji se dodaje na Shopify product page, oglase, email ili QR kod."
      },
      {
        question: "Koji fajlovi se kreiraju?",
        answer: "Tok generisanja pakuje web i AR assete kao sto su GLB i USDZ kada su dostupni."
      }
    ]
  },
  {
    slug: "ar-stranice-proizvoda-za-prodavnice-namestaja",
    lang: "sr",
    alternateSlug: "ar-product-pages-for-furniture-stores",
    title: "AR stranice proizvoda za prodavnice namestaja | Augmenta",
    description:
      "Kreirajte hostovane AR stranice proizvoda za prodavnice namestaja od 4 fotografije, uz proveru, analitiku i CTA ka prodavnici.",
    eyebrow: "AR stranice proizvoda",
    h1: "Hostovane AR stranice proizvoda za prodavnice namestaja",
    intro:
      "Augmenta svakom izabranom SKU-u daje hostovanu stranicu sa 3D pregledacem, AR pokretanjem, dimenzijama, brendom prodavca i CTA dugmetom ka prodavnici.",
    cta: "Prikazi moje proizvode u prostoru kupca",
    secondaryCta: "Pogledaj demo za namestaj",
    sections: [
      {
        heading: "Bez plugina za prvi pilot",
        body:
          "Hostovani link je najbrzi put do testiranja. Dodajte ga u opis proizvoda, email, prodajne razgovore ili QR kodove."
      },
      {
        heading: "Pregled pre objavljivanja",
        body:
          "Kontrola kvaliteta sprecava da nedovrseni ili losi pregledi odu javno. Prodavac moze da proveri model pre nego sto ga kupci vide."
      },
      {
        heading: "Napravljeno za fokusiran pilot",
        body:
          "Pocnite sa proizvodima gde kupci najvise pitaju za velicinu, razmeru i uklapanje u prostor. Dokazite angazovanje pre sirenja kataloga."
      }
    ],
    faqs: [
      {
        question: "Sa koliko proizvoda da pocnem?",
        answer: "Fokusiran pilot obicno pocinje sa 10-25 komada namestaja ili dekor proizvoda."
      },
      {
        question: "Da li hostovana stranica menja moju prodavnicu?",
        answer: "Ne. Ona podrzava product page i salje kupca nazad ka prodavnici."
      }
    ]
  },
  {
    slug: "shopify-ar-za-namestaj",
    lang: "sr",
    alternateSlug: "shopify-furniture-ar",
    title: "Shopify AR za prodavnice namestaja | Augmenta",
    description:
      "Koristite hostovane AR linkove uz Shopify prodavnicu namestaja kako bi kupci videli proizvod u svom prostoru.",
    eyebrow: "Shopify AR za namestaj",
    h1: "Dodajte AR pregled Shopify proizvodima bez internog 3D tima",
    intro:
      "Shopify moze da prikaze 3D modele kada vec imate prave assete. Augmenta pomaze da kreirate, proverite, hostujete i merite AR pregled za izabrane SKU-ove.",
    cta: "Prikazi moje proizvode u prostoru kupca",
    secondaryCta: "Pogledaj demo za namestaj",
    sections: [
      {
        heading: "Pocnite linkovima pre dubokih integracija",
        body:
          "Hostovani link je najbrzi pilot. Dodajte ga na product page, u kampanje ili QR kodove dok proveravate interesovanje."
      },
      {
        heading: "Zadrzite Shopify kao put kupovine",
        body:
          "AR stranica sluzi kao alat za sigurnost kupca, a CTA vraca kupca na Shopify za varijante, korpu i placanje."
      },
      {
        heading: "Merite dokaz pre skaliranja",
        body:
          "Vidite koji proizvodi dobijaju 3D interakcije, AR pokretanja i klikove ka prodavnici pre velikog ulaganja u katalog."
      }
    ],
    faqs: [
      {
        question: "Da li mi treba custom Shopify aplikacija?",
        answer: "Ne za pilot. Hostovani link moze da proveri potraznju pre rada na custom aplikaciji."
      },
      {
        question: "Moze li CTA da vodi nazad na Shopify?",
        answer: "Da. Svaka hostovana stranica koristi URL proizvoda kao glavni put ka kupovini."
      }
    ]
  },
  {
    slug: "smanjite-povrate-namestaja",
    lang: "sr",
    alternateSlug: "reduce-furniture-returns",
    title: "Smanjite rizik povrata namestaja boljim pregledom | Augmenta",
    description:
      "Koristite 3D i AR preglede da smanjite nesigurnost kupca oko velicine, razmere i uklapanja namestaja pre placanja.",
    eyebrow: "Povrati namestaja",
    h1: "Smanjite rizik povrata tako sto kupac bolje razume proizvod",
    intro:
      "Povrat namestaja cesto pocinje pre narudzbine: kupac ne moze da proceni velicinu, razmeru ili uklapanje sa staticnih slika. Augmenta smanjuje tu nesigurnost pre placanja.",
    cta: "Prikazi moje proizvode u prostoru kupca",
    secondaryCta: "Pogledaj demo za namestaj",
    sections: [
      {
        heading: "Resite oklevanje pre checkouta",
        body:
          "Kupac koji razume proizvod donosi sigurniju odluku. 3D i AR pregled pomazu mu da proveri proizvod umesto da pogadja."
      },
      {
        heading: "Koristite AR gde je pitanje razmere",
        body:
          "Prioritet su sofe, stolice, stolovi, police, lampe i dekor kod kojih kupac mora da razume velicinu u prostoru."
      },
      {
        heading: "Merite signale sigurnosti",
        body:
          "Interakcije sa pregledacem, AR klikovi i klikovi ka prodavnici su rani signali da kupci razmatraju proizvod ozbiljnije."
      }
    ],
    faqs: [
      {
        question: "Da li AR garantuje manje povrata?",
        answer: "Ne. Ispravno obecanje je veca sigurnost kupca i manje nesigurnosti, ne garantovan pad povrata."
      },
      {
        question: "Koji proizvodi prvi treba da dobiju AR?",
        answer: "Krenite od skupljih proizvoda i onih gde kupci cesto pitaju za dimenzije, uklapanje i materijal."
      }
    ]
  },
  {
    slug: "kako-fotografisati-namestaj-za-3d-modele",
    lang: "sr",
    alternateSlug: "how-to-photograph-furniture-for-3d-models",
    title: "Kako fotografisati namestaj za 3D modele | Augmenta",
    description:
      "Praktican vodic za fotografisanje namestaja kako bi 3D i AR pregledi bili kvalitetniji.",
    eyebrow: "Vodic za fotografije",
    h1: "Kako fotografisati namestaj za bolje 3D i AR preglede",
    intro:
      "Sto su fotografije cistije, to generisani pregled ima bolju osnovu. Koristite jednostavnu pozadinu, ostar fokus, stabilno svetlo i 4 pogleda koji prikazuju oblik proizvoda.",
    cta: "Prikazi moje proizvode u prostoru kupca",
    secondaryCta: "Pogledaj demo za namestaj",
    sections: [
      {
        heading: "Uhvatite ceo obris proizvoda",
        body:
          "Koristite prednji pogled, bocni ili polu-bocni ugao, zadnju stranu i detalj materijala kada postoji. U kadru neka bude jedan proizvod."
      },
      {
        heading: "Drzite svetlo jednostavnim",
        body:
          "Izbegavajte jake odsjaje, tamne uglove, pretrpane scene i mesano svetlo. Cista pozadina pomaze da se proizvod lakse procita."
      },
      {
        heading: "Unesite stvarne dimenzije",
        body:
          "Fotografije pomazu za vizuelni model, ali sirina, visina i dubina koje unese prodavac ostaju izvor istine za javnu stranicu."
      }
    ],
    faqs: [
      {
        question: "Koliko fotografija treba da otpremim?",
        answer: "Za trenutni tok koristite 4 ciste JPG ili PNG fotografije proizvoda."
      },
      {
        question: "Da li da ubacim fotografije iz prostorije?",
        answer: "Kontekst prostorije moze pomoci kupcu, ali fotografije za generisanje treba da jasno izdvoje proizvod."
      }
    ]
  }
];

export const seoContentPages = {
  en: enPages,
  sr: srPages
};

export function getSeoContentPage(lang: SeoLang, slug: string) {
  return seoContentPages[lang].find((page) => page.slug === slug);
}

export function getSeoContentAlternatePath(page: SeoContentPage) {
  return page.lang === "en" ? `/sr/${page.alternateSlug}` : `/${page.alternateSlug}`;
}

export function getSeoContentPath(page: SeoContentPage) {
  return page.lang === "en" ? `/${page.slug}` : `/sr/${page.slug}`;
}
