"use client";

import { useEffect, useState } from "react";

type FormState = {
  pakke: string;
  navn: string;
  email: string;
  telefon: string;
  kommentar: string;
  accepteret: boolean;
};

type PakkeInfo = {
  pakke?: string;
  pris_pr_mdr?: string;
  features?: string;
  badge?: string;
};

function safeClean(v: any) { return String(v ?? "").trim(); }

export default function BlivMedlemFormularPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>("");
  const [kvitteringsRef, setKvitteringsRef] = useState<string>("");

  const [form, setForm] = useState<FormState>({
    pakke: "",
    navn: "",
    email: "",
    telefon: "",
    kommentar: "",
    accepteret: false,
  });

  const [info, setInfo] = useState<PakkeInfo | null>(null);

  // Hvis du har et deeplink til MobilePay, sæt det i .env.local som NEXT_PUBLIC_MOBILEPAY_LINK
  const mobilepay = process.env.NEXT_PUBLIC_MOBILEPAY_LINK || "";

  // Læs ?pakke= og slå pris+features op fra localStorage (HDK_PAKKER)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const u = new URL(window.location.href);
    const pakke = u.searchParams.get("pakke") || "";
    setForm((f) => ({ ...f, pakke }));

    try {
      const all = JSON.parse(localStorage.getItem("HDK_PAKKER") || "[]");
      const found = Array.isArray(all)
        ? (all.find((x: any) => safeClean(x.pakke) === pakke) as PakkeInfo | undefined)
        : undefined;
      setInfo(found || null);
    } catch {
      setInfo(null);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.pakke) return setError("Pakke mangler. Gå tilbage og vælg en pakke.");
    if (!form.navn) return setError("Udfyld navn.");
    if (!form.email) return setError("Udfyld e-mail.");
    if (!form.accepteret) return setError("Du skal acceptere klubbens vedtægter.");

    // Backend forventer disse felter (matcher /api/join + Apps Script)
    const payload = {
      name: form.navn,
      email: form.email,
      phone: form.telefon,
      package_id: form.pakke,
      notes: form.kommentar,
      accepted_rules: form.accepteret,
      payment_method: mobilepay ? "mobilepay" : "cash", // kan ændres senere
    };

    setSending(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });

      // ROBUST PARSING — ingen Unexpected end of JSON input
      const text = await res.text().catch(() => "");
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }

      if (!res.ok || !data?.ok) {
        const msg = (data && (data.error || data.message)) || (text || `Serverfejl (HTTP ${res.status})`);
        throw new Error(msg);
      }

      // Forsøg at hente en reference/row fra backend (hvis udsendt)
      const ref =
        data?.result?.join_id ||
        data?.result?.row ||
        data?.result?.id ||
        "";
      setKvitteringsRef(String(ref || ""));

      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Noget gik galt. Prøv igen.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-2 text-[var(--fg)]">Tak for din tilmelding!</h1>
        <p className="text-slate-700">
          Vi har modtaget din ansøgning til <span className="font-semibold">{form.pakke}</span>.
          {kvitteringsRef ? <> Din reference: <span className="font-semibold">{kvitteringsRef}</span>.</> : null}
        </p>

        {mobilepay ? (
          <a href={mobilepay} className="mt-6 inline-block btn btn-primary">
            Betal kontingent med MobilePay
          </a>
        ) : (
          <p className="mt-6 text-slate-700">
            Betal i klubben (kontant eller via MobilePay i baren). Medbring evt. din reference.
          </p>
        )}

        <div className="mt-8">
          <a href="/bliv-medlem" className="underline text-emerald-700 hover:text-emerald-800">
            Tilbage til medlemsoversigt
          </a>
        </div>
      </main>
    );
  }

  const featuresArr =
    info?.features
      ? safeClean(info.features).split(/[;,]/).map((s) => safeClean(s)).filter(Boolean)
      : [];

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-1 text-[var(--fg)]">Bliv medlem</h1>

      {/* Pakke opsummering */}
      <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-600">Du har valgt pakken:</div>
          {info?.badge && (
            <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {info.badge}
            </span>
          )}
        </div>

        <div className="text-xl font-bold text-emerald-700">{form.pakke || "—"}</div>

        <div className="mt-2 text-slate-700">
          <span className="font-semibold">Pris:</span>{" "}
          {info?.pris_pr_mdr ? `${info.pris_pr_mdr} kr/md.` : "—"}
        </div>

        {featuresArr.length > 0 && (
          <ul className="mt-2 text-sm text-slate-700 space-y-1">
            {featuresArr.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-emerald-600 text-lg">•</span>
                {f}
              </li>
            ))}
          </ul>
        )}

        <a href="/bliv-medlem" className="inline-block mt-3 text-xs underline text-emerald-700 hover:text-emerald-800">
          Tilbage til medlemsoversigt
        </a>
      </div>

      <p className="text-slate-700 mb-6">Udfyld formularen. Vi vender tilbage hurtigst muligt.</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-700 mb-1">Pakke</label>
          <input
            value={form.pakke}
            readOnly
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            placeholder="Pakke"
            required
            title="Pakke vælges på forrige side"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Navn</label>
          <input
            value={form.navn}
            onChange={(e) => setForm({ ...form, navn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            placeholder="Dit navn"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            placeholder="din@mail.dk"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Telefon</label>
          <input
            value={form.telefon}
            onChange={(e) => setForm({ ...form, telefon: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            placeholder="12 34 56 78"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Kommentar</label>
          <textarea
            value={form.kommentar}
            onChange={(e) => setForm({ ...form, kommentar: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            rows={4}
            placeholder="Evt. spørgsmål eller ønsker"
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.accepteret}
            onChange={(e) => setForm({ ...form, accepteret: e.target.checked })}
            className="mt-1"
          />
          <span>Jeg accepterer klubbens vedtægter.</span>
        </label>

        <div className="pt-2">
          <button type="submit" disabled={sending} className="w-full btn btn-primary disabled:opacity-60">
            {sending ? "Sender..." : "Bliv medlem af Humlum Dartklub"}
          </button>
        </div>
      </form>
    </main>
  );
}
