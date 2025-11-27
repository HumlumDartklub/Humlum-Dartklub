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
  { title: "Fællesskab", text: "alle skal kunne være med og føle sig velkomne." },
  { title: "Præcision",  text: "vi træner klogt, måler fremskridt og deler læring." },
  { title: "Respekt",    text: "fairplay, ordentlig tone og plads til forskellighed." },
  { title: "Frivillighed", text: "vi bygger klubben sammen – med tid, idéer og energi." },
];
/* [HELP:ABOUT:VALUES] END */

/* [HELP:ABOUT:BOARD] START — bestyrelse (kan senere flyttes til Sheet) */
const BOARD: Member[] = [
  { role: "Formand",      name: "Navn 1", email: "formand@example.dk",      phone: "+45 12 34 56 78" },
  { role: "Næstformand",  name: "Navn 2", email: "naestformand@example.dk", phone: "+45 11 22 33 44" },
  { role: "Kasserer",     name: "Navn 3", email: "kasserer@example.dk",     phone: "+45 22 33 44 55" },
  { role: "Bestyrelsesmedlem", name: "Navn 4", email: "bestyrelse@example.dk", phone: "+45 33 44 55 66" },
  { role: "Suppleant",   name: "Navn 5", email: "suppleant@example.dk",    phone: "+45 44 55 66 77" },
];
/* [HELP:ABOUT:BOARD] END */

/* [HELP:ABOUT:TRAIN:CONFIG] START — træningsregler (prøvetræning slots) */
type Rule = { weekday: number; timeHHMM: string }; // 0=søn … 6=lør

const TRAIN_RULES: Rule[] = [
  { weekday: 2, timeHHMM: "18:30" }, // tirs
  { weekday: 4, timeHHMM: "19:00" }, // tors
  // { weekday: 3, timeHHMM: "17:00" }, // åbnes når juniorhold er klar
];

const INTERVAL_WEEKS = 1; // sæt til 2 for hver 14. dag
/* [HELP:ABOUT:TRAIN:CONFIG] END */

/* [HELP:ABOUT:UTIL:nextSlots] START — beregn næste slots */
function nextSlots(rules: Rule[], count = 24, intervalWeeks = 1) {
  const out: { date: Date; isoDate: string; time: string; label: string }[] = [];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let weeksChecked = 0;

  while (out.length < count && weeksChecked < 52) {
    for (const r of rules) {
      const d = new Date(start);
      const dayDiff = (r.weekday - d.getDay() + 7) % 7;
      d.setDate(d.getDate() + dayDiff + weeksChecked * 7 * intervalWeeks);
      const [hh, mm] = r.timeHHMM.split(":").map(n => parseInt(n, 10));
      d.setHours(hh, mm, 0, 0);
      if (d.getTime() <= now.getTime()) continue;

      const isoDate = d.toISOString().slice(0, 10);
      const time = r.timeHHMM;
      const weekdayNames = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
      const label = `${weekdayNames[d.getDay()]} d. ${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")} kl. ${time}`;

      out.push({ date: d, isoDate, time, label });
      if (out.length >= count) break;
    }
    weeksChecked++;
  }

  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out;
}
/* [HELP:ABOUT:UTIL:nextSlots] END */

/* [HELP:ABOUT:API] START — API endpoint til prøvetræning */
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

