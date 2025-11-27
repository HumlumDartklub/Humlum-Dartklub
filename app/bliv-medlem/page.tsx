"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/** ─────────────────────────────────────────────────────────
 *  [HELP:CONFIG] START
 *  Pitch: Konfiguration og grunddata for siden (pakker, niveauer m.m.)
 *  [HELP:CONFIG] END
 *  ───────────────────────────────────────────────────────── */

/** [HELP:TYPES:PLAN] START — datatyper for pakker */
type PlanKey = "passiv" | "basis" | "aktiv" | "premium" | "ungdom" | "familie";
type Plan = {
  key: PlanKey;
  pakke: string;
  audience: string;
  pris_pr_mdr: number;
  features: string[];
  badge?: string;
};
/** [HELP:TYPES:PLAN] END */

/** [HELP:TYPES:SHEETROW] START — generisk række fra MEDLEMSPAKKER */
type SheetRow = { [key: string]: any };
const PLAN_KEYS: PlanKey[] = [
  "passiv",
  "basis",
  "aktiv",
  "premium",
  "ungdom",
  "familie",
];
/** [HELP:TYPES:SHEETROW] END */

/** [HELP:PLANS:DATA] START — fallback-pakke-data (bruges hvis Sheet fejler eller mangler felter) */
const PLANS: Plan[] = [
  {
    key: "passiv",
    pakke: "Passiv",
    audience: "Alle",
    pris_pr_mdr: 39,
    features: [
      "Støt klubben …",
      "Navn på støtteliste",
      "Nyhedsbreve",
      "Invitation til sociale events",
    ],
  },
  {
    key: "basis",
    pakke: "Basis",
    audience: "Voksen",
    pris_pr_mdr: 99,
    features: [
      "Fri træning",
      "Klub adgang",
      "Social events",
      "Facebook gruppe",
    ],
  },
  {
    key: "aktiv",
    pakke: "Aktiv",
    audience: "Voksen",
    pris_pr_mdr: 149,
    features: ["Fri træning", "Klubarrangementer", "Træningsaftener"],
  },
  {
    key: "premium",
    pakke: "Premium",
    audience: "Voksen",
    pris_pr_mdr: 199,
    badge: "Mest valgt",
    features: [
      "110% klubmand",
      "Fri træning",
      "Klubtrøje",
      "Turneringer & events",
    ],
  },
  {
    key: "ungdom",
    pakke: "Ungdom",
    audience: "U/18",
    pris_pr_mdr: 59,
    features: [
      "Ungdomsmedlemskab",
      "Træning",
      "Turneringer",
      "Mentorordning & arrangementer",
    ],
  },
  {
    key: "familie",
    pakke: "Familie",
    audience: "Hele familien",
    pris_pr_mdr: 269,
    features: [
      "Hele husstanden kan spille og deltage",
      "Fri træning for familien",
      "Familieevents",
      "Forældre-barn turneringer",
    ],
  },
];
/** [HELP:PLANS:DATA] END */

const FALLBACK_BY_KEY: Record<PlanKey, Plan> = PLANS.reduce(
  (acc, p) => ({ ...acc, [p.key]: p }),
  {} as Record<PlanKey, Plan>
);

/** [HELP:FORM:LEVELS] START — niveau-labels (ændr teksterne frit) */
const NIVEAUER = ["Hygge", "Øvet", "Turnering"] as const;
/** [HELP:FORM:LEVELS] END */

/** [HELP:FORM:GENDER] START — kønsvalg (ændr/tilføj labels efter behov) */
const KOEN = ["Mand", "Kvinde", "Andet"] as const;
/** [HELP:FORM:GENDER] END */

/** [HELP:FORM:ZIPCITY:DATA] START — Postnr→By mapping + forslag */
const ZIP_TO_CITY: Record<string, string> = {
  "7400": "Herning",
  "7500": "Holstebro",
  "7600": "Struer",
  "7620": "Lemvig",
  "7700": "Thisted",
  "7800": "Skive",
};
const ZIP_SUGGESTIONS = Object.keys(ZIP_TO_CITY);
/** [HELP:FORM:ZIPCITY:DATA] END */

/** [HELP:FORM:FAMILY:TYPE] START — type for ekstra familiemedlemmer */
type FamMember = { first: string; last: string; year: string };
/** [HELP:FORM:FAMILY:TYPE] END */

