"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** ─────────────────────────────────────────
 *  KONFIG – pakker, priser og features (din oprindelige struktur)
 *  Pris er pr. måned. År = 12×måned (ingen rabat).
 *  Familie: base for 2 personer (FAMILY_BASE_SIZE/FAMILY_BASE_PRICE)
 *           + FAMILY_EXTRA_PER_PERSON pr. ekstra person.
 *  ───────────────────────────────────────── */
type Plan = {
  key: string;
  pakke: string;
  audience: string;
  pris_pr_mdr: number; // numeric
  features: string[];
  badge?: string;
};

const PLANS: Plan[] = [
  { key: "passiv", pakke: "Passiv", audience: "Alle", pris_pr_mdr: 39, features: [
    "Støt klubben og vær en del af fællesskabet",
    "Navn på støtteliste",
    "Nyhedsbreve",
    "Invitation til sociale events",
  ]},
  { key: "basis", pakke: "Basis", audience: "Voksen", pris_pr_mdr: 99, features: [
    "Fri træning", "Klub adgang", "Social events", "Facebook gruppe",
  ]},
  { key: "aktiv", pakke: "Aktiv", audience: "Voksen", pris_pr_mdr: 149, features: [
    "Fri træning", "Klubarrangementer", "Træningsaftener",
  ]},
  { key: "premium", pakke: "Premium", audience: "Voksen", pris_pr_mdr: 199, badge:"Mest valgt", features: [
    "For dig der vil være 110% klubmand",
    "Fri træning",
    "Klubtrøje",
    "Turneringer & events",
  ]},
  { key: "ungdom", pakke: "Ungdom", audience: "U/18", pris_pr_mdr: 59, features: [
    "Ungdomsmedlemskab med træning", "Træning", "Turneringer", "Mentorordning & ungdomsarrangementer",
  ]},
  { key: "familie", pakke: "Familie", audience: "Hele familien", pris_pr_mdr: 269, features: [
    "Hele husstanden kan spille og deltage",
    "Fri træning for familien",
    "Familieevents",
    "Forældre-barn turneringer",
  ]},
];

// Familie-prislogik
const FAMILY_BASE_SIZE = 2;
const FAMILY_BASE_PRICE = 269;       // for op til 2 personer
const FAMILY_EXTRA_PER_PERSON = 50;  // + pr. ekstra person udover 2

// Dropdowns
const NIVEAUER = ["Hygge", "Øvet", "Turnering"] as const;
const KOEN = ["Mand", "Kvinde", "Andet"] as const;

