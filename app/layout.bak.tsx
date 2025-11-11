import type { Metadata } from "next";
import "./globals.css";
import NavBar from "../components/NavBar";
import LiveTicker from "../components/LiveTicker";
import DevAdminFab from "./components/DevAdminFab";

export const metadata: Metadata = {
  title: "Humlum Dartklub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>
        <NavBar />
        <LiveTicker />
        {children}
<DevAdminFab />

      </body>
    </html>
  );
}
