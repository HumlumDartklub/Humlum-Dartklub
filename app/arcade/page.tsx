import { redirect } from "next/navigation";

// Backwards compat: /arcade -> /konkurrencer
export default function ArcadeRedirect() {
  redirect("/konkurrencer");
}
