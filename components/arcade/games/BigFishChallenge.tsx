"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ArcadeGameKey } from "../ArcadeHub";
import { QUICK_THROWS, DartThrow, throwLabel, throwValue } from "../dartUtils";

/* [HELP:ARCADE:GAME:BIGFISH] START */
export default function BigFishChallenge({
  onFinish,
}: {
  onFinish: (p: { game: ArcadeGameKey; value: number; meta?: Record<string, any> }) => void;
}) {
  const [running, setRunning] = useState(false);
  const [darts, setDarts] = useState<DartThrow[]>([]);
  const [ms, setMs] = useState(0);
  const [message, setMessage] = useState<string>("");
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const sum = useMemo(() => darts.reduce((s, t) => s + throwValue(t), 0), [darts]);

  const tick = () => {
    if (!running || startRef.current === null) return;
    setMs(performance.now() - startRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (running) rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const reset = () => {
    setRunning(false);
    setDarts([]);
    setMs(0);
    setMessage("");
    startRef.current = null;
  };

  const start = () => {
    reset();
    setRunning(true);
    startRef.current = performance.now();
  };

  const isSuccess = (arr: DartThrow[]) => {
    if (arr.length !== 3) return false;
    const labels = arr.map(throwLabel);
    return labels[0] === "T20" && labels[1] === "T20" && labels[2] === "BULL";
  };

  const addThrow = (t: DartThrow) => {
    if (!running) return;
    if (darts.length >= 3) return;
    const next = [...darts, t];
    setDarts(next);

    if (next.length === 3) {
      setRunning(false);
      const timeMs = Math.max(
        0,
        Math.round(
          startRef.current ? performance.now() - startRef.current : ms,
        ),
      );
      if (isSuccess(next)) {
        setMessage("✅ BIG FISH! 170 checkout — respekt.");
        const total = next.reduce((s, x) => s + throwValue(x), 0);
        onFinish({
          game: "bigfish",
          value: timeMs,
          meta: {
            darts: next.map((x) => ({ label: throwLabel(x), value: throwValue(x) })),
            sum: total,
          },
        });
      } else {
        setMessage("❌ Ikke helt. Big Fish er T20, T20, Bull. Prøv igen!");
      }
    }
  };

  const timeLabel = `${(Math.round(ms / 10) / 100).toFixed(2)}s`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Mål</div>
          <div className="mt-1 text-3xl font-black">170</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Tid</div>
          <div className="mt-1 text-2xl font-black tabular-nums">{timeLabel}</div>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-700">
        <b>Big Fish checkout:</b> T20 → T20 → Bull (50). 3 pile, ingen undskyldninger 😄
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!running ? (
          <button type="button" className="btn btn-primary" onClick={start}>
            Start forsøg
          </button>
        ) : (
          <div className="text-sm font-black text-slate-700">
            Vælg dine 3 pile… ({darts.length}/3)
          </div>
        )}

        <button
          type="button"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black hover:bg-white"
          onClick={reset}
        >
          Nulstil
        </button>
      </div>

      <div className="mt-4">
        <div className="text-xs font-black text-slate-700">Kast</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_THROWS.map((t, idx) => (
            <button
              key={`${throwLabel(t)}-${idx}`}
              type="button"
              disabled={!running || darts.length >= 3}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black hover:bg-white disabled:opacity-50"
              onClick={() => addThrow(t)}
            >
              {throwLabel(t)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-black text-slate-700">Dine 3 pile</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {darts.length === 0 ? (
            <div className="text-sm text-slate-600">Start et forsøg — så kaster vi.</div>
          ) : (
            darts.map((t, idx) => (
              <div key={idx} className="rounded-2xl border bg-white px-3 py-2 text-sm font-black">
                {idx + 1}. {throwLabel(t)} <span className="text-slate-500">({throwValue(t)})</span>
              </div>
            ))
          )}
          {darts.length > 0 ? (
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black">
              Sum: {darts.reduce((s, t) => s + throwValue(t), 0)}
            </div>
          ) : null}
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-800">
          {message}
        </div>
      ) : null}
    </div>
  );
}
/* [HELP:ARCADE:GAME:BIGFISH] END */
