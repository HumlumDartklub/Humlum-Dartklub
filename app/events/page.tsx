/* [HELP:EVENTS:FILE] START — Forside for events (Sheet-koblet) */

/* [HELP:EVENTS:TYPES] START */
type EventRow = {
  id?: string;
  title?: string;
  blurb?: string;
  body?: string;
  body_md?: string;
  date?: string;
  time_start?: string;
  time_end?: string;
  date_label?: string;
  location?: string;
  where?: string;
  tags?: string; // fx "Træning;For alle;Gratis"
  visible?: string;
  order?: string | number;
  badge_label?: string; // valgfri
  cta_label?: string;   // valgfri
  cta_url?: string;     // valgfri
};
/* [HELP:EVENTS:TYPES] END */

type UiEvent = {
  id: string;
  dateLabel: string;
  title: string;
  blurb: string;
  tags: string[];
  where: string;
  order: number;
  badge: string;
  ctaLabel: string;
  ctaUrl?: string;
};

/* [HELP:EVENTS:UTILS] START */
const isYes = (v: any) => String(v ?? "")
  .trim()
  .toUpperCase() === "YES";

const toNum = (v: any, d = 9999) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

function normalizeTags(v: any): string[] {
  const s = String(v ?? "").trim();
  if (!s) return [];
  // tillad ; , | som separator
  return s
    .split(/[;|,]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatDateLabel(row: EventRow): string {
  const pre = String(row.date_label ?? "").trim();
  if (pre) return pre;

  const raw = String(row.date ?? "").trim();
  const ts = String(row.time_start ?? "").trim();
  const te = String(row.time_end ?? "").trim();

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

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

async function loadEventRows(limit = 400): Promise<EventRow[]> {
  try {
    const base = getBaseUrl();
    const url = new URL(`/api/sheet?tab=EVENTS&limit=${limit}`, base).toString();
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => null);
    const items = Array.isArray(data?.items) ? data.items : [];
    return items as EventRow[];
  } catch {
    return [];
  }
}
/* [HELP:EVENTS:UTILS] END */

export default async function EventsPage() {
  /* [HELP:EVENTS:DATA] START — Sheet data fra EVENTS */
  const rows = await loadEventRows(400);

  const events: UiEvent[] = (rows || [])
    .filter(Boolean)
    .filter((r) => {
      const vis = String((r as any).visible ?? "").trim();
      return !vis || isYes(vis);
    })
    .map((r, idx) => {
      const id = String(r.id ?? "").trim() || `evt-${idx}`;
      const title = String(r.title ?? "").trim();
      const blurb =
        String(r.blurb ?? "").trim() ||
        String(r.body_md ?? "").trim() ||
        String(r.body ?? "").trim() ||
        String((r as any).description ?? "").trim();

      const where =
        String(r.where ?? "").trim() ||
        String(r.location ?? "").trim();

      const order = toNum(r.order, 9999);

      const badge = String(r.badge_label ?? "").trim() || "Kommer snart";

      const ctaUrl = String(r.cta_url ?? "").trim() || undefined;
      const ctaLabel =
        String(r.cta_label ?? "").trim() ||
        (ctaUrl ? "Læs mere" : "Tilmelding åbner snart");

      return {
        id,
        dateLabel: formatDateLabel(r),
        title: title || "Event",
        blurb: blurb || "Detaljer følger snart.",
        tags: normalizeTags(r.tags),
        where: where || "Klublokalet",
        order,
        badge,
        ctaLabel,
        ctaUrl,
      };
    })
    .sort((a, b) => a.order - b.order);

  /* [HELP:EVENTS:DATA] END */

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
            Turneringer, træning, hyggeaftener og lokale arrangementer.
            Her vises de events, du har gjort synlige i admin-arket.
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

        {!events.length && (
          <article className="rounded-3xl border border-lime-200 bg-white p-6 text-sm text-gray-600">
            Ingen events er synlige endnu.
            Sæt <strong>visible=YES</strong> i fanen <strong>EVENTS</strong>.
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
