"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ArcadeCard from "./ArcadeCard";
import ArcadeLeaderboard from "./ArcadeLeaderboard";
import NineDartChallenge from "@/components/arcade/games/NineDartChallengeTyped";


/* [HELP:ARCADE:HUB] START */
export type ArcadeGameKey = "nine" | "bigfish" | "clock";


type EventStatus = "LIVE" | "UPCOMING" | "PAST";

type FinishPayload = {
  nickname: string;
  value: number;
  meta?: Record<string, any>;
};

type ArcadeEvent = {
  visible?: string;
  order?: any;
  event_code?: string;
  // valgfrit: styr om et event kan spilles (LIVE/UPCOMING/PAST)
  status?: string;
  // valgfrit: badge på kortet (fx "Januar", "Februar")
  badge_text?: string;
  // valgfrit: start/slut datoer (YYYY-MM-DD eller ISO)
  start_date?: string;
  end_date?: string;
  // (valgfri) hvis du vil styre event-dato direkte i ARCADE_EVENTS
  event_date?: string;
  date_start?: string;
  title?: string;
  subtitle?: string;
  period_text?: string;
  rules_text?: string;
  price_text?: string;
  // i arket hedder kolonnen typisk 'prize_text' (uden s)
  prize_text?: string;
  prizes_text?: string;
  leaderboard_limit?: any;
  show_recent?: string;
  draw_winner_nickname?: string;
  draw_winner_note?: string;
};

function slugify(s: string): string {
  return String(s || "")
    .trim()
    .toUpperCase()
    .replace(/[Æ]/g, "AE")
    .replace(/[Ø]/g, "OE")
    .replace(/[Å]/g, "AA")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function ensureEventCode(ev: ArcadeEvent): string {
  const direct = String(
    (ev as any).event_code ??
      (ev as any).eventCode ??
      (ev as any).code ??
      (ev as any).id ??
      (ev as any).event ??
      ""
  ).trim();
  if (direct) return direct;

  // fallback: stabil kode ud fra titel + dato/period
  const title = String(ev.title || "EVENT");
  const rawDate = String((ev as any).event_date || (ev as any).date_start || ev.period_text || "").trim();
  const datePart = rawDate ? rawDate.slice(0, 10) : "";
  const base = slugify(title) || "EVENT";
  return datePart ? `${base}_${slugify(datePart)}` : base;
}

function eventDateOf(ev: ArcadeEvent): string {
  const raw = String((ev as any).event_date || (ev as any).date_start || ev.period_text || "").trim();
  if (!raw) return "";
  // accepter både YYYY-MM-DD og ISO
  return raw.length >= 10 ? raw.slice(0, 10) : raw;
}

const DK_MONTHS = [
  "januar",
  "februar",
  "marts",
  "april",
  "maj",
  "juni",
  "juli",
  "august",
  "september",
  "oktober",
  "november",
  "december",
];

function cap(s: string) {
  const t = String(s || "").trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function parseDateLike(raw: any): Date | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  const d = m ? m[0] : s;
  // forvent YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const dt = new Date(d + "T00:00:00");
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function fmtDKDate(raw: any): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  const d = m ? m[0] : s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, mo, da] = d.split("-");
    return `${da}-${mo}-${y}`;
  }
  return s;
}

function replaceYmdTokens(text: any): string {
  const s = String(text || "");
  if (!s) return "";
  // Konverter YYYY-MM-DD til dd-mm-yyyy og fjern evt. tidsstempler (T00:00:00.000Z osv.)
  return s.replace(/(\d{4})-(\d{2})-(\d{2})(?:[T\s][0-9:.+\-Z]*)?/g, (_m, y, mo, da) => `${da}-${mo}-${y}`);
}

function monthFromText(text: any): string {
  const s = String(text || "").toLowerCase();
  if (!s) return "";
  for (const m of DK_MONTHS) {
    if (s.includes(m)) return m;
  }
  return "";
}

function statusOf(ev: ArcadeEvent | null): EventStatus {
  if (!ev) return "LIVE";
  const explicit = String((ev as any).status || "").trim().toUpperCase();
  if (explicit === "UPCOMING" || explicit === "COMING" || explicit === "COMING_SOON" || explicit === "SOON") return "UPCOMING";
  if (explicit === "PAST" || explicit === "CLOSED" || explicit === "DONE") return "PAST";
  if (explicit === "LIVE" || explicit === "ACTIVE" || explicit === "OPEN") return "LIVE";

  // automatisk fallback hvis start/slut datoer findes
  const start = parseDateLike((ev as any).start_date || (ev as any).date_start || (ev as any).event_date || "");
  const end = parseDateLike((ev as any).end_date || (ev as any).date_end || "");
  const today = new Date();
  if (start && today < start) return "UPCOMING";
  if (end && today > end) return "PAST";
  return "LIVE";
}

