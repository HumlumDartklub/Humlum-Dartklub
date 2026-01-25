"use client";

/* [HELP:KASSERER_DASH_V5:IMPORTS] START */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
/* [HELP:KASSERER_DASH_V5:IMPORTS] END */

/* [HELP:KASSERER_DASH_V5:TYPES] START */
type Row = Record<string, any>;
type ViewMode = "MONTH" | "QUARTER" | "YEAR";
type Mode = "CASH" | "DUE" | "COVERAGE";
type Tab = "DRIFT" | "OVERVIEW";

type Config = {
  fiscalStartMonth: number; // 1-12
  startFromNextMonth: boolean; // coverage: gælder fra næste måned

  // Fornyelser
  horizonDays: number;
  redDays: number;
  yellowDays: number;
  greenDays: number;

  // Targets (Overblik)
  targetMembers: number; // fx 30
  targetYearCash: number; // fx 40000
  targetQuarterCash: number; // fx 10000
};

type Sub = {
  key: string;
  persons: Row[];
  rep: Row;

  packageTitle: string;
  email?: string;
  phone?: string;

  cycleMonths: number; // 3 eller 12 (fra betalingscyklus)
  amountDue: number; // periode_beloeb (fx 387/597/1548)

  // DUE = forfalder
  dueDate: Date | null; // naeste_forfald
  daysToDue: number | null; // dage_til_forfald

  // CASH = kontant indbetaling (payment_date)
  cashDate: Date | null; // payment_date
  cashAmount: number; // samme som amountDue (den betaling der kom ind)

  // COVERAGE = “dækker perioden” (periodiseret)
  coverageStart: Date | null;
  coverageEnd: Date | null;
};
/* [HELP:KASSERER_DASH_V5:TYPES] END */

/* [HELP:KASSERER_DASH_V5:UTILS] START */
const LS_KEY = "hdk_kasserer_dashboard_conf_v5";

async function fetchTab(tab: string): Promise<any[]> {
  const res = await fetch(`/api/sheet?tab=${encodeURIComponent(tab)}`, { method: "GET", cache: "no-store" });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || `Kunne ikke hente ${tab}`);
  return Array.isArray(data?.items) ? (data.items as any[]) : [];
}

function asText(v: any): string {
  return String(v ?? "").trim();
}
function toUpper(v: any): string {
  return asText(v).toUpperCase();
}
function asNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = asText(v).replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseDateLike(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  const s = asText(v);
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]) - 1;
    const d = Number(iso[3]);
    const dt = new Date(Date.UTC(y, m, d));
    return isNaN(dt.getTime()) ? null : dt;
  }

  const dk = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dk) {
    const d = Number(dk[1]);
    const m = Number(dk[2]) - 1;
    const y = Number(dk[3]);
    const dt = new Date(Date.UTC(y, m, d));
    return isNaN(dt.getTime()) ? null : dt;
  }

  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

// Stabil DK-format uden Intl (undgår hydration mismatch)
function fmtDkDate(d: Date | null): string {
  if (!d) return "—";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = d.getUTCFullYear();
  return `${dd}.${mm}.${yy}`;
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}
function formatCurrencyDKK(n: number): string {
  const v = Math.round(n);
  return new Intl.NumberFormat("da-DK").format(v) + " kr.";
}

function todayUTC(): Date {
  const t = new Date();
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
}
function addMonthsUTC(d: Date, months: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate()));
}
function endOfPrevDayUTC(d: Date): Date {
  return new Date(d.getTime() - 24 * 60 * 60 * 1000);
}
function startOfNextMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}
function startOfSameDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function rangeForSelection(
  year: number,
  view: ViewMode,
  quarter: number,
  month: number,
  fiscalStartMonth: number
): { start: Date; end: Date; label: string } {
  const y = year;

  if (view === "MONTH") {
    const start = new Date(Date.UTC(y, month - 1, 1));
    const end = new Date(Date.UTC(y, month, 0));
    return { start, end, label: `${String(month).padStart(2, "0")}/${y}` };
  }

  const fyStart = new Date(Date.UTC(y, fiscalStartMonth - 1, 1));

  if (view === "YEAR") {
    const start = fyStart;
    const end = endOfPrevDayUTC(addMonthsUTC(fyStart, 12));
    return { start, end, label: `HDK År ${y} (starter ${String(fiscalStartMonth).padStart(2, "0")})` };
  }

  const qStart = addMonthsUTC(fyStart, (quarter - 1) * 3);
  const qEnd = endOfPrevDayUTC(addMonthsUTC(qStart, 3));
  return { start: qStart, end: qEnd, label: `Q${quarter} ${y}` };
}

