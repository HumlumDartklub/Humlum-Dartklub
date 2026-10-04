HDK Sponsorvæg – TV Fullscreen patch

Indhold:
- app/sponsorvaeg/tv/page.tsx
- components/TvFullscreenButton.tsx

Installation:
1. Kopiér mapperne app og components ind i roden af dit eksisterende Next.js-projekt.
2. Tillad overskrivning af app/sponsorvaeg/tv/page.tsx.
3. Genstart localhost / deploy til Vercel.
4. Åbn /sponsorvaeg/tv på TV'et.
5. Tryk "Vis i fuld skærm" med fjernbetjeningen.

Ingen ændring af Code.gs er nødvendig.

Bemærk:
Nogle Smart-TV browsere tillader ikke web-sider at skjule browserens adresse-/fanebjælke via Fullscreen API. Hvis browseren afviser det, viser siden en besked om at bruge TV-browserens egen fuldskærmsfunktion.
