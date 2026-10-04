"use client";

import { useEffect, useState } from "react";

export default function TvFullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const updateState = () => {
      const doc = document as any;
      const active = Boolean(
        document.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
      );
      setIsFullscreen(active);
      if (active) setMessage("");
    };

    updateState();
    document.addEventListener("fullscreenchange", updateState);
    document.addEventListener("webkitfullscreenchange", updateState as EventListener);

    return () => {
      document.removeEventListener("fullscreenchange", updateState);
      document.removeEventListener("webkitfullscreenchange", updateState as EventListener);
    };
  }, []);

  async function openFullscreen() {
    setMessage("");

    const el = document.documentElement as any;
    const request =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen;

    if (!request) {
      setMessage("TV-browseren understøtter ikke fuldskærm fra hjemmesiden. Brug browserens menu og vælg Fuld skærm, hvis den mulighed findes.");
      return;
    }

    try {
      await request.call(el);

      // Forsøg at holde TV/skærm vågen. Ikke alle browsere understøtter dette.
      try {
        const nav = navigator as any;
        if (nav.wakeLock?.request) {
          await nav.wakeLock.request("screen");
        }
      } catch {
        // Wake Lock er kun en ekstra forbedring og må ikke blokere fullscreen.
      }
    } catch {
      setMessage("Fuldskærm blev afvist af browseren. Prøv igen med TV-fjernbetjeningen eller brug browserens egen Fuld skærm-funktion.");
    }
  }

  if (isFullscreen) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] flex max-w-[360px] flex-col items-end gap-2 sm:right-6 sm:top-6">
      <button
        type="button"
        onClick={openFullscreen}
        className="rounded-full border border-white/25 bg-[#071a32]/95 px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(0,0,0,.35)] backdrop-blur hover:border-orange-400 hover:bg-[#0b2546] focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        ⛶ Vis i fuld skærm
      </button>

      {message && (
        <div className="rounded-xl border border-orange-400/40 bg-[#071a32]/95 px-4 py-3 text-right text-xs leading-relaxed text-slate-100 shadow-xl backdrop-blur">
          {message}
        </div>
      )}
    </div>
  );
}
