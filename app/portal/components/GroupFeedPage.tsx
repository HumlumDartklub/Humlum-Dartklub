"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardTitle } from "./PortalCards";
import type { SheetItem, SheetResponse } from "./portalTypes";
import {
  buildViewerUrl,
  groupStartsWith,
  isHttpUrl,
  isVisible,
  safeText,
  toOrder,
} from "./portalUtils";

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

export default function GroupFeedPage({
  title,
  subtitle,
  icon,
  groupPrefixes,
  emptyHint,
  allowSearch = true,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  groupPrefixes: string[];
  emptyHint: string;
  allowSearch?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<SheetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/sheet?tab=MEDLEMSZONE&_ts=${Date.now()}`, { cache: "no-store" });
        const json = (await res.json()) as SheetResponse;
        const raw = (json.items || json.data || []) as SheetItem[];

        const normalized = (raw || [])
          .filter((x) => isVisible((x as any).visible))
          .map((x) => ({ ...x, order: toOrder((x as any).order) }))
          .sort((a, b) => toOrder((a as any).order) - toOrder((b as any).order));

        const filtered = normalized.filter((x) => {
          const g = safeText((x as any).group);
          return groupPrefixes.some((p) => groupStartsWith(g, p));
        });

        if (!canceled) setItems(filtered);
      } catch {
        if (!canceled) setItems([]);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [groupPrefixes]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((it) => {
      const hay = `${safeText(it.title)} ${safeText(it.subtitle)} ${safeText(it.description)} ${safeText(it.group)}`.toLowerCase();
      return hay.includes(query);
    });
  }, [items, q]);

  // ✅ Søg-felt kun når det giver mening (ellers føles det “Excel-agtigt”)
  const showSearch = allowSearch && (items.length >= 6 || q.trim().length > 0);

  const openItem = (it: SheetItem) => {
    const url = pickUrl(it);
    if (!url) return;

    // mailto
    if (url.toLowerCase().startsWith("mailto:")) {
      window.location.href = url;
      return;
    }

    // eksternt → ny fane (Drive/Docs via viewer)
    if (isHttpUrl(url)) {
      if (isDriveOrDocsUrl(url)) {
        window.open(buildViewerUrl(url), "_blank", "noopener,noreferrer");
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      return;
    }

    // internt → samme fane (hurtig Next navigation, ingen “reload”)
    if (url.startsWith("/")) {
      router.push(url);
    }
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardTitle icon={icon} title={title} subtitle={subtitle} />
        {showSearch ? (
          <div className="mt-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Søg…"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-400"
            />
          </div>
        ) : null}
        <div className="mt-4 text-sm text-slate-500">
          {loading ? "Henter…" : `${filtered.length} elementer`}
        </div>
      </Card>

      {loading ? (
        <Card>Henter indhold…</Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-sm text-slate-600">{emptyHint}</div>
          <div className="mt-2 text-xs text-slate-500">
            Tip: Lav rækker i <b>MEDLEMSZONE</b> med <b>group</b> der starter med: {groupPrefixes.join(" / ")}
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((it, idx) => {
            const t = safeText(it.title) || "Uden titel";
            const desc = safeText(it.description) || safeText(it.subtitle);
            const label = pickLabel(it) || "Åbn";
            const url = pickUrl(it);
            const clickable = Boolean(url) && (isHttpUrl(url) || url.startsWith("/") || url.toLowerCase().startsWith("mailto:"));

            return (
              <Card key={`${t}-${idx}`} className="p-4">
                <div className="text-sm font-black">{t}</div>
                {desc ? <div className="mt-1 text-sm text-slate-600">{desc}</div> : null}
                {safeText(it.group) ? <div className="mt-2 text-xs text-slate-500">{safeText(it.group)}</div> : null}

                <div className="mt-3">
                  {clickable ? (
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black hover:bg-slate-50"
                      onClick={() => openItem(it)}
                    >
                      {label}
                    </button>
                  ) : (
                    <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600">
                      Kommer snart
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
