"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PublicEvent = {
  title: string;
  subtitle: string;
  period_text: string;
  rules_text: string;
  price_text: string;
  prizes_text: string;
  leaderboard_limit: number;
  order: number;

  // nye public felter (styres fra sheet hvis kolonner findes)
  status?: "LIVE" | "UPCOMING" | "PAST";
  badge_text?: string;
  badge_variant?: string;

  // INTERN: kommer kun med hvis admin/kiosk er logget ind (må aldrig vises offentligt)
  event_code?: string;

  // Offentligt arkiv: top 3 + lodtrækning
  podium?: Array<{ nickname: string; value: number }>;
  draw_status?: string;
  draw_winner_nickname?: string;
  draw_winner_note?: string;
  draw_drawn_at?: string;
};

function prettyPeriod(raw: string) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const iso = s.match(/^\d{4}-\d{2}-\d{2}T/);
  const ymd = s.match(/^\d{4}-\d{2}-\d{2}/);
  if (iso || (ymd && s.length > 10)) {
    const d = new Date(ymd ? ymd[0] : s);
    if (!Number.isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = String(d.getFullYear());
      return `${dd}-${mm}-${yy}`;
    }
    return ymd ? ymd[0] : s;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [yy, mm, dd] = s.split("-");
    return `${dd}-${mm}-${yy}`;
  }
  return s;
}

type ApiRes = { ok: boolean; items: PublicEvent[]; error?: string };

/* [HELP:KONKURRENCER:PAGE] START */

