"use client";

import { useEffect, useMemo, useState } from "react";

type Match = {
  round: number;
  date: string;
  time: string;
  home: string;
  away: string;
};

type ClubInfo = {
  key: string;
  label: string;
  venueName: string;
  address?: string;
  city?: string;
  teams: string[];
};

/* [HELP:HOLDTURNERING:DATA] START */
const MDT_TOURNAMENT_ID = "22";
const FULL_SCHEDULE_URL = `https://hdk.my-darts-tournament.dk/mdt/vorrunde.php?turnierid=${MDT_TOURNAMENT_ID}`;
const TABLE_URL = `https://hdk.my-darts-tournament.dk/mdt/tabelle.php?turnierid=${MDT_TOURNAMENT_ID}`;
const LIVE_URL = `https://hdk.my-darts-tournament.dk/mdt/livescore.php?turnierid=${MDT_TOURNAMENT_ID}`;

const CLUBS: ClubInfo[] = [
  {
    key: "Humlum",
    label: "Humlum Dartklub",
    venueName: "Humlum Dartklub",
    address: "Chr. Gades Vej 30",
    city: "7600 Struer",
    teams: ["Humlum 1", "Humlum 2", "Humlum 3"],
  },
  {
    key: "Thyboerne",
    label: "Dartklubben Thyboerne",
    venueName: "Dartklubben Thyboerne",
    address: "Stagstrup Skolevej 5",
    city: "7752 Snedsted",
    teams: ["Thyboerne 1", "Thyboerne 2"],
  },
  {
    key: "Jyden",
    label: "Jyden Dartklub",
    venueName: "Jyden Dartklub",
    address: "Dominovej 4",
    city: "7500 Holstebro",
    teams: ["Jyden 1", "Jyden 2"],
  },
  {
    key: "Pirates",
    label: "Pirates",
    venueName: "Pirates",
    address: "Roslevvej 1 st",
    city: "7870 Roslev",
    teams: ["Pirates 1", "Pirates 2"],
  },
  {
    key: "Morsø Bulls",
    label: "Morsø Bulls",
    venueName: "Morsø Bulls",
    address: "Ringvejen 44",
    city: "7900 Nykøbing M",
    teams: ["Morsø Bulls 1"],
  },
  {
    key: "Lemvig",
    label: "Lemvig",
    venueName: "Lemvig",
    teams: ["Lemvig 1"],
  },
];

