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

  /* STATE */
  const [draft, setDraft] = useState<any | null>(null);
  const [method, setMethod] = useState<Method>("MobilePay");
  const [freq, setFreq] = useState<"12" | "6" | "4" | "3" | "1">("12");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /* LOAD DRAFT */
  useEffect(() => {
    const t = sessionStorage.getItem("HDK_JOIN_DRAFT");
    const data = t ? JSON.parse(t) : null;
    setDraft(data);
    const hasMp =
      (process.env.NEXT_PUBLIC_MOBILEPAY_LINK || "").trim().length > 0;
    setMethod(hasMp ? "MobilePay" : "Kontant");
  }, []);

  /* PRICES */
  const priceMonth = useMemo(
    () => Number((draft as any)?.price_dkk_per_month || 0),
    [draft]
  );
  const paymentsPerYear = useMemo(() => Number(freq), [freq]);
  const amountPerPayment = useMemo(
    () => priceMonth * (12 / paymentsPerYear),
    [priceMonth, paymentsPerYear]
  );
  const totalPerYear = useMemo(() => priceMonth * 12, [priceMonth]);

  /* FAMILY MEMBERS – primær + ekstra (hovedmedlem + øvrige) */
  const allFamilyMembers = useMemo(() => {
    const anyDraft = draft as any;
    const list: FamilyMember[] = [];
    if (!anyDraft) return list;

    // Hovedmedlem (den der udfylder formularen)
    const primaryFirst = String(anyDraft.first_name ?? "").trim();
    const primaryLast = String(anyDraft.last_name ?? "").trim();
    const primaryYear = String(anyDraft.birth_year ?? "").trim();

    if (primaryFirst || primaryLast || primaryYear) {
      list.push({
        firstName: primaryFirst,
        lastName: primaryLast,
        birthYear: primaryYear,
        isPrimary: true,
      });
    }

    // Øvrige familiemedlemmer fra family_members-listen (fra /bliv-medlem)
    const raw =
      anyDraft.family_members ??
      anyDraft.familyMembers ??
      anyDraft.family ??
      null;

    if (Array.isArray(raw)) {
      const extras = raw
        .map((m: any) => ({
          firstName: String(
            m.first_name ??
              m.firstName ??
              m.first ??
              m.fornavn ??
              ""
          ).trim(),
          lastName: String(
            m.last_name ??
              m.lastName ??
              m.last ??
              m.efternavn ??
              ""
          ).trim(),
          birthYear: String(
            m.birth_year ??
              m.birthYear ??
              m.year ??
              m.foedselsaar ??
              ""
          ).trim(),
        }))
        .filter((m) => m.firstName || m.lastName || m.birthYear);
      list.push(...extras);
    }

    return list;
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
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!res.ok || !data?.ok) {
        throw new Error(
          (data && (data.error || data.message)) ||
            text ||
            `Kunne ikke gemme (HTTP ${res.status})`
        );
      }

      setDone(true);
      sessionStorage.removeItem("HDK_JOIN_DRAFT");
    } catch (e: any) {
      setMsg(e?.message || "Der skete en fejl.");
    } finally {
      setBusy(false);
    }
  }

  /* NO DRAFT */
  if (!draft) {
    return (
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="section-header">
          <div className="kicker">
            <span className="h-2 w-2 rounded-full bg-lime-500" /> Betaling
          </div>
          <h1 className="section-title">Mangler oplysninger</h1>
          <div className="section-underline" />
        </div>
        <p className="text-slate-700">Start forfra på tilmeldingen.</p>
        <div className="mt-4">
          <a className="btn btn-primary" href="/bliv-medlem">
            Tilbage til Bliv medlem
          </a>
        </div>
      </main>
    );
  }

  /* DONE VIEW */
  if (done) {
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
          og vi kontakter dig, når betalingen er registreret.
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
        <h1 className="section-title">Vælg betalingsmetode og frekvens</h1>
        <div className="section-underline" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* OPSUMMERING */}
        <section className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold">Opsummering</h2>

          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border p-3">
              <div className="text-slate-500">Pakke</div>
              <div className="font-semibold">{(draft as any).package_id}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-slate-500">Pris pr. måned</div>
              <div className="font-semibold">{priceMonth} kr</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-slate-500">Samlet pr. år</div>
              <div className="font-semibold">{totalPerYear} kr</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-slate-500">Betalingsfrekvens</div>
              <div className="font-semibold">{paymentsPerYear}× pr. år</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-slate-500">Beløb pr. betaling</div>
              <div className="font-semibold">{amountPerPayment} kr</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-slate-500">Navn</div>
              <div className="font-semibold">
                {(draft as any).first_name} {(draft as any).last_name}
              </div>
            </div>
          </div>

          {/* FAMILIEMEDLEMMER */}
          {allFamilyMembers.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-1">
                Familiemedlemmer ({householdCount})
              </h3>
              <p className="text-xs text-slate-500 mb-1">
                Tjek at alle familiemedlemmer er med – fx 2 voksne + 2 børn
                eller 1 voksen + 1–3 børn, før du bekræfter.
              </p>
              <ul className="list-disc pl-6 text-sm space-y-0.5">
                {allFamilyMembers.map((m, i) => {
                  const name = `${m.firstName} ${m.lastName}`.trim();
                  return (
                    <li key={i}>
                      {name || "Navn mangler"}
                      {m.birthYear && ` — ${m.birthYear}`}
                      {m.isPrimary && " (hovedmedlem)"}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* BETALINGSVALG */}
        <aside className="card">
          <h2 className="text-lg font-semibold">Vælg betaling</h2>

          <label className="block text-sm font-medium mt-3">
            Betalingsmetode
          </label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
          >
            <option>MobilePay</option>
            <option>Kontant</option>
            <option>Bankoverførsel</option>
          </select>

          <label className="block text-sm font-medium mt-4">Frekvens</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={freq}
            onChange={(e) => setFreq(e.target.value as any)}
          >
            <option value="12">12× (månedligt)</option>
            <option value="6">6× (hver 2. måned)</option>
            <option value="4">4× (kvartalsvis)</option>
            <option value="3">3× (hver 4. måned)</option>
            <option value="1">1× (årligt)</option>
          </select>

          <div className="mt-4 rounded-xl border p-3 text-sm">
            <div className="text-slate-500">Du betaler</div>
            <div className="font-semibold">
              {amountPerPayment} kr {paymentsPerYear}× pr. år
            </div>
          </div>

          {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}

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
