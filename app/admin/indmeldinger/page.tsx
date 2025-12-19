"use client";

import { useEffect, useMemo, useState } from "react";

/* [HELP:ADMIN:INDMELDINGER:TYPES] START */
type IndmeldingRow = {
  timestamp?: string;
  source?: string;
  form_version?: string | number;
  status?: string;

  package_key?: string;
  package_title?: string;
  price_amount?: string | number;
  price_unit?: string;

  level?: string;
  gender?: string;
  first_name?: string;
  last_name?: string;
  birth_year?: string | number;

  email?: string;
  phone?: string | number;
  address?: string;
  postcode?: string;
  city?: string;

  remark?: string;
  terms_accepted?: string;
  privacy_accepted?: string;

  payment_method?: string;
  payment_date?: string;

  member_id?: string;
  member_code?: string;

  admin_note?: string;
  row_id?: string | number;

  household_size?: string | number;
  family_members_json?: string;

  _row?: number;
};
/* [HELP:ADMIN:INDMELDINGER:TYPES] END */

const PAYMENT_METHOD_OPTIONS = [
  "MobilePay",
  "Kontant",
  "Bankoverførsel",
  "Andet",
] as const;

/* [HELP:ADMIN:INDMELDINGER:UTILS] START */
function normalizeStatus(status?: string | null): string {
  const s = String(status ?? "").trim().toLowerCase();
  if (!s) return "pending";
  if (s === "paid" || s === "betalt") return "paid";
  if (s === "cancelled" || s === "canceled" || s === "annulleret")
    return "cancelled";
  if (s === "rejected" || s === "afvist") return "rejected";
  if (s === "pending" || s === "ny") return "pending";
  return s;
}

function formatDateTime(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatPrice(amount?: string | number, unit?: string): string {
  if (amount == null || amount === "") return "";
  const n = Number(amount);
  const label = Number.isFinite(n) ? n.toString() : String(amount);
  return unit ? `${label} ${unit}` : label;
}

function yesNo(value: any): string {
  const v = String(value ?? "").trim().toUpperCase();
  if (v === "YES") return "Ja";
  if (v === "NO") return "Nej";
  return v || "";
}
/* [HELP:ADMIN:INDMELDINGER:UTILS] END */

/* [HELP:ADMIN:INDMELDINGER:FETCH] START */
async function fetchIndmeldinger(): Promise<IndmeldingRow[]> {
  const res = await fetch("/api/sheet?tab=INDMELDINGER", {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`GET /api/sheet?tab=INDMELDINGER failed (${res.status})`);
  }

  const data: any = await res.json();

  if (data && data.ok === false) {
    throw new Error(data.error || "Sheet INDMELDINGER returned ok=false");
  }

  if (!data || !Array.isArray(data.items)) {
    throw new Error("Sheet INDMELDINGER returned invalid data");
  }

  const items: IndmeldingRow[] = (data.items || []).map(
    (raw: any, idx: number) => {
      const fromServer = Number(
        raw && typeof raw._row !== "undefined" ? raw._row : NaN
      );
      const computed = idx + 2; // header=1, første data-række=2
      const rowNumber = Number.isFinite(fromServer) ? fromServer : computed;
      return {
        ...raw,
        _row: rowNumber,
      } as IndmeldingRow;
    }
  );

  return items;
}

async function callMarkPaid(rowIndex: number, method: string = "MobilePay") {
  const res = await fetch("/api/admin/indmeldinger/paid", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      row: String(rowIndex),
      method,
    }),
  });

  const data: any = await res.json().catch(() => null);
  if (!res.ok || !data || data.ok === false) {
    throw new Error(
      (data && data.error) ||
        `MarkPaid failed (${res.status}) for row ${rowIndex}`
    );
  }

  return data;
}

async function callReject(rowIndex: number) {
  const res = await fetch("/api/admin/indmeldinger/reject", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      row: String(rowIndex),
    }),
  });

  const data: any = await res.json().catch(() => null);
  if (!res.ok || !data || data.ok === false) {
    throw new Error(
      (data && data.error) ||
        `Reject failed (${res.status}) for row ${rowIndex}`
    );
  }

  return data;
}
/* [HELP:ADMIN:INDMELDINGER:FETCH] END */

