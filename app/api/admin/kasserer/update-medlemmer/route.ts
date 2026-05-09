/* [HELP:KASSERER_UPDATE_API:IMPORTS] START */
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/memberAuth";
/* [HELP:KASSERER_UPDATE_API:IMPORTS] END */

/* [HELP:KASSERER_UPDATE_API:CONFIG] START */
export const dynamic = "force-dynamic";
export const revalidate = 0;
/* [HELP:KASSERER_UPDATE_API:CONFIG] END */

type Row = Record<string, any>;

type UpdateItem = {
  row: string;
  data: Row;
  verify?: Row;
};

function getGasUrl(): string {
  const u = process.env.SHEET_API_URL?.trim() || process.env.NEXT_PUBLIC_SHEET_API?.trim() || "";
  if (!u) throw new Error("Missing SHEET_API_URL / NEXT_PUBLIC_SHEET_API");
  return u;
}

function getAdminKey(): string {
  const k =
    process.env.SHEET_ADMIN_KEY?.trim() ||
    process.env.GAS_ADMIN_KEY?.trim() ||
    process.env.ADMIN_TOKEN?.trim() ||
    process.env.ADMIN_LOGIN_TOKEN?.trim() ||
    "";
  if (!k) throw new Error("Missing SHEET_ADMIN_KEY / GAS_ADMIN_KEY / ADMIN_TOKEN");
  return k;
}

function asText(v: any): string {
  return String(v ?? "").trim();
}

function normalizeForCompare(v: any): string {
  const s = asText(v);
  if (!s) return "";

  // yyyy-mm-dd eller ISO datetime
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // dd.mm.yyyy
  const dk = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dk) return `${dk[3]}-${String(dk[2]).padStart(2, "0")}-${String(dk[1]).padStart(2, "0")}`;

  // Google Sheet kan returnere Date som ISO via JSON.
  const d = new Date(s);
  if (!Number.isNaN(d.getTime()) && /\d{4}/.test(s)) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }

  return s;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function readTab(gas: string, key: string, tab: string): Promise<Row[]> {
  const url = new URL(gas);
  url.searchParams.set("tab", tab);
  url.searchParams.set("key", key);
  url.searchParams.set("_", String(Date.now()));

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Kunne ikke læse ${tab} efter gemning.`);
  }
  return Array.isArray(data?.items) ? data.items : [];
}

function getRowFromItems(items: Row[], row: string): Row | null {
  const rowNo = Number(row);
  if (!Number.isFinite(rowNo) || rowNo < 2) return null;
  return items[rowNo - 2] || null;
}

function verifyPatch(actual: Row | null, verify: Row): string[] {
  const errors: string[] = [];
  if (!actual) return ["Rækken kunne ikke læses tilbage fra arket."];

  for (const [key, expected] of Object.entries(verify || {})) {
    if (key.startsWith("_") || key === "updated_at") continue;
    const e = normalizeForCompare(expected);
    const a = normalizeForCompare(actual[key]);
    if (e !== a) errors.push(`${key}: forventede '${e}', men arket har '${a}'`);
  }

  return errors;
}

async function postUpdate(gas: string, key: string, tab: string, item: UpdateItem) {
  const url = new URL(gas);
  url.searchParams.set("key", key);
  url.searchParams.set("tab", tab);
  url.searchParams.set("action", "adminUpdateRow");
  url.searchParams.set("row", item.row);

  // VIGTIGT:
  // Code.gs/adminUpdateRow læser kolonner direkte fra body.hasOwnProperty(headerName).
  // Derfor skal felterne ligge TOP-LEVEL i JSON-bodyen — ikke gemt inde i data:{}.
  // Ellers svarer Apps Script ok, men skriver reelt ingen af betalingsfelterne til MEDLEMMER.
  const body = {
    ...(item.data || {}),
    tab,
    action: "adminUpdateRow",
    row: item.row,
  };

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.message || `Apps Script afviste række ${item.row}.`);
  }

  return data;
}

/* [HELP:KASSERER_UPDATE_API:POST] START */
export async function POST(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const gas = getGasUrl();
    const key = getAdminKey();
    const body: any = await req.json().catch(() => ({}));

    const tab = asText(body.tab || "MEDLEMMER");
    const updates = Array.isArray(body.updates) ? (body.updates as UpdateItem[]) : [];

    if (tab.toUpperCase() !== "MEDLEMMER") {
      return NextResponse.json({ ok: false, error: "Denne endpoint må kun opdatere MEDLEMMER." }, { status: 400 });
    }

    if (!updates.length) {
      return NextResponse.json({ ok: false, error: "updates[] mangler." }, { status: 400 });
    }

    const gasResults: any[] = [];
    for (const item of updates) {
      if (!asText(item.row)) throw new Error("En update mangler row.");
      if (!item.data || typeof item.data !== "object") throw new Error(`Række ${item.row} mangler data.`);
      const result = await postUpdate(gas, key, tab, item);
      gasResults.push(result);
    }

    // Google Sheet/App Script kan være lidt langsom. Vi venter kort og læser arket tilbage,
    // så frontend ikke viser en falsk betaling, hvis arket ikke faktisk er opdateret.
    await sleep(1500);
    let items = await readTab(gas, key, tab);

    let verifiedUpdates = updates.map((item) => {
      const actual = getRowFromItems(items, item.row);
      const errors = verifyPatch(actual, item.verify || {});
      return { row: item.row, item: actual, errors };
    });

    const failed = verifiedUpdates.filter((u) => u.errors.length > 0);

    // Et ekstra forsøg hjælper, hvis Sheets lige er et sekund bagud.
    if (failed.length) {
      await sleep(1500);
      items = await readTab(gas, key, tab);
      verifiedUpdates = updates.map((item) => {
        const actual = getRowFromItems(items, item.row);
        const errors = verifyPatch(actual, item.verify || {});
        return { row: item.row, item: actual, errors };
      });
    }

    const stillFailed = verifiedUpdates.filter((u) => u.errors.length > 0);
    if (stillFailed.length) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Apps Script svarede, men Google Sheet viser stadig de gamle værdier. Derfor er betalingen IKKE markeret som gemt i dashboardet.",
          details: stillFailed,
          gasResults,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, updates: verifiedUpdates });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Kasserer-update fejlede." }, { status: 500 });
  }
}
/* [HELP:KASSERER_UPDATE_API:POST] END */
