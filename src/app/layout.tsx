import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@heroui/react";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

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
    <html lang="vi" className={inter.className}>
      <body className={inter.className}>
        <SessionProvider>
          <QueryProvider>
            {children}
            <ToastProvider placement="bottom" />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
