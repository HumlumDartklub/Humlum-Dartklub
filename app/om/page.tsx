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
      const [hh, mm] = r.timeHHMM.split(":").map(n => parseInt(n, 10));
      d.setHours(hh, mm, 0, 0);
      if (d.getTime() <= now.getTime()) continue;

      const isoDate = d.toISOString().slice(0,10);
      const time = r.timeHHMM;
      const dateLabel = d.toLocaleDateString("da-DK", { weekday:"short", day:"2-digit", month:"short" });
      const label = `${dateLabel} · ${time}`;
      out.push({ date: d, isoDate, time, label });
      if (out.length >= count) break;
    }
    weeksChecked += 1;
  }
  return out.sort((a,b)=>a.date.getTime()-b.date.getTime());
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
      ].filter(Boolean).join(", ");
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
      // Nulstil felter
      setName(""); setEmail(""); setPhone(""); setNote("");
    } catch (e:any) {
      setMsg("Kunne ikke gemme lige nu. Prøv igen om lidt – eller skriv til humlumdartklub@gmail.com.");
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
        <button onClick={() => setShowBooking(true)} className="px-3 py-1.5 rounded-xl bg-black text-white hover:opacity-90">
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
        <button onClick={() => go("vedtaegter")} className="px-3 py-1.5 rounded-xl bg-white border hover:bg-gray-50">
          📜 Vedtægter
        </button>
        <button onClick={() => go("kontakt")} className="px-3 py-1.5 rounded-xl bg-white border hover:bg-gray-50">
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
          Humlum Dartklub er et lokalt fællesskab for alle der synes, at præcision er sjovt, og at grin hører til i træningslokalet.
          Vi bygger et trygt miljø hvor nye kan lære fundamentet i roligt tempo, og øvede kan skærpe formen med strukturerede forløb,
          interne events og kammeratligt pres. Fokus: fællesskab, udvikling og gode rammer.
        </p>

        {/* [HELP:ABOUT:INTRO:TOC] START — mini-TOC */}
        <nav className="mt-3 text-sm text-emerald-800 flex flex-wrap gap-x-4 gap-y-1">
          <button onClick={() => setShowBooking(true)} className="underline hover:no-underline">Træning</button>
          <button onClick={() => go("vedtaegter")} className="underline hover:no-underline">Vedtægter</button>
          <button onClick={() => go("hold")} className="underline hover:no-underline">Hold & rækker</button>
          <button onClick={() => go("vaerdier")} className="underline hover:no-underline">Værdier</button>
          <button onClick={() => go("bestyrelse")} className="underline hover:no-underline">Bestyrelse</button>
          <button onClick={() => go("dokumenter")} className="underline hover:no-underline">Dokumenter</button>
          <button onClick={() => go("find-os")} className="underline hover:no-underline">Find os</button>
          <button onClick={() => go("kontakt")} className="underline hover:no-underline">Kontakt</button>
        </nav>
        {/* [HELP:ABOUT:INTRO:TOC] END */}
      </section>
      {/* [HELP:ABOUT:INTRO] END */}

      {/* [HELP:ABOUT:GRID] START — dashboard-sektioner */}
      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* [HELP:ABOUT:SEC:VEDTAEGTER] START */}
        <section id="vedtaegter" className="card h-full min-h-[84px]">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>VEDTÆGTER (OFFENTLIGT OVERBLIK)</span>
                  <span className="ml-2 text-xs text-emerald-800">📜</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">▾</span>
              </div>
            </summary>
            <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
              <li><span className="font-semibold">Navn & hjemsted:</span> Humlum Dartklub, Struer Kommune.</li>
              <li><span className="font-semibold">Formål:</span> Dart for alle – med Fællesskab & Præcision.</li>
              <li><span className="font-semibold">Medlemskab:</span> Klub under DDU/DIF.</li>
              <li><span className="font-semibold">Kontingent-princip:</span> Vedtages årligt på GF; kan differentieres.</li>
              <li><span className="font-semibold">Generalforsamling:</span> Årlig; klubbens øverste myndighed.</li>
              <li><span className="font-semibold">Regnskab:</span> Kalenderår; revideres og offentliggøres for medlemmer.</li>
            </ul>
            <details className="mt-4 group">
              <summary className="cursor-pointer select-none inline-flex items-center gap-2 text-sm underline text-emerald-700">
                Vores linje & principper (fold ud)
                <span className="opacity-60 text-xs">(klubprofil – ikke jura)</span>
              </summary>
              <div className="mt-3 border-t pt-3 text-sm leading-7 text-gray-800">
                <ul className="list-disc pl-5 space-y-2">
                  <li><span className="font-semibold">Fællesskab først:</span> Trygt, venligt og inkluderende miljø.</li>
                  <li><span className="font-semibold">Præcision & udvikling:</span> Træning i øjenhøjde, tydelig progression.</li>
                  <li><span className="font-semibold">Åben & ordentlig ledelse:</span> Demokrati og indblik i økonomi.</li>
                  <li><span className="font-semibold">Inklusion:</span> Alle niveauer; junior trygge rammer.</li>
                  <li><span className="font-semibold">Fairplay:</span> Respekt og god adfærd.</li>
                  <li><span className="font-semibold">Sund økonomi:</span> Enkle takster og gennemsigtighed.</li>
                </ul>
                <div className="mt-4">
                  <a
                    href="mailto:humlumdartklub@gmail.com?subject=Anmodning om fulde vedt%C3%A6gter (PDF)"
                    className="px-3 py-1.5 rounded-xl bg-black text-white hover:opacity-90"
                  >
                    Spørg om fulde vedtægter (PDF)
                  </a>
                </div>
                <p className="mt-2 text-xs text-gray-600">Fuld juridisk version deles efter henvendelse.</p>
              </div>
            </details>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:VEDTAEGTER] END */}

        {/* [HELP:ABOUT:SEC:HOLD] START */}
        <section id="hold" className="card h-full min-h-[84px]">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>HOLD & RÆKKER</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">▾</span>
              </div>
            </summary>
            <p className="text-sm text-gray-700">
              Vi spiller bredde først og bygger niveau op. Hold tilmeldes når vi er klar.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-full border">Senior – Hverdag</span>
              <span className="px-3 py-1 rounded-full border">Senior – Weekend</span>
              <span className="px-3 py-1 rounded-full border">Damepairs</span>
              <span className="px-3 py-1 rounded-full border">+35 / +50</span>
              <span className="px-3 py-1 rounded-full border">Junior (U18)</span>
            </div>
            <div className="mt-3">
              <Link href="/events" className="underline text-emerald-700 hover:text-emerald-800 text-sm">
                Se kampe & arrangementer
              </Link>
            </div>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:HOLD] END */}

        {/* [HELP:ABOUT:SEC:VAERDIER] START */}
        <section id="vaerdier" className="card h-full min-h-[84px]">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>VÆRDIER</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">▾</span>
              </div>
            </summary>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-800">
              {VALUES.map((v) => (
                <li key={v.title}>
                  <span className="font-semibold">{v.title}</span>: {v.text}
                </li>
              ))}
            </ul>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:VAERDIER] END */}

        {/* [HELP:ABOUT:SEC:BOARD] START */}
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

            <p className="text-sm text-gray-700 mb-4">Offentlig oversigt over roller og kontakt.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-lime-200/60">
                    <th className="py-2 pr-4">Rolle</th>
                    <th className="py-2 pr-4">Navn</th>
                    <th className="py-2 pr-4">E-mail</th>
                    <th className="py-2">Telefon</th>
                  </tr>
                </thead>
                <tbody>
                  {BOARD.map((m, i) => (
                    <tr key={i} className="border-b last:border-b-0 border-lime-100">
                      <td className="py-2 pr-4 font-medium text-gray-900">{m.role}</td>
                      <td className="py-2 pr-4">{m.name}</td>
                      <td className="py-2 pr-4">
                        {m.email ? (
                          <a href={`mailto:${m.email}`} className="underline text-emerald-700 hover:text-emerald-800">
                            {m.email}
                          </a>
                        ) : (
                          <span className="opacity-60">[mail]</span>
                        )}
                      </td>
                      <td className="py-2">{m.phone || <span className="opacity-60">[+45 xx xx xx xx]</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:BOARD] END */}

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
              <li><span className="opacity-60">Vedtægter (PDF) – internt; fås ved henvendelse.</span></li>
              <li><Link href="/docs/privatlivspolitik.pdf" className="underline text-emerald-700 hover:text-emerald-800">Privatlivspolitik (PDF)</Link></li>
              <li><Link href="/docs/ordensregler.pdf" className="underline text-emerald-700 hover:text-emerald-800">Ordensregler (PDF)</Link></li>
            </ul>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:DOCS] END */}

        {/* [HELP:ABOUT:SEC:MAP] START */}
        <section id="find-os" className="card h-full min-h-[84px]">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>FIND OS (KORT & PARKERING)</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">▾</span>
              </div>
            </summary>
            <dl className="text-sm text-gray-800 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <dt className="col-span-1 font-semibold">Adresse</dt>
                <dd className="col-span-2">[Tilføj adresse her]</dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="col-span-1 font-semibold">Parkering</dt>
                <dd className="col-span-2">Gratis parkering ved indgangen efter kl. 17. Husk opmærkning.</dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="col-span-1 font-semibold">Kort</dt>
                <dd className="col-span-2">
                  <a
                    href="https://maps.google.com/?q=[Din+adresse]"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-emerald-700 hover:text-emerald-800"
                  >
                    Åbn Google Maps (nyt vindue)
                  </a>
                </dd>
              </div>
            </dl>
          </details>
        </section>
        {/* [HELP:ABOUT:SEC:MAP] END */}

        {/* [HELP:ABOUT:SEC:CONTACT] START */}
        <section id="kontakt" className="card h-full min-h-[84px] md:col-span-2 lg:col-span-3">
          <details className="group" open>
            <summary className="cursor-pointer list-none">
              <div className="kicker mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>KONTAKT OS</span>
                </div>
                <span className="inline-block transition-transform duration-200 group-open:rotate-180">▾</span>
              </div>
            </summary>
            <div className="grid gap-3 md:grid-cols-3 text-sm text-gray-800">
              <div className="border rounded-xl p-3">
                <div className="font-semibold mb-1">Mail</div>
                <a href="mailto:humlumdartklub@gmail.com" className="underline text-emerald-700 hover:text-emerald-800">
                  humlumdartklub@gmail.com
                </a>
              </div>
              <div className="border rounded-xl p-3">
                <div className="font-semibold mb-1">Telefon</div>
                <a href="tel:+45XXXXXXXX" className="underline text-emerald-700 hover:text-emerald-800">
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
        <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm flex items-start justify-center p-4" onClick={() => setShowBooking(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-xl border" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">🎯 Book prøvetræning</h3>
              <button className="px-2 py-1 rounded-lg border hover:bg-gray-50" onClick={()=>setShowBooking(false)}>Luk</button>
            </div>

            {/* [HELP:ABOUT:MODAL:SLOTS] START — one-liner slots */}
            <div>
              <div className="kicker mb-2">
                <span className="h-2 w-2 rounded-full bg-lime-500" /> Vælg dato & tid
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {slots.map((s, idx) => {
                  const active = s.isoDate === selectedDate && s.time === selectedTime;
                  return (
                    <button
                      key={`${s.isoDate}-${s.time}-${idx}`}
                      onClick={() => { setSelectedDate(s.isoDate); setSelectedTime(s.time); }}
                      className={`px-3 py-2 rounded-xl border text-sm text-left ${active ? "bg-emerald-600 text-white" : "hover:bg-gray-50"}`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* [HELP:ABOUT:MODAL:SLOTS] END */}

            {/* [HELP:ABOUT:MODAL:FORM] START — formularfelter */}
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Navn</label>
                <input className="mt-1 w-full rounded-xl border px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">E-mail</label>
                <input className="mt-1 w-full rounded-xl border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Telefon (valgfri)</label>
                <input className="mt-1 w-full rounded-xl border px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Bemærkning (valgfri)</label>
                <input className="mt-1 w-full rounded-xl border px-3 py-2" value={note} onChange={e=>setNote(e.target.value)} />
              </div>
            </div>
            {/* [HELP:ABOUT:MODAL:FORM] END */}

            {msg && (
              <p className={`mt-3 text-sm ${msg.includes("Tak!") ? "text-emerald-700" : "text-red-600"}`}>
                {msg}
              </p>
            )}

            {/* [HELP:ABOUT:MODAL:CTA] START — knapper */}
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded-xl bg-white border hover:bg-gray-50" onClick={()=>setShowBooking(false)}>Annullér</button>
              <button
                onClick={submitBooking}
                disabled={busy || !name || !email || !selectedDate || !selectedTime}
                className="px-4 py-1.5 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Gemmer…" : "Book gratis prøvetræning"}
              </button>
            </div>
            {/* [HELP:ABOUT:MODAL:CTA] END */}

            <p className="mt-2 text-xs text-gray-600">
              Gratis og uforpligtende. Vi bekræfter på e-mail. (Ændr frekvens i koden ved <code>INTERVAL_WEEKS</code>.)
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
