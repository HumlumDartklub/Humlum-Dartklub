// app/admin/indmeldinger/page.tsx

/* [HELP:ADMIN:INDMELDINGER:PRERENDER] START
   Gør siden dynamisk, så Next ikke forsøger at prerendere den under build. */
export const dynamic = "force-dynamic";
export const revalidate = 0;
/* [HELP:ADMIN:INDMELDINGER:PRERENDER] END */

type Row = {
  row_id: number;
  navn?: string;
  email?: string;
  telefon?: string | number;
  pakke?: string;
  pris?: string | number;
  status?: string;
  payment_method?: string;
  payment_date?: string;
};

/* [HELP:ADMIN:INDMELDINGER:FETCH] START
   Henter rækker fra GAS Web App. Tåler manglende env og netværksfejl. */
async function getRows(): Promise<Row[]> {
  const API =
    process.env.SHEET_API_URL || process.env.NEXT_PUBLIC_SHEET_API || "";
  const KEY = process.env.ADMIN_TOKEN || "";

  if (!API || !KEY) {
    // Mangler env -> returnér tom liste (ingen crash ved build)
    return [];
  }

  let urlStr = "";
  try {
    const url = new URL(API);
    url.searchParams.set("tab", "INDMELDINGER");
    url.searchParams.set("key", KEY);
    urlStr = url.toString();
  } catch {
    return [];
  }

  try {
    const res = await fetch(urlStr, { cache: "no-store", next: { revalidate: 0 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: Row[] };
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
}
/* [HELP:ADMIN:INDMELDINGER:FETCH] END */

export default async function Page({
  searchParams,
}: {
  searchParams: { all?: string };
}) {
  /* [HELP:ADMIN:INDMELDINGER:DATA] START */
  const allRows = await getRows();
  const showAll = searchParams?.all === "1";
  const rows = showAll
    ? allRows
    : allRows.filter((r) => String(r.status).toLowerCase() !== "paid");
  /* [HELP:ADMIN:INDMELDINGER:DATA] END */

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Indmeldinger</h1>
        <div className="flex items-center gap-2">
          <a
            href="/admin/indmeldinger"
            className="rounded-md px-3 py-1 border bg-white hover:bg-gray-50"
            title="Vis kun ikke-godkendte"
          >
            Kun pending
          </a>
          <a
            href="/admin/indmeldinger?all=1"
            className="rounded-md px-3 py-1 border bg-white hover:bg-gray-50"
            title="Vis alle rækker"
          >
            Vis alle
          </a>
          <a
            href="/admin/indmeldinger"
            className="rounded-md px-3 py-1 border bg-white hover:bg-gray-50"
            title="Genindlæs"
          >
            Opdater
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-[1100px] w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3">Row</th>
              <th className="p-3">Navn</th>
              <th className="p-3">Email</th>
              <th className="p-3">Tlf</th>
              <th className="p-3">Pakke</th>
              <th className="p-3">Pris</th>
              <th className="p-3">Status</th>
              <th className="p-3">Betalingsmetode</th>
              <th className="p-3">Dato</th>
              <th className="p-3">Handling</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={10}>
                  Ingen rækker (tjek Web App / env-variabler).
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.row_id} className="border-t">
                <td className="p-3">{r.row_id}</td>
                <td className="p-3">{r.navn || "-"}</td>
                <td className="p-3">{r.email || "-"}</td>
                <td className="p-3">{String(r.telefon || "-")}</td>
                <td className="p-3">{r.pakke || "-"}</td>
                <td className="p-3">{String(r.pris ?? "-")}</td>
                <td className="p-3">{r.status || "-"}</td>
                <td className="p-3">{r.payment_method || "-"}</td>
                <td className="p-3">{r.payment_date || "-"}</td>
                <td className="p-3">
                  {String(r.status).toLowerCase() === "paid" ? (
                    <span className="inline-block rounded-md bg-green-100 text-green-700 px-2 py-1">
                      ✓ Betalt
                    </span>
                  ) : (
                    <form
                      action="/api/admin/indmeldinger/paid"
                      method="get"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="row" value={r.row_id} />
                      <select
                        name="method"
                        defaultValue="MobilePay"
                        className="border rounded-md px-2 py-1"
                      >
                        <option value="MobilePay">MobilePay</option>
                        <option value="Bank">Bank</option>
                        <option value="Kontant">Kontant</option>
                        <option value="Manual">Manual</option>
                      </select>
                      <input
                        type="text"
                        name="note"
                        placeholder="Note (valgfri)"
                        className="border rounded-md px-2 py-1 w-40"
                      />
                      <button
                        type="submit"
                        className="rounded-md px-3 py-1 bg-green-600 text-white hover:opacity-90"
                      >
                        Marker betalt
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Tips: “Kun pending” viser kun rækker, der mangler godkendelse. Brug
        “Vis alle” for historik.
      </p>
    </div>
  );
}
