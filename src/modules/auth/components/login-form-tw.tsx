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
import { Input, Button, TextField, Label, FieldError, InputGroup } from "@heroui/react";


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
        
        setTimeout(() => {
          router.refresh();
        }, 100);
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextField isRequired isInvalid={!!errors.email}>
          <Label>Địa chỉ Email</Label>
          <InputGroup>
            <InputGroup.Prefix>
              <Icon icon="lucide:mail" className="w-3.5 h-3.5 text-slate-400" />
            </InputGroup.Prefix>
            <InputGroup.Input
              {...register('email')}
              type="email"
              className="w-full"
              placeholder="admin@example.com"
            />
          </InputGroup>
          <FieldError>{errors.email?.message}</FieldError>
        </TextField>

        <TextField isRequired isInvalid={!!errors.password}>
          <div className="flex justify-between items-center w-full">
            <Label>Mật khẩu</Label>
            <a href="#" className="text-xs text-blue-600 hover:underline font-bold">Quên mật khẩu?</a>
          </div>
          <InputGroup>
            <InputGroup.Input
              {...register('password')}
              type={isVisible ? "text" : "password"}
              className="w-full"
              placeholder="••••••••"
            />
            <InputGroup.Suffix>
              <button 
                type="button" 
                onClick={toggleVisibility} 
                className="focus:outline-none cursor-pointer text-slate-400 hover:text-slate-600 flex items-center justify-center p-0.5 rounded-full"
              >
                {isVisible ? <Icon icon="lucide:eye-off" className="w-3.5 h-3.5" /> : <Icon icon="lucide:eye" className="w-3.5 h-3.5" />}
              </button>
            </InputGroup.Suffix>
          </InputGroup>
          <FieldError>{errors.password?.message}</FieldError>
        </TextField>

        <Button
          type="submit"
          isDisabled={loading}
          className="w-full mt-1"
        >
          {loading && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          )}
          <span>Đăng nhập ngay</span>
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
