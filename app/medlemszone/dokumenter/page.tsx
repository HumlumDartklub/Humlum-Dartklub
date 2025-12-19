import { redirect } from "next/navigation";

// OBS: Dokumenter er flyttet til /portal/materialer.
export default function DokumenterRedirect() {
  redirect("/portal/materialer");
}
