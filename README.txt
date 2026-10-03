HDK Sponsorvæg – Bliv sponsor FIX

Denne patch ændrer standardteksten "Bliv støtte" til "Bliv sponsor".

1) Kopiér mappen lib ind i projektets rod og erstat filen lib/sponsorWall.ts.
2) Hvis du bruger Google Apps Script-indstillingerne til CTA, erstat Code.gs med indholdet fra HDK_Code_med_sponsorvaeg_BLIV_SPONSOR_FIX.txt.
3) Gem og deploy Apps Script som en ny version.
4) Genstart localhost / Vercel build.
5) Gå til Admin > Sponsorvæg og klik "Klargør sponsorvæg" hvis feltet stadig har gammel standardværdi.

Bemærk: Har cta_button allerede værdien "Bliv støtte" i SPONSORVAEG_TEKST, vil eksisterende data normalt vinde over standardkoden. I så fald skal værdien ændres til "Bliv sponsor" i arket/admin eller slettes og klargøres igen.
