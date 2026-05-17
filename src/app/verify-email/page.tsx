"use client";

import { useState } from 'react';
import { toast } from '@heroui/react';

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
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="code" className="sr-only">Mã xác thực</label>
              <input
                id="code"
                name="code"
                type="text"
                maxLength={6}
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-lg tracking-[0.5em] text-center"
                placeholder="------"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Đang xác thực...' : 'Xác thực ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
