"use client";

import { useEffect, useMemo, useState } from "react";

type ArcadeEvent = {
  visible?: string;
  order?: any;
  event_code?: string;
  title?: string;
  period_text?: string;
  draw_winner_nickname?: string;
  draw_winner_note?: string;
  draw_drawn_at?: string;
};

type PurchaseRow = {
  created_at?: string;
  purchase_id?: string;
  event_code?: string;
  nickname?: string;
  full_name?: string;
  player_code?: string;
  purchased_attempts?: any;
};

type ScoreRow = {
  created_at?: string;
  nickname?: string;
  game?: string;
  value?: any;
  meta_json?: string;
};

function toYes(v: any): boolean {
  return String(v ?? "").trim().toUpperCase() === "YES";
}

function toNum(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseMeta(s: any) {
  try {
    return JSON.parse(String(s || "{}"));
  } catch {
    return {};
  }
}

async function fetchTab(tab: string): Promise<any[]> {
  const res = await fetch(`/api/sheet?tab=${encodeURIComponent(tab)}`, {
    cache: "no-store",
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `GET ${tab} failed (${res.status})`);
  }
  return Array.isArray(data?.items) ? data.items : [];
}

async function drawWinner(eventCode: string, seed?: string): Promise<any> {
  const body: any = { tab: "ARCADE_EVENTS", action: "arcadeDraw", event_code: eventCode };
  if (seed) body.seed = seed;
  const res = await fetch(`/api/sheet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Draw failed (${res.status})`);
  }
  return data;
}

