/* [HELP:HVSS:FILE] START */
const MDT_LINKS = {
  kampplan: "https://hdk.my-darts-tournament.dk/mdt/vorrunde.php",
  stilling: "https://hdk.my-darts-tournament.dk/mdt/tabelle.php",
  spillere: "https://hdk.my-darts-tournament.dk/mdt/spieler.php?turnierid=22",
};

const participatingClubs = [
  { name: "Humlum Dartklub", teams: 3 },
  { name: "Dartklubben Thyboerne", teams: 2 },
  { name: "Jyden Dartklub", teams: 2 },
  { name: "Pirates", teams: 2 },
  { name: "Morsø Bulls", teams: 1 },
  { name: "Lemvig", teams: 1 },
];

const facts = [
  "3-mands holdturnering uden licenskrav.",
  "Alle møder alle én gang i sæsonen.",
  "Spilles på tirsdage fra 17/03/2026 til 10/11/2026.",
  "Slutspil i cup-format spilles 20/12/2026 i Jyden Dartklub.",
];

export default function HotelVildsundStrandSerienPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* [HELP:HVSS:HERO] START */}
      <section className="rounded-[2rem] border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          HOLDTURNERING 2026
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Hotel Vildsund Strand Serien
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
          Her har vi samlet den offentlige turneringsoversigt for serien. På HDK-siden
          holder vi det simpelt: kampplan, stilling og et hurtigt overblik over holdene.
          Ingen navne-cirkus i forsiden — bare det, folk faktisk har brug for.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={MDT_LINKS.kampplan}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            Se kampplan
          </a>

          <a
            href={MDT_LINKS.stilling}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Se stilling
          </a>

          <a
            href={MDT_LINKS.spillere}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Flere turneringsdetaljer
          </a>
        </div>
      </section>
      {/* [HELP:HVSS:HERO] END */}

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* [HELP:HVSS:FACTS] START */}
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            🎯 Nøgleinfo
          </div>

          <div className="grid gap-3">
            {facts.map((fact) => (
              <div
                key={fact}
                className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                {fact}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-700">
            Humlum deltager med <strong>3 hold</strong>. Kampene og tabellen ligger live i
            My Darts Tournament, så HDK-siden fungerer som jeres pæne indgang — ikke som en
            ekstra admin-byrde.
          </div>
        </article>
        {/* [HELP:HVSS:FACTS] END */}

        {/* [HELP:HVSS:TEAMS] START */}
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            🏁 Deltagende klubber
          </div>

          <div className="space-y-3">
            {participatingClubs.map((club) => (
              <div
                key={club.name}
                className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{club.name}</p>
                  <p className="text-xs text-slate-500">Hotel Vildsund Strand Serien 2026</p>
                </div>

                <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">
                  {club.teams} {club.teams === 1 ? "hold" : "hold"}
                </span>
              </div>
            ))}
          </div>
        </article>
        {/* [HELP:HVSS:TEAMS] END */}
      </section>
    </main>
  );
}
/* [HELP:HVSS:FILE] END */
