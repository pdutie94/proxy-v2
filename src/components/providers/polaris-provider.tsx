"use client";

import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";

export function PolarisProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Create a custom link component that uses Next.js Link
  const LinkComponent = useMemo(() => {
    return ({ children, url, ...rest }: any) => {
      // If the URL is external, use a regular anchor
      if (url.startsWith('http') || url.startsWith('mailto:')) {
        return (
          <a href={url} {...rest}>
            {children}
          </a>
        );
      }

      return (
        <Link href={url} {...rest}>
          {children}
        </Link>
      );
    };
  }, []);

  return (
    <AppProvider 
      i18n={enTranslations}
      linkComponent={LinkComponent}
    >
      {children}
    </AppProvider>
  );
}
