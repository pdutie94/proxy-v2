'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '../types';
import { registerAction } from '../actions/register.action';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Input, Button } from "@heroui/react";
import { CheckCircle2 } from "lucide-react";

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
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 shrink-0" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Đăng ký thành công!</h2>
        <p className="text-slate-600 mb-8 leading-relaxed text-sm font-medium">
          Chúng tôi đã gửi một email xác nhận tới địa chỉ của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác) để kích hoạt tài khoản.
        </p>
        <Button 
          onClick={() => router.push('/login')}
          className="w-full h-9 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 cursor-pointer transition-colors flex items-center justify-center"
        >
          Đi tới Đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Đăng ký tài khoản</h1>
        <p className="text-slate-500 mt-2 text-sm font-medium">Bắt đầu trải nghiệm dịch vụ Proxy cao cấp</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600">Địa chỉ Email</label>
          <Input
            {...register('email')}
            type="email"
            placeholder="your@email.com"
            className={`w-full h-9 px-3 text-sm bg-white border rounded-lg outline-none transition-colors duration-150 ${
              errors.email 
                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600">Mật khẩu</label>
          <Input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className={`w-full h-9 px-3 text-sm bg-white border rounded-lg outline-none transition-colors duration-150 ${
              errors.password 
                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            }`}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600">Xác nhận mật khẩu</label>
          <Input
            {...register('confirmPassword')}
            type="password"
            placeholder="••••••••"
            className={`w-full h-9 px-3 text-sm bg-white border rounded-lg outline-none transition-colors duration-150 ${
              errors.confirmPassword 
                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            }`}
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>}
        </div>

        <Button
          type="submit"
          isDisabled={loading}
          className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg mt-2 cursor-pointer transition-colors duration-150 flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          )}
          Đăng ký ngay
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500 font-medium">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-bold">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