function isActive(r: Row): boolean {
  return toUpper(r.status) === "ACTIVE";
}
function isFamilyPackage(r: Row): boolean {
  return asText(r.package_title).toLowerCase().includes("famil");
}
function fullName(r: Row): string {
  const fn = asText(r.first_name);
  const ln = asText(r.last_name);
  return (fn + " " + ln).trim() || asText(r.member_id) || "—";
}
function subKey(r: Row): string {
  if (isFamilyPackage(r)) {
    const email = asText(r.email).toLowerCase();
    const phone = asText(r.phone);
    return `FAMILY:${email || phone || fullName(r)}`;
  }
  return `PERSON:${asText(r.member_id) || fullName(r)}`;
}
function cycleMonthsFromRow(r: Row): number {
  const c = toUpper(r.betalingscyklus);
  if (c.includes("ÅR") || c.includes("AAR") || c.includes("YEAR")) return 12;
  return 3;
}

// Overlap i hele måneder (UTC) til periodisering (COVERAGE)
function overlapMonthsUTC(aStart: Date | null, aEnd: Date | null, bStart: Date, bEnd: Date): number {
  if (!aStart || !aEnd) return 0;
  const s = new Date(Math.max(aStart.getTime(), bStart.getTime()));
  const e = new Date(Math.min(aEnd.getTime(), bEnd.getTime()));
  if (s.getTime() > e.getTime()) return 0;

  const sIdx = s.getUTCFullYear() * 12 + s.getUTCMonth();
  const eIdx = e.getUTCFullYear() * 12 + e.getUTCMonth();
  return Math.max(0, eIdx - sIdx + 1);
}
function coverageValueInRange(s: Sub, start: Date, end: Date): number {
  const m = overlapMonthsUTC(s.coverageStart, s.coverageEnd, start, end);
  if (!m) return 0;
  if (!s.amountDue || !s.cycleMonths) return 0;
  return s.amountDue * (m / s.cycleMonths);
}

function pillClass(days: number | null, conf: Config): string {
  if (days === null) return "bg-neutral-100 text-neutral-700";
  if (days <= conf.redDays) return "bg-red-100 text-red-800";
  if (days <= conf.yellowDays) return "bg-yellow-100 text-yellow-800";
  if (days <= conf.greenDays) return "bg-green-100 text-green-800";
  return "bg-neutral-100 text-neutral-700";
}
/* [HELP:KASSERER_DASH_V5:UTILS] END */

/* [HELP:KASSERER_DASH_V5:UI] START */
function SegTabs(props: { value: Tab; onChange: (v: Tab) => void }) {
  return (
    <div className="inline-flex rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm">
      <button
        onClick={() => props.onChange("DRIFT")}
        className={`rounded-xl px-3 py-2 text-sm transition ${
          props.value === "DRIFT" ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-50"
        }`}
      >
        Drift
      </button>
      <button
        onClick={() => props.onChange("OVERVIEW")}
        className={`rounded-xl px-3 py-2 text-sm transition ${
          props.value === "OVERVIEW" ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-50"
        }`}
      >
        Overblik
      </button>
    </div>
  );
}

function ProgressCard(props: { title: string; value: number; target: number; suffix?: string }) {
  const pct = props.target > 0 ? clamp((props.value / props.target) * 100, 0, 999) : 0;
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{props.title}</div>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold tabular-nums">
          {props.suffix ? `${Math.round(props.value)} ${props.suffix}` : formatCurrencyDKK(props.value)}
        </div>
        <div className="text-sm text-neutral-500 tabular-nums">
          Mål: {props.suffix ? `${Math.round(props.target)} ${props.suffix}` : formatCurrencyDKK(props.target)}
        </div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-neutral-100">
        <div className="h-2 rounded-full bg-orange-500" style={{ width: `${clamp(pct, 0, 100)}%` }} />
      </div>
      <div className="mt-2 text-xs text-neutral-500 tabular-nums">{Math.round(pct)}%</div>
    </section>
  );
}