/* [HELP:ADMIN:INDMELDINGER:COMPONENT] START */
export default function AdminIndmeldingerPage() {
  /* [HELP:ADMIN:INDMELDINGER:STATE] START */
  const [rows, setRows] = useState<IndmeldingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");

  const [markingRow, setMarkingRow] = useState<number | null>(null);
  const [rejectingRow, setRejectingRow] = useState<number | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Record<number, string>>(
    {}
  );
  /* [HELP:ADMIN:INDMELDINGER:STATE] END */

  /* [HELP:ADMIN:INDMELDINGER:LOAD] START */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchIndmeldinger();
        if (cancelled) return;

        setRows(data);

        // Betalingsmetode styres KUN fra admin-dropdown.
        // Default: MobilePay på alle pending indmeldinger.
        const pm: Record<number, string> = {};
        for (const r of data) {
          if (!r._row) continue;
          pm[r._row] = "MobilePay";
        }
        setPaymentMethods(pm);
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err && err.message
              ? String(err.message)
              : "Kunne ikke hente INDMELDINGER"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);
  /* [HELP:ADMIN:INDMELDINGER:LOAD] END */

  /* [HELP:ADMIN:INDMELDINGER:FILTER] START */
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    let list = rows;
    if (!showAll) {
      // Standardvisning: kun pending
      list = list.filter((r) => normalizeStatus(r.status) === "pending");
    }

    if (!term) return list;

    return list.filter((r) => {
      const parts = [
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.package_title,
        r.level,
        r.city,
        r.postcode,
        r.remark,
        r.household_size,
      ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());

      return parts.some((p) => p.includes(term));
    });
  }, [rows, showAll, search]);
  /* [HELP:ADMIN:INDMELDINGER:FILTER] END */

  const pendingCount = rows.filter(
    (r) => normalizeStatus(r.status) === "pending"
  ).length;
  const totalCount = rows.length;

  /* [HELP:ADMIN:INDMELDINGER:ACTIONS] START */
  function handlePaymentMethodChange(rowKey: number | undefined, value: string) {
    if (!rowKey) return;
    setPaymentMethods((prev) => ({
      ...prev,
      [rowKey]: value,
    }));
  }

  async function handleMarkPaidClick(
    row: IndmeldingRow,
    methodOverride?: string
  ) {
    if (!row._row) return;

    const status = normalizeStatus(row.status);
    if (status === "paid") return;

    const method =
      methodOverride ||
      (row._row && paymentMethods[row._row]) ||
      "MobilePay";

    if (
      !window.confirm(`Markér denne indmeldelse som betalt (${method})?`)
    ) {
      return;
    }

    try {
      setMarkingRow(row._row);
      await callMarkPaid(row._row, method);

      setRows((prev) =>
        prev.map((r) =>
          r._row === row._row
            ? {
                ...r,
                status: "paid",
                payment_method: method,
                payment_date: new Date().toISOString(),
              }
            : r
        )
      );

      setPaymentMethods((prev) =>
        row._row
          ? {
              ...prev,
              [row._row]: method,
            }
          : prev
      );
    } catch (err: any) {
      alert(
        err && err.message
          ? String(err.message)
          : "Kunne ikke markere som betalt"
      );
    } finally {
      setMarkingRow(null);
    }
  }

  async function handleRejectClick(row: IndmeldingRow) {
    if (!row._row) return;

    const status = normalizeStatus(row.status);
    if (status === "rejected") return;

    if (
      !window.confirm(
        "Er du sikker på, at du vil afvise denne indmelding? Den vil blive markeret som 'Afvist', men stå tilbage i oversigten."
      )
    ) {
      return;
    }

    try {
      setRejectingRow(row._row);
      await callReject(row._row);

      setRows((prev) =>
        prev.map((r) =>
          r._row === row._row
            ? {
                ...r,
                status: "rejected",
              }
            : r
        )
      );
    } catch (err: any) {
      alert(
        err && err.message
          ? String(err.message)
          : "Kunne ikke afvise indmeldingen"
      );
    } finally {
      setRejectingRow(null);
    }
  }
  /* [HELP:ADMIN:INDMELDINGER:ACTIONS] END */

  const pendingText =
    pendingCount === 1
      ? "1 indmeldelse afventer godkendelse"
      : `${pendingCount} indmeldelser afventer godkendelse`;

  /* [HELP:ADMIN:INDMELDINGER:RENDER] START */
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
      <nav className="mb-1 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="rounded-full border border-neutral-200 px-3 py-1 hover:bg-neutral-50"
          >
            ← Admin-forside
          </a>
          <span className="hidden text-neutral-400 sm:inline">/</span>
          <span className="hidden font-medium text-neutral-800 sm:inline">
            Indmeldinger
          </span>
        </div>
        <div className="text-[11px]">
          Admin-panel – kun til bestyrelsen
        </div>
      </nav>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Indmeldinger</h1>
          <p className="text-xs text-neutral-600">
            Oversigt over nye indmeldelser fra hjemmesiden. Godkend, afvis og
            marker som betalt, når du har modtaget betaling.
          </p>
          {loading && (
            <p className="mt-1 text-xs text-neutral-500">
              Henter indmeldinger&hellip;
            </p>
          )}
          {error && !loading && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
        </div>

        <div className="mt-2 flex flex-col items-start gap-1 text-xs text-neutral-600 sm:items-end">
          <div>
            I alt{" "}
            <span className="font-semibold">
              {totalCount.toString()} indmeldelser
            </span>
          </div>
          <div>
            <span className="font-semibold">
              {pendingCount.toString()} åbne
            </span>{" "}
            (ikke betalt)
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl bg-neutral-50 p-3 text-xs text-neutral-700 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="font-semibold">Filter</div>
          <div>{pendingText}</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            <span>Vis også betalte / afviste</span>
          </label>
        </div>
      </section>

      <div className="mb-2">
        <input
          type="text"
          placeholder="Søg i navn, email, pakke, by, bemærkning..."
          className="w-full rounded-full border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-neutral-900"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-neutral-50 text-left text-[11px] uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Dato</th>
              <th className="px-3 py-2">Navn</th>
              <th className="px-3 py-2">Pakke</th>
              <th className="px-3 py-2">Niveau</th>
              <th className="px-3 py-2">Kontakt</th>
              <th className="px-3 py-2">Adresse</th>
              <th className="px-3 py-2">Bemærkning</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !error && filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-xs text-neutral-500"
                >
                  Ingen indmeldinger matcher filtrene.
                </td>
              </tr>
            )}

            {filteredRows.map((row, idx) => {
              const status = normalizeStatus(row.status);
              const fullName = [row.first_name, row.last_name]
                .filter(Boolean)
                .join(" ");
              const price = formatPrice(row.price_amount, row.price_unit);
              const accepted =
                yesNo(row.terms_accepted) === "Ja" &&
                yesNo(row.privacy_accepted) === "Ja";

              const rowKey = row._row ?? idx;

              const householdLabel = (() => {
                const rawSize = row.household_size;
                const n =
                  rawSize == null || rawSize === ""
                    ? NaN
                    : Number(rawSize);
                if (Number.isFinite(n) && n > 1) {
                  return `Husstand: ${n} personer`;
                }
                if (row.family_members_json) {
                  try {
                    const fam = JSON.parse(
                      String(row.family_members_json)
                    );
                    if (Array.isArray(fam) && fam.length > 0) {
                      return `Husstand: ${fam.length + 1} personer`;
                    }
                  } catch {
                    // Ignorer JSON-fejl
                  }
                }
                return "";
              })();

              let statusLabel = "Pending";
              let statusClass =
                "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800";
              if (status === "paid") {
                statusLabel = "Betalt";
                statusClass =
                  "inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-800";
              } else if (status === "cancelled") {
                statusLabel = "Annulleret";
                statusClass =
                  "inline-flex items-center rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-700";
              } else if (status === "rejected") {
                statusLabel = "Afvist";
                statusClass =
                  "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800";
              }

              const currentMethod =
                (row._row && paymentMethods[row._row]) || "MobilePay";

              const canMarkPaid = status === "pending";
              const canReject = status === "pending";

              return (
                <tr
                  key={String(row._row ?? rowKey)}
                  className="border-t border-neutral-100 align-top"
                >
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <span className={statusClass}>{statusLabel}</span>

                      {price && (
                        <span className="text-[11px] text-neutral-600">
                          {price}
                        </span>
                      )}

                      {status === "paid" && row.payment_method && (
                        <span className="text-[11px] text-neutral-600">
                          Betalt via {row.payment_method}
                          {row.payment_date ? ` · ${row.payment_date}` : ""}
                        </span>
                      )}

                      {row.member_id && (
                        <span className="text-[11px] text-neutral-500">
                          Medlems-ID: {row.member_id}
                        </span>
                      )}

                      {canMarkPaid && (
                        <div className="mt-1 flex flex-col gap-1">
                          <label className="text-[10px] text-neutral-500">
                            Betalingsmetode
                          </label>
                          <select
                            className="w-full rounded-full border border-neutral-300 bg-white px-2 py-1 text-[11px] outline-none focus:border-neutral-900"
                            value={currentMethod}
                            onChange={(e) =>
                              handlePaymentMethodChange(
                                row._row,
                                e.target.value
                              )
                            }
                          >
                            {PAYMENT_METHOD_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="mt-2 flex flex-col gap-1">
                        {canMarkPaid && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkPaidClick(row, currentMethod)
                            }
                            disabled={markingRow === row._row}
                            className={
                              "inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-medium transition " +
                              (markingRow === row._row
                                ? "bg-neutral-200 text-neutral-600"
                                : "bg-neutral-900 text-white hover:bg-neutral-700")
                            }
                          >
                            {markingRow === row._row
                              ? "Markerer..."
                              : `Marker betalt (${currentMethod})`}
                          </button>
                        )}

                        {canReject && (
                          <button
                            type="button"
                            onClick={() => handleRejectClick(row)}
                            disabled={rejectingRow === row._row}
                            className={
                              "inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-medium transition " +
                              (rejectingRow === row._row
                                ? "border-red-200 bg-red-50 text-red-600"
                                : "border-red-300 text-red-700 hover:bg-red-50")
                            }
                          >
                            {rejectingRow === row._row
                              ? "Afviser..."
                              : "Afvis indmelding"}
                          </button>
                        )}
                      </div>

                      {row.status && (
                        <div className="mt-1 text-[10px] text-neutral-400">
                          Rå status: {row.status}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-2 text-[11px] text-neutral-600">
                    <div>
                      {row.timestamp
                        ? formatDateTime(row.timestamp)
                        : "—"}
                    </div>
                    {row.row_id && (
                      <div className="mt-1 text-[10px] opacity-60">
                        Row ID: {row.row_id} (ark-række {row._row})
                      </div>
                    )}
                    {row.source && (
                      <div className="mt-1 text-[10px] opacity-60">
                        {row.source} · v{row.form_version ?? "?"}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    <div className="text-sm font-medium">
                      {fullName || "Ukendt navn"}
                    </div>
                    <div className="text-[11px] text-neutral-600">
                      {row.gender} · {row.birth_year || "?"}
                    </div>
                    {householdLabel && (
                      <div className="text-[11px] text-neutral-600">
                        {householdLabel}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    <div className="text-sm font-medium">
                      {row.package_title || row.package_key || "—"}
                    </div>
                    {accepted && (
                      <div className="mt-1 text-[10px] text-orange-700">
                        Vilkår &amp; privatliv accepteret
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2 text-[11px] text-neutral-600">
                    <div>{row.level || "—"}</div>
                  </td>

                  <td className="px-3 py-2 text-[11px] text-neutral-600">
                    <div>{row.email || "—"}</div>
                    <div>{row.phone || ""}</div>
                  </td>

                  <td className="px-3 py-2 text-[11px] text-neutral-600">
                    {row.address && (
                      <div className="mt-1">
                        {row.address}
                        <br />
                        {row.postcode} {row.city}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2 text-[11px] text-neutral-700">
                    <div>{row.remark || "—"}</div>
                    {row.admin_note && (
                      <div className="mt-1 text-[10px] text-neutral-500">
                        Admin-note: {row.admin_note}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        Denne visning bruger v3-schemaet for INDMELDINGER. Når du markerer
        betalt, kaldes Apps Script <code>markPaid</code>, som også
        opretter/vedligeholder MEDLEMMER v3. Ved afvisning sættes kun status i
        INDMELDINGER til <code>Afvist</code>.
      </p>
    </main>
  );
}
/* [HELP:ADMIN:INDMELDINGER:COMPONENT] END */
