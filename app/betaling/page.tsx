"use client";

/* [HELP:PAY:IMPORTS] START */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
/* [HELP:PAY:IMPORTS] END */

type Method = "MobilePay" | "Kontant" | "Bankoverførsel";

type FamilyMember = {
  firstName: string;
  lastName: string;
  birthYear: string;
  isPrimary?: boolean;
};

export default function BetalingPage() {
  const router = useRouter();

  const [draft, setDraft] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [method, setMethod] = useState<Method>("MobilePay");
  const [paymentsPerYear, setPaymentsPerYear] = useState(1);

  useEffect(() => {
    const raw = sessionStorage.getItem("HDK_JOIN_DRAFT");
    if (!raw) {
      setDraft(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setDraft(parsed || null);
    } catch {
      setDraft(null);
    }
  }, []);

  const totalPerYear = useMemo(() => {
    const amount = Number(draft?.price_amount ?? 0);
    return Number.isFinite(amount) ? amount : 0;
  }, [draft]);

  const amountPerPayment = useMemo(() => {
    if (!paymentsPerYear || paymentsPerYear <= 0) return totalPerYear;
    return Math.round((totalPerYear / paymentsPerYear) * 100) / 100;
  }, [totalPerYear, paymentsPerYear]);

  const allFamilyMembers: FamilyMember[] = useMemo(() => {
    if (!draft) return [];

    const anyDraft = draft as any;

    const primaryYear = String(anyDraft.birth_year ?? "").trim();
    const primary = {
      firstName: String(anyDraft.first_name ?? "").trim(),
      lastName: String(anyDraft.last_name ?? "").trim(),
      birthYear: primaryYear,
      isPrimary: true,
    } as FamilyMember;

    const list: FamilyMember[] = [primary];

    const fam = Array.isArray(anyDraft.family_members)
      ? anyDraft.family_members
      : [];

    for (const m of fam) {
      const firstName = String(m.first ?? m.first_name ?? "").trim();
      const lastName = String(m.last ?? m.last_name ?? "").trim();
      const birthYear = String(m.year ?? m.birth_year ?? "").trim();

      list.push({ firstName, lastName, birthYear });
    }

    return list.filter((m) => m.firstName || m.lastName || m.birthYear);
  }, [draft]);

  const householdCount = useMemo(() => {
    const anyDraft = draft as any;
    const raw = Number(anyDraft?.household);
    if (!Number.isNaN(raw) && raw > 0) return raw;
    return allFamilyMembers.length || 1;
  }, [draft, allFamilyMembers]);

  /* SUBMIT */
  async function submit() {
    if (!draft) return;
    setMsg(null);
    setBusy(true);

    try {
      const payload = {
        ...(draft as any),
        payment_method: method.toLowerCase(),
        payment_frequency: paymentsPerYear,
        amount_per_payment: amountPerPayment,
        total_per_year: totalPerYear,
      };

      const res = await fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok || !data?.ok) {
        throw new Error(
          (data && (data.error || data.message)) ||
            text ||
            `HTTP ${res.status}`
        );
      }

      sessionStorage.removeItem("HDK_JOIN_DRAFT");
      setDone(true);
    } catch (err: any) {
      setMsg(err?.message || "Der opstod en fejl. Prøv igen.");
    } finally {
      setBusy(false);
    }
  }

  // SUCCESS VIEW
  if (done && draft) {
    return (
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="section-header">
          <div className="kicker">
            <span className="h-2 w-2 rounded-full bg-lime-500" /> Tilmelding
          </div>
        </div>
        <h1 className="section-title">Tak for din tilmelding!</h1>
        <div className="section-underline" />
        <p className="text-slate-700 mt-4">
          Vi har modtaget din ansøgning til{" "}
          <b>{(draft as any).package_id}</b>. Du får en bekræftelse pr. e-mail,
          og vi kontakter dig om den praktiske betaling i klubben.
        </p>
      </main>
    );
  }

  /* MAIN VIEW */
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* HEADER */}
      <div className="section-header">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-lime-500" /> Betaling
        </div>
        <h1 className="section-title">
          Oplys ønsket betalingsmetode og frekvens
        </h1>
        <div className="section-underline" />
        <p className="mt-2 text-sm text-slate-700">
          Kontingent og indbetaling håndteres i klubben. Her angiver du blot
          dine ønsker, så vi kan registrere din tilmelding korrekt.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* OPSUMMERING */}
        <section className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold">Opsummering</h2>

          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border p-3">
              <div className="text-slate-500">Pakke</div>
              <div className="font-semibold">{(draft as any)?.package_id}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-slate-500">Årligt kontingent</div>
              <div className="font-semibold">{totalPerYear} DKK</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border p-3">
            <div className="text-slate-500 text-sm">Medlem(mer)</div>
            <div className="mt-2 space-y-1 text-sm">
              {allFamilyMembers.length > 0 ? (
                allFamilyMembers.map((m, idx) => (
                  <div key={idx}>
                    <span className="font-semibold">
                      {m.firstName} {m.lastName}
                    </span>
                    {m.birthYear && ` — ${m.birthYear}`}
                    {m.isPrimary && (
                      <span className="ml-2 text-xs text-emerald-700">
                        (Primær)
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div>—</div>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Husstand: {householdCount}
            </div>
          </div>
        </section>

        {/* BETALINGSVALG */}
        <aside className="card">
          <div className="kicker">
            <span className="h-2 w-2 rounded-full bg-lime-500" /> Betaling
          </div>
          <h2 className="text-lg font-semibold">
            Vælg betalingsønsker
          </h2>

          <div className="mt-3 rounded-xl border p-3">
            <div className="text-slate-500">Betalingsmetode</div>
            <div className="mt-2 flex flex-col gap-2">
              {(["MobilePay", "Kontant", "Bankoverførsel"] as Method[]).map(
                (m) => (
                  <label
                    key={m}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="method"
                      checked={method === m}
                      onChange={() => setMethod(m)}
                    />
                    <span>{m}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <div className="mt-3 rounded-xl border p-3">
            <div className="text-slate-500">Betalingsfrekvens</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[1, 2, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPaymentsPerYear(n)}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                    paymentsPerYear === n
                      ? "border-emerald-500 bg-emerald-50"
                      : "hover:border-emerald-300"
                  }`}
                >
                  {n}x / år
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="text-slate-500">Beløb pr. betaling</div>
                <div className="font-semibold">{amountPerPayment} DKK</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-slate-500">Årligt kontingent</div>
                <div className="font-semibold">{totalPerYear} DKK</div>
              </div>
            </div>
          </div>

          {msg && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {msg}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => router.push("/bliv-medlem")}
              className="px-4 py-2 rounded-xl border"
            >
              Tilbage
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="ml-auto px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Sender…" : "Bekræft og send"}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
