'use client';

/**
 * [HELP:TAVLE_ROUTE] START
 * Dette er DEN ENESTE tavle (NineDartChallenge i play-mode).
 * Den forventer at scorekeeper/kiosk allerede har gemt event + spiller i localStorage,
 * og så autostarter den direkte i "play".
 * [HELP:TAVLE_ROUTE] END
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import NineDartChallenge from "@/components/arcade/games/NineDartChallengeTyped";


const LS = {
  eventCode: 'hdk9_event_code',
  eventDate: 'hdk9_event_date',
  eventTitle: 'hdk9_event_title',
  autoStart: 'hdk9_autostart',
  selectedPlayer: 'hdk9_selected_player',
  bought: 'hdk9_bought',
};

export default function TavlePage() {
  const [ready, setReady] = useState(false);
  const [eventCode, setEventCode] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [hasPlayer, setHasPlayer] = useState(false);

  useEffect(() => {
    try {
      const ec = localStorage.getItem(LS.eventCode) || '';
      const ed = localStorage.getItem(LS.eventDate) || '';
      const sp = localStorage.getItem(LS.selectedPlayer) || '';

      setEventCode(ec);
      setEventDate(ed);
      setHasPlayer(!!sp);
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
          Indlæser tavle…
        </div>
      </div>
    );
  }

  // Hvis nogen åbner tavlen uden at komme fra scorekeeper/kiosk:
  if (!eventCode || !hasPlayer) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="rounded-2xl border border-black/10 bg-white/70 p-6">
          <h1 className="text-xl font-semibold">Scoreboard</h1>
          <p className="mt-2 text-sm opacity-80">
            Du er ikke logget ind som scorekeeper (eller der mangler valgt spiller/event).
          </p>
          <div className="mt-4 flex gap-3">
            <Link className="underline" href="/konkurrencer/scorekeeper">
              Tilbage til scorekeeper
            </Link>
            <Link className="underline" href="/konkurrencer">
              Offentlig forside
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NineDartChallenge
      // Lås event i tavlen (scorekeeper styrer)
      lockEvent={true}
      // Autostart direkte i play
      autoStart={true}
      // Vigtigt: denne side ER vinduet (popup/tab)
      windowMode={true}
      // Trigger autostart-effect i komponenten
      presetEventCode={eventCode}
      presetEventDate={eventDate}
    />
  );
}
