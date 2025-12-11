"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSheet, AnyRow } from "../../lib/fetchSheet";

type NewsItem = {
  id: string;
  date?: string | null;
  title: string;
  body_md?: string;
  image?: string;
  pin?: boolean;
  visible?: boolean;
  order?: number;
  linkUrl?: string;
  linkLabel?: string;
};

function isTruthyYes(value: any): boolean {
  if (value === undefined || value === null) return false;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return false;
  return ["yes", "ja", "true", "1", "x"].includes(raw);
}

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function normalizeRow(row: AnyRow, idx: number): NewsItem | null {
  const title =
    row.title ||
    row.overskrift ||
    row.headline ||
    row.label ||
    row.key ||
    "";

  const titleStr = String(title || "").trim();
  if (!titleStr) return null;

  const rawDate =
    row.date ||
    row.start_date ||
    row.published_at ||
    "";

  const body =
    row.body_md ||
    row.body ||
    row.text ||
    row.teaser ||
    row.summary ||
    "";

  const image =
    row.image_url ||
    row.image ||
    row.img ||
    "";

  const pin = isTruthyYes(row.pin);

  // visible: hvis feltet findes, brug det, ellers true
  let visible = true;
  if (row.visible !== undefined && row.visible !== null && row.visible !== "") {
    visible = isTruthyYes(row.visible);
  }

  let order: number | undefined;
  const rawOrder = row.order ?? row.sort ?? row.position;
  if (rawOrder !== undefined && rawOrder !== null && rawOrder !== "") {
    const num = Number(rawOrder);
    if (!Number.isNaN(num)) {
      order = num;
    }
  }

  const linkUrl =
    row.link_url ||
    row.url ||
    row.link ||
    row.href ||
    row.target_url ||
    "";

  const linkLabel =
    row.link_label ||
    row.cta_label ||
    row.button_label ||
    "";

  const id =
    String(row.id || row.row_id || row.key || "").trim() ||
    `row-${idx}`;

  return {
    id,
    date: rawDate ? String(rawDate) : undefined,
    title: titleStr,
    body_md: body ? String(body) : "",
    image: image ? String(image) : undefined,
    pin,
    visible,
    order,
    linkUrl: linkUrl ? String(linkUrl) : undefined,
    linkLabel: linkLabel ? String(linkLabel) : undefined,
  };
}

export default function NyhederPage() {
  const [rows, setRows] = useState<AnyRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSheet("NYHEDER");
        if (!cancelled) setRows(data || []);
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo<NewsItem[]>(() => {
    const norm: NewsItem[] = [];

    rows.forEach((row, idx) => {
      const item = normalizeRow(row, idx);
      if (!item) return;
      if (item.visible === false) return;
      norm.push(item);
    });

    norm.sort((a, b) => {
      // Pinned først
      const ap = a.pin ? 1 : 0;
      const bp = b.pin ? 1 : 0;
      if (ap !== bp) return bp - ap;

      // Derefter order (laveste først)
      const ao = a.order ?? 9999;
      const bo = b.order ?? 9999;
      if (ao !== bo) return ao - bo;

      // Til sidst dato (nyeste først)
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
          const dt = toDate(n.date ?? undefined);
          return (
            <article
              key={n.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-center gap-2 text-xs text-white/60">
                {n.pin && (
                  <span className="rounded bg-lime-500/20 text-lime-300 px-2 py-0.5">
                    PIN
                  </span>
                )}
                {dt && <span>{dt.toLocaleDateString("da-DK")}</span>}
              </div>
              <h3 className="text-lg font-semibold mt-1">{n.title}</h3>
              {n.body_md && (
                <p className="mt-2 text-white/80 leading-relaxed">
                  {n.body_md}
                </p>
              )}

              {n.linkUrl && (
                <div className="mt-3">
                  <a
                    href={n.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg border border-lime-400/60 px-3 py-1 text-xs font-semibold text-lime-100 hover:bg-lime-500/10"
                  >
                    {n.linkLabel || "Åbn"}
                  </a>
                </div>
              )}

              {n.image && (
                <img
                  src={n.image}
                  alt=""
                  className="mt-3 rounded-lg border border-white/10 max-h-[280px] object-cover"
                />
              )}
            </article>
          );
        })}
        {!items.length && (
          <p className="text-white/60">Ingen nyheder endnu.</p>
        )}
      </div>
    </main>
  );
}
