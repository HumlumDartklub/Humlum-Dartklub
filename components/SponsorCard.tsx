"use client";

/* [HELP:SPONSORCARD:FILE] START
 * Forside SponsorCard:
 * - Titel + varm takkehilsen
 * - Indhold = SponsorSpotlightSlider (1 sponsor ad gangen, 5 sek)
 * - Alt styres fra sheet: visible + featured + order + website + logo_url
 * [HELP:SPONSORCARD:FILE] END */

import SponsorSpotlightSlider from "./SponsorSpotlightSlider";

export default function SponsorCard() {
  return (
    <div className="card h-full flex flex-col">
      <div className="kicker mb-1">
        <span className="h-2 w-2 rounded-full bg-orange-500" />
        SPONSORER
      </div>

      <h3 className="text-lg font-semibold text-gray-900">Tak til vores sponsorer</h3>

      <p className="mt-2 text-sm text-gray-600">
        Af hjertet tak — jeres støtte gør det muligt at bygge klubben og skabe fællesskab i Humlum. ❤️
      </p>

      {/* Center området i kortet */}
      <div className="mt-4 flex-1 flex items-center justify-center">
        {/* 5 sek pr sponsor */}
        <SponsorSpotlightSlider intervalMs={5000} />
      </div>
    </div>
  );
}
