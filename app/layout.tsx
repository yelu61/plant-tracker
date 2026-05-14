import type { Metadata, Viewport } from "next";

import { BottomNav } from "@/components/bottom-nav";
import { OfflineBootstrap } from "@/components/offline-bootstrap";
import { OfflineIndicator } from "@/components/offline-indicator";

import "./globals.css";

export const metadata: Metadata = {
  title: "PlantLog",
  description: "记录你养的每一株植物：浇水、施肥、开支、经验。",
  applicationName: "PlantLog",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PlantLog",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen pb-28">
          <main className="mx-auto max-w-3xl">{children}</main>
        </div>
        <BottomNav />
        <OfflineIndicator />
        <OfflineBootstrap />
      </body>
    </html>
  );
}
