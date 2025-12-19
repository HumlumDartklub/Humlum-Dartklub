"use client";

import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = code.trim();
    if (!trimmed) {
      setError("Indtast login-kode.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Forkert kode.");
        return;
      }

      // Success → videre til admin-dashboard
      window.location.href = "/admin";
    } catch (err) {
      setError("Kunne ikke logge ind. Tjek din forbindelse og prøv igen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-8">
      <form
        onSubmit={onSubmit}
        className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-semibold">Bestyrelseslogin</h1>
        <p className="mb-4 text-sm text-neutral-600">
          Denne adgang er kun for bestyrelsen. Kontakt formanden, hvis du
          mangler login-koden.
        </p>

        <label className="mb-1 block text-sm font-medium">Login-kode</label>
        <input
          type="password"
          className="mb-2 w-full rounded-xl border px-3 py-2 text-sm"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
        />

        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 w-full rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Logger ind…" : "Log ind"}
        </button>
      </form>
    </main>
  );
}
