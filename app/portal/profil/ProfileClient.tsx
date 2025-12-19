"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardTitle } from "../components/PortalCards";

type MeResponse = {
  ok?: boolean;
  member?: {
    member_id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    exp?: number;
  };
};

type ProfileResponse = {
  ok?: boolean;
  profile?: {
    member_id?: string;
    status?: string;
    expired?: boolean;
    package_title?: string;
    level?: string;
    start_date?: string;
    end_date?: string;
    primary_team_id?: string;
    primary_team_role?: string;
    ddu_id?: string;
    mentor?: boolean;
    mentor_topics?: string;
    mentor_days?: string;
    bio_short?: string;
  };
};

function safe(v: any): string {
  return String(v ?? "").trim();
}

function fullName(me: MeResponse["member"] | null | undefined): string {
  const fn = safe(me?.first_name);
  const ln = safe(me?.last_name);
  const n = `${fn} ${ln}`.trim();
  if (n) return n;
  const email = safe(me?.email);
  if (email.includes("@")) return email.split("@")[0];
  return "Medlem";
}

export default function ProfileClient() {
  const [me, setMe] = useState<MeResponse["member"] | null>(null);
  const [profile, setProfile] = useState<ProfileResponse["profile"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoading(true);
      try {
        const r1 = await fetch("/api/member/me", { cache: "no-store" });
        const j1 = (await r1.json().catch(() => null)) as MeResponse | null;

        const r2 = await fetch("/api/member/profile", { cache: "no-store" });
        const j2 = (await r2.json().catch(() => null)) as ProfileResponse | null;

        if (!canceled) {
          setMe(j1?.ok ? j1.member || null : null);
          setProfile(j2?.ok ? j2.profile || null : null);
        }
      } catch {
        if (!canceled) {
          setMe(null);
          setProfile(null);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  const statusLine = useMemo(() => {
    const s = safe(profile?.status).toLowerCase();
    if (!s) return "";
    return s === "active" ? "Aktiv" : s;
  }, [profile]);

  return (
    <div className="grid gap-4">
      <Card>
        <CardTitle
          icon="👤"
          title="Min profil"
          subtitle="Dine medlemsoplysninger (kun du kan se dem her)."
        />

        {loading ? (
          <div className="mt-4 text-sm text-slate-600">Henter…</div>
        ) : (
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black">{fullName(me)}</div>
              <div className="mt-1 text-sm text-slate-600">{safe(me?.email)}</div>
              <div className="mt-2 text-xs text-slate-500">Medlemsnr: {safe(me?.member_id) || "–"}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black">Medlemsstatus</div>
              <div className="mt-2 grid gap-1 text-sm text-slate-600">
                <div>Status: <b className={profile?.expired ? "text-red-600" : "text-green-600"}>{statusLine || "–"}</b></div>
                <div>Niveau: <b>{safe(profile?.level) || "–"}</b></div>
                <div>Pakke: <b>{safe(profile?.package_title) || "–"}</b></div>
                <div>Start: <b>{safe(profile?.start_date) || "–"}</b></div>
                <div>Udløb: <b className={profile?.expired ? "text-red-600" : ""}>{safe(profile?.end_date) || "–"}</b></div>
              </div>
            </div>

            {safe(profile?.ddu_id) ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-black">DDU ID</div>
                <div className="mt-2 text-sm text-slate-600">
                  <b className="text-orange-600">{safe(profile?.ddu_id)}</b>
                </div>
                <div className="mt-1 text-xs text-slate-500">Vises kun for turneringsrelevante medlemmer.</div>
              </div>
            ) : null}

            {profile?.mentor ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-black">Mentor</div>
                <div className="mt-2 text-sm text-slate-600">
                  {safe(profile?.bio_short) ? <div>“{safe(profile?.bio_short)}”</div> : null}
                  {safe(profile?.mentor_topics) ? <div className="mt-2">Emner: <b>{safe(profile?.mentor_topics)}</b></div> : null}
                  {safe(profile?.mentor_days) ? <div className="mt-1">Dage: <b>{safe(profile?.mentor_days)}</b></div> : null}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
