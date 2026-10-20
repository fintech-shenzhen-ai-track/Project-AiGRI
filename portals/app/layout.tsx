import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IconSprite } from "@/components/icons/sprite";
import { ToastRegion } from "@/components/Toast";
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
    <html lang="en">
      <body>
        <IconSprite />
        {children}
        <ToastRegion />
      </body>
    </html>
  );
}
