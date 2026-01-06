"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import NineDartChallenge from "@/components/arcade/games/NineDartChallengeTyped";

import ArcadeLeaderboard from "@/components/arcade/ArcadeLeaderboard";

type SessionRes = {
  ok: boolean;
  error?: string;
  session?: { event_code: string };
  event?: {
    title: string;
    subtitle: string;
    period_text: string;
    rules_text: string;
    price_text: string;
    prizes_text: string;
    leaderboard_limit: number;
  };
};

function getDeviceId(): string {
  try {
    const key = "hdk_arcade_device_id";
    let v = localStorage.getItem(key) || "";
    if (!v) {
      v = `DEV-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      localStorage.setItem(key, v);
    }
    return v;
  } catch {
    return "";
  }
}

/* [HELP:KONKURRENCER:KIOSK:PAGE] START */

function prettyPeriod(raw: string) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const ymd = s.match(/^\d{4}-\d{2}-\d{2}/);
  if (ymd) {
    const [yy, mm, dd] = ymd[0].split("-");
    return `${dd}-${mm}-${yy}`;
  }
  return s;
}

// [HELP:KONKURRER_KIOSK_PAGE] START

export default function KonkurrencerKioskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SessionRes | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // session load
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/konkurrencer/session", { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as SessionRes;
        if (!alive) return;
        if (!res.ok || !json?.ok) {
          setData(json);
        } else {
          setData(json);
        }
      } catch (e: any) {
        if (!alive) return;
        setData({ ok: false, error: e?.message || "Fejl" });
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const eventCode = data?.ok ? (data.session?.event_code || "") : "";
  const event = data?.ok ? data.event : null;

  const title = event?.title || "Scorekeeper";
  const limit = Math.max(1, Math.min(10, Number(event?.leaderboard_limit || 5)));

  const eventDate = useMemo(() => {
    // Kiosk = “i dag” som default, men kan stadig justeres i component via lockEvent=true (dato vises)
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  }, []);

  async function logout() {
    try {
      await fetch("/api/konkurrencer/logout", { method: "POST" });
    } finally {
      router.push("/konkurrencer");
    }
  }

  async function onFinish(payload: { nickname: string; value: number; meta: Record<string, any> }) {
    const res = await fetch("/api/arcade/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game: "nine",
        nickname: payload.nickname,
        value: payload.value,
        event_code: String(payload.meta?.event_code || ""),
        device_hash: String(payload.meta?.device_hash || ""),
        meta: payload.meta,
      }),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json?.ok !== true) {
      throw new Error(json?.error || "Kunne ikke gemme resultat.");
    }
    setRefreshKey((k) => k + 1);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500">Konkurrencer · Scorekeeper</div>
          <h1 className="mt-1 text-2xl font-black text-slate-900">{title}</h1>
          {event?.subtitle && <div className="mt-1 text-sm text-slate-600">{event.subtitle}</div>}
          {event?.period_text && <div className="mt-1 text-xs text-slate-500">{prettyPeriod(event.period_text)}</div>}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/konkurrencer"
            className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Offentlig forside
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Log ud
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-6 rounded-2xl border bg-white p-5 text-sm text-slate-600 shadow-sm">Loader scorekeeper…</div>
      )}

      {!loading && !data?.ok && (
        <div className="mt-6 rounded-2xl border bg-white p-5 text-sm text-orange-700 shadow-sm">
          {data?.error || "Ingen adgang."}
          <div className="mt-3">
            <Link href="/konkurrencer/ansvarlig" className="text-sm font-semibold text-slate-900 underline">
              Gå til ansvarlig login
            </Link>
          </div>
        </div>
      )}

      {!loading && data?.ok && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          {/* LEFT: spil */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-800">Registrering (scorekeeper)</div>
            <div className="mt-1 text-xs text-slate-500">
              Du kan løbende tilføje spillere. Ingen spiller self-entry. Du er scorekeeper 😄
            </div>

            <div className="mt-4">
              <NineDartChallenge
                onFinish={onFinish}
                deviceId={getDeviceId()}
                presetEventCode={eventCode}
                presetEventTitle={event?.title || eventCode}
                presetEventDate={eventDate}
                lockEvent={true}
                launchMode="window"
                // VIGTIGT: tavlen (indtastning) ligger på /konkurrencer/spil
                // "scoreboard"-ruten er udfaset og skal ikke bruges.
                scoreboardPath="/konkurrencer/scoretavle"

              />
            </div>
          </div>

          {/* RIGHT: scoreboard + event info */}
          <div className="grid gap-4">
            <ArcadeLeaderboard
              activeGame="nine"
              refreshKey={refreshKey}
              variant="compact"
              limit={limit}
              eventCode={eventCode}
              showRecent={false}
              cardClassName="h-auto"
            />

            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-800">Event-info</div>
              <div className="mt-3 space-y-3">
                <div>
                  <div className="text-xs font-semibold text-slate-600">Regler</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{event?.rules_text || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-600">Pris</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{event?.price_text || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-600">Præmier</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{event?.prizes_text || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
/* [HELP:KONKURRENCER:KIOSK:PAGE] END */


// [HELP:KONKURRER_KIOSK_PAGE] END