export default function BlivMedlem() {
  /** [HELP:STATE:PLAN] START — valgt pakke + afledt plan-objekt */
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selectedKey, setSelectedKey] = useState<PlanKey>("basis");
  const plan = useMemo(() => {
    const src = plans && plans.length > 0 ? plans : PLANS;
    const found = src.find((p) => p.key === selectedKey);
    return found ?? src[0];
  }, [plans, selectedKey]);
  /** [HELP:STATE:PLAN] END */

  /** [HELP:STATE:SHEETSYNC] START — hent MEDLEMSPAKKER fra Sheet v3 */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/sheet?tab=MEDLEMSPAKKER", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: any = await res.json();
        const rows: SheetRow[] = Array.isArray(data?.items) ? data.items : [];

        const mapped: { plan: Plan; order: number }[] = [];

        for (const row of rows) {
          const visible = String(row.visible ?? row.Visible ?? "")
            .trim()
            .toUpperCase();
          if (visible && visible !== "YES") continue;

          const rawKey = String(row.package_key ?? row.key ?? "")
            .trim()
            .toLowerCase();
          let key = PLAN_KEYS.find((k) => k === rawKey);

          const titleRaw = String(row.package_title ?? row.title ?? "")
            .trim()
            .toLowerCase();
          if (!key && titleRaw) {
            if (titleRaw.includes("passiv")) key = "passiv";
            else if (titleRaw.includes("basis")) key = "basis";
            else if (titleRaw.includes("aktiv")) key = "aktiv";
            else if (titleRaw.includes("premium")) key = "premium";
            else if (titleRaw.includes("ungdom")) key = "ungdom";
            else if (titleRaw.includes("familie")) key = "familie";
          }

          if (!key) continue;
          const fallback = FALLBACK_BY_KEY[key];

          const pakke = String(
            row.package_title ?? row.title ?? fallback?.pakke ?? key
          ).trim();

          const audience = String(
            row.target ??
              row.audience ??
              row.segment ??
              fallback?.audience ??
              ""
          ).trim();

          const priceRaw =
            row.price_amount ??
            row.price ??
            row.pris_pr_mdr ??
            fallback?.pris_pr_mdr ??
            0;
          let pris_pr_mdr = Number(priceRaw);
          if (!Number.isFinite(pris_pr_mdr) || pris_pr_mdr <= 0) {
            pris_pr_mdr = fallback?.pris_pr_mdr ?? 0;
          }

          const featuresRaw = String(
            row.features ??
              row.feature_list ??
              row.feature_text ??
              row.benefits ??
              ""
          );
          const features =
            featuresRaw.trim().length > 0
              ? featuresRaw
                  .split(/[;,\n,]/)
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              : fallback?.features ?? [];

          const badgeRaw =
            row.badge_label ?? row.ribbon_label ?? fallback?.badge ?? "";
          const badge = String(badgeRaw).trim() || undefined;

          const order = Number(row.order ?? row.sort ?? row.idx ?? 0) || 0;

          mapped.push({
            plan: { key, pakke, audience, pris_pr_mdr, features, badge },
            order,
          });
        }

        if (!mapped.length) {
          if (!cancelled) setPlans(PLANS);
          return;
        }

        const nextPlans = mapped
          .sort((a, b) => a.order - b.order)
          .map((m) => m.plan);

        if (!cancelled) {
          setPlans(nextPlans);
          setSelectedKey((prev) =>
            nextPlans.some((p) => p.key === prev)
              ? prev
              : nextPlans[0]?.key ?? "basis"
          );
        }
      } catch (err) {
        console.error("Kunne ikke hente MEDLEMSPAKKER fra Sheet", err);
        if (!cancelled) setPlans(PLANS);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);
  /** [HELP:STATE:SHEETSYNC] END */

  // [HELP:FORM:STATE] START
  const [niveau, setNiveau] = useState<(typeof NIVEAUER)[number]>("Hygge");
  const [koen, setKoen] = useState<(typeof KOEN)[number]>("Mand");

  const [fornavn, setFornavn] = useState("");
  const [efternavn, setEfternavn] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [adresse, setAdresse] = useState("");
  const [zip, setZip] = useState("");
  const [by, setBy] = useState("");
  const [birth, setBirth] = useState("");
  // [HELP:FORM:STATE] END

  /** [HELP:FORM:NOTE:STATE] START */
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  /** [HELP:FORM:NOTE:STATE] END */

  /** [HELP:FORM:FAMILY:STATE] START */
  const [husstand, setHusstand] = useState<number>(2);
  const [fam, setFam] = useState<FamMember[]>([]);
  /** [HELP:FORM:FAMILY:STATE] END */

  /** [HELP:FORM:CTA:STATE] START */
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  /** [HELP:FORM:CTA:STATE] END */

  /** [HELP:PRICE] START */
  const prisMdr = plan.pris_pr_mdr;
  /** [HELP:PRICE] END */

  /** [HELP:FORM:ZIPCITY:FN] START */
  function onZipChange(v: string) {
    setZip(v);
    if (!v) {
      setBy("");
      return;
    }
    if (ZIP_TO_CITY[v]) setBy(ZIP_TO_CITY[v]);
  }
  /** [HELP:FORM:ZIPCITY:FN] END */

  /** [HELP:FORM:FAMILY:SYNC] START */
  function syncFamCount(target: number) {
    const needed = Math.max(0, target - 1);
    setFam((prev) => {
      const clone = [...prev];
      if (clone.length < needed) {
        while (clone.length < needed)
          clone.push({ first: "", last: "", year: "" });
      } else if (clone.length > needed) {
        clone.length = needed;
      }
      return clone;
    });
  }
  /** [HELP:FORM:FAMILY:SYNC] END */

  /** [HELP:PLAN:SCROLL] START */
  const formRef = useRef<HTMLDivElement>(null);
  function onChoosePlan(key: PlanKey) {
    setSelectedKey(key);
    if (key === "familie") syncFamCount(husstand);
    setTimeout(
      () =>
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      60
    );
  }
  /** [HELP:PLAN:SCROLL] END */

  /** [HELP:FORM:VALIDATION] START */
  const isValid = !!(
    fornavn &&
    efternavn &&
    email &&
    adresse &&
    zip &&
    by &&
    terms
  );
  /** [HELP:FORM:VALIDATION] END */

  /** [HELP:FORM:SUBMIT] START */
  async function goToPayment() {
    setMsg(null);
    if (!fornavn || !efternavn || !email || !adresse || !zip || !by) {
      setMsg("Udfyld venligst alle felter (bemærkning er valgfri).");
      return;
    }
    if (!terms) {
      setMsg("Du skal acceptere Vedtægter og Privatlivspolitik.");
      return;
    }

    const payload = {
      package_id: plan.pakke,
      price_dkk_per_month: prisMdr,
      level: niveau,
      gender: koen,
      first_name: fornavn,
      last_name: efternavn,
      email,
      phone: telefon,
      address: adresse,
      zip,
      city: by,
      birth_year: birth,
      note,
      household: plan.key === "familie" ? husstand : "",
      family_members: fam,
    };
    try {
      sessionStorage.setItem("HDK_JOIN_DRAFT", JSON.stringify(payload));
      setBusy(true);
      window.location.href = "/betaling";
    } finally {
      setBusy(false);
    }
  }
  /** [HELP:FORM:SUBMIT] END */

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* HEADER */}
      <div className="mb-6 rounded-2xl border border-lime-300 bg-white p-4 shadow-sm">
        <div className="inline-flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-lime-500" />
          <span>Tilmelding</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold">
          Bliv medlem i Humlum Dartklub
        </h1>
        <p className="text-sm opacity-70">
          Vælg den pakke der passer til dig. Du kan altid opgradere senere.
        </p>
      </div>

      {/* PLAN-CARDS */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans ? (
          plans.map((p) => (
            <article
              key={p.key}
              className={`relative flex h-full flex-col rounded-2xl border p-4 shadow-sm ${
                p.key === selectedKey
                  ? "border-emerald-400"
                  : "border-lime-300 transition hover:border-emerald-400"
              }`}
            >
              {p.badge && (
                <div className="absolute -right-3 -top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-black shadow">
                  {p.badge}
                </div>
              )}
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-lime-300/60 bg-lime-50 px-3 py-1 text-xs text-black">
                {p.pakke}
              </div>
              <p className="text-sm text-slate-600">{p.audience}</p>
              <p className="mt-1 text-3xl font-extrabold text-emerald-700">
                {p.pris_pr_mdr} kr/md.
              </p>
              <ul className="mt-3 flex-1 list-disc pl-5 text-sm text-gray-700">
                {p.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <div className="mt-auto pt-3">
                <button
                  onClick={() => onChoosePlan(p.key)}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-white hover:opacity-90"
                >
                  Vælg {p.pakke}
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="sm:col-span-2 lg:col-span-3 text-sm text-neutral-600">
            Vi indlæser medlems-pakkerne fra systemet… et øjeblik.
          </div>
        )}
      </section>

      {/* FORM – kun når vi har pakker klar */}
      {plans && (
        <section ref={formRef} className="mt-10">
          <div className="rounded-2xl border border-lime-300 bg-white p-4 shadow-sm">
            <div className="mb-2 inline-flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Tilmelding</span>
            </div>
            <h2 className="text-2xl font-extrabold">Pakke: {plan.pakke}</h2>
            <p className="text-sm opacity-70">
              Pris: <b>{prisMdr} kr/md</b> (fast pris
              {plan.key === "familie" ? " for hele husstanden" : ""}).
            </p>

            {/* Niveau / køn / husstand */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Niveau</label>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={niveau}
                  onChange={(e) => setNiveau(e.target.value as any)}
                >
                  {NIVEAUER.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Køn</label>
                <div className="mt-1 inline-flex gap-2">
                  {KOEN.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKoen(k)}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        koen === k
                          ? "bg-emerald-600 text-white"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                  {plan.key === "familie" && (
                    <div className="ml-2">
                      <label className="sr-only">Husstand</label>
                      <select
                        className="rounded-xl border px-3 py-2 text-sm"
                        value={husstand}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          setHusstand(n);
                          syncFamCount(n);
                        }}
                        title="Antal i husstanden"
                      >
                        {[2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n} personer
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div aria-hidden />
            </div>

            {/* Navn + fødselsår */}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Fornavn</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={fornavn}
                  onChange={(e) => setFornavn(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Efternavn</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={efternavn}
                  onChange={(e) => setEfternavn(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Fødselsår</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="YYYY"
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                />
              </div>
            </div>

            {/* Email / telefon */}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">E-mail</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefon</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="mt-3">
              <label className="text-sm font-medium">Adresse</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
              />
            </div>

            {/* Postnr / by */}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Postnr</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  list="zip-suggestions"
                  value={zip}
                  onChange={(e) =>
                    onZipChange(
                      e.target.value.replace(/\D/g, "").slice(0, 4)
                    )
                  }
                  placeholder="f.eks. 7600"
                />
                <datalist id="zip-suggestions">
                  {ZIP_SUGGESTIONS.map((z) => (
                    <option key={z} value={z}>
                      {z} {ZIP_TO_CITY[z]}
                    </option>
                  ))}
                </datalist>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">By</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={by}
                  onChange={(e) => setBy(e.target.value)}
                />
              </div>
            </div>

            {/* Bemærkning */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setNoteOpen((v) => !v)}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                aria-expanded={noteOpen}
              >
                Bemærkning (valgfri)
              </button>
              {noteOpen && (
                <div className="mt-2">
                  <label className="sr-only">Bemærkning (valgfri)</label>
                  <textarea
                    className="w-full rounded-xl border px-3 py-2"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Familie-udvidelse */}
            {plan.key === "familie" && fam.length > 0 && (
              <div className="mt-6 rounded-2xl border border-lime-300 bg-white p-4">
                <div className="mb-3 font-semibold">
                  Ekstra familiemedlemmer
                </div>
                <div className="grid gap-3">
                  {fam.map((m, idx) => (
                    <div key={idx} className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium">
                          Fornavn #{idx + 2}
                        </label>
                        <input
                          className="mt-1 w-full rounded-xl border px-3 py-2"
                          value={m.first}
                          onChange={(e) =>
                            setFam((cur) =>
                              cur.map((x, i) =>
                                i === idx
                                  ? { ...x, first: e.target.value }
                                  : x
                              )
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Efternavn
                        </label>
                        <input
                          className="mt-1 w-full rounded-xl border px-3 py-2"
                          value={m.last}
                          onChange={(e) =>
                            setFam((cur) =>
                              cur.map((x, i) =>
                                i === idx
                                  ? { ...x, last: e.target.value }
                                  : x
                              )
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Fødselsår
                        </label>
                        <input
                          className="mt-1 w-full rounded-xl border px-3 py-2"
                          placeholder="YYYY"
                          value={m.year}
                          onChange={(e) =>
                            setFam((cur) =>
                              cur.map((x, i) =>
                                i === idx
                                  ? { ...x, year: e.target.value }
                                  : x
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accept + CTA */}
            <div className="mt-2 grid items-center gap-3 sm:grid-cols-[auto,1fr,auto]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                />
                <span className="text-sm">
                  Jeg har læst og accepterer{" "}
                  <Link
                    href="/docs/vedtaegter.pdf"
                    className="underline"
                    target="_blank"
                  >
                    Vedtægter
                  </Link>{" "}
                  og{" "}
                  <Link href="/privatliv" className="underline" target="_blank">
                    Privatlivspolitik
                  </Link>
                  .
                </span>
              </label>
              <div aria-hidden />
              <div className="flex justify-end">
                <button
                  onClick={goToPayment}
                  disabled={busy}
                  className={`rounded-xl px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 ${
                    isValid ? "bg-emerald-600" : "bg-black"
                  }`}
                >
                  {busy ? "Sender…" : "Fortsæt til betaling"}
                </button>
              </div>
            </div>

            {msg && (
              <p
                className={`mt-3 text-sm ${
                  msg.startsWith("Udfyld") || msg.startsWith("Du skal")
                    ? "text-red-600"
                    : "text-emerald-700"
                }`}
              >
                {msg}
              </p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