/* [HELP:ABOUT:COMP] START — hovedkomponent */
export default function AboutPage() {
  /* [HELP:ABOUT:STATE:SLOTS] START — beregn & hold slots */
  const [slots] = useState(() => nextSlots(TRAIN_RULES, 24, INTERVAL_WEEKS));
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  /* [HELP:ABOUT:STATE:SLOTS] END */

  /* [HELP:ABOUT:HANDLERS:NAV] START — scroll til sektion */
  const go = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  /* [HELP:ABOUT:HANDLERS:NAV] END */

  /* [HELP:ABOUT:STATE] START — modal/valg/form state */
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  /* [HELP:ABOUT:STATE] END */

  /* [HELP:ABOUT:EFFECT:PRESELECT] START — auto-vælg første slot */
  useEffect(() => {
    if (!selectedSlot && slots.length > 0) {
      setSelectedSlot(slots[0].isoDate + "T" + slots[0].time);
      setSelectedDate(slots[0].isoDate);
      setSelectedTime(slots[0].time);
    }
  }, [selectedSlot, slots]);
  /* [HELP:ABOUT:EFFECT:PRESELECT] END */

  /* [HELP:ABOUT:HANDLERS:OPEN] START — åbn/luk modal */
  const openBooking = useCallback(
    (slotId?: string) => {
      if (slotId) {
        setSelectedSlot(slotId);
        const [date, time] = slotId.split("T");
        setSelectedDate(date);
        setSelectedTime(time);
      }
      setShowBooking(true);
      setMsg(null);
      setSuccess(false);
    },
    []
  );

  const closeBooking = useCallback(() => {
    setShowBooking(false);
  }, []);
  /* [HELP:ABOUT:HANDLERS:OPEN] END */

  /* [HELP:ABOUT:HANDLERS:SUBMIT] START — send “Book prøvetræning” */
  async function submitBooking() {
    setMsg(null);
    if (!name || !email || !selectedDate || !selectedTime) {
      const missing = [
        !name ? "navn" : null,
        !email ? "e-mail" : null,
        !selectedDate ? "dato" : null,
        !selectedTime ? "tidspunkt" : null,
      ].filter(Boolean).join(", ");
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

  /* [HELP:ABOUT:LAYOUT] START — render */
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* HERO / INTRO */}
      <section className="mb-6 rounded-2xl border border-lime-300 bg-white p-4 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-lime-500" />
              <span>Om klubben</span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold">
              Humlum Dartklub – fællesskab &amp; præcision ved Limfjorden
            </h1>
            <p className="mt-1 text-sm text-gray-700 max-w-2xl">
              Vi er en lokal dartklub med fokus på fællesskab, udvikling og
              gode oplevelser – for både nye spillere, hyggeniveau og dem, der
              jagter turneringsscenen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => go("traening")}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Se træning &amp; prøvetræning
            </button>
            <Link
              href="/bliv-medlem"
              className="rounded-xl border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Bliv medlem
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-2 text-sm">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-xl bg-lime-50 border border-lime-200 p-3">
              <div className="font-semibold">{v.title}</div>
              <div className="text-gray-700 text-xs mt-1">{v.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* NAV-CHIPS */}
      <nav className="mb-6 flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => go("klubinfo")}
          className="rounded-full border border-lime-300 bg-white px-3 py-1 hover:bg-lime-50"
        >
          Klubinfo
        </button>
        <button
          type="button"
          onClick={() => go("bestyrelse")}
          className="rounded-full border border-lime-300 bg-white px-3 py-1 hover:bg-lime-50"
        >
          Bestyrelse
        </button>
        <button
          type="button"
          onClick={() => go("traening")}
          className="rounded-full border border-lime-300 bg-white px-3 py-1 hover:bg-lime-50"
        >
          Træning &amp; prøvetræning
        </button>
        <button
          type="button"
          onClick={() => go("kontakt")}
          className="rounded-full border border-lime-300 bg-white px-3 py-1 hover:bg-lime-50"
        >
          Kontakt &amp; praktisk info
        </button>
        <button
          type="button"
          onClick={() => go("dokumenter")}
          className="rounded-full border border-lime-300 bg-white px-3 py-1 hover:bg-lime-50"
        >
          Dokumenter
        </button>
      </nav>

      {/* GRID: INFO / BESTYRELSE / DOKS / MAP */}
      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4 mb-6">
        {/* KLUBINFO */}
        <section id="klubinfo" className="card h-full min-h-[84px]">
          <details className="group" open>
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>KLUBINFO</span>
                </div>
                <span className="inline-block text-xs uppercase tracking-wide text-gray-500">
                  Humlum Dartklub
                </span>
              </div>
            </summary>
            <div className="space-y-1 text-sm text-gray-800">
              <p>Navn: Humlum Dartklub</p>
              <p>Sted: Humlum-området ved Limfjorden, Struer Kommune</p>
              <p>Foreningstype: Idrætsforening / dartklub</p>
              <p>Opstart: [indsæt årstal for opstart/stiftelse]</p>
              <p>Medlemsgrundlag: Børn, unge og voksne – både hygge og turnering.</p>
            </div>
          </details>
        </section>

        {/* BESTYRELSE */}
        <section id="bestyrelse" className="card h-full min-h-[84px]">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>BESTYRELSE</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">▾</span>
              </div>
            </summary>
            <div className="overflow-x-auto text-sm text-gray-800">
              <table className="min-w-full border-separate border-spacing-y-1">
                <tbody>
                  {BOARD.map((m) => (
                    <tr key={m.role} className="align-top">
                      <td className="pr-2 font-semibold whitespace-nowrap">{m.role}</td>
                      <td className="pr-2 whitespace-nowrap">{m.name}</td>
                      <td className="pr-2 whitespace-nowrap">
                        {m.email && (
                          <a href={`mailto:${m.email}`} className="text-emerald-700 hover:text-emerald-800 underline">
                            {m.email}
                          </a>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        {m.phone && (
                          <a href={`tel:${m.phone}`} className="text-emerald-700 hover:text-emerald-800 underline">
                            {m.phone}
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        {/* DOKUMENTER (OFFENTLIGE) */}
        {/* [HELP:ABOUT:SEC:DOCS] START */}
        <section id="dokumenter" className="card h-full min-h-[84px]">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>DOKUMENTER (OFFENTLIGE)</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">▾</span>
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
              {/* Ordensregler (PDF) tilføjes senere, når dokumentet er klar */}
            </ul>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:DOCS] END */}

        {/* KORT / FIND OS */}
        {/* [HELP:ABOUT:SEC:MAP] START */}
        <section id="find-os" className="card h-full min-h-[84px]">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>FIND OS</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">▾</span>
              </div>
            </summary>
            <div className="space-y-2 text-sm text-gray-800">
              <p>Spillested: [indsæt adresse på spillested]</p>
              <p>Område: Humlum / Struer / Limfjorden</p>
              <p>
                Parkering: [kort info om parkering – f.eks. gratis parkering ved hallen/klublokalet].
              </p>
              <p>
                Vi opdaterer løbende praktisk info, når klubben er helt på plads med lokaler og faciliteter.
              </p>
            </div>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:MAP] END */}
      </section>

      {/* TRÆNING & PRØVETRÆNING */}
      <section id="traening" className="mb-6 rounded-2xl border border-lime-300 bg-white p-4 shadow-sm">
        <div className="kicker mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-lime-500" />
          <span>Træning &amp; prøvetræning</span>
        </div>
        <h2 className="text-xl font-extrabold mb-1">Træning i Humlum Dartklub</h2>
        <p className="text-sm text-gray-700 mb-3">
          Vi starter stille og roligt op med faste træningsaftener og mulighed for at booke prøvetræning. Fokus er på
          at alle føler sig velkomne – uanset niveau.
        </p>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl bg-lime-50 border border-lime-200 p-3 text-sm text-gray-800">
            <h3 className="font-semibold mb-1">Træningstider (forventet)</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Tirsdag aften – fokus på hygge, teknik og fællesskab.</li>
              <li>Torsdag aften – mere målrettet træning for øvede/turnering.</li>
              <li>Junior-/ungdomshold oprettes, når der er nok interesserede.</li>
            </ul>
          </div>
          <div className="rounded-xl bg-lime-50 border border-lime-200 p-3 text-sm text-gray-800">
            <h3 className="font-semibold mb-1">Niveauer</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Hygge:</strong> Fokus på at have det sjovt og lære spillet at kende.</li>
              <li><strong>Øvet:</strong> Spillere der vil udvikle sig, træne mere struktureret og måske spille lokale turneringer.</li>
              <li><strong>Turnering:</strong> Spillere der vil på DDU-niveau og repræsentere klubben i turneringer.</li>
            </ul>
          </div>
          <div className="rounded-xl bg-white border border-lime-200 p-3 text-sm text-gray-800">
            <h3 className="font-semibold mb-1">Prøvetræning</h3>
            <p className="mb-2">
              Du er velkommen til at prøve at være med, inden du beslutter dig for medlemskab. Udfyld en kort
              interesseformular, så vender vi tilbage med en konkret dag.
            </p>
            <button
              type="button"
              onClick={() => openBooking()}
              className="mt-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Book prøvetræning
            </button>
          </div>
        </div>

        {/* Liste over kommende slots */}
        {slots.length > 0 && (
          <div className="mt-4 rounded-xl border border-lime-200 bg-white p-3 text-sm text-gray-800">
            <h3 className="font-semibold mb-2">Mulige tidspunkter (oversigt)</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {slots.slice(0, 9).map((s) => {
                const slotId = `${s.isoDate}T${s.time}`;
                const isSelected = selectedSlot === slotId;
                return (
                  <button
                    key={slotId}
                    type="button"
                    onClick={() => openBooking(slotId)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-lime-200 bg-lime-50 hover:border-emerald-400"
                    }`}
                  >
                    <div className="font-semibold">{s.label}</div>
                    <div className="text-[11px] text-gray-600">
                      Klik for at forespørge denne tid til prøvetræning.
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* KONTAKT & PRAKTISK INFO */}
      <section
        id="kontakt"
        className="mb-6 rounded-2xl border border-lime-300 bg-white p-4 shadow-sm"
      >
        <div className="kicker mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-lime-500" />
          <span>Kontakt &amp; praktisk info</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3 text-sm text-gray-800">
          <div>
            <h3 className="font-semibold mb-1">Kontakt til klubben</h3>
            <p>
              E-mail:{" "}
              <a
                href="mailto:humlumdartklub@gmail.com"
                className="text-emerald-700 hover:text-emerald-800 underline"
              >
                humlumdartklub@gmail.com
              </a>
            </p>
            <p>Facebook: 
              <a
                href="https://www.facebook.com/humlumdartklub"
                target="_blank"
                className="ml-1 text-emerald-700 hover:text-emerald-800 underline"
              >
                facebook.com/humlumdartklub
              </a>
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Medlemskab</h3>
            <p className="mb-1">
              Du kan læse mere om medlemskab og pakker på siden{" "}
              <Link href="/bliv-medlem" className="text-emerald-700 hover:text-emerald-800 underline">
                Bliv medlem
              </Link>
              .
            </p>
            <p>
              Tilmeldinger håndteres digitalt via vores hjemmeside, og du får bekræftelse på mail.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Sociale medier &amp; info</h3>
            <p>
              Vi bruger primært Facebook og hjemmesiden til at dele nyheder, events og praktisk info.
            </p>
            <p className="mt-1">
              Følg os for opdateringer om opstart, træningsaftener, turneringer og fællesevents.
            </p>
          </div>
        </div>
      </section>

      {/* MODAL: BOOK PRØVETRÆNING */}
      {showBooking && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Book prøvetræning</h2>
              <button
                type="button"
                onClick={closeBooking}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Luk
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-800">
              <p className="text-xs text-gray-600">
                Udfyld formularen, så vender vi tilbage med en bekræftelse eller forslag til en anden tid.
              </p>

              <div>
                <label className="text-xs font-medium">Dato &amp; tidspunkt</label>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  value={selectedSlot}
                  onChange={(e) => {
                    const slotId = e.target.value;
                    setSelectedSlot(slotId);
                    const [date, time] = slotId.split("T");
                    setSelectedDate(date);
                    setSelectedTime(time);
                  }}
                >
                  {slots.map((s) => {
                    const slotId = `${s.isoDate}T${s.time}`;
                    return (
                      <option key={slotId} value={slotId}>
                        {s.label}
                      </option>
                    );
                  })}
                </select>
              </div>

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
                <label className="text-xs font-medium">Bemærkning (valgfri)</label>
                <textarea
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {msg && (
                <p
                  className={`text-xs ${
                    success ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {msg}
                </p>
              )}
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeBooking}
                className="rounded-xl border border-gray-300 px-3 py-2 text-xs"
              >
                Annuller
              </button>
              <button
                type="button"
                onClick={submitBooking}
                disabled={busy}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Sender…" : "Send forespørgsel"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* [HELP:ABOUT:MODAL] END */}
    </main>
  );
}
/* [HELP:ABOUT:COMP] END */
