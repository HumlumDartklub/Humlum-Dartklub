"use client";

/* [HELP:FOOTER:IMPORTS] START */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
/* [HELP:FOOTER:IMPORTS] END */

/* [HELP:FOOTER:TYPES] START */
type ClubInfoRow = {
  key?: string;
  value?: any;
  visible?: string; // optional "YES"/"NO"
};

type SheetApiResponse =
  | {
      ok?: boolean;
      rows?: any[];
      items?: any[];
      itemsNormalized?: any[];
      updated?: string;
    }
  | any;

type FooterLink = {
  label: string;
  href: string;
  newTab?: boolean;
  iconUrl?: string; // valgfri: brug dit eget ikon/logo
};

type LoadState = "loading" | "ready" | "error";
/* [HELP:FOOTER:TYPES] END */

/* [HELP:FOOTER:HELPERS] START */
function pickArray(p: any): any[] {
  if (!p) return [];
  if (Array.isArray(p.rows)) return p.rows;
  if (Array.isArray(p.itemsNormalized)) return p.itemsNormalized;
  if (Array.isArray(p.items)) return p.items;
  return [];
}

function apiUrl(tab: string): string {
  const base = process.env.NEXT_PUBLIC_SHEET_API;
  return base
    ? `${base}?tab=${encodeURIComponent(tab)}`
    : `/api/sheets?sheet=${encodeURIComponent(tab)}`;
}

function normalizeClubInfo(rows: ClubInfoRow[]): Record<string, string> {
  return (rows || []).reduce((acc: Record<string, string>, row: any) => {
    if (!row) return acc;

    const k = String(row.key ?? "").trim();
    if (!k) return acc;

    const vis = String(row.visible ?? "").trim().toUpperCase();
    if (vis && vis !== "YES") return acc;

    const v =
      row.value === undefined || row.value === null ? "" : String(row.value);
    acc[k] = v;
    return acc;
  }, {});
}

function isExternalHref(href: string): boolean {
  const h = (href || "").trim();
  return (
    h.startsWith("http://") || h.startsWith("https://") || h.startsWith("//")
  );
}

function truthyYes(value: string | undefined, defaultYes = true): boolean {
  const v = String(value || "").trim().toUpperCase();
  if (!v) return defaultYes;
  return !(v === "NO" || v === "FALSE" || v === "0");
}

function getHostname(href: string): string {
  try {
    const h = href.startsWith("//") ? `https:${href}` : href;
    const url = new URL(h);
    return url.hostname || "";
  } catch {
    return "";
  }
}

/**
 * Premium without emojis:
 * - Hvis der ikke er icon_url i arket, bruger vi automatisk favicon for domænet.
 * - Det giver rigtige “brand”-ikoner (Facebook/PDC osv.) uden ekstra arbejde.
 */
