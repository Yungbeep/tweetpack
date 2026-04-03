import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tweetpack",
  description:
    "Turn any tweet into an LLM-readable build pack for reconstructing products",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
