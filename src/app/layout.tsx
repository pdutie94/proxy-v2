import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "next-auth/react";
import { PolarisProvider } from "@/components/providers/polaris-provider";

export const metadata: Metadata = {
  title: "ProxyV2 - Professional Proxy Management",
  description: "Advanced proxy management system for high-scale infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <QueryProvider>
            <PolarisProvider>
              {children}
              <Toaster richColors position="top-right" />
            </PolarisProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