function faviconUrlFor(href: string): string | undefined {
  if (!isExternalHref(href)) return undefined;
  const host = getHostname(href);
  if (!host) return undefined;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    host
  )}&sz=64`;
}

function readFooterLinksFromClubinfo(
  clubMap: Record<string, string>,
  max = 12
): FooterLink[] {
  const out: FooterLink[] = [];

  for (let i = 1; i <= max; i++) {
    const label = (clubMap[`footer.link.${i}.label`] || "").trim();
    const href = (clubMap[`footer.link.${i}.url`] || "").trim();
    if (!label || !href) continue;

    const iconUrl = (clubMap[`footer.link.${i}.icon_url`] || "").trim();
    const newTabRaw = (clubMap[`footer.link.${i}.new_tab`] || "").trim();

    out.push({
      label,
      href,
      iconUrl: iconUrl || undefined,
      newTab: newTabRaw ? truthyYes(newTabRaw, true) : isExternalHref(href),
    });
  }

  // dedup på href
  const seen = new Set<string>();
  return out.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });
}

function IconBubble({
  src,
  title,
  children,
}: {
  src?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-md ring-1 ring-slate-200/80 bg-white/70"
      title={title}
      aria-hidden="true"
    >
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="h-4 w-4"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </>
      ) : (
        children
      )}
    </span>
  );
}

function SvgLink() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
      <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
    </svg>
  );
}

function SvgMail() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4h16v16H4z" />
      <path d="m4 6 8 7 8-7" />
    </svg>
  );
}

function SvgPhone() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L9.09 10.91a16 16 0 0 0 4 4l1.58-1.11a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function SvgGlobe() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20" />
      <path d="M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}
/* [HELP:FOOTER:HELPERS] END */

export default function PublicFooter() {
  /* [HELP:FOOTER:STATE] START */
  const [clubMap, setClubMap] = useState<Record<string, string>>({});
  const [updated, setUpdated] = useState<string | undefined>(undefined);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  /* [HELP:FOOTER:STATE] END */

  /* [HELP:FOOTER:FETCH] START */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl("KLUBINFO"), { cache: "no-store" });
        if (!res.ok) {
          setLoadState("error");
          return;
        }
        const json = (await res.json()) as SheetApiResponse;
        const rows = pickArray(json) as ClubInfoRow[];
        setClubMap(normalizeClubInfo(rows));
        setUpdated((json as any)?.updated);
        setLoadState("ready");
      } catch {
        // footer må aldrig vælte siden
        setLoadState("error");
      }
    })();
  }, []);
  /* [HELP:FOOTER:FETCH] END */

  /* [HELP:FOOTER:DATA] START */
  const clubName = clubMap["club.name"] || "Humlum Dartklub";
  const tagline = clubMap["club.tagline"] || "Fællesskab & Præcision";

  const cvr = (clubMap["club.cvr"] || "").trim();
  const address = (clubMap["club.address"] || "").trim();
  const postcode = (clubMap["club.postcode"] || "").trim();
  const city = (clubMap["club.city"] || "").trim();

  const email = (clubMap["footer.contact.email"] || clubMap["club.email"] || "").trim();
  const phone = (clubMap["footer.contact.phone"] || clubMap["club.phone"] || "").trim();
  const website = (clubMap["footer.contact.website_url"] || clubMap["social.website"] || "").trim();
  const facebook = (clubMap["footer.contact.facebook_url"] || clubMap["social.facebook"] || "").trim();

  const logoUrl = clubMap["brand.logo_url"] || "/images/logo/humlum-logo.png";
  const footerNote = (clubMap["site.footer_note"] || "").trim();

  const contactTitle = (clubMap["footer.contact.title"] || "Kontakt").trim();
  const linksTitle = (clubMap["footer.links.title"] || "Links").trim();
  const linksMode = (clubMap["footer.links.mode"] || "DEFAULT_PLUS").trim().toUpperCase();

  const showEmail = truthyYes(clubMap["footer.contact.show_email"], true);
  const showPhone = truthyYes(clubMap["footer.contact.show_phone"], true);
  const showWebsite = truthyYes(clubMap["footer.contact.show_website"], true);
  const showFacebook = truthyYes(clubMap["footer.contact.show_facebook"], true);

  const phoneLabel = (clubMap["footer.contact.phone_label"] || "Telefon").trim() || "Telefon";
  const websiteLabel = (clubMap["footer.contact.website_label"] || "Hjemmeside").trim() || "Hjemmeside";
  const facebookLabel = (clubMap["footer.contact.facebook_label"] || "Facebook").trim() || "Facebook";

  const addressLine = useMemo(() => {
    if (!address && !postcode && !city) return "";
    const tail = [postcode, city].filter(Boolean).join(" ");
    return address && tail ? `${address}, ${tail}` : address || tail;
  }, [address, postcode, city]);

  const defaultLinks: FooterLink[] = [
    { label: "Dansk Dart Union (DDU)", href: "https://dart-ddu.dk/", newTab: true },
    { label: "Professional Darts Corporation (PDC)", href: "https://www.pdc.tv/", newTab: true },
    { label: "Danmarks Idrætsforbund (DIF)", href: "https://www.dif.dk/", newTab: true },
    { label: "Privatliv", href: "/privatliv", newTab: false },
  ];

  const customLinks = useMemo(() => readFooterLinksFromClubinfo(clubMap), [clubMap]);

  const links = useMemo(() => {
    const withIcons = (arr: FooterLink[]) =>
      arr.map((l) => ({
        ...l,
        iconUrl: l.iconUrl || faviconUrlFor(l.href),
      }));

    if (linksMode === "CUSTOM") return withIcons(customLinks);

    // DEFAULT_PLUS: standardlinks + dine egne (dedup på href)
    const out: FooterLink[] = [];
    const seen = new Set<string>();

    for (const l of defaultLinks) {
      if (!seen.has(l.href)) {
        seen.add(l.href);
        out.push(l);
      }
    }
    for (const l of customLinks) {
      if (!seen.has(l.href)) {
        seen.add(l.href);
        out.push(l);
      }
    }
    return withIcons(out);
  }, [linksMode, customLinks]);

  const telHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : "";
  /* [HELP:FOOTER:DATA] END */

  /* [HELP:FOOTER:RENDER] START */
  if (loadState === "loading") {
    return (
      <footer className="mt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-t border-slate-200/70 pt-10 pb-8">
            <div className="grid gap-8 md:grid-cols-3 animate-pulse">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded bg-slate-200/70" />
                  <div className="space-y-2">
                    <div className="h-3 w-44 rounded bg-slate-200/70" />
                    <div className="h-3 w-28 rounded bg-slate-200/50" />
                  </div>
                </div>
                <div className="h-3 w-56 rounded bg-slate-200/50" />
                <div className="h-3 w-40 rounded bg-slate-200/50" />
              </div>

              <div className="space-y-3">
                <div className="h-4 w-20 rounded bg-slate-200/70" />
                <div className="h-3 w-52 rounded bg-slate-200/50" />
                <div className="h-3 w-40 rounded bg-slate-200/50" />
              </div>

              <div className="space-y-3">
                <div className="h-4 w-20 rounded bg-slate-200/70" />
                <div className="h-3 w-52 rounded bg-slate-200/50" />
                <div className="h-3 w-44 rounded bg-slate-200/50" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-t border-slate-200/70 pt-10 pb-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12">
                  <Image
                    src={logoUrl}
                    alt={`${clubName} logo`}
                    fill
                    sizes="3rem"
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{clubName}</div>
                  <div className="text-xs text-slate-600">{tagline}</div>
                </div>
              </div>

              {footerNote ? <div className="text-xs text-slate-600">{footerNote}</div> : null}
              {addressLine ? <div className="text-sm text-slate-700">{addressLine}</div> : null}
              {cvr ? <div className="text-xs text-slate-500">CVR: {cvr}</div> : null}
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-900">{contactTitle}</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {showEmail && email ? (
                  <li>
                    <a className="inline-flex items-center gap-2 hover:opacity-80" href={`mailto:${email}`}>
                      <IconBubble title="Email">
                        <SvgMail />
                      </IconBubble>
                      <span className="underline">{email}</span>
                    </a>
                  </li>
                ) : null}

                {showPhone && phone ? (
                  <li>
                    <a className="inline-flex items-center gap-2 hover:opacity-80" href={telHref}>
                      <IconBubble title={phoneLabel}>
                        <SvgPhone />
                      </IconBubble>
                      <span>
                        {phoneLabel}: <span className="underline">{phone}</span>
                      </span>
                    </a>
                  </li>
                ) : null}

                {showWebsite && website ? (
                  <li>
                    <a
                      className="inline-flex items-center gap-2 hover:opacity-80"
                      href={website}
                      target={isExternalHref(website) ? "_blank" : undefined}
                      rel={isExternalHref(website) ? "noopener noreferrer" : undefined}
                    >
                      <IconBubble title={websiteLabel}>
                        <SvgGlobe />
                      </IconBubble>
                      <span className="underline">{websiteLabel}</span>
                    </a>
                  </li>
                ) : null}

                {showFacebook && facebook ? (
                  <li>
                    <a
                      className="inline-flex items-center gap-2 hover:opacity-80"
                      href={facebook}
                      target={isExternalHref(facebook) ? "_blank" : undefined}
                      rel={isExternalHref(facebook) ? "noopener noreferrer" : undefined}
                    >
                      <IconBubble title={facebookLabel} src={faviconUrlFor(facebook)}>
                        <SvgLink />
                      </IconBubble>
                      <span className="underline">{facebookLabel}</span>
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-900">{linksTitle}</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {links.map((l) => (
                  <li key={l.href}>
                    <a
                      className="inline-flex items-center gap-2 hover:opacity-80"
                      href={l.href}
                      target={l.newTab ? "_blank" : undefined}
                      rel={l.newTab ? "noopener noreferrer" : undefined}
                    >
                      <IconBubble title={l.label} src={l.iconUrl}>
                        <SvgLink />
                      </IconBubble>
                      <span className="underline">{l.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-1 border-t border-slate-200/70 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} {clubName}</div>
            {updated ? <div>Sidst opdateret: {new Date(updated).toLocaleString("da-DK")}</div> : null}
          </div>
        </div>
      </div>
    </footer>
  );
  /* [HELP:FOOTER:RENDER] END */
}
