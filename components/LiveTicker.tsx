"use client";

/* [HELP:TICKER:IMPORTS] START */
import { useEffect, useMemo, useState } from "react";
/* [HELP:TICKER:IMPORTS] END */

/* [HELP:TICKER:TYPES] START */
type Item = { message?: string };
/* [HELP:TICKER:TYPES] END */

export default function LiveTicker() {
  /* [HELP:TICKER:STATE] START */
  const [items, setItems] = useState<Item[]>([]);
  /* [HELP:TICKER:STATE] END */

  /* [HELP:TICKER:DATA:FETCH] START — GET /api/ticker → items:[{message}] */
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch("/api/ticker", { cache: "no-store" });
        const data = await res.json();
        const arr: Item[] = Array.isArray(data?.items) ? data.items : [];
        if (!canceled) setItems(arr);
      } catch {
        if (!canceled) setItems([]);
      }
    })();
    return () => { canceled = true; };
  }, []);
  /* [HELP:TICKER:DATA:FETCH] END */

  /* [HELP:TICKER:JOIN] START — fold beskeder til én stribe med bullets */
  const joined = useMemo(() => {
    const msgs = items.map(i => (i.message || "").trim()).filter(Boolean);
    return msgs.join("   •   ");
  }, [items]);
  /* [HELP:TICKER:JOIN] END */

  if (!joined) return null;

  /* [HELP:TICKER:CONTENT] START — dupliker indhold til uendelig rul */
  const content = `${joined}   •   ${joined}   •   ${joined}   •   `;
  /* [HELP:TICKER:CONTENT] END */

  /* [HELP:TICKER:SPEED] START — rullehastighed (sekunder) baseret på længde */
  const seconds = Math.max(40, Math.min(120, Math.round(joined.length / 2)));
  /* [HELP:TICKER:SPEED] END */

  // [HELP:TICKER:RENDER] START
  return (
    <div className="ticker-bar">
      {/* Container i samme bredde som siden */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="ticker-wrap">
          <div className="ticker" style={{ animationDuration: `${seconds}s` }}>
            <span className="ticker__content">{content}</span>
            <span className="ticker__content" aria-hidden="true">{content}</span>
          </div>
        </div>
      </div>

      {/* [HELP:TICKER:STYLE] START — lokal CSS for ticker (ingen UI-ændring, kun kommentarer) */}
      <style jsx>{`
        /* Ingen fuldbredde-baggrund på hele skærmen */
        .ticker-bar {
          background: transparent;
          border-bottom: none;
        }
        /* Baggrund og kant KUN i containeren */
        .ticker-wrap {
          position: relative;
          overflow: hidden;
          white-space: nowrap;
          font-size: 14px;
          line-height: 28px;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(4px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .ticker {
          display: inline-flex;
          width: max-content;
          gap: 48px;
          will-change: transform;
          animation-name: tickerScroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .ticker:hover { animation-play-state: paused; }
        .ticker__content { padding: 0 24px; }
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      {/* [HELP:TICKER:STYLE] END */}
    </div>
  );
  // [HELP:TICKER:RENDER] END
}
