"use client";

/* [HELP:SPOTLIGHT:FILE] START
 * Sponsor Spotlight Slider (forside)
 * - 1 sponsor ad gangen
 * - Auto-skift hver intervalMs (default 5000ms)
 * - Crossfade (ingen blink)
 * - Fast højde (ingen hop)
 * - ATOMISK SKIFT: vi skifter først når næste logo er loaded + decoded
 * [HELP:SPOTLIGHT:FILE] END */

import { useEffect, useMemo, useRef, useState } from "react";

type SponsorRow = {
  name?: string;
  company?: string;
  website?: string;
  url?: string;
  logo_url?: string;
  logo?: string;
  logoUrl?: string;
  visible?: string;
  order?: number | string;
  featured?: string;
  pin?: string;
};

function pickArray(p: any): SponsorRow[] {
  if (!p) return [];
  if (Array.isArray(p)) return p;
  if (Array.isArray(p.itemsNormalized)) return p.itemsNormalized;
  if (Array.isArray(p.items)) return p.items;
  if (Array.isArray(p.rows)) return p.rows;
  if (Array.isArray(p.data)) return p.data;
  return [];
}

function isYesLoose(v: any): boolean {
  const s = String(v ?? "").trim().toUpperCase();
  return s === "" || s === "YES" || s === "JA" || s === "TRUE" || s === "1";
}
function isYesStrict(v: any): boolean {
  const s = String(v ?? "").trim().toUpperCase();
  return s === "YES" || s === "JA" || s === "TRUE" || s === "1";
}
function toNum(v: any, d = 9999) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function pickName(r: SponsorRow) {
  return String(r?.name ?? r?.company ?? "").trim();
}
function pickLogo(r: SponsorRow) {
  return String(r?.logo_url ?? r?.logoUrl ?? r?.logo ?? "").trim() || "";
}
function pickUrl(r: SponsorRow) {
  return String(r?.website ?? r?.url ?? "").trim() || "";
}
function normalizeUrl(u: string) {
  if (!u) return "";
  if (u.startsWith("/")) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

type Sponsor = { name: string; logo: string; url: string; order: number };

function SlideCard({
  sponsor,
  showDots,
  dotsCount,
  activeDot,
  onDotClick,
}: {
  sponsor: Sponsor | null;
  showDots: boolean;
  dotsCount: number;
  activeDot: number;
  onDotClick: (i: number) => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white/60 px-8 py-7">
      {/* Logo */}
      {sponsor?.url ? (
        <a
          href={sponsor.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Åbn ${sponsor.name} hjemmeside`}
          className="inline-flex"
        >
          <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-2xl border border-dashed border-slate-200 bg-white overflow-hidden grid place-items-center">
            {sponsor.logo ? (
              <img
                key={sponsor.logo}
                src={sponsor.logo}
                alt={sponsor.name}
                className="h-full w-full object-contain p-4"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            ) : (
              <div className="text-sm font-semibold text-slate-500">Logo</div>
            )}
          </div>
        </a>
      ) : (
        <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-2xl border border-dashed border-slate-200 bg-white overflow-hidden grid place-items-center">
          {sponsor?.logo ? (
            <img
              key={sponsor.logo}
              src={sponsor.logo}
              alt={sponsor.name}
              className="h-full w-full object-contain p-4"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <div className="text-sm font-semibold text-slate-500">Logo</div>
          )}
        </div>
      )}

      {/* Navn (fast højde = ingen hop) */}
      <div className="mt-4 w-72 min-h-[2.6rem]">
        <div
          className="text-sm font-semibold text-slate-900 text-center leading-tight whitespace-normal"
          style={{ hyphens: "none", wordBreak: "normal", overflowWrap: "normal" }}
        >
          {sponsor?.name ?? ""}
        </div>
      </div>

      {/* Dots (reserver plads) */}
      <div
        className={`mt-4 h-4 flex items-center justify-center gap-2 ${
          showDots ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {Array.from({ length: dotsCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Vis sponsor ${i + 1}`}
            onClick={() => onDotClick(i)}
            className={`h-2 w-2 rounded-full ${i === activeDot ? "bg-orange-500" : "bg-slate-300"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function SponsorSpotlightSlider({ intervalMs = 5000 }: { intervalMs?: number }) {
  const [rows, setRows] = useState<SponsorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const sponsors = useMemo<Sponsor[]>(() => {
  const anyHomeFeatured = (rows || []).some((x: any) => isYesStrict(x?.home_featured));

  return (rows || [])
    .filter((r) => isYesLoose(r?.visible))
    .map((r) => {
      const name = pickName(r);
      const logo = pickLogo(r);
      const url = normalizeUrl(pickUrl(r));
      const order = toNum(r?.order, 9999);

      // [HELP:HOME_FEATURED:LOGIC] START
      const wallFeatured = isYesStrict((r as any).featured) || isYesStrict((r as any).pin);
      const homeFeatured = isYesStrict((r as any).home_featured);

      // Når der findes mindst én home_featured=YES, så bruger vi KUN home_featured til forsiden.
      // Ellers fallback til den gamle featured/pin så forsiden ikke går tom.
      const featured = anyHomeFeatured ? homeFeatured : wallFeatured;
      // [HELP:HOME_FEATURED:LOGIC] END

      return { name, logo, url, order, featured };
    })
    .filter((s) => s.featured && s.name.length > 0)
    .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
}, [rows]);


  // Atomisk “logo klar” cache: url -> Promise
  const loadPromiseRef = useRef<Map<string, Promise<void>>>(new Map());

  const ensureLogoReady = (logoUrl: string) => {
    if (!logoUrl) return Promise.resolve();

    const existing = loadPromiseRef.current.get(logoUrl);
    if (existing) return existing;

    const p = new Promise<void>((resolve) => {
      const img = new Image();
      img.src = logoUrl;

      img.onload = () => {
        // decode før vi skifter (når muligt)
        // @ts-ignore
        if (img.decode) {
          // @ts-ignore
          img.decode().then(() => resolve()).catch(() => resolve());
        } else resolve();
      };
      img.onerror = () => resolve(); // vi hænger ikke fast
    });

    loadPromiseRef.current.set(logoUrl, p);
    return p;
  };

  // Crossfade state (men vi starter kun fade når næste logo er klar)
  const [activeIdx, setActiveIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState<number | null>(null);
  const [fading, setFading] = useState(false);

  const hoverRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIdxRef = useRef(0);
  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);

  // Fetch
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/sheet?tab=SPONSORER", { cache: "no-store", signal: ac.signal });
        const json = await res.json().catch(() => ({}));
        setRows(pickArray(json));
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // Reset ved liste-ændring
  useEffect(() => {
    setActiveIdx(0);
    setNextIdx(null);
    setFading(false);
  }, [sponsors.length]);

  // Pre-warm: preload alle featured logoer (hjælper, men vi skifter stadig atomisk)
  useEffect(() => {
    sponsors.forEach((s) => {
      if (s.logo) ensureLogoReady(s.logo);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sponsors]);

  const startFadeTo = async (targetIdx: number) => {
    if (fading) return;
    const target = sponsors[targetIdx];
    if (!target) return;

    // ATOMISK: vent til logo er klar (eller resolve på error)
    await ensureLogoReady(target.logo);

    // hvis user hover’er eller listen ændrer sig midt i det hele, så drop
    if (!sponsors[targetIdx]) return;

    const DURATION = 320;
    setNextIdx(targetIdx);
    setFading(true);

    window.setTimeout(() => {
      setActiveIdx(targetIdx);
      setNextIdx(null);
      setFading(false);
    }, DURATION);
  };

  // Auto
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    if (sponsors.length <= 1) return;

    timerRef.current = setInterval(() => {
      if (hoverRef.current) return;
      if (fading) return;

      const current = activeIdxRef.current;
      const nxt = (current + 1) % sponsors.length;
      startFadeTo(nxt);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sponsors.length, intervalMs, fading]);

  // Loading placeholder (fast footprint)
  if (loading) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white/60 px-8 py-7">
          <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-2xl border border-dashed border-slate-200 bg-white grid place-items-center">
            <div className="text-sm text-slate-500">Loader…</div>
          </div>
          <div className="mt-4 w-72 min-h-[2.6rem]" />
          <div className="mt-4 h-4" />
        </div>
      </div>
    );
  }

  const current = sponsors[activeIdx] ?? null;
  const upcoming = nextIdx != null ? sponsors[nextIdx] : null;
  const showDots = sponsors.length > 1;

  return (
    <div
      className="flex flex-col items-center"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
    >
      <div className="relative">
        {/* Active */}
        <div className={`transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}>
          <SlideCard
            sponsor={current}
            showDots={showDots}
            dotsCount={sponsors.length}
            activeDot={activeIdx}
            onDotClick={(i) => startFadeTo(i)}
          />
        </div>

        {/* Next */}
        {upcoming ? (
          <div className={`absolute inset-0 transition-opacity duration-300 ${fading ? "opacity-100" : "opacity-0"}`}>
            <SlideCard
              sponsor={upcoming}
              showDots={showDots}
              dotsCount={sponsors.length}
              activeDot={nextIdx ?? activeIdx}
              onDotClick={(i) => startFadeTo(i)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
