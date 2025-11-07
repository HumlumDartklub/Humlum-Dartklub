// /lib/sheet.ts
export async function sheetPost(tab: string, data: Record<string, any>) {
  const res = await fetch("/api/sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tab, data }),
  });
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error("Uventet svar fra serveren:\n" + text.slice(0, 500));
  }
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error || "Ukendt fejl");
  return json;
}
