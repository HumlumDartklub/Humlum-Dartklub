"use client";

/** [HELP:OM:IMPORTS] START */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
/** [HELP:OM:IMPORTS] END */

/** [HELP:OM:TYPES] START */
type OmRow = {
  key?: string;
  section?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  link_label?: string;
  link_url?: string;
  icon?: string;
  group?: string;
  visible?: any;
  order?: any;
};

type TryoutRow = {
  key?: string;
  date?: string;
  weekday?: string;
  time_start?: string;
  time_end?: string;
  title?: string;
  description?: string;
  location?: string;
  level?: string;
  capacity?: any;
  signup_required?: any;
  contact_email?: string;
  status?: string;
  visible?: any;
  order?: any;
};

type ClubKVRow = {
  key?: string;
  value?: any;
  type?: string;
  group?: string;
  help?: string;
  visible?: any;
  order?: any;
};
/** [HELP:OM:TYPES] END */

/** [HELP:OM:BOARD] START */
const BOARD = [
  { role: "Formand", name: "Ernst" },
  { role: "Kasserer", name: "Søren" },
  { role: "Bestyrelsesmedlem", name: "Jeppe" },
  { role: "Bestyrelsesmedlem", name: "Lars" },
  { role: "Bestyrelsesmedlem", name: "Lars" },
  { role: "Suppleant", name: "Martin" },
  { role: "Suppleant", name: "Villy" },
  { role: "Revisor", name: "Kasper" },
];
/** [HELP:OM:BOARD] END */

/** [HELP:OM:VALUES:FALLBACK] START */
const VALUES_FALLBACK = [
  "Fællesskab – alle skal kunne være med og føle sig velkomne.",
  "Præcision – vi træner klogt, måler fremskridt og deler læring.",
  "Respekt – fairplay, ordentlig tone og plads til forskellighed.",
  "Frivillighed – vi bygger klubben sammen med tid, idéer og energi.",
];
/** [HELP:OM:VALUES:FALLBACK] END */

/** [HELP:OM:UTILS] START */
function isYes(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "yes" || s === "ja" || s === "true" || s === "1";
}

function toNum(v: any, d = 999) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

function compactTryoutLabel(r: TryoutRow) {
  const wd = String(r.weekday ?? "").trim();
  const ts = String(r.time_start ?? "").trim();
  const te = String(r.time_end ?? "").trim();

  if (wd && ts && te) return `${wd} ${ts}-${te}`;
  if (wd && ts) return `${wd} kl. ${ts}`;
  if (wd) return wd;
  return "";
}

function safeText(v: any) {
  const s = String(v ?? "").trim();
  return s;
}
/** [HELP:OM:UTILS] END */

