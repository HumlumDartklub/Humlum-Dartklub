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

  /* [HELP:HERO:CONFIG] START — interval for auto-skift (ms) */
  const INTERVAL_MS = 4000;
  /* [HELP:HERO:CONFIG] END */

  /* [HELP:HERO:DATA:FETCH] START — hent hero-slides fra /api/hero */
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

  /* [HELP:HERO:AUTOPLAY] START — autoplay mellem slides */
  useEffect(() => {
    // ryd evt. tidligere interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (slides.length > 1) {
      timerRef.current = setInterval(() => {
        setIdx((i) => (i + 1) % slides.length);
      }, INTERVAL_MS);
    }

    // returnér altid en cleanup-funktion, aldrig null
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [slides.length]);
  /* [HELP:HERO:AUTOPLAY] END */

  // [HELP:HERO:RENDER] START — dækker hele HERO som baggrundslag
  return (
    <div className="absolute inset-0 rounded-[inherit] overflow-hidden z-0 pointer-events-none">
      {/* [HELP:HERO:RENDER:IMAGES] START — billede/fade mellem slides */}
      {slides.length > 0 ? (
        slides.map((s, i) => (
          <img
            key={`${s.url}-${i}`}
            src={s.url}
            alt={s.alt || ""}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))
      ) : (
        // [HELP:HERO:RENDER:FALLBACK] START — fallback når ingen slides
        <img
          src="/assets/hero.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        // [HELP:HERO:RENDER:FALLBACK] END
      )}
      {/* [HELP:HERO:RENDER:IMAGES] END */}

      {/* [HELP:HERO:RENDER:OVERLAY] START — subtil mørk overlay for læsbarhed */}
      <div className="absolute inset-0 bg-black/20" />
      {/* [HELP:HERO:RENDER:OVERLAY] END */}
    </div>
  );
  // [HELP:HERO:RENDER] END
}
