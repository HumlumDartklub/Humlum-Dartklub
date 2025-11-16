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

type AdminTabKey = "TICKER" | "NYHEDER";

const KEY = "hdk-admin-dev";

const TAB_CONFIG: Record<
  AdminTabKey,
  {
    label: string;
    subtitle: string;
  }
> = {
  TICKER: {
    label: "Ticker",
    subtitle: 'Rediger rækker fra fanen "TICKER" i HDK_Admin_v3.',
  },
  NYHEDER: {
    label: "Nyheder",
    subtitle: 'Rediger rækker fra fanen "NYHEDER" i HDK_Admin_v3.',
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

function getTickerPreview(rows: SheetRow[], selectedIndex: number) {
  if (!rows.length) {
    return {
      items: [] as { message: string; active: boolean }[],
    };
  }

  const items = rows.map((row, idx) => {
    const message =
      row["message"] ||
      row["text"] ||
      row["content"] ||
      row["label"] ||
      row["title"] ||
      "";
    const visible = isTruthyYes(row["visible"]) || !row["visible"];
    return {
      message: message || "(tom besked)",
      active: visible && idx === selectedIndex,
    };
  });

  return { items };
}

function getNewsPreview(row: SheetRow | null) {
  if (!row) {
    return {
      title: "",
      teaser: "",
      body: "",
      imageUrl: "",
      category: "",
    };
  }

  const title =
    row["title"] ||
    row["headline"] ||
    row["overskrift"] ||
    row["label"] ||
    "";

  const teaser =
    row["teaser"] ||
    row["intro"] ||
    row["summary"] ||
    row["subtitle"] ||
    "";

  const bodyRaw =
    row["body"] ||
    row["content"] ||
    row["text"] ||
    row["description"] ||
    "";

  const body =
    bodyRaw.length > 260 ? bodyRaw.slice(0, 260).trimEnd() + "…" : bodyRaw;

  const imageUrl = row["image_url"] || row["image"] || "";
  const category = row["category"] || row["tag"] || "";

  return {
    title,
    teaser,
    body,
    imageUrl,
    category,
  };
}

// [HELP:ADMIN-TICKER-PAGE] START
export default function AdminTickerNyhederPage() {
  const [activeTab, setActiveTab] = useState<AdminTabKey>("TICKER");

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
      "order",
      "sort",
      "priority",
      "title",
      "headline",
      "overskrift",
      "teaser",
      "intro",
      "message",
      "text",
      "body",
      "content",
      "label",
      "link",
      "url",
      "image_url",
      "image",
      "category",
      "tag",
      "start_date",
      "end_date",
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
      console.error("Kunne ikke loade rækker for", tab, err);
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

  const tickerPreview = useMemo(
    () => getTickerPreview(draftRows, selectedIndex),
    [draftRows, selectedIndex]
  );
  const newsPreview = useMemo(
    () => getNewsPreview(previewRow),
    [previewRow]
  );

  const tabCfg = TAB_CONFIG[activeTab];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Ticker & Nyheder – Admin</h1>
            <p className="text-sm text-gray-600">{tabCfg.subtitle}</p>
            <p className="text-xs text-gray-500">
              Gem-knapperne kalder backend-action <code>adminUpdateRow</code>. Den skal
              findes i din Code.gs, før gemning virker 100%.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-xs border px-3 py-1.5 rounded-full hover:bg-neutral-50"
          >
            ← Tilbage til admin
          </Link>
        </div>

        {/* Faner: Ticker / Nyheder */}
        <div className="inline-flex items-center gap-1 rounded-full border bg-white p-1 text-xs shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("TICKER")}
            className={
              "rounded-full px-3 py-1 transition " +
              (activeTab === "TICKER"
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-100")
            }
          >
            Ticker
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("NYHEDER")}
            className={
              "rounded-full px-3 py-1 transition " +
              (activeTab === "NYHEDER"
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-100")
            }
          >
            Nyheder
          </button>
        </div>
      </header>

      {/* PREVIEW-SEKTION */}
      {activeTab === "TICKER" && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)] items-start">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
              Preview – Ticker
            </h2>
            <div className="rounded-2xl border bg-neutral-900 text-neutral-100 p-3 text-xs overflow-hidden">
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wide opacity-70">
                <span className="inline-flex h-3 w-3 rounded-full bg-red-500" />
                <span className="inline-flex h-3 w-3 rounded-full bg-yellow-400" />
                <span className="inline-flex h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2">Preview af kørende ticker-linje</span>
              </div>
              <div className="mt-1 flex gap-6 whitespace-nowrap">
                {tickerPreview.items.length === 0 && (
                  <span className="opacity-70">Ingen beskeder endnu…</span>
                )}
                {tickerPreview.items.map((item, idx) => (
                  <span
                    key={idx}
                    className={
                      "inline-flex items-center gap-1" +
                      (item.active ? " font-semibold" : " opacity-80")
                    }
                  >
                    {idx > 0 && <span aria-hidden>•</span>}
                    <span>{item.message}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-neutral-50 p-3 text-xs text-neutral-700 space-y-1">
            <div className="font-semibold text-neutral-800">Tips til Ticker</div>
            <p>
              Skriv korte, præcise beskeder. Hold øje med rækkefølgen via{" "}
              <code>order</code>-feltet (hvis det findes).
            </p>
            <p>
              Brug <code>visible</code> til at tænde/slukke enkelte beskeder uden at
              slette dem.
            </p>
            <p className="text-[11px] text-neutral-500">
              HP&apos;ens ticker læser direkte fra fanen <code>TICKER</code>. Denne
              preview er kun en hjælp visuelt.
            </p>
          </div>
        </section>
      )}

      {activeTab === "NYHEDER" && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)] items-start">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
              Preview – Nyhedsartikel #{selectedIndex + 1}
            </h2>
            <div className="flex flex-col rounded-2xl border bg-white p-4 shadow-sm gap-3 md:flex-row">
              <div className="flex-1 space-y-2">
                <div className="text-xs uppercase tracking-wide text-neutral-500">
                  {newsPreview.category || "Nyhed"}
                </div>
                <div className="text-lg font-semibold">
                  {newsPreview.title || "Titel på nyheden"}
                </div>
                {newsPreview.teaser && (
                  <div className="text-sm text-neutral-700">
                    {newsPreview.teaser}
                  </div>
                )}
                {newsPreview.body && (
                  <div className="text-xs text-neutral-600 mt-1">
                    {newsPreview.body}
                  </div>
                )}
              </div>
              <div className="w-full md:w-40 shrink-0">
                <div className="flex h-24 w-full items-center justify-center rounded-xl bg-neutral-100 text-[10px] text-neutral-500">
                  {newsPreview.imageUrl
                    ? "Billede fra image_url"
                    : "Ingen image_url angivet"}
                </div>
                {newsPreview.imageUrl && (
                  <div className="mt-1 truncate text-[10px] text-neutral-500">
                    {newsPreview.imageUrl}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-neutral-50 p-3 text-xs text-neutral-700 space-y-1">
            <div className="font-semibold text-neutral-800">Tips til Nyheder</div>
            <p>
              Brug <code>title</code>/<code>headline</code> til overskrift,{" "}
              <code>teaser</code>/<code>intro</code> til kort undertekst og{" "}
              <code>body</code>/<code>content</code> til selve nyheden.
            </p>
            <p>
              <code>visible</code> kan bruges til at kladde nyheder uden at de bliver
              vist på forsiden.
            </p>
            <p className="text-[11px] text-neutral-500">
              Selve layoutet på HP styres af frontend. Denne preview giver kun en
              fornemmelse af tekstmængde og struktur.
            </p>
          </div>
        </section>
      )}

      {/* TABEL-SEKTION */}
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

        {loading && <div className="text-sm">Loader data…</div>}

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
                          lower.includes("published") ||
                          lower.includes("show");

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
                          lower.includes("order") ||
                          lower.includes("sort") ||
                          lower.includes("prio") ||
                          lower.includes("priority");

                        const isLongTextLike =
                          lower.includes("message") ||
                          lower.includes("text") ||
                          lower.includes("body") ||
                          lower.includes("content") ||
                          lower.includes("description") ||
                          lower.includes("teaser") ||
                          lower.includes("intro");

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
      {/* [HELP:ADMIN-TICKER-PAGE] END */}
    </div>
  );
}
