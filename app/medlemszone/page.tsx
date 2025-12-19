import { redirect } from "next/navigation";

// OBS: /medlemszone er nu erstattet af /portal.
// Vi holder redirectet, så gamle links stadig virker.
export default function MedlemszoneRedirect() {
  redirect("/portal");
}
