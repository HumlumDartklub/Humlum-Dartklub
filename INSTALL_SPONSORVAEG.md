# HDK Sponsorvæg V2 – integration

## Nye / ændrede sider
- `/sponsorvaeg` – ny premium sponsorvæg til hjemmesiden
- `/sponsorvaeg/tv` – ren TV-visning uden offentlig menu, ticker og footer
- `/admin/sponsorvaeg` – admin til synlighed, kategori, bane, titel og rækkefølge

## Data
Sponsorvæggen bruger fortsat fanen `SPONSORER` i det eksisterende HDK_Admin_v3 Google Sheet.

Den nye løsning bruger disse ekstra kolonner:
- `wall_title`
- `wall_category` (`gold`, `lane`, `support`, `hidden`)
- `wall_lane`
- `wall_visible` (`YES` / `NO`)
- `wall_order`

Du behøver ikke oprette kolonnerne manuelt. Den opdaterede `Code.gs` indeholder action `sponsorWallSetup`, som opretter kolonnerne og migrerer de eksisterende sponsorposter.

## Installation
1. Upload/merge de ændrede website-filer til GitHub/Vercel.
2. Erstat Apps Script-koden med den medfølgende `Code.gs` (eller indsæt sponsorvæg-sektionerne i din nuværende Code.gs).
3. Deploy Apps Script igen som Web App / ny version, så den aktive Sheet API bruger den nye kode.
4. Log ind på `/admin` og gå til `/admin/sponsorvaeg`.
5. Klik **Klargør sponsorvæg** én gang.
6. Kontroller kategorier og banenumre. Gem kun de rækker du vil ændre.

## Anbefalet opsætning
- STARK Holstebro → `gold`
- Sparkassen Danmark → `gold`
- Spar Humlum → `gold`
- Banesponsor-aftaler → `lane` + bane 1–13
- Keseler Byg → `support`

## TV
Åbn `https://humlumdartklub.com/sponsorvaeg/tv` på TV'et.
Siden genindlæser sponsordata automatisk hvert 5. minut, så ændringer fra admin slår igennem uden ny deploy.

## Bemærkning
Systemet bevarer de eksisterende felter (`visible`, `order`, `logo_url`, `website`, `note`) og bruger dem som fallback. Derfor virker sponsorvæggen allerede før migrationen og kan genkende de fleste nuværende Guld-/banesponsorposter ud fra deres eksisterende noter.


## Redigerbart støttefelt / CTA
Admin-siden `/admin/sponsorvaeg` har nu et felt **Støttefelt / ledig sponsorplads**. Her kan du ændre:

- Synlig / skjult
- Overskrift
- Tekst
- Knaptekst
- Link
- Om feltet også skal vises på TV

Indstillingerne gemmes i fanen `SPONSORVAEG_TEKST`. Klik **Klargør sponsorvæg** én gang efter den nye Apps Script-kode er deployet; så oprettes felterne og standardteksten automatisk.
