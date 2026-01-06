"use client";

// [HELP:KONKURRER_SCORETAVLE_CLIENT] START
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import NineDartChallenge, {
  type NineDartFinishPayload,
} from "@/components/arcade/games/NineDartChallengeTyped";

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

function asBool(v: string | null, fallback = false) {
  if (v === null) return fallback;
  return v === "1" || v === "true" || v === "yes";
}

export default function ScoretavleClient() {
  const sp = useSearchParams();

  const deviceId = useMemo(() => getDeviceId(), []);

  // Accepter både camelCase og snake_case (så vi ikke låser os fast)
  const eventCode =
    sp.get("eventCode") ||
    sp.get("event_code") ||
    sp.get("event") ||
    sp.get("code") ||
    "";

  const eventTitle =
    sp.get("eventTitle") || sp.get("event_title") || eventCode || "";

  const eventDate = sp.get("eventDate") || sp.get("event_date") || "";

  const lockEvent = asBool(sp.get("lockEvent") || sp.get("lock_event"), true);
  const autoStart = asBool(sp.get("autoStart") || sp.get("auto_start"), true);

  // Hvis den her side åbnes som vindue/tab
  const launchMode = (sp.get("launchMode") || sp.get("launch_mode") || "window").toString();
  const windowMode = asBool(sp.get("windowMode") || sp.get("window_mode"), true);

  // Hvis du vil styre hvilken side der er “scoreboardPath” (ikke kritisk her)
  const scoreboardPath =
    sp.get("scoreboardPath") || sp.get("scoreboard_path") || "/konkurrencer/scoretavle";

  if (!eventCode) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-4 text-sm">
          <b>Mangler event-kode.</b> Åbn scoretavlen via Scorekeeper, så event
          data følger med.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <NineDartChallenge
        lockEvent={lockEvent}
        autoStart={autoStart}
        launchMode={launchMode}
        windowMode={windowMode}
        scoreboardPath={scoreboardPath}
        deviceId={deviceId}
        presetEventCode={eventCode}
        presetEventTitle={eventTitle}
        presetEventDate={eventDate}
        onFinish={async (_payload: NineDartFinishPayload) => {
          // Luk vinduet når afsluttet (kan ændres senere)
          try {
            window.close();
          } catch {
            // ignore
          }
        }}
      />
    </div>
  );
}
// [HELP:KONKURRER_SCORETAVLE_CLIENT] END
