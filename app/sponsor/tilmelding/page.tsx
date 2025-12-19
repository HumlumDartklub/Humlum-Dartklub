"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hdk:sponsor:selection:v1";

type SponsorForm = {
  firma: string;
  kontakt: string;
  email: string;
  telefon: string;
  website: string;
  kommentar: string;
};


type SponsorSelectionPayload = {
  package?: { key: string; name: string; priceYear: number } | null;
  addOns?: Array<{
    key: string;
    name: string;
    monthly?: number | null;
    yearly?: number | null;
  }>;
  oneClick?: {
    amount: number;
    anonymous: boolean;
    earmarks: string[];
  } | null;
  totals?: { year: number; month: number };
  summaryText?: string;
};

function safeReadStoredSelection(): SponsorSelectionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
    return null;
  } catch {
    return null;
  }
}

function tidySummaryText(raw: string): string {
  const lines = String(raw || "")
    .split("\n")
    .map((l) => l.trimEnd());

  const cleaned = lines.filter((l) => {
    const t = l.trim();
    if (!t) return true;
    if (t.startsWith("Humlum Dartklub — Sponsoropsummering")) return false;
    if (/^=+$/g.test(t)) return false;
    if (/^[-_]{3,}$/g.test(t)) return false;
    if (t.startsWith("Tak for at støtte Humlum Dartklub")) return false;
    return true;
  });

  return cleaned.join("\n").trim();
}

function renameEarmarkLabel(text: string): string {
  return text
    .replace(/Øremærkning:/g, "Ønsket anvendelse:")
    .replace(/Øremærkning/g, "Ønsket anvendelse");
}

function buildFallbackFromQuery(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);

  const pkg = (params.get("pkg") ?? "").trim();
  const addonsRaw = (params.get("addons") ?? "").trim();
  const clickRaw = (params.get("click") ?? "").trim();
  const anon = (params.get("anon") ?? "").trim() === "1";
  const earmarksRaw = (params.get("earmarks") ?? "").trim();
  const totalYearRaw = (params.get("totalYear") ?? "").trim();
  const totalMonthRaw = (params.get("totalMonth") ?? "").trim();

  const addons = addonsRaw
    ? addonsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const earmarks = earmarksRaw
    ? earmarksRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const click = Number(clickRaw || 0);
  const totalYear = Number(totalYearRaw || 0);
  const totalMonth = Number(totalMonthRaw || 0);

  const lines: string[] = [];

  if (pkg) lines.push(`Pakke: ${pkg}`);

  if (addons.length) {
    lines.push("Tilkøb:");
    addons.forEach((a) => lines.push(`  • ${a}`));
  }

  if (click) {
    lines.push(`Ét-klik støtte: ${click} kr. (engang)`);
    if (anon) lines.push("  • Anonym støtte: JA");
    if (earmarks.length)
      lines.push(`Ønsket anvendelse: ${earmarks.join(", ")}`);
  }

  if (totalYear || totalMonth) {
    lines.push("----------------------------------");
    if (totalYear) lines.push(`I alt pr. år: ${totalYear} kr.`);
    if (totalMonth) lines.push(`Ca. pr. måned: ${totalMonth} kr.`);
  }

  return lines.join("\n").trim();
}

function readSummaryText(): {
  text: string;
  source: "query-prefill" | "storage" | "query-fallback" | null;
} {
  if (typeof window === "undefined") return { text: "", source: null };
  const params = new URLSearchParams(window.location.search);

  const prefill = (params.get("prefill") ?? "").trim();
  if (prefill) {
    const t = renameEarmarkLabel(tidySummaryText(prefill));
    return { text: t, source: "query-prefill" };
  }

  const stored = safeReadStoredSelection();
  if (stored?.summaryText && String(stored.summaryText).trim()) {
    const t = renameEarmarkLabel(
      tidySummaryText(String(stored.summaryText)),
    );
    return { text: t, source: "storage" };
  }

  const fallback = buildFallbackFromQuery();
  if (fallback) {
    const t = renameEarmarkLabel(tidySummaryText(fallback));
    return { text: t, source: "query-fallback" };
  }

  return { text: "", source: null };
}

