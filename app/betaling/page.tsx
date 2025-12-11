"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Method = "MobilePay" | "Kontant" | "Bankoverførsel";

type FamilyMember = {
  firstName: string;
  lastName: string;
  birthYear?: string;
  birthDate?: string;
  isPrimary?: boolean;
};

export default function BetalingPage() {
  const router = useRouter();

  const [draft, setDraft] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [method, setMethod] = useState<Method>("MobilePay");
  // Standard: kvartalsvis betaling (4x/år)
  const [paymentsPerYear, setPaymentsPerYear] = useState(4);

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

  // Pris-info: tolker price_amount + price_unit fra MEDLEMSPAKKER
  const priceInfo = useMemo(() => {
    const rawAmount = Number(draft?.price_amount ?? 0);
    const unitRaw = (draft as any)?.price_unit ?? "";
    const unit = String(unitRaw).toLowerCase();

    const amount = Number.isFinite(rawAmount) ? rawAmount : 0;

    // Hvis enheden indeholder "md" eller "måned" → beløbet er pr. måned
    const isMonthly =
      unit.includes("md") ||
      unit.includes("måned");

    const monthly = isMonthly ? amount : amount / 12;
    const yearly = isMonthly ? amount * 12 : amount;

    return {
      monthlyPrice: Math.round(monthly * 100) / 100,
      totalPerYear: Math.round(yearly * 100) / 100,
    };
  }, [draft]);

  const totalPerYear = priceInfo.totalPerYear;
  const monthlyPrice = priceInfo.monthlyPrice;

  // Beløb pr. betaling ud fra valgt frekvens (1x, 2x, 4x pr. år)
  const amountPerPayment = useMemo(() => {
    if (!paymentsPerYear || paymentsPerYear <= 0) return totalPerYear;

    const monthsPerPayment = 12 / paymentsPerYear;
    return Math.round(monthlyPrice * monthsPerPayment * 100) / 100;
  }, [monthlyPrice, paymentsPerYear, totalPerYear]);

  // Udtræk alle medlemmer (primær + familie)
  const allFamilyMembers: FamilyMember[] = useMemo(() => {
    if (!draft) return [];

    const anyDraft = draft as any;

    const primaryYear = String(anyDraft.birth_year ?? "").trim();
    const primaryDate = String(anyDraft.birth_date ?? "").trim();

    const primary: FamilyMember = {
      firstName: String(anyDraft.first_name ?? "").trim(),
      lastName: String(anyDraft.last_name ?? "").trim(),
      birthYear: primaryYear || undefined,
      birthDate: primaryDate || undefined,
      isPrimary: true,
    };

    const list: FamilyMember[] = [primary];

    const fam = Array.isArray(anyDraft.family_members)
      ? anyDraft.family_members
      : [];

    for (const m of fam) {
      const firstName = String(m.first ?? m.first_name ?? "").trim();
      const lastName = String(m.last ?? m.last_name ?? "").trim();
      const birthYear = String(m.year ?? m.birth_year ?? "").trim();
      const birthDate = String(m.birth_date ?? "").trim();

      list.push({
        firstName,
        lastName,
        birthYear: birthYear || undefined,
        birthDate: birthDate || undefined,
      });
    }

    return list.filter((m) => m.firstName || m.lastName || m.birthYear || m.birthDate);
  }, [draft]);

  const householdCount = useMemo(() => {
    const anyDraft = draft as any;
    const raw = Number(anyDraft?.household);
    if (!Number.isNaN(raw) && raw > 0) return raw;
    return allFamilyMembers.length || 1;
  }, [draft, allFamilyMembers]);

  // Pakke-indhold (tekst) hvis vi har noget med fra pakken
  const packageLines: string[] = useMemo(() => {
    if (!draft) return [];
    const anyDraft = draft as any;

    // Forsøg flere mulige felter
    if (Array.isArray(anyDraft.package_lines)) {
      return anyDraft.package_lines
        .map((x: any) => String(x ?? "").trim())
        .filter(Boolean);
    }
    if (Array.isArray(anyDraft.lines)) {
      return anyDraft.lines
        .map((x: any) => String(x ?? "").trim())
        .filter(Boolean);
    }

    const body =
      (anyDraft.package_body ??
        anyDraft.package_description ??
        anyDraft.body ??
        "") as string;

    if (!body) return [];
    return String(body)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [draft]);

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
            `HTTP ${res.status}`,
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

  // Hvis draft mangler helt (fx refresh uden data)
  if (!draft) {
    return (
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="section-title">Ingen tilmelding fundet</h1>
        <p className="mt-3 text-sm text-slate-700">
          Vi kunne ikke finde dine tilmeldingsdata. Start forfra via{" "}
          <button
            type="button"
            onClick={() => router.push("/bliv-medlem")}
            className="underline text-emerald-700"
          >
            Bliv medlem
          </button>
          .
        </p>
      </main>
    );
  }

  /* MAIN VIEW */
  const d: any = draft;

  const levelLabel =
    d.level_title || d.level || d.level_id || d.niveau || "";

  const genderLabel = d.gender || d.køn || "";

  const dduId = d.ddu_id || d.ddu || "";

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
              <div className="font-semibold">{d.package_id}</div>
              {levelLabel && (
                <div className="mt-1 text-xs text-slate-600">
                  Niveau: {levelLabel}
                </div>
              )}
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-slate-500">Månedligt kontingent</div>
              <div className="font-semibold">{monthlyPrice} DKK</div>
              <div className="mt-1 text-xs text-slate-500">
                I alt {totalPerYear} DKK pr. år
              </div>
            </div>
          </div>

          {/* Pakke-indhold */}
          {packageLines.length > 0 && (
            <div className="mt-3 rounded-xl border p-3 text-sm">
              <div className="text-slate-500 text-sm mb-1">
                Hvad pakken indeholder
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {packageLines.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 rounded-xl border p-3 text-sm">
            <div className="text-slate-500 text-sm">Medlem(mer)</div>
            <div className="mt-2 space-y-2">
              {allFamilyMembers.length > 0 ? (
                allFamilyMembers.map((m, idx) => {
                  const birthLabel =
                    m.birthDate || m.birthYear || "";
                  return (
                    <div key={idx}>
                      <div>
                        <span className="font-semibold">
                          {m.firstName} {m.lastName}
                        </span>
                        {m.isPrimary && (
                          <span className="ml-2 text-xs text-emerald-700">
                            (Primær)
                          </span>
                        )}
                      </div>
                      {birthLabel && (
                        <div className="text-xs text-slate-600">
                          Fødselsdato: {birthLabel}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div>—</div>
              )}
            </div>

            <div className="mt-3 grid gap-1 text-xs text-slate-600">
              {(d.email || d.phone) && (
                <div>
                  <span className="font-semibold">Kontakt:</span>
                  {d.email && (
                    <div>
                      E-mail: <span>{d.email}</span>
                    </div>
                  )}
                  {d.phone && (
                    <div>
                      Telefon: <span>{d.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {(d.address || d.zip || d.postnr || d.city || d.by) && (
                <div>
                  <span className="font-semibold">Adresse:&nbsp;</span>
                  <span>
                    {d.address}
                    {(d.zip || d.postnr || d.city || d.by) && ", "}
                    {d.zip || d.postnr} {d.city || d.by}
                  </span>
                </div>
              )}

              {genderLabel && (
                <div>
                  <span className="font-semibold">Køn:&nbsp;</span>
                  <span>{genderLabel}</span>
                </div>
              )}

              {dduId && (
                <div>
                  <span className="font-semibold">DDU ID:&nbsp;</span>
                  <span>{dduId}</span>
                </div>
              )}

              {d.remark && (
                <div>
                  <span className="font-semibold">Bemærkning:&nbsp;</span>
                  <span>{d.remark}</span>
                </div>
              )}

              <div>
                <span className="font-semibold">Husstand:&nbsp;</span>
                <span>{householdCount}</span>
              </div>
            </div>
          </div>
        </section>

        {/* BETALINGSVALG */}
        <aside className="card">
          <div className="kicker">
            <span className="h-2 w-2 rounded-full bg-lime-500" /> Betaling
          </div>
          <h2 className="text-lg font-semibold">Vælg betalingsønsker</h2>

          {/* Metode */}
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
                ),
              )}
            </div>
          </div>

          {/* Frekvens */}
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

            <div className="mt-2 text-xs text-slate-600">
              {paymentsPerYear === 1 && (
                <span>
                  Du betaler hele beløbet én gang: {totalPerYear} DKK om året.
                </span>
              )}
              {paymentsPerYear === 2 && (
                <span>
                  Du betaler {amountPerPayment} DKK to gange om året (hver 6.
                  måned).
                </span>
              )}
              {paymentsPerYear === 4 && (
                <span>
                  Du betaler {amountPerPayment} DKK fire gange om året (ca. hver
                  3. måned).
                </span>
              )}
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
