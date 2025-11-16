"use client";

import { useEffect, useMemo, useState } from "react";

/* [HELP:ADMIN:MEDLEMSLISTE:TYPES] START */
export type MemberRow = {
  _row?: number;

  member_id?: string;
  member_code?: string;
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
  phone?: string;

  address?: string;
  postcode?: string | number;
  city?: string;

  remark?: string;

  start_date?: string;
  end_date?: string;
  auto_renew?: string;

  payment_method?: string;
  payment_date?: string;

  source?: string;
  source_form_version?: string;
  source_row_id?: string;
  admin_note?: string;

  created_at?: string;
  updated_at?: string;

  // Primært hold (TRIN A – én værdi pr. medlem)
  primary_team_id?: string;

  // Primær rolle på det hold (TRIN B)
  primary_team_role?: string;

  // Evt. eksisterende felt fra tidligere
  team_id?: string;

  // Fremtidigt felt – DDU ID til turneringsspillere
  ddu_id?: string;
};

export type TeamRow = {
  team_id?: string;
  title?: string;
  slug?: string;
  category?: string;
  level?: string;
  description_short?: string;
  training_info?: string;
  visible_public?: string;
  visible_memberzone?: string;
  sort_order?: string | number;
};
/* [HELP:ADMIN:MEDLEMSLISTE:TYPES] END */

/* [HELP:ADMIN:MEDLEMSLISTE:UTILS] START */
function normalizeStatus(value: any): string {
  const v = String(value ?? "").trim().toLowerCase();
  if (!v) return "unknown";
  if (v === "active" || v === "aktiv") return "active";
  if (v === "pending") return "pending";
  if (v === "paused") return "paused";
  if (v === "cancelled" || v === "stopped" || v === "afmeldt")
    return "cancelled";
  return v;
}

function displayStatus(value: any): string {
  const v = normalizeStatus(value);
  if (v === "active") return "Aktiv";
  if (v === "pending") return "Afventer";
  if (v === "paused") return "På pause";
  if (v === "cancelled") return "Stoppet";
  return v === "unknown" ? "Ukendt" : v;
}

function displayLevel(value: any): string {
  const v = String(value ?? "").trim();
  if (!v) return "—";
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function formatPhone(value: any): string {
  const v = String(value ?? "").trim();
  if (!v) return "—";
  return v;
}

function parseDate(value: any): Date | null {
  const s = String(value ?? "").trim();
  if (!s) return null;

  // 2025-11-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map((n) => Number(n));
    return new Date(y, m - 1, d);
  }
  // 2025/11/15
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(s)) {
    const [y, m, d] = s.split("/").map((n) => Number(n));
    return new Date(y, m - 1, d);
  }
  // 15-11-2025
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split("-").map((n) => Number(n));
    return new Date(y, m - 1, d);
  }
  // 15/11/2025
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/").map((n) => Number(n));
    return new Date(y, m - 1, d);
  }

  return null;
}

