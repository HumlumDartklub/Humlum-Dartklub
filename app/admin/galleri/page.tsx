"use client";

/* [HELP:GALLERY_ADMIN:IMPORTS] START */
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
/* [HELP:GALLERY_ADMIN:IMPORTS] END */

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, any>,
        callback: (error: any, result: any) => void,
      ) => {
        open: () => void;
      };
    };
  }
}

type GalleryRow = Record<string, any> & { _row?: number };
type AlbumRow = Record<string, any> & { _row?: number };

type SaveState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

/* [HELP:GALLERY_ADMIN:HELPERS] START */
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
/* [HELP:GALLERY_ADMIN:HELPERS] END */

export default function AdminGalleriPage() {
  /* [HELP:GALLERY_ADMIN:STATE] START */
  const [rows, setRows] = useState<GalleryRow[]>([]);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>(null);

  const [savingRow, setSavingRow] = useState<number | null>(null);
  const [savingAlbum, setSavingAlbum] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [albumKey, setAlbumKey] = useState("traening");
  const [visible, setVisible] = useState(true);
  const [cloudinaryReady, setCloudinaryReady] = useState(false);

  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");
  const [newAlbumVisible, setNewAlbumVisible] = useState(true);
  const [newAlbumOrder, setNewAlbumOrder] = useState("999");

  const [filterAlbumKey, setFilterAlbumKey] = useState("ALLE");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
  const folder =
    process.env.NEXT_PUBLIC_CLOUDINARY_GALLERY_FOLDER ||
    "humlum-dartklub/gallery";
  /* [HELP:GALLERY_ADMIN:STATE] END */

  /* [HELP:GALLERY_ADMIN:LOAD] START */
  async function loadAll() {
    try {
      setLoading(true);
      setSaveState(null);

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
        throw new Error(
          rowsData?.error || `Kunne ikke hente GALLERI (${rowsRes.status})`,
        );
      }

      if (!albumsRes.ok || albumsData?.ok === false) {
        throw new Error(
          albumsData?.error ||
            `Kunne ikke hente GALLERI_ALBUMS (${albumsRes.status})`,
        );
      }

      const rowItems = Array.isArray(rowsData?.items)
        ? (rowsData.items as GalleryRow[])
        : [];

      const albumItems = Array.isArray(albumsData?.items)
        ? (albumsData.items as AlbumRow[])
        : [];

      const cleanRows = sortRows(
        rowItems
          .filter((row) => isRealImageUrl(rowImageUrl(row)))
          .map((row) => {
            const nextAlbumKey = deriveRowAlbumKey(row);
            return {
              ...row,
              album_key: nextAlbumKey,
              category: albumTitleFromKey(nextAlbumKey),
            };
          }),
      );

      const cleanAlbums = sortAlbums(
        albumItems.map((album) => {
          const nextAlbumKey = normalizeAlbumKey(album.album_key || album.slug);
          return {
            ...album,
            album_key: nextAlbumKey,
            title:
              normalizeString(album.title) || albumTitleFromKey(nextAlbumKey),
            slug:
              normalizeString(album.slug) ||
              slugifyDa(album.title || nextAlbumKey),
            description: normalizeString(album.description),
            cover_url: normalizeString(album.cover_url),
          };
        }),
      );

      setRows(cleanRows);
      setAlbums(cleanAlbums);
    } catch (e: any) {
      setSaveState({
        type: "error",
        message: e?.message || "Ukendt fejl ved indlæsning af galleri.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);
  /* [HELP:GALLERY_ADMIN:LOAD] END */

  /* [HELP:GALLERY_ADMIN:OPTIONS] START */
  const albumOptions = useMemo(() => {
    const fromAlbums = albums.map((album) => ({
      album_key: normalizeAlbumKey(album.album_key),
      title:
        normalizeString(album.title) ||
        albumTitleFromKey(album.album_key || album.slug),
      slug:
        normalizeString(album.slug) ||
        slugifyDa(album.title || album.album_key),
    }));

    const existing = new Set(fromAlbums.map((album) => album.album_key));

    const fromRows = rows
      .map((row) => deriveRowAlbumKey(row))
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .filter((albumKey) => !existing.has(albumKey))
      .map((albumKey) => ({
        album_key: albumKey,
        title: albumTitleFromKey(albumKey),
        slug: slugifyDa(albumTitleFromKey(albumKey)),
      }));

    return [...fromAlbums, ...fromRows].sort((a, b) =>
      normalizeString(a.title).localeCompare(normalizeString(b.title), "da"),
    );
  }, [albums, rows]);

  useEffect(() => {
    if (!albumOptions.length) return;
    if (!albumOptions.some((option) => option.album_key === albumKey)) {
      setAlbumKey(albumOptions[0].album_key);
    }
  }, [albumOptions, albumKey]);
  /* [HELP:GALLERY_ADMIN:OPTIONS] END */

  const filteredRows = useMemo(() => {
    if (filterAlbumKey === "ALLE") return rows;
    return rows.filter(
      (row) => deriveRowAlbumKey(row) === normalizeAlbumKey(filterAlbumKey),
    );
  }, [rows, filterAlbumKey]);

  function getAlbumTitleByKey(key: string): string {
    const found = albumOptions.find(
      (option) => normalizeAlbumKey(option.album_key) === normalizeAlbumKey(key),
    );
    return found?.title || albumTitleFromKey(key);
  }

  /* [HELP:GALLERY_ADMIN:ROW_UPDATE] START */
  function updateRowValue(
    rowNumber: number | undefined,
    field: string,
    value: any,
  ) {
    if (!rowNumber) return;

    setRows((prev) =>
      prev.map((row) => {
        if (row._row !== rowNumber) return row;

        if (field === "album_key") {
          const nextAlbumKey = normalizeAlbumKey(value);
          return {
            ...row,
            album_key: nextAlbumKey,
            category: getAlbumTitleByKey(nextAlbumKey),
          };
        }

        return { ...row, [field]: value };
      }),
    );
  }

  function updateAlbumValue(
    rowNumber: number | undefined,
    field: string,
    value: any,
  ) {
    if (!rowNumber) return;

    setAlbums((prev) =>
      prev.map((album) => {
        if (album._row !== rowNumber) return album;

        if (field === "title") {
          const nextTitle = normalizeString(value);
          return {
            ...album,
            title: nextTitle,
            slug: normalizeString(album.slug) || slugifyDa(nextTitle),
          };
        }

        return { ...album, [field]: value };
      }),
    );
  }

  async function saveRow(row: GalleryRow) {
    if (!row?._row) {
      setSaveState({
        type: "error",
        message: "Rækken mangler _row og kan ikke gemmes.",
      });
      return;
    }

    try {
      setSavingRow(row._row);

      const nextAlbumKey = deriveRowAlbumKey(row);
      const payload = {
        tab: "GALLERI",
        action: "adminupdaterow",
        row: row._row,
        key: normalizeString(row.key),
        file_url: normalizeString(row.file_url),
        type: normalizeString(row.type || "image") || "image",
        album_key: nextAlbumKey,
        category: getAlbumTitleByKey(nextAlbumKey),
        title: normalizeString(row.title),
        description: normalizeString(row.description),
        alt_text:
          normalizeString(row.alt_text) ||
          normalizeString(row.title) ||
          "Galleri-billede",
        visible: isYes(row.visible) ? "YES" : "NO",
        order: toNumber(row.order),
        source: normalizeString(row.source || "cloudinary"),
      };

      const res = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `Kunne ikke gemme række (${res.status})`);
      }

      const item = (data?.item || {}) as GalleryRow;
      const merged: GalleryRow = {
        ...row,
        ...item,
        _row: row._row,
        album_key: deriveRowAlbumKey(item?.album_key ? item : row),
        category: getAlbumTitleByKey(deriveRowAlbumKey(item?.album_key ? item : row)),
      };

      setRows((prev) =>
        sortRows(prev.map((r) => (r._row === row._row ? merged : r))),
      );

      setSaveState({
        type: "success",
        message: `Billede “${normalizeString(merged.title) || "Galleri-billede"}” er gemt.`,
      });
    } catch (e: any) {
      setSaveState({
        type: "error",
        message: e?.message || "Kunne ikke gemme billedet.",
      });
    } finally {
      setSavingRow(null);
    }
  }

  async function saveAlbum(album: AlbumRow) {
    if (!album?._row) {
      setSaveState({
        type: "error",
        message: "Albummet mangler _row og kan ikke gemmes.",
      });
      return;
    }

    try {
      setSavingAlbum(album._row);

      const nextAlbumKey = normalizeAlbumKey(
        album.album_key || album.title || album.slug,
      );

      const payload = {
        tab: "GALLERI_ALBUMS",
        action: "adminupdaterow",
        row: album._row,
        album_key: nextAlbumKey,
        title:
          normalizeString(album.title) || albumTitleFromKey(nextAlbumKey),
        slug:
          normalizeString(album.slug) ||
          slugifyDa(album.title || nextAlbumKey),
        description: normalizeString(album.description),
        cover_url: normalizeString(album.cover_url),
        visible: isYes(album.visible) ? "YES" : "NO",
        order: toNumber(album.order),
        source: normalizeString(album.source || "admin"),
        note: normalizeString(album.note),
      };

      const res = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `Kunne ikke gemme album (${res.status})`);
      }

      const item = (data?.item || {}) as AlbumRow;
      const merged: AlbumRow = {
        ...album,
        ...item,
        _row: album._row,
        album_key: normalizeAlbumKey(item?.album_key || nextAlbumKey),
        title:
          normalizeString(item?.title) ||
          normalizeString(album.title) ||
          albumTitleFromKey(nextAlbumKey),
      };

      setAlbums((prev) =>
        sortAlbums(prev.map((a) => (a._row === album._row ? merged : a))),
      );

      setSaveState({
        type: "success",
        message: `Album “${normalizeString(merged.title) || "Album"}” er gemt.`,
      });
    } catch (e: any) {
      setSaveState({
        type: "error",
        message: e?.message || "Kunne ikke gemme albummet.",
      });
    } finally {
      setSavingAlbum(null);
    }
  }
  /* [HELP:GALLERY_ADMIN:ROW_UPDATE] END */

  /* [HELP:GALLERY_ADMIN:UPLOAD] START */
  async function createGalleryRowFromUpload(info: any): Promise<GalleryRow> {
    const secureUrl = normalizeString(info?.secure_url || info?.url);
    if (!secureUrl) {
      throw new Error("Cloudinary returnerede ingen billed-URL.");
    }

    const nextAlbumKey = normalizeAlbumKey(albumKey);
    const fallbackName = normalizeString(
      info?.original_filename || info?.display_name || "Galleri-billede",
    );
    const now = Date.now();

    const payload = {
      tab: "GALLERI",
      action: "admincreaterow",
      row_key: `gallery_${now}_${Math.random().toString(36).slice(2, 8)}`,
      file_url: secureUrl,
      type: "image",
      album_key: nextAlbumKey,
      category: getAlbumTitleByKey(nextAlbumKey),
      title: title.trim() || fallbackName,
      description: description.trim(),
      alt_text: title.trim() || description.trim() || fallbackName,
      visible: visible ? "YES" : "NO",
      order: now,
      source: "cloudinary",
    };

    const res = await fetch("/api/sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.ok === false) {
      throw new Error(
        data?.error || `Kunne ikke gemme i GALLERI (${res.status})`,
      );
    }

    const item = (data?.item || {}) as GalleryRow;

    return {
      ...item,
      _row: item?._row || data?.row,
      key: item?.key || payload.row_key,
      file_url: item?.file_url || secureUrl,
      title: item?.title || payload.title,
      description: item?.description || payload.description,
      alt_text: item?.alt_text || payload.alt_text,
      album_key: deriveRowAlbumKey(item?.album_key ? item : payload),
      category: getAlbumTitleByKey(nextAlbumKey),
      visible: item?.visible || payload.visible,
      order: item?.order || payload.order,
      source: item?.source || payload.source,
      type: item?.type || "image",
    };
  }

  async function createAlbum() {
    const titleValue = normalizeString(newAlbumTitle);
    if (!titleValue) {
      setSaveState({
        type: "error",
        message: "Skriv først et albumnavn.",
      });
      return;
    }

    const nextAlbumKey = normalizeAlbumKey(titleValue);

    if (
      albumOptions.some(
        (option) => normalizeAlbumKey(option.album_key) === nextAlbumKey,
      )
    ) {
      setSaveState({
        type: "error",
        message: `Albummet “${titleValue}” findes allerede.`,
      });
      return;
    }

    try {
      setBusy(true);

      const payload = {
        tab: "GALLERI_ALBUMS",
        action: "admincreaterow",
        album_key: nextAlbumKey,
        title: titleValue,
        slug: slugifyDa(titleValue),
        description: normalizeString(newAlbumDescription),
        cover_url: "",
        visible: newAlbumVisible ? "YES" : "NO",
        order: toNumber(newAlbumOrder || 999),
        source: "admin",
      };

      const res = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `Kunne ikke oprette album (${res.status})`);
      }

      setSaveState({
        type: "success",
        message: `Album “${titleValue}” er oprettet.`,
      });

      setNewAlbumTitle("");
      setNewAlbumDescription("");
      setNewAlbumVisible(true);
      setNewAlbumOrder("999");
      setAlbumKey(nextAlbumKey);

      await loadAll();
    } catch (e: any) {
      setSaveState({
        type: "error",
        message: e?.message || "Kunne ikke oprette albummet.",
      });
    } finally {
      setBusy(false);
    }
  }

  function openUploadWidget() {
    setSaveState(null);

    if (!cloudName || !uploadPreset) {
      setSaveState({
        type: "error",
        message:
          "Cloudinary mangler i .env.local. Tjek cloud name og upload preset.",
      });
      return;
    }

    if (!window.cloudinary?.createUploadWidget) {
      setSaveState({
        type: "error",
        message:
          "Cloudinary widget er ikke klar endnu. Prøv igen om et øjeblik.",
      });
      return;
    }

    const uploadedRows: Promise<GalleryRow>[] = [];

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        folder,
        sources: ["local", "camera"],
        multiple: true,
        resourceType: "image",
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "heic"],
        maxImageFileSize: 15000000,
        showAdvancedOptions: false,
        cropping: false,
        theme: "minimal",
        language: "en",
      },
      (error, result) => {
        if (error) {
          setBusy(false);
          setSaveState({
            type: "error",
            message: error?.message || "Upload til Cloudinary fejlede.",
          });
          return;
        }

        if (!result) return;
        if (result.event === "display-changed") return;

        if (result.event === "queues-start") {
          setBusy(true);
          return;
        }

        if (result.event === "success") {
          uploadedRows.push(createGalleryRowFromUpload(result.info));
          return;
        }

        if (result.event === "queues-end") {
          Promise.all(uploadedRows)
            .then((created) => {
              const goodRows = created.filter((row) =>
                isRealImageUrl(rowImageUrl(row)),
              );

              if (!goodRows.length) {
                throw new Error("Ingen billeder blev gemt i GALLERI.");
              }

              setRows((prev) => sortRows([...goodRows, ...prev]));
              setSaveState({
                type: "success",
                message: `${goodRows.length} billede(r) uploadet og gemt i GALLERI.`,
              });
              setTitle("");
              setDescription("");
              void loadAll();
            })
            .catch((e: any) => {
              setSaveState({
                type: "error",
                message: e?.message || "Kunne ikke gemme upload i GALLERI.",
              });
            })
            .finally(() => {
              setBusy(false);
            });
        }
      },
    );

    widget.open();
  }
  /* [HELP:GALLERY_ADMIN:UPLOAD] END */

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Script
        src="https://widget.cloudinary.com/v2.0/global/all.js"
        strategy="afterInteractive"
        onLoad={() => setCloudinaryReady(true)}
      />

      {/* [HELP:GALLERY_ADMIN:UPLOAD_UI] START */}
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Galleri
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Nu med rigtige albums. Ikke mere “category-klisterlap” på et halvtræt
          system.
        </p>
      </header>

      <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Opret nyt album
        </div>

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-700">
              Albumnavn
            </div>
            <input
              type="text"
              value={newAlbumTitle}
              onChange={(e) => setNewAlbumTitle(e.target.value)}
              placeholder="Fx Holdturnering"
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-700">Order</div>
            <input
              type="number"
              value={newAlbumOrder}
              onChange={(e) => setNewAlbumOrder(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <div className="mb-1 text-sm font-medium text-slate-700">
            Beskrivelse
          </div>
          <textarea
            value={newAlbumDescription}
            onChange={(e) => setNewAlbumDescription(e.target.value)}
            placeholder="Fx Billeder fra holdkampe og turneringsaftener."
            rows={3}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={newAlbumVisible}
              onChange={(e) => setNewAlbumVisible(e.target.checked)}
            />
            Vis albummet med det samme
          </label>

          <button
            type="button"
            onClick={() => void createAlbum()}
            disabled={busy}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Opret album
          </button>
        </div>

        {saveState ? (
          <div
            className={
              "mt-3 rounded-xl border px-3 py-2 text-sm " +
              (saveState.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700")
            }
          >
            {saveState.message}
          </div>
        ) : null}
      </section>

      <section className="mt-4 rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Nyt upload
        </div>

        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_280px]">
          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-700">Titel</div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Fx Tirsdagstræning i klubhuset"
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-700">Album</div>
            <select
              value={albumKey}
              onChange={(e) => setAlbumKey(normalizeAlbumKey(e.target.value))}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
            >
              {albumOptions.map((option) => (
                <option key={option.album_key} value={option.album_key}>
                  {option.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block">
          <div className="mb-1 text-sm font-medium text-slate-700">Note</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Fx 14 spillere, god stemning og nye ansigter i klubben."
            rows={4}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
            />
            Vis billedet med det samme
          </label>

          <button
            type="button"
            onClick={openUploadWidget}
            disabled={busy || !cloudinaryReady || !albumOptions.length}
            className="rounded-full bg-gradient-to-r from-orange-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Uploader…" : "Upload billeder"}
          </button>
        </div>

        <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          Nu ryger uploadet direkte ind i det valgte album. Så det hele ikke ender
          som én stor digital værktøjskasse uden låg.
        </div>

        {!cloudName || !uploadPreset ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Cloudinary er ikke sat helt op endnu. Tjek
            NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME og
            NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET i .env.local.
          </div>
        ) : null}
      </section>
      {/* [HELP:GALLERY_ADMIN:UPLOAD_UI] END */}

      <section className="mt-4 rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Albums
          </div>

          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loading}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Genindlæs
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500">
            Henter albums…
          </div>
        ) : albumOptions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500">
            Der er ingen albums endnu.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {sortAlbums(
              albumOptions.map((option) => {
                const fullAlbum =
                  albums.find(
                    (album) =>
                      normalizeAlbumKey(album.album_key) ===
                      normalizeAlbumKey(option.album_key),
                  ) || {};
                return {
                  ...fullAlbum,
                  album_key: option.album_key,
                  title: fullAlbum.title || option.title,
                  slug: fullAlbum.slug || option.slug,
                  description: fullAlbum.description || "",
                  cover_url: fullAlbum.cover_url || "",
                  visible:
                    fullAlbum.visible !== undefined ? fullAlbum.visible : "YES",
                  order: fullAlbum.order ?? 999,
                  _row: fullAlbum._row,
                } as AlbumRow;
              }),
            ).map((album) => {
              const albumRows = rows.filter(
                (row) =>
                  deriveRowAlbumKey(row) === normalizeAlbumKey(album.album_key),
              );
              const albumBusy = savingAlbum === album._row;

              return (
                <article
                  key={normalizeString(album.album_key)}
                  className="rounded-[1.25rem] border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-neutral-400">
                        {album._row ? `Række ${album._row}` : "Fallback-album"}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {normalizeString(album.title) || "Album"}
                      </div>
                      <div className="text-xs text-neutral-500">
                        key: {normalizeString(album.album_key)} · {albumRows.length} billede(r)
                      </div>
                    </div>

                    <span
                      className={
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide " +
                        (isYes(album.visible)
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-neutral-100 text-neutral-600")
                      }
                    >
                      {isYes(album.visible) ? "Synlig" : "Skjult"}
                    </span>
                  </div>

                  {album._row ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            Titel
                          </div>
                          <input
                            type="text"
                            value={normalizeString(album.title)}
                            onChange={(e) =>
                              updateAlbumValue(album._row, "title", e.target.value)
                            }
                            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                          />
                        </label>

                        <label className="block">
                          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            Slug
                          </div>
                          <input
                            type="text"
                            value={normalizeString(album.slug)}
                            onChange={(e) =>
                              updateAlbumValue(album._row, "slug", e.target.value)
                            }
                            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                          />
                        </label>
                      </div>

                      <label className="mt-3 block">
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                          Beskrivelse
                        </div>
                        <textarea
                          rows={3}
                          value={normalizeString(album.description)}
                          onChange={(e) =>
                            updateAlbumValue(album._row, "description", e.target.value)
                          }
                          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                        />
                      </label>

                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px]">
                        <label className="block">
                          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            Cover URL
                          </div>
                          <input
                            type="text"
                            value={normalizeString(album.cover_url)}
                            onChange={(e) =>
                              updateAlbumValue(album._row, "cover_url", e.target.value)
                            }
                            placeholder="Valgfri — ellers bruges første billede i albummet"
                            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                          />
                        </label>

                        <label className="block">
                          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            Order
                          </div>
                          <input
                            type="number"
                            value={toNumber(album.order)}
                            onChange={(e) =>
                              updateAlbumValue(album._row, "order", e.target.value)
                            }
                            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                          />
                        </label>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <label className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={isYes(album.visible)}
                            onChange={(e) =>
                              updateAlbumValue(
                                album._row,
                                "visible",
                                e.target.checked ? "YES" : "NO",
                              )
                            }
                          />
                          Vis album
                        </label>

                        <button
                          type="button"
                          onClick={() => void saveAlbum(album)}
                          disabled={albumBusy}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {albumBusy ? "Gemmer…" : "Gem album"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-neutral-300 px-3 py-3 text-sm text-neutral-500">
                      Dette album findes i billederne, men ikke som rigtig række i
                      GALLERI_ALBUMS endnu.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* [HELP:GALLERY_ADMIN:LIST_UI] START */}
      <section className="mt-4 rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Eksisterende galleri-billeder
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs text-neutral-400">{rows.length} billeder</div>

            <select
              value={filterAlbumKey}
              onChange={(e) => setFilterAlbumKey(e.target.value)}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="ALLE">Alle albums</option>
              {albumOptions.map((option) => (
                <option key={option.album_key} value={option.album_key}>
                  {option.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void loadAll()}
              disabled={loading}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Genindlæs
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500">
            Henter galleri-billeder…
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500">
            Der er ingen galleri-billeder i dette filter endnu.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredRows.map((row, idx) => {
              const imageUrl = rowImageUrl(row);
              const cardKey =
                normalizeString(row.key) ||
                normalizeString(row._row) ||
                `${imageUrl}-${idx}`;

              const rowNo = row._row;
              const rowBusy = savingRow === rowNo;

              return (
                <article
                  key={cardKey}
                  className="overflow-hidden rounded-[1.25rem] border border-neutral-200 bg-white shadow-sm"
                >
                  <div className="grid gap-0 md:grid-cols-[260px_1fr]">
                    <div className="aspect-[4/3] bg-slate-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={normalizeString(
                            row.alt_text || row.title || "Galleri",
                          )}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          Intet billede
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-neutral-400">
                            Række {rowNo || "?"}
                          </div>
                          <div className="text-xs text-neutral-500">
                            Key: {normalizeString(row.key) || "—"}
                          </div>
                        </div>

                        <span
                          className={
                            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide " +
                            (isYes(row.visible)
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-neutral-100 text-neutral-600")
                          }
                        >
                          {isYes(row.visible) ? "Synlig" : "Skjult"}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            Titel
                          </div>
                          <input
                            type="text"
                            value={normalizeString(row.title)}
                            onChange={(e) =>
                              updateRowValue(rowNo, "title", e.target.value)
                            }
                            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                          />
                        </label>

                        <label className="block">
                          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            Album
                          </div>
                          <select
                            value={deriveRowAlbumKey(row)}
                            onChange={(e) =>
                              updateRowValue(rowNo, "album_key", e.target.value)
                            }
                            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                          >
                            {albumOptions.map((option) => (
                              <option key={option.album_key} value={option.album_key}>
                                {option.title}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="block">
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                          Beskrivelse / note
                        </div>
                        <textarea
                          rows={3}
                          value={normalizeString(row.description)}
                          onChange={(e) =>
                            updateRowValue(rowNo, "description", e.target.value)
                          }
                          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                        />
                      </label>

                      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                        <label className="block">
                          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            Order
                          </div>
                          <input
                            type="number"
                            value={toNumber(row.order)}
                            onChange={(e) =>
                              updateRowValue(rowNo, "order", e.target.value)
                            }
                            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                          />
                        </label>

                        <div className="flex flex-wrap items-end gap-3">
                          <label className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={isYes(row.visible)}
                              onChange={(e) =>
                                updateRowValue(
                                  rowNo,
                                  "visible",
                                  e.target.checked ? "YES" : "NO",
                                )
                              }
                            />
                            Vis billede
                          </label>

                          <button
                            type="button"
                            onClick={() => void saveRow(row)}
                            disabled={rowBusy}
                            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {rowBusy ? "Gemmer…" : "Gem ændringer"}
                          </button>

                          {imageUrl ? (
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Åbn billede
                            </a>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-[11px] text-neutral-400">
                        Album: {getAlbumTitleByKey(deriveRowAlbumKey(row))}
                        {" · "}
                        Kilde: {normalizeString(row.source) || "—"}
                        {normalizeString(row.created_at)
                          ? ` · Oprettet: ${normalizeString(row.created_at)}`
                          : ""}
                        {normalizeString(row.updated_at)
                          ? ` · Opdateret: ${normalizeString(row.updated_at)}`
                          : ""}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      {/* [HELP:GALLERY_ADMIN:LIST_UI] END */}
    </main>
  );
}