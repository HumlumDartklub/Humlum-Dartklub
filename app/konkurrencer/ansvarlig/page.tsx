"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type LoginRes = {
  ok: boolean;
  error?: string;
  event?: {
    title: string;
    subtitle: string;
    period_text: string;
  };
};

/* [HELP:KONKURRENCER:ANSVARLIG:PAGE] START */
// [HELP:KONKURRER_ANSVARLIG_PAGE] START

export default function AnsvarligLoginPage() {
  const router = useRouter();
  const [eventCode, setEventCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const code = eventCode.trim().toUpperCase();
    if (!code) {
      setErr("Skriv eventcode.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/konkurrencer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_code: code }),
      });
      const json = (await res.json().catch(() => ({}))) as LoginRes;

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Login fejlede");
      }

      router.push("/konkurrencer/scorekeeper");
    } catch (e: any) {
      setErr(e?.message || "Login fejlede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-slate-900">Ansvarlig login</h1>

        <Link href="/konkurrencer" className="text-sm font-semibold text-slate-700 hover:underline">
          Tilbage
        </Link>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Dette er kun til den ansvarlige ved banen (tablet/mobil). Spillere skal ikke selv taste.
      </p>

      <form onSubmit={onSubmit} className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-xs font-semibold text-slate-600">Eventcode</div>
        <input
          value={eventCode}
          onChange={(e) => setEventCode(e.target.value)}
          placeholder="EVENTCODE"
          className="mt-2 w-full rounded-xl border px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <div className="mt-2 text-xs text-slate-500">Eventcode udleveres ved banen. Ingen spiller-self-entry.</div>

        {err && <div className="mt-3 text-sm text-orange-700">{err}</div>}

        <button
          type="submit"
          disabled={loading}
          className={
            "mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white " +
            (loading ? "bg-slate-300" : "bg-slate-900 hover:opacity-90")
          }
        >
          {loading ? "Logger ind…" : "Log ind"}
        </button>

        <div className="mt-3 text-xs text-slate-500">
          Tip: Gem denne side som genvej på tabletten.
        </div>
      </form>
    </main>
  );
}
/* [HELP:KONKURRENCER:ANSVARLIG:PAGE] END */


// [HELP:KONKURRER_ANSVARLIG_PAGE] END
