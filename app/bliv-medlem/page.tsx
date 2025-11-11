"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

/** ─────────────────────────────────────────────────────────
 *  [HELP:CONFIG] START
 *  Pitch: Konfiguration og grunddata for siden (pakker, niveauer m.m.)
 *  Her kan du ændre labels, priser og valg-lister uden at røre layout.
 *  [HELP:CONFIG] END
 *  ───────────────────────────────────────────────────────── */

/** [HELP:TYPES:PLAN] START — datatyper for pakker */
type PlanKey = "passiv" | "basis" | "aktiv" | "premium" | "ungdom" | "familie";
type Plan = { key: PlanKey; pakke: string; audience: string; pris_pr_mdr: number; features: string[]; badge?: string };
/** [HELP:TYPES:PLAN] END */

/** [HELP:PLANS:DATA] START — pakke-data (pris/tekster/badges). Du kan redigere værdierne her. */
const PLANS: Plan[] = [
  // [HELP:PLANS:DATA:PASSIV] START — enkelt objekt for "Passiv" (copy/paste hvis du kun ændrer denne)
  { key: "passiv",  pakke: "Passiv",  audience: "Alle",         pris_pr_mdr: 39,  features: ["Støt klubben …", "Navn på støtteliste", "Nyhedsbreve", "Invitation til sociale events"] },
  // [HELP:PLANS:DATA:PASSIV] END

  // [HELP:PLANS:DATA:BASIS] START — "Basis"
  { key: "basis",   pakke: "Basis",   audience: "Voksen",       pris_pr_mdr: 99,  features: ["Fri træning","Klub adgang","Social events","Facebook gruppe"] },
  // [HELP:PLANS:DATA:BASIS] END

  // [HELP:PLANS:DATA:AKTIV] START — "Aktiv"
  { key: "aktiv",   pakke: "Aktiv",   audience: "Voksen",       pris_pr_mdr: 149, features: ["Fri træning","Klubarrangementer","Træningsaftener"] },
  // [HELP:PLANS:DATA:AKTIV] END

  // [HELP:PLANS:DATA:PREMIUM] START — "Premium"
  { key: "premium", pakke: "Premium", audience: "Voksen",       pris_pr_mdr: 199, badge:"Mest valgt", features: ["110% klubmand","Fri træning","Klubtrøje","Turneringer & events"] },
  // [HELP:PLANS:DATA:PREMIUM] END

  // [HELP:PLANS:DATA:UNGDOM] START — "Ungdom"
  { key: "ungdom",  pakke: "Ungdom",  audience: "U/18",         pris_pr_mdr: 59,  features: ["Ungdomsmedlemskab","Træning","Turneringer","Mentorordning & arrangementer"] },
  // [HELP:PLANS:DATA:UNGDOM] END

  // [HELP:PLANS:DATA:FAMILIE] START — "Familie"
  { key: "familie", pakke: "Familie", audience: "Hele familien",pris_pr_mdr: 269, features: ["Hele husstanden kan spille og deltage","Fri træning for familien","Familieevents","Forældre-barn turneringer"] },
  // [HELP:PLANS:DATA:FAMILIE] END
];
/** [HELP:PLANS:DATA] END */

/** [HELP:FORM:LEVELS] START — niveau-labels (ændr teksterne frit) */
const NIVEAUER = ["Hygge","Øvet","Turnering"] as const;
/** [HELP:FORM:LEVELS] END */

/** [HELP:FORM:GENDER] START — kønsvalg (ændr/tilføj labels efter behov) */
const KOEN = ["Mand","Kvinde","Andet"] as const;
/** [HELP:FORM:GENDER] END */

/** [HELP:FORM:ZIPCITY:DATA] START — Postnr→By mapping + forslag (redigér/tilføj) */
// Postnr → by (viser forslag og auto-udfylder)
const ZIP_TO_CITY: Record<string,string> = {
  "7400":"Herning", "7500":"Holstebro", "7600":"Struer", "7620":"Lemvig", "7700":"Thisted", "7800":"Skive"
};
const ZIP_SUGGESTIONS = Object.keys(ZIP_TO_CITY);
/** [HELP:FORM:ZIPCITY:DATA] END */

/** [HELP:FORM:FAMILY:TYPE] START — type for ekstra familiemedlemmer */
type FamMember = { first: string; last: string; year: string };
/** [HELP:FORM:FAMILY:TYPE] END */

/** ─────────────────────────────────────────────────────────
 *  PAGE
 *  ───────────────────────────────────────────────────────── */
