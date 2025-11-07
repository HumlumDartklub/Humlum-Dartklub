"use client";

import { useEffect, useState } from "react";

type Item = { message: string; link?: string };
type Payload = { items: Item[] };

// Luft mellem enden og starten af loopet (vw = % af viewport-bredde)
const SPACER_VW = 150;

// Hastighed i sekunder for et fuldt rul
const DURATION_S = 20;

export default function LiveTicker() {
  const [items, setItems] = useState<Item[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/ticker", { cache: "no-store" });
        const data = (await res.json()) as Payload;
        if (!mounted) return;
        setItems(
          data.items?.length
            ? data.items
            : [{ message: "Velkommen til Humlum Dartklub", link: "/" }]
        );
      } catch {
        if (!mounted) return;
        setItems([{ message: "Velkommen til Humlum Dartklub", link: "/" }]);
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (!items.length) return null;

  // NØGLEN: Base-halvdelen starter og slutter med spacer,
  // så seam (midtpunktet) rammer "luft".
  const baseHalf: (Item | "SPACER")[] = ["SPACER", ...items, "SPACER"];
  const displayRow = [...baseHalf, ...baseHalf];

  return (
    <div
      className="w-full border-t border-b border-[var(--border)] bg-white/80 backdrop-blur sticky top-[52px] z-40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Live ticker"
      role="region"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="flex whitespace-nowrap py-2 text-sm"
          style={{
            animation: paused ? "none" : `hdk-marquee ${DURATION_S}s linear infinite`,
          }}
        >
          {displayRow.map((it, i) => {
            if (it === "SPACER") {
              return (
                <span
                  key={`sp-${i}`}
                  className="inline-block"
                  style={{ width: `${SPACER_VW}vw` }}
                />
              );
            }

            const content = (
              <span className="mx-8 inline-flex items-center">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-600" />
                <span className="text-[var(--fg)]">{it.message}</span>
              </span>
            );

            return it.link ? (
              <a key={`l-${i}`} href={it.link} className="hover:text-emerald-700">
                {content}
              </a>
            ) : (
              <span key={i}>{content}</span>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @keyframes hdk-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
