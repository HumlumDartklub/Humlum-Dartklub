"use client";

/* [HELP:HERO:IMPORTS] START
 * Pitch: Importer til hero-baggrundsslideren.
 * [HELP:HERO:IMPORTS] END */
import { useEffect, useRef, useState } from "react";

/* [HELP:HERO:TYPES] START — datatype for slides */
type Slide = { url: string; alt?: string };
/* [HELP:HERO:TYPES] END */

export default function HeroBackdropSlider() {
  /* [HELP:HERO:STATE] START — lokal state */
  const [slides, setSlides] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /* [HELP:HERO:STATE] END */

  /* [HELP:HERO:DATA:FETCH] START — hent slides fra /api/hero */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/hero", { cache: "no-store" });
        const data = await res.json();
        const arr: Slide[] = Array.isArray(data?.items) ? data.items : [];
        setSlides(arr);
        setIdx(0);
      } catch {
        setSlides([]);
        setIdx(0);
      }
    })();
  }, []);
  /* [HELP:HERO:DATA:FETCH] END */

  /* [HELP:HERO:AUTOPLAY] START — simple autoplay */
  useEffect(() => {
    if (!slides.length) return;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIdx((v) => (v + 1) % slides.length);
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [slides.length]);
  /* [HELP:HERO:AUTOPLAY] END */

  // [HELP:HERO:RENDER] START
  const current = slides[idx];

  return (
    <div className="absolute inset-0">
      {/* [HELP:HERO:RENDER:BG] START — selve billedet */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage: current?.url ? `url("${current.url}")` : undefined,
          filter: "saturate(1.06) contrast(1.03)",
        }}
      />
      {/* [HELP:HERO:RENDER:BG] END */}

      {/* [HELP:HERO:RENDER:OVERLAY] START — let mørk overlay for læsbarhed */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/40" />
      {/* [HELP:HERO:RENDER:OVERLAY] END */}

      {/* [HELP:HERO:RENDER:BRAND_FOG] START — premium fog */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px circle at 18% 20%, rgba(249,115,22,0.12), transparent 58%), radial-gradient(900px circle at 82% 0%, rgba(37,99,235,0.10), transparent 62%)",
        }}
      />
      {/* [HELP:HERO:RENDER:BRAND_FOG] END */}
    </div>
  );
  // [HELP:HERO:RENDER] END
}
