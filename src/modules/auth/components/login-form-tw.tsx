'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '../types';
import { signIn, getSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      // 1. Pre-check user status to show custom errors without NextAuth swallowing them
      const res = await fetch('/api/auth/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });
      const statusData = await res.json();
      
      if (!statusData.success && statusData.error === 'AccountLocked') {
        toast.error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
        setLoading(false);
        return;
      }

      // 2. Proceed with NextAuth signin
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Email hoặc mật khẩu không chính xác');
      } else {
        toast.success('Đăng nhập thành công');
        
        // Lấy session mới nhất để kiểm tra role
        const session = await getSession();
        if (session?.user?.role === 'ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/user/proxies');
        }
        
        router.refresh();
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Chào mừng trở lại</h1>
        <p className="text-slate-500 mt-2">Đăng nhập để quản lý Proxy của bạn</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Địa chỉ Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="admin@example.com"
            className={`w-full h-10 px-3 text-sm border rounded-md outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${
              errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <label className="block text-xs font-medium text-slate-600">Mật khẩu</label>
            <a href="#" className="text-xs text-blue-600 hover:underline">Quên mật khẩu?</a>
          </div>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : null}
          Đăng nhập ngay
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
