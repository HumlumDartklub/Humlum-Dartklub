"use client";

/* [HELP:ABOUT:IMPORTS] START */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
/* [HELP:ABOUT:IMPORTS] END */

/* [HELP:ABOUT:TYPES] START — typer & strukturer */
type Member = { role: string; name: string; email?: string; phone?: string };
/* [HELP:ABOUT:TYPES] END */

/* [HELP:ABOUT:VALUES] START — klubværdier (liste) */
const VALUES = [
  { title: "Fællesskab", text: "Alle skal kunne være med og føle sig velkomne." },
  { title: "Præcision", text: "Vi træner klogt, måler fremskridt og deler læring." },
  { title: "Respekt", text: "Fairplay, ordentlig tone og plads til forskellighed." },
  { title: "Frivillighed", text: "Vi bygger klubben sammen – med tid, idéer og energi." },
];
/* [HELP:ABOUT:VALUES] END */

/* [HELP:ABOUT:TRAIN:CONFIG] START */
const TRAIN_RULES = [
  { weekday: 2, timeHHMM: "19:00", label: "Tirsdag 19:00" },
  { weekday: 4, timeHHMM: "19:00", label: "Torsdag 19:00" },
];
/* [HELP:ABOUT:TRAIN:CONFIG] END */

/* [HELP:ABOUT:BOARD] START — bestyrelse (kan senere flyttes til Sheet) */
const BOARD: Member[] = [
  { role: "Formand", name: "Ernst" },
  { role: "Kasserer", name: "Søren" },
  { role: "Bestyrelsesmedlem", name: "Jeppe" },
  { role: "Suppleant", name: "Martin" },
  { role: "Suppleant", name: "Villy" },
  { role: "Revisor", name: "Kasper" },
];
/* [HELP:ABOUT:BOARD] END */

/* [HELP:ABOUT:TRYOUT:TYPES] START */
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
/* [HELP:ABOUT:TRYOUT:TYPES] END */

