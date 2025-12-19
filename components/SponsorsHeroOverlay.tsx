"use client";

/* [HELP:SPONSORS:IMPORTS] START */
import { useEffect, useState } from "react";
import Link from "next/link";
/* [HELP:SPONSORS:IMPORTS] END */

type SponsorItem = {
  name: string;
  logo_url?: string;
  website?: string;
  teaser?: string;
  note?: string;
  visible?: string;
  order?: number | string;
};

function firstLine(s: string) {
  return (s || "").split(/\r?\n/)[0].trim();
}

export default function SponsorsHeroOverlay() {
  const [items, setItems] = useState<SponsorItem[]>([]);
  const [idx, setIdx] = useState(0);

  /* [HELP:SPONSORS:DATA:FETCH] START */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sheet?tab=SPONSORER&limit=2000", {
          cache: "no-store",
        });
        const data = await res.json();

        const arr: SponsorItem[] = Array.isArray(data?.items) ? data.items : [];
        const clean = arr
          .map((x) => ({
            ...x,
            name: firstLine(String(x?.name || "")),
            visible: String(x?.visible || "").trim().toUpperCase(),
          }))
          .filter((x) => x.name)
          .filter((x) => x.visible === "" || x.visible === "YES")
          .sort((a, b) => Number(a?.order ?? 9999) - Number(b?.order ?? 9999));

        setItems(clean);
        setIdx(0);
      } catch (e) {
        console.error("SponsorsHeroOverlay fetch error", e);
      }
    })();
  }, []);
  /* [HELP:SPONSORS:DATA:FETCH] END */

  /* [HELP:SPONSORS:TIMER] START */
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIdx((p) => (p + 1 >= items.length ? 0 : p + 1));
    }, 7000);
    return () => clearInterval(id);
  }, [items.length]);
  /* [HELP:SPONSORS:TIMER] END */

  if (!items.length) return null;

  const current = items[Math.min(idx, items.length - 1)];
  const teaser =
    (current.teaser && current.teaser.trim()) ||
    (current.note && current.note.trim()) ||
    "Vi takker vores sponsorer — uden jer, ingen baner.";

  return (
    <div className="card group h-full flex flex-col text-left">
      <div className="kicker mb-1">
        <span className="h-2 w-2 rounded-full bg-orange-500" />
        SPONSORER
      </div>

      <div className="flex flex-1 flex-col gap-4 md:flex-row">
        {/* Tekstside */}
        <div className="flex flex-1 flex-col justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-neutral-900">
              {current.name}
            </h2>
            <p className="text-sm text-neutral-700">{teaser}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/sponsor" className="btn btn-primary">
              Vil du stå her? Bliv sponsor →
            </Link>
            <Link href="/sponsorvaeg" className="btn btn-secondary">
              Se sponsorvæg
            </Link>
          </div>
        </div>

        {/* Logo-side */}
        <div className="relative w-full md:w-40 lg:w-48 shrink-0">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {current.logo_url ? (
              <img
                src={current.logo_url}
                alt={`${current.name} logo`}
                className="h-32 md:h-full w-full object-contain p-4"
              />
            ) : (
              <div className="flex h-32 items-center justify-center text-[11px] text-neutral-400">
                Intet logo valgt
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div className="mt-3 flex items-center justify-end gap-1 text-[9px] text-neutral-400">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-2 w-2 rounded-full transition ${
                i === idx ? "bg-orange-600" : "bg-slate-200 hover:bg-orange-500"
              }`}
              aria-label={`Vis sponsor ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
