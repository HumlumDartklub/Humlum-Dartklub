import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const revalidate = 30; // let cache

export async function GET() {
  try {
    const file = path.join(process.cwd(), "data", "ticker.json");
    const raw = await fs.readFile(file, "utf8");
    const json = JSON.parse(raw);

    const items = Array.isArray(json?.items)
      ? json.items
          .filter((x: any) => typeof x?.message === "string" && x.message.trim() !== "")
          .map((x: any) => ({ message: String(x.message).trim() }))
      : [];

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    // Fallback: tom liste i stedet for fejl
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
