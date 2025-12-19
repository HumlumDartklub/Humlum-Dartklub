"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={["rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg", className].join(" ")}>
      {children}
    </section>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-xl font-semibold tracking-tight">{title}</div>
        {subtitle ? <p className="mt-2 opacity-80">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export default function MedlemsLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Hvis du allerede er logget ind, send til medlemszone
    (async () => {
      try {
        const res = await fetch("/api/member/me", { cache: "no-store" });
        if (res.ok) router.push("/portal");
      } catch {
        // ignore
      }
    })();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/member/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setStatus("error");
        setError(data?.error || "Forkert email eller kode.");
        return;
      }

      setStatus("ok");
      router.push("/portal");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Login fejlede.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* [HELP:MEMBERLOGIN:INTRO] START */}
      <SectionCard>
        <SectionHeader icon="🔐" title="Medlemslogin" subtitle="Log ind med din email og din 6-cifrede kode." />
        <p className="mt-4 opacity-80">
          Koden finder du i dine medlemsoplysninger (eller i velkomstmailen, når vi får den helt strammet op).
        </p>
      </SectionCard>
      {/* [HELP:MEMBERLOGIN:INTRO] END */}

      {/* [HELP:MEMBERLOGIN:FORM] START */}
      <SectionCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm opacity-80 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="navn@email.dk"
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 outline-none focus:border-white/30"
              required
            />
          </div>

          <div>
            <label className="block text-sm opacity-80 mb-1">Medlemskode</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              placeholder="6 cifre"
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 outline-none focus:border-white/30"
              required
            />
          </div>

          {status === "error" ? (
            <p className="text-sm text-red-300">
              {error || "Der skete en fejl. Prøv igen."}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold border bg-orange-400 text-black hover:opacity-90 transition disabled:opacity-60"
          >
            {status === "loading" ? "Logger ind…" : "Log ind"}
          </button>
        </form>
      </SectionCard>
      {/* [HELP:MEMBERLOGIN:FORM] END */}

      {/* [HELP:MEMBERLOGIN:CTA] START */}
      <SectionCard>
        <SectionHeader icon="🧾" title="Ikke medlem endnu?" subtitle="Så er det nu vi laver ballade (på den gode måde)." />
        <p className="mt-4 opacity-80">
          Bliv medlem og få din personlige adgangskode.
        </p>
        <a
          href="/bliv-medlem"
          className="mt-3 inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold border bg-white/10 hover:bg-white/15 transition"
        >
          Bliv medlem
        </a>
      </SectionCard>
      {/* [HELP:MEMBERLOGIN:CTA] END */}
    </main>
  );
}
