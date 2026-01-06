"use client";

import { useEffect, useRef, useState } from "react";

import type { ArcadeGameKey } from "../ArcadeHub";

/* [HELP:ARCADE:GAME:CLOCK] START */
export default function AroundTheClock({
  onFinish,
}: {
  onFinish: (p: { game: ArcadeGameKey; value: number; meta?: Record<string, any> }) => void;
}) {
  const [running, setRunning] = useState(false);
  const [target, setTarget] = useState(1);
  const [ms, setMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const tick = () => {
    if (!running || startRef.current === null) return;
    const now = performance.now();
    setMs(now - startRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (running) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const reset = () => {
    setRunning(false);
    setTarget(1);
    setMs(0);
    startRef.current = null;
  };

  const start = () => {
    reset();
    startRef.current = performance.now();
    setRunning(true);
  };

  const hit = () => {
    if (!running) return;
    if (target >= 20) {
      // stop
      setRunning(false);
      const timeMs = Math.max(
        0,
        Math.round(startRef.current ? performance.now() - startRef.current : ms),
      );
      onFinish({
        game: "clock",
        value: timeMs,
        meta: { finished_on: 20 },
      });
      return;
    }
    setTarget((t) => Math.min(20, t + 1));
  };

  const timeLabel = `${(Math.round(ms / 10) / 100).toFixed(2)}s`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Næste tal</div>
          <div className="mt-1 text-4xl font-black">{target}</div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500">Tid</div>
          <div className="mt-1 text-2xl font-black tabular-nums">{timeLabel}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!running ? (
          <button type="button" className="btn btn-primary" onClick={start}>
            Start
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={hit}>
            Ramt! ✅
          </button>
        )}

        <button
          type="button"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black hover:bg-white"
          onClick={reset}
        >
          Nulstil
        </button>

        <div className="ml-auto text-xs text-slate-500">
          Tip: Brug knappen som “hit” — det her er en web-arcade, ikke en løgndetektor 😄
        </div>
      </div>
    </div>
  );
}
/* [HELP:ARCADE:GAME:CLOCK] END */
