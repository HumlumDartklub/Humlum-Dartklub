import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MEMBER_COOKIE, verifyMemberToken } from "@/lib/memberAuth";
import PortalShell from "./portalShell";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const raw = (await cookies()).get(MEMBER_COOKIE)?.value;
  const session = verifyMemberToken(raw);
  if (!session) {
    redirect("/medlemslogin");
  }

  return <PortalShell session={session}>{children}</PortalShell>;
}