export default function BlivMedlem() {
  /** [HELP:STATE:PLAN] START — valgt pakke + afledt plan-objekt */
  const [selectedKey, setSelectedKey] = useState<PlanKey>("basis");
  const plan = useMemo(() => PLANS.find(p => p.key === selectedKey)!, [selectedKey]);
  /** [HELP:STATE:PLAN] END */

  // [HELP:FORM:STATE] START — formularfelter (ret labels/data i config-området; her er kun state)
  const [niveau, setNiveau] = useState<(typeof NIVEAUER)[number]>("Hygge");
  const [koen, setKoen] = useState<(typeof KOEN)[number]>("Mand");

  const [fornavn, setFornavn] = useState("");
  const [efternavn, setEfternavn] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [adresse, setAdresse] = useState("");
  const [zip, setZip] = useState("");
  const [by, setBy] = useState("");
  const [birth, setBirth] = useState("");
  // [HELP:FORM:STATE] END

  /** [HELP:FORM:NOTE:STATE] START — bemærkning (toggle + tekst) */
  // Bemærkning = toggle (skjult som standard)
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  /** [HELP:FORM:NOTE:STATE] END */

  /** [HELP:FORM:FAMILY:STATE] START — familie (husstand + medlemmer) */
  // Familie
  const [husstand, setHusstand] = useState<number>(2); // 2..6
  const [fam, setFam] = useState<FamMember[]>([]);
  /** [HELP:FORM:FAMILY:STATE] END */

  /** [HELP:FORM:CTA:STATE] START — terms/busy/msg */
  // CTA/feedback
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  /** [HELP:FORM:CTA:STATE] END */

  /** [HELP:PRICE] START — månedlig pris (familie er fast pris) */
  // Pris (familie er fortsat fast pris – ingen ekstra per person)
  const prisMdr = plan.pris_pr_mdr;
  /** [HELP:PRICE] END */

  /** [HELP:FORM:ZIPCITY:FN] START — postnr→by auto-udfyld */
  // when zip changes, set city; clear city if zip cleared
  function onZipChange(v: string) {
    setZip(v);
    if (!v) { setBy(""); return; }
    if (ZIP_TO_CITY[v]) setBy(ZIP_TO_CITY[v]);
  }
  /** [HELP:FORM:ZIPCITY:FN] END */

  /** [HELP:FORM:FAMILY:SYNC] START — hold fam-længde = husstand-1 */
  // Familie: hold fam-array længde = husstand-1 (uden “primær” person)
  function syncFamCount(target: number) {
    const needed = Math.max(0, target - 1);
    setFam(prev => {
      const clone = [...prev];
      if (clone.length < needed) {
        while (clone.length < needed) clone.push({ first:"", last:"", year:"" });
      } else if (clone.length > needed) {
        clone.length = needed;
      }
      return clone;
    });
  }
  /** [HELP:FORM:FAMILY:SYNC] END */

  /** [HELP:PLAN:SCROLL] START — scroll til formular når pakke vælges */
  // Scroll til formular når man vælger pakke
  const formRef = useRef<HTMLDivElement>(null);
  function onChoosePlan(key: PlanKey) {
    setSelectedKey(key);
    if (key === "familie") syncFamCount(husstand);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 60);
  }
  /** [HELP:PLAN:SCROLL] END */

  /** [HELP:FORM:VALIDATION] START — simpel frontend-validering til CTA-knappen */
  const isValid =
    !!(fornavn && efternavn && email && adresse && zip && by && terms);
  /** [HELP:FORM:VALIDATION] END */

  /** [HELP:FORM:SUBMIT] START — gem udkast og gå til /betaling */
  async function goToPayment() {
    setMsg(null);
    if (!fornavn || !efternavn || !email || !adresse || !zip || !by) {
      setMsg("Udfyld venligst alle felter (bemærkning er valgfri).");
      return;
    }
    if (!terms) {
      setMsg("Du skal acceptere Vedtægter og Privatlivspolitik.");
      return;
    }

    // Gem i sessionStorage → /betaling kan vise opsummering
    const payload = {
      package_id: plan.pakke,
      price_dkk_per_month: prisMdr,
      level: niveau,
      gender: koen,
      first_name: fornavn,
      last_name: efternavn,
      email, phone: telefon,
      address: adresse, zip, city: by,
      birth_year: birth,
      note,
      household: plan.key === "familie" ? husstand : "",
      family_members: fam, // [{first,last,year}...]
    };
    try {
      sessionStorage.setItem("HDK_JOIN_DRAFT", JSON.stringify(payload));
      setBusy(true);
      // videre til betalingsvalget
      window.location.href = "/betaling";
    } finally {
      setBusy(false);
    }
  }
  /** [HELP:FORM:SUBMIT] END */

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* [HELP:HEADER] START — top-intro (kun tekst/overskrift) */}
      {/* Header (uændret) */}
      <div className="mb-6 rounded-2xl border border-lime-300 bg-white p-4 shadow-sm">
        <div className="inline-flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-lime-500" /> <span>Tilmelding</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold">Bliv medlem i Humlum Dartklub</h1>
        <p className="text-sm opacity-70">Vælg den pakke der passer til dig. Du kan altid opgradere senere.</p>
      </div>
      {/* [HELP:HEADER] END */}

      {/* [HELP:PLAN-CARDS] START — pakke-kort (knapper forankret i bunden) */}
      {/* Kort-grid med pakker — knapper forankres i bunden (fix: flex + mt-auto) */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((p) => (
          <article
            key={p.key}
            className={`relative flex h-full flex-col rounded-2xl border p-4 shadow-sm ${
              p.key===selectedKey ? "border-emerald-400" : "border-lime-300 hover:border-emerald-400 transition"
            }`}
          >
            {p.badge && (
              <div className="absolute -top-3 -right-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-black shadow">{p.badge}</div>
            )}
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-lime-300/60 bg-lime-50 px-3 py-1 text-xs text-black">{p.pakke}</div>
            <p className="text-sm text-slate-600">{p.audience}</p>
            <p className="mt-1 text-3xl font-extrabold text-emerald-700">{p.pris_pr_mdr} kr/md.</p>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 flex-1">
              {p.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <div className="mt-auto pt-3">
              <button onClick={() => onChoosePlan(p.key)} className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-white hover:opacity-90">Vælg {p.pakke}</button>
            </div>
          </article>
        ))}
      </section>
      {/* [HELP:PLAN-CARDS] END */}

      {/* [HELP:FORM] START — formularens card-ramme (samme stil som pakke-kort) */}
      {/* Formular i samme card-ramme som pakkerne (uændret indhold, kun ramme) */}
      <section ref={formRef} className="mt-10">
        <div className="rounded-2xl border border-lime-300 bg-white p-4 shadow-sm">
          <div className="mb-2 inline-flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> <span>Tilmelding</span>
          </div>
          <h2 className="text-2xl font-extrabold">Pakke: {plan.pakke}</h2>
          <p className="text-sm opacity-70">
            Pris: <b>{prisMdr} kr/md</b> (fast pris{plan.key==="familie" ? " for hele husstanden" : ""}).
          </p>

          {/* [HELP:FORM:ROW1] START — Niveau + Køn (+ Husstand for Familie) */}
          {/* Række 1 — Niveau + Køn + Husstand (kun for familie) */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Niveau</label>
              <select className="mt-1 w-full rounded-xl border px-3 py-2" value={niveau} onChange={e=>setNiveau(e.target.value as any)}>
                {NIVEAUER.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block">Køn</label>
              <div className="mt-1 inline-flex gap-2">
                {KOEN.map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKoen(k)}
                    className={`px-3 py-2 rounded-xl border text-sm ${koen===k ? "bg-emerald-600 text-white" : "hover:bg-gray-50"}`}
                  >
                    {k}
                  </button>
                ))}
                {/* Husstand – placeret ved siden af “Andet”, kun hvis Familie */}
                {plan.key === "familie" && (
                  <div className="ml-2">
                    <label className="sr-only">Husstand</label>
                    <select
                      className="rounded-xl border px-3 py-2 text-sm"
                      value={husstand}
                      onChange={e => { const n = parseInt(e.target.value,10); setHusstand(n); syncFamCount(n); }}
                      title="Antal i husstanden"
                    >
                      {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} personer</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* tom spacer for at fastholde 3 kol grid – intet indhold her */}
            <div aria-hidden />
          </div>
          {/* [HELP:FORM:ROW1] END */}

          {/* [HELP:FORM:ROW2] START — Navne + Fødselsår (Fødselsår forbliver her) */}
          {/* Række 2 — Fornavn / Efternavn / Fødselsår (Fødselsår forbliver her) */}
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Fornavn</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={fornavn} onChange={e=>setFornavn(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Efternavn</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={efternavn} onChange={e=>setEfternavn(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Fødselsår</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="YYYY" value={birth} onChange={e=>setBirth(e.target.value)} />
            </div>
          </div>
          {/* [HELP:FORM:ROW2] END */}

          {/* [HELP:FORM:CONTACT] START — E-mail + Telefon */}
          {/* Række 3 — Email / Telefon */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">E-mail</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Telefon</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={telefon} onChange={e=>setTelefon(e.target.value)} />
            </div>
          </div>
          {/* [HELP:FORM:CONTACT] END */}

          {/* [HELP:FORM:ADDRESS] START — Adresse */}
          {/* Række 4 — Adresse */}
          <div className="mt-3">
            <label className="text-sm font-medium">Adresse</label>
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={adresse} onChange={e=>setAdresse(e.target.value)} />
          </div>
          {/* [HELP:FORM:ADDRESS] END */}

          {/* [HELP:FORM:ZIPCITY] START — Postnr/By + datalist (auto by) */}
          {/* Række 5 — Postnr / By (auto-udfyld + forslag) */}
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Postnr</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                list="zip-suggestions"
                value={zip}
                onChange={e=>onZipChange(e.target.value.replace(/\D/g,"").slice(0,4))}
                placeholder="f.eks. 7600"
              />
              <datalist id="zip-suggestions">
                {ZIP_SUGGESTIONS.map(z => <option key={z} value={z}>{z} {ZIP_TO_CITY[z]}</option>)}
              </datalist>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">By</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={by} onChange={e=>setBy(e.target.value)} />
            </div>
          </div>
          {/* [HELP:FORM:ZIPCITY] END */}

          {/* [HELP:FORM:NOTE] START — Bemærkning toggle + tekstfelt (skjult fra start) */}
          {/* Bemærkning: knap/toggle (skjult som standard) */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setNoteOpen(v => !v)}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              aria-expanded={noteOpen}
            >
              Bemærkning (valgfri)
            </button>
            {noteOpen && (
              <div className="mt-2">
                <label className="sr-only">Bemærkning (valgfri)</label>
                <textarea
                  className="w-full rounded-xl border px-3 py-2"
                  rows={3}
                  value={note}
                  onChange={e=>setNote(e.target.value)}
                />
              </div>
            )}
          </div>
          {/* [HELP:FORM:NOTE] END */}

          {/* [HELP:FORM:FAMILY] START — Ekstra familiemedlemmer (2..N) */}
          {/* Familie – ekstra medlemmer nederst (2..N) */}
          {plan.key === "familie" && fam.length > 0 && (
            <div className="mt-6 rounded-2xl border border-lime-300 bg-white p-4">
              <div className="font-semibold mb-3">Ekstra familiemedlemmer</div>
              <div className="grid gap-3">
                {fam.map((m, idx) => (
                  <div key={idx} className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium">Fornavn #{idx+2}</label>
                      <input className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={m.first}
                        onChange={e=>setFam(cur => cur.map((x,i)=> i===idx ? {...x, first:e.target.value} : x))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Efternavn</label>
                      <input className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={m.last}
                        onChange={e=>setFam(cur => cur.map((x,i)=> i===idx ? {...x, last:e.target.value} : x))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Fødselsår</label>
                      <input className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="YYYY"
                        value={m.year}
                        onChange={e=>setFam(cur => cur.map((x,i)=> i===idx ? {...x, year:e.target.value} : x))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* [HELP:FORM:FAMILY] END */}

          {/* [HELP:FORM:CTA] START — Accept + 'Fortsæt til betaling' (samme linje) */}
          {/* Accept + CTA på samme linje – knap lidt højere; grøn når valid */}
          <div className="mt-2 grid items-center gap-3 sm:grid-cols-[auto,1fr,auto]">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" checked={terms} onChange={e=>setTerms(e.target.checked)} />
              <span className="text-sm">
                Jeg har læst og accepterer <Link href="/vedtaegter" className="underline">Vedtægter</Link> og <Link href="/privatliv" className="underline">Privatlivspolitik</Link>.
              </span>
            </label>
            {/* spacer der holder knappen på samme linje */}
            <div aria-hidden />
            <div className="flex justify-end">
              <button
                onClick={goToPayment}
                disabled={busy}
                className={`rounded-xl px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 ${
                  isValid ? "bg-emerald-600" : "bg-black"
                }`}
              >
                {busy ? "Sender…" : "Fortsæt til betaling"}
              </button>
            </div>
          </div>
          {/* [HELP:FORM:CTA] END */}

          {/* [HELP:FORM:MESSAGES] START — validerings-/statusbeskeder */}
          {msg && <p className={`mt-3 text-sm ${msg.startsWith("Udfyld")||msg.startsWith("Du skal") ? "text-red-600" : "text-emerald-700"}`}>{msg}</p>}
          {/* [HELP:FORM:MESSAGES] END */}
        </div>
      </section>
      {/* [HELP:FORM] END */}
    </main>
  );
}
