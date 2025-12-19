import type { Metadata } from "next";
import "./globals.css";
import AppChrome from "./components/AppChrome";
import DevAdminFab from "./components/DevAdminFab";

export const metadata: Metadata = {
  title: "Humlum Dartklub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>
        <AppChrome>{children}</AppChrome>
        <DevAdminFab />

      </body>
    </html>
  );
}