type ParsedSummary = {
  packageLine: string;
  includes: string[];
  addons: string[];
  oneClickHeader: string;
  oneClickDetails: string[];
  totals: string[];
};

function parseSummary(text: string): ParsedSummary {
  const out: ParsedSummary = {
    packageLine: "",
    includes: [],
    addons: [],
    oneClickHeader: "",
    oneClickDetails: [],
    totals: [],
  };

  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^[-_]{3,}$/g.test(l));

  let mode: "includes" | "addons" | "oneClick" | null = null;

  for (const line of lines) {
    if (line.startsWith("Pakke:")) {
      out.packageLine = line.replace(/^Pakke:\s*/i, "").trim();
      mode = null;
      continue;
    }

    if (/^Inkluderer/i.test(line)) {
      mode = "includes";
      continue;
    }

    if (/^Tilkøb:/i.test(line)) {
      mode = "addons";
      continue;
    }

    if (/^Ét-klik støtte:/i.test(line)) {
      out.oneClickHeader = line;
      mode = "oneClick";
      continue;
    }

    if (/^I alt pr\. år:/i.test(line) || /^Ca\. pr\. måned:/i.test(line)) {
      out.totals.push(line);
      mode = null;
      continue;
    }

    if (/^Ønsket anvendelse:/i.test(line)) {
      out.oneClickDetails.push(line);
      mode = "oneClick";
      continue;
    }

    const isBullet =
      line.startsWith("•") || line.startsWith("-");

    const cleanBullet = line
      .replace(/^[•-]\s*/, "")
      .trim();

    if (mode === "includes") {
      out.includes.push(isBullet ? cleanBullet : line);
      continue;
    }

    if (mode === "addons") {
      out.addons.push(isBullet ? cleanBullet : line);
      continue;
    }

    if (mode === "oneClick") {
      out.oneClickDetails.push(isBullet ? cleanBullet : line);
      continue;
    }
  }

  return out;
}