function formatDate(value: any): string {
  const d = parseDate(value);
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

type KontingentTone = "ok" | "soon" | "expired" | "unknown";

function kontingentStatus(row: MemberRow): { label: string; tone: KontingentTone } {
  const status = normalizeStatus(row.status);
  const endAt = parseDate(row.end_date);

  if (!endAt) {
    if (status === "active") {
      return { label: "Kontingent OK", tone: "ok" };
    }
    return { label: "", tone: "unknown" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (endAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const labelDate = formatDate(row.end_date);

  if (status !== "active" || diffDays < 0) {
    return {
      label: labelDate ? `Udløbet ${labelDate}` : "Udløbet",
      tone: "expired",
    };
  }

  if (diffDays <= 31) {
    return {
      label: labelDate ? `Udløber snart (${labelDate})` : "Udløber snart",
      tone: "soon",
    };
  }

  return {
    label: labelDate ? `Kontingent OK til ${labelDate}` : "Kontingent OK",
    tone: "ok",
  };
}

function kontingentToneClass(tone: KontingentTone): string {
  if (tone === "ok") return "text-emerald-700";
  if (tone === "soon") return "text-amber-700";
  if (tone === "expired") return "text-red-600";
  return "text-neutral-500";
}

function fullName(row: MemberRow): string {
  const first = String(row.first_name ?? "").trim();
  const last = String(row.last_name ?? "").trim();
  return (first + " " + last).trim() || "Ukendt navn";
}

function primaryTeamId(row: MemberRow): string {
  const id = (row.primary_team_id ?? row.team_id ?? "") as
    | string
    | undefined;
  return String(id ?? "").trim();
}
/* [HELP:ADMIN:MEDLEMSLISTE:UTILS] END */

/* [HELP:ADMIN:MEDLEMSLISTE:FETCH] START */
async function fetchMembers(): Promise<MemberRow[]> {
  const res = await fetch("/api/sheet?tab=MEDLEMMER", {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`GET /api/sheet?tab=MEDLEMMER failed (${res.status})`);
  }

  const data: any = await res.json();

  if (data && data.ok === false) {
    throw new Error(data.error || "Sheet MEDLEMMER returned ok=false");
  }

  let items: any[] = Array.isArray(data?.items) ? data.items : [];

  items = items.map((raw, idx) => {
    const fromServer = Number(
      raw && typeof raw._row !== "undefined" ? raw._row : NaN,
    );
    const computed = idx + 2; // første data-række = 2
    const rowNumber = Number.isFinite(fromServer) ? fromServer : computed;
    return { ...raw, _row: rowNumber } as MemberRow;
  });

  return items as MemberRow[];
}

async function fetchTeams(): Promise<TeamRow[]> {
  try {
    const res = await fetch("/api/sheet?tab=HOLD", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      // HOLD-fanen er ikke kritisk – vi kører bare uden hold
      console.warn("GET /api/sheet?tab=HOLD failed", res.status);
      return [];
    }

    const data: any = await res.json();
    if (data && data.ok === false) {
      console.warn("Sheet HOLD returned ok=false", data.error);
      return [];
    }

    const items: any[] = Array.isArray(data?.items) ? data.items : [];
    return items as TeamRow[];
  } catch (err) {
    console.warn("Failed to fetch HOLD tab", err);
    return [];
  }
}
/* [HELP:ADMIN:MEDLEMSLISTE:FETCH] END */

const ROLE_OPTIONS: string[] = ["", "Spiller", "Reserve", "Kaptajn", "Træner"];

/* [HELP:ADMIN:MEDLEMSLISTE:COMPONENT] START */
export default function AdminMedlemslistePage() {
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const members = await fetchMembers();
      setRows(members);
      const hold = await fetchTeams();
      setTeams(hold);
    } catch (e: any) {
      console.error("Admin v3 medlemsliste load failed", e);
      setError(e?.message || "Kunne ikke hente medlemmer fra MEDLEMMER v3.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (cancelled) return;
        await reload();
      } catch {
        // fejl håndteres i reload
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryTeamName = (row: MemberRow): string => {
    const id = primaryTeamId(row);
    if (!id) return "";
    const t = teams.find((team) => String(team.team_id ?? "").trim() === id);
    return (t?.title || "").trim();
  };

  const filteredRows = useMemo(() => {
    let list = rows;

    if (!showInactive) {
      list = list.filter((r) => normalizeStatus(r.status) === "active");
    }

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((r) => {
        const fields = [
          r.member_id,
          r.member_code,
          r.first_name,
          r.last_name,
          r.email,
          r.phone,
          r.city,
          r.package_title,
          r.package_key,
          primaryTeamName(r),
        ];
        return fields.some((f) =>
          String(f ?? "")
            .toLowerCase()
            .includes(term),
        );
      });
    }

    // Sortér efter efternavn, fornavn, medlems-ID
    list = [...list].sort((a, b) => {
      const an = fullName(a).toLowerCase();
      const bn = fullName(b).toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      const aid = String(a.member_id ?? "");
      const bid = String(b.member_id ?? "");
      if (aid < bid) return -1;
      if (aid > bid) return 1;
      return 0;
    });

    return list;
  }, [rows, search, showInactive, teams]);

  const totalActive = useMemo(
    () => rows.filter((r) => normalizeStatus(r.status) === "active").length,
    [rows],
  );
  const totalAll = rows.length;

  async function savePrimaryTeam(
    rowKey: string,
    row: MemberRow,
    teamId: string,
    role: string,
  ) {
    if (!row._row) {
      setError("Manglende _row på medlem – kan ikke gemme.");
      return;
    }

    setSavingKey(rowKey);
    setError(null);

    try {
      const res = await fetch("/api/admin/medlemmer/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          row: row._row,
          team_id: teamId || "",
          role: role || "",
        }),
      });

      const data: any = await res.json().catch(() => null);

      if (!res.ok || !data || data.ok === false) {
        const msg =
          (data && (data.error || data.message)) || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const updated: MemberRow | undefined =
        data.item || data.member || undefined;

      if (updated && typeof updated === "object") {
        setRows((prev) =>
          prev.map((r) =>
            r._row === updated._row ? { ...r, ...updated } : r,
          ),
        );
      } else {
        // fallback: opdater lokalt ud fra input
        setRows((prev) =>
          prev.map((r) =>
            r._row === row._row
              ? {
                  ...r,
                  primary_team_id: teamId || "",
                  primary_team_role: role || "",
                }
              : r,
          ),
        );
      }
    } catch (err: any) {
      console.error("Failed to save primary team", err);
      setError(err?.message || "Kunne ikke gemme hold/rolle.");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          ADMIN-PANEL – KUN TIL BESTYRELSEN
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Medlemsliste
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Overblik over medlemmer fra fanen MEDLEMMER v3. Nu med primært hold
          og rolle (TRIN B).
        </p>
      </header>

      {/* Filter-linje */}
      <section className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <label className="sr-only" htmlFor="search">
              Søg
            </label>
            <input
              id="search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søg i navn, email, by, pakke, hold..."
              className="w-full rounded-full border border-neutral-300 px-4 py-2 text-sm shadow-sm focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-neutral-500">
              Aktive: {totalActive} / I alt: {totalAll}
            </span>
            <button
              type="button"
              onClick={() => setShowInactive(false)}
              className={
                "rounded-full border px-3 py-1 transition " +
                (!showInactive
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-700")
              }
            >
              Kun aktive
            </button>
            <button
              type="button"
              onClick={() => setShowInactive(true)}
              className={
                "rounded-full border px-3 py-1 transition " +
                (showInactive
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-700")
              }
            >
              Alle status
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </section>

      {/* Indhold */}
      {loading && (
        <div className="mt-4 text-sm text-neutral-500">
          Henter medlemmer fra HDK_Admin_v3...
        </div>
      )}

      {!loading && !error && filteredRows.length === 0 && (
        <div className="mt-4 text-sm text-neutral-500">
          Ingen medlemmer matcher filtrene.
        </div>
      )}

      {!loading && filteredRows.length > 0 && (
        <section className="mt-4 space-y-3">
          {filteredRows.map((row, idx) => {
            const key =
              String(row.member_id ?? "") ||
              String(row.member_code ?? "") ||
              String(row.email ?? "") ||
              String(row._row ?? idx);

            const isOpen = openKey === key;
            const kontingent = kontingentStatus(row);
            const teamName = primaryTeamName(row);
            const currentTeamId = primaryTeamId(row);
            const currentRole = String(row.primary_team_role ?? "").trim();
            const isSaving = savingKey === key;

            return (
              <div
                key={key}
                className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? null : key)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div className="flex-1">
                    <div className="text-[11px] font-mono uppercase tracking-wide text-neutral-400">
                      {row.member_id || "—"}
                    </div>
                    <div className="text-sm font-semibold">
                      {fullName(row)}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      Niveau: {displayLevel(row.level)} · Pakke:{" "}
                      {row.package_title || row.package_key || "Ukendt"}
                      {row.city &&
                        ` · ${
                          row.postcode ? String(row.postcode) + " " : ""
                        }${row.city}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    {row.phone && (
                      <div className="text-xs text-neutral-600">
                        {formatPhone(row.phone)}
                      </div>
                    )}
                    {kontingent.label && (
                      <div
                        className={
                          "text-[11px] font-medium " +
                          kontingentToneClass(kontingent.tone)
                        }
                      >
                        {kontingent.label}
                      </div>
                    )}
                    <div className="mt-1 text-xl leading-none text-neutral-500">
                      {isOpen ? "▴" : "▾"}
                    </div>
                  </div>
                </button>

                {/* Hold & rolle – området du markerede med rødt */}
                <div className="mt-3 flex flex-col gap-2 border-t border-dashed border-neutral-200 pt-3 text-xs text-neutral-700 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Hold
                      </span>
                      <select
                        className="rounded-full border border-neutral-300 bg-white px-2 py-1 text-xs focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
                        value={currentTeamId}
                        disabled={isSaving || teams.length === 0}
                        onChange={(e) =>
                          savePrimaryTeam(
                            key,
                            row,
                            e.target.value,
                            currentRole,
                          )
                        }
                      >
                        <option value="">Ingen</option>
                        {teams.map((t) => {
                          const id = String(t.team_id ?? "").trim();
                          if (!id) return null;
                          return (
                            <option key={id} value={id}>
                              {t.title || id}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Rolle
                      </span>
                      <select
                        className="rounded-full border border-neutral-300 bg-white px-2 py-1 text-xs focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
                        value={currentRole}
                        disabled={isSaving}
                        onChange={(e) =>
                          savePrimaryTeam(
                            key,
                            row,
                            currentTeamId,
                            e.target.value,
                          )
                        }
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt || "NONE"} value={opt}>
                            {opt || "Ingen"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {isSaving
                      ? "Gemmer ændringer…"
                      : teamName
                      ? `Primært hold: ${teamName}`
                      : "Intet primært hold valgt endnu"}
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 border-t border-neutral-200 pt-3 text-sm text-neutral-700">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {/* Kontakt */}
                      <div className="space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Kontakt
                        </div>
                        <div>{fullName(row)}</div>
                        {row.birth_year && (
                          <div className="text-xs text-neutral-500">
                            Fødselsår: {row.birth_year}
                          </div>
                        )}
                        {row.email && (
                          <div className="text-xs text-neutral-600">
                            {row.email}
                          </div>
                        )}
                        {row.phone && (
                          <div className="text-xs text-neutral-600">
                            {formatPhone(row.phone)}
                          </div>
                        )}
                        {(row.address || row.postcode || row.city) && (
                          <div className="text-xs text-neutral-600">
                            {row.address}
                            {(row.postcode || row.city) && <br />}
                            {row.postcode} {row.city}
                          </div>
                        )}
                      </div>

                      {/* Medlemskab */}
                      <div className="space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Medlemskab
                        </div>
                        <div className="text-xs text-neutral-600">
                          Status:{" "}
                          <span className="font-medium">
                            {displayStatus(row.status)}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-600">
                          Pakke:{" "}
                          <span className="font-medium">
                            {row.package_title ||
                              row.package_key ||
                              "Ukendt"}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-600">
                          Niveau:{" "}
                          <span className="font-medium">
                            {displayLevel(row.level)}
                          </span>
                        </div>
                        {teamName && (
                          <div className="text-xs text-neutral-600">
                            Hold:{" "}
                            <span className="font-medium">{teamName}</span>
                          </div>
                        )}
                        {row.start_date && (
                          <div className="text-xs text-neutral-600">
                            Medlem siden:{" "}
                            <span className="font-medium">
                              {formatDate(row.start_date) ||
                                String(row.start_date)}
                            </span>
                          </div>
                        )}
                        {row.end_date && (
                          <div className="text-xs text-neutral-600">
                            Medlemskab til:{" "}
                            <span className="font-medium">
                              {formatDate(row.end_date) ||
                                String(row.end_date)}
                            </span>
                          </div>
                        )}
                        {row.ddu_id && (
                          <div className="text-xs text-neutral-600">
                            DDU ID:{" "}
                            <span className="font-medium">
                              {row.ddu_id}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Betaling / admin */}
                      <div className="space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Betaling & admin
                        </div>
                        {row.payment_method && (
                          <div className="text-xs text-neutral-600">
                            Betaling:{" "}
                            <span className="font-medium">
                              {row.payment_method}
                            </span>
                          </div>
                        )}
                        {row.payment_date && (
                          <div className="text-xs text-neutral-600">
                            Senest betalt:{" "}
                            <span className="font-medium">
                              {formatDate(row.payment_date) ||
                                String(row.payment_date)}
                            </span>
                          </div>
                        )}
                        {row.auto_renew && (
                          <div className="text-xs text-neutral-600">
                            Auto-fornyelse:{" "}
                            <span className="font-medium">
                              {String(row.auto_renew).toUpperCase() === "YES"
                                ? "Ja"
                                : "Nej"}
                            </span>
                          </div>
                        )}
                        {row.admin_note && (
                          <div className="text-xs text-neutral-600">
                            Note: {row.admin_note}
                          </div>
                        )}
                        {(row.source || row.source_form_version) && (
                          <div className="text-[11px] text-neutral-400">
                            Kilde: {row.source || "—"}{" "}
                            {row.source_form_version
                              ? `(${row.source_form_version})`
                              : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
/* [HELP:ADMIN:MEDLEMSLISTE:COMPONENT] END */