/* [HELP:ABOUT:TRYOUT:UTIL] START */
function isYes(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "yes" || s === "ja" || s === "true" || s === "1";
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
/* [HELP:ABOUT:TRYOUT:UTIL] END */

/* [HELP:ABOUT:API] START */
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
/* [HELP:ABOUT:API] END */

/* [HELP:ABOUT:COMP] START */
export default function OmPage() {
  /* [HELP:ABOUT:STATE] START */
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

  const [tryoutRows, setTryoutRows] = useState<TryoutRow[]>([]);
  /* [HELP:ABOUT:STATE] END */

  const showBoardContacts = useMemo(
    () => BOARD.some((m) => m.email || m.phone),
    []
  );

  /* [HELP:ABOUT:EFFECT:TRYOUT_SHEET] START */
  useEffect(() => {
    let alive = true;

    async function loadTryouts() {
      try {
        const res = await fetch("/api/sheet?tab=PROEVETRAENING&limit=200", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        const items: TryoutRow[] = data?.items || [];

        const filtered = items
          .filter((r) => isYes(r.visible))
          .filter((r) => {
            const s = String(r.status ?? "").trim().toLowerCase();
            return !s || s === "open" || s === "åben";
          })
          .map((r) => ({
            ...r,
            order: Number(r.order ?? 999),
          }))
          .sort((a, b) => Number(a.order) - Number(b.order));

        if (!alive) return;
        setTryoutRows(filtered);
      } catch {
        if (!alive) return;
        setTryoutRows([]);
      }
    }

    loadTryouts();
    return () => {
      alive = false;
    };
  }, []);
  /* [HELP:ABOUT:EFFECT:TRYOUT_SHEET] END */

  /* [HELP:ABOUT:DERIVED:TRYOUT_DAYS] START */
  const tryoutDayLabels = useMemo(() => {
    // Primært fra Sheet
    const labels = tryoutRows
      .map(compactTryoutLabel)
      .filter(Boolean);

    if (labels.length > 0) return labels;

    // Fallback til hardcoded
    return TRAIN_RULES.map((r) => r.label);
  }, [tryoutRows]);
  /* [HELP:ABOUT:DERIVED:TRYOUT_DAYS] END */

  /* [HELP:ABOUT:HANDLERS:NAV] START */
  const go = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);
  /* [HELP:ABOUT:HANDLERS:NAV] END */

  /* [HELP:ABOUT:HANDLERS:OPEN] START */
  const openBooking = useCallback(() => {
    setShowBooking(true);
    setMsg(null);
    setSuccess(false);
  }, []);

  const closeBooking = useCallback(() => {
    setShowBooking(false);
  }, []);
  /* [HELP:ABOUT:HANDLERS:OPEN] END */

  /* [HELP:ABOUT:HANDLERS:SUBMIT] START */
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
  /* [HELP:ABOUT:HANDLERS:SUBMIT] END */

  /* [HELP:ABOUT:LAYOUT] START */
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* HERO */}
      <section className="mb-8 rounded-2xl border border-lime-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="kicker mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-lime-500" />
              <span>Om klubben</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Humlum Dartklub
            </h1>
            <p className="mt-2 text-sm text-gray-700 max-w-2xl">
              Humlum Dartklub er en ny, lokal forening med fokus på fællesskab,
              udvikling og god dartkultur. Vi vil skabe et trygt og moderne
              klubmiljø, hvor både nybegyndere, familier og erfarne
              turneringsspillere føler sig hjemme. <br />
              Hos os handler det ikke kun om at ramme skiven – men om at blive
              en del af et fællesskab, der løfter hinanden. Vi bygger klubben op
              i et tempo, hvor kvalitet, frivillighed og gode oplevelser går hånd
              i hånd, så træning og events kan vokse sammen med medlemmerne.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => go("klubinfo")}
              className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
            >
              Klubinfo
            </button>
            <button
              type="button"
              onClick={() => go("traening")}
              className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
            >
              Træning
            </button>
            <button
              type="button"
              onClick={() => go("medlemskab")}
              className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
            >
              Medlemskab
            </button>
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
      </section>

      {/* GRID KORT */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {/* VÆRDIER */}
        <section id="vaerdier" className="card h-full min-h-[84px]">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>VÆRDIER</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                  ▾
                </span>
              </div>
            </summary>
            <div className="space-y-3 text-sm text-gray-800">
              {VALUES.map((v) => (
                <div key={v.title}>
                  <div className="font-semibold">{v.title}</div>
                  <div className="text-gray-700">{v.text}</div>
                </div>
              ))}
            </div>
          </details>
        </section>

        {/* KLUBINFO */}
        <section id="klubinfo" className="card h-full min-h-[84px]">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>KLUBINFO</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                  ▾
                </span>
              </div>
            </summary>

            <div className="space-y-3 text-sm text-gray-800">
              <p>
                Humlum Dartklub arbejder for at skabe et stærkt lokalt
                foreningsmiljø med plads til både hygge og ambition.
              </p>
              <p>
                Vi prioriterer en god opstartsramme med klare værdier,
                inkluderende træning og en sund klubkultur, hvor nye og erfarne
                spillere udvikler sig side om side.
              </p>

              <div className="mt-3 rounded-xl border bg-gray-50 p-3">
                <div className="font-semibold mb-2">Bestyrelse</div>
                <div className="overflow-x-auto text-sm text-gray-800">
                  <table className="min-w-full border-separate border-spacing-y-1">
                    <tbody>
                      {BOARD.map((m, i) => (
                        <tr key={`${m.role}-${m.name}-${i}`} className="align-top">
                          <td className="pr-2 font-semibold whitespace-nowrap">
                            {m.role}
                          </td>
                          <td className="pr-2 whitespace-nowrap">{m.name}</td>
                          {showBoardContacts && (
                            <td className="pr-2 whitespace-nowrap">
                              {m.email && (
                                <a
                                  href={`mailto:${m.email}`}
                                  className="text-emerald-700 hover:text-emerald-800 underline"
                                >
                                  {m.email}
                                </a>
                              )}
                            </td>
                          )}
                          {showBoardContacts && (
                            <td className="whitespace-nowrap">
                              {m.phone && (
                                <a
                                  href={`tel:${m.phone}`}
                                  className="text-emerald-700 hover:text-emerald-800 underline"
                                >
                                  {m.phone}
                                </a>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!showBoardContacts && (
                  <p className="mt-2 text-xs text-gray-600">
                    Kontaktoplysninger offentliggøres, når klubben er helt klar
                    med de endelige spor.
                  </p>
                )}
              </div>
            </div>
          </details>
        </section>

        {/* DOKUMENTER (OFFENTLIGE) */}
        <section id="dokumenter" className="card h-full min-h-[84px]">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>DOKUMENTER (OFFENTLIGE)</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                  ▾
                </span>
              </div>
            </summary>
            <ul className="text-sm text-gray-800 space-y-2">
              <li>
                <Link
                  href="/docs/vedtaegter.pdf"
                  target="_blank"
                  className="text-emerald-700 hover:text-emerald-800 underline"
                >
                  Vedtægter (PDF)
                </Link>
              </li>
              <li>
                <Link
                  href="/privatliv"
                  target="_blank"
                  className="text-emerald-700 hover:text-emerald-800 underline"
                >
                  Privatlivspolitik
                </Link>
              </li>
            </ul>
          </details>
        </section>

        {/* FIND OS */}
        <section id="find-os" className="card h-full min-h-[84px]">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>FIND OS</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                  ▾
                </span>
              </div>
            </summary>
            <div className="space-y-2 text-sm text-gray-800">
              <p>Spillested: Offentliggøres snarest, når lokaler er på plads.</p>
              <p>Område: Humlum / Struer og omegn.</p>
              <p>Parkering: Information følger, når spillested er fastlagt.</p>
              <p>
                Vi opdaterer løbende praktisk info, når klubben er helt på
                plads med lokaler og faciliteter.
              </p>
            </div>
          </details>
        </section>
      </section>

      {/* TRÆNING & PRØVETRÆNING */}
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
              Træning i Humlum Dartklub
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
              for medlemskab. Udfyld en kort interesseformular, så vender vi
              tilbage med en konkret dag.
            </p>

            {/* Kompakt, redigerbar oversigt */}
            <div className="mt-3 rounded-xl border border-lime-200 bg-lime-50 p-3">
              <div className="text-xs font-semibold text-gray-700 mb-2">
                Træningsdage (oversigt)
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
                Tidspunkter kan justeres i admin-arket. Vi matcher dig med en
                konkret dato efter din henvendelse.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openBooking()}
              className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Book prøvetræning
            </button>
          </div>
        </div>
      </section>

      {/* KONTAKT & MEDLEMSKAB */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
          <div className="kicker mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lime-500" />
            <span>Kontakt</span>
          </div>
          <h3 className="font-semibold mb-1">Kontakt til klubben</h3>
          <p className="text-sm text-gray-700">
            Har du spørgsmål om klubben, prøvetræning eller sponsorater, så
            skriv endelig til os. Vi svarer så hurtigt som muligt.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/om#find-os"
              className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
            >
              Find os
            </Link>
            <Link
              href="/sponsor"
              className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50"
            >
              Sponsorpakker
            </Link>
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
          <p>
            Tilmeldinger håndteres digitalt via vores hjemmeside. Kontingent og
            indbetaling håndteres i klubben, og du får bekræftelse på mail.
          </p>
        </section>
      </section>

      {/* BOOKING MODAL */}
      {/* [HELP:ABOUT:MODAL] START */}
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
      {/* [HELP:ABOUT:MODAL] END */}
    </main>
  );
  /* [HELP:ABOUT:LAYOUT] END */
}
/* [HELP:ABOUT:COMP] END */
