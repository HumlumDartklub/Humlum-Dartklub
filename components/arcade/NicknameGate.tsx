"use client";

import { useEffect, useState } from "react";

/* [HELP:ARCADE:NICKNAME] START */
export default function NicknameGate({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(initial || "");

  useEffect(() => {
    if (open) setName(initial || "");
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-3xl border bg-white p-5 shadow-xl">
        <div className="text-lg font-black">Sæt dit spiller-navn</div>
        <div className="mt-1 text-sm text-slate-600">
          Det her navn vises på highscores. Hold det under 24 tegn.
        </div>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Fx: Ernst (Checkout King)"
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400"
        />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black hover:bg-white"
            onClick={onClose}
          >
            Fortryd
          </button>
          <button
            type="button"
            className="flex-1 btn btn-primary justify-center"
            onClick={() => onSave(name)}
          >
            Gem
          </button>
        </div>
      </div>
    </div>
  );
}
/* [HELP:ARCADE:NICKNAME] END */
