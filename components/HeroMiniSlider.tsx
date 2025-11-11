"use client";

/* [HELP:HERO:MINI:IMPORTS] START */
import { useEffect, useRef, useState } from "react";
/* [HELP:HERO:MINI:IMPORTS] END */

/* [HELP:HERO:MINI:TYPES] START */
type Slide = { url: string; alt?: string };
/* [HELP:HERO:MINI:TYPES] END */

export default function HeroMiniSlider() {
  /* [HELP:HERO:MINI:STATE] START */
  const [slides, setSlides] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /* [HELP:HERO:MINI:STATE] END */

  /* [HELP:HERO:MINI:CONFIG] START */
  const INTERVAL_MS = 4000;
  /* [HELP:HERO:MINI:CONFIG] END */

  /* [HELP:HERO:MINI:DATA:FETCH] START */
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
  /* [HELP:HERO:MINI:DATA:FETCH] END */

  /* [HELP:HERO:MINI:AUTOPLAY] START */
  useEffect(() => {
    // ryd evt. eksisterende interval og nulstil ref
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (slides.length > 1) {
      timerRef.current = setInterval(() => {
        setIdx((i) => (i + 1) % slides.length);
      }, INTERVAL_MS);
    }

    // returnér ALTID en cleanup-funktion (ikke null)
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [slides.length]);
  /* [HELP:HERO:MINI:AUTOPLAY] END */

  if (slides.length === 0) return null;
  const s = slides[idx];

  // [HELP:HERO:MINI:RENDER] START — lille overlay-slider i højre hjørne
  return (
    <div className="absolute right-6 top-6 w-[420px] max-w-[92vw] z-10">
      <div className="rounded-2xl bg-black/60 backdrop-blur-sm p-2 shadow-lg">
        <div className="overflow-hidden rounded-xl">
          <img
            src={s.url}
            alt={s.alt || "Hero slide"}
            className="w-full h-48 object-cover"
            loading="eager"
          />
        </div>

        {slides.length > 1 && (
          // [HELP:HERO:MINI:DOTS] START — manuelle dot-kontroller
          <div className="mt-2 flex gap-1 justify-end">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-2.5 w-2.5 rounded-full ${
                  i === idx ? "bg-white" : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
          // [HELP:HERO:MINI:DOTS] END
        )}
      </div>
    </div>
  );
  // [HELP:HERO:MINI:RENDER] END
}