export default function BlivMedlemPage() {
  // UI-state
  const [selectedKey, setSelectedKey] = useState<string>("aktiv");
  const selectedPlan = useMemo(() => PLANS.find(p => p.key === selectedKey)!, [selectedKey]);

  // Form
  const [navn, setNavn] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [adresse, setAdresse] = useState("");
  const [postnrBy, setPostnrBy] = useState("");
  const [foedselsaar, setFoedselsaar] = useState("");
  const [note, setNote] = useState("");
  const [niveau, setNiveau] = useState<typeof NIVEAUER[number]>("Hygge");
  const [koen, setKoen] = useState<typeof KOEN[number]>("Mand");

  // Kun ved familie
  const [husstand, setHusstand] = useState<number>(2);

  // Feedback
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Pris pr. måned (dynamisk for Familie)
  const prisMdr = useMemo(() => {
    if (selectedPlan.key !== "familie") return selectedPlan.pris_pr_mdr;
    const extra = Math.max(0, (husstand - FAMILY_BASE_SIZE)) * FAMILY_EXTRA_PER_PERSON;
    return FAMILY_BASE_PRICE + extra;
  }, [selectedPlan, husstand]);

  const formRef = useRef<HTMLDivElement>(null);

  // Gem pakkeinfo i localStorage (hvis du senere vil bruge det andre steder)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const data = PLANS.map(p => ({
      pakke: p.pakke,
      pris_pr_mdr: p.pris_pr_mdr,
      features: p.features.join("; "),
      badge: p.badge || "",
    }));
    localStorage.setItem("HDK_PAKKER", JSON.stringify(data));
  }, []);

  function onChoosePlan(key: string) {
    setSelectedKey(key);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // Robust JSON-parse (undgår “Unexpected end of JSON input”)
  function parseJsonSafe(t: string) {
    try { return t ? JSON.parse(t) : null; } catch { return null; }
  }

  async function submit() {
    setMsg(null);
    if (!navn || !email) {
      setMsg("Udfyld venligst navn og e-mail.");
      return;
    }
    if (selectedPlan.key === "familie" && (!husstand || husstand < 2)) {
      setMsg("Vælg husstand (min. 2 personer) for Familie-pakken.");
      return;
    }

    // NB: Hvis du sætter NEXT_PUBLIC_MOBILEPAY_LINK i Netlify, bruger vi 'mobilepay', ellers 'cash'
    const mobilepayLink = process.env.NEXT_PUBLIC_MOBILEPAY_LINK || "";
    const payment_method = mobilepayLink ? "mobilepay" : "cash";

    setBusy(true);
    try {
      // >>> ÆNDRING HER: vi bruger /api/join og robust parsing
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          // pakke & pris
          package_id: selectedPlan.pakke,
          period: "måned",
          price_dkk_per_month: prisMdr,
          household: selectedPlan.key === "familie" ? husstand : "",
          // niveau & køn
          level: niveau,
          gender: koen,
          // kontakt
          name: navn,
          email,
          phone: telefon,
          address: adresse,
          zip_city: postnrBy,
          birth_year: foedselsaar,
          notes: note,
          // betaling (manuel nu)
          payment_method,
        }),
      });

      const text = await res.text().catch(() => "");
      const data = parseJsonSafe(text);

      if (!res.ok || !data?.ok) {
        const msg = (data && (data.error || data.message)) || (text || `Kunne ikke gemme (HTTP ${res.status})`);
        throw new Error(msg);
      }

      setMsg("Tak! Din indmeldelse er modtaget – vi vender tilbage pr. mail. (Betaling: MobilePay i linket eller kontant i klubben)");
      // ryd felter (beholder valgt pakke)
      setNavn(""); setEmail(""); setTelefon(""); setAdresse(""); setPostnrBy(""); setFoedselsaar(""); setNote("");
    } catch (e: any) {
      setMsg(e.message || "Der skete en fejl.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="section-header">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-lime-500" /> BLIV MEDLEM
        </div>
        <h1 className="section-title">Bliv medlem i Humlum Dartklub</h1>
        <div className="section-underline" />
        <p className="section-subtitle">Vælg den pakke der passer til dig. Du kan altid opgradere senere.</p>
      </div>

      {/* Kort-grid med pakker */}
      <section className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((p) => (
          <article key={p.key} className="relative card">
            {p.badge && (
              <div className="absolute -top-3 -right-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-black shadow">
                {p.badge}
              </div>
            )}

            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-lime-300/60 bg-lime-50 px-3 py-1 text-xs text-black">
              {p.pakke}
            </div>

            <p className="text-sm text-slate-600">{p.audience}</p>
            <p className="mt-1 text-3xl font-extrabold text-emerald-700">{p.pris_pr_mdr} kr/md.</p>

            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 flex-1">
              {p.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>

            <div className="card-footer">
              <button
                onClick={() => onChoosePlan(p.key)}
                className="btn btn-primary mt-4 w-full text-center"
              >
                Vælg {p.pakke}
              </button>
            </div>
          </article>
        ))}
      </section>

      {/* Formular */}
      <section ref={formRef} className="mt-10">
        <div className="section-header">
          <div className="kicker">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Tilmelding
          </div>
        </div>

        <div className="section-underline" />
        <h2 className="section-title">Pakke: {selectedPlan.pakke}</h2>
        <p className="section-subtitle">
          Pris: <b>{prisMdr} kr/md</b> {selectedPlan.key === "familie" ? "(beregnet efter husstand)" : "(fast pris)"}
        </p>

        {/* Udvidelser: niveau + køn */}
        <div className="grid sm:grid-cols-3 gap-3 my-4">
          <div>
            <label className="text-sm font-medium">Niveau</label>
            <select className="mt-1 w-full rounded-xl border px-3 py-2"
              value={niveau} onChange={e=>setNiveau(e.target.value as any)}>
              {NIVEAUER.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block">Køn</label>
            <div className="mt-1 inline-flex gap-2">
              {KOEN.map(k => (
                <button
                  key={k}
                  onClick={()=>setKoen(k)}
                  type="button"
                  className={`px-3 py-2 rounded-xl border text-sm ${koen===k ? "bg-emerald-600 text-white" : "hover:bg-gray-50"}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Familie: husstand */}
        {selectedPlan.key === "familie" && (
          <div className="grid sm:grid-cols-3 gap-3 my-2">
            <div>
              <label className="text-sm font-medium">Husstand (antal personer)</label>
              <select className="mt-1 w-full rounded-xl border px-3 py-2"
                value={husstand}
                onChange={e=>setHusstand(parseInt(e.target.value,10))}
              >
                {[2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Basepris dækker {FAMILY_BASE_SIZE}. +{FAMILY_EXTRA_PER_PERSON} kr/md pr. ekstra.
              </p>
            </div>
          </div>
        )}

        {/* Kontaktfelter */}
        <div className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Navn</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={navn} onChange={e=>setNavn(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">E-mail</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Telefon (valgfri)</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={telefon} onChange={e=>setTelefon(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Fødselsår (valgfri)</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="YYYY" value={foedselsaar} onChange={e=>setFoedselsaar(e.target.value)} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Adresse (valgfri)</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={adresse} onChange={e=>setAdresse(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Postnr/By (valgfri)</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2" value={postnrBy} onChange={e=>setPostnrBy(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Bemærkning (valgfri)</label>
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={note} onChange={e=>setNote(e.target.value)} />
          </div>
        </div>

        {/* Feedback */}
        {msg && (
          <p className={`mt-3 text-sm ${msg.startsWith("Tak!") ? "text-emerald-700" : "text-red-600"}`}>{msg}</p>
        )}

        {/* CTA */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={submit}
            disabled={busy || !navn || !email}
            className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Sender…" : "Send indmeldelse"}
          </button>
        </div>
      </section>
    </main>
  );
}
