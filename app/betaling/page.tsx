"use client";

/* [HELP:PAY:IMPORTS] START
 * Pitch: Importer til betalingssiden. Tilføj her hvis du introducerer nye hooks/funktioner.
 * [HELP:PAY:IMPORTS] END */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* [HELP:PAY:TYPES] START
 * Pitch: Typer for betalingsmetoder mv.
 * [HELP:PAY:TYPES] END */
type Method = "MobilePay" | "Kontant" | "Bankoverførsel";

/* [HELP:PAY:COMPONENT] START
 * Pitch: Hovedkomponenten for betalingssiden.
 * [HELP:PAY:COMPONENT] END */
export default function BetalingPage() {
  /* [HELP:PAY:STATE] START
   * Pitch: Side-state. `draft` kommer fra sessionStorage (udfyldt på /bliv-medlem). */
  const router = useRouter();
  const [draft, setDraft] = useState<any|null>(null);
  const [method, setMethod] = useState<Method>("MobilePay");
  const [freq, setFreq] = useState<"12"|"6"|"4"|"3"|"1">("12"); // betalinger pr. år
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [done, setDone] = useState(false);
  /* [HELP:PAY:STATE] END */

  /* [HELP:PAY:DATA:LOAD] START
   * Pitch: Hent udkast fra sessionStorage og vælg default betalingsmetode.
   * [HELP:PAY:ENV:MP_LINK] Hvis NEXT_PUBLIC_MOBILEPAY_LINK ikke er sat, falder vi tilbage til 'Kontant'. */
  useEffect(() => {
    const t = sessionStorage.getItem("HDK_JOIN_DRAFT");
    const data = t ? JSON.parse(t) : null;
    setDraft(data);
    const hasMp = (process.env.NEXT_PUBLIC_MOBILEPAY_LINK || "").trim().length > 0;
    setMethod(hasMp ? "MobilePay" : "Kontant");
  }, []);
  /* [HELP:PAY:DATA:LOAD] END */

  /* [HELP:PAY:COMPUTE] START
   * Pitch: Afl edte beløb og totaler til visning. */
  const priceMonth = useMemo(() => Number(draft?.price_dkk_per_month||0), [draft]); /* [HELP:PAY:COMPUTE:PRICE_MONTH] */
  const paymentsPerYear = useMemo(() => Number(freq), [freq]);                      /* [HELP:PAY:COMPUTE:PAYMENTS_PER_YEAR] */
  const amountPerPayment = useMemo(() => priceMonth * (12 / paymentsPerYear), [priceMonth, paymentsPerYear]); /* [HELP:PAY:COMPUTE:AMOUNT_PER_PAYMENT] */
  const totalPerYear = useMemo(() => priceMonth * 12, [priceMonth]);                /* [HELP:PAY:COMPUTE:TOTAL_PER_YEAR] */
  /* [HELP:PAY:COMPUTE] END */

  /* [HELP:PAY:SUBMIT] START
   * Pitch: Send tilmelding til backend (/api/join). Håndterer success/fejl. */
  async function submit() {
    if (!draft) return;
    setMsg(null);
    setBusy(true);
    try {
      /* [HELP:PAY:SUBMIT:PAYLOAD] START — data vi sender */
      const payload = {
        ...draft,
        payment_method: method.toLowerCase(), // mobilepay/kontant/bankoverførsel
        payment_frequency: paymentsPerYear,
        amount_per_payment: amountPerPayment,
        total_per_year: totalPerYear,
      };
      /* [HELP:PAY:SUBMIT:PAYLOAD] END */

      /* [HELP:PAY:SUBMIT:FETCH] START — POST til API */
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept":"application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: any = null; try { data = JSON.parse(text); } catch {}
      if (!res.ok || !data?.ok) {
        throw new Error((data && (data.error || data.message)) || text || `Kunne ikke gemme (HTTP ${res.status})`);
      }
      /* [HELP:PAY:SUBMIT:FETCH] END */

      /* [HELP:PAY:SUBMIT:SUCCESS] START — ryd udkast og vis tak-side */
      setDone(true);
      sessionStorage.removeItem("HDK_JOIN_DRAFT");
      /* [HELP:PAY:SUBMIT:SUCCESS] END */
    } catch (e: any) {
      /* [HELP:PAY:SUBMIT:ERROR] START — fejlbesked til bruger */
      setMsg(e?.message || "Der skete en fejl.");
      /* [HELP:PAY:SUBMIT:ERROR] END */
    } finally {
      setBusy(false);
    }
  }
  /* [HELP:PAY:SUBMIT] END */

  /* [HELP:PAY:RENDER:NO_DRAFT] START
   * Pitch: Hvis brugeren lander her uden udkast, vis besked og link tilbage. */
  if (!draft) {
    return (
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="section-header">
          <div className="kicker"><span className="h-2 w-2 rounded-full bg-lime-500" /> Betaling</div>
          <h1 className="section-title">Mangler oplysninger</h1>
          <div className="section-underline" />
        </div>
        <p className="text-slate-700">Start forfra på tilmeldingen.</p>
        <div className="mt-4">
          <a className="btn btn-primary" href="/bliv-medlem">Tilbage til Bliv medlem</a>
        </div>
      </main>
    );
  }
  /* [HELP:PAY:RENDER:NO_DRAFT] END */

  /* [HELP:PAY:RENDER:DONE] START
   * Pitch: Vis tak-besked når indsendelse lykkes. */
  if (done) {
    return (
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="section-header">
          <div className="kicker"><span className="h-2 w-2 rounded-full bg-lime-500" /> Tilmelding</div>
          <h1 className="section-title">Tak for din tilmelding!</h1>
          <div className="section-underline" />
        </div>
        <p className="text-slate-700">
          Vi har modtaget din ansøgning til <b>{draft.package_id}</b>. Du får en bekræftelse pr. e-mail, og vi kontakter dig, når betalingen er registreret.
        </p>
      </main>
    );
  }
  /* [HELP:PAY:RENDER:DONE] END */

  /* [HELP:PAY:RENDER:MAIN] START
   * Pitch: Hovedlayout for betaling — header, opsummering, valg og CTA. */
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* [HELP:PAY:HEADER] START — sideheader */}
      <div className="section-header">
        <div className="kicker"><span className="h-2 w-2 rounded-full bg-lime-500" /> Betaling</div>
        <h1 className="section-title">Vælg betalingsmetode og frekvens</h1>
        <div className="section-underline" />
      </div>
      {/* [HELP:PAY:HEADER] END */}

      {/* [HELP:PAY:GRID] START — 2-kolonne layout: opsummering (venstre) + valg (højre) */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* [HELP:PAY:SUMMARY] START — opsummering af valg fra /bliv-medlem */}
        <section className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold">Opsummering</h2>

          {/* [HELP:PAY:SUMMARY:GRID] START — talbokse */}
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border p-3">
              <div className="text-slate-500">Pakke</div>
              <div className="font-semibold">{draft.package_id}</div>
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
              <div className="font-semibold">{draft.first_name} {draft.last_name}</div>
            </div>
          </div>
          {/* [HELP:PAY:SUMMARY:GRID] END */}

          {/* [HELP:PAY:SUMMARY:FAMILY] START — liste over familiemedlemmer (hvis relevant) */}
          {draft.household && Number(draft.household) > 1 && Array.isArray(draft.family_members) && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Familiemedlemmer ({draft.household})</h3>
              <ul className="list-disc pl-6 text-sm">
                {draft.family_members.map((m:any, i:number) => (
                  <li key={i}>{m.first_name} {m.last_name} — {m.birth_year}</li>
                ))}
              </ul>
            </div>
          )}
          {/* [HELP:PAY:SUMMARY:FAMILY] END */}
        </section>
        {/* [HELP:PAY:SUMMARY] END */}

        {/* [HELP:PAY:METHODS] START — valg af metode og frekvens */}
        <aside className="card">
          <h2 className="text-lg font-semibold">Vælg betaling</h2>

          {/* [HELP:PAY:METHODS:SELECT] START — metode */}
          <label className="block text-sm font-medium mt-3">Betalingsmetode</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={method}
            onChange={(e)=>setMethod(e.target.value as Method)}
          >
            <option>MobilePay</option>
            <option>Kontant</option>
            <option>Bankoverførsel</option>
          </select>
          {/* [HELP:PAY:METHODS:SELECT] END */}

          {/* [HELP:PAY:FREQ] START — frekvens */}
          <label className="block text-sm font-medium mt-4">Frekvens</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={freq}
            onChange={(e)=>setFreq(e.target.value as any)}
          >
            <option value="12">12× (månedligt)</option>
            <option value="6">6× (hver 2. måned)</option>
            <option value="4">4× (kvartalsvis)</option>
            <option value="3">3× (hver 4. måned)</option>
            <option value="1">1× (årligt)</option>
          </select>
          {/* [HELP:PAY:FREQ] END */}

          {/* [HELP:PAY:AMOUNT] START — “du betaler” boks */}
          <div className="mt-4 rounded-xl border p-3 text-sm">
            <div className="text-slate-500">Du betaler</div>
            <div className="font-semibold">{amountPerPayment} kr {paymentsPerYear}× pr. år</div>
          </div>
          {/* [HELP:PAY:AMOUNT] END */}

          {/* [HELP:PAY:MSG] START — fejlbesked */}
          {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
          {/* [HELP:PAY:MSG] END */}

          {/* [HELP:PAY:CTA] START — knapper (tilbage / send) */}
          <div className="mt-4 flex gap-2">
            <button onClick={()=>router.push("/bliv-medlem")} className="px-4 py-2 rounded-xl border">
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
          {/* [HELP:PAY:CTA] END */}
        </aside>
        {/* [HELP:PAY:METHODS] END */}
      </div>
      {/* [HELP:PAY:GRID] END */}
    </main>
  );
  /* [HELP:PAY:RENDER:MAIN] END */
}
