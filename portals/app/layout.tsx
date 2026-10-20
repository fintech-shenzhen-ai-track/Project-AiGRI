import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IconSprite } from "@/components/icons/sprite";
import { ToastRegion } from "@/components/Toast";
import { MOTION_BOOT_SCRIPT } from "@/lib/motion";
import "../styles/system.css";

export const metadata: Metadata = {
  title: "AiGRI",
  description: "Agricultural insurance for farms in Indonesia.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The boot script adds `js` (and `data-still` for ?still) to <html> before first paint, as system.js does, so
    // the reveal styles apply only when scripting is on. React must not complain that <html> gained attributes.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />
      </head>
      <body>
        <IconSprite />
        {children}
        <ToastRegion />
      </body>
    </html>
  );
}
