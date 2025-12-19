import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MEMBER_COOKIE, verifyMemberToken } from "@/lib/memberAuth";

function sanitizeUrl(raw: string): string | null {
  const u = String(raw || "").trim();
  if (!u) return null;
  const low = u.toLowerCase();
  if (low.startsWith("javascript:") || low.startsWith("data:")) return null;

  // Allow internal links
  if (u.startsWith("/")) return u;

  // Allow http(s) + mailto/tel
  if (
    low.startsWith("http://") ||
    low.startsWith("https://") ||
    low.startsWith("mailto:") ||
    low.startsWith("tel:")
  ) {
    return u;
  }
  return null;
}

function getDrivePreview(url: string): { previewUrl?: string; openUrl?: string; kind: string } {
  const u = url.trim();

  // Folder
  let m = u.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (m?.[1]) {
    return { openUrl: u, kind: "folder" };
  }

  // Drive file
  m = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m?.[1]) {
    const id = m[1];
    return {
      previewUrl: `https://drive.google.com/file/d/${id}/preview`,
      openUrl: u,
      kind: "drive-file",
    };
  }

  // drive open?id=
  m = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m?.[1] && u.includes("drive.google.com")) {
    const id = m[1];
    return {
      previewUrl: `https://drive.google.com/file/d/${id}/preview`,
      openUrl: `https://drive.google.com/file/d/${id}/view`,
      kind: "drive-file",
    };
  }

  // Google Docs/Sheets/Slides
  m = u.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
  if (m?.[1] && m?.[2]) {
    const type = m[1];
    const id = m[2];
    return {
      previewUrl: `https://docs.google.com/${type}/d/${id}/preview`,
      openUrl: u,
      kind: `docs-${type}`,
    };
  }

  return { openUrl: u, kind: "link" };
}

function openLabel(kind: string, url: string): string {
  const low = url.toLowerCase();
  if (kind === "folder") return "Åbn mappe";
  if (kind.startsWith("docs-") || kind === "drive-file") return "Åbn i Drive";
  if (low.startsWith("mailto:")) return "Skriv mail";
  if (low.startsWith("tel:")) return "Ring";
  if (url.startsWith("/")) return "Åbn";
  return "Åbn link";
}

export default async function ViewerPage({
  searchParams,
}: {
  searchParams: { url?: string; title?: string };
}) {
  // [HELP:VIEWER:AUTH] START
  const cookieStore = await cookies();
  const token = cookieStore.get(MEMBER_COOKIE)?.value || "";
  const member = verifyMemberToken(token);
  if (!member) redirect("/medlemslogin");
  // [HELP:VIEWER:AUTH] END

  const rawUrl = String(searchParams?.url || "").trim();
  const title = String(searchParams?.title || "HDK Viewer").trim();
  const safeUrl = sanitizeUrl(rawUrl);

  if (!safeUrl) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <h1 className="text-2xl font-semibold">Ugyldigt link</h1>
          <p className="mt-3 opacity-80">Linket mangler eller kan ikke åbnes sikkert.</p>
          <Link
            href="/medlemszone"
            className="mt-4 inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold border bg-white/10 hover:bg-white/15 transition"
          >
            Tilbage til medlemszone
          </Link>
        </section>
      </main>
    );
  }

  const { previewUrl, openUrl, kind } = getDrivePreview(safeUrl);
  const finalOpenUrl = openUrl || safeUrl;
  const label = openLabel(kind, finalOpenUrl);

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* [HELP:VIEWER:HEADER] START */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-2 opacity-80">Type: {kind}</p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/medlemszone"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold border bg-white/10 hover:bg-white/15 transition"
            >
              Tilbage
            </Link>

            <a
              href={finalOpenUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold border bg-orange-400 text-black hover:opacity-90 transition"
            >
              {label}
            </a>
          </div>
        </div>
      </section>
      {/* [HELP:VIEWER:HEADER] END */}

      {/* [HELP:VIEWER:PREVIEW] START */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-2 shadow-lg">
        {previewUrl ? (
          <iframe src={previewUrl} className="w-full h-[75vh] rounded-2xl" allow="autoplay" />
        ) : (
          <div className="p-6">
            <p className="opacity-80">Denne type link kan ikke forhåndsvises direkte her. Brug “{label}”.</p>
          </div>
        )}
      </section>
      {/* [HELP:VIEWER:PREVIEW] END */}
    </main>
  );
}
