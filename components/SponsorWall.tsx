"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_SPONSOR_WALL_CTA,
  normalizeSponsorRow,
  normalizeSponsorWallCta,
  sortWallItems,
  type SponsorWallCta,
  type SponsorWallItem,
} from "@/lib/sponsorWall";

type Props = { tvMode?: boolean; showControls?: boolean };

function SponsorLogo({ item, className = "" }: { item: SponsorWallItem; className?: string }) {
  if (!item.logoUrl) {
    return <div className={`flex items-center justify-center text-center font-black tracking-wide ${className}`}>{item.displayName}</div>;
  }
  return <img src={item.logoUrl} alt={item.displayName} className={`object-contain ${className}`} loading="eager" />;
}

function DividerTitle({ children, gold = false }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <div className="flex items-center gap-3 sm:gap-5">
      <span className={`h-px flex-1 ${gold ? "bg-gradient-to-r from-transparent via-amber-400 to-amber-400" : "bg-gradient-to-r from-transparent via-orange-500 to-sky-500"}`} />
      <h2 className={`shrink-0 text-center text-xs font-black uppercase tracking-[0.28em] sm:text-base ${gold ? "text-amber-300" : "text-white"}`}>{children}</h2>
      <span className={`h-px flex-1 ${gold ? "bg-gradient-to-l from-transparent via-amber-400 to-amber-400" : "bg-gradient-to-l from-transparent via-orange-500 to-sky-500"}`} />
    </div>
  );
}

