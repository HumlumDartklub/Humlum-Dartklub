"use client";

/* [HELP:GALLERY_PUBLIC:IMPORTS] START */
import { useEffect, useMemo, useState } from "react";
/* [HELP:GALLERY_PUBLIC:IMPORTS] END */

type GalleryRow = Record<string, any> & { _row?: number };
type AlbumRow = Record<string, any> & { _row?: number };

function normalizeString(value: any): string {
  return String(value ?? "").trim();
}

function toNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isYes(value: any): boolean {
  const v = normalizeString(value).toUpperCase();
  return v === "YES" || v === "TRUE" || v === "1" || v === "JA";
}

function slugifyDa(value: any): string {
  return normalizeString(value)
    .toLowerCase()
    .replaceAll("æ", "ae")
    .replaceAll("ø", "oe")
    .replaceAll("å", "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeAlbumKey(value: any): string {
  const raw = normalizeString(value);
  if (!raw) return "andet";
  return slugifyDa(raw).replaceAll("-", "_") || "andet";
}

function albumTitleFromKey(value: any): string {
  const key = normalizeAlbumKey(value);

  const map: Record<string, string> = {
    traening: "Træning",
    ungdom: "Ungdom",
    turnering: "Turnering",
    events: "Events",
    sommerfest: "Sommerfest",
    holdturnering: "Holdturnering",
    aabningsdag: "Åbningsdag",
    klubhus: "Klubhus",
    andet: "Andet",
    test: "Test",
  };

  if (map[key]) return map[key];

  const pretty = key.replaceAll("_", " ");
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

function rowImageUrl(row: GalleryRow): string {
  return normalizeString(row?.file_url || row?.image_url || row?.url);
}

function isRealImageUrl(url: string): boolean {
  const v = normalizeString(url);
  if (!v) return false;
  if (!/^https?:\/\//i.test(v)) return false;
  if (v.includes("DIT_CLOUD_NAME")) return false;
  return true;
}

function rowStableId(row: GalleryRow): string {
  return (
    normalizeString(row?.key) ||
    normalizeString(row?._row) ||
    rowImageUrl(row) ||
    Math.random().toString(36).slice(2)
  );
}

function deriveRowAlbumKey(row: GalleryRow): string {
  return normalizeAlbumKey(row?.album_key || row?.category || "andet");
}

function sortRows(list: GalleryRow[]): GalleryRow[] {
  return [...list].sort((a, b) => {
    const ao = toNumber(a?.order);
    const bo = toNumber(b?.order);
    if (bo !== ao) return bo - ao;

    const aCreated =
      Date.parse(normalizeString(a?.created_at || a?.updated_at || "")) || 0;
    const bCreated =
      Date.parse(normalizeString(b?.created_at || b?.updated_at || "")) || 0;
    if (bCreated !== aCreated) return bCreated - aCreated;

    return normalizeString(a?.title).localeCompare(
      normalizeString(b?.title),
      "da",
    );
  });
}

function sortAlbums(list: AlbumRow[]): AlbumRow[] {
  return [...list].sort((a, b) => {
    const ao = toNumber(a?.order || 999);
    const bo = toNumber(b?.order || 999);
    if (ao !== bo) return ao - bo;

    return normalizeString(a?.title).localeCompare(
      normalizeString(b?.title),
      "da",
    );
  });
}

export default function GalleriPage() {
  /* [HELP:GALLERY_PUBLIC:STATE] START */
  const [rows, setRows] = useState<GalleryRow[]>([]);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbumKey, setSelectedAlbumKey] = useState<string | null>(null);
  const [activeRow, setActiveRow] = useState<GalleryRow | null>(null);
  /* [HELP:GALLERY_PUBLIC:STATE] END */

  /* [HELP:GALLERY_PUBLIC:LOAD] START */
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [rowsRes, albumsRes] = await Promise.all([
          fetch("/api/sheet?tab=GALLERI&limit=2000", {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/sheet?tab=GALLERI_ALBUMS&limit=500", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const rowsData = await rowsRes.json().catch(() => ({}));
        const albumsData = await albumsRes.json().catch(() => ({}));

        if (!rowsRes.ok || rowsData?.ok === false) {
          throw new Error(rowsData?.error || "Kunne ikke hente GALLERI.");
        }

        if (!albumsRes.ok || albumsData?.ok === false) {
          throw new Error(
            albumsData?.error || "Kunne ikke hente GALLERI_ALBUMS.",
          );
        }

        const rawRows = Array.isArray(rowsData?.items)
          ? (rowsData.items as GalleryRow[])
          : [];

        const rawAlbums = Array.isArray(albumsData?.items)
          ? (albumsData.items as AlbumRow[])
          : [];

        const cleanRows = sortRows(
          rawRows
            .filter((row) => isYes(row.visible))
            .filter((row) => isRealImageUrl(rowImageUrl(row)))
            .map((row) => {
              const albumKey = deriveRowAlbumKey(row);
              return {
                ...row,
                album_key: albumKey,
                category: albumTitleFromKey(albumKey),
              };
            }),
        );

        const cleanAlbumsBase = rawAlbums
          .filter((album) => isYes(album.visible))
          .map((album) => {
            const albumKey = normalizeAlbumKey(album.album_key || album.slug);
            return {
              ...album,
              album_key: albumKey,
              title:
                normalizeString(album.title) || albumTitleFromKey(albumKey),
              slug:
                normalizeString(album.slug) || slugifyDa(album.title || albumKey),
              description: normalizeString(album.description),
              cover_url: normalizeString(album.cover_url),
              visible: "YES",
            };
          });

        const existingAlbumKeys = new Set(
          cleanAlbumsBase.map((album) => normalizeAlbumKey(album.album_key)),
        );

        const fallbackAlbums = cleanRows
          .map((row) => deriveRowAlbumKey(row))
          .filter((value, index, arr) => arr.indexOf(value) === index)
          .filter((albumKey) => !existingAlbumKeys.has(albumKey))
          .map((albumKey, index) => ({
            album_key: albumKey,
            title: albumTitleFromKey(albumKey),
            slug: slugifyDa(albumTitleFromKey(albumKey)),
            description: "",
            cover_url: "",
            visible: "YES",
            order: 1000 + index,
          }));

        const mergedAlbums = sortAlbums([
          ...cleanAlbumsBase,
          ...fallbackAlbums,
        ]);

        setRows(cleanRows);
        setAlbums(mergedAlbums);

        const queryAlbum =
          typeof window !== "undefined"
            ? normalizeString(
                new URLSearchParams(window.location.search).get("album"),
              )
            : "";

        if (queryAlbum) {
          const found = mergedAlbums.find(
            (album) =>
              normalizeString(album.slug) === queryAlbum ||
              normalizeString(album.album_key) === normalizeAlbumKey(queryAlbum),
          );
          setSelectedAlbumKey(found ? normalizeString(found.album_key) : null);
        } else {
          setSelectedAlbumKey(null);
        }
      } catch {
        setRows([]);
        setAlbums([]);
        setSelectedAlbumKey(null);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);
  /* [HELP:GALLERY_PUBLIC:LOAD] END */

  /* [HELP:GALLERY_PUBLIC:FILTERS] START */
  const albumsWithMeta = useMemo(() => {
    return albums.map((album) => {
      const albumKey = normalizeAlbumKey(album.album_key);
      const albumRows = rows.filter(
        (row) => deriveRowAlbumKey(row) === albumKey,
      );

      const coverUrl =
        normalizeString(album.cover_url) ||
        rowImageUrl(albumRows[0] || {}) ||
        "";

      return {
        ...album,
        album_key: albumKey,
        count: albumRows.length,
        cover_url: coverUrl,
      };
    });
  }, [albums, rows]);

  const selectedAlbum = useMemo(() => {
    if (!selectedAlbumKey) return null;
    return (
      albumsWithMeta.find(
        (album) => normalizeAlbumKey(album.album_key) === selectedAlbumKey,
      ) || null
    );
  }, [albumsWithMeta, selectedAlbumKey]);

  const selectedRows = useMemo(() => {
    if (!selectedAlbumKey) return [];
    return rows.filter(
      (row) => deriveRowAlbumKey(row) === normalizeAlbumKey(selectedAlbumKey),
    );
  }, [rows, selectedAlbumKey]);

  const activeIndex = useMemo(() => {
    if (!activeRow) return -1;
    return selectedRows.findIndex(
      (row) => rowStableId(row) === rowStableId(activeRow),
    );
  }, [selectedRows, activeRow]);
  /* [HELP:GALLERY_PUBLIC:FILTERS] END */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);

    if (selectedAlbum) {
      url.searchParams.set(
        "album",
        normalizeString(selectedAlbum.slug) ||
          normalizeString(selectedAlbum.album_key),
      );
    } else {
      url.searchParams.delete("album");
    }

    const nextUrl = `${url.pathname}${url.search}`;
    window.history.replaceState({}, "", nextUrl);
  }, [selectedAlbum]);

  function openAlbum(albumKey: string) {
    setSelectedAlbumKey(normalizeAlbumKey(albumKey));
    setActiveRow(null);
  }

  function closeAlbum() {
    setSelectedAlbumKey(null);
    setActiveRow(null);
  }

  function moveLightbox(step: number) {
    if (!selectedRows.length || activeIndex < 0) return;
    const nextIndex =
      (activeIndex + step + selectedRows.length) % selectedRows.length;
    setActiveRow(selectedRows[nextIndex] || null);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* [HELP:GALLERY_PUBLIC:HERO] START */}
      <section className="mb-6 overflow-hidden rounded-[2rem] border border-neutral-200 bg-white/90 shadow-sm">
        <div className="grid gap-4 px-6 py-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
              HDK Galleri
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {selectedAlbum
                ? selectedAlbum.title || "Album"
                : "Billeder fra klubben"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {selectedAlbum
                ? selectedAlbum.description ||
                  `Her finder du billeder fra albummet “${selectedAlbum.title}”.`
                : "Her samler vi glimt fra træning, events, hygge og alt det gode indimellem."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedAlbum ? (
              <>
                <span className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                  {selectedRows.length} billede(r)
                </span>
                <button
                  type="button"
                  onClick={closeAlbum}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Tilbage til albums
                </button>
              </>
            ) : (
              <span className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                {albumsWithMeta.length} album(s)
              </span>
            )}
          </div>
        </div>
      </section>
      {/* [HELP:GALLERY_PUBLIC:HERO] END */}

      {/* [HELP:GALLERY_PUBLIC:GRID] START */}
      {loading ? (
        <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Henter galleri…
        </div>
      ) : !selectedAlbum ? (
        albumsWithMeta.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-sm text-neutral-500">
            Der er ingen albums endnu.
          </div>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {albumsWithMeta.map((album) => (
              <button
                key={normalizeString(album.album_key)}
                type="button"
                onClick={() => openAlbum(normalizeString(album.album_key))}
                className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] bg-slate-100">
                  {album.cover_url ? (
                    <img
                      src={album.cover_url}
                      alt={normalizeString(album.title || "Album")}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      Intet cover endnu
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 text-lg font-semibold text-slate-900">
                      {normalizeString(album.title) || "Album"}
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      {album.count} stk
                    </span>
                  </div>

                  {normalizeString(album.description) ? (
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                      {normalizeString(album.description)}
                    </p>
                  ) : (
                    <p className="text-sm leading-6 text-slate-400">
                      Åbn albummet for at se billederne.
                    </p>
                  )}
                </div>
              </button>
            ))}
          </section>
        )
      ) : selectedRows.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Der er ingen billeder i dette album endnu.
        </div>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {selectedRows.map((row, idx) => {
            const imageUrl = rowImageUrl(row);
            const cardKey = rowStableId(row) || `${imageUrl}-${idx}`;

            return (
              <button
                key={cardKey}
                type="button"
                onClick={() => setActiveRow(row)}
                className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] bg-slate-100">
                  <img
                    src={imageUrl}
                    alt={normalizeString(row.alt_text || row.title || "Galleri")}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="space-y-3 p-4">
                  <h2 className="line-clamp-2 text-lg font-semibold text-slate-900">
                    {normalizeString(row.title) || "Galleri-billede"}
                  </h2>

                  {normalizeString(row.description) ? (
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                      {normalizeString(row.description)}
                    </p>
                  ) : (
                    <p className="text-sm leading-6 text-slate-400">
                      Tryk for at åbne billedet.
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </section>
      )}
      {/* [HELP:GALLERY_PUBLIC:GRID] END */}

      {/* [HELP:GALLERY_PUBLIC:LIGHTBOX] START */}
      {activeRow ? (
        <div
          className="fixed inset-0 z-50 bg-black/75 px-4 py-6"
          onClick={() => setActiveRow(null)}
        >
          <div className="mx-auto flex h-full max-w-6xl items-center justify-center">
            <div
              className="grid max-h-full w-full overflow-hidden rounded-[1.75rem] bg-white shadow-2xl lg:grid-cols-[minmax(0,1fr)_340px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-slate-100">
                <img
                  src={rowImageUrl(activeRow)}
                  alt={normalizeString(
                    activeRow.alt_text || activeRow.title || "Galleri",
                  )}
                  className="max-h-[80vh] w-full object-contain"
                />

                {selectedRows.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => moveLightbox(-1)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/65 px-3 py-2 text-sm font-semibold text-white"
                    >
                      ←
                    </button>

                    <button
                      type="button"
                      onClick={() => moveLightbox(1)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/65 px-3 py-2 text-sm font-semibold text-white"
                    >
                      →
                    </button>
                  </>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
                      {selectedAlbum?.title || "Album"}
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                      {normalizeString(activeRow.title) || "Galleri-billede"}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveRow(null)}
                    className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Luk
                  </button>
                </div>

                {normalizeString(activeRow.description) ? (
                  <p className="text-sm leading-7 text-slate-600">
                    {normalizeString(activeRow.description)}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">
                    Ingen ekstra beskrivelse på dette billede.
                  </p>
                )}

                {selectedRows.length > 1 && activeIndex >= 0 ? (
                  <div className="text-xs text-neutral-400">
                    Billede {activeIndex + 1} af {selectedRows.length}
                  </div>
                ) : null}

                <div className="mt-auto flex flex-wrap gap-2">
                  <a
                    href={rowImageUrl(activeRow)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Åbn original
                  </a>

                  <button
                    type="button"
                    onClick={() => setActiveRow(null)}
                    className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Tilbage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {/* [HELP:GALLERY_PUBLIC:LIGHTBOX] END */}
    </main>
  );
}