// lib/sheet.ts
export async function sheetPost(tab: string, data: Record<string, any>) {
  const res = await fetch("/api/sheet", {
    method: "GET", // vi bruger GET i /api/sheet (proxy) – tilpas hvis du laver write-route
    cache: "no-store"
  });
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error("Uventet svar fra serveren:\n" + text.slice(0, 500));
  }
  const json = await res.json();
  return json;
}

export async function uploadToDrive(_file: File, _filename?: string) {
  throw new Error("Upload er ikke aktiveret endnu (mangler write-endpoint).");
}
