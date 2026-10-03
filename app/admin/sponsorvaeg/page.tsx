"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_SPONSOR_WALL_CTA,
  inferCategory,
  inferLane,
  normalizeSponsorRow,
  normalizeSponsorWallCta,
  type SponsorWallCta,
  type WallCategory,
} from "@/lib/sponsorWall";

type Row = any;

const categoryLabel: Record<WallCategory, string> = {
  gold: "Guld",
  lane: "Banesponsor",
  support: "Støtte",
  hidden: "Skjult",
};

function yes(v: unknown) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "yes" || s === "ja" || s === "true" || s === "1";
}

export default function AdminSponsorWallPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [savedRows, setSavedRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [cta, setCta] = useState<SponsorWallCta>(DEFAULT_SPONSOR_WALL_CTA);
  const [ctaRow, setCtaRow] = useState(2);
  const [savingCta, setSavingCta] = useState(false);

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const [res, textRes] = await Promise.all([
        fetch("/api/sheet?tab=SPONSORER&limit=500", { cache: "no-store" }),
        fetch("/api/sheet?tab=SPONSORVAEG_TEKST&limit=10", { cache: "no-store" }),
      ]);
      const data = await res.json();
      const textData = await textRes.json().catch(() => ({ ok: false, items: [] }));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Kunne ikke hente SPONSORER");
      const sponsorItems = Array.isArray(data?.items) ? data.items : [];
      setRows(sponsorItems);
      setSavedRows(sponsorItems);
      const first = data?.items?.[0] || {};
      const textFirst = Array.isArray(textData?.items) ? textData.items[0] : null;
      setCta(normalizeSponsorWallCta(textFirst));
      setCtaRow(Number(textFirst?._row || 2));
      setSetupDone(Object.prototype.hasOwnProperty.call(first, "wall_category") && Object.prototype.hasOwnProperty.call(first, "wall_kind") && !!textFirst);
    } catch (e: any) {
      setMessage(e?.message || "Fejl ved hentning");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function ensureSetup() {
    setMessage("Opretter sponsorvæg-felter…");
    const res = await fetch("/api/sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tab: "SPONSORER", action: "sponsorWallSetup" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      setMessage(data?.error || "Opsætning fejlede. Husk at opdatere Code.gs først.");
      return;
    }
    setMessage("Sponsorvæg-felter er klar.");
    await load();
  }

  function patchLocal(rowNo: number, patch: Record<string, any>) {
    setRows((prev) => prev.map((r) => Number(r._row) === rowNo ? { ...r, ...patch } : r));
  }

  async function saveCta() {
    setSavingCta(true);
    setMessage("");
    try {
      const payload = {
        tab: "SPONSORVAEG_TEKST",
        action: "sponsorWallUpdateCta",
        row: ctaRow || 2,
        cta_visible: cta.visible ? "YES" : "NO",
        cta_title: cta.title.trim(),
        cta_text: cta.text.trim(),
        cta_button: cta.buttonText.trim(),
        cta_button_visible: cta.buttonVisible ? "YES" : "NO",
        cta_link: cta.link.trim() || "/sponsor",
        cta_tv_visible: cta.tvVisible ? "YES" : "NO",
        cta_tv_size: cta.tvTextSize,
      };
      const res = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Kunne ikke gemme støttefeltet");
      setMessage("Støttefeltet er gemt.");
    } catch (e: any) {
      setMessage(e?.message || "Gemning af støttefelt fejlede");
    } finally {
      setSavingCta(false);
    }
  }

  function rowPayload(row: Row) {
    const category = String(row.wall_category || inferCategory(row));
    return {
      tab: "SPONSORER",
      action: "sponsorWallUpdateRow",
      row: Number(row._row),
      wall_title: String(row.wall_title ?? "").trim(),
      wall_subtitle: String(row.wall_subtitle ?? "").trim(),
      wall_extra: String(row.wall_extra ?? "").trim(),
      wall_show_extra: String(row.wall_show_extra ?? "YES"),
      wall_kind: String(row.wall_kind ?? "sponsor"),
      wall_category: category,
      wall_lane: category === "lane" ? String(row.wall_lane ?? inferLane(row) ?? "") : "",
      wall_visible: String(row.wall_visible || (String(row.visible ?? "").trim() ? row.visible : "YES")),
      wall_order: String(row.wall_order ?? row.order ?? 9999),
      featured: String(row.featured ?? "no"),
    };
  }

  function rowSignature(row: Row) {
    const p = rowPayload(row);
    return JSON.stringify({
      wall_title: p.wall_title,
      wall_subtitle: p.wall_subtitle,
      wall_extra: p.wall_extra,
      wall_show_extra: p.wall_show_extra,
      wall_kind: p.wall_kind,
      wall_category: p.wall_category,
      wall_lane: p.wall_lane,
      wall_visible: p.wall_visible,
      wall_order: p.wall_order,
      featured: p.featured,
    });
  }

  const dirtyRowNumbers = useMemo(() => {
    const savedMap = new Map(savedRows.map((r) => [Number(r._row), rowSignature(r)]));
    return rows
      .filter((r) => savedMap.get(Number(r._row)) !== rowSignature(r))
      .map((r) => Number(r._row));
  }, [rows, savedRows]);

  async function saveOneRow(row: Row) {
    const payload = rowPayload(row);
    const res = await fetch("/api/sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) throw new Error(data?.error || "Kunne ikke gemme");

    if (String(payload.wall_category) === "lane") {
      const expected = String(payload.wall_lane ?? "").trim();
      const saved = String(data?.verified_wall_lane ?? data?.item?.wall_lane ?? "").trim();
      if (expected && saved !== expected) {
        throw new Error(`Banenummer blev ikke gemt korrekt (forventet ${expected}, fik ${saved || "tom"}). Husk at deploye den nye Code.gs-version.`);
      }
    }

    return data?.item ? { ...payload, ...data.item } : payload;
  }

  async function addTextCard() {
    setMessage("Opretter tekstkort…");
    try {
      const nextOrder = Math.max(0, ...rows.map((r) => Number(r.wall_order ?? r.order ?? 0) || 0)) + 1;
      const res = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "SPONSORER",
          action: "adminCreateRow",
          name: "Tekstkort",
          wall_kind: "text",
          wall_title: "NYT TEKSTKORT",
          wall_subtitle: "Skriv din egen undertekst",
          wall_extra: "Ekstra linje kan også bruges",
          wall_show_extra: "YES",
          wall_category: "support",
          wall_lane: "",
          wall_visible: "YES",
          wall_order: String(nextOrder),
          visible: "YES",
          order: String(nextOrder),
          note: "[SPONSORVAEG_TEXTCARD]",
          source: "admin",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Kunne ikke oprette tekstkort");
      await load();
      setMessage("Tekstkort oprettet ✓ Redigér teksten i listen og tryk Gem.");
    } catch (e: any) {
      setMessage(e?.message || "Kunne ikke oprette tekstkort");
    }
  }

  async function repairLaneNumbers() {
    setMessage("Retter banenumre ud fra de eksisterende sponsordata…");
    try {
      const res = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab: "SPONSORER", action: "sponsorWallRepairLanes" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Kunne ikke rette banenumre");
      await load();
      setMessage(`${Number(data?.updated || 0)} banesponsorer er rettet ud fra sponsordata ✓`);
    } catch (e: any) {
      setMessage(e?.message || "Rettelse af banenumre fejlede");
    }
  }

  async function saveAllRows() {
    const dirtySet = new Set(dirtyRowNumbers);
    const changedRows = rows.filter((r) => dirtySet.has(Number(r._row)));
    if (!changedRows.length) {
      setMessage("Der er ingen ændringer at gemme.");
      return;
    }

    setSavingAll(true);
    setMessage(`Gemmer ${changedRows.length} ændring${changedRows.length === 1 ? "" : "er"}…`);

    let okCount = 0;
    const failed: string[] = [];
    const savedNumbers = new Set<number>();

    for (const row of changedRows) {
      try {
        await saveOneRow(row);
        okCount += 1;
        savedNumbers.add(Number(row._row));
      } catch (e: any) {
        failed.push(`${normalizeSponsorRow(row).displayName}: ${e?.message || "fejl"}`);
      }
    }

    if (savedNumbers.size) {
      setSavedRows((prev) => {
        const currentMap = new Map(rows.map((r) => [Number(r._row), r]));
        return prev.map((r) => savedNumbers.has(Number(r._row)) ? { ...currentMap.get(Number(r._row)) } : r);
      });
    }

    if (failed.length) {
      setMessage(`${okCount} gemt. ${failed.length} kunne ikke gemmes: ${failed.join(" · ")}`);
    } else {
      setMessage(`${okCount} ændring${okCount === 1 ? "" : "er"} gemt ✓`);
    }
    setSavingAll(false);
  }

  async function saveRow(row: Row) {
    const rowNo = Number(row._row);
    setSaving(rowNo);
    setMessage("");
    try {
      const payload = await saveOneRow(row);
      setSavedRows((prev) => prev.map((r) => Number(r._row) === rowNo ? { ...row } : r));
      setMessage(`Gemt: ${normalizeSponsorRow({ ...row, ...payload }).displayName}`);
    } catch (e: any) {
      setMessage(e?.message || "Gemning fejlede");
    } finally {
      setSaving(null);
    }
  }

  const sorted = useMemo(() => [...rows].sort((a, b) => Number(a.wall_order ?? a.order ?? 9999) - Number(b.wall_order ?? b.order ?? 9999)), [rows]);

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sponsorvæg</h1>
          <p className="mt-1 text-sm text-slate-600">Styr hvad der vises på hjemmesiden og TV-skærmen.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={addTextCard} className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-bold text-white hover:bg-orange-600">+ Tilføj tekstkort</button>
          <button onClick={repairLaneNumbers} className="rounded-xl border border-orange-300 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-800 hover:bg-orange-100">Ret banenumre 1–13</button>
          <Link href="/sponsorvaeg" target="_blank" className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">Se sponsorvæg</Link>
          <Link href="/sponsorvaeg/tv" target="_blank" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Åbn TV</Link>
        </div>
      </div>

      {!setupDone && !loading && (
        <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <div className="font-semibold text-amber-950">Én gangs opsætning</div>
          <p className="mt-1 text-sm text-amber-900">SPONSORER-fanen mangler felterne til den nye sponsorvæg. Klik én gang efter Code.gs er opdateret.</p>
          <button onClick={ensureSetup} className="mt-3 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600">Klargør sponsorvæg</button>
        </div>
      )}

      {message && <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm">{message}</div>}

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Støttefelt / ledig sponsorplads</h2>
            <p className="mt-1 text-sm text-slate-600">Redigér feltet der inviterer nye støtter til at få deres navn eller logo på væggen.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 font-semibold text-slate-700">
              <input type="checkbox" checked={cta.visible} onChange={(e) => setCta((v) => ({ ...v, visible: e.target.checked }))} className="h-4 w-4" />
              Synlig
            </label>
            <label className="flex items-center gap-2 font-semibold text-slate-700">
              <input type="checkbox" checked={cta.tvVisible} onChange={(e) => setCta((v) => ({ ...v, tvVisible: e.target.checked }))} className="h-4 w-4" />
              Vis på TV
            </label>
            <label className="flex items-center gap-2 font-semibold text-slate-700">
              <input type="checkbox" checked={cta.buttonVisible} onChange={(e) => setCta((v) => ({ ...v, buttonVisible: e.target.checked }))} className="h-4 w-4" />
              Vis knap på hjemmeside
            </label>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Overskrift
            <input value={cta.title} onChange={(e) => setCta((v) => ({ ...v, title: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">Knaptekst
            <input value={cta.buttonText} onChange={(e) => setCta((v) => ({ ...v, buttonText: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">TV-tekststørrelse
            <select value={cta.tvTextSize} onChange={(e) => setCta((v) => ({ ...v, tvTextSize: e.target.value as SponsorWallCta["tvTextSize"] }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal">
              <option value="normal">Normal</option>
              <option value="large">Stor</option>
              <option value="xlarge">Ekstra stor</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 lg:col-span-2">Tekst
            <textarea rows={2} value={cta.text} onChange={(e) => setCta((v) => ({ ...v, text: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700 lg:col-span-2">Link
            <input value={cta.link} onChange={(e) => setCta((v) => ({ ...v, link: e.target.value }))} placeholder="/sponsor" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button disabled={savingCta || loading} onClick={saveCta} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">
            {savingCta ? "Gemmer…" : "Gem støttefelt"}
          </button>
          <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 py-2 text-sm text-orange-950">
            <strong>{cta.title || "Vil du også støtte?"}</strong> <span className="text-orange-800">— {cta.text || "Dit navn kan stå her."}</span>
          </div>
        </div>
      </section>

      <div className="sticky top-2 z-20 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <div>
          <div className="font-bold text-slate-900">Sponsorændringer</div>
          <div className="text-sm text-slate-600">
            {dirtyRowNumbers.length
              ? `${dirtyRowNumbers.length} række${dirtyRowNumbers.length === 1 ? "" : "r"} er ændret og ikke gemt endnu.`
              : "Alt er gemt."}
          </div>
        </div>
        <button
          type="button"
          disabled={savingAll || loading || dirtyRowNumbers.length === 0}
          onClick={saveAllRows}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {savingAll ? "Gemmer alle…" : dirtyRowNumbers.length ? `Gem alle ændringer (${dirtyRowNumbers.length})` : "Alt er gemt ✓"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1540px] w-full text-left text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-3 py-3">Sponsor</th>
              <th className="px-3 py-3">Titel på væg</th>
              <th className="px-3 py-3">Undertekst</th>
              <th className="px-3 py-3">Ekstra linje</th>
              <th className="px-3 py-3">Vis info</th>
              <th className="px-3 py-3">Kategori</th>
              <th className="px-3 py-3">Bane</th>
              <th className="px-3 py-3">Synlig</th>
              <th className="px-3 py-3">Rækkefølge</th>
              <th className="px-3 py-3">Logo</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-500">Henter sponsorer…</td></tr>
            ) : sorted.map((row) => {
              const n = normalizeSponsorRow(row);
              const category = (row.wall_category || inferCategory(row)) as WallCategory;
              const visible = String(row.wall_visible ?? "").trim() ? yes(row.wall_visible) : (String(row.visible ?? "").trim() ? yes(row.visible) : true);
              const showExtra = String(row.wall_show_extra ?? "").trim() ? yes(row.wall_show_extra) : true;
              return (
                <tr key={row._row} className={`${!visible ? "bg-slate-50 opacity-60" : ""} ${dirtyRowNumbers.includes(Number(row._row)) ? "ring-1 ring-inset ring-blue-300" : ""}`}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <span>{n.displayName}</span>
                      {String(row.wall_kind ?? "").toLowerCase() === "text" && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase text-orange-700">Tekstkort</span>}
                    </div>
                    <div className="mt-0.5 max-w-[240px] truncate text-xs text-slate-500">Række {row._row}</div>
                  </td>
                  <td className="px-3 py-3"><input value={row.wall_title ?? ""} onChange={(e) => patchLocal(row._row, { wall_title: e.target.value })} placeholder={n.displayName} className="w-48 rounded-lg border px-2 py-1.5" /></td>
                  <td className="px-3 py-3"><input value={row.wall_subtitle ?? ""} onChange={(e) => patchLocal(row._row, { wall_subtitle: e.target.value })} placeholder="fx Struer" className="w-40 rounded-lg border px-2 py-1.5" /></td>
                  <td className="px-3 py-3"><input value={row.wall_extra ?? ""} onChange={(e) => patchLocal(row._row, { wall_extra: e.target.value })} placeholder="fx Tlf. 97 85 19 00" className="w-48 rounded-lg border px-2 py-1.5" /></td>
                  <td className="px-3 py-3">
                    <button onClick={() => patchLocal(row._row, { wall_show_extra: showExtra ? "NO" : "YES" })} className={`relative h-7 w-12 rounded-full transition ${showExtra ? "bg-orange-500" : "bg-slate-300"}`} aria-label="Vis/skjul sponsorinfo"><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${showExtra ? "left-6" : "left-1"}`} /></button>
                  </td>
                  <td className="px-3 py-3">
                    <select value={category} onChange={(e) => patchLocal(row._row, { wall_category: e.target.value })} className="rounded-lg border px-2 py-1.5">
                      {Object.entries(categoryLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3"><input type="number" min={1} max={99} disabled={category !== "lane"} value={row.wall_lane ?? inferLane(row) ?? ""} onChange={(e) => patchLocal(row._row, { wall_lane: e.target.value })} className="w-20 rounded-lg border px-2 py-1.5 disabled:bg-slate-100" /></td>
                  <td className="px-3 py-3">
                    <button onClick={() => patchLocal(row._row, { wall_visible: visible ? "NO" : "YES" })} className={`relative h-7 w-12 rounded-full transition ${visible ? "bg-blue-600" : "bg-slate-300"}`} aria-label="Skift synlighed"><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${visible ? "left-6" : "left-1"}`} /></button>
                  </td>
                  <td className="px-3 py-3"><input type="number" value={row.wall_order ?? row.order ?? 9999} onChange={(e) => patchLocal(row._row, { wall_order: e.target.value })} className="w-24 rounded-lg border px-2 py-1.5" /></td>
                  <td className="px-3 py-3">{n.logoUrl ? <img src={n.logoUrl} alt="" className="h-10 w-24 object-contain" /> : <span className="text-xs text-slate-400">Ingen</span>}</td>
                  <td className="px-3 py-3"><button disabled={saving === row._row || loading} onClick={() => saveRow(row)} className="rounded-lg bg-orange-500 px-3 py-1.5 font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">{saving === row._row ? "Gemmer…" : "Gem"}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <strong>Tip:</strong> Du kan nu selv skrive <em>Titel</em>, <em>Undertekst</em> og <em>Ekstra linje</em> pr. sponsor. Brug <strong>+ Tilføj tekstkort</strong> hvis du vil have et kort uden logo med helt egen tekst. Tekstkort lægges automatisk under <em>Støtter</em>.
      </div>
    </main>
  );
}
