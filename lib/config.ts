// /lib/config.ts
// ÉN sandhed for din Google Apps Script endpoint.
// (brug din egen URL herunder – den du har givet mig)
export const GAS_URL =
  "https://script.google.com/macros/s/AKfycbw-jTF1860I3Z1__6hrwhraFmDqEYdc7Y7_2ulzYAO8e_bCs88zu4mfhgKBjR5zzKS8ug/exec";

// Whitelist af gyldige tab-navne (så vi ikke snubler på stavefejl)
export const ALLOWED_TABS = new Set([
  "MEDLEMMER",
  "SPONSORER",
  "PROEVETRAENING",
  "NYHEDER",
  "EVENTS",
  "TICKER",
  "FORSIDE",
]);