const MATCHES: Match[] = [
  { round: 1, date: "2026-03-17", time: "18:30", home: "Lemvig 1", away: "Morsø Bulls 1" },
  { round: 1, date: "2026-03-17", time: "18:30", home: "Pirates 2", away: "Pirates 1" },
  { round: 1, date: "2026-03-17", time: "18:30", home: "Thyboerne 1", away: "Humlum 2" },
  { round: 1, date: "2026-03-17", time: "18:30", home: "Humlum 1", away: "Thyboerne 2" },
  { round: 1, date: "2026-03-17", time: "18:30", home: "Jyden 2", away: "Jyden 1" },

  { round: 2, date: "2026-04-21", time: "19:00", home: "Thyboerne 2", away: "Jyden 2" },
  { round: 2, date: "2026-04-21", time: "19:00", home: "Humlum 2", away: "Humlum 1" },
  { round: 2, date: "2026-04-21", time: "19:00", home: "Pirates 1", away: "Thyboerne 1" },
  { round: 2, date: "2026-04-21", time: "19:00", home: "Morsø Bulls 1", away: "Pirates 2" },
  { round: 2, date: "2026-04-21", time: "19:00", home: "Humlum 3", away: "Lemvig 1" },

  { round: 3, date: "2026-05-12", time: "19:00", home: "Pirates 2", away: "Humlum 3" },
  { round: 3, date: "2026-05-12", time: "19:00", home: "Thyboerne 1", away: "Morsø Bulls 1" },
  { round: 3, date: "2026-05-12", time: "19:00", home: "Humlum 1", away: "Pirates 1" },
  { round: 3, date: "2026-05-12", time: "19:00", home: "Jyden 2", away: "Humlum 2" },
  { round: 3, date: "2026-05-12", time: "19:00", home: "Jyden 1", away: "Thyboerne 2" },

  { round: 4, date: "2026-05-26", time: "19:00", home: "Humlum 2", away: "Jyden 1" },
  { round: 4, date: "2026-05-26", time: "19:00", home: "Pirates 1", away: "Jyden 2" },
  { round: 4, date: "2026-05-26", time: "19:00", home: "Morsø Bulls 1", away: "Humlum 1" },
  { round: 4, date: "2026-05-26", time: "19:00", home: "Humlum 3", away: "Thyboerne 1" },
  { round: 4, date: "2026-05-26", time: "19:00", home: "Lemvig 1", away: "Pirates 2" },

  { round: 5, date: "2026-06-09", time: "19:00", home: "Thyboerne 1", away: "Lemvig 1" },
  { round: 5, date: "2026-06-09", time: "19:00", home: "Humlum 1", away: "Humlum 3" },
  { round: 5, date: "2026-06-09", time: "19:00", home: "Jyden 2", away: "Morsø Bulls 1" },
  { round: 5, date: "2026-06-09", time: "19:00", home: "Jyden 1", away: "Pirates 1" },
  { round: 5, date: "2026-06-09", time: "19:00", home: "Thyboerne 2", away: "Humlum 2" },

  { round: 6, date: "2026-08-18", time: "19:00", home: "Pirates 1", away: "Thyboerne 2" },
  { round: 6, date: "2026-08-18", time: "19:00", home: "Morsø Bulls 1", away: "Jyden 1" },
  { round: 6, date: "2026-08-18", time: "19:00", home: "Humlum 3", away: "Jyden 2" },
  { round: 6, date: "2026-08-18", time: "19:00", home: "Lemvig 1", away: "Humlum 1" },
  { round: 6, date: "2026-08-18", time: "19:00", home: "Pirates 2", away: "Thyboerne 1" },

  { round: 7, date: "2026-09-01", time: "19:00", home: "Humlum 1", away: "Pirates 2" },
  { round: 7, date: "2026-09-01", time: "19:00", home: "Jyden 2", away: "Lemvig 1" },
  { round: 7, date: "2026-09-01", time: "19:00", home: "Jyden 1", away: "Humlum 3" },
  { round: 7, date: "2026-09-01", time: "19:00", home: "Thyboerne 2", away: "Morsø Bulls 1" },
  { round: 7, date: "2026-09-01", time: "19:00", home: "Humlum 2", away: "Pirates 1" },

  { round: 8, date: "2026-09-15", time: "19:00", home: "Morsø Bulls 1", away: "Humlum 2" },
  { round: 8, date: "2026-09-15", time: "19:00", home: "Humlum 3", away: "Thyboerne 2" },
  { round: 8, date: "2026-09-15", time: "19:00", home: "Lemvig 1", away: "Jyden 1" },
  { round: 8, date: "2026-09-15", time: "19:00", home: "Pirates 2", away: "Jyden 2" },
  { round: 8, date: "2026-09-15", time: "19:00", home: "Thyboerne 1", away: "Humlum 1" },

  { round: 9, date: "2026-10-06", time: "19:00", home: "Jyden 2", away: "Thyboerne 1" },
  { round: 9, date: "2026-10-06", time: "19:00", home: "Jyden 1", away: "Pirates 2" },
  { round: 9, date: "2026-10-06", time: "19:00", home: "Thyboerne 2", away: "Lemvig 1" },
  { round: 9, date: "2026-10-06", time: "19:00", home: "Humlum 2", away: "Humlum 3" },
  { round: 9, date: "2026-10-06", time: "19:00", home: "Pirates 1", away: "Morsø Bulls 1" },

  { round: 10, date: "2026-10-20", time: "19:00", home: "Humlum 3", away: "Pirates 1" },
  { round: 10, date: "2026-10-20", time: "19:00", home: "Lemvig 1", away: "Humlum 2" },
  { round: 10, date: "2026-10-20", time: "19:00", home: "Pirates 2", away: "Thyboerne 2" },
  { round: 10, date: "2026-10-20", time: "19:00", home: "Thyboerne 1", away: "Jyden 1" },
  { round: 10, date: "2026-10-20", time: "19:00", home: "Humlum 1", away: "Jyden 2" },

  { round: 11, date: "2026-11-10", time: "19:00", home: "Jyden 1", away: "Humlum 1" },
  { round: 11, date: "2026-11-10", time: "19:00", home: "Thyboerne 2", away: "Thyboerne 1" },
  { round: 11, date: "2026-11-10", time: "19:00", home: "Humlum 2", away: "Pirates 2" },
  { round: 11, date: "2026-11-10", time: "19:00", home: "Pirates 1", away: "Lemvig 1" },
  { round: 11, date: "2026-11-10", time: "19:00", home: "Humlum 3", away: "Morsø Bulls 1" },
];

