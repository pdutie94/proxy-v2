'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '../types';
import { registerAction } from '../actions/register.action';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    const result = await registerAction(data);
    setLoading(false);

    if (result.success) {
      setIsSuccess(true);
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Đăng ký thành công!</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Chúng tôi đã gửi một email xác nhận tới địa chỉ của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác) để kích hoạt tài khoản.
        </p>
        <button 
          onClick={() => router.push('/login')}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Đi tới Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Đăng ký tài khoản</h1>
        <p className="text-slate-500 mt-2">Bắt đầu trải nghiệm dịch vụ Proxy cao cấp</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Địa chỉ Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="your@email.com"
            className={`w-full h-10 px-3 text-sm border rounded-md outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${
              errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Mật khẩu</label>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className={`w-full h-10 px-3 text-sm border rounded-md outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${
              errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
            }`}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Xác nhận mật khẩu</label>
          <input
            {...register('confirmPassword')}
            type="password"
            placeholder="••••••••"
            className={`w-full h-10 px-3 text-sm border rounded-md outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${
              errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
            }`}
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : null}
          Đăng ký ngay
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
