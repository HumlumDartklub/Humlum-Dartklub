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
  { title: "Udvikling",  text: "små skridt, store resultater over tid." },
  { title: "Glæde",      text: "vi tager spillet seriøst, men os selv med et smil." },
];
/* [HELP:ABOUT:VALUES] END */

/* [HELP:ABOUT:BOARD] START — bestyrelsesliste (offentlig oversigt) */
const BOARD: Member[] = [
  { role: "Formand",          name: "[Navn]", email: "mail@example.dk", phone: "+45 xx xx xx xx" },
  { role: "Næstformand",      name: "[Navn]", email: "mail@example.dk", phone: "+45 xx xx xx xx" },
  { role: "Kasserer",         name: "[Navn]", email: "mail@example.dk", phone: "+45 xx xx xx xx" },
  { role: "Bestyrelsesmedlem",name: "[Navn]", email: "mail@example.dk", phone: "+45 xx xx xx xx" },
  { role: "Suppleant",        name: "[Navn]", email: "mail@example.dk", phone: "+45 xx xx xx xx" },
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
      const [hh, mm] = r.timeHHMM.split(":").map((n) => parseInt(n, 10));
      d.setHours(hh, mm, 0, 0);
      if (d.getTime() <= now.getTime()) continue;

      const isoDate = d.toISOString().slice(0, 10);
      const time = r.timeHHMM;
      const dateLabel = d.toLocaleDateString("da-DK", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
      const label = `${dateLabel} · ${time}`;
      out.push({ date: d, isoDate, time, label });
      if (out.length >= count) break;
    }
    weeksChecked += 1;
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}
/* [HELP:ABOUT:UTIL:nextSlots] END */