/** [HELP:OM:API] START */
async function fetchSheet(tab: string, limit = 200) {
  const res = await fetch(`/api/sheet?tab=${tab}&limit=${limit}`, {
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  return (data?.items || []) as any[];
}

async function createTryoutBooking(payload: {
  date: string;
  time: string;
  name: string;
  email: string;
  phone?: string;
  note?: string;
}) {
  const res = await fetch("/api/tryout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const data = await res.json().catch(() => null);
  if (!data || data.ok !== true) {
    throw new Error(data?.error || "Ukendt fejl ved booking.");
  }
  return data;
}
/** [HELP:OM:API] END */

export default function OmPage() {
  /** [HELP:OM:STATE] START */
  const [omRows, setOmRows] = useState<OmRow[]>([]);
  const [tryoutRows, setTryoutRows] = useState<TryoutRow[]>([]);
  const [clubKv, setClubKv] = useState<Record<string, string>>({});

  // booking modal
  const [showBooking, setShowBooking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  /** [HELP:OM:STATE] END */

  /** [HELP:OM:EFFECTS:LOAD] START */
  useEffect(() => {
    let alive = true;

    async function loadAll() {
      try {
        const [om, tryouts, klubinfo] = await Promise.all([
          fetchSheet("OM_KLUBBEN", 400),
          fetchSheet("PROEVETRAENING", 200),
          fetchSheet("Klubinfo", 200),
        ]);

        const omParsed: OmRow[] = (om as OmRow[])
          .map((r) => ({ ...r, order: toNum((r as any).order) }))
          .sort((a, b) => toNum(a.order) - toNum(b.order));

        const tryParsed: TryoutRow[] = (tryouts as TryoutRow[])
          .filter((r) => isYes((r as any).visible))
          .filter((r) => {
            const s = String((r as any).status ?? "").trim().toLowerCase();
            return !s || s === "open" || s === "åben";
          })
          .map((r) => ({ ...r, order: toNum((r as any).order) }))
          .sort((a, b) => toNum(a.order) - toNum(b.order));

        const kvRows = (klubinfo as ClubKVRow[]).filter((r) =>
          isYes((r as any).visible)
        );

        const dict: Record<string, string> = {};
        for (const r of kvRows) {
          const k = safeText((r as any).key);
          const v = safeText((r as any).value);
          if (k) dict[k] = v;
        }

        if (!alive) return;
        setOmRows(omParsed);
        setTryoutRows(tryParsed);
        setClubKv(dict);
      } catch {
        if (!alive) return;
        setOmRows([]);
        setTryoutRows([]);
        setClubKv({});
      }
    }

    loadAll();
    return () => {
      alive = false;
    };
  }, []);
  /** [HELP:OM:EFFECTS:LOAD] END */

  /** [HELP:OM:DERIVED:OM_KEYS] START */
  const introMain = useMemo(
    () => omRows.find((r) => r.key === "intro_main"),
    [omRows]
  );

  const topNav = useMemo(
    () =>
      omRows
        .filter((r) => String(r.section) === "top_nav")
        .filter((r) => isYes(r.visible))
        .sort((a, b) => toNum(a.order) - toNum(b.order)),
    [omRows]
  );

  const introNav = useMemo(
    () =>
      omRows
        .filter((r) => String(r.section) === "intro_nav")
        .filter((r) => isYes(r.visible))
        .sort((a, b) => toNum(a.order) - toNum(b.order)),
    [omRows]
  );

  const cardValues = useMemo(
    () => omRows.find((r) => r.key === "card_values"),
    [omRows]
  );
  const cardBoard = useMemo(
    () => omRows.find((r) => r.key === "card_board"),
    [omRows]
  );
  const cardDocuments = useMemo(
    () => omRows.find((r) => r.key === "card_documents"),
    [omRows]
  );
  const cardFindus = useMemo(
    () => omRows.find((r) => r.key === "card_findus"),
    [omRows]
  );

  const contactIntro = useMemo(
    () => omRows.find((r) => r.key === "contact_intro"),
    [omRows]
  );
  /** [HELP:OM:DERIVED:OM_KEYS] END */

  /** [HELP:OM:DERIVED:CLUBINFO] START */
  const clubName =
    clubKv["club.name"] || clubKv["club_name"] || "Humlum Dartklub";

  const clubTagline =
    clubKv["club.tagline"] || clubKv["club_tagline"] || "";

  const clubDescription =
    clubKv["club.description"] ||
    clubKv["club_description"] ||
    safeText(introMain?.body) ||
    "";

  const clubEmail =
    clubKv["club.email"] || clubKv["club_email"] || "humlumdartklub@gmail.com";

  const clubPhone = clubKv["club.phone"] || clubKv["club_phone"] || "";

  const clubCvr = clubKv["club.cvr"] || clubKv["club_cvr"] || "";

  const clubAddress = clubKv["club.address"] || clubKv["club_address"] || "";
  const clubPostcode =
    clubKv["club.postcode"] || clubKv["club_postcode"] || "";
  const clubCity = clubKv["club.city"] || clubKv["club_city"] || "";

  const venueName = clubKv["venue.name"] || clubKv["venue_name"] || "";
  const venueAddress =
    clubKv["venue.address"] || clubKv["venue_address"] || "";
  const venuePostcode =
    clubKv["venue.postcode"] || clubKv["venue_postcode"] || "";
  const venueCity = clubKv["venue.city"] || clubKv["venue_city"] || "";

  const facebook = clubKv["social.facebook"] || "";
  const website = clubKv["social.website"] || "";

  const addressLine = useMemo(() => {
    const addr = clubAddress.trim();
    const end = [clubPostcode.trim(), clubCity.trim()].filter(Boolean).join(" ");
    return [addr, end].filter(Boolean).join(", ");
  }, [clubAddress, clubPostcode, clubCity]);

  const venueLine = useMemo(() => {
    const vAddr = venueAddress.trim();
    const vEnd = [venuePostcode.trim(), venueCity.trim()]
      .filter(Boolean)
      .join(" ");
    const vLine = [vAddr, vEnd].filter(Boolean).join(", ");
    return vLine;
  }, [venueAddress, venuePostcode, venueCity]);

  const topnavFindusUrl =
    (topNav.find((r) => r.key === "topnav_findus")?.link_url || "").trim();

  const mapsUrl = useMemo(() => {
    if (topnavFindusUrl && isExternal(topnavFindusUrl)) return topnavFindusUrl;
    if (addressLine) {
      const q = encodeURIComponent(addressLine);
      return `https://www.google.com/maps/search/?api=1&query=${q}`;
    }
    if (venueLine) {
      const q = encodeURIComponent(venueLine);
      return `https://www.google.com/maps/search/?api=1&query=${q}`;
    }
    return "";
  }, [topnavFindusUrl, addressLine, venueLine]);
  /** [HELP:OM:DERIVED:CLUBINFO] END */

  /** [HELP:OM:DERIVED:TRYOUT_DAYS] START */
  const tryoutDayLabels = useMemo(() => {
    const labels = tryoutRows.map(compactTryoutLabel).filter(Boolean);
    return labels.length ? labels : ["Tirsdag 19:00-21:00", "Torsdag 19:00-21:00"];
  }, [tryoutRows]);
  /** [HELP:OM:DERIVED:TRYOUT_DAYS] END */

  /** [HELP:OM:SCROLL] START */
  const go = useCallback((id: string) => {
    const clean = id.startsWith("#") ? id.slice(1) : id;
    const el = document.getElementById(clean);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);
  /** [HELP:OM:SCROLL] END */

  /** [HELP:OM:BOOKING:HANDLERS] START */
  const openBooking = useCallback(() => {
    setShowBooking(true);
    setMsg(null);
    setSuccess(false);
  }, []);

  const closeBooking = useCallback(() => setShowBooking(false), []);

  async function submitBooking() {
    setMsg(null);

    if (!name || !email || !selectedDate || !selectedTime) {
      const missing = [
        !name ? "navn" : null,
        !email ? "e-mail" : null,
        !selectedDate ? "dato" : null,
        !selectedTime ? "tidspunkt" : null,
      ]
        .filter(Boolean)
        .join(", ");
      setMsg(`Udfyld venligst: ${missing}.`);
      return;
    }

    setBusy(true);
    try {
      await createTryoutBooking({
        date: selectedDate,
        time: selectedTime,
        name,
        email,
        phone,
        note,
      });
      setSuccess(true);
      setMsg("Tak for din interesse! Vi vender tilbage så hurtigt som muligt.");
      setName("");
      setEmail("");
      setPhone("");
      setNote("");
    } catch (err: any) {
      setMsg(err?.message || "Der opstod en fejl ved booking. Prøv igen.");
    } finally {
      setBusy(false);
    }
  }
  /** [HELP:OM:BOOKING:HANDLERS] END */

  /** [HELP:OM:RENDER:TOPNAV_ITEM] START */
  function renderTopNavItem(r: OmRow) {
    const label = safeText(r.link_label || r.title || "");
    const url = safeText(r.link_url || "");
    if (!label || !url) return null;

    if (url.startsWith("#")) {
      return (
        <button
          key={r.key || label}
          type="button"
          onClick={() => go(url)}
          className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
        >
          {label}
        </button>
      );
    }

    if (isExternal(url)) {
      return (
        <a
          key={r.key || label}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border px=3 py-2 text-xs font-semibold hover:bg-gray-50"
          style={{ padding: "0.5rem 0.75rem" }}
        >
          {label}
        </a>
      );
    }

    // special-case prøvetræning knap hvis link er /proevetraening eller key topnav_tryout
    if (r.key === "topnav_tryout") {
      return (
        <button
          key={r.key}
          type="button"
          onClick={openBooking}
          className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
        >
          {label}
        </button>
      );
    }

    return (
      <Link
        key={r.key || label}
        href={url}
        className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
      >
        {label}
      </Link>
    );
  }
  /** [HELP:OM:RENDER:TOPNAV_ITEM] END */

  /** [HELP:OM:RENDER:INTRONAV_ITEM] START */
  function renderIntroNavItem(r: OmRow) {
    const label = safeText(r.link_label || r.title || "");
    const url = safeText(r.link_url || "");
    if (!label || !url) return null;

    if (url.startsWith("#")) {
      return (
        <button
          key={r.key || label}
          type="button"
          onClick={() => go(url)}
          className="rounded-xl border px-3 py-2 text-[11px] font-semibold hover:bg-gray-50"
        >
          {label}
        </button>
      );
    }

    return (
      <Link
        key={r.key || label}
        href={url}
        className="rounded-xl border px-3 py-2 text-[11px] font-semibold hover:bg-gray-50"
      >
        {label}
      </Link>
    );
  }
  /** [HELP:OM:RENDER:INTRONAV_ITEM] END */

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* [HELP:OM:HERO] START */}
      <section className="mb-8 rounded-2xl border border-lime-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="kicker mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-lime-500" />
              <span>{safeText(introMain?.title) || "Om klubben"}</span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight">
              {clubName}
            </h1>

            {clubTagline && (
              <div className="mt-1 text-sm text-gray-600">{clubTagline}</div>
            )}

            <p className="mt-2 text-sm text-gray-700 max-w-2xl whitespace-pre-line">
              {safeText(introMain?.body) || clubDescription}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {topNav.map(renderTopNavItem)}

            {/* faste CTA'er (beholdt) */}
            <Link
              href="/sponsor"
              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              Bliv sponsor
            </Link>
            <Link
              href="/bliv-medlem"
              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              Bliv medlem
            </Link>
          </div>
        </div>

        {introNav.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {introNav.map(renderIntroNavItem)}
          </div>
        )}
      </section>
      {/* [HELP:OM:HERO] END */}

      {/* [HELP:OM:CARDS:TOPROW] START */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {/* VÆRDIER */}
        {isYes(cardValues?.visible) && (
          <section id="vaerdier" className="card h-full min-h-[84px]">
            <details className="group" open>
              <summary className="cursor-pointer list-none">
                <div className="kicker mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-lime-500" />
                    <span>{safeText(cardValues?.title) || "Værdier"}</span>
                  </div>
                  <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                    ▾
                  </span>
                </div>
              </summary>
              <div className="space-y-2 text-sm text-gray-800">
                {safeText(cardValues?.body) ? (
                  <p className="whitespace-pre-line">{safeText(cardValues?.body)}</p>
                ) : (
                  <ul className="list-disc ml-5">
                    {VALUES_FALLBACK.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          </section>
        )}

        {/* BESTYRELSE */}
        {isYes(cardBoard?.visible) && (
          <section id="bestyrelse" className="card h-full min-h-[84px]">
            <details className="group" open>
              <summary className="cursor-pointer list-none">
                <div className="kicker mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-lime-500" />
                    <span>{safeText(cardBoard?.title) || "Bestyrelse"}</span>
                  </div>
                  <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                    ▾
                  </span>
                </div>
              </summary>

              <div className="space-y-3 text-sm text-gray-800">
                {safeText(cardBoard?.body) && (
                  <p className="whitespace-pre-line">{safeText(cardBoard?.body)}</p>
                )}

                <div className="rounded-xl border bg-gray-50 p-3">
                  <div className="overflow-x-auto text-sm text-gray-800">
                    <table className="min-w-full border-separate border-spacing-y-1">
                      <tbody>
                        {BOARD.map((m, i) => (
                          <tr key={`${m.role}-${m.name}-${i}`} className="align-top">
                            <td className="pr-2 font-semibold whitespace-nowrap">
                              {m.role}
                            </td>
                            <td className="whitespace-nowrap">{m.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </details>
          </section>
        )}

        {/* DOKUMENTER */}
        {isYes(cardDocuments?.visible) && (
          <section id="dokumenter" className="card h-full min-h-[84px]">
            <details className="group" open>
              <summary className="cursor-pointer list-none">
                <div className="kicker mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-lime-500" />
                    <span>
                      {safeText(cardDocuments?.title) || "Dokumenter (offentlige)"}
                    </span>
                  </div>
                  <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                    ▾
                  </span>
                </div>
              </summary>
              <div className="space-y-2 text-sm text-gray-800">
                {safeText(cardDocuments?.body) && (
                  <p className="whitespace-pre-line">
                    {safeText(cardDocuments?.body)}
                  </p>
                )}

                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/vedtaegter"
                      className="text-emerald-700 hover:text-emerald-800 underline"
                    >
                      Vedtægter (PDF)
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privatliv"
                      className="text-emerald-700 hover:text-emerald-800 underline"
                    >
                      Privatlivspolitik
                    </Link>
                  </li>
                </ul>
              </div>
            </details>
          </section>
        )}
      </section>
      {/* [HELP:OM:CARDS:TOPROW] END */}

      {/* FIND OS (kort) — styres af card_findus.visible */}
      {/* [HELP:OM:CARDS:FINDOS] START */}
      {isYes(cardFindus?.visible) && (
        <section className="mb-8">
          <div id="findos" className="card max-w-md">
            <details className="group" open>
              <summary className="cursor-pointer list-none">
                <div className="kicker mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-lime-500" />
                    <span>{safeText(cardFindus?.title) || "Find os"}</span>
                  </div>
                  <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                    ▾
                  </span>
                </div>
              </summary>

              <div className="space-y-2 text-sm text-gray-800">
                {safeText(cardFindus?.body) && (
                  <p className="whitespace-pre-line">{safeText(cardFindus?.body)}</p>
                )}

                {venueName && (
                  <p>
                    <span className="font-semibold">Spillested:</span> {venueName}
                  </p>
                )}

                {venueLine ? (
                  <p>
                    <span className="font-semibold">Adresse:</span> {venueLine}
                  </p>
                ) : addressLine ? (
                  <p>
                    <span className="font-semibold">Adresse:</span> {addressLine}
                  </p>
                ) : (
                  <>
                    <p>Spillested: Offentliggøres snarest, når lokaler er på plads.</p>
                    <p>Område: Humlum / Struer og omegn.</p>
                    <p>Parkering: Information følger, når spillested er fastlagt.</p>
                  </>
                )}

                {clubCvr && (
                  <p>
                    <span className="font-semibold">CVR:</span> {clubCvr}
                  </p>
                )}

                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
                  >
                    Åbn kort i nyt vindue
                  </a>
                )}
              </div>
            </details>
          </div>
        </section>
      )}
      {/* [HELP:OM:CARDS:FINDOS] END */}

      {/* TRÆNING & PRØVETRÆNING */}
      {/* [HELP:OM:TRAINING] START */}
      <section
        id="traening"
        className="mb-6 rounded-2xl border border-lime-300 bg-white p-4 shadow-sm"
      >
        <div className="kicker mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-lime-500" />
          <span>Træning &amp; prøvetræning</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-lime-200 bg-lime-50 p-4">
            <h2 className="text-xl font-extrabold mb-1">
              Træning i {clubName}
            </h2>
            <p className="text-sm text-gray-700 mb-3">
              Vi starter med et solidt begynder- og fællesskabsfokus – og
              udvider gradvist, når medlemmer, lokaler og faciliteter er helt på
              plads.
            </p>

            <h3 className="font-semibold mb-1">Træningstider (forventet)</h3>
            <ul className="list-disc ml-5 text-sm text-gray-800 mb-3">
              <li>1-2 faste ugentlige træningsaftener</li>
              <li>Familie- og begynderfokus i opstartsfasen</li>
              <li>Turneringstræning når vi er flere aktive</li>
            </ul>

            <h3 className="font-semibold mb-1">Niveauer</h3>
            <ul className="list-disc ml-5 text-sm text-gray-800">
              <li>Nybegyndere: intro, grundteknik og hyggefokus</li>
              <li>Øvede: struktur, rutiner og stabilitet</li>
              <li>Turnering: målrettet træning og match-play</li>
            </ul>
          </div>

          <div className="rounded-xl border border-lime-200 bg-white p-4">
            <h3 className="font-semibold mb-1">Prøvetræning</h3>
            <p className="mb-2 text-sm text-gray-700">
              Du er velkommen til at prøve at være med, inden du beslutter dig
              for medlemskab. Vi tilbyder 2 gratis prøvedage. Udfyld en kort interesseformular, så vender vi
              tilbage med en konkret dag.
            </p>

            <div className="mt-3 rounded-xl border border-lime-200 bg-lime-50 p-3">
              <div className="text-xs font-semibold text-gray-700 mb-2">
                Træningsdage (forventet)
              </div>
              <div className="flex flex-wrap gap-2">
                {tryoutDayLabels.map((label, i) => (
                  <span
                    key={`${label}-${i}`}
                    className="rounded-lg border border-lime-200 bg-white px-2 py-1 text-[11px] font-semibold"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-gray-600">
                Tidspunkter offentlig gøres snart. Send en mail, vi matcher dig med en
                konkret dato efter din henvendelse.
              </p>
            </div>

            <button
              type="button"
              onClick={openBooking}
              className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Book prøvetræning
            </button>
          </div>
        </div>
      </section>
      {/* [HELP:OM:TRAINING] END */}

      {/* KONTAKT & MEDLEMSKAB */}
      {/* [HELP:OM:BOTTOM] START */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section id="kontakt" className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
          <div className="kicker mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lime-500" />
            <span>Kontakt</span>
          </div>

          <h3 className="font-semibold mb-1">
            {safeText(contactIntro?.title) || "Kontakt til klubben"}
          </h3>

          <p className="text-sm text-gray-700 whitespace-pre-line">
            {safeText(contactIntro?.body) ||
              "Har du spørgsmål om klubben, prøvetræning eller samarbejde, så skriv endelig til os. Vi svarer så hurtigt som muligt."}
          </p>

          <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-sm text-gray-800 space-y-1">
            {addressLine && (
              <div>
                <span className="font-semibold">Adresse:</span> {addressLine}
              </div>
            )}
            {clubCvr && (
              <div>
                <span className="font-semibold">CVR:</span> {clubCvr}
              </div>
            )}
            {clubEmail && (
              <div>
                <span className="font-semibold">E-mail:</span>{" "}
                <a
                  href={`mailto:${clubEmail}`}
                  className="text-emerald-700 hover:text-emerald-800 underline"
                >
                  {clubEmail}
                </a>
              </div>
            )}
            {clubPhone && (
              <div>
                <span className="font-semibold">Telefon:</span>{" "}
                <a
                  href={`tel:${clubPhone}`}
                  className="text-emerald-700 hover:text-emerald-800 underline"
                >
                  {clubPhone}
                </a>
              </div>
            )}
            {facebook && (
              <div>
                <span className="font-semibold">Facebook:</span>{" "}
                <a
                  href={facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 underline"
                >
                  Åbn side
                </a>
              </div>
            )}
            {website && (
              <div>
                <span className="font-semibold">Website:</span>{" "}
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 underline"
                >
                  Åbn
                </a>
              </div>
            )}

            {!addressLine && !clubCvr && !clubEmail && !clubPhone && !facebook && (
              <div>
                Kontaktinfo hentes fra admin-arket. Udfyld “Klubinfo” for at få
                adresse, CVR og e-mail vist her.
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
              >
                Find os
              </a>
            ) : (
              <button
                type="button"
                onClick={() => go("#findos")}
                className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
              >
                Find os
              </button>
            )}

            <a
              href={`mailto:${clubEmail}`}
              className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
            >
              Send mail
            </a>
          </div>
        </section>

        <section
          id="medlemskab"
          className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm"
        >
          <div className="kicker mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lime-500" />
            <span>Medlemskab</span>
          </div>

          <h3 className="font-semibold mb-1">Medlemskab</h3>
          <p className="text-sm text-gray-700 mb-3">
            Du kan læse mere om medlemskab og pakker på siden{" "}
            <Link
              href="/bliv-medlem"
              className="text-emerald-700 hover:text-emerald-800 underline"
            >
              Bliv medlem
            </Link>
            .
          </p>
          <p className="text-sm text-gray-700">
            Tilmeldinger håndteres digitalt via vores hjemmeside. Kontingent og
            indbetaling håndteres i klubben, og du får bekræftelse på mail.
          </p>
        </section>
      </section>
      {/* [HELP:OM:BOTTOM] END */}

      {/* BOOKING MODAL */}
      {/* [HELP:OM:MODAL] START */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Book prøvetræning</h2>
                <p className="text-xs text-gray-600">
                  Vi bekræfter tidspunktet, når lokaler og træningshold er helt
                  fastlagt.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                onClick={closeBooking}
              >
                Luk
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium">Navn</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium">E-mail</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Telefon (valgfri)</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Dato</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Tidspunkt</label>
                <input
                  type="time"
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium">
                  Bemærkning (valgfri)
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            {msg && (
              <div
                className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
                  success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                {msg}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeBooking}
                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Annuller
              </button>
              <button
                type="button"
                onClick={submitBooking}
                disabled={busy}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Sender..." : "Send booking"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* [HELP:OM:MODAL] END */}
    </main>
  );
}
