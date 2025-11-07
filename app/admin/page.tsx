"use client";

import { useEffect, useState } from "react";
import { fetchSheet } from "../../lib/fetchSheet";
import { upsertRow, deleteRow } from "../../lib/sheetsWrite";

type Tab = "nyheder" | "medlem" | string;
type Row = Record<string, any>;

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("nyheder");

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold">Admin</h1>

      <div className="mt-4 flex gap-2 flex-wrap">
        <button className={btn(tab === "nyheder")} onClick={() => setTab("nyheder")}>
          Nyheder
        </button>
        <button className={btn(tab === "medlem")} onClick={() => setTab("medlem")}>
          Medlemspakker
        </button>
      </div>

      {tab === "nyheder" && <NyhederTab />}
      {tab === "medlem" && <MedlemTab />}

      <p className="mt-6 text-xs text-white/50">Humlum Dartklub admin</p>
    </main>
  );
}

const btn = (active: boolean) =>
  `rounded-xl px-3 py-2 text-sm border ${
    active ? "bg-white/10 border-white/30" : "bg-white/5 border-white/10 hover:bg-white/10"
  }`;

/* ---------- UI helpers (LYSE FELTER) ---------- */
const card =
  "max-w-3xl mx-auto bg-neutral-900/40 p-6 rounded-xl border border-neutral-700";
const label =
  "text-sm font-semibold text-neutral-200 mb-1 block";
const inp =
  "w-full rounded-md bg-white text-black placeholder-neutral-500 border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500";
const selectInp =
  "w-full rounded-md bg-white text-black border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500";
const savebtn =
  "rounded-md bg-lime-500 hover:bg-lime-400 transition px-4 py-2 text-black font-bold";

/* =======================
   NYHEDER TAB
   Sheet: NYHEDER
   Kolonner: id | date | title | body_md | image | status | pin | visible | order
   ======================= */

function NyhederTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Row>({
    status: "ACTIVE",
    visible: "YES",
    pin: "NO",
    order: 1,
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    (async () => setRows(await fetchSheet("NYHEDER")))();
  }, []);

  async function save() {
    if (!draft.title || !draft.date) {
      alert("Udfyld mindst Dato og Titel");
      return;
    }
    await upsertRow("NYHEDER", draft);
    setRows(await fetchSheet("NYHEDER"));
    setDraft({
      status: "ACTIVE",
      visible: "YES",
      pin: "NO",
      order: 1,
      date: new Date().toISOString().slice(0, 10),
    });
  }

  async function remove(id?: string) {
    if (!id) return;
    if (!confirm("Slet denne nyhed?")) return;
    await deleteRow("NYHEDER", id);
    setRows(await fetchSheet("NYHEDER"));
  }

  return (
    <section className="mt-6">
      <div className={card}>
        <h3 className="font-semibold text-lg mb-4">Tilføj / Rediger nyhed</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>id (valgfri for opdatering)</label>
            <input className={inp} placeholder="fx 12" value={draft.id || ""} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
          </div>
          <div>
            <label className={label}>Dato (YYYY-MM-DD)</label>
            <input className={inp} placeholder="2025-11-04" value={draft.date || ""} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </div>
          <div>
            <label className={label}>Titel</label>
            <input className={inp} placeholder="Overskrift" value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Pin</label>
              <select className={selectInp} value={draft.pin || "NO"} onChange={(e) => setDraft({ ...draft, pin: e.target.value })}>
                <option>NO</option>
                <option>YES</option>
              </select>
            </div>
            <div>
              <label className={label}>Visible</label>
              <select className={selectInp} value={draft.visible || "YES"} onChange={(e) => setDraft({ ...draft, visible: e.target.value })}>
                <option>YES</option>
                <option>NO</option>
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Order (tal)</label>
            <input className={inp} type="number" placeholder="1" value={Number(draft.order ?? 1)} onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })} />
          </div>
          <div>
            <label className={label}>Status</label>
            <input className={inp} placeholder="ACTIVE" value={draft.status || ""} onChange={(e) => setDraft({ ...draft, status: e.target.value })} />
          </div>
        </div>

        <div className="mt-4">
          <label className={label}>Brødtekst</label>
          <textarea className={inp} rows={5} placeholder="Skriv nyheden her…" value={draft.body_md || ""} onChange={(e) => setDraft({ ...draft, body_md: e.target.value })} />
        </div>

        <div className="mt-4">
          <label className={label}>Billede-URL (valgfri)</label>
          <input className={inp} placeholder="https://..." value={draft.image || ""} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
        </div>

        <div className="mt-6">
          <button className={savebtn} onClick={save}>Gem / Tilføj</button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5">
              <th className="text-left p-2">id</th>
              <th className="text-left p-2">dato</th>
              <th className="text-left p-2">titel</th>
              <th className="text-left p-2">pin</th>
              <th className="text-left p-2">visible</th>
              <th className="text-left p-2">order</th>
              <th className="text-right p-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-white/10">
                <td className="p-2">{String(r.id || "")}</td>
                <td className="p-2">{String(r.date || "")}</td>
                <td className="p-2">{String(r.title || "")}</td>
                <td className="p-2">{String(r.pin || "")}</td>
                <td className="p-2">{String(r.visible || "")}</td>
                <td className="p-2">{String(r.order || "")}</td>
                <td className="p-2 text-right">
                  {r.id && <button className="text-red-400" onClick={() => remove(String(r.id))}>Slet</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* =======================
   MEDLEM TAB
   Sheet: MEDLEMSPAKKER
   Kolonner: id | order | pakke | alder_gruppe | beskrivelse | pris_pr_mdr | features | link | visible
   ======================= */

function MedlemTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Row>({ visible: "YES" });

  useEffect(() => {
    (async () => setRows(await fetchSheet("MEDLEMSPAKKER")))();
  }, []);

  async function save() {
    await upsertRow("MEDLEMSPAKKER", draft);
    setRows(await fetchSheet("MEDLEMSPAKKER"));
    setDraft({ visible: "YES" });
  }

  async function remove(id?: string) {
    if (!id) return;
    if (!confirm("Slet pakken?")) return;
    await deleteRow("MEDLEMSPAKKER", id);
    setRows(await fetchSheet("MEDLEMSPAKKER"));
  }

  return (
    <section className="mt-6">
      <div className={card}>
        <h3 className="font-semibold text-lg mb-4">Tilføj / Rediger medlems-pakke</h3>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>id (valgfri)</label>
            <input className={inp} placeholder="fx 7" value={draft.id || ""} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
          </div>
          <div>
            <label className={label}>order</label>
            <input className={inp} placeholder="1" value={draft.order || ""} onChange={(e) => setDraft({ ...draft, order: e.target.value })} />
          </div>
          <div>
            <label className={label}>pakke</label>
            <input className={inp} placeholder="Junior / Senior / Familie…" value={draft.pakke || ""} onChange={(e) => setDraft({ ...draft, pakke: e.target.value })} />
          </div>
          <div>
            <label className={label}>alder gruppe (fx U18, 18-25)</label>
            <input className={inp} placeholder="U18 / 18-25 / 60+ …" value={draft.alder_gruppe || ""} onChange={(e) => setDraft({ ...draft, alder_gruppe: e.target.value })} />
          </div>
          <div>
            <label className={label}>pris pr mdr</label>
            <input className={inp} placeholder="99" value={draft.pris_pr_mdr || ""} onChange={(e) => setDraft({ ...draft, pris_pr_mdr: e.target.value })} />
          </div>
          <div>
            <label className={label}>link</label>
            <input className={inp} placeholder="/bliv-medlem?pakke=senior" value={draft.link || ""} onChange={(e) => setDraft({ ...draft, link: e.target.value })} />
          </div>
          <div>
            <label className={label}>visible</label>
            <select className={selectInp} value={draft.visible || "YES"} onChange={(e) => setDraft({ ...draft, visible: e.target.value })}>
              <option>YES</option>
              <option>NO</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className={label}>beskrivelse</label>
          <textarea className={inp} rows={3} placeholder="Kort salgstekst" value={draft.beskrivelse || ""} onChange={(e) => setDraft({ ...draft, beskrivelse: e.target.value })} />
        </div>

        <div className="mt-4">
          <label className={label}>features (komma-separeret)</label>
          <textarea className={inp} rows={2} placeholder="Træning, rangliste, events…" value={draft.features || ""} onChange={(e) => setDraft({ ...draft, features: e.target.value })} />
        </div>

        <div className="mt-6">
          <button className={savebtn} onClick={save}>Gem / Tilføj</button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5">
              <th className="text-left p-2">pakke</th>
              <th className="text-left p-2">pris</th>
              <th className="text-left p-2">order</th>
              <th className="text-right p-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-white/10">
                <td className="p-2">{String(r.pakke || "")}</td>
                <td className="p-2">{String(r.pris_pr_mdr || "")}</td>
                <td className="p-2">{String(r.order || "")}</td>
                <td className="p-2 text-right">
                  {r.id && (
                    <button className="text-red-400" onClick={() => remove(String(r.id))}>
                      Slet
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
