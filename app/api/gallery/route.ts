import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GalleryRow = Record<string, any>;

function getGasUrl(): string {
  const u =
    process.env.SHEET_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_SHEET_API?.trim() ||
    "";
  if (!u) throw new Error("Missing SHEET_API_URL / NEXT_PUBLIC_SHEET_API");
  return u;
}

function getAdminKey(): string {
  const key =
    process.env.ADMIN_TOKEN?.trim() ||
    process.env.ADMIN_LOGIN_TOKEN?.trim() ||
    "";
  if (!key) throw new Error("Missing ADMIN_TOKEN / ADMIN_LOGIN_TOKEN");
  return key;
}

function normalizeString(value: any): string {
  return String(value ?? "").trim();
}

function isYes(value: any): boolean {
  const v = normalizeString(value).toUpperCase();
  return v === "YES" || v === "TRUE" || v === "1" || v === "JA";
}

function toNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  try {
    const url = new URL(getGasUrl());
    url.searchParams.set("key", getAdminKey());
    url.searchParams.set("tab", "GALLERI");
    url.searchParams.set("limit", "2000");

    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || `Kunne ikke hente GALLERI (${res.status})`);
    }

    const items: GalleryRow[] = Array.isArray(data?.items) ? data.items : [];

    const galleryItems = items
      .filter((row) => normalizeString(row?.type || "image").toLowerCase() === "image")
      .filter((row) => isYes(row?.visible))
      .map((row) => ({
        key: normalizeString(row?.key),
        imageUrl: normalizeString(row?.file_url || row?.image_url || row?.url),
        title: normalizeString(row?.title),
        description: normalizeString(row?.description),
        alt: normalizeString(
          row?.alt_text || row?.title || row?.description || "Galleri-billede",
        ),
        album: normalizeString(row?.category || "Galleri"),
        order: toNumber(row?.order),
      }))
      .filter((row) => !!row.imageUrl)
      .sort((a, b) => {
        if (b.order !== a.order) return b.order - a.order;
        return a.title.localeCompare(b.title, "da");
      });

    return NextResponse.json({ ok: true, items: galleryItems });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Gallery fetch failed", items: [] },
      { status: 500 },
    );
  }
}
