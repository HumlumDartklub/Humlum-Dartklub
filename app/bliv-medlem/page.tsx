"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/** [HELP:CONFIG] START */
const TAB = "MEDLEMSPAKKER";
const LIMIT = 200;

const KOEN = ["Mand", "Kvinde", "Andet"] as const;
const NIVEAUER = ["Hygge", "Turnering"] as const;

const ZIP_CITY: Record<string, string> = {
  "7600": "Struer",
  "7400": "Herning",
  "7500": "Holstebro",
  "7700": "Thisted",
  "7800": "Skive",
  "7620": "Lemvig",
};

const ZIP_SUGGEST = Object.keys(ZIP_CITY);
/** [HELP:CONFIG] END */

/** [HELP:TYPES:PLAN] START */
type Plan = {
  key: string;
  title: string;
  subtitle?: string;
  price_amount: number;
  price_unit?: string;
  features?: string[];
  badge?: string;
  order?: number;
  visible?: boolean;
};
/** [HELP:TYPES:PLAN] END */

type SheetRow = Record<string, any>;

/** [HELP:FORM:FAMILY:TYPE] START */
type FamMember = { first: string; last: string; birth_date: string };
/** [HELP:FORM:FAMILY:TYPE] END */

function parseVisible(raw: any) {
  if (raw === undefined || raw === null) return true;
  const s = String(raw).trim();
  if (!s) return true;
  const v = s.toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "ja";
}

/** [HELP:BIRTH:UTILS] START */
function formatBirthDisplay(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

function deriveYearFromDisplay(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length < 4) return "";
  return digits.slice(-4);
}

function displayToIso(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 8) return "";
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4);
  return `${yyyy}-${mm}-${dd}`;
}
/** [HELP:BIRTH:UTILS] END */

