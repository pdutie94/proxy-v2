'use client';

import { Icon } from '@iconify/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '../types';
import { registerAction } from '../actions/register.action';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@heroui/react';
import { Input, Button, TextField, Label, FieldError } from "@heroui/react";


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
      toast.danger(result.message);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-[360px] p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon icon="lucide:check-circle2" className="w-6 h-6 shrink-0"  />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Đăng ký thành công!</h2>
        <p className="text-slate-500 mb-6 leading-relaxed text-xs font-medium">
          Chúng tôi đã gửi một email xác nhận tới địa chỉ của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác) để kích hoạt tài khoản.
        </p>
        <Button 
          onClick={() => router.push('/login')}
          className="w-full h-9 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 cursor-pointer transition-colors flex items-center justify-center"
        >
          Đi tới Đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[360px] p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="mb-5 text-center">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Đăng ký tài khoản</h1>
        <p className="text-slate-400 mt-1 text-xs font-medium">Bắt đầu trải nghiệm dịch vụ Proxy cao cấp</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextField isRequired isInvalid={!!errors.email}>
          <Label>Địa chỉ Email</Label>
          <Input
            {...register('email')}
            type="email"
            placeholder="your@email.com"
          />
          <FieldError />
        </TextField>

        <TextField isRequired isInvalid={!!errors.password}>
          <Label>Mật khẩu</Label>
          <Input
            {...register('password')}
            type="password"
            placeholder="••••••••"
          />
          <FieldError />
        </TextField>

        <TextField isRequired isInvalid={!!errors.confirmPassword}>
          <Label>Xác nhận mật khẩu</Label>
          <Input
            {...register('confirmPassword')}
            type="password"
            placeholder="••••••••"
          />
          <FieldError />
        </TextField>

        <Button
          type="submit"
          isDisabled={loading}
          className="w-full mt-1"
        >
          {loading && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          )}
          <span>Đăng ký ngay</span>
        </Button>
      </form>

      <div className="mt-5 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-bold">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
