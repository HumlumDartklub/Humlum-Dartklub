"use client";

import { useEffect, useMemo, useState } from "react";

type PakkeInfo = {
  pakke?: string;
  pris_pr_mdr?: string;
  features?: string;
  badge?: string;
};

type Form = {
  niveau: string;
  koen: "Mand" | "Kvinde" | "Andet";
  navn: string;
  email: string;
  telefon: string;
  foedselsaar: string;
  adresse: string;
  postnrBy: string;
  note: string;
};

function clean(s: any) { return String(s ?? "").trim(); }

export default function TilmeldingPage() {
  console.info("HDK TILMELDING v3"); // versionsmarkør til at bekræfte at siden kører ny kode

  const [pakke, setPakke] = useState<string>("");
  const [info, setInfo] = useState<PakkeInfo | null>(null);

  const [f, setF] = useState<Form>({
    niveau: "Hygge",
    koen: "Mand",
    navn: "",
    email: "",
    telefon: "",
    foedselsaar: "",
    adresse: "",
    postnrBy: "",
    note: "",
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");
  const [ok, setOk] = useState<boolean>(false);
  const [refId, setRefId] = useState<string>("");

  const mobilepayLink = process.env.NEXT_PUBLIC_MOBILEPAY_LINK || "";

  // læs ?pakke= og pakkeinfo fra localStorage (HDK_PAKKER)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const p = url.searchParams.get("pakke") || "";
    setPakke(p);

    try {
      const all = JSON.parse(localStorage.getItem("HDK_PAKKER") || "[]");
      const found = Array.isArray(all)
        ? (all.find((x: any) => clean(x.pakke) === p) as PakkeInfo | undefined)
        : undefined;
      setInfo(found || { pakke: p });
    } catch {
      setInfo({ pakke: p });
    }
  }, []);

  const prisLabel = useMemo(() => {
    return info?.pris_pr_mdr ? `${info.pris_pr_mdr} kr/md (fast pris)` : "";
  }, [info]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!pakke) return setErr("Pakke mangler. Gå tilbage og vælg en pakke.");
    if (!f.navn) return setErr("Udfyld navn.");
    if (!f.email) return setErr("Udfyld e-mail.");

    const payload = {
      // felter vores /api/join + Apps Script forventer
      name: f.navn,
      email: f.email,
      phone: f.telefon,
      address: f.adresse,
      zip_city: f.postnrBy,
      birth_year: f.foedselsaar,
      package_id: pakke,
      notes: f.note,
      level: f.niveau,
      gender: f.koen,
      payment_method: mobilepayLink ? "mobilepay" : "cash",
    };

    setBusy(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });

      // Robust parsing—ingen “Unexpected end of JSON input”
      const text = await res.text().catch(() => "");
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }

      if (!res.ok || !data?.ok) {
        const msg = (data && (data.error || data.message)) || (text || `Serverfejl (HTTP ${res.status})`);
        throw new Error(msg);
      }

      // reference hvis backend sender noget brugbart tilbage
      const ref =
        data?.result?.join_id ||
        data?.result?.row ||
        data?.result?.id ||
        "";
      setRefId(String(ref || ""));

      setOk(true);
    } catch (e: any) {
      setErr(e?.message || "Noget gik galt. Prøv igen.");
    } finally {
      setBusy(false);
    }
  }

  if (ok) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl border border-lime-300 bg-white p-6">
          <div className="text-sm text-emerald-700 mb-2">
            <span className="inline-block h-2 w-2 rounded-full bg-lime-500 mr-2" />
            Tilmelding
          </div>
          <h1 className="text-2xl font-bold">Tak for din indmeldelse</h1>
          <p className="mt-2 text-slate-700">
            Pakke: <span className="font-semibold">{pakke || "—"}</span>
            {prisLabel ? <> · Pris: <span className="font-semibold">{prisLabel}</span></> : null}
            {refId ? <> · Reference: <span className="font-semibold">{refId}</span></> : null}
          </p>

          {mobilepayLink ? (
            <a href={mobilepayLink} className="mt-6 inline-block px-5 py-2 rounded-xl bg-black text-white hover:opacity-90">
              Betal kontingent med MobilePay
            </a>
          ) : (
            <p className="mt-6 text-slate-700">
              Betal i klubben (kontant eller MobilePay i baren). Medbring evt. din reference.
            </p>
          )}

          <div className="mt-6">
            <a href="/bliv-medlem" className="text-emerald-700 underline">Tilbage til medlemsoversigt</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="rounded-2xl border border-lime-300 bg-white p-6">
        <div className="text-sm text-emerald-700 mb-2">
          <span className="inline-block h-2 w-2 rounded-full bg-lime-500 mr-2" />
          Tilmelding
        </div>
        <h1 className="text-3xl font-bold">Pakke: {pakke || "—"}</h1>
        {prisLabel && <div className="text-slate-700 mt-1">Pris: <span className="font-semibold">{prisLabel}</span></div>}
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-700 mb-1">Niveau</label>
          <select className="input" value={f.niveau} onChange={e => setF({ ...f, niveau: e.target.value as Form["niveau"] })}>
            <option>Hygge</option>
            <option>Begynder</option>
            <option>Let øvet</option>
            <option>Øvet</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Køn</label>
          <div className="flex gap-2">
            {(["Mand","Kvinde","Andet"] as const).map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setF({ ...f, koen: k })}
                className={`px-3 py-2 rounded-lg border ${f.koen===k ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-800 border-slate-300"}`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-slate-700 mb-1">Navn</label>
          <input className="input" value={f.navn} onChange={e => setF({ ...f, navn: e.target.value })} placeholder="Dit navn" required />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">E-mail</label>
          <input type="email" className="input" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="din@mail.dk" required />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Telefon (valgfri)</label>
          <input className="input" value={f.telefon} onChange={e => setF({ ...f, telefon: e.target.value })} placeholder="12 34 56 78" />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Fødselsår (valgfri)</label>
          <input className="input" value={f.foedselsaar} onChange={e => setF({ ...f, foedselsaar: e.target.value })} placeholder="1982" />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Adresse (valgfri)</label>
          <input className="input" value={f.adresse} onChange={e => setF({ ...f, adresse: e.target.value })} placeholder="Adresse" />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Postnr/By (valgfri)</label>
          <input className="input" value={f.postnrBy} onChange={e => setF({ ...f, postnrBy: e.target.value })} placeholder="7600 Struer" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-slate-700 mb-1">Bemærkning (valgfri)</label>
          <textarea className="input" rows={4} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} placeholder="Jeg elsker dart!" />
        </div>

        {err && <div className="md:col-span-2 text-red-600 text-sm">{err}</div>}

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={busy} className="px-5 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60">
            {busy ? "Sender…" : "Send indmeldelse"}
          </button>
        </div>
      </form>
    </main>
  );
}