function badgeOf(ev: ArcadeEvent | null): string {
  if (!ev) return "";
  const direct = String((ev as any).badge_text || (ev as any).badge || "").trim();
  if (direct) return cap(direct);

  const start = parseDateLike((ev as any).start_date || (ev as any).date_start || (ev as any).event_date || "");
  if (start) return cap(DK_MONTHS[start.getMonth()] || "");

  const m = monthFromText((ev as any).period_text || (ev as any).title || "");
  return m ? cap(m) : "";
}

function toYes(v: any): boolean {
  return String(v ?? "").trim().toUpperCase() === "YES";
}

function toNum(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const key = "hdk_arcade_device_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = "DEV-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  localStorage.setItem(key, id);
  return id;
}

function textLines(s?: string) {
  const t = String(s || "").trim();
  if (!t) return [];
  return t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
}

function asList(lines: string[]) {
  if (!lines.length) return null;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
      {lines.map((l, i) => (
        <li key={i} className="whitespace-pre-wrap">
          {l.replace(/^[-•]\s*/, "")}
        </li>
      ))}
    </ul>
  );
}

export default function ArcadeHub() {
  const activeGame: ArcadeGameKey = "nine";

  const deviceId = useMemo(() => getDeviceId(), []);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showScores, setShowScores] = useState(false);

  const [events, setEvents] = useState<ArcadeEvent[]>([]);
  const [selectedEventCode, setSelectedEventCode] = useState<string>("");
  const [eventLoading, setEventLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    async function loadEvents() {
      try {
        setEventLoading(true);
        const res = await fetch(`/api/sheet?tab=ARCADE_EVENTS`, { cache: "no-store" });
        const json: any = await res.json().catch(() => ({}));
        const items = Array.isArray(json?.items) ? (json.items as ArcadeEvent[]) : [];

        const vis = items
          .filter((r) => toYes((r as any).visible))
          .map((ev) => {
            const code = ensureEventCode(ev);
            const date = eventDateOf(ev);
            return {
              ...ev,
              event_code: code,
              // robust mapping af kolonnenavne (arket kan hedde prize_text uden 's')
              prizes_text: String((ev as any).prizes_text ?? (ev as any).prize_text ?? (ev as any).prizes_md ?? (ev as any).prize_md ?? ""),
              // hvis arket ikke har event_date/date_start, så kan vi stadig aflede en dato fra period_text
              event_date: date || (ev as any).event_date || (ev as any).date_start || "",
            } as ArcadeEvent;
          })
          .sort((a, b) => toNum((a as any).order, 9999) - toNum((b as any).order, 9999));

        if (!alive) return;
        setEvents(vis);

        const saved = localStorage.getItem("hdk_arcade_selected_event") || "";
        const pick = saved && vis.find((e) => (e.event_code || "") === saved) ? saved : vis[0]?.event_code || "";
        setSelectedEventCode(pick);
      } catch {
        if (!alive) return;
        setEvents([]);
      } finally {
        if (alive) setEventLoading(false);
      }
    }
    loadEvents();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("hdk_arcade_selected_event", selectedEventCode || "");
  }, [selectedEventCode]);

  const selectedEvent = useMemo(() => events.find((e) => (e.event_code || "") === selectedEventCode) || events[0] || null, [events, selectedEventCode]);

  const selectedStatus = useMemo(() => statusOf(selectedEvent), [selectedEvent]);
  const selectedBadge = useMemo(() => badgeOf(selectedEvent), [selectedEvent]);

  const leaderboardLimit = useMemo(() => {
    const n = toNum((selectedEvent as any)?.leaderboard_limit, 5);
    return Math.min(10, Math.max(3, n || 5));
  }, [selectedEvent]);

  const showRecent = useMemo(() => toYes((selectedEvent as any)?.show_recent), [selectedEvent]);

  const handleFinish = useCallback(
    async (payload: FinishPayload) => {
      const body = {
        game: activeGame,
        nickname: payload.nickname,
        value: payload.value,
        device_id: deviceId,
        event_code: (selectedEvent?.event_code || "").trim(),
        meta: payload.meta || {},
      };

      const res = await fetch("/api/arcade/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Kunne ikke gemme score.");
      }

      setRefreshKey((n) => n + 1);
    },
    [activeGame, deviceId, selectedEvent?.event_code]
  );

  return (
    <div className="w-full">
      {/* Events (klikbare kort) */}
      <div className="mb-4 rounded-2xl border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-black text-slate-900">Vælg event</div>
            <div className="mt-1 text-xs text-slate-600">
              Tryk på et event for at fortsætte. Du kan vise events som <span className="font-semibold">LIVE</span>, <span className="font-semibold"> Kommer snart</span> eller{" "}
              <span className="font-semibold">Afsluttet</span> direkte i arket.
            </div>
          </div>
          {eventLoading && <span className="text-xs text-slate-500">Henter…</span>}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => {
            const code = String(ev.event_code || "");
            const isSelected = code && code === selectedEventCode;
            const st = statusOf(ev);
            const badge = badgeOf(ev);
            const period = replaceYmdTokens(String(ev.period_text || ""));

            const statusLabel = st === "LIVE" ? "LIVE" : st === "UPCOMING" ? "KOMMER SNART" : "AFSLUTTET";
            const statusClass =
              st === "LIVE"
                ? "bg-slate-900 text-white border-slate-900"
                : st === "UPCOMING"
                ? "bg-white text-slate-900 border-slate-300"
                : "bg-slate-100 text-slate-700 border-slate-200";

            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setSelectedEventCode(code);
                  // lille “kom videre”-feel: scroll til detaljer/spil
                  setTimeout(() => {
                    try {
                      document.getElementById("hdk_arcade_event_details")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    } catch {}
                  }, 50);
                }}
                className={"group w-full rounded-2xl border p-3 text-left transition hover:bg-slate-50 " + (isSelected ? "ring-2 ring-slate-900" : "")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900 truncate">{ev.title || ev.event_code}</div>
                    {ev.subtitle ? <div className="mt-1 text-xs text-slate-600 truncate">{replaceYmdTokens(String(ev.subtitle))}</div> : null}
                    {period ? (
                      <div className="mt-1 text-xs text-slate-600">
                        <span className="font-semibold">Periode:</span> {period}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {badge ? (
                      <span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-900">{badge}</span>
                    ) : null}
                    <span className={"rounded-full border px-3 py-1 text-xs font-black " + statusClass}>{statusLabel}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* lille status-preview når man har valgt */}
        {selectedEvent ? (
          <div className="mt-3 text-xs text-slate-600">
            <span className="font-semibold">Valgt:</span> {selectedEvent.title || selectedEvent.event_code}
            {selectedBadge ? <span className="ml-2">· {selectedBadge}</span> : null}
            <span className="ml-2">· {selectedStatus === "LIVE" ? "LIVE" : selectedStatus === "UPCOMING" ? "Kommer snart" : "Afsluttet"}</span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <ArcadeCard title={selectedEvent?.title || "Konkurrence"} subtitle={selectedEvent?.subtitle || "Kast på rigtig skive — tast her. Laveste tilbage vinder."}>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-600">
                {selectedEvent?.period_text ? (
                  <>
                    <span className="font-semibold">Periode:</span> {replaceYmdTokens(String(selectedEvent.period_text))}
                  </>
                ) : (
                  "Denne måneds challenge."
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedBadge ? (
                  <span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-900">{selectedBadge}</span>
                ) : null}
                <span
                  className={
                    "rounded-full border px-3 py-1 text-xs font-black " +
                    (selectedStatus === "LIVE"
                      ? "bg-slate-900 text-white border-slate-900"
                      : selectedStatus === "UPCOMING"
                      ? "bg-white text-slate-900 border-slate-300"
                      : "bg-slate-100 text-slate-700 border-slate-200")
                  }
                >
                  {selectedStatus === "LIVE" ? "LIVE" : selectedStatus === "UPCOMING" ? "KOMMER SNART" : "AFSLUTTET"}
                </span>
              </div>
            </div>

            {/* Event info */}
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border bg-white p-3">
                <div className="text-xs font-semibold text-slate-700">Regler</div>
                {(() => {
                  const lines = textLines(selectedEvent?.rules_text);
                  if (!lines.length) return <div className="mt-2 text-sm text-slate-500">—</div>;
                  const preview = lines[0];
                  return (
                    <details className="mt-2">
                      <summary className="details-summary">
                        <span className="text-sm text-slate-700">{preview}</span>
                        <span className="details-chevron">▾</span>
                      </summary>
                      <div className="mt-2 rounded-2xl border bg-slate-50 px-3 py-2">{asList(lines) || <div className="text-sm text-slate-500">—</div>}</div>
                    </details>
                  );
                })()}
              </div>

              <div className="rounded-2xl border bg-white p-3">
                <div className="text-xs font-semibold text-slate-700">Pris</div>
                <div className="mt-2">
                  {(() => {
                    const lines = textLines(selectedEvent?.price_text);
                    if (!lines.length) return <div className="text-sm text-slate-500">—</div>;
                    return lines.length > 1 ? asList(lines) : <div className="text-sm text-slate-700 whitespace-pre-wrap">{lines[0]}</div>;
                  })()}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-3">
                <div className="text-xs font-semibold text-slate-700">Præmier</div>
                <div className="mt-2">
                  {(() => {
                    const lines = textLines(selectedEvent?.prizes_text);
                    if (!lines.length) return <div className="text-sm text-slate-500">—</div>;
                    return lines.length > 1 ? (
                      <div className="rounded-2xl border bg-slate-50 px-3 py-2">{asList(lines)}</div>
                    ) : (
                      <div className="rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap">{lines[0]}</div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* mobil knap */}
            <div className="mt-4 flex justify-end lg:hidden">
              <button type="button" onClick={() => setShowScores(true)} className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                Se scores
              </button>
            </div>

            <div className="mt-4" id="hdk_arcade_event_details">
              {selectedStatus === "LIVE" ? (
                <NineDartChallenge
                  onFinish={handleFinish}
                  deviceId={deviceId}
                  presetEventCode={(selectedEvent?.event_code || "").trim()}
                  presetEventTitle={(selectedEvent?.title || "").trim()}
                  presetEventDate={eventDateOf(selectedEvent || ({} as ArcadeEvent))}
                  lockEvent
                  launchMode="window"
                  scoreboardPath="/konkurrencer/scoretavle"

                />
              ) : (
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="text-sm font-black text-slate-900">{selectedStatus === "UPCOMING" ? "Kommer snart" : "Event afsluttet"}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {selectedStatus === "UPCOMING"
                      ? "Dette event er synligt, men kan først startes når det bliver sat LIVE i arket."
                      : "Dette event er lukket. Du kan stadig se scores og historik i leaderboardet."}
                  </div>
                  <div className="mt-3 text-xs text-slate-600">
                    Tip: Tilføj en kolonne <span className="font-semibold">status</span> i ARCADE_EVENTS (LIVE/UPCOMING/PAST) og evt.{" "}
                    <span className="font-semibold">badge_text</span> (fx “Februar”) for fuld kontrol.
                  </div>
                </div>
              )}
            </div>
          </ArcadeCard>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block space-y-3">
          <ArcadeLeaderboard activeGame={activeGame} refreshKey={refreshKey} variant="compact" limit={Math.min(5, leaderboardLimit)} eventCode={selectedEvent?.event_code || ""} showRecent={false} />

          <ArcadeCard title="Lodtrækning" subtitle="Vinder trækkes blandt købte forsøg." className="h-auto">
            <div className="text-sm">
              {selectedEvent?.draw_winner_nickname ? (
                <div className="rounded-2xl border bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-600">Vinder</div>
                  <div className="text-base font-black">{selectedEvent.draw_winner_nickname}</div>
                  {selectedEvent.draw_winner_note && <div className="mt-1 text-xs text-slate-600 whitespace-pre-wrap">{selectedEvent.draw_winner_note}</div>}
                </div>
              ) : (
                <div className="text-sm text-slate-500">Ikke trukket endnu.</div>
              )}
            </div>
          </ArcadeCard>

          <button type="button" onClick={() => setShowScores(true)} className="w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50">
            Se hele listen
          </button>
        </div>
      </div>

      {/* Scores modal */}
      {showScores && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Highscore</div>
              <button type="button" onClick={() => setShowScores(false)} className="rounded-xl border px-3 py-1 text-sm font-semibold hover:bg-slate-50">
                Luk
              </button>
            </div>

            <div className="mt-3">
              <ArcadeLeaderboard activeGame={activeGame} refreshKey={refreshKey} variant="full" limit={leaderboardLimit} eventCode={selectedEvent?.event_code || ""} showRecent={showRecent} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/* [HELP:ARCADE:HUB] END */
