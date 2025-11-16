// app/api/news/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SheetRow = Record<string, any>;

type NewsItem = {
  title: string;
  teaser?: string;
  image?: string;
  date?: string | null;
  url?: string;
};

function isTruthyYes(value: any): boolean {
  const v = String(value ?? "").trim().toUpperCase();
  return v === "YES" || v === "TRUE" || v === "1" || v === "JA";
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SHEET_API;
  // Brug samme nøgle som admin – kan sættes i .env.local, ellers falder vi tilbage.
  const key =
    process.env.NEXT_PUBLIC_SHEET_KEY ||
    process.env.ADMIN_SHEET_KEY ||
    "hdk-admin-dev";

  if (!base) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_SHEET_API er ikke sat i .env.local" },
      { status: 500 }
    );
  }

  // Byg URL til Apps Script Web App: ?tab=NYHEDER&key=...
  const url = new URL(base);
  url.searchParams.set("tab", "NYHEDER");
  if (key) {
    url.searchParams.set("key", key);
  }

  let raw: any;
  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          ok: false,
          error: `Fejl fra Sheet-backend (NYHEDER): HTTP ${res.status} – ${text}`,
        },
        { status: 500 }
      );
    }

    raw = await res.json();
  } catch (err: any) {
    console.error("GET /api/news – fetch error", err);
    return NextResponse.json(
      { ok: false, error: "Kunne ikke hente NYHEDER fra Sheet" },
      { status: 500 }
    );
  }

  const rows: SheetRow[] = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw)
    ? raw
    : [];

  // Map rækker fra NYHEDER → format til forsiden
  const items: NewsItem[] = rows
    .filter((row) => {
      // Synlighed: hvis der er et 'visible'-felt, brug det. Hvis ikke, vis den.
      const visible = row.visible;
      if (visible === undefined || visible === null || visible === "") {
        return true;
      }
      return isTruthyYes(visible);
    })
    .map((row) => {
      const title =
        row.title ||
        row.headline ||
        row.overskrift ||
        row.label ||
        row.key ||
        "";

      const teaser =
        row.teaser ||
        row.intro ||
        row.summary ||
        row.subtitle ||
        row.tagline ||
        "";

      const image = row.image_url || row.image || row.img || "";

      const dateRaw = row.start_date || row.date || row.published_at || "";
      let date: string | null = null;
      if (dateRaw) {
        const d = new Date(dateRaw);
        if (!Number.isNaN(d.getTime())) {
          date = d.toISOString();
        }
      }

      const url =
        row.url || row.link || row.href || row.slug || row.target_url || "";

      return {
        title: String(title || "").trim(),
        teaser: teaser ? String(teaser) : "",
        image: image ? String(image) : "",
        date,
        url: url ? String(url) : "",
      };
    })
    .filter((item) => item.title); // smid tomme væk

  // Sortér nyheder (nyeste først, hvis der er dato)
  items.sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : 0;
    const bt = b.date ? Date.parse(b.date) : 0;
    return bt - at;
  });

  return NextResponse.json({ ok: true, items });
}
