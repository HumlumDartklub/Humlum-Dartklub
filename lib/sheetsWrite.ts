// lib/sheetsWrite.ts
export async function upsertRow(sheet: string, payload: Record<string, any>) {
  const endpoint = process.env.NEXT_PUBLIC_FORSIDE_ENDPOINT;
  if (!endpoint) throw new Error("Mangler NEXT_PUBLIC_FORSIDE_ENDPOINT");
  const res = await fetch(`${endpoint}?action=upsert&sheet=${encodeURIComponent(sheet)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Upsert fejl");
  return json.result;
}

export async function deleteRow(sheet: string, id: string) {
  const endpoint = process.env.NEXT_PUBLIC_FORSIDE_ENDPOINT;
  if (!endpoint) throw new Error("Mangler NEXT_PUBLIC_FORSIDE_ENDPOINT");
  const res = await fetch(`${endpoint}?action=delete&sheet=${encodeURIComponent(sheet)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
    cache: "no-store",
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Delete fejl");
  return json.result;
}

export async function uploadToDrive(file: File, filename?: string) {
  const endpoint = process.env.NEXT_PUBLIC_FORSIDE_ENDPOINT;
  if (!endpoint) throw new Error("Mangler NEXT_PUBLIC_FORSIDE_ENDPOINT");
  const form = new FormData();
  form.append("file", file);
  if (filename) form.append("filename", filename);
  const res = await fetch(`${endpoint}?action=upload`, { method: "POST", body: form });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Upload fejl");
  return json.url as string; // public URL
}
