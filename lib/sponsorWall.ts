export type WallCategory = "gold" | "lane" | "support" | "hidden";
export type WallKind = "sponsor" | "text";

export type SponsorWallItem = {
  row: number;
  name: string;
  displayName: string;
  website: string;
  logoUrl: string;
  visible: boolean;
  featured: boolean;
  order: number;
  category: WallCategory;
  lane: number | null;
  subtitle: string;
  extra: string;
  showExtra: boolean;
  note: string;
  kind: WallKind;
};

export const isYes = (value: unknown) => {
  const s = String(value ?? "").trim().toLowerCase();
  return s === "yes" || s === "ja" || s === "true" || s === "1";
};

export const firstLine = (value: unknown) =>
  String(value ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find(Boolean) || "Sponsor";

export function inferLane(row: any): number | null {
  const explicit = Number(row?.wall_lane ?? row?.lane ?? row?.bane ?? 0);
  if (Number.isInteger(explicit) && explicit >= 1 && explicit <= 99) return explicit;

  const note = String(row?.note ?? "");
  const match = note.match(/(?:ønsket\s*bane|bane\s*sponsor|banesponsor)[^0-9]{0,20}(\d{1,2})/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isInteger(n) && n >= 1 && n <= 99 ? n : null;
}

export function inferCategory(row: any): WallCategory {
  const explicit = String(row?.wall_category ?? "").trim().toLowerCase();
  if (["gold", "guld"].includes(explicit)) return "gold";
  if (["lane", "bane", "banesponsor"].includes(explicit)) return "lane";
  if (["support", "støtte", "stoette", "supporter"].includes(explicit)) return "support";
  if (["hidden", "skjult"].includes(explicit)) return "hidden";

  const note = String(row?.note ?? "");
  if (/pakke\s*:\s*guld/i.test(note)) return "gold";
  if (inferLane(row)) return "lane";
  if (/pakke\s*:\s*(bronze|sølv|solv)/i.test(note)) return "support";

  const level = String(row?.level ?? "").toLowerCase();
  if (/guld|gold/.test(level)) return "gold";
  if (/bane/.test(level)) return "lane";
  if (/bronze|sølv|solv|støtte|stoette/.test(level)) return "support";
  return "support";
}

export function normalizeSponsorRow(row: any): SponsorWallItem {
  const rawName = String(row?.name ?? row?.title ?? "Sponsor").trim();
  const explicitTitle = String(row?.wall_title ?? "").trim();
  const orderNum = Number(row?.wall_order ?? row?.order ?? 9999);
  const visibleRaw = String(row?.wall_visible ?? row?.visible ?? "").trim();
  const visible = visibleRaw ? isYes(visibleRaw) : true;

  return {
    row: Number(row?._row ?? 0),
    name: rawName,
    displayName: explicitTitle || firstLine(rawName),
    website: String(row?.website ?? row?.url ?? "").trim(),
    logoUrl: String(row?.logo_url ?? row?.logoUrl ?? "").trim(),
    visible,
    featured: isYes(row?.featured) || isYes(row?.pin),
    order: Number.isFinite(orderNum) ? orderNum : 9999,
    category: inferCategory(row),
    lane: inferLane(row),
    subtitle: String(row?.wall_subtitle ?? "").trim(),
    extra: String(row?.wall_extra ?? "").trim(),
    showExtra: String(row?.wall_show_extra ?? "").trim() ? isYes(row?.wall_show_extra) : true,
    note: String(row?.note ?? "").trim(),
    kind: String(row?.wall_kind ?? "").trim().toLowerCase() === "text" ? "text" : "sponsor",
  };
}

export function sortWallItems(items: SponsorWallItem[]) {
  return [...items].sort((a, b) => {
    if (a.category === "lane" && b.category === "lane") {
      const laneA = a.lane ?? 999;
      const laneB = b.lane ?? 999;
      if (laneA !== laneB) return laneA - laneB;
    }
    return a.order - b.order || a.displayName.localeCompare(b.displayName, "da");
  });
}


export type SponsorWallCta = {
  visible: boolean;
  title: string;
  text: string;
  buttonText: string;
  buttonVisible: boolean;
  link: string;
  tvVisible: boolean;
  tvTextSize: "normal" | "large" | "xlarge";
};

export const DEFAULT_SPONSOR_WALL_CTA: SponsorWallCta = {
  visible: true,
  title: "Vil du også støtte Humlum Dartklub?",
  text: "Dit navn eller virksomhedslogo kan stå her.",
  buttonText: "Bliv sponsor",
  buttonVisible: true,
  link: "/sponsor",
  tvVisible: true,
  tvTextSize: "large",
};

export function normalizeSponsorWallCta(row: any): SponsorWallCta {
  if (!row || typeof row !== "object") return DEFAULT_SPONSOR_WALL_CTA;
  const visibleRaw = String(row.cta_visible ?? "").trim();
  const tvRaw = String(row.cta_tv_visible ?? "").trim();
  const buttonVisibleRaw = String(row.cta_button_visible ?? "").trim();
  const tvSizeRaw = String(row.cta_tv_size ?? "").trim().toLowerCase();
  const tvTextSize = (["normal", "large", "xlarge"].includes(tvSizeRaw) ? tvSizeRaw : DEFAULT_SPONSOR_WALL_CTA.tvTextSize) as SponsorWallCta["tvTextSize"];
  return {
    visible: visibleRaw ? isYes(visibleRaw) : DEFAULT_SPONSOR_WALL_CTA.visible,
    title: String(row.cta_title ?? "").trim() || DEFAULT_SPONSOR_WALL_CTA.title,
    text: String(row.cta_text ?? "").trim() || DEFAULT_SPONSOR_WALL_CTA.text,
    buttonText: String(row.cta_button ?? "").trim() || DEFAULT_SPONSOR_WALL_CTA.buttonText,
    buttonVisible: buttonVisibleRaw ? isYes(buttonVisibleRaw) : DEFAULT_SPONSOR_WALL_CTA.buttonVisible,
    link: String(row.cta_link ?? "").trim() || DEFAULT_SPONSOR_WALL_CTA.link,
    tvVisible: tvRaw ? isYes(tvRaw) : DEFAULT_SPONSOR_WALL_CTA.tvVisible,
    tvTextSize,
  };
}
