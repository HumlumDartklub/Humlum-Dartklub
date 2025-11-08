"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** ─────────────────────────────────────────
 *  KONFIG – pakker, priser og features (fra din fil)
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
  { key: "premium", pakke: "Premium", audience: "Voksen", pris_pr_mdr: 199, features: [
    "Alt i Aktiv", "Prioriteret booking", "Klubtrøje", "Sponsor-lodtrækninger",
  ], badge: "ANBEFALET" },
  { key: "junior", pakke: "Junior (U18)", audience: "Ung", pris_pr_mdr: 49, features: [
    "Fri træning", "Klubarrangementer", "Fællesskab",
  ]},
  { key: "familie", pakke: "Familie", audience: "Familie", pris_pr_mdr: 199, features: [
    "2 personer inkluderet", "+49 kr pr. ekstra person", "Familieaftener",
  ]},
  { key: "senior35", pakke: "Senior +35/+50", audience: "Senior", pris_pr_mdr: 79, features: [
    "Formiddagshold", "Socialt fællesskab", "Let træning",
  ]},
  { key: "damepairs", pakke: "Damepairs", audience: "Dame", pris_pr_mdr: 79, features: [
    "Træning og kampe", "Socialt miljø",
  ]},
];

const FAMILY_BASE_SIZE = 2;
const FAMILY_BASE_PRICE = 199;
const FAMILY_EXTRA_PER_PERSON = 49;

function cls(...xs: any[]) { return xs.filter(Boolean).join(" "); }

export default function BlivMedlemPage() {
  const [selectedKey, setSelectedKey] = useState<string>("basis");
  const [husstand, setHusstand] = useState<number>(FAMILY_BASE_SIZE);
  const [niveau, setNiveau] = useState<string>("Begynder");
  const [koen, setKoen] = useState<string>("Mand");

  // kontaktfelter
  const [navn, setNavn] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [adresse, setAdresse] = useState("");
  const [postnrBy, setPostnrBy] = useState("");
  const [foedselsaar, setFoedselsaar] = useState("");
  const [note, setNote] = useState("");

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedPlan = useMemo(() => PLANS.find(p => p.key === selectedKey)!, [selectedKey]);

  const prisMdr = useMemo(() => {
    if (selectedKey !== "familie") return selectedPlan?.pris_pr_mdr ?? 0;
    const extra = Math.max(0, (husstand - FAMILY_BASE_SIZE)) * FAMILY_EXTRA_PER_PERSON;
    return FAMILY_BASE_PRICE + extra;
  }, [selectedKey, selectedPlan, husstand]);

  useEffect(() => {
    // Gem planliste i localStorage (bruges af /bliv-medlem/tilmelding)
    try {
      const data = PLANS.map(p => ({ pakke: p.pakke, pris_pr_mdr: p.pris_pr_mdr, features: p.features, badge: p.badge || "" }));
      localStorage.setItem("HDK_PAKKER", JSON.stringify(data));
    } catch {}
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    // simple validering
    if (!navn) return setMsg("Udfyld navn.");
    if (!email) return setMsg("Udfyld e-mail.");

    setBusy(true);
    try {
      // >>>> ÆNDRET: Brug /api/join og robust svarhåndtering (ingen res.json())
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: navn,
          email,
          phone: telefon,
          address: adresse,
          zip_city: postnrBy,
          birth_year: foedselsaar,
          package_id: selectedPlan.pakke,
          notes: note,
          payment_method: "mobilepay" // eller "cash" – kan skiftes senere
        }),
      });
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }
      if (!res.ok || !data?.ok) throw new Error((data && data.error) || `Kunne ikke gemme (HTTP ${res.status})`);
      setMsg("Tak! Din indmeldelse er modtaget – du kan betale via MobilePay/kontant i klubben. Gem din reference fra kvitteringen.");

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

      {/* Pakker */}
      <section className="grid gap-6 lg:grid-cols-3 mt-8">
        {PLANS.map((p) => (
          <div key={p.key} className={cls(
            "rounded-2xl border p-5 bg-white",
            selectedKey === p.key ? "border-emerald-400 shadow-lg" : "border-slate-200"
          )}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{p.pakke}</h3>
              {p.badge && <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">{p.badge}</span>}
            </div>
            <div className="text-3xl font-extrabold text-emerald-700 mt-2">{p.pris_pr_mdr} kr<span className="text-sm font-normal text-slate-500"> / mdr</span></div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {p.features.map((f, i) => <li key={i}>• {f}</li>)}
            </ul>
            <button
              className={cls("mt-4 w-full btn", selectedKey === p.key ? "btn-primary" : "btn-secondary")}
              onClick={() => setSelectedKey(p.key)}
            >
              Vælg {p.pakke}
            </button>
          </div>
        ))}
      </section>

      {/* Familie-tilpasning */}
      {selectedKey === "familie" && (
        <section className="mt-8 p-4 rounded-xl border bg-white">
          <div className="text-sm text-slate-600 mb-1">Husstandsstørrelse</div>
          <input type="number" min={FAMILY_BASE_SIZE} value={husstand} onChange={(e) => setHusstand(parseInt(e.target.value || "2", 10))}
                 className="input" />
          <div className="text-sm text-slate-600 mt-2">Pris beregnes automatisk: {prisMdr} kr / mdr</div>
        </section>
      )}

      {/* Niveau / Køn */}
      <section className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-sm text-slate-600 mb-1">Niveau</div>
          <select className="input" value={niveau} onChange={(e) => setNiveau(e.target.value)}>
            <option>Begynder</option><option>Let øvet</option><option>Øvet</option>
          </select>
        </div>
        <div className="p-4 rounded-xl border bg-white">
          <div className="text-sm text-slate-600 mb-1">Køn</div>
          <select className="input" value={koen} onChange={(e) => setKoen(e.target.value)}>
            <option>Mand</option><option>Kvinde</option><option>Andet</option>
          </select>
        </div>
      </section>

      {/* Formular */}
      <section className="mt-10 p-6 rounded-2xl border bg-white">
        <h2 className="text-xl font-bold mb-4">Send indmeldelse</h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <div className="text-sm text-slate-600">Valgt pakke</div>
            <div className="font-semibold">{selectedPlan.pakke} — {prisMdr} kr / mdr</div>
          </div>

          <input className="input" placeholder="Navn" value={navn} onChange={(e) => setNavn(e.target.value)} />
          <input className="input" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
          <input className="input" placeholder="Adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
          <input className="input" placeholder="Postnr/By" value={postnrBy} onChange={(e) => setPostnrBy(e.target.value)} />
          <input className="input" placeholder="Fødselsår (valgfri)" value={foedselsaar} onChange={(e) => setFoedselsaar(e.target.value)} />
          <textarea className="input md:col-span-2" placeholder="Bemærkning (valgfri)" value={note} onChange={(e) => setNote(e.target.value)} />

          {msg && <div className="md:col-span-2 text-sm text-emerald-700">{msg}</div>}

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Sender…" : "Send indmeldelse"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
