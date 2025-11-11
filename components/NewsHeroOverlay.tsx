"use client";

/* [HELP:NEWS:IMPORTS] START */
import { useEffect, useState } from "react";
/* [HELP:NEWS:IMPORTS] END */

/* [HELP:NEWS:TYPES] START — shape af nyhedsitems */
type NewsItem = {
  title: string;
  teaser?: string;
  url?: string;
  date?: string;
  order?: number;
  image?: string;                // "op1" | "op2" | ... eller /sti.jpg
  fit?: "cover" | "contain" | "auto";
};
/* [HELP:NEWS:TYPES] END */

/* [HELP:NEWS:CONFIG] START — maks items & slide-interval (ms) */
const MAX_ITEMS = 3;
const INTERVAL_MS = 5000;
/* [HELP:NEWS:CONFIG] END */

/* [HELP:NEWS:IMAGE:RESOLVE] START — map nøgle → billedsti */
function resolveImage(v?: string) {
  if (!v) return "/news/default.jpg";
  if (v.startsWith("/")) return v;
  const key = v.toLowerCase();
  const map: Record<string, string> = {
    op1: "/news/op1.jpg",
    op2: "/news/op2.jpg",
    op3: "/news/op3.jpg",
    op4: "/news/op4.jpg",
    julecup: "/images/hero/julecup.jpg",
    default: "/news/default.jpg",
  };
  return map[key] || map.default;
}
/* [HELP:NEWS:IMAGE:RESOLVE] END */

export default function NewsHeroOverlay() {
  /* [HELP:NEWS:STATE] START */
  const [items, setItems] = useState<NewsItem[]>([]);
  const [idx, setIdx] = useState(0);
  /* [HELP:NEWS:STATE] END */

  /* [HELP:NEWS:DATA:FETCH] START — GET /api/news → sortér → max N */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/news", { cache: "no-store" });
        const data = await res.json();
        let arr: NewsItem[] = Array.isArray(data?.items) ? data.items : [];
        arr = arr.filter(x => typeof x?.title === "string" && x.title.trim() !== "");
        const hasOrder = arr.some(x => typeof x?.order === "number");
        if (hasOrder) arr.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        else arr.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        setItems(arr.slice(0, MAX_ITEMS));
        setIdx(0);
      } catch {
        setItems([]);
        setIdx(0);
      }
    })();
  }, []);
  /* [HELP:NEWS:DATA:FETCH] END */

  /* [HELP:NEWS:AUTOPLAY] START — skift mellem nyheder */
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, [items.length]);
  /* [HELP:NEWS:AUTOPLAY] END */

  const it = items[idx];
  if (!it) return null;

  /* [HELP:NEWS:IMAGE:FIT] START — beregn billede og fit */
  const imgSrc = resolveImage(it.image);
  const imgFit: "cover" | "contain" = it.fit && it.fit !== "auto" ? it.fit : "contain";
  /* [HELP:NEWS:IMAGE:FIT] END */

  // [HELP:NEWS:RENDER] START — højre-nedre overlay boks i HERO
  return (
    <div
      className="
        absolute
        right-[max(env(safe-area-inset-right),0.5rem)]
        bottom-[max(env(safe-area-inset-bottom),0.5rem)]
        z-20 pointer-events-auto
        w-[min(64vw,280px)]    /* MOBIL: væsentligt mindre */
        sm:w-[300px]
        md:w-[320px]
        lg:w-[340px]
      "
    >
      <a
        href={it.url || "#"}
        className="relative block rounded-xl bg-black/55 backdrop-blur-sm p-2.5 sm:p-3 hover:bg-black/65 transition"
      >
        {/* [HELP:NEWS:IMAGE] START — kompakt billedramme (4:3) */}
        <div className="mb-2 overflow-hidden rounded-lg">
          <div className="relative w-full aspect-[4/3] bg-black/20 flex items-center justify-center">
            <img
              src={imgSrc}
              alt={it.title}
              className="max-w-full max-h-full object-center"
              style={{ objectFit: imgFit }}
              loading="lazy"
            />
          </div>
        </div>
        {/* [HELP:NEWS:IMAGE] END */}

        {/* [HELP:NEWS:TEXT] START — dato/titel/teaser */}
        <div className="text-white">
          {it.date && <div className="text-[10px] opacity-80 leading-none">{it.date}</div>}
          <div className="text-sm sm:text-base font-semibold leading-snug line-clamp-2">
            {it.title}
          </div>
          {it.teaser && (
            <div className="hidden sm:block text-[13px] opacity-90 mt-1 line-clamp-1">
              {it.teaser}
            </div>
          )}
        </div>
        {/* [HELP:NEWS:TEXT] END */}

        {/* [HELP:NEWS:DOTS] START — indikator prikker */}
        {items.length > 1 && (
          <div className="absolute right-2 bottom-2 flex gap-1">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Vis nyhed ${i + 1}`}
                onClick={(e) => {
                  e.preventDefault();
                  setIdx(i);
                }}
                className={`h-2 w-2 rounded-full ${
                  i === idx ? "bg-white" : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
        {/* [HELP:NEWS:DOTS] END */}
      </a>
    </div>
  );
  // [HELP:NEWS:RENDER] END
}
