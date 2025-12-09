"use client";

/* [HELP:EVENTS:FILE] START — Forside for events (Sheet-koblet) */

import { useEffect, useMemo, useState } from "react";

/* [HELP:EVENTS:TYPES] START */
type EventRow = {
  key?: string;
  id?: string;

  date?: string;
  time_start?: string;
  time_end?: string;

  title?: string;
  description?: string;

  location?: string;
  contact_email?: string;

  tags?: string;

  badge_label?: string;
  cta_label?: string;
  cta_url?: string;

  signup_required?: string;
  visible?: string;
  order?: string | number;
};

type UiEvent = {
  id: string;
  dateLabel: string;
  title: string;
  blurb: string;
  tags: string[];
  where: string;
  badge: string;
  ctaLabel: string;
  ctaUrl?: string;
  order: number;
};
/* [HELP:EVENTS:TYPES] END */

/* [HELP:EVENTS:UTILS] START */
const isYes = (v: any) => String(v ?? "").trim().toUpperCase() === "YES";

const toNum = (v: any, d = 9999) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

function normalizeTags(v: any): string[] {
  const s = String(v ?? "").trim();
  if (!s) return [];
  return s
    .split(/[;|,]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatDateLabel(r: EventRow): string {
  const raw = String(r.date ?? "").trim();
  const ts = String(r.time_start ?? "").trim();
  const te = String(r.time_end ?? "").trim();

  let datePart = raw;
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      datePart = d.toLocaleDateString("da-DK", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    }
  }

  const timePart = ts && te ? `${ts}–${te}` : ts ? ts : "";
  if (datePart && timePart) return `${datePart} · ${timePart}`;
  return datePart || timePart || "";
}
/* [HELP:EVENTS:UTILS] END */

export default function EventsPage() {
  /* [HELP:EVENTS:STATE] START */
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  /* [HELP:EVENTS:STATE] END */

  /* [HELP:EVENTS:LOAD] START — hent EVENTS fra /api/sheet */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/sheet?tab=EVENTS&limit=400", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        const items = Array.isArray(data?.items) ? data.items : [];

        if (!alive) return;
        setRows(items as EventRow[]);
      } catch {
        if (!alive) return;
        setRows([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);
  /* [HELP:EVENTS:LOAD] END */

  /* [HELP:EVENTS:MAP] START */
  const events = useMemo<UiEvent[]>(() => {
    const mapped = (rows || [])
      .filter(Boolean)
      .filter((r) => {
        const vis = String(r.visible ?? "").trim();
        return !vis || isYes(vis);
      })
      .map((r, idx) => {
        const id =
          String(r.key ?? r.id ?? "").trim() || `evt-${idx}`;

        const title = String(r.title ?? "").trim() || "Event";

        const blurb =
          String(r.description ?? "").trim() ||
          "Detaljer følger snart.";

        const where =
          String(r.location ?? "").trim() || "Klublokalet";

        const badge =
          String(r.badge_label ?? "").trim() || "Kommer snart";

        const ctaUrl = String(r.cta_url ?? "").trim() || undefined;

        const ctaLabel =
          String(r.cta_label ?? "").trim() ||
          (ctaUrl ? "Læs mere" : "Tilmelding åbner snart");

        const order = toNum(r.order, 9999);

        return {
          id,
          dateLabel: formatDateLabel(r),
          title,
          blurb,
          tags: normalizeTags(r.tags),
          where,
          badge,
          ctaLabel,
          ctaUrl,
          order,
        };
      })
      .sort((a, b) => a.order - b.order);

    return mapped;
  }, [rows]);
  /* [HELP:EVENTS:MAP] END */

  /* [HELP:EVENTS:RENDER] START — hele siderendering */
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      {/* [HELP:EVENTS:SECTION:HEADER] START — sideheader/beskrivelse */}
      <header className="mb-10">
        <div className="rounded-3xl border border-lime-300/40 bg-white/60 backdrop-blur-sm p-6 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/60 bg-lime-50 px-3 py-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-lime-500" />
            🎯 EVENTS
          </div>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Humlum Dart Events
          </h1>

          <p className="mt-2 text-gray-600 text-sm">
            Turneringer, træning, hyggeaftener og lokale arrangementer. Her
            vises de events, du har gjort synlige i admin-arket.
          </p>
        </div>
      </header>
      {/* [HELP:EVENTS:SECTION:HEADER] END */}

      {/* [HELP:EVENTS:GRID] START — kortgrid mappet over events */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {events.map((evt) => (
          /* [HELP:EVENTS:CARD] START — enkelt event-kort */
          <article
            key={evt.id}
            className="h-full flex flex-col rounded-3xl border border-lime-400 bg-white p-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-gray-600">
                {evt.dateLabel || "Dato følger"}
              </p>
              <span className="text-[10px] rounded-full border border-lime-300/60 bg-lime-50 px-2 py-0.5 text-gray-700">
                {evt.badge}
              </span>
            </div>

            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {evt.title}
            </h2>
            <p className="mt-2 text-sm text-gray-700">{evt.blurb}</p>

            {!!evt.tags.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {evt.tags.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs rounded-full border border-lime-300/60 bg-lime-50 px-2 py-0.5 text-gray-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 text-xs text-gray-500">📍 {evt.where}</div>

            <div className="mt-auto pt-4">
              {evt.ctaUrl ? (
                <a
                  href={evt.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex justify-center rounded-xl px-4 py-2 font-semibold border bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {evt.ctaLabel}
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl px-4 py-2 font-semibold border bg-gray-100 text-gray-500 cursor-not-allowed"
                  title="Integration kommer snart"
                >
                  {evt.ctaLabel}
                </button>
              )}
            </div>
          </article>
          /* [HELP:EVENTS:CARD] END */
        ))}

        {!loading && !events.length && (
          <article className="rounded-3xl border border-lime-300/40 bg-white/60 p-6 text-sm text-gray-600">
            Ingen events er synlige endnu. Sæt <strong>visible=YES</strong> i
            fanen <strong>EVENTS</strong>.
          </article>
        )}
      </section>
      {/* [HELP:EVENTS:GRID] END */}

      {/* [HELP:EVENTS:FOOTNOTE] START — note under grid */}
      <p className="mt-8 text-xs text-gray-500">
        Tip: Du kan styre rækkefølge med <strong>order</strong> og tags med
        <strong> tags</strong> (fx “Træning;Familie;Gratis”).
      </p>
      {/* [HELP:EVENTS:FOOTNOTE] END */}
    </main>
  );
  /* [HELP:EVENTS:RENDER] END */
}

/* [HELP:EVENTS:FILE] END */
