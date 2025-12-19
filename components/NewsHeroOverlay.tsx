"use client";

/* [HELP:NEWS:IMPORTS] START */
import { useEffect, useState } from "react";
/* [HELP:NEWS:IMPORTS] END */

/* [HELP:NEWS:TYPES] START */
type NewsItem = {
  title: string;
  teaser?: string;
  body?: string;
  url?: string;
  link?: string;
  label?: string;
  date?: string;
  image: string;
};
/* [HELP:NEWS:TYPES] END */

function pickUrl(item: NewsItem): string {
  if (item.url && item.url.trim()) return item.url;
  if (item.link && item.link.trim()) return item.link;
  return "#";
}

/* [HELP:NEWS:COMPONENT] START */
export default function NewsHeroOverlay() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [modalItem, setModalItem] = useState<NewsItem | null>(null);

  /* [HELP:NEWS:DATA:FETCH] START */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/news", { cache: "no-store" });
        if (!res.ok) {
          console.error("NewsHeroOverlay: /api/news failed", res.status);
          return;
        }
        const data = await res.json();
        const arr: NewsItem[] = Array.isArray(data?.items) ? data.items : [];
        const clean = arr.filter(
          (x) => x && typeof x.title === "string" && x.title.trim() !== ""
        );
        setItems(clean);
        setIdx(0);
      } catch (err) {
        console.error("NewsHeroOverlay: fetch error", err);
      }
    })();
  }, []);
  /* [HELP:NEWS:DATA:FETCH] END */

  /* [HELP:NEWS:TIMER] START */
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIdx((prev) => {
        const next = prev + 1;
        return next >= items.length ? 0 : next;
      });
    }, 8000);
    return () => clearInterval(id);
  }, [items.length]);
  /* [HELP:NEWS:TIMER] END */

  if (!items.length) return null;

  const current = items[Math.min(idx, items.length - 1)];
  const href = pickUrl(current);

  const dateLabel =
    current.date && current.date.trim()
      ? new Date(current.date).toLocaleDateString("da-DK")
      : "";

  const handleOpenModal = () => {
    setModalItem(current);
  };

  const modalHref = modalItem ? pickUrl(modalItem) : "#";
  const modalHasLink = modalHref && modalHref !== "#";
  const modalDateLabel =
    modalItem?.date && modalItem.date.trim()
      ? new Date(modalItem.date).toLocaleDateString("da-DK")
      : "";
  const modalBody =
    (modalItem?.body && modalItem.body.trim()) ||
    (modalItem?.teaser && modalItem.teaser.trim()) ||
    "";

  /* [HELP:NEWS:RENDER] START */
  return (
    <>
      {/* Selve kortet – nu som div role="button" (ikke <button>) */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenModal}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpenModal();
          }
        }}
        className="card group h-full flex flex-col text-left cursor-pointer"
      >
        <div className="kicker mb-1">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          NYHEDER
        </div>

        <div className="flex flex-1 flex-col gap-4 md:flex-row">
          {/* Tekstside */}
          <div className="flex flex-1 flex-col justify-between gap-2">
            <div className="space-y-1">
              {dateLabel && (
                <div className="text-[11px] text-neutral-500">{dateLabel}</div>
              )}
              <h2 className="text-base font-semibold text-neutral-900">
                {current.title}
              </h2>
              {current.teaser && (
                <p className="text-sm text-neutral-700">{current.teaser}</p>
              )}
            </div>

            <div className="text-xs text-orange-700 font-medium">
              Klik for at læse historien →
            </div>
          </div>

          {/* Billedside */}
          <div className="relative w-full md:w-40 lg:w-48 shrink-0">
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
              {current.image ? (
                <img
                  src={current.image}
                  alt={current.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-32 items-center justify-center text-[11px] text-neutral-400">
                  Intet billede valgt
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Små dots nederst højre, hvis flere nyheder */}
        {items.length > 1 && (
          <div className="mt-3 flex items-center justify-end gap-1 text-[9px] text-neutral-400">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                }}
                className={`h-2 w-2 rounded-full transition ${
                  i === idx
                    ? "bg-orange-600"
                    : "bg-slate-200 hover:bg-orange-500"
                }`}
                aria-label={`Vis nyhed ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Popup med body-tekst */}
      {modalItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3">
              <div>
                {modalDateLabel && (
                  <div className="text-[11px] text-neutral-500">
                    {modalDateLabel}
                  </div>
                )}
                <h3 className="text-base font-semibold text-neutral-900">
                  {modalItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="text-xs text-neutral-500 hover:text-neutral-800"
              >
                Luk
              </button>
            </div>

            <div className="px-4 py-3 text-sm text-neutral-800 whitespace-pre-line">
              {modalBody || "Ingen yderligere tekst."}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3">
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
              >
                Luk
              </button>

              {modalHasLink && (
                <a
                  href={modalHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                >
                  {modalItem.label?.trim() || "Åbn link"}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
  /* [HELP:NEWS:RENDER] END */
}
/* [HELP:NEWS:COMPONENT] END */