export default function AdminKonkurrencer() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [events, setEvents] = useState<ArcadeEvent[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [selectedEventCode, setSelectedEventCode] = useState<string>("");
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [ev, pu, sc] = await Promise.all([
          fetchTab("ARCADE_EVENTS"),
          fetchTab("ARCADE_PURCHASES"),
          fetchTab("ARCADE_SCORES"),
        ]);
        if (!alive) return;

        const evVis = (ev as ArcadeEvent[])
          .filter((r) => toYes((r as any).visible))
          .sort((a, b) => toNum((a as any).order, 9999) - toNum((b as any).order, 9999));

        setEvents(evVis);
        setPurchases(pu as PurchaseRow[]);
        setScores(sc as ScoreRow[]);

        const pick = selectedEventCode || (evVis[0]?.event_code || "");
        setSelectedEventCode(pick);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Kunne ikke hente data");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedEvent = useMemo(
    () => events.find((e) => (e.event_code || "") === selectedEventCode) || events[0] || null,
    [events, selectedEventCode]
  );

  const filteredPurchases = useMemo(
    () => purchases.filter((p) => String(p.event_code || "") === String(selectedEventCode || "")),
    [purchases, selectedEventCode]
  );

  const filteredScores = useMemo(
    () =>
      scores
        .map((s) => {
          const meta = parseMeta((s as any).meta_json);
          return { ...s, meta } as any;
        })
        .filter((s: any) => (s.game || "") === "nine")
        .filter((s: any) => String(s.meta?.event_code || "") === String(selectedEventCode || "")),
    [scores, selectedEventCode]
  );

  const summary = useMemo(() => {
    const totalAttempts = filteredPurchases.reduce(
      (acc, r) => acc + Math.max(0, toNum((r as any).purchased_attempts, 0)),
      0
    );
    const buyers = new Set<string>();
    for (const r of filteredPurchases) {
      const k = String(r.player_code || r.nickname || "").trim();
      if (k) buyers.add(k);
    }

    const players = new Set<string>();
    const best = new Map<string, number>();
    for (const r of filteredScores) {
      const name = String((r as any).nickname || "Anonym").trim();
      players.add(name);
      const v = Number((r as any).value);
      if (!Number.isFinite(v) || v < 0) continue;
      const cur = best.get(name);
      if (cur === undefined || v < cur) best.set(name, v);
    }

    const top = Array.from(best.entries())
      .map(([nickname, value]) => ({ nickname, value }))
      .sort((a, b) => a.value - b.value)
      .slice(0, 10);

    return {
      totalAttempts,
      uniqueBuyers: buyers.size,
      totalScores: filteredScores.length,
      uniquePlayers: players.size,
      top,
    };
  }, [filteredPurchases, filteredScores]);

  async function onDraw() {
    if (!selectedEventCode) return;
    try {
      setDrawing(true);
      await drawWinner(selectedEventCode);
      // refresh events
      const ev = await fetchTab("ARCADE_EVENTS");
      const evVis = (ev as ArcadeEvent[])
        .filter((r) => toYes((r as any).visible))
        .sort((a, b) => toNum((a as any).order, 9999) - toNum((b as any).order, 9999));
      setEvents(evVis);
    } catch (e: any) {
      setError(e?.message || "Draw fejlede");
    } finally {
      setDrawing(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4">
        <h1 className="text-2xl font-black">Admin · Konkurrencer (arkiv)</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Her kan du se købte forsøg, deltagelse og trække vinderen til lodtrækningen.
        </p>
      </div>

      {loading && <div className="text-sm text-slate-600">Henter…</div>}
      {error && <div className="mb-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">{error}</div>}

      {!loading && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">Event</label>
              <select
                value={selectedEventCode}
                onChange={(e) => setSelectedEventCode(e.target.value)}
                className="rounded-xl border px-3 py-2 text-sm"
              >
                {events.map((e) => (
                  <option key={e.event_code} value={e.event_code}>
                    {e.title || e.event_code}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onDraw}
              disabled={!selectedEventCode || drawing}
              className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              {drawing ? "Trækker…" : "Træk vinder (lodtrækning)"}
            </button>
          </div>

          {/* Summary cards */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-xs text-slate-600">Købte forsøg</div>
              <div className="text-2xl font-black">{summary.totalAttempts}</div>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-xs text-slate-600">Unikke købere</div>
              <div className="text-2xl font-black">{summary.uniqueBuyers}</div>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-xs text-slate-600">Registrerede scores</div>
              <div className="text-2xl font-black">{summary.totalScores}</div>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-xs text-slate-600">Unikke spillere</div>
              <div className="text-2xl font-black">{summary.uniquePlayers}</div>
            </div>
          </div>

          {/* Winner */}
          <div className="mt-4 rounded-2xl border bg-white p-4">
            <div className="text-sm font-semibold">Lodtrækning</div>
            {selectedEvent?.draw_winner_nickname ? (
              <div className="mt-2 rounded-2xl border bg-slate-50 p-3">
                <div className="text-xs text-slate-600">Vinder</div>
                <div className="text-xl font-black">{selectedEvent.draw_winner_nickname}</div>
                {selectedEvent.draw_winner_note && (
                  <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{selectedEvent.draw_winner_note}</div>
                )}
                {selectedEvent.draw_drawn_at && (
                  <div className="mt-1 text-xs text-slate-500">Trukket: {selectedEvent.draw_drawn_at}</div>
                )}
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500">Ikke trukket endnu.</div>
            )}
          </div>

          {/* Toplist */}
          <div className="mt-4 rounded-2xl border bg-white p-4">
            <div className="text-sm font-semibold">Top 10 (bedste tilbage)</div>
            {summary.top.length ? (
              <div className="mt-2 grid gap-2">
                {summary.top.map((r, i) => (
                  <div key={r.nickname} className="flex items-center justify-between rounded-2xl border bg-white px-3 py-2">
                    <div className="text-sm font-black">{i + 1}. {r.nickname}</div>
                    <div className="text-sm font-black">{r.value} tilbage</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500">—</div>
            )}
          </div>

          {/* Purchases table */}
          <div className="mt-4 rounded-2xl border bg-white p-4">
            <div className="text-sm font-semibold">Køb (seneste 50)</div>
            <div className="mt-2 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-600">
                    <th className="py-2">Dato</th>
                    <th className="py-2">Nickname</th>
                    <th className="py-2">Navn</th>
                    <th className="py-2">Forsøg</th>
                    <th className="py-2">Kode</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases
                    .slice()
                    .sort((a, b) => (Date.parse(String(b.created_at || "")) || 0) - (Date.parse(String(a.created_at || "")) || 0))
                    .slice(0, 50)
                    .map((r) => (
                      <tr key={r.purchase_id || `${r.created_at}-${r.nickname}`} className="border-t">
                        <td className="py-2 pr-3 whitespace-nowrap">{String(r.created_at || "")}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{String(r.nickname || "")}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{String(r.full_name || "")}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{toNum((r as any).purchased_attempts, 0)}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{String(r.player_code || "")}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
