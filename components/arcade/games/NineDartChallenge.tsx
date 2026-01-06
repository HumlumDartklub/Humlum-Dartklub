"use client";

// [HELP:KONKURRER_NINEDARTERCHALLENGE_PAGE] START
import { useEffect, useMemo, useState } from "react";
import NineDartChallenge, {
  type NineDartFinishPayload,
} from "@/components/arcade/games/NineDartChallengeTyped";

type NineSession = {
  eventCode: string;
  eventTitle?: string;
  eventDate?: string;
  playerCode?: string;
  nickname?: string;
  attemptIndex?: number;
  attemptTotal?: number;
  purchaseId?: string;
};

const LS_SESSION_KEY = "hdk_arcade_nine_session_v1";
const LS_DEVICE_KEY = "hdk_arcade_device_id_v1";

function getDeviceId() {
  try {
    const existing = localStorage.getItem(LS_DEVICE_KEY);
    if (existing) return existing;
    const id =
      (globalThis.crypto?.randomUUID?.() as string | undefined) ??
      `dev_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(LS_DEVICE_KEY, id);
    return id;
  } catch {
    return "dev_unknown";
  }
}

export default function Page() {
  const [session, setSession] = useState<NineSession | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as NineSession;
      setSession(parsed);
    } catch {
      setSession(null);
    }
  }, []);

  const ready = !!session?.eventCode;
  const deviceId = useMemo(() => getDeviceId(), []);

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-4 text-sm">
          <b>Mangler event/spiller-data.</b> Åbn 9-darter tavlen via{" "}
          <b>Scorekeeper</b> (så følger event + spiller + forsøg med).
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <NineDartChallenge
        autoStart={true}
        lockEvent={true}
        launchMode="window"
        windowMode={true}
        scoreboardPath="/konkurrencer/ninedarterchallenge"
        deviceId={deviceId}
        presetEventCode={session.eventCode}
        presetEventTitle={session.eventTitle || session.eventCode}
        presetEventDate={session.eventDate || ""}
        onFinish={async (payload: NineDartFinishPayload) => {
          try {
            await fetch("/api/arcade/finish", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                game: "ninedart",
                event_code: session.eventCode,
                nickname: session.nickname || payload?.nickname || "Spiller",
                value: Number(payload?.value ?? 0),
                purchase_id: session.purchaseId,
                meta: {
                  ...(payload?.meta || {}),
                  event_title: session.eventTitle,
                  event_date: session.eventDate,
                  player_code: session.playerCode,
                  attempt_index: session.attemptIndex,
                  attempt_total: session.attemptTotal,
                },
              }),
            });
          } catch {
            // silent: tavlen må ikke dø af gemme-fejl
          }
        }}
      />
    </div>
  );
}
// [HELP:KONKURRER_NINEDARTERCHALLENGE_PAGE] END
