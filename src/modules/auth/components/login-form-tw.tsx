'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '../types';
import { signIn, getSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Input, Button } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";

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
        <p className="text-slate-500 mt-2 text-sm font-medium">Đăng nhập để quản lý Proxy của bạn</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600">Địa chỉ Email</label>
          <Input
            {...register('email')}
            type="email"
            placeholder="admin@example.com"
            className={`w-full h-9 px-3 text-sm bg-white border rounded-lg outline-none transition-colors duration-150 ${
              errors.email 
                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-slate-600">Mật khẩu</label>
            <a href="#" className="text-xs text-blue-600 hover:underline font-semibold">Quên mật khẩu?</a>
          </div>
          <div className="relative">
            <Input
              {...register('password')}
              type={isVisible ? "text" : "password"}
              placeholder="••••••••"
              className={`w-full h-9 pl-3 pr-10 text-sm bg-white border rounded-lg outline-none transition-colors duration-150 ${
                errors.password 
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
            />
            <button 
              type="button" 
              onClick={toggleVisibility} 
              className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none cursor-pointer text-slate-400 hover:text-slate-600 flex items-center justify-center p-0.5 rounded-full"
            >
              {isVisible ? <EyeOff className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          isDisabled={loading}
          className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg mt-2 cursor-pointer transition-colors duration-150 flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          )}
          Đăng nhập ngay
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500 font-medium">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-bold">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
