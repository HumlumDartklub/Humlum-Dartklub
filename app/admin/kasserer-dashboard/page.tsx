"use client";

/* [HELP:KASSERER_DASH_CLEAN:IMPORTS] START */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
/* [HELP:KASSERER_DASH_CLEAN:IMPORTS] END */

/* [HELP:KASSERER_DASH_CLEAN:TYPES] START */
type Row = Record<string, any>;
type StatusFilter = "DUE" | "NEXT30" | "NEXT90" | "ALL";
type PaymentMode = "NEXT_DUE" | "SELECTED_QUARTER";

type Settings = {
  fiscalStartMonth: number;
  redDays: number;
  yellowDays: number;
  defaultMethod: string;
  statusFilter: StatusFilter;
  paymentMode: PaymentMode;
};

type Sub = {
  key: string;
  persons: Row[];
  rep: Row;
  name: string;
  memberId: string;
  memberCode: string;
  packageTitle: string;
  email: string;
  phone: string;
  cycleMonths: number;
  cycleLabel: string;
  amount: number;
  paymentDate: Date | null;
  paidUntil: Date | null;
  dueDate: Date | null;
  daysToDue: number | null;
};

type VerifiedUpdateResult = {
  original: Row;
  updated: Row;
};
/* [HELP:KASSERER_DASH_CLEAN:TYPES] END */

/* [HELP:KASSERER_DASH_CLEAN:CONFIG] START */
const LS_KEY = "hdk_kasserer_dashboard_clean_v1";

const DEFAULT_SETTINGS: Settings = {
  fiscalStartMonth: 2,
  redDays: 0,
  yellowDays: 30,
  defaultMethod: "MobilePay",
  statusFilter: "DUE",
  paymentMode: "NEXT_DUE",
};
/* [HELP:KASSERER_DASH_CLEAN:CONFIG] END */

/* [HELP:KASSERER_DASH_CLEAN:UTILS] START */
function asText(v: any): string {
  return String(v ?? "").trim();
}

function toUpper(v: any): string {
  return asText(v).toUpperCase();
}

function asNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const cleaned = asText(v).replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function pickFirst(...values: any[]): any {
  for (const v of values) {
    if (asText(v)) return v;
  }
  return "";
}

function parseDateLike(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return startOfDayUTC(v);

  if (typeof v === "number" && Number.isFinite(v) && v > 20000) {
    // Google Sheets / Excel serial date. 1899-12-30 is the common Sheets epoch.
    const ms = Date.UTC(1899, 11, 30) + Math.round(v) * 24 * 60 * 60 * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : startOfDayUTC(d);
  }

  const s = asText(v);
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    return isNaN(d.getTime()) ? null : d;
  }

  const dkDot = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dkDot) {
    const d = new Date(Date.UTC(Number(dkDot[3]), Number(dkDot[2]) - 1, Number(dkDot[1])));
    return isNaN(d.getTime()) ? null : d;
  }

  const dkSlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dkSlash) {
    const d = new Date(Date.UTC(Number(dkSlash[3]), Number(dkSlash[2]) - 1, Number(dkSlash[1])));
    return isNaN(d.getTime()) ? null : d;
  }

  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : startOfDayUTC(fallback);
}

function todayUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUTC(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMonthsUTC(d: Date, months: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate()));
}

function endOfPreviousDayUTC(d: Date): Date {
  return addDaysUTC(d, -1);
}

