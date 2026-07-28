import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Native Film Studio",
  description: "Infinite-canvas AI film production workspace",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
