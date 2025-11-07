// app/admin/HeroEditor.tsx
"use client";

import { useEffect, useState } from "react";
import { HUMLUM_API, HUMLUM_TOKEN } from "../config";

type Row = Record<string, any>;

function pick(rows: Row[], section: string, key: string) {
  // accepter både "status" og "status, valideret"
  const r = rows.find(
    (x) =>
      x.section === section &&
      x.key === key &&
      ((x["status, valideret"] ?? x.status ?? "ACTIVE") === "ACTIVE")
  );
  return r?.value ?? "";
}

export default function HeroEditor() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // hent startværdier fra FORSIDE
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${HUMLUM_API}?sheet=FORSIDE`, { cache: "no-store" });
        const rows: Row[] = await res.json();
        setTitle(pick(rows, "hero", "title"));
        setSubtitle(pick(rows, "hero", "subtitle"));
      } catch (e) {
        setMsg("Kunne ikke hente startværdier.");
        console.error(e);
      }
    })();
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const body = {
        token: HUMLUM_TOKEN,
        sheet: "FORSIDE",
        updates: [
          { section: "hero", key: "title", value: title },
          { section: "hero", key: "subtitle", value: subtitle },
        ],
      };

      const res = await fetch(HUMLUM_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setMsg("Gemt i Google Sheet ✅");
    } catch (e: any) {
      setMsg("Fejl ved gem: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  const label = { fontSize: 12, opacity: 0.8, marginBottom: 6 } as const;
  const input = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #2a2a2a",
    background: "#111",
    color: "white",
    outline: "none",
  } as const;
  const btn = {
    padding: "10px 14px",
    borderRadius: 10,
    background: busy ? "#333" : "#1f1f1f",
    border: "1px solid #2a2a2a",
    color: "white",
    cursor: busy ? "not-allowed" : "pointer",
  } as const;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        border: "1px solid #2a2a2a",
        borderRadius: 12,
        background: "#0f0f0f",
        color: "white",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Redigér Hero</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <div>
          <div style={label}>Titel</div>
          <input
            style={input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Humlum Dartklub"
          />
        </div>

        <div>
          <div style={label}>Undertitel</div>
          <input
            style={input}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Fællesskab & Præcision"
          />
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={save} disabled={busy} style={btn}>
          {busy ? "Gemmer..." : "Gem til Google Sheet"}
        </button>
        {msg && <div style={{ fontSize: 12, opacity: 0.8 }}>{msg}</div>}
      </div>
    </div>
  );
}
