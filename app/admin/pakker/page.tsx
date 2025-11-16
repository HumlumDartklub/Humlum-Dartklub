"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type SheetRow = { [key: string]: string };

interface ApiListResponse {
  ok: boolean;
  items?: SheetRow[];
  error?: string;
  message?: string;
  tab?: string;
}

interface ApiSaveResponse {
  ok: boolean;
  item?: SheetRow;
  error?: string;
  message?: string;
}

type AdminTabKey = "MEDLEMSPAKKER" | "SPONSORPAKKER";

const KEY = "hdk-admin-dev";

const TAB_CONFIG: Record<
  AdminTabKey,
  {
    label: string;
    subtitle: string;
    previewHint: string;
  }
> = {
  MEDLEMSPAKKER: {
    label: "Medlemspakker",
    subtitle: 'Rediger rækker fra fanen "MEDLEMSPAKKER" i HDK_Admin_v3.',
    previewHint:
      "Preview viser ca. hvordan pakken vil se ud på /bliv-medlem (medlemsdelen).",
  },
  SPONSORPAKKER: {
    label: "Sponsorpakker",
    subtitle: 'Rediger rækker fra fanen "SPONSORPAKKER" i HDK_Admin_v3.',
    previewHint:
      "Preview viser ca. hvordan pakken vil se ud på /sponsor (sponsor-delen).",
  },
};

function cloneRows(rows: SheetRow[]): SheetRow[] {
  return rows.map((row) => ({ ...row }));
}

function normalizeString(value: any): string {
  return String(value ?? "").trim();
}

function isTruthyYes(value: any): boolean {
  const v = normalizeString(value).toUpperCase();
  return v === "YES" || v === "TRUE" || v === "1";
}

function getPreviewData(row: SheetRow | null, activeTab: AdminTabKey) {
  if (!row) {
    return {
      title: "",
      subtitle: "",
      badge: "",
      priceAmount: "",
      priceUnit: "",
      buttonLabel: "",
      features: [] as string[],
      featured: false,
      target: "",
      isSponsor: activeTab === "SPONSORPAKKER",
    };
  }

  const title =
    row["package_title"] ||
    row["title"] ||
    row["badge_label"] ||
    normalizeString(row["key"] || "");

  const subtitle = row["subtitle"] || row["description"] || "";

  const badge = row["badge_label"] || row["ribbon_label"] || "";

  const priceAmount = row["price_amount"] || row["price"] || "";
  const priceUnit = row["price_unit"] || row["price_label"] || "";

  const buttonLabel = row["button_label"] || (activeTab === "SPONSORPAKKER" ? "Bliv sponsor" : "Vælg pakke");

  const featuresRaw =
    row["features"] ||
    row["feature_list"] ||
    row["feature_text"] ||
    row["benefits"] ||
    "";

  const features = featuresRaw
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const featured = isTruthyYes(row["featured"] || row["highlight"]);
  const target = row["target"] || row["segment"] || "";

  return {
    title,
    subtitle,
    badge,
    priceAmount,
    priceUnit,
    buttonLabel,
    features,
    featured,
    target,
    isSponsor: activeTab === "SPONSORPAKKER",
  };
}

