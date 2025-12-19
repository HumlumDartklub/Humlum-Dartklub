"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { MemberSession } from "@/lib/memberAuth";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  group: string;
  external?: boolean;
};

function safeText(s: any) {
  return String(s ?? "").trim();
}

function groupTitle(group: string) {
  if (group === "Start") return "Start";
  if (group === "Spil & Statistik") return "Spil & Statistik";
  if (group === "My Academy") return "My Academy";
  if (group === "Junior Corner") return "Junior Corner";
  if (group === "Kampe & Hold") return "Kampe & Hold";
  if (group === "Klubben") return "Klubben";
  if (group === "Support") return "Support";
  if (group === "Profil") return "Profil";
  return group;
}

function groupIcon(group: string) {
  if (group === "Start") return "🏠";
  if (group === "Spil & Statistik") return "🏆";
  if (group === "My Academy") return "🚀";
  if (group === "Junior Corner") return "🧒";
  if (group === "Kampe & Hold") return "👥";
  if (group === "Klubben") return "💬";
  if (group === "Support") return "🛟";
  if (group === "Profil") return "👤";
  return "•";
}

function isActive(pathname: string, href: string) {
  if (href === "/portal") return pathname === "/portal";
  return pathname.startsWith(href);
}

export default function PortalShell({
  session,
  children,
}: {
  session: MemberSession;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/portal";
  const router = useRouter();

  const shopUrl = (process.env.NEXT_PUBLIC_SHOP_URL || "").trim();

  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [logoOk, setLogoOk] = useState(true);

  // Hover-mode = EPISK version:
  // - vis kun grupper
  // - hover på gruppe => flyout med undermenuer
  const hoverMode = hovered && !pinned && !mobileOpen;

  const expandedDesktop = pinned || hovered;
  const expanded = expandedDesktop || mobileOpen;

  // Kun 1 gruppe åben ad gangen når pinned/mobile (ingen evighedsliste)
  const [openGroup, setOpenGroup] = useState<string>("Start");

  // Flyout gruppe (hover)
  const [flyoutGroup, setFlyoutGroup] = useState<string>("Start");

  // [HELP:PORTAL:FLYOUT-POS] START
  // Flyout skal sidde ud for den gruppe du hover på – også når du scroller.
  const groupsScrollRef = useRef<HTMLDivElement | null>(null);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const [flyoutAnchorEl, setFlyoutAnchorEl] = useState<HTMLElement | null>(null);

  const updateFlyoutTop = (anchor?: HTMLElement | null) => {
    const el = anchor || flyoutAnchorEl;
    if (!el) return;

    const container = groupsScrollRef.current;
    const scrollTop = container?.scrollTop || 0;

    // offsetTop er i containerens koordinatsystem, så vi trækker scrollTop fra
    const top = Math.max(0, el.offsetTop - scrollTop);
    setFlyoutTop(top);
  };

  const setFlyoutFromEl = (el: HTMLElement, group: string) => {
    setFlyoutGroup(group);
    setFlyoutAnchorEl(el);
    updateFlyoutTop(el);
  };
  // [HELP:PORTAL:FLYOUT-POS] END

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const name = useMemo(() => {
    const fn = safeText((session as any).first_name);
    const ln = safeText((session as any).last_name);
    if (fn || ln) return `${fn} ${ln}`.trim();
    const email = safeText((session as any).email);
    if (email.includes("@")) return email.split("@")[0];
    return "Medlem";
  }, [session]);

  const nav: NavItem[] = useMemo(() => {
    const shopItem: NavItem = shopUrl
      ? { group: "Klubben", href: shopUrl, label: "Klubshop", icon: "🛒", external: true }
      : { group: "Klubben", href: "/portal/shop", label: "Klubshop", icon: "🛒" };

    return [
      // Start
      { group: "Start", href: "/portal", label: "Portal Forside", icon: "🏠" },
      { group: "Start", href: "/portal/nyheder", label: "Nyheder", icon: "🗞️" },
      { group: "Start", href: "/portal/kalender", label: "Kalender", icon: "📅" },
      { group: "Start", href: "/portal/notifikationer", label: "Notifikationer", icon: "🔔" },

      // My Academy
      { group: "My Academy", href: "/portal/academy", label: "Start din rejse", icon: "🚀" },
      { group: "My Academy", href: "/portal/academy/kampklar", label: "Kampklar-test", icon: "🧠" },
      { group: "My Academy", href: "/portal/dart-abc", label: "Dart ABC", icon: "📘" },
      { group: "My Academy", href: "/portal/materialer", label: "Materialer", icon: "📦" },

      // Junior Corner
      { group: "Junior Corner", href: "/portal/academy/kampklar", label: "Junior Kampklar", icon: "🧩" },
      { group: "Junior Corner", href: "/portal/badges", label: "Badges", icon: "🏅" },

      // Spil & statistik
      { group: "Spil & Statistik", href: "/portal/klubmesterskab", label: "Klubmesterskab", icon: "🏆" },
      { group: "Spil & Statistik", href: "/portal/rangliste", label: "Rangliste", icon: "📈" },
      { group: "Spil & Statistik", href: "/portal/highscores", label: "Highscores", icon: "🎯" },
      { group: "Spil & Statistik", href: "/portal/maanedens-spiller", label: "Månedens spiller", icon: "⭐" },
      { group: "Spil & Statistik", href: "/portal/hall-of-fame", label: "Hall of Fame", icon: "🏛️" },
      { group: "Spil & Statistik", href: "/portal/badges", label: "Badges", icon: "🏅" },
      { group: "Spil & Statistik", href: "/portal/saeson", label: "Sæson", icon: "🗂️" },

      // Kampe & hold
      { group: "Kampe & Hold", href: "/portal/hold", label: "Hold", icon: "👥" },
      { group: "Kampe & Hold", href: "/portal/kampplan", label: "Kampplan", icon: "📝" },
      { group: "Kampe & Hold", href: "/portal/tilmeldinger", label: "Tilmeldinger", icon: "✅" },

      // Klubben
      { group: "Klubben", href: "/portal/puls", label: "Klub-puls", icon: "💬" },
      { group: "Klubben", href: "/portal/links", label: "Links", icon: "🔗" },
      shopItem,

      // Support
      { group: "Support", href: "/portal/hjaelp", label: "Hjælp", icon: "🛟" },
      { group: "Support", href: "/portal/support", label: "Kontakt", icon: "✉️" },

      // Profil
      { group: "Profil", href: "/portal/profil", label: "Min profil", icon: "👤" },
    ];
  }, [shopUrl]);

  const quickNav: NavItem[] = useMemo(
    () => [
      { group: "Quick", href: "/portal", label: "Portal", icon: "🏠" },
      { group: "Quick", href: "/portal/nyheder", label: "Nyheder", icon: "🗞️" },
      { group: "Quick", href: "/portal/kalender", label: "Kalender", icon: "📅" },
      { group: "Quick", href: "/portal/academy", label: "My Academy", icon: "🚀" },
      { group: "Quick", href: "/portal/materialer", label: "Materialer", icon: "📦" },
      { group: "Quick", href: "/portal/profil", label: "Profil", icon: "👤" },
    ],
    []
  );

  const isExternalHref = (href: string, external?: boolean) => {
    if (external) return true;
    return /^https?:\/\//i.test(href);
  };

  const groups = useMemo(() => {
    const order = [
      "Start",
      "My Academy",
      "Junior Corner",
      "Spil & Statistik",
      "Kampe & Hold",
      "Klubben",
      "Support",
      "Profil",
    ];
    const by = new Map<string, NavItem[]>();
    for (const it of nav) by.set(it.group, (by.get(it.group) || []).concat(it));
    return order.map((g) => ({ g, items: by.get(g) || [] })).filter((x) => x.items.length);
  }, [nav]);

  const activeGroup = useMemo(() => {
    for (const gr of groups) {
      if (gr.items.some((it) => !isExternalHref(it.href, it.external) && isActive(pathname, it.href))) {
        return gr.g;
      }
    }
    return "Start";
  }, [groups, pathname]);

  useEffect(() => {
    // pinned/mobile: sørg for at aktiv gruppe er den der vises
    if (!hoverMode) setOpenGroup(activeGroup);

    // hover: default flyout = aktiv gruppe
    setFlyoutGroup(activeGroup);
    // reset anchor når vi skifter side
    setFlyoutAnchorEl(null);
  }, [activeGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // når hoverMode slukker, drop anchor
    if (!hoverMode) setFlyoutAnchorEl(null);
  }, [hoverMode]);

  const logout = async () => {
    try {
      await fetch("/api/member/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/medlemslogin");
  };

  const flyoutItems = useMemo(() => {
    const g = flyoutGroup || "Start";
    return groups.find((x) => x.g === g)?.items || [];
  }, [groups, flyoutGroup]);

  return (
    <div className="relative isolate min-h-screen bg-slate-50 text-slate-900">
      {/* baggrund */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-no-repeat bg-center"
          style={{
            backgroundImage: "url(/images/logo/humlum-logo.png)",
            backgroundSize: "min(1150px, 90vw)",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center 55%",
            opacity: 0.32,
            filter: "saturate(1.15) contrast(1.25) brightness(0.92)",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 55%, #000 0%, #000 58%, transparent 86%)",
            maskImage:
              "radial-gradient(circle at 50% 55%, #000 0%, #000 58%, transparent 86%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px circle at 18% 10%, rgba(249,115,22,0.10), transparent 62%), radial-gradient(900px circle at 82% 0%, rgba(59,130,246,0.05), transparent 62%), radial-gradient(900px circle at 60% 92%, rgba(249,115,22,0.06), transparent 64%)",
          }}
        />
      </div>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          aria-label="Luk menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-40 border-r border-slate-200 bg-white/80 backdrop-blur md:relative md:z-20",
            "overflow-visible",
            expanded ? "w-[240px]" : "w-[68px]",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            "md:translate-x-0 transition-[width,transform] duration-200",
          ].join(" ")}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            setFlyoutGroup(activeGroup);
            setFlyoutAnchorEl(null);
          }}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-3">
            <Link href="/portal" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-lg overflow-hidden">
                {logoOk ? (
                  <Image
                    src="/images/logo/humlum-logo.png"
                    alt="HDK logo"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                    onError={() => setLogoOk(false)}
                  />
                ) : (
                  "🎯"
                )}
              </span>

              {expanded ? (
                <div className="leading-tight">
                  <div className="text-sm font-black tracking-tight">HDK Portal</div>
                  <div className="text-xs text-slate-500">Kun for medlemmer</div>
                </div>
              ) : null}
            </Link>

            {expanded ? (
              <button
                type="button"
                onClick={() => setPinned((v) => !v)}
                className="hidden rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold hover:bg-slate-50 md:inline-flex"
                title={pinned ? "Af-pin" : "Pin"}
                aria-label={pinned ? "Af-pin" : "Pin"}
              >
                {pinned ? "📌" : "📍"}
              </button>
            ) : null}
          </div>

          {/* MENU */}
          <div className="px-2 pb-2">
            {expanded ? (
              hoverMode ? (
                // [HELP:PORTAL:HOVER-NAV] START
                <div className="relative">
                  {/* Kun grupper (scrollbar i venstre kolonne hvis der bliver mange) */}
                  <div
                    ref={groupsScrollRef}
                    onScroll={() => updateFlyoutTop()}
                    className="grid gap-1 max-h-[calc(100vh-180px)] overflow-auto pr-1"
                  >
                    {groups.map(({ g }) => {
                      const selected = flyoutGroup === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onMouseEnter={(e) => setFlyoutFromEl(e.currentTarget as HTMLElement, g)}
                          onFocus={(e) => setFlyoutFromEl(e.currentTarget as HTMLElement, g)}
                          className={[
                            "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-black",
                            selected ? "bg-orange-50 ring-1 ring-orange-200" : "hover:bg-slate-50",
                          ].join(" ")}
                          aria-label={groupTitle(g)}
                        >
                          <span className="flex items-center gap-2">
                            <span aria-hidden="true">{groupIcon(g)}</span>
                            <span>{groupTitle(g)}</span>
                          </span>
                          <span className="text-slate-400" aria-hidden="true">
                            →
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Flyout panel med undermenuer – NU: placeret ud for hover-rækken */}
                  <div
                    className="absolute left-full ml-2 hidden md:block w-[280px] rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-2 shadow-sm"
                    style={{ top: flyoutTop }}
                    onMouseEnter={() => setHovered(true)}
                  >
                    <div className="px-2 py-2 text-xs font-black uppercase tracking-wider text-slate-500">
                      {groupTitle(flyoutGroup)}
                    </div>

                    <div className="max-h-[calc(100vh-240px)] overflow-auto px-1 pb-2">
                      {flyoutItems.map((it) => {
                        const active = !isExternalHref(it.href, it.external) && isActive(pathname, it.href);
                        const external = isExternalHref(it.href, it.external);

                        const Row = (
                          <>
                            <span className="text-lg" aria-hidden="true">
                              {it.icon}
                            </span>
                            <span className="truncate">{it.label}</span>
                          </>
                        );

                        return external ? (
                          <a
                            key={`${it.group}-${it.href}`}
                            href={it.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileOpen(false)}
                            className={[
                              "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold",
                              active ? "bg-orange-50 ring-1 ring-orange-200" : "hover:bg-slate-50",
                            ].join(" ")}
                          >
                            {Row}
                          </a>
                        ) : (
                          <Link
                            key={`${it.group}-${it.href}`}
                            href={it.href}
                            onClick={() => setMobileOpen(false)}
                            className={[
                              "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold",
                              active ? "bg-orange-50 ring-1 ring-orange-200" : "hover:bg-slate-50",
                            ].join(" ")}
                          >
                            {Row}
                          </Link>
                        );
                      })}
                    </div>

                    <div className="px-2 pb-2 text-xs text-slate-500">
                      Tip: Pin menuen hvis du vil have “fuld liste” hele tiden.
                    </div>
                  </div>
                </div>
                // [HELP:PORTAL:HOVER-NAV] END
              ) : (
                // pinned / mobile: klassisk accordion – men kun 1 gruppe ad gangen
                <div className="grid gap-2">
                  {groups.map(({ g, items }) => {
                    const isOpen = openGroup === g;

                    return (
                      <div key={g}>
                        <button
                          type="button"
                          onClick={() => setOpenGroup((prev) => (prev === g ? "" : g))}
                          className="flex w-full items-center justify-between rounded-xl px-2 pt-2 pb-1 text-[11px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
                          aria-expanded={isOpen ? "true" : "false"}
                        >
                          <span className="flex items-center gap-2">
                            <span aria-hidden="true">{groupIcon(g)}</span>
                            <span>{groupTitle(g)}</span>
                          </span>
                          <span className="text-slate-400" aria-hidden="true">
                            {isOpen ? "▾" : "▸"}
                          </span>
                        </button>

                        {isOpen ? (
                          <div className="mt-1 grid gap-1">
                            {items.map((it) => {
                              const active = !isExternalHref(it.href, it.external) && isActive(pathname, it.href);
                              const external = isExternalHref(it.href, it.external);

                              const Row = (
                                <>
                                  <span className="text-lg" aria-hidden="true">
                                    {it.icon}
                                  </span>
                                  <span className="truncate">{it.label}</span>
                                </>
                              );

                              return external ? (
                                <a
                                  key={`${g}-${it.href}`}
                                  href={it.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setMobileOpen(false)}
                                  className={[
                                    "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold",
                                    active ? "bg-orange-50 ring-1 ring-orange-200" : "hover:bg-slate-50",
                                  ].join(" ")}
                                >
                                  {Row}
                                </a>
                              ) : (
                                <Link
                                  key={`${g}-${it.href}`}
                                  href={it.href}
                                  onClick={() => setMobileOpen(false)}
                                  className={[
                                    "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold",
                                    active ? "bg-orange-50 ring-1 ring-orange-200" : "hover:bg-slate-50",
                                  ].join(" ")}
                                >
                                  {Row}
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Collapsed = kun få Quick icons
              <div className="grid gap-1 px-1">
                {quickNav.map((it) => {
                  const active = isActive(pathname, it.href);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      title={it.label}
                      aria-label={it.label}
                      className={[
                        "grid h-11 w-11 place-items-center rounded-2xl transition-all",
                        active ? "bg-orange-50 ring-1 ring-orange-200" : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span className="text-lg" aria-hidden="true">
                        {it.icon}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Profile bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-2">
              <Link
                href="/portal/profil"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
              >
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-100">👤</span>
                {expanded ? (
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black">{name}</div>
                    <div className="truncate text-xs text-slate-500">Aktiv</div>
                  </div>
                ) : null}
              </Link>

              {expanded ? (
                <button
                  type="button"
                  onClick={logout}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold hover:bg-slate-50"
                >
                  Log ud
                </button>
              ) : null}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col md:pl-0">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/70 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  className="md:hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black hover:bg-slate-50"
                  onClick={() => setMobileOpen(true)}
                >
                  ☰ Menu
                </button>

                <div className="min-w-0">
                  <Link href="/portal" className="text-sm font-black tracking-tight hover:opacity-80">
                    Humlum Dartklub
                  </Link>
                  <div className="text-xs text-slate-500">Portal • Fællesskab &amp; Præcision</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black hover:bg-slate-50 md:inline-flex"
                  title="Åbn den offentlige forside i ny fane"
                >
                  ↩ Til hjemmesiden
                </a>
                <Link
                  href="/portal/academy"
                  className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-black hover:opacity-90"
                >
                  My Academy
                </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 py-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
