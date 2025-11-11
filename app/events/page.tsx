/* [HELP:EVENTS:FILE] START — Forside for events (pladsholdere indtil admin/Sheet er koblet på) */
export default function EventsPage() {
  /* [HELP:EVENTS:DATA] START — Pladsholder-data (kan senere komme fra Google Sheets / Admin) */
  const events = [
    {
      id: "e1",
      date: "Tors 21. nov · 19:00–21:00",
      title: "Åben Træningsaften",
      blurb: "Kom og prøv darts i et roligt tempo. Vi hjælper dig i gang – alle niveauer er velkomne.",
      tags: ["Træning", "For alle", "Gratis"],
      where: "Klublokalet, Humlum",
    },
    {
      id: "e2",
      date: "Lør 30. nov · 13:00–17:00",
      title: "Mini-Turnering (single)",
      blurb: "Hyggelig turnering for begyndere og let øvede. Vi matcher niveau – det handler om at have det sjovt.",
      tags: ["Turnering", "Begynder", "Præmier"],
      where: "Klublokalet",
    },
    {
      id: "e3",
      date: "Ons 4. dec · 19:00–21:00",
      title: "Teknikfokus: Doubles under tid",
      blurb: "Trænerstyret session med fokus på rutine og ro ved doubler – små øvelser og feedback.",
      tags: ["Træning", "Coaching"],
      where: "Klublokalet",
    },
    {
      id: "e4",
      date: "Fre 6. dec · 18:00–21:30",
      title: "Familieaften & Pizza",
      blurb: "Tag familien med – vi spiller par-spil, har små udfordringer for børn og hygger med pizza.",
      tags: ["Familie", "Hygge"],
      where: "Klublokalet",
    },
    {
      id: "e5",
      date: "Lør 14. dec · 10:00–16:00",
      title: "Julecup (par)",
      blurb: "Venskabelig par-turnering. Nissehuer giver bonus-point 😉",
      tags: ["Turnering", "Hygge", "Præmier"],
      where: "Klublokalet",
    },
    {
      id: "e6",
      date: "Man 6. jan · 19:00–20:30",
      title: "Opstartsmøde · 2025",
      blurb: "Vi deler planer for foråret: ungdom, events, sponsorvæg og nye tiltag. Alle kan byde ind.",
      tags: ["Møde", "Planer"],
      where: "Klublokalet",
    },
  ];
  /* [HELP:EVENTS:DATA] END */

  /* [HELP:EVENTS:RENDER] START — hele siderendering */
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      {/* [HELP:EVENTS:SECTION:HEADER] START — sideheader/beskrivelse */}
      <header className="mb-10">
        <div className="rounded-3xl border border-lime-300/40 bg-white/60 backdrop-blur-sm p-6 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/60 bg-lime-50 px-3 py-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-lime-500" />
            🎯 EVENTS
          </div>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Humlum Dart Events
          </h1>

          <p className="mt-2 text-gray-600 text-sm">
            Turneringer, træning, hyggeaftener og lokale arrangementer.  
            Kalenderen er aktiv snart – pladsholdere viser, hvad du kan glæde dig til!
          </p>
        </div>
      </header>
      {/* [HELP:EVENTS:SECTION:HEADER] END */}

      {/* [HELP:EVENTS:GRID] START — kortgrid mappet over events */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {events.map(evt => (
          /* [HELP:EVENTS:CARD] START — enkelt event-kort */
          <article
            key={evt.id}
            className="h-full flex flex-col rounded-3xl border border-lime-400 bg-white p-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-gray-600">{evt.date}</p>
              <span className="text-[10px] rounded-full border border-lime-300/60 bg-lime-50 px-2 py-0.5 text-gray-700">
                Kommer snart
              </span>
            </div>

            <h2 className="mt-2 text-lg font-semibold text-gray-900">{evt.title}</h2>
            <p className="mt-2 text-sm text-gray-700">{evt.blurb}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {evt.tags.map((t, i) => (
                <span
                  key={i}
                  className="text-xs rounded-full border border-lime-300/60 bg-lime-50 px-2 py-0.5 text-gray-700"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-3 text-xs text-gray-500">📍 {evt.where}</div>

            <div className="mt-auto pt-4">
              <button
                type="button"
                disabled
                className="w-full rounded-xl px-4 py-2 font-semibold border bg-gray-100 text-gray-500 cursor-not-allowed"
                title="Integration kommer snart"
              >
                Tilmelding åbner snart
              </button>
            </div>
          </article>
          /* [HELP:EVENTS:CARD] END */
        ))}
      </section>
      {/* [HELP:EVENTS:GRID] END */}

      {/* [HELP:EVENTS:FOOTNOTE] START — note under grid */}
      <p className="mt-8 text-xs text-gray-500">
        Tip: Når vi kobler til admin, kan du filtrere pr. type (Træning / Turnering / Familie), vise billeder og aktivere “Tilmeld via formular”.
      </p>
      {/* [HELP:EVENTS:FOOTNOTE] END */}
    </main>
  );
  /* [HELP:EVENTS:RENDER] END */
}
/* [HELP:EVENTS:FILE] END */
