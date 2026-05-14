"use client";

import { Page, EmptyState } from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function UserNotFound() {
  const router = useRouter();

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleGoHome = useCallback(() => {
    router.push('/user/proxies');
  }, [router]);

  return (
    <Page>
      <EmptyState
        heading="Không tìm thấy trang bạn yêu cầu"
        action={{
          content: 'Về trang chủ',
          onAction: handleGoHome,
        }}
        secondaryAction={{
          content: 'Quay lại',
          onAction: handleGoBack,
        }}
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Vui lòng kiểm tra lại đường dẫn hoặc sử dụng menu điều hướng để tìm trang bạn cần.</p>
      </EmptyState>
    </Page>
  );
}
