// layout.tsx — Define document metadata, global styles, and app providers.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ideontra",
  description: "Ideas and innovation board",
};

interface RootLayoutProps {
  children: ReactNode;
}

// Render the server layout with a narrowly scoped client provider.
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
