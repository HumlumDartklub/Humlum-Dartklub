"use client";

import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";

import NavBar from "@/components/NavBar";
import LiveTicker from "@/components/LiveTicker";
import PublicFooter from "@/components/PublicFooter";

function shouldHidePublicChrome(pathname: string): boolean {
  // [HELP:CHROME:HIDE] START
  // Portal/admin/login/viewer skal føles “internt” – ingen offentlig nav/ticker.
  const p = pathname || "/";
  return (
    p.startsWith("/portal") ||
    p.startsWith("/admin") ||
    p.startsWith("/medlemszone") ||
    p.startsWith("/medlemslogin") ||
    p.startsWith("/viewer")
  );
  // [HELP:CHROME:HIDE] END
}

function PublicBackground() {
  // [HELP:CHROME:PUBLIC-BG] START
  // Watermark/logo + premium fade på hele HP (public).
  // Ligger bag ALT og kan ikke klikkes på.
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      {/* Logo watermark */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: "url(/images/logo/humlum-logo.png)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center 22%",
          backgroundSize: "min(980px, 92vw)",
          filter: "blur(0px)",
        }}
      />
      {/* Blød “wash” så det føles dyrt og roligt */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/35 to-white/70" />
    </div>
  );
  // [HELP:CHROME:PUBLIC-BG] END
}

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const hide = useMemo(() => shouldHidePublicChrome(pathname), [pathname]);

  return (
    <div className="relative">
      {!hide ? <PublicBackground /> : null}

      {/* Content ligger over background */}
      <div className="relative z-10">
        {!hide ? (
          <>
            <NavBar />
            <LiveTicker />
          </>
        ) : null}

        {children}

        {/* [HELP:CHROME:FOOTER] START — footer kun på offentlige sider */}
        {!hide ? <PublicFooter /> : null}
        {/* [HELP:CHROME:FOOTER] END */}
      </div>
    </div>
  );
}
