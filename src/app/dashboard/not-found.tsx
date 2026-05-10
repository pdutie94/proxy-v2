"use client";

import { Page, EmptyState } from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function DashboardNotFound() {
  const router = useRouter();

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleGoHome = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <Page>
      <EmptyState
        heading="The page you’re looking for can’t be found"
        action={{
          content: 'Back to overview',
          onAction: handleGoHome,
        }}
        secondaryAction={{
          content: 'Go back',
          onAction: handleGoBack,
        }}
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Check the web address and try again, or use the navigation to find what you need.</p>
      </EmptyState>
    </Page>
  );
}