export default function SponsorWall({ tvMode = false, showControls = true }: Props) {
  const [items, setItems] = useState<SponsorWallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cta, setCta] = useState<SponsorWallCta>(DEFAULT_SPONSOR_WALL_CTA);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [sponsorRes, ctaRes] = await Promise.all([
          fetch("/api/sheet?tab=SPONSORER&limit=500", { cache: "no-store" }),
          fetch("/api/sheet?tab=SPONSORVAEG_TEKST&limit=10", { cache: "no-store" }),
        ]);
        const sponsorData = await sponsorRes.json();
        const ctaData = await ctaRes.json().catch(() => ({ ok: false, items: [] }));
        if (!sponsorRes.ok || sponsorData?.ok === false) throw new Error(sponsorData?.error || "Kunne ikke hente sponsorer");
        const rows = Array.isArray(sponsorData?.items) ? sponsorData.items : [];
        const normalized = sortWallItems(rows.map(normalizeSponsorRow)).filter((x) => x.visible && x.category !== "hidden");
        const ctaRow = Array.isArray(ctaData?.items) ? ctaData.items[0] : null;
        if (alive) {
          setItems(normalized);
          setCta(normalizeSponsorWallCta(ctaRow));
        }
      } catch (e: any) {
        if (alive) setError(e?.message || "Kunne ikke hente sponsorer");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const timer = tvMode ? window.setInterval(load, 5 * 60 * 1000) : undefined;
    return () => {
      alive = false;
      if (timer) window.clearInterval(timer);
    };
  }, [tvMode]);

  const gold = useMemo(() => items.filter((x) => x.category === "gold"), [items]);
  const lanes = useMemo(() => items.filter((x) => x.category === "lane" && x.lane), [items]);
  const support = useMemo(
    () => items.filter((x) => {
      if (x.category !== "support") return false;
      const name = (x.displayName || "").trim().toLowerCase();
      // Gamle tekst-rækker skal ikke vises som sponsorfliser på væggen.
      return !name.includes("tak til alle sponsor");
    }),
    [items]
  );

  const goldGridClass = gold.length <= 3 ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-3";

  const supportWidthClass = (() => {
    if (!tvMode) return "w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] xl:w-[calc(25%-0.75rem)]";
    if (support.length <= 1) return "w-full max-w-[560px]";
    if (support.length <= 2) return "w-full sm:w-[calc(50%-0.5rem)] max-w-[520px]";
    if (support.length <= 6) return "w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]";
    if (support.length <= 10) return "w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] xl:w-[calc(20%-0.8rem)]";
    return "w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(25%-0.5rem)] xl:w-[calc(16.666%-0.7rem)]";
  })();

  const supportCardClass = tvMode
    ? support.length <= 2
      ? "min-h-[170px] px-8 py-6"
      : support.length <= 6
        ? "min-h-[140px] px-5 py-4"
        : support.length <= 10
          ? "min-h-[118px] px-4 py-3"
          : "min-h-[98px] px-3 py-2.5"
    : "min-h-[112px] p-3";

  const supportLogoClass = tvMode
    ? support.length <= 2
      ? "max-h-28"
      : support.length <= 6
        ? "max-h-20"
        : support.length <= 10
          ? "max-h-16"
          : "max-h-12"
    : "max-h-14";

  const tvFooterTitleClass = tvMode
    ? cta.tvTextSize === "xlarge"
      ? "text-2xl sm:text-4xl"
      : cta.tvTextSize === "large"
        ? "text-xl sm:text-3xl"
        : "text-base sm:text-xl"
    : "text-sm sm:text-lg";

  const tvFooterCtaClass = tvMode
    ? cta.tvTextSize === "xlarge"
      ? "text-lg sm:text-2xl"
      : cta.tvTextSize === "large"
        ? "text-base sm:text-xl"
        : "text-xs sm:text-sm"
    : "text-xs sm:text-sm";

  const tvFooterTextClass = tvMode
    ? cta.tvTextSize === "xlarge"
      ? "text-base sm:text-xl"
      : cta.tvTextSize === "large"
        ? "text-sm sm:text-lg"
        : "text-[10px] sm:text-xs"
    : "text-[10px] sm:text-xs";

  return (
    <main className={tvMode ? "min-h-screen bg-[#03162c] p-3 sm:p-5" : "mx-auto max-w-[1500px] px-3 py-6 sm:px-6 sm:py-10"}>
      <section className="relative overflow-hidden rounded-[28px] border border-sky-400/20 bg-[#061a33] text-white shadow-[0_30px_90px_rgba(2,12,27,.35)]">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle at 10% 10%, rgba(249,115,22,.18), transparent 23%), radial-gradient(circle at 90% 15%, rgba(14,165,233,.18), transparent 25%), linear-gradient(135deg, rgba(255,255,255,.025) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.025) 50%, rgba(255,255,255,.025) 75%, transparent 75%)", backgroundSize: "auto, auto, 44px 44px" }} />
        <div className="pointer-events-none absolute -left-24 top-12 h-64 w-64 rotate-12 border-[18px] border-orange-500/10" />
        <div className="pointer-events-none absolute -right-24 top-10 h-64 w-64 -rotate-12 border-[18px] border-sky-500/10" />

        <div className={tvMode ? "relative p-4 sm:p-7" : "relative p-5 sm:p-9"}>
          <header className="mb-5 text-center sm:mb-7">
            <div className="flex items-center justify-center gap-3">
              <span className="hidden h-[3px] w-20 bg-gradient-to-r from-transparent via-white to-orange-500 sm:block" />
              <h1 className="text-3xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl">
                <span className="text-white">Humlum </span><span className="text-orange-500">Dartklub</span>
              </h1>
              <span className="hidden h-[3px] w-20 bg-gradient-to-l from-transparent via-white to-sky-500 sm:block" />
            </div>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.32em] text-slate-200 sm:text-xl">Vores sponsorer</p>
            <p className="mt-1 text-xs italic text-slate-300 sm:text-base">Tak til alle der støtter klubben</p>
          </header>

          {loading ? <div className="py-24 text-center text-slate-300">Henter sponsorvæg…</div> : error ? <div className="rounded-2xl border border-red-400/30 bg-red-950/40 p-5 text-center text-red-100">{error}</div> : (
            <div className="space-y-5 sm:space-y-7">
              <section>
                <DividerTitle gold>Guldsponsorer</DividerTitle>
                <div className={`mt-4 grid grid-cols-1 gap-3 sm:gap-4 ${goldGridClass}`}>
                  {gold.map((item) => (
                    <a key={`${item.row}-${item.displayName}`} href={item.website || undefined} target={item.website ? "_blank" : undefined} rel="noreferrer" className={`group relative flex flex-col overflow-hidden rounded-2xl border border-amber-400/80 bg-gradient-to-b from-[#17140b] via-[#0c1119] to-[#070b11] shadow-[inset_0_0_0_1px_rgba(255,214,102,.22),0_12px_28px_rgba(0,0,0,.3)] ${tvMode ? "min-h-[205px] p-5" : "min-h-[150px] p-4 sm:min-h-[190px] sm:p-5"}`}>
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_center,rgba(255,210,90,.22),transparent_65%)]" />
                      <div className="relative flex flex-1 items-center justify-center rounded-xl bg-white/[0.035] p-3">
                        <SponsorLogo item={item} className={tvMode ? "max-h-28 w-full" : "max-h-20 w-full sm:max-h-24"} />
                      </div>
                      <div className="mt-3 border-t border-amber-400/40 pt-2 text-center">
                        <div className="text-sm font-bold text-amber-300 sm:text-lg">{item.displayName}</div>
                        {item.showExtra && item.subtitle && <div className="mt-0.5 text-[10px] font-semibold text-slate-200 sm:text-xs">{item.subtitle}</div>}
                        {item.showExtra && item.extra && <div className="mt-0.5 text-[9px] text-slate-400 sm:text-[11px]">{item.extra}</div>}
                      </div>
                    </a>
                  ))}
                </div>
              </section>

              <section>
                <DividerTitle>Banesponsorer</DividerTitle>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 sm:gap-3">
                  {lanes.map((item) => (
                    <a key={`${item.row}-${item.lane}`} href={item.website || undefined} target={item.website ? "_blank" : undefined} rel="noreferrer" className={`flex flex-col overflow-hidden rounded-xl border border-white/30 bg-gradient-to-b from-white to-slate-100 text-slate-950 shadow-[0_8px_18px_rgba(0,0,0,.23)] ${tvMode ? "min-h-[145px] p-3" : "min-h-[112px] p-2.5 sm:min-h-[130px]"}`}>
                      <div className="flex flex-1 items-center justify-center p-1"><SponsorLogo item={item} className={tvMode ? "max-h-20 w-full" : "max-h-14 w-full sm:max-h-16"} /></div>
                      <div className="mt-1 text-center text-[10px] font-bold leading-tight text-slate-800">{item.displayName}</div>
                      {item.showExtra && item.subtitle && <div className="mt-0.5 text-center text-[9px] leading-tight text-slate-600">{item.subtitle}</div>}
                      {item.showExtra && item.extra && <div className="mt-0.5 text-center text-[8px] leading-tight text-slate-500">{item.extra}</div>}
                      <div className="mt-1.5 border-t border-slate-200 pt-1.5 text-center text-[11px] font-black uppercase tracking-wider text-[#062b55] sm:text-xs">Bane {String(item.lane).padStart(2, "0")}</div>
                    </a>
                  ))}
                </div>
              </section>

              {support.length > 0 && (
                <section>
                  <DividerTitle>Støtter</DividerTitle>
                  <div className="mx-auto mt-4 flex w-full flex-wrap justify-center gap-3 sm:gap-4">
                    {support.map((item) => {
                      const content = item.kind === "text" ? (
                        <>
                          <div className={tvMode ? "text-xl font-black uppercase tracking-wide text-orange-300" : "text-base font-black uppercase tracking-wide text-orange-300"}>{item.displayName}</div>
                          {item.subtitle && <div className={tvMode ? "mt-2 text-sm font-semibold text-white" : "mt-2 text-xs font-semibold text-white"}>{item.subtitle}</div>}
                          {item.extra && <div className={tvMode ? "mt-1 text-xs text-slate-300" : "mt-1 text-[11px] text-slate-300"}>{item.extra}</div>}
                        </>
                      ) : (
                        <>
                          <SponsorLogo item={item} className={`${supportLogoClass} w-full`} />
                          <div className={tvMode ? "mt-2 text-base font-bold text-white" : "mt-2 text-[10px] font-semibold text-slate-200 sm:text-xs"}>{item.displayName}</div>
                          {item.showExtra && item.subtitle && <div className="mt-0.5 text-[10px] text-slate-300 sm:text-xs">{item.subtitle}</div>}
                          {item.showExtra && item.extra && <div className="mt-0.5 text-[9px] text-slate-400 sm:text-[11px]">{item.extra}</div>}
                        </>
                      );
                      const cls = `flex flex-col items-center justify-center rounded-2xl border text-center shadow-[0_10px_26px_rgba(0,0,0,.24)] ${supportWidthClass} ${supportCardClass} ${item.kind === "text" ? "border-dashed border-orange-400/80 bg-[#10243d]/95" : "border-slate-400/70 bg-[#0b213a]/95"}`;
                      return item.website && item.kind !== "text" ? (
                        <a key={`${item.row}-${item.displayName}`} href={item.website} target="_blank" rel="noreferrer" className={cls}>{content}</a>
                      ) : (
                        <div key={`${item.row}-${item.displayName}`} className={cls}>{content}</div>
                      );
                    })}
                  </div>
                </section>
              )}

              {(cta.visible && (!tvMode || cta.tvVisible)) && (
                <section className={tvMode ? "pt-1" : "pt-2"}>
                  <div className="border-t border-white/15 pt-4 text-center sm:pt-5">
                    <div className={`font-black uppercase tracking-[0.20em] text-white ${tvFooterTitleClass}`}>Tak til alle vores sponsorer</div>
                    <div className="mx-auto mt-2 flex max-w-4xl flex-col items-center justify-center gap-1 sm:flex-row sm:gap-2">
                      <span className={`font-bold text-orange-300 ${tvFooterCtaClass}`}>{cta.title}</span>
                      <span className="hidden text-slate-500 sm:inline">•</span>
                      <span className={`text-slate-300 ${tvFooterTextClass}`}>{cta.text}</span>
                    </div>
                    {!tvMode && cta.buttonVisible && cta.buttonText && (
                      <Link href={cta.link || "/sponsor"} className="mt-3 inline-flex rounded-full bg-orange-500 px-4 py-1.5 text-xs font-black text-white hover:bg-orange-400">
                        {cta.buttonText}
                      </Link>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}


        </div>
      </section>
    </main>
  );
}
