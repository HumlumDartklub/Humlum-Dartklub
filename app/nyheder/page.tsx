"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSheet } from "../../lib/fetchSheet";

type News = {
  id?: string;
  date?: string;
  title?: string;
  body_md?: string;
  image?: string;
  status?: string;
  pin?: string;
  visible?: string;
  order?: string | number;
};

function toDate(v?: string) {
  const t = v ? Date.parse(v) : NaN;
  return isNaN(t) ? null : new Date(t);
}

export default function NyhederPage() {
  const [rows, setRows] = useState<News[]>([]);

  useEffect(() => {
    (async () => {
      const r = await fetchSheet("NYHEDER");
      setRows(Array.isArray(r) ? r : []);
    })();
  }, []);

  const items = useMemo(() => {
    const norm = (rows || []).filter(Boolean);
    norm.sort((a, b) => {
      const ap = String(a.pin || "").toUpperCase() === "YES" ? 1 : 0;
      const bp = String(b.pin || "").toUpperCase() === "YES" ? 1 : 0;
      if (ap !== bp) return bp - ap;
      const ao = Number(a.order ?? 9999);
      const bo = Number(b.order ?? 9999);
      if (ao !== bo) return ao - bo;
      const ad = toDate(a.date)?.getTime() ?? 0;
      const bd = toDate(b.date)?.getTime() ?? 0;
      return bd - ad;
    });
    return norm;
  }, [rows]);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4">Nyheder</h1>
      <div className="grid gap-4">
        {items.map((n) => {
          const dt = toDate(n.date);
          return (
            <article key={n.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-xs text-white/60">
                {String(n.pin || "").toUpperCase() === "YES" && (
                  <span className="rounded bg-lime-500/20 text-lime-300 px-2 py-0.5">PIN</span>
                )}
                {dt && <span>{dt.toLocaleDateString("da-DK")}</span>}
              </div>
              <h3 className="text-lg font-semibold mt-1">{n.title}</h3>
              {n.body_md && <p className="mt-2 text-white/80 leading-relaxed">{n.body_md}</p>}
              {n.image && (
                <img
                  src={String(n.image)}
                  alt=""
                  className="mt-3 rounded-lg border border-white/10 max-h-[280px] object-cover"
                />
              )}
            </article>
          );
        })}
        {!items.length && <p className="text-white/60">Ingen nyheder endnu.</p>}
      </div>
    </main>
  );
}
