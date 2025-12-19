import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* [HELP:PRIVACY:HEADER] START */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="inline-flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          <span>Juridisk info</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold">
          Privatlivspolitik for Humlum Dartklub
        </h1>
        <p className="mt-1 text-sm text-gray-700">
          Her kan du læse, hvordan vi bruger og beskytter de
          personoplysninger, vi har om dig som medlem, forælder, sponsor
          eller samarbejdspartner.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Senest opdateret: [indsæt dato]
        </p>
      </section>
      {/* [HELP:PRIVACY:HEADER] END */}

      {/* [HELP:PRIVACY:TOC] START — lille indholdsfortegnelse */}
      <nav className="mb-6 rounded-2xl border bg-white p-4 text-sm text-orange-800">
        <div className="font-semibold mb-2">Indhold</div>
        <ol className="space-y-1 list-decimal list-inside">
          <li>
            <a href="#hvem" className="underline">
              Hvem er vi?
            </a>
          </li>
          <li>
            <a href="#hvilke" className="underline">
              Hvilke oplysninger behandler vi?
            </a>
          </li>
          <li>
            <a href="#formaal" className="underline">
              Hvad bruger vi oplysningerne til?
            </a>
          </li>
          <li>
            <a href="#retsgrundlag" className="underline">
              Juridisk grundlag (GDPR)
            </a>
          </li>
          <li>
            <a href="#videregivelse" className="underline">
              Hvem deler vi oplysningerne med?
            </a>
          </li>
          <li>
            <a href="#opbevaring" className="underline">
              Hvor længe gemmer vi oplysninger?
            </a>
          </li>
          <li>
            <a href="#rettigheder" className="underline">
              Dine rettigheder
            </a>
          </li>
          <li>
            <a href="#klage" className="underline">
              Klage til Datatilsynet
            </a>
          </li>
          <li>
            <a href="#aendringer" className="underline">
              Ændringer i privatlivspolitikken
            </a>
          </li>
          <li>
            <a href="#kort" className="underline">
              Kort opsummering
            </a>
          </li>
        </ol>
      </nav>
      {/* [HELP:PRIVACY:TOC] END */}

      <div className="space-y-6">
        {/* 1. Hvem er vi? */}
        <section
          id="hvem"
          className="rounded-2xl border bg-white p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-2">1. Hvem er vi?</h2>
          <p className="text-sm text-gray-700 mb-2">
            Humlum Dartklub (&quot;klubben&quot;, &quot;vi&quot;, &quot;os&quot;)
            er en lokal dartklub i Struer Kommune, der samler børn, unge og
            voksne omkring dart, fællesskab og gode oplevelser.
          </p>
          <p className="text-sm text-gray-700 mb-2">
            Klubben er dataansvarlig for de personoplysninger, vi behandler
            om dig.
          </p>
          <div className="text-sm text-gray-800">
            <div className="font-semibold mb-1">Kontaktoplysninger</div>
            <p>Humlum Dartklub</p>
            <p>[Adresse]</p>
            <p>[Postnr] [By]</p>
            <p>CVR: [hvis relevant]</p>
            <p>
              E-mail:{" "}
              <a
                href="mailto:humlumdartklub@gmail.com"
                className="underline text-orange-700"
              >
                humlumdartklub@gmail.com
              </a>
            </p>
          </div>
        </section>

        {/* 2. Hvilke oplysninger */}
        <section
          id="hvilke"
          className="rounded-2xl border bg-white p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-2">
            2. Hvilke oplysninger behandler vi?
          </h2>
          <p className="text-sm text-gray-700 mb-3">
            Vi behandler primært almindelige personoplysninger – ikke
            følsomme oplysninger. Det kan være:
          </p>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold">
                Medlemmer og prøvemedlemmer
              </h3>
              <ul className="mt-1 list-disc list-inside">
                <li>Navn</li>
                <li>Adresse, postnummer og by</li>
                <li>E-mail og telefonnummer</li>
                <li>Fødselsår og evt. køn</li>
                <li>Valgt medlems-/kontingentpakke</li>
                <li>Niveauregistrering (f.eks. hygge, øvet, turnering)</li>
                <li>Evt. DDU-nummer for turneringsspillere</li>
                <li>
                  Evt. bemærkninger, du selv har skrevet i fritekstfelter
                  (tilmelding mv.)
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">
                Familie-/husstandsmedlemmer
              </h3>
              <p>
                Ved familiepakker kan vi desuden registrere navn og
                fødselsår på øvrige familiemedlemmer i husstanden.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">
                Sponsorer og samarbejdspartnere
              </h3>
              <ul className="mt-1 list-disc list-inside">
                <li>Kontaktpersons navn og stilling</li>
                <li>E-mail og telefonnummer</li>
                <li>Virksomhed/organisation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Billeder og video</h3>
              <p>
                Vi kan tage billeder og evt. korte videoklip i forbindelse
                med træning, turneringer og events. Materialet bruges
                typisk på hjemmeside, sociale medier og i intern
                kommunikation om klubben.
              </p>
              <p className="mt-1">
                Vi er særligt opmærksomme på billeder af børn og
                portrætbilleder og respekterer altid ønsker om ikke at
                optræde.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Formål */}
        <section
          id="formaal"
          className="rounded-2xl border bg-white p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-2">
            3. Hvad bruger vi oplysningerne til?
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold">Medlemsadministration</h3>
              <ul className="mt-1 list-disc list-inside">
                <li>Oprettelse og vedligeholdelse af medlemskab</li>
                <li>Opkrævning og registrering af kontingent</li>
                <li>
                  Tilmelding til træning, hold, interne turneringer og
                  events
                </li>
                <li>Vedligeholdelse af medlemslister og ventelister</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">
                Drift og økonomi i foreningen
              </h3>
              <ul className="mt-1 list-disc list-inside">
                <li>Bogføring og regnskab</li>
                <li>Budgettering og planlægning</li>
                <li>
                  Dokumentation over for myndigheder, DDU mv., hvor det er
                  nødvendigt
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">
                Kommunikation og information
              </h3>
              <ul className="mt-1 list-disc list-inside">
                <li>
                  Praktisk info om træning, ændringer, turneringer og
                  arrangementer
                </li>
                <li>Nyheder og generel medlemsinformation</li>
                <li>
                  Besvarelse af henvendelser pr. mail, via hjemmeside eller
                  sociale medier
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">
                Udvikling af klubtilbud og synlighed
              </h3>
              <ul className="mt-1 list-disc list-inside">
                <li>
                  Overordnet statistik (aldersgrupper, niveauer, pakker
                  mv.) til planlægning
                </li>
                <li>
                  Visning af klubaktiviteter på hjemmeside og sociale
                  medier
                </li>
                <li>
                  Kommunikation til og med sponsorer og samarbejdspartnere
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. Retsgrundlag */}
        <section
          id="retsgrundlag"
          className="rounded-2xl border bg-white p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-2">
            4. Juridisk grundlag (GDPR)
          </h2>
          <p className="text-sm text-gray-700 mb-3">
            Vi behandler dine personoplysninger på følgende grundlag:
          </p>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold">
                Medlemsaftale – GDPR art. 6, stk. 1, litra b
              </h3>
              <p>
                Når du bliver medlem, indgår du en aftale med klubben. For
                at kunne administrere dit medlemskab og levere de ydelser,
                du forventer som medlem, er det nødvendigt, at vi
                behandler dine oplysninger.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">
                Retlig forpligtelse – GDPR art. 6, stk. 1, litra c
              </h3>
              <p>
                Vi har pligt til at opbevare visse oplysninger i forbindelse
                med bogføring og regnskab, f.eks. dokumentation for
                kontingentbetalinger.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">
                Legitim interesse – GDPR art. 6, stk. 1, litra f
              </h3>
              <p>
                Vi har en legitim interesse i at kunne drive og udvikle
                klubben, informere medlemmerne, planlægge aktiviteter og
                vise lidt af livet i klubben udadtil. Det gælder f.eks.
                generel medlemskommunikation, intern statistik og brug af
                almindelige stemningsbilleder.
              </p>
              <p className="mt-1">
                Vi laver en konkret afvejning, så vores legitime interesser
                ikke overstiger dine rettigheder. Du kan altid kontakte os,
                hvis du ikke ønsker at være med på bestemte billeder eller
                ikke ønsker bestemte typer kommunikation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">
                Samtykke – GDPR art. 6, stk. 1, litra a
              </h3>
              <p>
                I nogle tilfælde kan vi bede om dit samtykke, fx ved brug af
                særlige portrætbilleder eller bestemte former for
                kommunikation. Du kan til enhver tid trække et samtykke
                tilbage ved at kontakte os.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Videregivelse */}
        <section
          id="videregivelse"
          className="rounded-2xl border bg-white p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-2">
            5. Hvem deler vi oplysningerne med?
          </h2>
          <p className="text-sm text-gray-700 mb-3">
            Vi videregiver kun oplysninger, når det er nødvendigt og
            sagligt begrundet i forhold til klubbens drift.
          </p>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            <li>
              Offentlige myndigheder, når det er nødvendigt i forbindelse
              med tilskud, puljer mv.
            </li>
            <li>
              Dansk Dart Union (DDU) og eventuelle andre idrætsorganisationer
              i forbindelse med turneringsdeltagelse mv.
            </li>
            <li>
              Bank, revisor eller bogholder i forbindelse med regnskab og
              betalinger.
            </li>
            <li>
              IT- og systemleverandører (f.eks. mail, hjemmeside, sky-løsning),
              der hjælper os med drift. Her fungerer de som
              databehandlere, og vi sikrer, at der er databehandleraftale
              på plads, når det er påkrævet.
            </li>
          </ul>
          <p className="mt-3 text-sm text-gray-700">
            Vi sælger ikke dine oplysninger til tredjemand. Som udgangspunkt
            overfører vi ikke personoplysninger til lande uden for EU/EØS.
            Hvis det skulle ske via en leverandør, sørger vi for, at der er
            et gyldigt overførselsgrundlag efter GDPR.
          </p>
        </section>

        {/* 6. Opbevaring */}
        <section
          id="opbevaring"
          className="rounded-2xl border bg-white p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-2">
            6. Hvor længe gemmer vi oplysninger?
          </h2>
          <p className="text-sm text-gray-700 mb-3">
            Vi opbevarer kun dine oplysninger, så længe det er nødvendigt
            til de formål, der er beskrevet i denne privatlivspolitik, og
            i overensstemmelse med gældende lovgivning.
          </p>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            <li>
              <span className="font-semibold">Medlemsoplysninger:</span>{" "}
              Gemmes, mens du er medlem. Efter udmeldelse opbevarer vi
              relevante oplysninger i en begrænset periode (typisk op til 3
              år), hvis der kan være behov for dokumentation eller historik.
            </li>
            <li>
              <span className="font-semibold">
                Regnskabs- og betalingsoplysninger:
              </span>{" "}
              Opbevares som udgangspunkt i op til 5 år efter udløbet af det
              regnskabsår, materialet vedrører, jf. bogføringsreglerne.
            </li>
            <li>
              <span className="font-semibold">
                Sponsorer og samarbejdspartnere:
              </span>{" "}
              Gemmes så længe samarbejdet består og i en begrænset periode
              derefter, hvis det er relevant.
            </li>
            <li>
              <span className="font-semibold">Billeder og video:</span>{" "}
              Opbevares og anvendes, så længe materialet er relevant for
              klubbens kommunikation og historik – eller indtil du beder os
              om at fjerne materiale, hvor du optræder.
            </li>
          </ul>
        </section>

        {/* 7. Rettigheder */}
        <section
          id="rettigheder"
          className="rounded-2xl border bg-white p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-2">
            7. Dine rettigheder
          </h2>
          <p className="text-sm text-gray-700 mb-3">
            Som registreret har du en række rettigheder efter
            databeskyttelsesreglerne. Du kan blandt andet:
          </p>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            <li>Få indsigt i, hvilke oplysninger vi har om dig.</li>
            <li>Få rettet urigtige eller ufuldstændige oplysninger.</li>
            <li>
              I visse tilfælde få slettet dine oplysninger (inden vores
              almindelige slettefrist).
            </li>
            <li>
              I visse tilfælde få begrænset vores behandling til kun at
              bestå af opbevaring.
            </li>
            <li>
              Gøre indsigelse mod behandling, som vi baserer på vores
              legitime interesser.
            </li>
            <li>
              I nogle situationer få dine oplysninger udleveret i et
              struktureret, almindeligt anvendt og maskinlæsbart format
              (dataportabilitet).
            </li>
          </ul>
          <p className="mt-3 text-sm text-gray-700">
            Hvis du vil gøre brug af dine rettigheder, kan du kontakte os på{" "}
            <a
              href="mailto:humlumdartklub@gmail.com"
              className="underline text-orange-700"
            >
              humlumdartklub@gmail.com
            </a>
            . Vi bestræber os på at svare så hurtigt som muligt og inden for
            de frister, der følger af GDPR.
          </p>
        </section>

        {/* 8. Klage */}
        <section
          id="klage"
          className="rounded-2xl border bg-white p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-2">
            8. Klage til Datatilsynet
          </h2>
          <p className="text-sm text-gray-700 mb-3">
            Hvis du er utilfreds med den måde, vi behandler dine
            personoplysninger på, håber vi først, at du vil kontakte os, så
            vi kan forsøge at finde en løsning.
          </p>
          <p className="text-sm text-gray-700 mb-2">
            Du har også ret til at klage direkte til Datatilsynet:
          </p>
          <div className="text-sm text-gray-800">
            <p>Datatilsynet</p>
            <p>Carl Jacobsens Vej 35</p>
            <p>2500 Valby</p>
            <p>
              Web:{" "}
              <a
                href="https://www.datatilsynet.dk"
                target="_blank"
                rel="noreferrer"
                className="underline text-orange-700"
              >
                www.datatilsynet.dk
              </a>
            </p>
          </div>
        </section>

        {/* 9. Ændringer */}
        <section
          id="aendringer"
          className="rounded-2xl border bg-white p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-2">
            9. Ændringer i privatlivspolitikken
          </h2>
          <p className="text-sm text-gray-700">
            Vi kan opdatere denne privatlivspolitik, hvis vores behandling
            af personoplysninger ændrer sig, eller hvis det bliver nødvendigt
            på grund af ændringer i lovgivningen. Den gældende version vil
            altid være tilgængelig her på hjemmesiden.
          </p>
        </section>

        {/* 10. Kort opsummering */}
        <section
          id="kort"
          className="rounded-2xl border bg-orange-50 p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-2">
            10. Kort og ærligt opsummeret
          </h2>
          <p className="text-sm text-gray-800 mb-2">
            Vi bruger dine oplysninger til:
          </p>
          <ul className="text-sm text-gray-800 list-disc list-inside space-y-1">
            <li>at administrere dit medlemskab og kontingent,</li>
            <li>at kommunikere om træning, events og praktiske ting,</li>
            <li>at drive en sund klub med styr på økonomi og medlemmer,</li>
            <li>og at fortælle om klubben til omverdenen på en ordentlig måde.</li>
          </ul>
          <p className="mt-2 text-sm text-gray-800">
            Du kan altid spørge, få indsigt, få rettet, få slettet eller
            sige &quot;nej tak&quot; til bestemte ting. Skriv bare til os på{" "}
            <a
              href="mailto:humlumdartklub@gmail.com"
              className="underline text-orange-700"
            >
              humlumdartklub@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
