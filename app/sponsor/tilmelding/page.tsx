"use client";

import { useState } from "react";

type SponsorForm = {
  firma: string;
  kontakt: string;
  email: string;
  telefon: string;
  kommentar: string;
};

export default function SponsorTilmeldingPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>("");

  const [form, setForm] = useState<SponsorForm>({
    firma: "",
    kontakt: "",
    email: "",
    telefon: "",
    kommentar: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.firma) return setError("Udfyld firmanavn.");
    if (!form.kontakt) return setError("Udfyld kontaktperson.");
    if (!form.email) return setError("Udfyld e-mail.");

    setSending(true);
    try {
      const res = await fetch("/api/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => "Serverfejl"));
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
        <h1 className="text-3xl font-bold mb-2">Tak for din interesse!</h1>
        <p className="text-slate-700">Vi kontakter jer hurtigst muligt for næste skridt.</p>
        <div className="mt-8">
          <a href="/sponsor" className="underline text-emerald-700 hover:text-emerald-800">
            Tilbage til sponsorsiden
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-1">Sponsor-tilmelding</h1>
      <p className="text-slate-700 mb-6">Udfyld oplysningerne herunder, så vender vi tilbage.</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-700 mb-1">Firmanavn</label>
          <input
            value={form.firma}
            onChange={(e) => setForm({ ...form, firma: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            placeholder="Firma A/S"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Kontaktperson</label>
            <input
              value={form.kontakt}
              onChange={(e) => setForm({ ...form, kontakt: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              placeholder="Fornavn Efternavn"
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
              placeholder="kontakt@firma.dk"
              required
            />
          </div>
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
            placeholder="Fx pakkeinteresse, spørgsmål, ønsket kontakt tidspunkt…"
          />
        </div>

        <div className="pt-2">
          <button type="submit" disabled={sending} className="w-full btn btn-primary disabled:opacity-60">
            {sending ? "Sender..." : "Send tilmelding"}
          </button>
        </div>
      </form>
    </main>
  );
}