const HDK_TEAMS = ["Humlum 1", "Humlum 2", "Humlum 3"] as const;
const ALL_TEAMS = CLUBS.flatMap((club) => club.teams);
/* [HELP:HOLDTURNERING:DATA] END */

/* [HELP:HOLDTURNERING:UTILS] START */
function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("da-DK", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatRoundDate(date: string, time: string) {
  return `${formatDate(date)} · kl. ${time}`;
}

function getClubKeyFromTeam(team: string) {
  return team.replace(/\s\d+$/, "");
}

function getClubByKey(clubKey: string) {
  return CLUBS.find((club) => club.key === clubKey);
}

function getClubByTeam(team: string) {
  return getClubByKey(getClubKeyFromTeam(team));
}

function getVenueForMatch(match: Match) {
  if (match.round === 1) {
    const thyboerne = getClubByKey("Thyboerne");
    return {
      venueName: "Dartklubben Thyboerne",
      addressLine: [thyboerne?.address, thyboerne?.city].filter(Boolean).join(", "),
      city: thyboerne?.city,
    };
  }

  const homeClub = getClubByTeam(match.home);
  return {
    venueName: homeClub?.venueName || match.home,
    addressLine: [homeClub?.address, homeClub?.city].filter(Boolean).join(", "),
    city: homeClub?.city,
  };
}

function getMatchesForTeam(team: string) {
  return MATCHES.filter((match) => match.home === team || match.away === team);
}

function getMatchesForRound(round: number) {
  return MATCHES.filter((match) => match.round === round);
}

function getAllRounds() {
  return Array.from(new Set(MATCHES.map((match) => match.round))).sort((a, b) => a - b);
}

function getOpponent(match: Match, team: string) {
  return match.home === team ? match.away : match.home;
}

function isHomeMatch(match: Match, team: string) {
  return match.home === team;
}

function isHDKMatch(match: Match) {
  return HDK_TEAMS.includes(match.home as (typeof HDK_TEAMS)[number]) || HDK_TEAMS.includes(match.away as (typeof HDK_TEAMS)[number]);
}

function getNextRound() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const uniqueRounds = Array.from(new Map(MATCHES.map((match) => [match.round, match])).values());

  return uniqueRounds.find((match) => new Date(`${match.date}T00:00:00`) >= today) || uniqueRounds[0];
}

function getUpcomingRounds(count: number) {
  const rounds = getAllRounds();
  const nextRound = getNextRound().round;
  const startIndex = Math.max(rounds.indexOf(nextRound), 0);
  return rounds.slice(startIndex, startIndex + count);
}

function getNextOwnMatch(team: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return getMatchesForTeam(team).find((match) => new Date(`${match.date}T00:00:00`) >= today) || getMatchesForTeam(team)[0];
}