export default function BlivMedlemPage() {
  /** [HELP:STATE:PLAN] START */
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const scrollToFormRef = useRef<HTMLDivElement | null>(null);
  /** [HELP:STATE:PLAN] END */

  /** [HELP:STATE:SHEETSYNC] START */
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch(`/api/sheet?tab=${TAB}&limit=${LIMIT}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);

        const items: SheetRow[] = data?.items || [];

        const mapped: Plan[] = items
          .map((r) => {
            const key = String(
              r.package_key ?? r.key ?? r.id ?? ""
            ).trim();

            const title = String(
              r.package_title ?? r.title ?? r.name ?? ""
            ).trim();

            const subtitle = String(r.subtitle ?? "").trim() || undefined;

            const price_amount = Number(r.price_amount ?? r.price ?? 0);
            const price_unit = String(r.price_unit ?? "DKK/år").trim();

            const features =
              Array.isArray(r.features)
                ? r.features
                : String(r.features ?? "")
                    .split("\n")
                    .map((x) => x.trim())
                    .filter(Boolean);

            const badge = String(r.badge ?? "").trim() || undefined;
            const order = Number(r.order ?? 999);

            const visibleRaw = r.visible ?? r.synlig ?? r.is_visible;
            const visible = parseVisible(visibleRaw);

            return {
              key,
              title,
              subtitle,
              price_amount,
              price_unit,
              features,
              badge,
              order,
              visible,
            };
          })
          .filter((p) => p.key && p.title);

        mapped.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        const visiblePlans = mapped.filter((p) => p.visible !== false);

        if (alive) {
          setPlans(visiblePlans);
          if (!selectedKey && visiblePlans[0]?.key) {
            setSelectedKey(visiblePlans[0].key);
          }
        }
      } catch {
        if (alive) setPlans([]);
      }
    }

    load();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /** [HELP:STATE:SHEETSYNC] END */

  /** [HELP:PRICE] START */
  const selectedPlan = useMemo(() => {
    return (plans || []).find((p) => p.key === selectedKey) || null;
  }, [plans, selectedKey]);
  /** [HELP:PRICE] END */

  /** [HELP:PLAN:SCROLL] START */
  function onSelectPlan(key: string) {
    setSelectedKey(key);
    requestAnimationFrame(() => {
      scrollToFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }
  /** [HELP:PLAN:SCROLL] END */

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

  // Fødselsdato vises som dd-mm-åååå (mobil-venligt)
  const [birthDate, setBirthDate] = useState("");
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

  /** [HELP:FORM:ZIPCITY:DATA] START */
  const citySuggestion = useMemo(() => {
    const z = zip.trim();
    if (!z) return "";
    return ZIP_CITY[z] || "";
  }, [zip]);
  /** [HELP:FORM:ZIPCITY:DATA] END */

  /** [HELP:FORM:ZIPCITY:FN] START */
  useEffect(() => {
    if (citySuggestion && !by) {
      setBy(citySuggestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySuggestion]);
  /** [HELP:FORM:ZIPCITY:FN] END */

  /** [HELP:FORM:LEVELS] START */
  const levelOptions = NIVEAUER;
  /** [HELP:FORM:LEVELS] END */

  /** [HELP:FORM:FAMILY:SYNC] START */
  useEffect(() => {
    if (!selectedPlan || selectedPlan.key !== "familie") {
      setFam([]);
      return;
    }

    const count = Math.max(2, Number(husstand) || 2);
    setFam((prev) => {
      const next = [...prev];
      while (next.length < count - 1)
        next.push({ first: "", last: "", birth_date: "" });
      while (next.length > count - 1) next.pop();
      return next;
    });
  }, [husstand, selectedPlan]);
  /** [HELP:FORM:FAMILY:SYNC] END */

  /** [HELP:FORM:VALIDATION] START */
  const isValid = !!(
    fornavn &&
    efternavn &&
    email &&
    adresse &&
    zip &&
    by &&
    birthDate &&
    terms
  );
  /** [HELP:FORM:VALIDATION] END */

  /** [HELP:FORM:SUBMIT] START */
  async function goToPayment() {
    setMsg(null);

    if (
      !fornavn ||
      !efternavn ||
      !email ||
      !adresse ||
      !zip ||
      !by ||
      !birthDate
    ) {
      setMsg("Udfyld venligst alle felter (bemærkning er valgfri).");
      return;
    }

    if (!selectedPlan) {
      setMsg("Vælg venligst en medlemsform.");
      return;
    }

    const birthYear = deriveYearFromDisplay(birthDate);
    const birthIso = displayToIso(birthDate);

    const payload = {
      package_id: selectedPlan.title,
      package_key: selectedPlan.key,
      price_amount: selectedPlan.price_amount,
      price_unit: selectedPlan.price_unit || "DKK/år",
      level: niveau,
      gender: koen,
      first_name: fornavn,
      last_name: efternavn,
      email,
      phone: telefon,
      address: adresse,
      zip,
      city: by,

      birth_date: birthIso || birthDate,
      birth_year: birthYear,

      remark: note,
      household: selectedPlan.key === "familie" ? husstand : "",
      family_members: fam.map((m) => {
        const year = m.birth_date ? m.birth_date.slice(0, 4) : "";
        return {
          ...m,
          birth_year: year,
          year,
        };
      }),
      source: "website",
      source_form_version: "v3",
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
          <span>Medlemskab</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
          Bliv medlem af Humlum Dartklub
        </h1>
        <p className="mt-2 text-sm text-slate-700">
          Vælg den pakke, der matcher dig. Kontingent og indbetaling håndteres i
          klubben, når vi bekræfter din indmelding.
        </p>
      </div>

      {/* PLAN-CARDS */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans ? (
          plans.length > 0 ? (
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

                <div className="flex-1">
                  <h2 className="text-lg font-bold">{p.title}</h2>
                  {p.subtitle && (
                    <div className="mt-1 text-sm text-slate-600">
                      {p.subtitle}
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="text-3xl font-extrabold">
                      {p.price_amount}{" "}
                      <span className="text-sm font-semibold text-slate-500">
                        {p.price_unit || "DKK/år"}
                      </span>
                    </div>
                  </div>

                  {p.features && p.features.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-slate-700">
                      {p.features.map((f, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => onSelectPlan(p.key)}
                    className={`w-full rounded-xl px-4 py-2 text-sm font-semibold ${
                      p.key === selectedKey
                        ? "bg-emerald-600 text-white"
                        : "border border-lime-300 bg-white hover:border-emerald-400"
                    }`}
                  >
                    {p.key === selectedKey ? "Valgt" : "Vælg denne pakke"}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-lime-300 bg-white p-4">
              Ingen medlemsformer fundet i arket endnu.
            </div>
          )
        ) : (
          <div className="col-span-full rounded-2xl border border-lime-300 bg-white p-4">
            Henter medlemsformer…
          </div>
        )}
      </section>

      {/* FORM */}
      <div ref={scrollToFormRef} className="mt-10">
        <div className="rounded-2xl border border-lime-300 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Valgt pakke
              </div>
              <div className="text-lg font-bold">
                {selectedPlan ? selectedPlan.title : "—"}
              </div>
            </div>
            <div className="text-sm">
              <span className="font-semibold">
                {selectedPlan?.price_amount ?? 0}
              </span>{" "}
              <span className="text-slate-500">
                {selectedPlan?.price_unit || "DKK/år"}
              </span>
            </div>
          </div>

          {/* Niveau + køn + husholdning */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Niveau</label>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={niveau}
                onChange={(e) =>
                  setNiveau(e.target.value as (typeof NIVEAUER)[number])
                }
              >
                {levelOptions.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Køn</label>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={koen}
                onChange={(e) =>
                  setKoen(e.target.value as (typeof KOEN)[number])
                }
              >
                {KOEN.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              {selectedPlan?.key === "familie" ? (
                <>
                  <label className="text-sm font-medium">Husstand</label>
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      className="w-full rounded-xl border px-3 py-2"
                      value={husstand}
                      onChange={(e) => setHusstand(Number(e.target.value))}
                      title="Antal i husstanden"
                    >
                      {[2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} personer
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div aria-hidden />
              )}
            </div>
          </div>

          {/* Navn + fødselsdato */}
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
              <label className="text-sm font-medium">Fødselsdato</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="dd-mm-åååå"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={birthDate}
                onChange={(e) => setBirthDate(formatBirthDisplay(e.target.value))}
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
              <label className="text-sm font-medium">Telefon (valgfri)</label>
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

          {/* Postnr + by */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Postnr</label>
              <input
                list="zip-suggest"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
              <datalist id="zip-suggest">
                {ZIP_SUGGEST.map((z) => (
                  <option key={z} value={z} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-sm font-medium">By</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={by}
                onChange={(e) => setBy(e.target.value)}
              />
            </div>
          </div>

          {/* Familie-medlemmer */}
          {selectedPlan?.key === "familie" && (
            <div className="mt-4 rounded-xl border border-lime-200 bg-lime-50 p-3">
              <div className="text-sm font-semibold mb-2">
                Ekstra familiemedlemmer
              </div>
              <div className="grid gap-3">
                {fam.map((m, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-3">
                    <input
                      className="rounded-xl border px-3 py-2"
                      placeholder="Fornavn"
                      value={m.first}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFam((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], first: v };
                          return next;
                        });
                      }}
                    />
                    <input
                      className="rounded-xl border px-3 py-2"
                      placeholder="Efternavn"
                      value={m.last}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFam((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], last: v };
                          return next;
                        });
                      }}
                    />
                    <input
                      type="date"
                      className="rounded-xl border px-3 py-2"
                      placeholder="Fødselsdato"
                      value={m.birth_date}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFam((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], birth_date: v };
                          return next;
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bemærkning toggle */}
          <div className="mt-4">
            <button
              type="button"
              className="text-sm font-semibold underline"
              onClick={() => setNoteOpen((s) => !s)}
            >
              {noteOpen ? "Skjul bemærkning" : "Tilføj bemærkning (valgfri)"}
            </button>
            {noteOpen && (
              <textarea
                className="mt-2 w-full rounded-xl border px-3 py-2"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </div>

          {/* Vilkår */}
          <div className="mt-4 flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              className="mt-1"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            <label htmlFor="terms" className="text-sm">
              Jeg accepterer klubbens{" "}
              <Link
                href="/privatliv"
                className="underline text-emerald-700"
                target="_blank"
              >
                privatlivspolitik
              </Link>{" "}
              og{" "}
              <Link
                href="/docs/vedtaegter.pdf"
                className="underline text-emerald-700"
                target="_blank"
              >
                vedtægter
              </Link>
              .
            </label>
          </div>

          {/* CTA */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="text-xs text-slate-500">
              Betaling/indbetaling håndteres i klubben efter bekræftet
              indmelding.
            </div>
            <div className="flex justify-end sm:ml-auto">
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
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {msg}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
