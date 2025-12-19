"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardTitle } from "./PortalCards";
import type { SheetItem, SheetResponse } from "./portalTypes";
import { buildViewerUrl, groupStartsWith, isHttpUrl, isVisible, safeText, toOrder } from "./portalUtils";

type MemberItem = {
  member_id?: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  start_date?: string;
  birth_year?: any;
  birthYear?: any;
  fødselsår?: any;
  city?: any;
  by?: any;
  post_city?: any;
  postnr_by?: any;
};

function normalizeYmd(v: any): string {
  const s = safeText(v);
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  let m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const da = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }
  return "";
}

function sortKey(m: MemberItem): number {
  const ymd = normalizeYmd(m.created_at) || normalizeYmd(m.start_date);
  if (!ymd) return 0;
  return new Date(`${ymd}T00:00:00Z`).getTime();
}

function displayName(m: MemberItem): string {
  const fn = safeText(m.first_name);
  const ln = safeText(m.last_name);
  const full = `${fn} ${ln}`.trim();
  return full || "(navn mangler)";
}

function initialsFromName(full: string) {
  const parts = safeText(full).split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase() || "HD";
}

function isDriveOrDocsUrl(url: string) {
  const u = url.toLowerCase();
  return u.includes("drive.google.com") || u.includes("docs.google.com");
}

function pickUrl(it: any) {
  const a = safeText(it?.button_url);
  if (a) return a;
  const b = safeText(it?.real_url);
  if (b) return b;
  const c = safeText(it?.url);
  if (c) return c;
  return "";
}

function pickLabel(it: any) {
  const a = safeText(it?.button_label);
  if (a) return a;
  return pickUrl(it) ? "Åbn" : "";
}

function memberCity(m: MemberItem) {
  return safeText(m.city) || safeText(m.by) || safeText(m.post_city) || safeText(m.postnr_by) || "";
}

function memberAgeDecadeLabel(m: MemberItem) {
  const raw = m.birth_year ?? m.birthYear ?? (m as any)["fødselsår"] ?? "";
  const year = Number(String(raw || "").trim());
  if (!year || Number.isNaN(year) || year < 1900 || year > 2100) return "";

  const nowY = new Date().getFullYear();
  const age = nowY - year;
  if (age < 0 || age > 120) return "";

  const decade = Math.floor(age / 10) * 10;
  if (decade < 10) return "";
  return `i ${decade}’erne`;
}

function memberMetaLine(m: MemberItem) {
  const city = memberCity(m);
  const decade = memberAgeDecadeLabel(m);
  const bits = [city ? `fra ${city}` : "", decade].filter(Boolean);
  return bits.join(" • ");
}

function MiniItem({ it, onOpen }: { it: SheetItem; onOpen: (it: SheetItem) => void }) {
  const title = safeText(it.title) || "Update";
  const desc = safeText(it.description) || safeText((it as any).subtitle);
  const url = pickUrl(it);
  const label = pickLabel(it);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-black">{title}</div>
      {desc ? <div className="mt-1 text-sm text-slate-600">{desc}</div> : null}
      {url ? (
        <button
          type="button"
          className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black hover:bg-slate-50"
          onClick={() => onOpen(it)}
        >
          {label || "Åbn"}
        </button>
      ) : null}
    </div>
  );
}