function daysBetweenUTC(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

function isoDate(d: Date): string {
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getUTCFullYear()}`;
}

function fmtMoney(n: number): string {
  const value = Math.round(Number.isFinite(n) ? n : 0);
  return `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} kr.`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function isActive(row: Row): boolean {
  return toUpper(row.status) === "ACTIVE";
}

function fullName(row: Row): string {
  const name = `${asText(row.first_name)} ${asText(row.last_name)}`.trim();
  return name || asText(row.member_id) || "Ukendt medlem";
}

function isFamily(row: Row): boolean {
  return asText(row.package_key).toLowerCase().includes("famil") || asText(row.package_title).toLowerCase().includes("famil");
}

function subKey(row: Row): string {
  if (isFamily(row)) {
    const email = asText(row.email).toLowerCase();
    const phone = asText(row.phone);
    return `FAMILY:${email || phone || asText(row.member_code) || fullName(row)}`;
  }
  return `PERSON:${asText(row.member_id) || asText(row.member_code) || fullName(row)}`;
}

function cycleMonthsFromRow(row: Row): number {
  const raw = toUpper(pickFirst(row.billing_cycle, row.betalingscyklus, row.payment_cycle, row.cycle));
  if (raw.includes("ÅR") || raw.includes("AAR") || raw.includes("YEAR") || raw.includes("ANNUAL")) return 12;
  if (raw.includes("HALV") || raw.includes("6")) return 6;
  if (raw.includes("MÅN") || raw.includes("MAAN") || raw.includes("MONTH") || raw.includes("MD")) return 1;
  return 3;
}

function cycleLabel(months: number): string {
  if (months === 12) return "År";
  if (months === 6) return "Halvår";
  if (months === 1) return "Måned";
  return "Kvartal";
}

function monthlyPrice(row: Row): number {
  const amount = asNumber(pickFirst(row.price_amount, row.monthly_price, row.pris));
  const unit = asText(pickFirst(row.price_unit, row.unit)).toLowerCase();
  if (!amount) return 0;
  if (unit.includes("år") || unit.includes("aar") || unit.includes("year")) return amount / 12;
  if (unit.includes("halv")) return amount / 6;
  if (unit.includes("kvart")) return amount / 3;
  return amount;
}

function amountForCycle(row: Row, months: number): number {
  const explicit = asNumber(pickFirst(row.periode_beloeb, row.period_amount, row.amount_due, row.amountDue));
  if (explicit > 0) return explicit;
  return monthlyPrice(row) * months;
}

function nextDueForRows(persons: Row[], cycleMonths: number, today: Date): Date | null {
  let best: Date | null = null;

  for (const row of persons) {
    const paidUntil = parseDateLike(row.paid_until);
    const fromPaidUntil = paidUntil ? addDaysUTC(paidUntil, 1) : null;
    const direct = parseDateLike(pickFirst(row.naeste_forfald, row.next_due_date, row.billing_start_date, row.billing_start));

    // paid_until is stronger than an old formula/billing_start date.
    let candidate = fromPaidUntil || direct;
    if (direct && fromPaidUntil && direct.getTime() > fromPaidUntil.getTime()) candidate = direct;

    if (candidate && (!best || candidate.getTime() < best.getTime())) best = candidate;
  }

  if (best) return best;

  const rep = persons[0];
  const base = parseDateLike(pickFirst(rep.payment_date, rep.start_date, rep.grunddato, rep.created_at));
  if (!base) return null;

  let due = addMonthsUTC(base, cycleMonths || 3);
  while (due.getTime() < today.getTime() && daysBetweenUTC(due, today) > 370) {
    due = addMonthsUTC(due, cycleMonths || 3);
  }
  return due;
}

function quarterRange(year: number, quarter: number, fiscalStartMonth: number): { start: Date; end: Date; label: string } {
  const start = new Date(Date.UTC(year, fiscalStartMonth - 1 + (quarter - 1) * 3, 1));
  const end = endOfPreviousDayUTC(addMonthsUTC(start, 3));
  return { start, end, label: `Q${quarter} ${year}` };
}

function quarterForDate(date: Date, fiscalStartMonth: number): { year: number; quarter: number } {
  const startMonth = fiscalStartMonth - 1;
  let year = date.getUTCFullYear();
  let diff = date.getUTCMonth() - startMonth;
  if (diff < 0) {
    diff += 12;
    year -= 1;
  }
  return { year, quarter: clamp(Math.floor(diff / 3) + 1, 1, 4) };
}

function statusText(days: number | null): string {
  if (days === null) return "Mangler dato";
  if (days < 0) return `Forfalden ${Math.abs(days)} dage`;
  if (days === 0) return "Forfalder i dag";
  return `Om ${days} dage`;
}

function statusClass(days: number | null, settings: Settings): string {
  if (days === null) return "bg-neutral-100 text-neutral-700";
  if (days <= settings.redDays) return "bg-red-100 text-red-800";
  if (days <= settings.yellowDays) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

async function fetchTab(tab: string): Promise<Row[]> {
  const res = await fetch(`/api/sheet?tab=${encodeURIComponent(tab)}&_=${Date.now()}`, { method: "GET", cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || `Kunne ikke hente ${tab}`);
  return Array.isArray(data?.items) ? data.items : [];
}
/* [HELP:KASSERER_DASH_CLEAN:UTILS] END */

/* [HELP:KASSERER_DASH_CLEAN:UI_SMALL] START */
function Card(props: { label: string; value: string; note?: string; tone?: "default" | "orange" | "red" | "green" }) {
  const tone = props.tone || "default";
  const border = tone === "red" ? "border-red-200" : tone === "green" ? "border-green-200" : tone === "orange" ? "border-orange-200" : "border-neutral-200";
  return (
    <section className={`rounded-2xl border ${border} bg-white p-4 shadow-sm`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{props.label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-neutral-950">{props.value}</div>
      {props.note ? <div className="mt-1 text-xs text-neutral-500">{props.note}</div> : null}
    </section>
  );
}

function SmallBar(props: { value: number; max: number }) {
  const width = props.max > 0 ? clamp((props.value / props.max) * 100, 0, 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-neutral-100">
      <div className="h-2 rounded-full bg-orange-500" style={{ width: `${width}%` }} />
    </div>
  );
}
/* [HELP:KASSERER_DASH_CLEAN:UI_SMALL] END */

export default function KassererDashboardPage() {
  const today = todayUTC();
  const nowYear = today.getUTCFullYear();
  const currentQuarter = quarterForDate(today, DEFAULT_SETTINGS.fiscalStartMonth).quarter;

  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [year, setYear] = useState(nowYear);
  const [quarter, setQuarter] = useState(currentQuarter);
  const [method, setMethod] = useState(DEFAULT_SETTINGS.defaultMethod);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [openAdjustKey, setOpenAdjustKey] = useState<string | null>(null);
  const [adjustDue, setAdjustDue] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Settings>;
        const next = { ...DEFAULT_SETTINGS, ...saved };
        setSettings(next);
        setMethod(next.defaultMethod || DEFAULT_SETTINGS.defaultMethod);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings, mounted]);

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await fetchTab("MEDLEMMER");
      setRows(items);
      setLastSync(new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (e: any) {
      setError(e?.message || "Kunne ikke hente medlemmer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const activeRows = useMemo(() => rows.filter(isActive), [rows]);

  const subs = useMemo<Sub[]>(() => {
    const groups = new Map<string, Row[]>();
    for (const row of activeRows) {
      const key = subKey(row);
      groups.set(key, [...(groups.get(key) || []), row]);
    }

    return Array.from(groups.entries())
      .map(([key, persons]) => {
        const rep = persons[0];
        const months = cycleMonthsFromRow(rep);
        const due = nextDueForRows(persons, months, today);
        const days = due ? daysBetweenUTC(today, due) : null;
        const paidUntil = persons
          .map((p) => parseDateLike(p.paid_until))
          .filter(Boolean)
          .sort((a, b) => (a!.getTime() - b!.getTime()))[0] || null;

        return {
          key,
          persons,
          rep,
          name: isFamily(rep) ? `Familie: ${fullName(rep)}` : fullName(rep),
          memberId: asText(rep.member_id),
          memberCode: asText(rep.member_code),
          packageTitle: asText(rep.package_title) || "Ukendt pakke",
          email: asText(rep.email).toLowerCase(),
          phone: asText(rep.phone),
          cycleMonths: months,
          cycleLabel: cycleLabel(months),
          amount: amountForCycle(rep, months),
          paymentDate: parseDateLike(rep.payment_date),
          paidUntil,
          dueDate: due,
          daysToDue: days,
        };
      })
      .sort((a, b) => {
        const ad = a.daysToDue ?? 999999;
        const bd = b.daysToDue ?? 999999;
        if (ad !== bd) return ad - bd;
        return a.name.localeCompare(b.name, "da");
      });
  }, [activeRows, today]);

  const selectedQuarter = useMemo(
    () => quarterRange(year, quarter, settings.fiscalStartMonth),
    [year, quarter, settings.fiscalStartMonth]
  );

  const filteredSubs = useMemo(() => {
    if (settings.statusFilter === "ALL") return subs;
    if (settings.statusFilter === "DUE") return subs.filter((s) => (s.daysToDue ?? 999999) <= 0);
    if (settings.statusFilter === "NEXT30") return subs.filter((s) => (s.daysToDue ?? 999999) <= 30);
    return subs.filter((s) => (s.daysToDue ?? 999999) <= 90);
  }, [subs, settings.statusFilter]);

  const summary = useMemo(() => {
    const overdue = subs.filter((s) => (s.daysToDue ?? 999999) <= 0);
    const next30 = subs.filter((s) => (s.daysToDue ?? 999999) > 0 && (s.daysToDue ?? 999999) <= 30);
    const next90 = subs.filter((s) => (s.daysToDue ?? 999999) > 30 && (s.daysToDue ?? 999999) <= 90);
    const filteredAmount = filteredSubs.reduce((sum, s) => sum + s.amount, 0);
    const overdueAmount = overdue.reduce((sum, s) => sum + s.amount, 0);
    const next30Amount = next30.reduce((sum, s) => sum + s.amount, 0);
    const expectedQuarter = subs
      .filter((s) => s.dueDate && s.dueDate.getTime() >= selectedQuarter.start.getTime() && s.dueDate.getTime() <= selectedQuarter.end.getTime())
      .reduce((sum, s) => sum + s.amount, 0);
    const paidQuarter = subs
      .filter((s) => s.paymentDate && s.paymentDate.getTime() >= selectedQuarter.start.getTime() && s.paymentDate.getTime() <= selectedQuarter.end.getTime())
      .reduce((sum, s) => sum + s.amount, 0);

    return {
      overdueCount: overdue.length,
      next30Count: next30.length,
      next90Count: next90.length,
      filteredAmount,
      overdueAmount,
      next30Amount,
      expectedQuarter,
      paidQuarter,
    };
  }, [subs, filteredSubs, selectedQuarter]);

  const quarters = useMemo(() => {
    return [1, 2, 3, 4].map((q) => {
      const r = quarterRange(year, q, settings.fiscalStartMonth);
      const paid = subs
        .filter((s) => s.paymentDate && s.paymentDate.getTime() >= r.start.getTime() && s.paymentDate.getTime() <= r.end.getTime())
        .reduce((sum, s) => sum + s.amount, 0);
      const due = subs
        .filter((s) => s.dueDate && s.dueDate.getTime() >= r.start.getTime() && s.dueDate.getTime() <= r.end.getTime())
        .reduce((sum, s) => sum + s.amount, 0);
      return { q, paid, due };
    });
  }, [subs, year, settings.fiscalStartMonth]);

  const maxQuarterValue = useMemo(() => Math.max(1, ...quarters.flatMap((q) => [q.paid, q.due])), [quarters]);

  function rowNumber(row: Row): number | null {
    const explicit = asNumber(pickFirst(row._row, row.row, row.row_number, row.rowNumber));
    if (explicit > 1) return explicit;
    const idx = rows.indexOf(row);
    return idx >= 0 ? idx + 2 : null;
  }

  async function updateMemberRows(persons: Row[], patch: Row): Promise<VerifiedUpdateResult[]> {
    const updates = persons.map((person) => {
      const row = rowNumber(person);
      if (!row) throw new Error(`Mangler sheet-række for ${fullName(person)}.`);
      return {
        row: String(row),
        original: person,
        data: { ...person, ...patch },
        verify: patch,
      };
    });

    const res = await fetch("/api/admin/kasserer/update-medlemmer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ tab: "MEDLEMMER", updates }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      throw new Error(
        data?.error ||
          data?.message ||
          "Arket blev ikke bekræftet opdateret. Ingen falsk grøn besked her."
      );
    }

    const returned = Array.isArray(data?.updates) ? data.updates : [];
    return returned.map((item: any, index: number) => ({
      original: persons[index],
      updated: item?.item && typeof item.item === "object" ? item.item : updates[index].data,
    }));
  }

  function paymentPeriodForSub(sub: Sub): { start: Date; end: Date; label: string } {
    if (settings.paymentMode === "SELECTED_QUARTER") return selectedQuarter;

    const start = sub.dueDate || today;
    const end = endOfPreviousDayUTC(addMonthsUTC(start, sub.cycleMonths || 3));
    return { start, end, label: `${fmtDate(start)}–${fmtDate(end)}` };
  }

  async function markPaid(sub: Sub) {
    const period = paymentPeriodForSub(sub);
    const nextDue = addDaysUTC(period.end, 1);
    const paidDate = today;
    const patch: Row = {
      payment_method: method,
      payment_date: isoDate(paidDate),
      paid_until: isoDate(period.end),
      billing_start_date: isoDate(nextDue),
      billing_cycle: sub.cycleLabel,
      billing_note: `Betalt ${period.label} via kasserer-dashboard (${method})`,
      updated_at: new Date().toISOString(),
    };

    setSavingKey(sub.key);
    setMessage(null);

    try {
      setSyncing(true);
      const updates = await updateMemberRows(sub.persons, patch);

      setRows((prev) =>
        prev.map((row) => {
          const found = updates.find((u) => u.original === row);
          return found ? found.updated : row;
        })
      );
      setLastSync(new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

      setMessage({
        type: "ok",
        text: `${sub.name} er gemt og bekræftet i arket (${fmtMoney(sub.amount)}) for ${period.label}. Næste forfald: ${fmtDate(nextDue)}.`,
      });
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Betaling kunne ikke gemmes." });
    } finally {
      setSavingKey(null);
      setSyncing(false);
    }
  }

  async function saveAdjustedDue(sub: Sub) {
    const due = parseDateLike(adjustDue);
    if (!due) {
      setMessage({ type: "error", text: "Vælg en gyldig dato til næste forfald." });
      return;
    }

    const patch: Row = {
      billing_start_date: isoDate(due),
      billing_note: `Næste forfald rettet manuelt i kasserer-dashboard`,
      updated_at: new Date().toISOString(),
    };

    setSavingKey(sub.key);
    setMessage(null);

    try {
      setSyncing(true);
      const updates = await updateMemberRows(sub.persons, patch);

      setRows((prev) =>
        prev.map((row) => {
          const found = updates.find((u) => u.original === row);
          return found ? found.updated : row;
        })
      );
      setLastSync(new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setOpenAdjustKey(null);
      setAdjustDue("");
      setMessage({ type: "ok", text: `${sub.name}: næste forfald er gemt og bekræftet i arket: ${fmtDate(due)}.` });
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Dato kunne ikke gemmes." });
    } finally {
      setSavingKey(null);
      setSyncing(false);
    }
  }

  function openAdjust(sub: Sub) {
    setOpenAdjustKey(openAdjustKey === sub.key ? null : sub.key);
    setAdjustDue(sub.dueDate ? isoDate(sub.dueDate) : isoDate(today));
  }

  function reminderMailto(sub: Sub): string {
    const subject = encodeURIComponent("Påmindelse om kontingent – Humlum Dartklub");
    const body = encodeURIComponent(
      `Hej ${sub.name.replace(/^Familie: /, "")}\n\n` +
        `Vi kan se, at kontingentet hos Humlum Dartklub står til betaling.\n\n` +
        `Beløb: ${fmtMoney(sub.amount)}\n` +
        `Forfald: ${fmtDate(sub.dueDate)}\n\n` +
        `Når betalingen er registreret, markerer vi perioden som betalt i systemet.\n\n` +
        `Venlig hilsen\nHumlum Dartklub`
    );
    return `mailto:${encodeURIComponent(sub.email)}?subject=${subject}&body=${body}`;
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Admin · Kasserer</div>
          <h1 className="text-2xl font-semibold text-neutral-950">Kasserer-dashboard</h1>
          <p className="text-sm text-neutral-600">Ren kontingent-visning. Data læses fra MEDLEMMER i HDK_Admin_v3.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={loadRows} disabled={loading || syncing} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-neutral-50 disabled:opacity-60">
            {loading || syncing ? "Synker…" : "↻ Opdatér"}
          </button>
          <button onClick={() => setSettingsOpen(true)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-neutral-50">
            ⚙️ Indstillinger
          </button>
          <Link href="/admin" className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-neutral-50">
            ← Admin-forside
          </Link>
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Fejl: {error}</div> : null}
      {message ? (
        <div className={`rounded-2xl border p-4 text-sm ${message.type === "ok" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      ) : null}

      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-500 shadow-sm">
        Status: {syncing ? "Gemmer og kontrollerer direkte i Google Sheet…" : lastSync ? `Senest læst fra arket kl. ${lastSync}` : "Afventer første indlæsning"}
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Valgt kvartal</div>
            <div className="text-lg font-semibold text-neutral-950">
              {selectedQuarter.label} <span className="text-sm font-normal text-neutral-500">({fmtDate(selectedQuarter.start)} – {fmtDate(selectedQuarter.end)})</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
              År
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="outline-none">
                {[nowYear - 1, nowYear, nowYear + 1, nowYear + 2].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
              Kvartal
              <select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))} className="outline-none">
                {[1, 2, 3, 4].map((q) => <option key={q} value={q}>Q{q}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
              Betaling
              <select value={settings.paymentMode} onChange={(e) => setSettings((s) => ({ ...s, paymentMode: e.target.value as PaymentMode }))} className="outline-none">
                <option value="NEXT_DUE">Næste forfald</option>
                <option value="SELECTED_QUARTER">Valgt kvartal</option>
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
              Metode
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="outline-none">
                <option value="MobilePay">MobilePay</option>
                <option value="Bankoverførsel">Bankoverførsel</option>
                <option value="Kontant">Kontant</option>
                <option value="Andet">Andet</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <Card label="Aktive medlemmer" value={`${activeRows.length} stk`} note={`${subs.length} betalingsaftaler`} />
        <Card label="Forfalden nu" value={fmtMoney(summary.overdueAmount)} note={`${summary.overdueCount} skal håndteres`} tone="red" />
        <Card label="Næste 30 dage" value={fmtMoney(summary.next30Amount)} note={`${summary.next30Count} kommende`} tone="orange" />
        <Card label={`Indbetalt ${selectedQuarter.label}`} value={fmtMoney(summary.paidQuarter)} note="ud fra payment_date" tone="green" />
        <Card label="Vist samlet" value={fmtMoney(summary.filteredAmount)} note={`${filteredSubs.length} rækker i listen`} />
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Kvartals-overblik</h2>
            <p className="text-xs text-neutral-500">Orange = indbetalt efter payment_date. Sort = forventet efter næste forfald.</p>
          </div>
          <div className="text-sm text-neutral-700">
            Forfalder i {selectedQuarter.label}: <span className="font-semibold tabular-nums">{fmtMoney(summary.expectedQuarter)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quarters.map((item) => (
            <button
              key={item.q}
              onClick={() => setQuarter(item.q)}
              className={`rounded-2xl border p-3 text-left transition hover:bg-neutral-50 ${quarter === item.q ? "border-orange-300 bg-orange-50" : "border-neutral-200 bg-white"}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold">Q{item.q}</div>
                {quarter === item.q ? <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">Valgt</span> : null}
              </div>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-neutral-500"><span>Indbetalt</span><span>{fmtMoney(item.paid)}</span></div>
                  <SmallBar value={item.paid} max={maxQuarterValue} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-neutral-500"><span>Forfalder</span><span>{fmtMoney(item.due)}</span></div>
                  <div className="h-2 w-full rounded-full bg-neutral-100">
                    <div className="h-2 rounded-full bg-neutral-900" style={{ width: `${clamp((item.due / maxQuarterValue) * 100, 0, 100)}%` }} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Opkrævning</h2>
            <p className="text-xs text-neutral-500">Standard viser kun forfaldne. Skift filter, hvis du vil se kommende Q3/Q4.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
              Vis
              <select value={settings.statusFilter} onChange={(e) => setSettings((s) => ({ ...s, statusFilter: e.target.value as StatusFilter }))} className="outline-none">
                <option value="DUE">Forfaldne</option>
                <option value="NEXT30">Forfaldne + 30 dage</option>
                <option value="NEXT90">Forfaldne + 90 dage</option>
                <option value="ALL">Alle</option>
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">Loader kasserer-data…</div>
        ) : filteredSubs.length === 0 ? (
          <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">Ingen medlemmer i denne visning. Det er jo næsten for nemt. 😄</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="py-2 pr-3">Medlem</th>
                  <th className="py-2 pr-3">Pakke</th>
                  <th className="py-2 pr-3 text-right">Beløb</th>
                  <th className="py-2 pr-3">Sidst betalt</th>
                  <th className="py-2 pr-3">Betalt til</th>
                  <th className="py-2 pr-3">Næste forfald</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Handling</th>
                  <th className="py-2 pr-3">Kontakt</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map((sub) => {
                  const period = paymentPeriodForSub(sub);
                  const isSaving = savingKey === sub.key;
                  return (
                    <tr key={sub.key} className="border-b border-neutral-100 align-top">
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-neutral-950">{sub.name}</div>
                        <div className="text-xs text-neutral-500">{sub.memberId || sub.memberCode || "—"}</div>
                      </td>
                      <td className="py-3 pr-3">
                        <div>{sub.packageTitle}</div>
                        <div className="text-xs text-neutral-500">{sub.cycleLabel}</div>
                      </td>
                      <td className="py-3 pr-3 text-right font-semibold tabular-nums">{fmtMoney(sub.amount)}</td>
                      <td className="py-3 pr-3 tabular-nums">{fmtDate(sub.paymentDate)}</td>
                      <td className="py-3 pr-3 tabular-nums">{fmtDate(sub.paidUntil)}</td>
                      <td className="py-3 pr-3 tabular-nums">{fmtDate(sub.dueDate)}</td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass(sub.daysToDue, settings)}`}>
                          {statusText(sub.daysToDue)}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={isSaving || syncing}
                            onClick={() => markPaid(sub)}
                            className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                            title={`Marker betaling for ${period.label}`}
                          >
                            {isSaving ? "Kontrollerer…" : `Marker betalt`}
                          </button>
                          <div className="text-[11px] text-neutral-500">Dækker: {period.label}</div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => openAdjust(sub)} className="text-xs font-semibold text-neutral-700 underline underline-offset-2">
                              Ret forfald
                            </button>
                            {sub.email ? (
                              <a href={reminderMailto(sub)} className="text-xs font-semibold text-neutral-700 underline underline-offset-2">
                                Mail reminder
                              </a>
                            ) : null}
                          </div>
                          {openAdjustKey === sub.key ? (
                            <div className="mt-1 rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                              <label className="block text-[11px] font-semibold uppercase text-neutral-500">Ny forfaldsdato</label>
                              <div className="mt-1 flex gap-2">
                                <input
                                  type="date"
                                  value={adjustDue}
                                  onChange={(e) => setAdjustDue(e.target.value)}
                                  className="w-36 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
                                />
                                <button
                                  type="button"
                                  disabled={isSaving || syncing}
                                  onClick={() => saveAdjustedDue(sub)}
                                  className="rounded-lg bg-neutral-900 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                  Gem
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-xs">
                        <div>{sub.email || "—"}</div>
                        {sub.phone ? <div className="text-neutral-500">{sub.phone}</div> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-neutral-800">
        <div className="font-semibold">Vigtigt princip</div>
        <div className="mt-1">
          Listen viser <b>opkrævninger</b>, ikke “alle er betalt”. Knappen markerer en handling. Når en betaling gemmes, viser siden først succes, når ændringen er læst tilbage fra Google Sheet. Hvis arket ikke er opdateret, får du en fejl i stedet for en falsk grøn besked.
        </div>
      </section>

      {settingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 md:items-center">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Kasserer-indstillinger</div>
                <div className="text-xs text-neutral-500">Gemmes lokalt i browseren. Ikke i Google Sheet endnu.</div>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50">Luk</button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-neutral-200 p-3">
                <label className="text-sm font-semibold">HDK-år starter i måned</label>
                <select
                  value={settings.fiscalStartMonth}
                  onChange={(e) => setSettings((s) => ({ ...s, fiscalStartMonth: Number(e.target.value) }))}
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="rounded-xl border border-neutral-200 p-3 text-sm font-semibold">
                  Rød ved ≤ dage
                  <input
                    type="number"
                    value={settings.redDays}
                    onChange={(e) => setSettings((s) => ({ ...s, redDays: Number(e.target.value) }))}
                    className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="rounded-xl border border-neutral-200 p-3 text-sm font-semibold">
                  Gul ved ≤ dage
                  <input
                    type="number"
                    value={settings.yellowDays}
                    onChange={(e) => setSettings((s) => ({ ...s, yellowDays: Number(e.target.value) }))}
                    className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="rounded-xl border border-neutral-200 p-3 text-sm font-semibold">
                  Standard visning
                  <select
                    value={settings.statusFilter}
                    onChange={(e) => setSettings((s) => ({ ...s, statusFilter: e.target.value as StatusFilter }))}
                    className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  >
                    <option value="DUE">Forfaldne</option>
                    <option value="NEXT30">Forfaldne + 30 dage</option>
                    <option value="NEXT90">Forfaldne + 90 dage</option>
                    <option value="ALL">Alle</option>
                  </select>
                </label>
                <label className="rounded-xl border border-neutral-200 p-3 text-sm font-semibold">
                  Standard betalingsmetode
                  <select
                    value={settings.defaultMethod}
                    onChange={(e) => {
                      setSettings((s) => ({ ...s, defaultMethod: e.target.value }));
                      setMethod(e.target.value);
                    }}
                    className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  >
                    <option value="MobilePay">MobilePay</option>
                    <option value="Bankoverførsel">Bankoverførsel</option>
                    <option value="Kontant">Kontant</option>
                    <option value="Andet">Andet</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
