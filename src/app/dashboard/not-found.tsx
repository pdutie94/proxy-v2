"use client";

import { Icon } from '@iconify/react';
import { Button } from "@heroui/react";
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-5 bg-white border border-slate-200 rounded-xl max-w-md mx-auto my-12 shadow-sm">
      <div className="p-4 bg-slate-50 rounded-full border border-slate-100">
        <Icon icon="lucide:help-circle" className="w-12 h-12 text-slate-400"  />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-base font-bold text-slate-800">Không tìm thấy trang bạn yêu cầu</h1>
        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
          Vui lòng kiểm tra lại đường dẫn hoặc sử dụng menu điều hướng để tìm trang bạn cần.
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          size="sm"
          onPress={handleGoBack}
          className="cursor-pointer font-bold text-xs h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        >
          Quay lại
        </Button>
        <Button
          size="sm"
          variant="primary"
          onPress={handleGoHome}
          className="cursor-pointer font-bold text-xs h-9 px-4 rounded-lg"
        >
          Về trang chủ
        </Button>
      </div>
    </div>
  );
}
