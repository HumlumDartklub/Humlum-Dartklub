import type { ReactNode } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Lille “premium card” wrapper til Arcade/Konkurrencer.
 * Bruger eksisterende .card class fra sitet, men giver en ens header.
 */
export default function ArcadeCard({
  title,
  subtitle,
  children,
  className = "",
}: Props) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || subtitle) && (
        <header className="mb-3">
          {title && <div className="text-sm font-black text-slate-900">{title}</div>}
          {subtitle && <div className="text-xs text-slate-600">{subtitle}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
