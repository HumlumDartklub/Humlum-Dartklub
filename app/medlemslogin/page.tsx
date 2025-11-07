"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Når du vil gå live, bruger vi din config:
// import { HUMLUM_API, HUMLUM_TOKEN } from "../config";

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={["rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg", className].join(" ")}>
      {children}
    </section>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/40 bg-white/5 px-3 py-1 text-xs">
        <span className="h-2 w-2 rounded-full bg-lime-400" /> {icon} {title.toUpperCase()}
      </div>
      {subtitle ? <p className="mt-3 opacity-80">{subtitle}</p> : null}
    </div>
  );
}

export default function MedlemsLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  // Auto-redirect når login er ok
  useEffect(() => {
    if (status === "ok") {
      const t = setTimeout(() => router.push("/medlemszone"), 250); // lille delay for bedre UX
      return () => clearTimeout(t);
    }
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    // PLADSHOLDER-LOGIK: kode "1234" = OK
    setTimeout(() => {
      if (code.trim() === "1234") {
        localStorage.setItem("member_access", "1");
        setStatus("ok");
      } else {
        setStatus("error");
      }
    }, 300);

    /* LIVE (når du siger GO):
    try {
      const res = await fetch(HUMLUM_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verifyCode", code, token: HUMLUM_TOKEN })
      });
      const json = await res.json();
      if (json?.ok) {
        localStorage.setItem("member_access", "1");
        setStatus("ok");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
    */
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <SectionCard>
        <SectionHeader icon="🔐" title="Medlemslogin" subtitle="Få adgang til interne materialer, træningsprogram og notater." />
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Adgangskode"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:ring-2 focus:ring-lime-300/60"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-xl px-4 py-2 font-semibold border bg-lime-400 text-black hover:opacity-90 transition disabled:opacity-60"
          >
            {status === "loading" ? "Logger ind…" : "Log ind"}
          </button>
        </form>

        {status === "ok" && (
          <p className="mt-3 text-sm text-green-400">
            Adgang godkendt. Sender dig videre til Medlemszonen…
          </p>
        )}
        {status === "error" && (
          <p className="mt-3 text-sm text-red-400">Forkert kode. Prøv igen.</p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <h3 className="font-semibold">Hvad får jeg adgang til?</h3>
            <ul className="mt-2 list-disc pl-5 opacity-90">
              <li>Træningsprogram og øvelsesark</li>
              <li>Interne dokumenter og noter</li>
              <li>Planlagte hold og tider</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <h3 className="font-semibold">Ingen kode endnu?</h3>
            <p className="mt-2 opacity-90">
              Bliv medlem og få din personlige adgangskode.
            </p>
            <a
              href="/bliv-medlem"
              className="mt-3 inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold border bg-lime-400 text-black hover:opacity-90 transition"
            >
              Bliv medlem
            </a>
          </div>
        </div>
      </SectionCard>
    </main>
  );
}
