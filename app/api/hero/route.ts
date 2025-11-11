import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const revalidate = 10;

export async function GET() {
  try {
    const dir = path.join(process.cwd(), "public", "images", "hero", "active");
    const entries = await fs.readdir(dir, { withFileTypes: true });

    const allowed = new Set([".jpg", ".jpeg", ".png", ".webp"]);
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => allowed.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const items = files.map((name) => ({
      url: `/images/hero/active/${name}`,
      alt: name,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