function QuarterBars(props: { title: string; points: { label: string; value: number; hint?: string }[]; selected?: string }) {
  const max = Math.max(1, ...props.points.map((p) => p.value));
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">{props.title}</h2>
      <div className="grid grid-cols-4 gap-3">
        {props.points.map((p) => {
          const pct = clamp((p.value / max) * 100, 0, 100);
          const selected = props.selected === p.label;
          return (
            <div key={p.label} className="rounded-xl border border-neutral-200 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-neutral-600">{p.label}</div>
                {selected ? (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                    Valgt
                  </span>
                ) : null}
              </div>
              <div className="mt-2 h-24 w-full rounded-xl bg-neutral-50 flex items-end justify-center">
                <div className="w-6 rounded-md bg-orange-500" style={{ height: `${pct}%` }} />
              </div>
              <div className="mt-2 text-sm font-semibold tabular-nums">{formatCurrencyDKK(p.value)}</div>
              {p.hint ? <div className="text-xs text-neutral-500">{p.hint}</div> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BarList(props: {
  title: string;
  items: { label: string; value: number; hint?: string }[];
  valueFormatter?: (n: number) => string;
}) {
  const max = Math.max(1, ...props.items.map((x) => x.value));
  const fmt = props.valueFormatter || ((n) => String(n));
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">{props.title}</h2>
      <div className="space-y-2">
        {props.items.length === 0 && <div className="text-sm text-neutral-500">Ingen data.</div>}
        {props.items.map((it) => {
          const pct = clamp((it.value / max) * 100, 0, 100);
          return (
            <div key={it.label} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4 truncate text-sm font-medium">{it.label}</div>
              <div className="col-span-6">
                <div className="h-2 w-full rounded-full bg-neutral-100">
                  <div className="h-2 rounded-full bg-orange-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="col-span-2 text-right text-sm tabular-nums">{fmt(it.value)}</div>
              {it.hint ? <div className="col-span-12 text-xs text-neutral-500 -mt-1">{it.hint}</div> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MiniCompare(props: { title: string; leftLabel: string; left: number; rightLabel: string; right: number }) {
  const max = Math.max(1, props.left, props.right);
  const lPct = clamp((props.left / max) * 100, 0, 100);
  const rPct = clamp((props.right / max) * 100, 0, 100);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">{props.title}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-neutral-200 p-3">
          <div className="text-xs uppercase text-neutral-500">{props.leftLabel}</div>
          <div className="mt-2 h-20 w-full rounded-xl bg-neutral-50 flex items-end justify-center">
            <div className="w-6 rounded-md bg-orange-500" style={{ height: `${lPct}%` }} />
          </div>
          <div className="mt-2 text-sm font-semibold tabular-nums">{formatCurrencyDKK(props.left)}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 p-3">
          <div className="text-xs uppercase text-neutral-500">{props.rightLabel}</div>
          <div className="mt-2 h-20 w-full rounded-xl bg-neutral-50 flex items-end justify-center">
            <div className="w-6 rounded-md bg-neutral-900" style={{ height: `${rPct}%` }} />
          </div>
          <div className="mt-2 text-sm font-semibold tabular-nums">{formatCurrencyDKK(props.right)}</div>
        </div>
      </div>
    </section>
  );
}
/* [HELP:KASSERER_DASH_V5:UI] END */

export default function KassererDashboardPage() {
  const now = todayUTC();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [tab, setTab] = useState<Tab>("DRIFT");

  // default = CASH (som du bad om)
  const [mode, setMode] = useState<Mode>("CASH");
  const [view, setView] = useState<ViewMode>("QUARTER");
  const [year, setYear] = useState<number>(currentYear);
  const [quarter, setQuarter] = useState<number>(1);
  const [month, setMonth] = useState<number>(currentMonth);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [dataTabUsed, setDataTabUsed] = useState<string>("");

  const [confOpen, setConfOpen] = useState(false);
  const [showAllRenewals, setShowAllRenewals] = useState(false);

  const [conf, setConf] = useState<Config>(() => {
    // SSR-safe localStorage
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(LS_KEY);
        if (raw) return JSON.parse(raw) as Config;
      } catch {}
    }
    return {
      fiscalStartMonth: 2,
      startFromNextMonth: false,
      horizonDays: 90,
      redDays: 7,
      yellowDays: 21,
      greenDays: 60,
      targetMembers: 30,
      targetYearCash: 40000,
      targetQuarterCash: 10000,
    };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(conf));
    } catch {}
  }, [conf]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const tryTabs = ["KASSERER_DASH_SORT", "KASSERER_DASH"];
        let data: any[] = [];
        let used = "";

        for (const t of tryTabs) {
          try {
            const items = await fetchTab(t);
            if (Array.isArray(items) && items.length) {
              data = items;
              used = t;
              break;
            }
          } catch {}
        }
        if (!used) throw new Error("Kunne ikke hente KASSERER_DASH_SORT/KASSERER_DASH via /api/sheet.");

        if (cancelled) return;
        setRows(data as Row[]);
        setDataTabUsed(used);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Kunne ikke hente data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const yearOptions = useMemo(() => {
    const ys = new Set<number>();
    for (const r of rows) {
      const d = parseDateLike(r.payment_date) || parseDateLike(r.naeste_forfald) || parseDateLike(r.start_date);
      if (d) ys.add(d.getUTCFullYear());
    }
    const list = Array.from(ys.values()).sort((a, b) => a - b);
    const min = list.length ? Math.min(...list, currentYear) : currentYear;
    const max = (list.length ? Math.max(...list, currentYear) : currentYear) + 2;
    const out: number[] = [];
    for (let y = min; y <= max; y++) out.push(y);
    return out;
  }, [rows, currentYear]);

  const selection = useMemo(
    () => rangeForSelection(year, view, quarter, month, conf.fiscalStartMonth),
    [year, view, quarter, month, conf.fiscalStartMonth]
  );

  const yearRange = useMemo(
    () => rangeForSelection(year, "YEAR", 1, 1, conf.fiscalStartMonth),
    [year, conf.fiscalStartMonth]
  );

  const activeRows = useMemo(() => rows.filter(isActive), [rows]);

  const subs = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of activeRows) {
      const k = subKey(r);
      map.set(k, [...(map.get(k) || []), r]);
    }

    const out: Sub[] = [];
    for (const [key, persons] of map.entries()) {
      const rep = persons[0];

      // due (naeste_forfald) - tidligste
      let due: Date | null = null;
      let days: number | null = null;
      for (const p of persons) {
        const d = parseDateLike(p.naeste_forfald);
        const dd = Number.isFinite(asNumber(p.dage_til_forfald)) ? asNumber(p.dage_til_forfald) : null;
        if (d && (!due || d.getTime() < due.getTime())) due = d;
        if (dd !== null && (days === null || dd < days)) days = dd;
      }

      const pkg = asText(rep.package_title) || "(Ukendt pakke)";
      const email = asText(rep.email).toLowerCase() || undefined;
      const phone = asText(rep.phone) || undefined;

      const cycleMonths = cycleMonthsFromRow(rep);
      const amountDue = asNumber(rep.periode_beloeb);

      // cash
      const cashDate = parseDateLike(rep.payment_date);
      const cashAmount = amountDue;

      // coverage
      const base = cashDate || parseDateLike(rep.start_date) || parseDateLike(rep.grunddato);
      const coverageStart = base ? (conf.startFromNextMonth ? startOfNextMonthUTC(base) : startOfSameDayUTC(base)) : null;
      const coverageEnd = coverageStart ? endOfPrevDayUTC(addMonthsUTC(coverageStart, cycleMonths)) : null;

      out.push({
        key,
        persons,
        rep,
        packageTitle: pkg,
        email,
        phone,
        cycleMonths,
        amountDue,
        dueDate: due,
        daysToDue: days,
        cashDate,
        cashAmount,
        coverageStart,
        coverageEnd,
      });
    }

    return out;
  }, [activeRows, conf.startFromNextMonth]);

  // --- DRIFT (periodetal pr mode) ---
  const periodSubs = useMemo(() => {
    const sMs = selection.start.getTime();
    const eMs = selection.end.getTime();

    if (mode === "CASH") {
      return subs
        .filter((s) => s.cashDate && s.cashDate.getTime() >= sMs && s.cashDate.getTime() <= eMs)
        .sort((a, b) => (a.cashDate!.getTime() - b.cashDate!.getTime()));
    }
    if (mode === "DUE") {
      return subs
        .filter((s) => s.dueDate && s.dueDate.getTime() >= sMs && s.dueDate.getTime() <= eMs)
        .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()));
    }
    // COVERAGE
    return subs.filter((s) => coverageValueInRange(s, selection.start, selection.end) > 0);
  }, [subs, selection, mode]);

  const periodSum = useMemo(() => {
    if (mode === "CASH") return periodSubs.reduce((acc, s) => acc + (s.cashAmount || 0), 0);
    if (mode === "DUE") return periodSubs.reduce((acc, s) => acc + (s.amountDue || 0), 0);
    return subs.reduce((acc, s) => acc + coverageValueInRange(s, selection.start, selection.end), 0);
  }, [periodSubs, subs, selection, mode]);

  const quarterSeries = useMemo(() => {
    const points: { label: string; value: number; hint?: string }[] = [];
    for (let q = 1; q <= 4; q++) {
      const r = rangeForSelection(year, "QUARTER", q, 1, conf.fiscalStartMonth);

      if (mode === "CASH") {
        const list = subs.filter(
          (s) => s.cashDate && s.cashDate.getTime() >= r.start.getTime() && s.cashDate.getTime() <= r.end.getTime()
        );
        const sum = list.reduce((acc, s) => acc + (s.cashAmount || 0), 0);
        points.push({ label: `Q${q}`, value: sum, hint: `${list.length} betaling` });
      } else if (mode === "DUE") {
        const list = subs.filter(
          (s) => s.dueDate && s.dueDate.getTime() >= r.start.getTime() && s.dueDate.getTime() <= r.end.getTime()
        );
        const sum = list.reduce((acc, s) => acc + (s.amountDue || 0), 0);
        points.push({ label: `Q${q}`, value: sum, hint: `${list.length} forfalder` });
      } else {
        // COVERAGE
        const sum = subs.reduce((acc, s) => acc + coverageValueInRange(s, r.start, r.end), 0);
        const covered = subs.filter((s) => coverageValueInRange(s, r.start, r.end) > 0).length;
        points.push({ label: `Q${q}`, value: sum, hint: `${covered} dækket` });
      }
    }
    return points;
  }, [subs, year, conf.fiscalStartMonth, mode]);

  const amountByPackage = useMemo(() => {
    const map = new Map<string, { amount: number; subs: number }>();

    if (mode === "CASH") {
      for (const s of periodSubs) {
        const key = s.packageTitle;
        const prev = map.get(key) || { amount: 0, subs: 0 };
        map.set(key, { amount: prev.amount + (s.cashAmount || 0), subs: prev.subs + 1 });
      }
    } else if (mode === "DUE") {
      for (const s of periodSubs) {
        const key = s.packageTitle;
        const prev = map.get(key) || { amount: 0, subs: 0 };
        map.set(key, { amount: prev.amount + (s.amountDue || 0), subs: prev.subs + 1 });
      }
    } else {
      // COVERAGE
      for (const s of subs) {
        const v = coverageValueInRange(s, selection.start, selection.end);
        if (v <= 0) continue;
        const key = s.packageTitle;
        const prev = map.get(key) || { amount: 0, subs: 0 };
        map.set(key, { amount: prev.amount + v, subs: prev.subs + 1 });
      }
    }

    return Array.from(map.entries())
      .map(([k, v]) => ({ label: k, value: v.amount, hint: `${v.subs} betaling` }))
      .sort((a, b) => b.value - a.value);
  }, [mode, periodSubs, subs, selection]);

  const membersByPackage = useMemo(() => {
    const map = new Map<string, { persons: number; subs: number }>();
    for (const s of subs) {
      const key = s.packageTitle;
      const prev = map.get(key) || { persons: 0, subs: 0 };
      map.set(key, { persons: prev.persons + s.persons.length, subs: prev.subs + 1 });
    }
    return Array.from(map.entries())
      .map(([k, v]) => ({ label: k, value: v.persons, hint: v.subs !== v.persons ? `${v.subs} betaling` : undefined }))
      .sort((a, b) => b.value - a.value);
  }, [subs]);

  // Næste kvartal: Cash vs Forventet (forfalder)
  const nextQuarter = useMemo(() => {
    if (view !== "QUARTER") return null;
    const nextQ = quarter === 4 ? 1 : quarter + 1;
    const nextY = quarter === 4 ? year + 1 : year;
    const r = rangeForSelection(nextY, "QUARTER", nextQ, 1, conf.fiscalStartMonth);

    const cash = subs
      .filter((s) => s.cashDate && s.cashDate.getTime() >= r.start.getTime() && s.cashDate.getTime() <= r.end.getTime())
      .reduce((acc, s) => acc + (s.cashAmount || 0), 0);

    const due = subs
      .filter((s) => s.dueDate && s.dueDate.getTime() >= r.start.getTime() && s.dueDate.getTime() <= r.end.getTime())
      .reduce((acc, s) => acc + (s.amountDue || 0), 0);

    const coverage = subs.reduce((acc, s) => acc + coverageValueInRange(s, r.start, r.end), 0);

    return { nextQ, nextY, cash, due, coverage };
  }, [view, quarter, year, subs, conf.fiscalStartMonth]);

  // Fornyelser
  const renewals = useMemo(() => {
    const maxMs = now.getTime() + conf.horizonDays * 24 * 60 * 60 * 1000;
    const all = subs
      .filter((s) => s.dueDate && s.daysToDue !== null)
      .sort((a, b) => (a.daysToDue ?? 999999) - (b.daysToDue ?? 999999));
    if (showAllRenewals) return all;
    return all.filter((s) => s.dueDate!.getTime() <= maxMs);
  }, [subs, now, conf.horizonDays, showAllRenewals]);

  const renewalCounts = useMemo(() => {
    let red = 0,
      yellow = 0,
      green = 0;
    for (const s of renewals) {
      const d = s.daysToDue;
      if (d === null) continue;
      if (d <= conf.redDays) red++;
      else if (d <= conf.yellowDays) yellow++;
      else if (d <= conf.greenDays) green++;
    }
    return { red, yellow, green, shown: renewals.length };
  }, [renewals, conf]);

  // --- OVERBLIK (targets) ---
  const cashYear = useMemo(() => {
    const sMs = yearRange.start.getTime();
    const eMs = yearRange.end.getTime();
    return subs
      .filter((s) => s.cashDate && s.cashDate.getTime() >= sMs && s.cashDate.getTime() <= eMs)
      .reduce((acc, s) => acc + (s.cashAmount || 0), 0);
  }, [subs, yearRange]);

  const dueYear = useMemo(() => {
    const sMs = yearRange.start.getTime();
    const eMs = yearRange.end.getTime();
    return subs
      .filter((s) => s.dueDate && s.dueDate.getTime() >= sMs && s.dueDate.getTime() <= eMs)
      .reduce((acc, s) => acc + (s.amountDue || 0), 0);
  }, [subs, yearRange]);

  const annualRunRate = useMemo(() => {
    // mere “bestyrelses-agtigt”: hvad giver de nuværende subs på et år
    return subs.reduce((acc, s) => {
      if (!s.amountDue) return acc;
      if (s.cycleMonths === 12) return acc + s.amountDue;
      if (s.cycleMonths === 3) return acc + s.amountDue * 4;
      return acc + s.amountDue * Math.round(12 / s.cycleMonths);
    }, 0);
  }, [subs]);

  const periodLabel = useMemo(() => {
    if (mode === "CASH") return "Indbetalt (cash) i perioden";
    if (mode === "DUE") return "Forfalder (forventet) i perioden";
    return "Dækket (periodiseret) i perioden";
  }, [mode]);

  const modeHint = useMemo(() => {
    if (mode === "CASH") return "Cash = betalinger med payment_date i perioden.";
    if (mode === "DUE") return "Forfalder = naeste_forfald i perioden.";
    return "Dækket = betaling periodiseret ud fra cyklus (kvartal/år).";
  }, [mode]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Admin · Kasserer</div>
          <h1 className="text-2xl font-semibold">Kasserer Dashboard</h1>
          <p className="text-sm text-neutral-600">
            Data læses fra <span className="font-semibold">{dataTabUsed || "…"}</span> i HDK_Admin_v3
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* [HELP:KASSERER_DASH_V5:TABS] START */}
          <SegTabs value={tab} onChange={setTab} />
          {/* [HELP:KASSERER_DASH_V5:TABS] END */}

          <Link href="/admin" className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm hover:opacity-90">
            ← Tilbage
          </Link>
          <button
            onClick={() => setConfOpen(true)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm hover:opacity-90"
          >
            ⚙️ Conf
          </button>
        </div>
      </header>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Fejl: {error}</div>}

      {/* ===== DRIFT ===== */}
      {tab === "DRIFT" && (
        <>
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase text-neutral-500">Valgt periode</div>
                <div className="text-lg font-semibold">{selection.label}</div>
                <div className="text-xs text-neutral-500">
                  {mounted ? (
                    <>
                      {fmtDkDate(selection.start)} → {fmtDkDate(selection.end)}
                    </>
                  ) : (
                    <>—</>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                  <span className="text-xs font-semibold text-neutral-600">Vis</span>
                  <select className="text-sm outline-none" value={view} onChange={(e) => setView(e.target.value as ViewMode)}>
                    <option value="MONTH">Måned</option>
                    <option value="QUARTER">Kvartal</option>
                    <option value="YEAR">År</option>
                  </select>
                </div>

                {/* [HELP:KASSERER_DASH_V5:MODE_DEFAULT_CASH] START */}
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                  <span className="text-xs font-semibold text-neutral-600">Mode</span>
                  <select className="text-sm outline-none" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                    <option value="CASH">Cash</option>
                    <option value="DUE">Forfalder</option>
                    <option value="COVERAGE">Dækket</option>
                  </select>
                </div>
                {/* [HELP:KASSERER_DASH_V5:MODE_DEFAULT_CASH] END */}

                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                  <span className="text-xs font-semibold text-neutral-600">År</span>
                  <select className="text-sm outline-none" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {view === "QUARTER" && (
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                    <span className="text-xs font-semibold text-neutral-600">Q</span>
                    <select className="text-sm outline-none" value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>
                      <option value={1}>Q1</option>
                      <option value={2}>Q2</option>
                      <option value={3}>Q3</option>
                      <option value={4}>Q4</option>
                    </select>
                  </div>
                )}

                {view === "MONTH" && (
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                    <span className="text-xs font-semibold text-neutral-600">Måned</span>
                    <select className="text-sm outline-none" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {String(m).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="mt-3 text-sm text-neutral-500">Loader kasserer-data…</div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs uppercase text-neutral-500">Aktive personer</div>
                  <div className="text-xl font-semibold tabular-nums">{activeRows.length}</div>
                </div>

                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs uppercase text-neutral-500">Betalinger (subs)</div>
                  <div className="text-xl font-semibold tabular-nums">{subs.length}</div>
                </div>

                <div className="rounded-xl border border-neutral-200 p-3 md:col-span-2">
                  <div className="text-xs uppercase text-neutral-500">{periodLabel}</div>
                  <div className="text-xl font-semibold tabular-nums">{formatCurrencyDKK(periodSum)}</div>
                  <div className="mt-1 text-xs text-neutral-500">{periodSubs.length} rækker</div>
                </div>

                <div className="rounded-xl border border-neutral-200 p-3 md:col-span-2">
                  <div className="text-xs uppercase text-neutral-500">Note</div>
                  <div className="text-sm text-neutral-700">{modeHint}</div>
                </div>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <QuarterBars
              title={`${mode === "CASH" ? "Cash" : mode === "DUE" ? "Forfalder" : "Dækket"} pr kvartal (${year})`}
              points={quarterSeries}
              selected={view === "QUARTER" ? `Q${quarter}` : undefined}
            />
            <BarList title="Medlemmer pr pakke (personer)" items={membersByPackage} valueFormatter={(n) => String(n)} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BarList
              title={`${mode === "CASH" ? "Cash" : mode === "DUE" ? "Forfalder" : "Dækket"} pr pakke (valgt periode)`}
              items={amountByPackage}
              valueFormatter={(n) => formatCurrencyDKK(n)}
            />

            {nextQuarter ? (
              <MiniCompare
                title={`Næste kvartal: Q${nextQuarter.nextQ} ${nextQuarter.nextY}`}
                leftLabel="Cash"
                left={nextQuarter.cash}
                rightLabel="Forventet (forfalder)"
                right={nextQuarter.due}
              />
            ) : (
              <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm text-sm text-neutral-500">
                Næste kvartal vises kun i Kvartal-visning.
              </section>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-end justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Snart fornyes</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
                    <span className="text-xs font-semibold text-neutral-600">Horisont</span>
                    <select
                      className="text-sm outline-none"
                      value={conf.horizonDays}
                      onChange={(e) => setConf((c) => ({ ...c, horizonDays: Number(e.target.value) }))}
                    >
                      <option value={30}>30 dage</option>
                      <option value={60}>60 dage</option>
                      <option value={90}>90 dage</option>
                      <option value={365}>365 dage</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                    <input type="checkbox" checked={showAllRenewals} onChange={(e) => setShowAllRenewals(e.target.checked)} />
                    Vis alle
                  </label>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs uppercase text-neutral-500">Rød (≤{conf.redDays})</div>
                  <div className="text-xl font-semibold tabular-nums">{renewalCounts.red}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs uppercase text-neutral-500">Gul (≤{conf.yellowDays})</div>
                  <div className="text-xl font-semibold tabular-nums">{renewalCounts.yellow}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs uppercase text-neutral-500">Grøn (≤{conf.greenDays})</div>
                  <div className="text-xl font-semibold tabular-nums">{renewalCounts.green}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs uppercase text-neutral-500">Vises</div>
                  <div className="text-xl font-semibold tabular-nums">{renewalCounts.shown}</div>
                </div>
              </div>

              <p className="mt-3 text-xs text-neutral-500">
                Kilde: <span className="font-semibold">naeste_forfald</span> og <span className="font-semibold">dage_til_forfald</span>.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Fornyelser (liste)</h2>

              {loading ? (
                <div className="text-sm text-neutral-500">Loader…</div>
              ) : renewals.length === 0 ? (
                <div className="text-sm text-neutral-500">Ingen fornyelser i filteret.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-xs uppercase text-neutral-500">
                      <tr className="border-b border-neutral-200">
                        <th className="py-2 pr-3 text-left">Medlem</th>
                        <th className="py-2 pr-3 text-left">Pakke</th>
                        <th className="py-2 pr-3 text-right">Beløb</th>
                        <th className="py-2 pr-3 text-left">Forfalder</th>
                        <th className="py-2 pr-3 text-left">Status</th>
                        <th className="py-2 pr-3 text-left">Kontakt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renewals.slice(0, 30).map((s) => (
                        <tr key={s.key} className="border-b border-neutral-100">
                          <td className="py-2 pr-3 font-medium">
                            {isFamilyPackage(s.rep) ? `Familie (${s.persons.length} pers.)` : fullName(s.rep)}
                          </td>
                          <td className="py-2 pr-3">{s.packageTitle}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{formatCurrencyDKK(s.amountDue)}</td>
                          <td className="py-2 pr-3">{fmtDkDate(s.dueDate)}</td>
                          <td className="py-2 pr-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${pillClass(s.daysToDue, conf)}`}>
                              {s.daysToDue === null ? "—" : `${s.daysToDue} dage`}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-xs">
                            <div className="flex flex-col gap-0.5">
                              {s.email ? <span>{s.email}</span> : <span className="text-neutral-400">—</span>}
                              {s.phone ? <span>{s.phone}</span> : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-2 text-xs text-neutral-500">Viser top 30.</div>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {/* ===== OVERBLIK ===== */}
      {tab === "OVERVIEW" && (
        <>
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase text-neutral-500">Overblik</div>
                <div className="text-lg font-semibold">{yearRange.label}</div>
                <div className="text-xs text-neutral-500">
                  {fmtDkDate(yearRange.start)} → {fmtDkDate(yearRange.end)}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                <span className="text-xs font-semibold text-neutral-600">År</span>
                <select className="text-sm outline-none" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ProgressCard title="Medlemmer (aktive)" value={activeRows.length} target={conf.targetMembers} suffix="stk" />
            <ProgressCard title="Cash i år (YTD)" value={cashYear} target={conf.targetYearCash} />
            <ProgressCard title="Run-rate (estimat pr år)" value={annualRunRate} target={conf.targetYearCash} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <QuarterBars title={`Cash pr kvartal (${year})`} points={quarterSeries.map((p) => p)} />
            <BarList title="Medlemmer pr pakke (personer)" items={membersByPackage} valueFormatter={(n) => String(n)} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ProgressCard title="Forfalder i år (hvis naeste_forfald ligger i året)" value={dueYear} target={conf.targetYearCash} />
            <ProgressCard title="Kvartals-mål (cash)" value={mode === "CASH" ? periodSum : 0} target={conf.targetQuarterCash} />
          </div>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-neutral-700">
              <span className="font-semibold">Tip:</span> Justér mål i <span className="font-semibold">Conf</span>. Overblik bruger:
              <ul className="mt-2 list-disc pl-5 text-sm text-neutral-600">
                <li><b>Cash i år</b> = sum af payment_date i HDK-året.</li>
                <li><b>Run-rate</b> = hvad dine nuværende subs giver på et helt år (bestyrelses-kig).</li>
              </ul>
            </div>
          </section>
        </>
      )}

      {/* ===== CONF ===== */}
      {confOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 md:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">⚙️ Indstillinger</div>
              <button className="rounded-xl border border-neutral-200 px-3 py-2 text-sm" onClick={() => setConfOpen(false)}>
                Luk
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-neutral-200 p-3">
                <div className="text-sm font-semibold">Regnskabsår starter i (måned)</div>
                <div className="text-xs text-neutral-500">Påvirker Q1–Q4 og År-visning.</div>
                <select
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  value={conf.fiscalStartMonth}
                  onChange={(e) => setConf((c) => ({ ...c, fiscalStartMonth: Number(e.target.value) }))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-neutral-200 p-3">
                <div className="text-sm font-semibold">Kontingent “gælder fra næste måned” (kun Dækket)</div>
                <div className="text-xs text-neutral-500">Hvis slået til: coverage starter 1. i næste måned.</div>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={conf.startFromNextMonth}
                    onChange={(e) => setConf((c) => ({ ...c, startFromNextMonth: e.target.checked }))}
                  />
                  Aktivér
                </label>
              </div>

              <div className="rounded-xl border border-neutral-200 p-3">
                <div className="text-sm font-semibold">Targets (Overblik)</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <label className="text-xs">
                    Medlemmer
                    <input
                      className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
                      type="number"
                      value={conf.targetMembers}
                      onChange={(e) => setConf((c) => ({ ...c, targetMembers: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="text-xs">
                    År (cash)
                    <input
                      className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
                      type="number"
                      value={conf.targetYearCash}
                      onChange={(e) => setConf((c) => ({ ...c, targetYearCash: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="text-xs">
                    Kvartal (cash)
                    <input
                      className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
                      type="number"
                      value={conf.targetQuarterCash}
                      onChange={(e) => setConf((c) => ({ ...c, targetQuarterCash: Number(e.target.value) }))}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 p-3">
                <div className="text-sm font-semibold">Farvegrænser (dage)</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <label className="text-xs">
                    Rød ≤
                    <input
                      className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
                      type="number"
                      value={conf.redDays}
                      onChange={(e) => setConf((c) => ({ ...c, redDays: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="text-xs">
                    Gul ≤
                    <input
                      className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
                      type="number"
                      value={conf.yellowDays}
                      onChange={(e) => setConf((c) => ({ ...c, yellowDays: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="text-xs">
                    Grøn ≤
                    <input
                      className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
                      type="number"
                      value={conf.greenDays}
                      onChange={(e) => setConf((c) => ({ ...c, greenDays: Number(e.target.value) }))}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 p-3">
                <div className="text-sm font-semibold">Standard horisont (dage)</div>
                <select
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  value={conf.horizonDays}
                  onChange={(e) => setConf((c) => ({ ...c, horizonDays: Number(e.target.value) }))}
                >
                  <option value={30}>30</option>
                  <option value={60}>60</option>
                  <option value={90}>90</option>
                  <option value={365}>365</option>
                </select>
              </div>

              <div className="text-xs text-neutral-500">Settings gemmes lokalt i din browser.</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