// [HELP:ADMIN-PAKKER-PAGE] START
export default function AdminPakkerPage() {
  const [activeTab, setActiveTab] = useState<AdminTabKey>("MEDLEMSPAKKER");

  const [rows, setRows] = useState<SheetRow[]>([]);
  const [draftRows, setDraftRows] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<{
    row: number | null;
    message: string | null;
    error: string | null;
  }>({ row: null, message: null, error: null });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const columns = useMemo(() => {
    if (!draftRows.length) return [] as string[];

    const keys = Object.keys(draftRows[0] ?? {});
    const priority = [
      "visible",
      "key",
      "package_key",
      "package_title",
      "title",
      "subtitle",
      "price_amount",
      "price_unit",
      "billing_period",
      "interval",
      "order",
      "badge_label",
      "button_label",
      "features",
      "featured",
      "target",
    ];

    const sorted = [...keys].sort((a, b) => {
      const ia = priority.indexOf(a);
      const ib = priority.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    return sorted;
  }, [draftRows]);

  useEffect(() => {
    loadRows(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadRows(tab: AdminTabKey) {
    setLoading(true);
    setInitialLoadError(null);
    setSaveState({ row: null, message: null, error: null });

    try {
      const res = await fetch(
        `/api/sheet?tab=${encodeURIComponent(tab)}&key=${encodeURIComponent(KEY)}`
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} – ${text}`);
      }

      const data = (await res.json()) as ApiListResponse;

      if (!data.ok || !data.items) {
        throw new Error(data.error || data.message || "Ukendt fejl ved indlæsning");
      }

      setRows(data.items);
      setDraftRows(cloneRows(data.items));
      setSelectedIndex(0);
    } catch (err: any) {
      console.error("Kunne ikke loade pakker for", tab, err);
      setInitialLoadError(err?.message || "Ukendt fejl");
    } finally {
      setLoading(false);
    }
  }

  function handleChangeCell(rowIndex: number, key: string, value: string) {
    setDraftRows((prev) => {
      const next = cloneRows(prev);
      if (!next[rowIndex]) next[rowIndex] = {};
      next[rowIndex][key] = value;
      return next;
    });
  }

  function handleResetRow(rowIndex: number) {
    setDraftRows((prev) => {
      const next = cloneRows(prev);
      next[rowIndex] = { ...(rows[rowIndex] ?? {}) };
      return next;
    });

    setSaveState((s) =>
      s.row === rowIndex ? { row: null, message: null, error: null } : s
    );
  }

  async function handleSaveRow(rowIndex: number) {
    const original = rows[rowIndex];
    const draft = draftRows[rowIndex];

    if (!original || !draft) return;

    const hasChanges = JSON.stringify(original) !== JSON.stringify(draft);
    if (!hasChanges) {
      setSaveState({
        row: rowIndex,
        message: "Ingen ændringer at gemme.",
        error: null,
      });
      return;
    }

    setSaveState({ row: rowIndex, message: null, error: null });

    try {
      const res = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: activeTab,
          key: KEY,
          action: "adminUpdateRow",
          row: String(rowIndex + 2), // række 1 = header
          data: draft,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} – ${text}`);
      }

      const data = (await res.json()) as ApiSaveResponse;
      if (!data.ok) {
        throw new Error(data.error || data.message || "Gemning fejlede");
      }

      const updated = data.item ?? draft;

      setRows((prev) => {
        const next = cloneRows(prev);
        next[rowIndex] = updated;
        return next;
      });

      setDraftRows((prev) => {
        const next = cloneRows(prev);
        next[rowIndex] = updated;
        return next;
      });

      setSaveState({
        row: rowIndex,
        message: "Gemt.",
        error: null,
      });
    } catch (err: any) {
      console.error("Fejl ved gem af række", activeTab, err);
      setSaveState({
        row: rowIndex,
        message: null,
        error:
          err?.message ||
          "Kunne ikke gemme række. Husk: Code.gs skal kende action 'adminUpdateRow'.",
      });
    }
  }

  const hasDraftChanges = useMemo(() => {
    if (rows.length !== draftRows.length) return true;
    return JSON.stringify(rows) !== JSON.stringify(draftRows);
  }, [rows, draftRows]);

  function handleResetAll() {
    setDraftRows(cloneRows(rows));
    setSaveState({ row: null, message: null, error: null });
  }

  const previewRow = useMemo(() => {
    if (!draftRows.length) return null;
    if (selectedIndex < 0 || selectedIndex >= draftRows.length) return draftRows[0];
    return draftRows[selectedIndex];
  }, [draftRows, selectedIndex]);

  const preview = useMemo(
    () => getPreviewData(previewRow, activeTab),
    [previewRow, activeTab]
  );

  const tabCfg = TAB_CONFIG[activeTab];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">
              {tabCfg.label} – Admin
            </h1>
            <p className="text-sm text-gray-600">{tabCfg.subtitle}</p>
            <p className="text-xs text-gray-500">
              Bemærk: Gem-knapperne kalder backend-action{" "}
              <code>adminUpdateRow</code>. Den skal tilføjes i din Code.gs, før gemning
              virker 100%.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-xs border px-3 py-1.5 rounded-full hover:bg-neutral-50"
          >
            ← Tilbage til admin
          </Link>
        </div>

        {/* Faner: Medlemspakker / Sponsorpakker */}
        <div className="inline-flex items-center gap-1 rounded-full border bg-white p-1 text-xs shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("MEDLEMSPAKKER")}
            className={
              "rounded-full px-3 py-1 transition " +
              (activeTab === "MEDLEMSPAKKER"
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-100")
            }
          >
            Medlemspakker
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("SPONSORPAKKER")}
            className={
              "rounded-full px-3 py-1 transition " +
              (activeTab === "SPONSORPAKKER"
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-100")
            }
          >
            Sponsorpakker
          </button>
        </div>
      </header>

      {previewRow && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)] items-start">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
                Preview af valgt pakke #{selectedIndex + 1}
              </h2>
              <span className="text-xs text-neutral-500">
                Klik på en række i tabellen for at skifte preview.
              </span>
            </div>

            <div
              className={[
                "relative flex flex-col rounded-2xl border bg-white p-4 shadow-sm",
                preview.featured ? "ring-2 ring-lime-500" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {preview.badge && (
                <div className="mb-2 inline-flex items-center rounded-full bg-lime-100 px-3 py-0.5 text-xs font-medium text-lime-800">
                  {preview.badge}
                </div>
              )}

              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">
                    {preview.title || "Titel på pakken"}
                  </div>
                  {preview.subtitle && (
                    <div className="text-sm text-neutral-600">
                      {preview.subtitle}
                    </div>
                  )}
                  {preview.target && (
                    <div className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
                      Målgruppe: {preview.target}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold leading-none">
                    {preview.priceAmount || "—"}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {preview.priceUnit ||
                      (preview.isSponsor ? "kr. / år (sponsor)" : "kr. / år")}
                  </div>
                </div>
              </div>

              {preview.features.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-neutral-700">
                  {preview.features.map((f, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span aria-hidden>•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  className="w-full rounded-full border border-neutral-900 px-4 py-2 text-sm font-medium hover:bg-neutral-900 hover:text-white transition"
                >
                  {preview.buttonLabel ||
                    (preview.isSponsor ? "Kontakt om sponsorat" : "Fortsæt til betaling")}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-neutral-50 p-3 text-xs text-neutral-700 space-y-1">
            <div className="font-semibold text-neutral-800">Tips til brug</div>
            <p>
              Brug denne side til at finpudse tekster, labels og priser, mens du kan se
              et live-preview af, hvordan pakken cirka vil se ud på{" "}
              <code className="ml-1">
                {activeTab === "SPONSORPAKKER" ? "/sponsor" : "/bliv-medlem"}
              </code>
              .
            </p>
            <p>
              Felter som <code>features</code> kan skrives med komma{" "}
              <span className="whitespace-nowrap">eller semikolon</span> mellem
              punkterne. Vi splitter automatisk til bullet-liste i preview.
            </p>
            <p className="text-[11px] text-neutral-500">
              OBS: Preview ændrer kun visningen her i admin. Selve forsiden bruger
              stadig de data, der hentes fra samme faner i Google Sheet.
            </p>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {draftRows.length} rækker indlæst fra{" "}
            <code>{activeTab}</code>.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadRows(activeTab)}
              className="text-xs border px-2 py-1 rounded hover:bg-neutral-50"
              disabled={loading}
            >
              Genindlæs
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              className="text-xs border px-2 py-1 rounded hover:bg-neutral-50"
              disabled={!hasDraftChanges}
            >
              Nulstil alle lokale ændringer
            </button>
          </div>
        </div>

        {loading && <div className="text-sm">Loader pakker…</div>}

        {initialLoadError && (
          <div className="text-sm text-red-600">
            Kunne ikke hente {TAB_CONFIG[activeTab].label.toLowerCase()}:{" "}
            {initialLoadError}
          </div>
        )}

        {!loading && !initialLoadError && !draftRows.length && (
          <div className="text-sm text-gray-600">
            Ingen rækker fundet i <code>{activeTab}</code>.
          </div>
        )}

        {draftRows.length > 0 && (
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left font-medium sticky left-0 bg-gray-50 z-10">
                    #
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-2 py-2 text-left font-medium whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-left font-medium whitespace-nowrap">
                    Handling
                  </th>
                </tr>
              </thead>
              <tbody>
                {draftRows.map((row, rowIndex) => {
                  const isSelected = rowIndex === selectedIndex;
                  const baseRowColor =
                    rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50";

                  let rowColor = baseRowColor;
                  if (saveState.row === rowIndex && saveState.error) {
                    rowColor = "bg-red-50";
                  } else if (saveState.row === rowIndex && saveState.message) {
                    rowColor = "bg-green-50";
                  } else if (isSelected) {
                    rowColor = "bg-lime-50";
                  }

                  return (
                    <tr
                      key={rowIndex}
                      onClick={() => setSelectedIndex(rowIndex)}
                      className={rowColor}
                    >
                      <td className="px-2 py-1 sticky left-0 bg-inherit z-10">
                        {rowIndex + 1}
                      </td>

                      {columns.map((colKey) => {
                        const value = row[colKey] ?? "";
                        const lower = colKey.toLowerCase();

                        const isBoolLike =
                          lower.includes("visible") ||
                          lower.includes("active") ||
                          lower.includes("featured") ||
                          lower.includes("highlight");

                        if (isBoolLike) {
                          const checked = isTruthyYes(value);
                          return (
                            <td key={colKey} className="px-2 py-1 align-top">
                              <label className="inline-flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) =>
                                    handleChangeCell(
                                      rowIndex,
                                      colKey,
                                      e.target.checked ? "YES" : "NO"
                                    )
                                  }
                                />
                                <span className="text-[10px] text-gray-500">
                                  {checked ? "YES" : value || "NO"}
                                </span>
                              </label>
                            </td>
                          );
                        }

                        const isNumberLike =
                          lower.includes("price") ||
                          lower.includes("amount") ||
                          lower.includes("order") ||
                          lower.includes("sort");

                        const isLongTextLike =
                          lower.includes("features") ||
                          lower.includes("feature") ||
                          lower.includes("description") ||
                          lower.includes("beskrivelse") ||
                          lower.includes("text") ||
                          lower.includes("benefit");

                        if (isLongTextLike) {
                          return (
                            <td
                              key={colKey}
                              className="px-2 py-1 align-top min-w-[220px]"
                            >
                              <textarea
                                value={value}
                                onChange={(e) =>
                                  handleChangeCell(rowIndex, colKey, e.target.value)
                                }
                                rows={3}
                                className="w-full border rounded px-2 py-1 text-xs leading-snug resize-vertical"
                              />
                            </td>
                          );
                        }

                        return (
                          <td
                            key={colKey}
                            className="px-2 py-1 align-top min-w-[160px]"
                          >
                            <input
                              type={isNumberLike ? "number" : "text"}
                              value={value}
                              onChange={(e) =>
                                handleChangeCell(rowIndex, colKey, e.target.value)
                              }
                              className="w-full border rounded px-2 py-1 text-xs"
                            />
                          </td>
                        );
                      })}

                      <td className="px-2 py-1 align-top whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveRow(rowIndex);
                            }}
                            className="border rounded px-2 py-0.5 text-xs hover:bg-neutral-50"
                            disabled={loading}
                          >
                            Gem række
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetRow(rowIndex);
                            }}
                            className="border rounded px-2 py-0.5 text-[10px] hover:bg-neutral-50"
                          >
                            Nulstil række
                          </button>

                          {saveState.row === rowIndex && saveState.message && (
                            <span className="text-[10px] text-green-700">
                              {saveState.message}
                            </span>
                          )}

                          {saveState.row === rowIndex && saveState.error && (
                            <span className="text-[10px] text-red-600">
                              {saveState.error}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* [HELP:ADMIN-PAKKER-PAGE] END */}
    </div>
  );
}
