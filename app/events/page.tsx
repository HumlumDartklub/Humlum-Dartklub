"use client";

/* [HELP:EVENTS:FILE] START — Forside for events (Sheet-koblet) */

import { useEffect, useMemo, useState } from "react";

/* [HELP:FLAGS] START — skjul interne tips/pladsholdere i production */
const SHOW_PLACEHOLDERS = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "true";
/* [HELP:FLAGS] END */

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
  isHoldturnering: boolean;
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

  const safeTimeEnd = te && /^\d{1,2}:\d{2}$/.test(te) ? te : "";
  const timePart = ts && safeTimeEnd ? `${ts}–${safeTimeEnd}` : ts ? ts : "";
  if (datePart && timePart) return `${datePart} · ${timePart}`;
  return datePart || timePart || "";
}

function isHoldturneringEvent(r: EventRow): boolean {
  const haystack = [r.title, r.description, r.tags, r.badge_label]
    .map((v) => String(v ?? "").toLowerCase())
    .join(" ");

  return haystack.includes("hotel vildsund") || haystack.includes("strand serien");
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
        const isHoldturnering = isHoldturneringEvent(r);

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
          isHoldturnering,
        };
      })
      .sort((a, b) => a.order - b.order);

    return mapped;
  }, [rows]);
  /* [HELP:EVENTS:MAP] END */

  const featuredHoldturnering = useMemo(() => events.find((evt) => evt.isHoldturnering), [events]);
  const regularEvents = useMemo(() => events.filter((evt) => !evt.isHoldturnering), [events]);

  /* [HELP:EVENTS:RENDER] START — hele siderendering */
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      {/* [HELP:EVENTS:SECTION:HEADER] START — sideheader/beskrivelse */}
      <header className="mb-10">
        <div className="rounded-3xl border border-slate-200/40 bg-white/60 backdrop-blur-sm p-6 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-orange-50 px-3 py-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
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

      {/* [HELP:EVENTS:HOLDTURNERING:PROMO] START */}
      <section className="mb-8">
        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-800">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                HOLDTURNERING
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                Hotel Vildsund Strand Serien har fået sit eget område
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
                Her har vi samlet det, folk faktisk skal bruge: samlet stilling, officiel kampplan og HDK's egne holdoversigter for Humlum 1, 2 og 3. Ingen spillerlister på forsiden — kun hold og kampe.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="/holdturnering"
                  className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
                >
                  Se holdturnering
                </a>
                {featuredHoldturnering?.ctaUrl ? (
                  <a
                    href={featuredHoldturnering.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    {featuredHoldturnering.ctaLabel || "Åbn ekstern side"}
                  </a>
                ) : null}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/80 p-6 lg:border-l lg:border-t-0 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Hurtigt overblik
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">11</div>
                  <div className="mt-1 text-xs text-slate-500">hold</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">3</div>
                  <div className="mt-1 text-xs text-slate-500">HDK-hold</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">11</div>
                  <div className="mt-1 text-xs text-slate-500">runder</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Turneringen ligger stadig i Events-universet — men nu som sin egen skarpe side i stedet for endnu et lille kort i bunken.
              </p>
            </div>
          </div>
        </article>
      </section>
      {/* [HELP:EVENTS:HOLDTURNERING:PROMO] END */}

      {/* [HELP:EVENTS:GRID] START — kortgrid mappet over events */}
      <section className="grid grid-cols-1 gap-6 items-stretch sm:grid-cols-2 lg:grid-cols-3">
        {regularEvents.map((evt) => (
          /* [HELP:EVENTS:CARD] START — enkelt event-kort */
          <article
            key={evt.id}
            className="h-full flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-gray-600">
                {evt.dateLabel || "Dato følger"}
              </p>
              <span className="text-[10px] rounded-full border border-slate-200/60 bg-orange-50 px-2 py-0.5 text-gray-700">
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
                    className="text-xs rounded-full border border-slate-200/60 bg-orange-50 px-2 py-0.5 text-gray-700"
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
                  className="w-full inline-flex justify-center rounded-xl px-4 py-2 font-semibold border bg-orange-600 text-white hover:bg-orange-700"
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

        {!loading && !regularEvents.length && (
          SHOW_PLACEHOLDERS ? (
            <article className="rounded-3xl border border-slate-200/40 bg-white/60 p-6 text-sm text-gray-600">
              Ingen events er synlige endnu. Sæt <strong>visible=YES</strong> i fanen <strong>EVENTS</strong>.
            </article>
          ) : (
            <article className="rounded-3xl border border-slate-200/40 bg-white/60 p-6 text-sm text-gray-600">
              Der er ingen events at vise lige nu. Kig forbi igen snart — eller følg med på Facebook.
            </article>
          )
        )}
      </section>
      {/* [HELP:EVENTS:GRID] END */}

      {/* [HELP:EVENTS:FOOTNOTE] START — note under grid */}
      {SHOW_PLACEHOLDERS && (
        <p className="mt-8 text-xs text-gray-500">
          Tip: Du kan styre rækkefølge med <strong>order</strong> og tags med
          <strong> tags</strong> (fx “Træning;Familie;Gratis”).
        </p>
      )}
      {/* [HELP:EVENTS:FOOTNOTE] END */}
    </main>
  );
  /* [HELP:EVENTS:RENDER] END */
}

/* [HELP:EVENTS:FILE] END */