function getRoundHeadline(round: number) {
  const roundMatch = getMatchesForRound(round)[0];
  if (!roundMatch) return `Runde ${round}`;
  return `Runde ${round} · ${formatRoundDate(roundMatch.date, roundMatch.time)}`;
}

function getFreeTeamsForRound(round: number) {
  const matches = getMatchesForRound(round);
  const teamsInRound = new Set(matches.flatMap((match) => [match.home, match.away]));
  return ALL_TEAMS.filter((team) => !teamsInRound.has(team));
}
/* [HELP:HOLDTURNERING:UTILS] END */

function ActionButton({
  href,
  children,
  live = false,
}: {
  href: string;
  children: React.ReactNode;
  live?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        live
          ? "bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500"
          : "bg-gradient-to-r from-orange-500 via-orange-400 to-blue-600"
      }`}
    >
      {live ? <span className="h-2.5 w-2.5 rounded-full bg-white/95 shadow-[0_0_0_4px_rgba(255,255,255,0.18)]" /> : null}
      {children}
    </a>
  );
}

function SectionCard({
  eyebrow,
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  eyebrow: string;
  title: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group mt-8 rounded-[2rem] border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-sm">
      <summary className="list-none cursor-pointer rounded-[2rem] px-6 py-5 marker:hidden sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {badge}
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition group-open:rotate-180">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.512a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
        </div>
      </summary>
      <div className="border-t border-slate-200/70 px-6 pb-6 pt-2">{children}</div>
    </details>
  );
}

function MatchCard({
  team,
  match,
  compact = false,
}: {
  team: string;
  match: Match;
  compact?: boolean;
}) {
  const opponent = getOpponent(match, team);
  const isHome = isHomeMatch(match, team);
  const venue = getVenueForMatch(match);

  return (
    <div
      className={`h-full min-h-[196px] rounded-[1.5rem] border p-4 shadow-sm ${
        isHome ? "border-emerald-200 bg-emerald-50/70" : "border-sky-200 bg-sky-50/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Runde {match.round}</p>
          <p className="mt-1 text-sm text-slate-600">{formatRoundDate(match.date, match.time)}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
            isHome ? "bg-emerald-600 text-white" : "bg-sky-600 text-white"
          }`}
        >
          {isHome ? "Hjemme" : "Ude"}
        </span>
      </div>

      <p className={`mt-3 font-bold text-slate-900 ${compact ? "text-base" : "text-lg"}`}>
        {isHome ? `${team} vs ${opponent}` : `${team} ude mod ${opponent}`}
      </p>

      <div className="mt-3 space-y-1.5 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Spillested:</span> {venue.venueName}
        </p>
        <p>
          <span className="font-semibold">Adresse:</span> {venue.addressLine || "Adresse ikke oplyst endnu"}
        </p>
      </div>
    </div>
  );
}

function RoundMatchRow({ match }: { match: Match }) {
  const venue = getVenueForMatch(match);
  const hasHDK = isHDKMatch(match);

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{formatRoundDate(match.date, match.time)}</p>
          <p className="mt-2 text-base font-bold text-slate-900 sm:text-lg">
            {match.home} <span className="text-slate-400">vs</span> {match.away}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasHDK ? (
            <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-orange-800">
              HDK kamp
            </span>
          ) : null}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
            Hjemmebane: {match.home}
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-[auto_1fr]">
        <span className="font-semibold text-slate-900">Adresse</span>
        <span>{venue.addressLine || "Adresse ikke oplyst endnu"}</span>
      </div>
    </div>
  );
}

function TeamRoundPanel({
  team,
  round,
}: {
  team: string;
  round: number;
}) {
  const roundMatch = MATCHES.find((match) => match.round === round && (match.home === team || match.away === team));
  const nextOwnMatch = getNextOwnMatch(team);

  return (
    <article className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-slate-900">{team}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roundMatch ? "border border-orange-200 bg-orange-50 text-orange-700" : "border border-slate-200 bg-white text-slate-600"}`}>
          {roundMatch ? "I spil" : "Spilfri"}
        </span>
      </div>

      <div className="mt-4 flex-1">
        {roundMatch ? (
          <MatchCard team={team} match={roundMatch} compact />
        ) : nextOwnMatch ? (
          <div className="flex h-full min-h-[196px] flex-col rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Spilfri i runde {round}</p>
            <p className="mt-2 text-base font-bold text-slate-900">Ingen kamp denne spilledag</p>
            <p className="mt-2 text-sm text-slate-600">Næste kamp er i runde {nextOwnMatch.round}.</p>
            <div className="mt-4 flex-1">
              <MatchCard team={team} match={nextOwnMatch} compact />
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function HoldturneringPage() {
  const nextRound = useMemo(() => getNextRound(), []);
  const allRounds = useMemo(() => getAllRounds(), []);
  const nextTwoRounds = useMemo(() => getUpcomingRounds(2), []);

  const [selectedClub, setSelectedClub] = useState<string>("Humlum");
  const [selectedTeam, setSelectedTeam] = useState<string>("Humlum 1");
  const [selectedRound, setSelectedRound] = useState<number>(nextRound.round);

  const selectedClubInfo = useMemo(() => getClubByKey(selectedClub) || CLUBS[0], [selectedClub]);

  useEffect(() => {
    if (!selectedClubInfo.teams.includes(selectedTeam)) {
      setSelectedTeam(selectedClubInfo.teams[0]);
    }
  }, [selectedClubInfo, selectedTeam]);

  const selectedTeamMatches = useMemo(() => getMatchesForTeam(selectedTeam), [selectedTeam]);
  const selectedRoundMatches = useMemo(() => getMatchesForRound(selectedRound), [selectedRound]);
  const selectedRoundFreeTeams = useMemo(() => getFreeTeamsForRound(selectedRound), [selectedRound]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* [HELP:HOLDTURNERING:HERO] START */}
      <section className="rounded-[2rem] border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-800">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            HOLDTURNERING 2026
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">11 hold</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">3 HDK-hold</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">11 runder</span>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Hotel Vildsund Strand Serien</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">Stilling, livevisning og kampplan samlet på én HDK-side.</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <ActionButton href={TABLE_URL}>Se stilling</ActionButton>
              <ActionButton href={FULL_SCHEDULE_URL}>Se samlet kampplan</ActionButton>
              <ActionButton href={LIVE_URL} live>
                Se live
              </ActionButton>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-700">
                <p>
                  <span className="font-bold text-slate-900">Regler:</span> 3-mands hold • alle mod alle én gang • bedst af 3 set • 501 double out • max 43 dart pr. leg • bull om udlæg + efter 42 dart • 2 kampe ad gangen • 5 runder pr. holdkamp
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50/90 p-4 text-sm font-medium text-blue-900">
                Kampstart: Runde 1 kl. 18:30 • øvrige runder kl. 19:00
              </div>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-slate-50/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Næste spilledag</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">Runde {nextRound.round}</p>
            <p className="mt-1 text-sm text-slate-700">{formatRoundDate(nextRound.date, nextRound.time)}</p>
            <p className="mt-3 text-sm text-slate-700">
              <span className="font-semibold">Spillested:</span> {getVenueForMatch(nextRound).venueName}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-semibold">Adresse:</span> {getVenueForMatch(nextRound).addressLine || "Adresse ikke oplyst endnu"}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4">
                <p className="text-3xl font-bold text-slate-900">11</p>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">hold</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4">
                <p className="text-3xl font-bold text-slate-900">3</p>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">HDK-hold</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4">
                <p className="text-3xl font-bold text-slate-900">11</p>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">runder</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
      {/* [HELP:HOLDTURNERING:HERO] END */}

      {/* [HELP:HOLDTURNERING:FINDER] START */}
      <SectionCard
        eyebrow="Find dit hold"
        title={selectedTeam}
        defaultOpen
        badge={<span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{selectedTeamMatches.length} kampe</span>}
      >
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <aside className="rounded-[1.75rem] border border-slate-200 bg-slate-50/90 p-5">
            <div className="space-y-4">
              <div>
                <label htmlFor="club-select" className="mb-2 block text-sm font-semibold text-slate-700">
                  Klub
                </label>
                <select
                  id="club-select"
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-orange-400"
                >
                  {CLUBS.map((club) => (
                    <option key={club.key} value={club.key}>
                      {club.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="team-select" className="mb-2 block text-sm font-semibold text-slate-700">
                  Hold
                </label>
                <select
                  id="team-select"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-orange-400"
                >
                  {selectedClubInfo.teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{selectedClubInfo.venueName}</p>
              <p className="mt-2">
                <span className="font-semibold">Adresse:</span>{" "}
                {[selectedClubInfo.address, selectedClubInfo.city].filter(Boolean).join(", ") || "Adresse ikke oplyst endnu"}
              </p>
              <p className="mt-2 text-xs text-slate-500">Ved hjemmebane spilles kampen her. Første runde er samlet hos Thyboerne.</p>
            </div>
          </aside>

          <div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              {selectedTeamMatches.map((match) => (
                <MatchCard key={`${selectedTeam}-${match.round}-${match.date}`} team={selectedTeam} match={match} />
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
      {/* [HELP:HOLDTURNERING:FINDER] END */}

      {/* [HELP:HOLDTURNERING:NEXTROUND] START */}
      <SectionCard
        eyebrow="HDK på næste spilledag"
        title={`Runde ${nextRound.round}`}
        defaultOpen
        badge={<span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">{getRoundHeadline(nextRound.round)}</span>}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-800">Hjemme = grøn</span>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-semibold text-sky-800">Ude = blå</span>
          {getFreeTeamsForRound(nextRound.round).length ? (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
              Spilfri denne runde: {getFreeTeamsForRound(nextRound.round).join(", ")}
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {HDK_TEAMS.map((team) => (
            <TeamRoundPanel key={team} team={team} round={nextRound.round} />
          ))}
        </div>
      </SectionCard>
      {/* [HELP:HOLDTURNERING:NEXTROUND] END */}

      {/* [HELP:HOLDTURNERING:UPCOMING] START */}
      <SectionCard
        eyebrow="Kommende runder"
        title="Næste 2 runder"
        badge={<span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">Fold ud for fuldt overblik</span>}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {nextTwoRounds.map((round) => (
            <article key={round} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/85 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Kommende runde</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{getRoundHeadline(round)}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {getFreeTeamsForRound(round).length ? (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                      Spilfri: {getFreeTeamsForRound(round).join(", ")}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSelectedRound(round)}
                    className="rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    Vælg runde {round}
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {getMatchesForRound(round).map((match) => (
                  <RoundMatchRow key={`upcoming-${round}-${match.home}-${match.away}`} match={match} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
      {/* [HELP:HOLDTURNERING:UPCOMING] END */}

      {/* [HELP:HOLDTURNERING:ROUNDS] START */}
      <SectionCard
        eyebrow="Vælg runde"
        title={`Alle kampe i runde ${selectedRound}`}
        badge={
          selectedRoundFreeTeams.length ? (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Spilfri: {selectedRoundFreeTeams.join(", ")}
            </span>
          ) : undefined
        }
      >
        <div className="flex flex-wrap gap-2">
          {allRounds.map((round) => (
            <button
              key={round}
              type="button"
              onClick={() => setSelectedRound(round)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                selectedRound === round
                  ? "bg-gradient-to-r from-orange-500 via-orange-400 to-blue-600 text-white shadow-sm"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-orange-300 hover:text-slate-900"
              }`}
            >
              Runde {round}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {selectedRoundMatches.map((match) => (
            <RoundMatchRow key={`selected-${selectedRound}-${match.home}-${match.away}`} match={match} />
          ))}
        </div>
      </SectionCard>
      {/* [HELP:HOLDTURNERING:ROUNDS] END */}
    </main>
  );
}
