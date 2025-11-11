/* [CFG:IMPORTS] START */
/* [CFG:IMPORTS] END */
// /lib/config.ts
// ÉN sandhed for din Google Apps Script endpoint.
// (brug din egen URL herunder – den du har givet mig)
/* [CFG:CONST:GAS_URL] START */
export const GAS_URL =
  "https://script.google.com/macros/s/AKfycbw-jTF1860I3Z1__6hrwhraFmDqEYdc7Y7_2ulzYAO8e_bCs88zu4mfhgKBjR5zzKS8ug/exec";
/* [CFG:CONST:GAS_URL] END */

// Whitelist af gyldige tab-navne (så vi ikke snubler på stavefejl)
/* [CFG:CONST:ALLOWED_TABS] START */
/* [CFG:CONST:ALLOWED_TABS] START */
export const ALLOWED_TABS = new Set([
/* [CFG:CONST:ALLOWED_TABS] END */
  "MEDLEMMER",
  "SPONSORER",
  "PROEVETRAENING",
  "NYHEDER",
  "EVENTS",
  "TICKER",
  "FORSIDE",
]);
/* [CFG:CONST:ALLOWED_TABS] END */