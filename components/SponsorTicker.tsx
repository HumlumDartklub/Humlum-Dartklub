"use client";

/* [HELP:SPONSOR_TICKER:IMPORTS] START */
import { useEffect, useMemo, useRef, useState } from "react";
/* [HELP:SPONSOR_TICKER:IMPORTS] END */

/* [HELP:SPONSOR_TICKER:TYPES] START */
type Sponsor = {
  name: string;
  logo_url?: string;
  website?: string;
  visible?: string;
  order?: number;
};
/* [HELP:SPONSOR_TICKER:TYPES] END */

function firstLine(s: string) {
  return (s || "").split(/\r?\n/)[0].trim();
}

function normalizeUrl(url?: string) {
  const u = (url || "").trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

export default function SponsorTicker() {
  /* [HELP:SPONSOR_TICKER:STATE] START */
  const [items, setItems] = useState<Sponsor[]>([]);
  const railRef = useRef<HTMLDivElement | null>(null);
  /* [HELP:SPONSOR_TICKER:STATE] END */

  /* [HELP:SPONSOR_TICKER:FETCH] START */
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        // Brug vores egen proxy, så vi altid rammer korrekt og samme origin
        const res = await fetch("/api/sheet?tab=SPONSORER&limit=2000", { cache: "no-store" });
        const data = await res.json();
        const arr = Array.isArray(data?.items) ? data.items : [];
        if (!dead) setItems(arr);
      } catch {
        if (!dead) setItems([]);
      }
    })();
    return () => {
      dead = true;
    };
  }, []);
  /* [HELP:SPONSOR_TICKER:FETCH] END */

  const sponsors = useMemo(() => {
    return (items || [])
      .map((s) => ({
        name: firstLine(String(s?.name || "")),
        logo_url: String(s?.logo_url || "").trim(),
        website: normalizeUrl(String(s?.website || "")),
        visible: String(s?.visible || "").trim().toUpperCase(),
        order: Number(s?.order || 0),
      }))
      .filter((s) => s.name && (s.visible === "" || s.visible === "YES"))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [items]);

  if (!sponsors.length) return null;

  /* [HELP:SPONSOR_TICKER:SCROLL] START */
  function scrollByDir(dir: -1 | 1) {
    const el = railRef.current;
    if (!el) return;
    const amount = Math.max(240, Math.round(el.clientWidth * 0.65)) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }
  /* [HELP:SPONSOR_TICKER:SCROLL] END */

  return (
    <div className="srail">
      {/* Lead / “råber” */}
      <div className="srail__lead">
        <span className="srail__badge">SPONSORER</span>
        <span className="srail__msg">Tak — uden jer, ingen baner.</span>
        <a className="srail__cta" href="/sponsor">
          Bliv sponsor →
        </a>
      </div>

      {/* Venstre/højre knapper (slide-agtigt) */}
      <button className="srail__nav" aria-label="Forrige" onClick={() => scrollByDir(-1)}>
        ‹
      </button>

      <div className="srail__wrap" ref={railRef}>
        {sponsors.map((s, i) => {
          const Tag: any = s.website ? "a" : "div";
          const props = s.website
            ? { href: s.website, target: "_blank", rel: "noopener noreferrer" }
            : {};
          return (
            <Tag className="srail__item" key={`${s.name}-${i}`} {...props}>
              {s.logo_url ? (
                <img
                  src={s.logo_url}
                  alt={`${s.name} logo`}
                  className="srail__logo"
                  style={{ width: 36, height: 36 }}
                  loading="lazy"
                />
              ) : (
                <span className="srail__logoFallback" aria-hidden="true">
                  {s.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="srail__name" title={s.name}>
                {s.name}
              </span>
            </Tag>
          );
        })}
      </div>

      <button className="srail__nav" aria-label="Næste" onClick={() => scrollByDir(1)}>
        ›
      </button>

      <style jsx>{`
        /* Dobbelt-højde vibe + mere solid baggrund så watermark ikke “larmer” */
        .srail {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 60px;
          padding: 0 10px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .srail__lead {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-right: 12px;
          border-right: 1px solid rgba(0, 0, 0, 0.08);
          white-space: nowrap;
          flex: 0 0 auto;
        }

        .srail__badge {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.6px;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(255, 122, 0, 0.12);
          border: 1px solid rgba(255, 122, 0, 0.25);
        }

        .srail__msg {
          font-size: 13px;
          font-weight: 700;
          color: rgba(15, 23, 42, 0.9);
        }

        .srail__cta {
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          color: rgba(15, 23, 42, 0.95);
          padding: 7px 11px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 1);
        }

        .srail__cta:hover {
          background: rgba(255, 255, 255, 0.85);
        }

        .srail__nav {
          flex: 0 0 auto;
          height: 40px;
          width: 34px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 1);
          font-size: 22px;
          font-weight: 900;
          line-height: 1;
          cursor: pointer;
        }

        .srail__wrap {
          flex: 1 1 auto;
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          padding: 0 6px;
          align-items: center;
        }

        .srail__wrap::-webkit-scrollbar {
          display: none;
        }

        .srail__item {
          scroll-snap-align: start;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 1);
          text-decoration: none;
          color: inherit;
          flex: 0 0 auto;
          max-width: 320px;
        }

        .srail__item:hover {
          background: rgba(255, 255, 255, 0.88);
        }

        .srail__logo {
          object-fit: contain;
          border-radius: 10px;
          display: block;
        }

        .srail__logoFallback {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(0, 0, 0, 0.03);
        }

        .srail__name {
          font-size: 13px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.92);
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 740px) {
          .srail__msg {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
