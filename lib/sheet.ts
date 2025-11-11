/* [SHEET:HTTP:ALIAS] START */
export { fetchSheet as sheetGet } from "./fetchSheet";
/* [SHEET:HTTP:ALIAS] END */

/* [SHEET:HTTP:FN:sheetPost] START */
export async function sheetPost(payload: unknown) {
  // Byg absolut base-URL (server-side fetch kan ikke bruge relative stier)
  const BASE =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  const url = new URL("/api/sheet", BASE).toString();

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`sheetPost failed: ${res.status} ${text}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error("Uventet svar fra /api/sheet:\n" + (text ?? "").slice(0, 500));
  }

  return res.json();
}
/* [SHEET:HTTP:FN:sheetPost] END */

/* [SHEET:HTTP:FN:uploadToDrive] START */
export async function uploadToDrive(_file: File, _filename?: string) {
  // Ikke aktiveret endnu – vi tilføjer write-endpoint senere.
  throw new Error("Upload er ikke aktiveret endnu (mangler write-endpoint).");
}
/* [SHEET:HTTP:FN:uploadToDrive] END */
