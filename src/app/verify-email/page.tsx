"use client";

import { useState } from 'react';
import { toast, InputOTP, Button } from '@heroui/react';

export default function VerifyEmailPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.danger("Vui lòng nhập mã OTP gồm 6 chữ số");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Xác thực Email thành công!");
        // Force refresh session by reloading or redirecting to proxies page
        window.location.href = '/user/proxies';
      } else {
        toast.danger(data.message || "Xác thực thất bại");
      }
    } catch {
      toast.danger("Lỗi kết nối");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 border border-slate-200 rounded-lg shadow-sm">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Xác thực Email
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Vui lòng nhập mã OTP 6 số được gửi đến email của bạn để tiếp tục mua hàng.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
            >
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
                <InputOTP.Slot index={3} />
                <InputOTP.Slot index={4} />
                <InputOTP.Slot index={5} />
              </InputOTP.Group>
            </InputOTP>
          </div>

          <div>
            <Button
              type="submit"
              isDisabled={isLoading || code.length !== 6}
              className="w-full font-semibold h-10 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center cursor-pointer shadow-none border-none outline-none"
            >
              {isLoading ? 'Đang xác thực...' : 'Xác thực ngay'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
