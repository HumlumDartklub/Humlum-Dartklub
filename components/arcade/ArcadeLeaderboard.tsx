'use client';

import { useEffect, useMemo, useState } from 'react';

import type { ArcadeGameKey } from "./ArcadeHub";
import ArcadeCard from "./ArcadeCard";

/* [HELP:ARCADE:LEADERBOARD] START */
type LeaderboardRow = {
  nickname: string;
  value: number;
  created_at?: string;
  device_id?: string;
  meta?: any;
};

type LeaderboardResponse = {
  ok: boolean;
  game: ArcadeGameKey;
  metric: 'min';
  items: LeaderboardRow[];
  recent: LeaderboardRow[];
  error?: string;
};

type Props = {
  activeGame: ArcadeGameKey;
  refreshKey: number;
  variant?: 'compact' | 'full';
  limit?: number; // hvor mange vises i listen (default 10)
  eventCode?: string; // filter pr event
  showRecent?: boolean; // om “seneste spillere” vises
  /** Override for .card height (default .card = h-full). Brug fx "h-auto" for i siden.
   *  Default: "h-auto".
   */
  cardClassName?: string;
};

function fmtDDMM(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // UTC -> stabil på server/client
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}`;
}

export default function ArcadeLeaderboard({
  activeGame,
  refreshKey,
  variant = 'full',
  limit = 10,
  eventCode = "",
  showRecent = true,
  cardClassName = "h-auto",
}: Props) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const url = new URL("/api/arcade/leaderboard", window.location.origin);
        url.searchParams.set("game", activeGame);
        if (eventCode) url.searchParams.set("event_code", eventCode);
        url.searchParams.set("limit", String(limit));

        const res = await fetch(url.toString(), {
          cache: 'no-store',
        });
        const json = (await res.json()) as LeaderboardResponse;
        if (!alive) return;
        setData(json?.ok ? json : { ok: false, game: activeGame, metric: 'min', items: [], recent: [], error: json?.error || 'Fejl' });
      } catch (e: any) {
        if (!alive) return;
        setData({ ok: false, game: activeGame, metric: 'min', items: [], recent: [], error: e?.message || 'Fejl' });
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [activeGame, refreshKey, eventCode]);

  const top = useMemo(() => (data?.items || []).slice(0, Math.max(1, limit)), [data, limit]);
  const recent = useMemo(() => (data?.recent || []).slice(0, 6), [data]);

  const title = variant === 'compact' ? `Highscore (Top ${Math.max(1, limit)})` : 'Highscore';
  const subtitle = 'Laveste tilbage vinder.';

  return (
    <ArcadeCard title={title} subtitle={subtitle} className={cardClassName}>
      {loading && <div className="text-sm text-slate-600">Henter…</div>}

      {!loading && !data?.ok && (
        <div className="text-sm text-orange-700">{data?.error || 'Kunne ikke hente scores.'}</div>
      )}

      {!loading && data?.ok && (
        <>
          <div className="text-xs text-slate-600">
            {variant === 'compact' ? 'Toplisten lige nu.' : 'Toplisten for denne konkurrence.'}
          </div>

          {top.length === 0 ? (
            <div className="mt-2 text-sm text-slate-500">—</div>
          ) : (
            <div className="mt-2 grid gap-2">
              {top.map((r, idx) => (
                <div
                  key={`${r.nickname}-${idx}-${r.value}`}
                  className="flex items-center justify-between rounded-2xl border bg-white px-3 py-2"
                >
                  <div className="text-sm font-black">
                    {idx + 1}. {r.nickname}
                  </div>
                  <div className="text-sm font-black">{r.value} tilbage</div>
                </div>
              ))}
            </div>
          )}

          {/* Seneste spillere (kun i full — compact skal være helt clean) */}
          {variant === 'full' && showRecent && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-700">Seneste spillere</div>
              {recent.length === 0 ? (
                <div className="mt-2 text-sm text-slate-500">—</div>
              ) : (
                <div className="mt-2 grid gap-2">
                  {recent.map((r, idx) => (
                    <div
                      key={`${r.nickname}-recent-${idx}-${r.value}`}
                      className="flex items-center justify-between rounded-2xl border bg-white px-3 py-2"
                    >
                      <div className="text-sm font-semibold">{r.nickname}</div>
                      <div className="text-xs text-slate-600">
                        {r.value} tilbage {r.created_at ? `· ${fmtDDMM(r.created_at)}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </ArcadeCard>
  );
}
/* [HELP:ARCADE:LEADERBOARD] END */