/* [HELP:ABOUT:COMPONENT] START — hovedkomponent */
export default function AboutPage() {
  /* [HELP:ABOUT:HANDLERS:NAV] START — smooth scroll helper */
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
  /* [HELP:ABOUT:STATE] END */

  /* [HELP:ABOUT:SLOTS:COMPUTE] START — forudberegn mulige tider */
  const slots = useMemo(() => nextSlots(TRAIN_RULES, 24, INTERVAL_WEEKS), []);
  /* [HELP:ABOUT:SLOTS:COMPUTE] END */

  /* [HELP:ABOUT:EFFECTS:PRESELECT] START — forvælg første slot ved åbning */
  useEffect(() => {
    if (showBooking && slots.length > 0) {
      setSelectedDate(slots[0].isoDate);
      setSelectedTime(slots[0].time);
    }
  }, [showBooking, slots]);
  /* [HELP:ABOUT:EFFECTS:PRESELECT] END */

  /* [HELP:ABOUT:HANDLERS:SUBMIT] START — send “Book prøvetræning” */
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
      const payload = {
        tab: "PROEVETRAENING",
        data: {
          navn: name,
          email,
          telefon: phone,
          dato: selectedDate,
          tid: selectedTime,
          note,
          kilde: "OM/BookProevetraening",
          ts: new Date().toISOString(),
        },
      };
      const res = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("API svarede ikke OK");
      setMsg("Tak! Din prøvetræning er registreret – vi bekræfter pr. mail.");
      setName("");
      setEmail("");
      setPhone("");
      setNote("");
    } catch (e: any) {
      setMsg(
        "Kunne ikke gemme lige nu. Prøv igen om lidt – eller skriv til humlumdartklub@gmail.com.",
      );
    } finally {
      setBusy(false);
    }
  }
  /* [HELP:ABOUT:HANDLERS:SUBMIT] END */

  /* [HELP:ABOUT:RENDER] START — hele siderendering */
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* [HELP:ABOUT:TOP:QUICKBAR] START — sticky quick-bar */}
      <div className="mb-4 sticky top-2 z-20 flex flex-wrap gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-xl border">
        <button
          onClick={() => setShowBooking(true)}
          className="px-3 py-1.5 rounded-xl bg-black text-white hover:opacity-90"
        >
          🎯 Book prøvetræning
        </button>
        <a
          href="https://maps.google.com/?q=[Din+adresse]"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-white border hover:bg-gray-50"
        >
          🗺️ Find os (nyt vindue)
        </a>
        <button
          onClick={() => go("vedtaegter")}
          className="px-3 py-1.5 rounded-xl bg-white border hover:bg-gray-50"
        >
          📜 Vedtægter
        </button>
        <button
          onClick={() => go("kontakt")}
          className="px-3 py-1.5 rounded-xl bg-white border hover:bg-gray-50"
        >
          🤝 Kontakt
        </button>
      </div>
      {/* [HELP:ABOUT:TOP:QUICKBAR] END */}

      {/* [HELP:ABOUT:INTRO] START — intro/overskrift/mini-TOC */}
      <section className="section-header">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-lime-500" />
          KORT INTRO
        </div>
        <h1 className="section-title">Om Humlum Dartklub</h1>
        <div className="section-underline" />
        <p className="section-subtitle">
          Humlum Dartklub er et lokalt fællesskab for alle der synes, at
          præcision er sjovt, og at grin hører til i træningslokalet. Vi bygger
          et trygt miljø hvor nye kan lære fundamentet i roligt tempo, og øvede
          kan skærpe formen med strukturerede forløb, interne events og
          kammeratligt pres. Fokus: fællesskab, udvikling og gode rammer.
        </p>

        {/* [HELP:ABOUT:INTRO:TOC] START — mini-TOC */}
        <nav className="mt-3 text-sm text-emerald-800 flex flex-wrap gap-x-4 gap-y-1">
          <button
            onClick={() => setShowBooking(true)}
            className="underline hover:no-underline"
          >
            Træning
          </button>
          <button
            onClick={() => go("vedtaegter")}
            className="underline hover:no-underline"
          >
            Vedtægter
          </button>
          <button
            onClick={() => go("hold")}
            className="underline hover:no-underline"
          >
            Hold &amp; rækker
          </button>
          <button
            onClick={() => go("vaerdier")}
            className="underline hover:no-underline"
          >
            Værdier
          </button>
          <button
            onClick={() => go("bestyrelse")}
            className="underline hover:no-underline"
          >
            Bestyrelse
          </button>
          <button
            onClick={() => go("dokumenter")}
            className="underline hover:no-underline"
          >
            Dokumenter
          </button>
          <button
            onClick={() => go("find-os")}
            className="underline hover:no-underline"
          >
            Find os
          </button>
          <button
            onClick={() => go("kontakt")}
            className="underline hover:no-underline"
          >
            Kontakt
          </button>
        </nav>
        {/* [HELP:ABOUT:INTRO:TOC] END */}
      </section>
      {/* [HELP:ABOUT:INTRO] END */}

      {/* [HELP:ABOUT:GRID] START — dashboard-sektioner */}
      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* [HELP:ABOUT:SEC:TRAINING] START */}
        <section className="card h-full min-h-[120px] lg:col-span-2">
          <header className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="kicker mb-1">
                <span className="h-2 w-2 rounded-full bg-lime-500" />
                TRÆNING &amp; PRØVETRÆNING
              </div>
              <h2 className="text-lg font-semibold">Træning i Humlum Dartklub</h2>
            </div>
            <button
              onClick={() => setShowBooking(true)}
              className="hidden sm:inline-flex items-center rounded-full border border-emerald-700 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
            >
              🎯 Book prøvetræning
            </button>
          </header>
          <p className="text-sm text-gray-700 mb-2">
            Vi starter med faste træningsaftener, hvor nye kan prøve kræfter med
            darts i trygge rammer, og øvede kan arbejde målrettet med teknik og
            mentalt fokus. Træningerne er opbygget med opvarmning, fokuserede
            øvelser og afsluttende spil – så alle får noget med hjem.
          </p>
          <ul className="text-sm list-disc list-inside space-y-1 text-gray-700 mb-3">
            <li>Fælles intro til regler, udstyr og god dartkultur.</li>
            <li>Træningsøvelser med fokus på ro, rutine og gentagelse.</li>
            <li>Små interne matcher og sociale formater.</li>
          </ul>
          <div className="mt-3 border-t pt-3 text-xs text-gray-600">
            <div className="font-semibold mb-1">
              Prøvetræning – sådan fungerer det
            </div>
            <p className="mb-2">
              Du kan tilmelde dig en gratis prøvetræning via knappen herunder.
              Så fordeler vi jer over de kommende træningsaftener, så der er god
              plads ved banerne, og vi kan tage godt imod jer.
            </p>
            <button
              onClick={() => setShowBooking(true)}
              className="inline-flex items-center rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              🎯 Book prøvetræning
            </button>
          </div>
        </section>
        {/* [HELP:ABOUT:SEC:TRAINING] END */}

        {/* [HELP:ABOUT:SEC:BYLAWS] START — Vedtægter */}
        <section
          id="vedtaegter"
          className="card h-full min-h-[120px] flex flex-col justify-between"
        >
          <details className="group" open>
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>VEDTÆGTER (OFFENTLIGT OVERBLIK)</span>
                  <span className="ml-2 text-xs text-emerald-800">📜</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                  ▾
                </span>
              </div>
            </summary>
            <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
              <li>
                <span className="font-semibold">Navn &amp; hjemsted:</span>{" "}
                Humlum Dartklub, Struer Kommune.
              </li>
              <li>
                <span className="font-semibold">Formål:</span> Dart for alle –
                med Fællesskab &amp; Præcision.
              </li>
              <li>
                <span className="font-semibold">Medlemskab:</span> Klub under
                DDU/DIF.
              </li>
              <li>
                <span className="font-semibold">Kontingent-princip:</span>{" "}
                Vedtages årligt på GF; kan differentieres.
              </li>
              <li>
                <span className="font-semibold">Generalforsamling:</span> Årlig;
                klubbens øverste myndighed.
              </li>
              <li>
                <span className="font-semibold">Regnskab:</span> Kalenderår;
                revideres og offentliggøres for medlemmer.
              </li>
            </ul>
            <details className="mt-4 group">
              <summary className="cursor-pointer select-none inline-flex items-center gap-2 text-sm underline text-emerald-700">
                Vores linje &amp; principper (fold ud)
                <span className="opacity-60 text-xs">
                  (klubprofil – ikke jura)
                </span>
              </summary>
              <div className="mt-2 text-xs text-gray-700 space-y-1">
                <p>
                  Vedtægterne skal være klare og forståelige – både for
                  medlemmer og samarbejdspartnere. Vi vil løbende justere dem,
                  så de følger klubbens udvikling, men altid med fokus på
                  gennemsigtighed, ordentlighed og medlemsinddragelse.
                </p>
                <p>
                  Når de endelige vedtægter er vedtaget på stiftende
                  generalforsamling, lægger vi dem op som PDF her på siden.
                </p>
              </div>
            </details>
            <div className="mt-3 text-sm">
              <Link
                href="/docs/vedtaegter.pdf"
                className="inline-flex items-center rounded-full border border-emerald-700 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
              >
                📜 Åbn vedtægter (PDF)
              </Link>
            </div>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:BYLAWS] END */}

        {/* [HELP:ABOUT:SEC:TEAMS] START — Hold & rækker */}
        <section
          id="hold"
          className="card h-full min-h-[120px] flex flex-col justify-between"
        >
          <details className="group" open>
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>HOLD &amp; RÆKKER</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                  ▾
                </span>
              </div>
            </summary>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                Vi starter enkelt og bygger op over tid. Første skridt er at få
                en solid træningskultur og interne aktiviteter. Næste skridt kan
                være hold i lokale rækker og senere deltagelse i DDU-turneringer.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Åben træning for alle niveauer.</li>
                <li>Interne klubturneringer og sociale events.</li>
                <li>Mulighed for at samle turneringshold på sigt.</li>
              </ul>
            </div>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:TEAMS] END */}

        {/* [HELP:ABOUT:SEC:VALUES] START — værdikort */}
        <section
          id="vaerdier"
          className="card h-full min-h-[120px] flex flex-col justify-between"
        >
          <details className="group" open>
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
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                Humlum Dartklub skal være et sted, hvor man både kan jagte
                180&apos;ere og få et godt grin. Derfor arbejder vi efter nogle
                få, men klare værdier:
              </p>
              <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                {VALUES.map((v) => (
                  <li key={v.title}>
                    <span className="font-semibold">{v.title}:</span> {v.text}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:VALUES] END */}

        {/* [HELP:ABOUT:SEC:BOARD] START — bestyrelseskort */}
        <section
          id="bestyrelse"
          className="card h-full min-h-[120px] flex flex-col justify-between lg:col-span-2"
        >
          <details className="group" open>
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>BESTYRELSE</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                  ▾
                </span>
              </div>
            </summary>
            <div className="text-sm text-gray-700">
              <p className="mb-2">
                Når Humlum Dartklub er stiftet, offentliggør vi her den valgte
                bestyrelse og kontaktinfo. Indtil da viser vi en skitse til en
                typisk rollefordeling:
              </p>
              <dl className="mt-2 grid gap-2 text-sm text-gray-800 sm:grid-cols-2">
                {BOARD.map((m) => (
                  <div key={m.role} className="border rounded-xl px-3 py-2">
                    <dt className="font-semibold">{m.role}</dt>
                    <dd>{m.name}</dd>
                    {m.email && (
                      <dd className="text-xs text-emerald-800">
                        <a
                          href={`mailto:${m.email}`}
                          className="underline"
                        >
                          {m.email}
                        </a>
                      </dd>
                    )}
                    {m.phone && (
                      <dd className="text-xs text-emerald-800">
                        <a
                          href={`tel:${m.phone.replace(/\s+/g, "")}`}
                          className="underline"
                        >
                          {m.phone}
                        </a>
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            </div>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:BOARD] END */}

        {/* [HELP:ABOUT:SEC:DOCS] START — Dokumenter */}
        <section
          id="dokumenter"
          className="card h-full min-h-[120px] flex flex-col justify-between"
        >
          <details className="group" open>
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
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                Her samler vi centrale dokumenter for klubben, fx referat fra
                stiftende generalforsamling, regnskab, årsberetning og andet
                materiale, som medlemmerne skal kunne finde.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Stiftende generalforsamling – referat (kommer senere)</li>
                <li>Regnskab og budget (kommer senere)</li>
                <li>Årsberetning (kommer senere)</li>
              </ul>
            </div>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:DOCS] END */}

        {/* [HELP:ABOUT:SEC:MAP] START — Find os */}
        <section
          id="find-os"
          className="card h-full min-h-[120px] flex flex-col justify-between"
        >
          <details className="group" open>
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>FIND OS (KORT &amp; PARKERING)</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                  ▾
                </span>
              </div>
            </summary>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                Humlum Dartklub får hjemmebane i et lokale, hvor der er plads
                til baner, ophold og ordentlig belysning. Vi publicerer den
                præcise adresse og parkeringsmuligheder, så snart lejeaftalen er
                på plads.
              </p>
              <dl className="mt-2 text-sm text-gray-800">
                <div>
                  <dt className="font-semibold">Adresse</dt>
                  <dd>[Adresse kommer]</dd>
                </div>
                <div>
                  <dt className="font-semibold mt-1">Parkering</dt>
                  <dd>[Info om parkering kommer]</dd>
                </div>
              </dl>
            </div>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:MAP] END */}

        {/* [HELP:ABOUT:SEC:CONTACT] START */}
        <section
          id="kontakt"
          className="card h-full min-h-[84px] md:col-span-2 lg:col-span-3"
        >
          <details className="group" open>
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>KONTAKT OS</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">
                  ▾
                </span>
              </div>
            </summary>
            <div className="grid gap-3 md:grid-cols-3 text-sm text-gray-800">
              <div className="border rounded-xl p-3">
                <div className="font-semibold mb-1">Mail</div>
                <a
                  href="mailto:humlumdartklub@gmail.com"
                  className="underline text-emerald-700 hover:text-emerald-800"
                >
                  humlumdartklub@gmail.com
                </a>
              </div>
              <div className="border rounded-xl p-3">
                <div className="font-semibold mb-1">Telefon</div>
                <a
                  href="tel:+45XXXXXXXX"
                  className="underline text-emerald-700 hover:text-emerald-800"
                >
                  +45 xx xx xx xx
                </a>
              </div>
              <div className="border rounded-xl p-3">
                <div className="font-semibold mb-1">Facebook</div>
                <a
                  href="https://facebook.com/[din-side]"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-emerald-700 hover:text-emerald-800"
                >
                  facebook.com/[din-side]
                </a>
              </div>
            </div>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:CONTACT] END */}
      </section>
      {/* [HELP:ABOUT:GRID] END */}

      {/* [HELP:ABOUT:MODAL] START — modal: Book prøvetræning */}
      {showBooking && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm flex items-start justify-center p-4"
          onClick={() => setShowBooking(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-xl border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">
                Book prøvetræning i Humlum Dartklub
              </h3>
              <button
                onClick={() => setShowBooking(false)}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Luk ✕
              </button>
            </div>

            <p className="text-sm text-gray-700 mb-3">
              Udfyld formularen herunder, så fordeler vi jer på en af de
              kommende træningsaftener. Du får en bekræftelse pr. mail, når vi
              har registreret din tilmelding.
            </p>

            {msg && (
              <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {msg}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Navn *
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Telefon
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Foretrukken dato *
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                  >
                    <option value="">Vælg dato…</option>
                    {slots.map((s) => (
                      <option key={s.isoDate} value={s.isoDate}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Tidspunkt *
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                  >
                    <option value="">Vælg tidspunkt…</option>
                    <option value="18:30">18:30</option>
                    <option value="19:00">19:00</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Bemærkning
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 text-xs text-gray-600">
              <span>Felter markeret med * skal udfyldes.</span>
              <button
                onClick={submitBooking}
                disabled={busy}
                className="inline-flex items-center rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {busy ? "Sender…" : "Send tilmelding"}
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-600">
              Gratis og uforpligtende. Vi bekræfter på e-mail. (Ændr frekvens i
              koden ved <code>INTERVAL_WEEKS</code>.)
            </p>
          </div>
        </div>
      )}
      {/* [HELP:ABOUT:MODAL] END */}
    </main>
  );
  /* [HELP:ABOUT:RENDER] END */
}
/* [HELP:ABOUT:COMPONENT] END */
