/* [HELP:API:NEWS] START — læs fra data/news.json + billeder i /public/news */

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RawItem = {
  title?: string;
  teaser?: string;
  url?: string;
  date?: string;
  image?: string;        // fx "op1" | "/news/op1.jpg" | "op1.jpg"
  order?: number | string;
  visible?: string;      // "YES"/"NO" (valgfri)
};

type Item = {
  title: string;
  teaser?: string;
  url?: string;
  link?: string;         // compat til ældre frontend
  date?: string;
  image: string;         // altid gyldig sti
  order: number;
  visible: string;
};

const s = (v: unknown) => (v ?? "").toString().trim();

function resolveImage(v?: string): string {
  const x = s(v);
  if (!x) return "/news/default.jpg";
  if (x.startsWith("/")) return x;                       // allerede absolut public-sti
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(x)) return `/news/${x}`; // filnavn med extension
  // nøgle → filnavn
  const map: Record<string, string> = {
    op1: "/news/op1.jpg",
    op2: "/news/op2.jpg",
    op3: "/news/op3.jpg",
    op4: "/news/op4.jpg",
    default: "/news/default.jpg",
  };
  return map[x.toLowerCase()] || map.default;
}

export async function GET() {
  try {
    const p = path.join(process.cwd(), "data", "news.json");
    const raw = await readFile(p, "utf8");
    const json = JSON.parse(raw);
    const arr: RawItem[] = Array.isArray(json?.items)
      ? json.items
      : Array.isArray(json)
      ? json
      : [];

    const items: Item[] = arr
      .map((r, i) => {
        const url = s(r.url) || undefined;
        const order = Number(r.order ?? i + 1) || i + 1;
        return {
          title: s(r.title),
          teaser: s(r.teaser) || undefined,
          url,
          link: url, // compat
          date: s(r.date) || undefined,
          image: resolveImage(r.image),
          order,
          visible: (s(r.visible) || "YES").toUpperCase(),
        };
      })
      .filter((x) => x.title)
      .filter((x) => x.visible !== "NO")
      .sort((a, b) => a.order - b.order);

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "read error" },
      { status: 500 }
    );
  }
}

/* [HELP:API:NEWS] END */
