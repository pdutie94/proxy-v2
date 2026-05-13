"use client";

import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import Link from "next/link";

// Create a custom link component that uses Next.js Link
const LinkComponent = ({ children, url, ...rest }: { children?: React.ReactNode; url: string; [key: string]: unknown }) => {
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
LinkComponent.displayName = 'PolarisNextLink';

export function PolarisProvider({ children }: { children: React.ReactNode }) {

  return (
    <AppProvider 
      i18n={enTranslations}
      linkComponent={LinkComponent}
    >
      {children}
    </AppProvider>
  );
}
