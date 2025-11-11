import { NextResponse } from "next/server";

type SheetRow = Record<string, unknown>;
type NewsItem = {
  title: string;
  teaser?: string;
  link?: string;
  image?: string;
  order?: number;
  visible?: string; // "YES"/"NO"
};

function asStr(v: unknown): string {
  return (v ?? "").toString().trim();
}
function asNum(v: unknown): number | undefined {
  const n = Number(asStr(v));
  return Number.isFinite(n) ? n : undefined;
}

export async function GET() {
  try {
    const endpoint = process.env.NEXT_PUBLIC_SHEET_API;
    if (!endpoint) {
      return NextResponse.json(
        { ok: false, error: "Missing NEXT_PUBLIC_SHEET_API" },
        { status: 500 }
      );
    }

    const url = `${endpoint}?tab=NYHEDER`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Fetch failed: ${res.status}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { items?: SheetRow[] };
    const all: NewsItem[] = Array.isArray(data.items)
      ? data.items.map((r: SheetRow): NewsItem => ({
          title: asStr((r as any).title),
          teaser: asStr((r as any).teaser),
          link: asStr((r as any).link),
          image: asStr((r as any).image) || undefined,
          order: asNum((r as any).order),
          visible: asStr((r as any).visible),
        }))
      : [];

    const items: NewsItem[] = all
      .filter((x: NewsItem) => asStr(x.title) !== "")
      .filter((x: NewsItem) => asStr(x.visible).toUpperCase() !== "NO")
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
