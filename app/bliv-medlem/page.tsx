"use client";

import Link from "next/link";
import { useEffect } from "react";

type Pakke = {
  pakke: string;
  pris_pr_mdr: string; // kun tal som tekst, f.eks. "39"
  features: string[];
  badge?: string;
};

const pakker: Pakke[] = [
  {
    pakke: "Passiv",
    pris_pr_mdr: "39",
    features: ["Nyhedsbrev", "Støt klubben", "Invitation til events"],
    badge: "Billigst",
  },
  {
    pakke: "Basis",
    pris_pr_mdr: "99",
    features: ["Fri træning", "Klubaftener", "Medlemsfordele"],
    badge: "Mest valgt",
  },
  {
    pakke: "Familie",
    pris_pr_mdr: "199",
    features: ["2 voksne + børn", "Fælles træning", "Rabatter til events"],
  },
];

export default function BlivMedlemPage() {
  // Gem pakke-info i localStorage så tilmeldingssiden kan læse den (valgfrit)
  useEffect(() => {
    try {
      localStorage.setItem("HDK_PAKKER", JSON.stringify(pakker));
    } catch {}
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="mb-8 rounded-2xl border border-lime-300 bg-white p-6">
        <div className="text-sm text-emerald-700 mb-2">
          <span className="inline-block h-2 w-2 rounded-full bg-lime-500 mr-2" />
          Medlemskab
        </div>
        <h1 className="text-3xl font-bold">Bliv medlem</h1>
        <p className="mt-2 text-slate-700">
          Vælg den pakke der passer dig. Du kan altid opgradere senere.
        </p>
      </div>

      {/* Pakker – ingen “Damepairs” eller hold-chips her */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pakker.map((p) => (
          <div
            key={p.pakke}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold">{p.pakke}</h2>
              {p.badge && (
                <span className="text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 border border-emerald-200">
                  {p.badge}
                </span>
              )}
            </div>
            <div className="mt-2 text-3xl font-bold">
              {p.pris_pr_mdr} <span className="text-base font-normal">kr/md</span>
            </div>
            <ul className="mt-4 space-y-2 text-slate-700">
              {p.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link
                href={`/bliv-medlem/tilmelding?pakke=${encodeURIComponent(p.pakke)}`}
                className="inline-block rounded-xl bg-black px-5 py-2 text-white hover:opacity-90"
              >
                Vælg {p.pakke}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
