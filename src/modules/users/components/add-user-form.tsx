"use client";

import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserSchema } from '../schemas/user.schema';
import { useUsers } from '@/hooks/use-users';
import { Input } from "@heroui/react";

import { useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { User } from '@prisma/client';

interface AddUserFormProps {
  onClose: () => void;
  user?: User;
}

export interface AddUserFormRef {
  submit: () => void;
}

export const AddUserForm = forwardRef<AddUserFormRef, AddUserFormProps>(
  ({ onClose, user }, ref) => {
    const { createMutation, updateMutation } = useUsers();
    
    const { control, handleSubmit, formState: { errors }, reset } = useForm<UserSchema>({
      resolver: zodResolver(userSchema),
      defaultValues: {
        email: '',
        password: '',
        role: 'USER',
      }
    });

    useEffect(() => {
      if (user) {
        reset({
          email: user.email,
          role: user.role,
          password: '', // Không reset mật khẩu cũ
        });
      }
    }, [user, reset]);

    const onSubmit = useCallback((data: UserSchema) => {
      if (user) {
        updateMutation.mutate({ id: user.id, data }, {
          onSuccess: () => onClose(),
        });
      } else {
        createMutation.mutate(data, {
          onSuccess: () => onClose(),
        });
      }
    }, [createMutation, updateMutation, onClose, user]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        handleSubmit(onSubmit)();
      }
    }));

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3.5">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-500">Địa chỉ Email</label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                placeholder="vidu@example.com"
                value={field.value}
                onChange={field.onChange}
                className={`w-full h-9 px-2.5 text-xs bg-white placeholder:text-slate-300 border rounded-lg outline-none transition-all duration-150 ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                }`}
              />
            )}
          />
          {errors.email && (
            <p className="mt-1 text-[10px] text-red-500 font-semibold">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-500">
            {user ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}
          </label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={field.value}
                onChange={field.onChange}
                className={`w-full h-9 px-2.5 text-xs bg-white placeholder:text-slate-300 border rounded-lg outline-none transition-all duration-150 ${
                  errors.password 
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                }`}
              />
            )}
          />
          {errors.password && (
            <p className="mt-1 text-[10px] text-red-500 font-semibold">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-500">Vai trò hệ thống</label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <select
                  value={field.value}
                  onChange={field.onChange}
                  className="w-full text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg h-9 px-3 outline-none cursor-pointer appearance-none transition-all duration-150"
                >
                  <option value="USER">Người dùng</option>
                  <option value="MODERATOR">Điều hành viên (Moderator)</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                  <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5"  />
                </div>
              </div>
            )}
          />
          {errors.role && (
            <p className="text-[10px] font-semibold text-red-500 mt-1">
              {errors.role.message}
            </p>
          )}
        </div>
      </form>
    );
  }
);

AddUserForm.displayName = 'AddUserForm';
