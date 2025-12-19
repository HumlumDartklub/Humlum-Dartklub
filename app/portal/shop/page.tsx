import Link from "next/link";

import { Card, CardTitle } from "../components/PortalCards";

export const dynamic = "force-dynamic";

export default function ShopPage() {
  const shopUrl = (process.env.NEXT_PUBLIC_SHOP_URL || "").trim();
  const ready = /^https?:\/\//i.test(shopUrl);

  return (
    <div className="grid gap-4">
      <Card>
        <CardTitle
          icon="🛒"
          title="Klubshop"
          subtitle={
            ready
              ? "Shoppen åbner i en ny fane (eksternt link)."
              : "Vi kobler shoppen på så snart vi har adgang."
          }
        />

        {ready ? (
          <div className="mt-4">
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black hover:opacity-90"
            >
              Åbn klubshop
            </a>
          </div>
        ) : (
          <div className="mt-4 text-sm text-white/70">
            Tip: når du har shop-URL’en, så sæt <b>NEXT_PUBLIC_SHOP_URL</b> i .env.local / Vercel env.
            Så bliver menupunktet automatisk et direkte link.
          </div>
        )}
      </Card>

      <Card>
        <CardTitle icon="🔗" title="Indtil da" subtitle="Vi kan stadig sende folk det rigtige sted." />
        <div className="mt-4 grid gap-2 text-sm text-white/70">
          <div>• Sponsor / merchandise kan ligge som links her midlertidigt.</div>
          <div>• Vi kan lave et lille “produkt-udstillingskort” når du har priser/billeder klar.</div>
        </div>
        <div className="mt-4">
          <Link
            href="/portal/links"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black hover:bg-white/15"
          >
            Gå til Links
          </Link>
        </div>
      </Card>
    </div>
  );
}
