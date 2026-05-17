'use client';

import { Icon } from '@iconify/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '../types';
import { signIn, getSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@heroui/react';
import { Input, Button } from "@heroui/react";


export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const toggleVisibility = () => setIsVisible(!isVisible);

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
        toast.danger('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
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
        toast.danger('Email hoặc mật khẩu không chính xác');
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
      toast.danger('Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[360px] p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="mb-5 text-center">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Chào mừng trở lại</h1>
        <p className="text-slate-400 mt-1 text-xs font-medium">Đăng nhập để quản lý Proxy của bạn</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-500">Địa chỉ Email</label>
          <Input
            {...register('email')}
            type="email"
            placeholder="admin@example.com"
            className={`w-full h-9 px-2.5 text-xs bg-slate-50/50 placeholder:text-slate-300 border rounded-lg outline-none transition-all duration-150 ${
              errors.email 
                ? 'border-red-500 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/50' 
                : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/50'
            }`}
          />
          {errors.email && <p className="mt-1 text-[10px] text-red-500 font-semibold">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="block text-[11px] font-semibold text-slate-500">Mật khẩu</label>
            <a href="#" className="text-[10px] text-blue-600 hover:underline font-bold">Quên mật khẩu?</a>
          </div>
          <div className="relative">
            <Input
              {...register('password')}
              type={isVisible ? "text" : "password"}
              placeholder="••••••••"
              className={`w-full h-9 pl-2.5 pr-9 text-xs bg-slate-50/50 placeholder:text-slate-300 border rounded-lg outline-none transition-all duration-150 ${
                errors.password 
                  ? 'border-red-500 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/50' 
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/50'
              }`}
            />
            <button 
              type="button" 
              onClick={toggleVisibility} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 focus:outline-none cursor-pointer text-slate-400 hover:text-slate-600 flex items-center justify-center p-0.5 rounded-full"
            >
              {isVisible ? <Icon icon="lucide:eye-off" className="w-3.5 h-3.5 shrink-0"  /> : <Icon icon="lucide:eye" className="w-3.5 h-3.5 shrink-0"  />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-[10px] text-red-500 font-semibold">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          isDisabled={loading}
          className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg mt-1 cursor-pointer transition-colors duration-150 flex items-center justify-center gap-1.5"
        >
          {loading && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          )}
          Đăng nhập ngay
        </Button>
      </form>

      <div className="mt-5 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-bold">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
