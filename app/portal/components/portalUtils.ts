export function safeText(v: any): string {
  return String(v ?? "").trim();
}

export function isVisible(v: any): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return v === true || s === "yes" || s === "true" || s === "1" || s === "ja";
}

export function toOrder(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 9999;
}

export function groupStartsWith(group: any, prefix: string): boolean {
  const g = safeText(group).toLowerCase();
  const p = safeText(prefix).toLowerCase();
  return !!g && !!p && g.startsWith(p);
}

export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function buildViewerUrl(rawUrl: string): string {
  return `/viewer?url=${encodeURIComponent(rawUrl)}`;
}