export default function KonkurrencerPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiRes | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/konkurrencer/events", { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as ApiRes;
        if (!alive) return;
        setData(json);
      } catch (e: any) {
        if (!alive) return;
        setData({ ok: false, items: [], error: e?.message || "Fejl" });
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  const items = useMemo(() => (data?.ok ? data.items : []), [data]);

  const activeItems = useMemo(() => items.filter((ev) => (ev.status || "LIVE") !== "PAST"), [items]);
  const archiveItems = useMemo(() => items.filter((ev) => (ev.status || "LIVE") === "PAST"), [items]);

  function StatusBadge({ ev }: { ev: PublicEvent }) {
    const status = ev.status || "LIVE";
    const txt =
      (ev.badge_text || "").trim() ||
      (status === "UPCOMING" ? "Kommer snart" : status === "PAST" ? "Afsluttet" : "Aktiv");
    if (!txt) return null;

    const v = String(ev.badge_variant || "").trim().toLowerCase();
    const cls =
      v === "success" || v === "live"
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : v === "soon" || v === "warning" || status === "UPCOMING"
        ? "bg-orange-50 text-orange-800 border-orange-200"
        : status === "LIVE"
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : "bg-slate-50 text-slate-700 border-slate-200";

    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
        {txt}
      </span>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Konkurrencer</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Her kan alle se de aktuelle konkurrencer. Deltagelse foregår kun når en ansvarlig (scorekeeper) er til stede og har logget ind.
          </p>
        </div>

        <Link
          href="/konkurrencer/ansvarlig"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Ansvarlig login
        </Link>
      </div>

      <div className="mt-8 grid gap-4">
        {loading && (
          <div className="rounded-2xl border bg-white p-5 text-sm text-slate-600 shadow-sm">Henter events…</div>
        )}

        {!loading && !data?.ok && (
          <div className="rounded-2xl border bg-white p-5 text-sm text-orange-700 shadow-sm">
            {data?.error || "Kunne ikke hente events."}
          </div>
        )}

        {!loading && data?.ok && items.length === 0 && (
          <div className="rounded-2xl border bg-white p-5 text-sm text-slate-600 shadow-sm">
            Ingen aktive konkurrencer lige nu.
          </div>
        )}

        {!loading && data?.ok && activeItems.length > 0 &&
          activeItems.map((ev, idx) => (
            <div key={`${ev.title}-${idx}`} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-semibold text-slate-500">
                      {(ev.status || "LIVE") === "UPCOMING" ? "Kommende event" : "Aktiv event"}
                    </div>
                    <StatusBadge ev={ev} />
                  </div>
                  <div className="mt-1 text-xl font-black text-slate-900">{ev.title || "—"}</div>
                  {ev.subtitle && <div className="mt-1 text-sm text-slate-600">{ev.subtitle}</div>}
                  {ev.period_text && <div className="mt-2 text-xs text-slate-500">{prettyPeriod(ev.period_text)}</div>}
                </div>

                <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700 md:min-w-[260px]">
                  <div className="text-xs font-semibold text-slate-600">Kort fortalt</div>
                  <div className="mt-2 space-y-1">
                    <div>• Mød op i klubben</div>
                    <div>• Ansvarlig (scorekeeper) logger ind</div>
                    <div>• Spillere registreres løbende (af scorekeeper)</div>
                    <div>• Spillet kører på scorekeeper-enheden</div>
                  </div>
                </div>
              </div>

              {(ev.rules_text || ev.price_text || ev.prizes_text) && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border bg-white p-4">
                    <div className="text-xs font-semibold text-slate-600">Regler</div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{ev.rules_text || "—"}</div>
                  </div>
                  <div className="rounded-2xl border bg-white p-4">
                    <div className="text-xs font-semibold text-slate-600">Pris</div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{ev.price_text || "—"}</div>
                  </div>
                  <div className="rounded-2xl border bg-white p-4">
                    <div className="text-xs font-semibold text-slate-600">Præmier</div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{ev.prizes_text || "—"}</div>
                  </div>
                </div>
              )}
            </div>
          ))}

        {!loading && data?.ok && archiveItems.length > 0 && (
          <div className="mt-2">
            <div className="mt-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Arkiv</h2>
                <p className="mt-1 text-sm text-slate-600">Afsluttede events (offentligt overblik).</p>
              </div>
              <div className="text-xs text-slate-500" />
            </div>

            <div className="mt-3 grid gap-4">
              {archiveItems.map((ev, idx) => {
                return (
                  <div key={`arch-${ev.title}-${idx}`} className="rounded-2xl border bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-semibold text-slate-500">Afsluttet event</div>
                          <StatusBadge ev={ev} />
                        </div>
                        <div className="mt-1 text-xl font-black text-slate-900">{ev.title || "—"}</div>
                        {ev.subtitle && <div className="mt-1 text-sm text-slate-600">{ev.subtitle}</div>}
                        {ev.period_text && <div className="mt-2 text-xs text-slate-500">{prettyPeriod(ev.period_text)}</div>}

                        {/* Offentligt: vis kun podium + lodtrækning (ingen interne tal) */}
                        {Array.isArray(ev.podium) && ev.podium.length > 0 && (
                          <div className="mt-3 rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">
                            <div className="text-xs font-semibold text-slate-600">Top 3</div>
                            <div className="mt-2 grid gap-2">
                              {ev.podium.slice(0, 3).map((p, i) => (
                                <div key={`${p.nickname}-${i}`} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2">
                                  <div className="text-sm font-black">{i + 1}. {p.nickname}</div>
                                  <div className="text-sm font-black">{p.value} tilbage</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {String(ev.draw_winner_nickname || "").trim() && (
                          <div className="mt-3 rounded-2xl border bg-white p-3 text-sm text-slate-700">
                            <div className="text-xs font-semibold text-slate-600">Lodtrækning</div>
                            <div className="mt-1">
                              Vinder: <span className="font-black">{String(ev.draw_winner_nickname || "").trim()}</span>
                            </div>
                            {String(ev.draw_winner_note || "").trim() && (
                              <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                                {String(ev.draw_winner_note || "").trim()}
                              </div>
                            )}
                            {String(ev.draw_drawn_at || "").trim() && (
                              <div className="mt-1 text-xs text-slate-500">Trukket: {String(ev.draw_drawn_at || "").trim()}</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700 md:min-w-[260px]">
                        <div className="text-xs font-semibold text-slate-600">Noter</div>
                        <div className="mt-2 space-y-1">
                          <div>• Eventet er afsluttet</div>
                          <div>• Top 3 + lodtrækning vises her</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* [HELP:KONKURRENCER:PAGE] END */
