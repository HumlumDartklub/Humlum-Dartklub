import SponsorWall from "@/components/SponsorWall";
import TvFullscreenButton from "@/components/TvFullscreenButton";

export const metadata = { title: "Sponsorvæg TV · Humlum Dartklub" };

export default function SponsorWallTvPage() {
  return (
    <>
      <TvFullscreenButton />
      <SponsorWall tvMode showControls={false} />
    </>
  );
}
