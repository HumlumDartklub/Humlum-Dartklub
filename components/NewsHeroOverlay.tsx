"use client";

/* [HELP:NEWS:IMPORTS] START */
import { useEffect, useState } from "react";
/* [HELP:NEWS:IMPORTS] END */

/* [HELP:NEWS:TYPES] START */
type NewsItem = {
  title: string;
  teaser?: string;
  url?: string;
  link?: string;
  date?: string;
  image: string;
};
/* [HELP:NEWS:TYPES] END */

function pickUrl(item: NewsItem): string {
  if (item.url && item.url.trim()) return item.url;
  if (item.link && item.link.trim()) return item.link;
  return "#";
}

/* [HELP:NEWS:COMPONENT] START */
export default function NewsHeroOverlay() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [idx, setIdx] = useState(0);

  /* [HELP:NEWS:DATA:FETCH] START */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/news", { cache: "no-store" });
        if (!res.ok) {
          console.error("NewsHeroOverlay: /api/news failed", res.status);
          return;
        }
        const data = await res.json();
        const arr: NewsItem[] = Array.isArray(data?.items) ? data.items : [];
        const clean = arr.filter(
          (x) => x && typeof x.title === "string" && x.title.trim() !== ""
        );
        setItems(clean);
        setIdx(0);
      } catch (err) {
        console.error("NewsHeroOverlay: fetch error", err);
      }
    })();
  }, []);
  /* [HELP:NEWS:DATA:FETCH] END */

  /* [HELP:NEWS:TIMER] START */
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIdx((prev) => {
        const next = prev + 1;
        return next >= items.length ? 0 : next;
      });
    }, 8000);
    return () => clearInterval(id);
  }, [items.length]);
  /* [HELP:NEWS:TIMER] END */

  if (!items.length) return null;

  const current = items[Math.min(idx, items.length - 1)];
  const href = pickUrl(current);

  const dateLabel =
    current.date && current.date.trim()
      ? new Date(current.date).toLocaleDateString("da-DK")
      : "";

  /* [HELP:NEWS:RENDER] START
   * Pitch: Card i samme stil som de andre forside-cards, med nyheds-vindue indeni.
   */
  return (
    <a href={href} className="card group h-full flex flex-col">
      <div className="kicker mb-1">
        <span className="h-2 w-2 rounded-full bg-lime-500" />
        NYHEDER
      </div>

      <div className="flex flex-1 flex-col gap-4 md:flex-row">
        {/* Tekstside */}
        <div className="flex flex-1 flex-col justify-between gap-2">
          <div className="space-y-1">
            {dateLabel && (
              <div className="text-[11px] text-neutral-500">{dateLabel}</div>
            )}
            <h3 className="text-base font-semibold text-gray-900">
              {current.title}
            </h3>
            {current.teaser && (
              <p className="text-sm text-neutral-700">{current.teaser}</p>
            )}
          </div>

          <div className="text-xs text-lime-700 font-medium">
            Klik for at læse mere →
          </div>
        </div>

        {/* Billedside */}
        <div className="relative w-full md:w-40 lg:w-48 shrink-0">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
            {current.image ? (
              <img
                src={current.image}
                alt={current.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-32 items-center justify-center text-[11px] text-neutral-400">
                Intet billede valgt
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Små dots nederst højre, hvis flere nyheder */}
      {items.length > 1 && (
        <div className="mt-3 flex items-center justify-end gap-1 text-[9px] text-neutral-400">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIdx(i);
              }}
              className={`h-2 w-2 rounded-full transition ${
                i === idx
                  ? "bg-lime-600"
                  : "bg-lime-300 hover:bg-lime-500"
              }`}
              aria-label={`Vis nyhed ${i + 1}`}
            />
          ))}
        </div>
      )}
    </a>
  );
  /* [HELP:NEWS:RENDER] END */
}
/* [HELP:NEWS:COMPONENT] END */
