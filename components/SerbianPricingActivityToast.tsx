"use client"

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const names = [
  "Luka",
  "Sanja",
  "Miloš",
  "Jelena",
  "Nikola",
  "Ana",
  "Marko",
  "Ivana",
  "Stefan",
  "Milica",
  "Nemanja",
  "Tamara",
  "Aleksandar",
  "Marija",
  "Petar",
  "Katarina",
  "Dušan",
  "Teodora",
  "Filip",
  "Nina"
];

const activities = [
  "pregleda Growth plan",
  "upoređuje Starter i Growth",
  "gleda cenu za 15 SKU-ova",
  "računa pilot za svoj katalog",
  "proverava dodatke za 3D modele",
  "gleda primer AR stranice",
  "upoređuje mesečne kvote",
  "čita česta pitanja o cenama"
];

export function SerbianPricingActivityToast() {
  const messages = useMemo(
    () => names.map((name, index) => `${name} ${activities[index % activities.length]}`),
    []
  );
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) {
      return;
    }

    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      setMessageIndex(getRandomIndex(messages.length));
      setIsVisible(true);

      intervalId = window.setInterval(() => {
        setMessageIndex((current) => (current + 1 + getRandomIndex(messages.length - 1)) % messages.length);
      }, 8500 + getRandomIndex(4000));
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isDismissed, messages.length]);

  if (isDismissed || !isVisible) {
    return null;
  }

  return (
    <aside
      className="fixed bottom-4 left-4 z-50 max-w-[calc(100vw-2rem)] rounded-lg border border-emerald-200 bg-white px-4 py-3 pr-11 text-sm text-zinc-700 shadow-xl shadow-zinc-900/10 sm:max-w-xs"
      aria-live="polite"
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Aktivnost na stranici</p>
      <p className="mt-1 font-medium text-zinc-900">{messages[messageIndex]}</p>
      <button
        type="button"
        className="absolute right-2 top-2 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Zatvori obaveštenje"
        onClick={() => setIsDismissed(true)}
      >
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
}

function getRandomIndex(limit: number) {
  return Math.floor(Math.random() * Math.max(1, limit));
}
