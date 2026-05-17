import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "next-auth/react";
import { PolarisProvider } from "@/components/providers/polaris-provider";

export const metadata: Metadata = {
  title: "ProxyV2 - Hệ thống Quản lý Proxy Chuyên nghiệp",
  description: "Hệ thống quản lý proxy tiên tiến cho hạ tầng quy mô lớn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
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


