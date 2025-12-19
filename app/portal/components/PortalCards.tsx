import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={[
        // [HELP:PORTAL:CARDSTYLE] START
        // Mere "glas": mere gennemsigtigt når browseren understøtter backdrop-filter,
        // men stadig læsbart på alle enheder.
        "rounded-3xl border border-slate-200/60 bg-white/45 supports-[backdrop-filter]:bg-white/30 backdrop-blur-sm p-6 shadow-sm transition-all duration-200 hover:bg-white/70 hover:supports-[backdrop-filter]:bg-white/55 hover:border-slate-300/80 hover:shadow-md",

        // [HELP:PORTAL:CARDSTYLE] END

        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

export function CardTitle({ icon, title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon ? <div className="text-2xl">{icon}</div> : null}
      <div className="min-w-0">
        <div className="text-xl font-black tracking-tight">{title}</div>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
    </div>
  );
}