export default function SponsorTilmeldingPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>("");

  const [summaryText, setSummaryText] = useState("");
  const [summarySource, setSummarySource] = useState<
    "query-prefill" | "storage" | "query-fallback" | null
  >(null);

  const [extraNote, setExtraNote] = useState("");

  const [form, setForm] = useState<SponsorForm>({
    firma: "",
    kontakt: "",
    email: "",
    telefon: "",
    website: "",
    kommentar: "",
  });


  useEffect(() => {
    const { text, source } = readSummaryText();
    setSummaryText(text);
    setSummarySource(source);
    setForm((f) => ({ ...f, kommentar: text }));
  }, []);

  const parsed = useMemo(
    () => parseSummary(summaryText),
    [summaryText],
  );

  const sourceHint = useMemo(() => {
    if (!summaryText) return "";
    if (summarySource === "query-prefill")
      return "Valg hentet direkte fra sponsorsiden.";
    if (summarySource === "storage")
      return "Valg hentet fra din seneste opsummering.";
    return "Valg genopbygget ud fra dit valg.";
  }, [summaryText, summarySource]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.firma) return setError("Udfyld firmanavn.");
    if (!form.kontakt) return setError("Udfyld kontaktperson.");
    if (!form.email) return setError("Udfyld e-mail.");

    const finalComment = [
      summaryText?.trim(),
      extraNote?.trim()
        ? `\n\nEkstra kommentar:\n${extraNote.trim()}`
        : "",
    ]
      .join("")
      .trim();

    setSending(true);
    try {
      const res = await fetch("/api/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          kommentar: finalComment,
        }),
      });

      if (!res.ok) throw new Error(await res.text().catch(() => "Serverfejl"));
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Noget gik galt. Prøv igen.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-2">Tak for din interesse!</h1>
        <p className="text-slate-700">
          Vi kontakter jer hurtigst muligt for næste skridt.
        </p>
        <div className="mt-8">
          <a
            href="/sponsor"
            className="underline text-orange-700 hover:text-orange-800"
          >
            Tilbage til sponsorsiden
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-1">Sponsor-tilmelding</h1>
      <p className="text-slate-700 mb-6">
        Udfyld oplysningerne herunder, så vender vi tilbage.
      </p>

      {summaryText && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-orange-50 p-3 text-sm text-slate-800">
          <div className="font-semibold">Vi har forudfyldt din opsummering</div>
          <div className="mt-1 text-xs text-slate-600">{sourceHint}</div>
          <div className="mt-2 text-xs text-slate-600">
            Opsummeringen er låst for at undgå misforståelser.
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Firmanavn
          </label>
          <input
            value={form.firma}
            onChange={(e) => setForm({ ...form, firma: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            placeholder="Firma A/S"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Kontaktperson
            </label>
            <input
              value={form.kontakt}
              onChange={(e) => setForm({ ...form, kontakt: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              placeholder="Fornavn Efternavn"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              placeholder="kontakt@firma.dk"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Telefon</label>
          <input
            value={form.telefon}
            onChange={(e) => setForm({ ...form, telefon: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            placeholder="12 34 56 78"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Website (valgfrit)
          </label>
          <input
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            placeholder="https://www.firma.dk"
          />
        </div>

        {/* Opsummering - struktureret 2-kolonne */}
        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Opsummering
          </label>

          <div className="rounded-lg border border-slate-300 bg-white p-4">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Venstre */}
              <div>
                <div className="text-sm font-semibold mb-1">Valgt pakke</div>
                <div className="text-sm text-slate-900">
                  {parsed.packageLine || "Ingen pakke valgt"}
                </div>

                {parsed.includes.length > 0 && (
                  <>
                    <div className="text-sm font-semibold mt-4 mb-1">
                      Inkluderer (samlet)
                    </div>
                    <ul className="list-disc pl-5 text-sm text-slate-900 space-y-1">
                      {parsed.includes.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Højre */}
              <div>
                {parsed.addons.length > 0 && (
                  <>
                    <div className="text-sm font-semibold mb-1">Tilvalg</div>
                    <ul className="list-disc pl-5 text-sm text-slate-900 space-y-1">
                      {parsed.addons.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </>
                )}

                {parsed.oneClickHeader && (
                  <>
                    <div className="text-sm font-semibold mt-4 mb-1">
                      Ét-klik støtte
                    </div>
                    <div className="text-sm text-slate-900">
                      {parsed.oneClickHeader}
                    </div>
                    {parsed.oneClickDetails.length > 0 && (
                      <ul className="list-disc pl-5 text-sm text-slate-900 space-y-1 mt-1">
                        {parsed.oneClickDetails.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {parsed.totals.length > 0 && (
                  <>
                    <div className="text-sm font-semibold mt-4 mb-1">
                      Økonomi
                    </div>
                    <ul className="list-disc pl-5 text-sm text-slate-900 space-y-1">
                      {parsed.totals.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-900">
              Tak for at støtte Humlum Dartklub – Fællesskab & Præcision.
            </div>
          </div>

          <div className="mt-1 text-xs text-slate-500">
            Dette er en samlet oversigt over valg og pakkeindhold.
          </div>
        </div>

        {/* Valgfri fri tekst */}
        <div>
          <label className="block text-sm text-slate-700 mb-1">
            Ekstra kommentar (valgfri)
          </label>
          <textarea
            value={extraNote}
            onChange={(e) => setExtraNote(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            rows={3}
            placeholder="Fx ønsket kontakt tidspunkt, særlige spørgsmål…"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={sending}
            className="w-full btn btn-primary disabled:opacity-60"
          >
            {sending ? "Sender..." : "Send tilmelding"}
          </button>
        </div>
      </form>
    </main>
  );
}
