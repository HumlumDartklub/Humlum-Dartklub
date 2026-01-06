// [HELP:KONKURRER_SCORETAVLE_PAGE] START
import { Suspense } from "react";
import ScoretavleClient from "./ScoretavleClient";

// Scoretavle bruger search params => gør den dynamisk, ingen statisk prerender
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
          <div className="rounded-2xl border bg-white p-4 text-sm">
            Loader scoretavle…
          </div>
        </div>
      }
    >
      <ScoretavleClient />
    </Suspense>
  );
}
// [HELP:KONKURRER_SCORETAVLE_PAGE] END
