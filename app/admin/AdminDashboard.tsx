// app/admin/AdminDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { HUMLUM_API } from "../config";

type Row = Record<string, any>;

export default function AdminDashboard() {
  const [eventsCount, setEventsCount] = useState<string>("…");

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${HUMLUM_API}?sheet=EVENTS`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows: Row[] = await res.json();
        const active = rows.filter(r => String(r.status || "").toUpperCase() === "ACTIVE").length;
        setEventsCount(String(active));
      } catch (e) {
        console.error(e);
        setEventsCount("0");
      }
    };
    run();
  }, []);

  const Box = (label: string, value: string, note?: string) => (
    <div
      style={{
        padding: "16px",
        border: "1px solid #2a2a2a",
        borderRadius: 12,
        background: "#0f0f0f",
        color: "white",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
      {note ? <div style={{ fontSize: 12, opacity: 0.65 }}>{note}</div> : null}
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px,1fr))", gap: 16 }}>
      {Box("Aktive medlemmer", "0", "kobles på senere")}
      {Box("Ungdomsandel", "0%", "kobles på senere")}
      {Box("Aktive sponsorer", "0", "kobles på senere")}
      {Box("Kommende events", eventsCount, 'tæller status = "ACTIVE"')}
    </div>
  );
}