function MemberChip({ m }: { m: MemberItem }) {
  const name = displayName(m);
  const meta = memberMetaLine(m);

  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-xs font-black">
        {initialsFromName(name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black">{name}</span>
        {meta ? <span className="block truncate text-xs font-semibold text-slate-500">{meta}</span> : null}
      </span>
    </span>
  );
}

function MoreChip({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/50 px-3 py-2 text-sm font-black text-slate-700">
      +{n} flere
    </span>
  );
}

export default function PortalDashboard() {
  const router = useRouter();

  const [sheet, setSheet] = useState<SheetItem[]>([]);
  const [loadingSheet, setLoadingSheet] = useState(false);

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // [HELP:PORTAL:TEXTS] START
  // Her kan du nemt rette copy/tekster (vi kan senere flytte det til arket, hvis du vil).
  const HERO_SUBTITLE =
    "Velkommen i dit interne klubhus. Her finder du nyheder, kalender, materialer og det praktiske — uden støj og uden at du skal lede.";
  const INTRO_TITLE = "Kom godt i gang 👋";
  const INTRO_LINE =
    "Til venstre finder du menuen. Hover på en overskrift for at se undermenuerne. På mobil trykker du bare “Menu”.";
  const WELCOME_TITLE = "Velkommen til vores nye medlemmer 💚";
  const WELCOME_TEXT_1 =
    "Tag godt imod dem der er kommet til — et “hej” gør faktisk en kæmpe forskel, især hvis man er ny.";
  const WELCOME_TEXT_2 =
    "Tip: Har du lyst, så smid en kort velkomst i Klub-puls. Det er sådan vi bygger kulturen.";
  // [HELP:PORTAL:TEXTS] END

  // Intro/guide ved første besøg
  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => {
    try {
      const seen = localStorage.getItem("hdk_portal_intro_seen");
      if (!seen) setShowIntro(true);
    } catch {
      // ignore
    }
  }, []);

  const closeIntro = () => {
    setShowIntro(false);
    try {
      localStorage.setItem("hdk_portal_intro_seen", "1");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoadingSheet(true);
      try {
        const res = await fetch(`/api/sheet?tab=MEDLEMSZONE&_ts=${Date.now()}`, { cache: "no-store" });
        const json = (await res.json()) as SheetResponse;
        const raw = (json.items || (json as any).data || []) as SheetItem[];

        const normalized = (raw || [])
          .filter((x) => isVisible((x as any).visible))
          .map((x) => ({ ...x, order: toOrder((x as any).order) }))
          .sort((a, b) => toOrder((a as any).order) - toOrder((b as any).order));

        if (!canceled) setSheet(normalized);
      } catch {
        if (!canceled) setSheet([]);
      } finally {
        if (!canceled) setLoadingSheet(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoadingMembers(true);
      try {
        const res = await fetch(`/api/member/list?_ts=${Date.now()}`, { cache: "no-store" });
        const json = await res.json().catch(() => null);
        const arr = Array.isArray((json as any)?.items)
          ? ((json as any).items as MemberItem[])
          : Array.isArray((json as any)?.members)
            ? ((json as any).members as MemberItem[])
            : [];
        if (!canceled) setMembers(arr);
      } catch {
        if (!canceled) setMembers([]);
      } finally {
        if (!canceled) setLoadingMembers(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  const pick = (prefixes: string[]) =>
    sheet.filter((x) => prefixes.some((p) => groupStartsWith(x.group, p)));

  const news = useMemo(() => pick(["Portal – Nyheder", "Portal - Nyheder", "Portal – Puls", "Portal - Puls"]), [sheet]);

  const kalender = useMemo(
    () => pick(["Portal – Kalender", "Portal - Kalender", "Portal – Events", "Portal - Events"]),
    [sheet]
  );

  const dokumenter = useMemo(() => pick(["Portal – Dokumenter", "Portal - Dokumenter"]), [sheet]);

  const newestMembersPack = useMemo(() => {
    // Vi filtrerer stadig “seneste 14 dage” internt, men vi skriver det ikke på skærmen.
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const arr = [...(members || [])]
      .filter((m) => sortKey(m) >= cutoff)
      .filter((m) => safeText(m.first_name) || safeText(m.last_name))
      .sort((a, b) => sortKey(b) - sortKey(a));

    const shown = arr.slice(0, 6);
    const more = Math.max(0, arr.length - shown.length);
    return { shown, more };
  }, [members]);

  const openItem = (it: SheetItem) => {
    const url = pickUrl(it);
    if (!url) return;

    if (url.toLowerCase().startsWith("mailto:")) {
      window.location.href = url;
      return;
    }

    if (isHttpUrl(url)) {
      if (isDriveOrDocsUrl(url)) {
        window.open(buildViewerUrl(url), "_blank", "noopener,noreferrer");
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (url.startsWith("/")) {
      router.push(url);
    }
  };

  return (
    <div className="grid gap-4">
      {/* Hero */}
      <Card className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(750px circle at 14% 15%, rgba(249,115,22,0.18), transparent 62%), radial-gradient(750px circle at 86% 10%, rgba(59,130,246,0.10), transparent 64%)",
          }}
        />
        <div className="relative">
          <CardTitle icon="🎯" title="HDK Portal" subtitle={HERO_SUBTITLE} />

          {/* 3 knapper */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/portal/nyheder"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black hover:opacity-90"
              title="Se seneste nyt"
            >
              Seneste nyt <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/portal/kalender"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black hover:bg-slate-50"
              title="Se kalender"
            >
              Kalender <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/portal/dart-abc"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black hover:bg-slate-50"
              title="Nybegynder? Start her"
            >
              Dart ABC <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Intro/guide (første gang) */}
          {showIntro ? (
            <div className="mt-4 rounded-3xl border border-slate-200 bg-white/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black">{INTRO_TITLE}</div>
                  <div className="mt-1 text-sm text-slate-600">{INTRO_LINE}</div>

                  <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 space-y-1">
                    <li>
                      <b>Start</b>: nyheder + kalender (det vigtigste her og nu)
                    </li>
                    <li>
                      <b>My Academy</b>: din udvikling og træningsstof
                    </li>
                    <li>
                      <b>Dart ABC</b>: perfekt hvis du er ny — 3 min og du lyder som en gammel rotte 😄
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={closeIntro}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black hover:bg-slate-50"
                >
                  Got it
                </button>
              </div>
            </div>
          ) : null}

          {/* Nye ansigter */}
          {loadingMembers ? (
            <div className="mt-4 text-sm text-slate-600">Henter nye ansigter…</div>
          ) : newestMembersPack.shown.length ? (
            <div className="mt-4 rounded-3xl border border-slate-200 bg-white/60 p-4">
              <div className="text-sm font-black">{WELCOME_TITLE}</div>
              <div className="mt-1 text-sm text-slate-600">{WELCOME_TEXT_1}</div>
              <div className="mt-1 text-sm text-slate-600">{WELCOME_TEXT_2}</div>

              <div className="mt-3 flex flex-wrap gap-2">
                {newestMembersPack.shown.map((m, idx) => (
                  <MemberChip key={`${m.member_id || idx}`} m={m} />
                ))}
                {newestMembersPack.more ? <MoreChip n={newestMembersPack.more} /> : null}
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {/* 3 store kort */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardTitle icon="🗞️" title="Seneste nyt" subtitle="Kort og kontant – 2 ting du bør vide." />
          {loadingSheet ? (
            <div className="mt-4 text-sm text-slate-600">Henter…</div>
          ) : news.length ? (
            <div className="mt-4 grid gap-3">
              {news.slice(0, 2).map((it, idx) => (
                <MiniItem key={idx} it={it} onOpen={openItem} />
              ))}
              <Link href="/portal/nyheder" className="text-sm font-black text-slate-600 hover:text-slate-900">
                Vis alle →
              </Link>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-600">
              Ingen nyheder endnu. Tip: brug group <b>Portal – Puls</b> eller <b>Portal – Nyheder</b> i MEDLEMSZONE.
            </div>
          )}
        </Card>

        <Card>
          <CardTitle icon="📅" title="Næste i kalenderen" subtitle="2 kommende ting – så du altid er med." />
          {kalender.length ? (
            <div className="mt-4 grid gap-3">
              {kalender.slice(0, 2).map((it, idx) => (
                <MiniItem key={idx} it={it} onOpen={openItem} />
              ))}
              <Link href="/portal/kalender" className="text-sm font-black text-slate-600 hover:text-slate-900">
                Se hele kalenderen →
              </Link>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-600">Kalenderen er tom lige nu.</div>
          )}
        </Card>

        <Card>
          <CardTitle icon="🚀" title="My Academy" subtitle="Din rejse, dine skills – alt samlet." />
          <div className="mt-4 grid gap-2">
            <Link
              href="/portal/academy"
              className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-black ring-1 ring-orange-200 hover:bg-orange-100"
            >
              Start din rejse →
            </Link>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href="/portal/academy/kampklar"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black hover:bg-slate-50"
              >
                Kampklar-test →
              </Link>
              <Link
                href="/portal/materialer"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black hover:bg-slate-50"
              >
                Materialer →
              </Link>
            </div>

            {dokumenter.length ? (
              <div className="mt-2">
                <div className="text-xs font-black uppercase tracking-wider text-slate-500">Seneste materialer</div>
                <div className="mt-2 grid gap-2">
                  {dokumenter.slice(0, 2).map((it, idx) => {
                    const url = pickUrl(it);
                    return (
                      <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-sm font-black">{safeText(it.title) || "Uden titel"}</div>
                        <div className="mt-2">
                          {url ? (
                            <button
                              type="button"
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black hover:bg-slate-50"
                              onClick={() => openItem(it)}
                            >
                              {pickLabel(it) || "Åbn"}
                            </button>
                          ) : (
                            <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600">
                              Kommer snart
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
