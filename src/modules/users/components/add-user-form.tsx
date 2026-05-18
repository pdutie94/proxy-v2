"use client";

import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserSchema } from '../schemas/user.schema';
import { useUsers } from '@/hooks/use-users';
import { Input, Select, ListBox } from "@heroui/react";

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
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3.5 bg-white">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-500">Địa chỉ Email</label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                placeholder="vidu@example.com"
                value={field.value}
                onChange={field.onChange}
                className={`w-full h-9 px-2.5 text-sm bg-white placeholder:text-slate-300 border rounded-lg outline-none transition-all duration-150 ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                }`}
              />
            )}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-500">
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
                className={`w-full h-9 px-2.5 text-sm bg-white placeholder:text-slate-300 border rounded-lg outline-none transition-all duration-150 ${
                  errors.password 
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                }`}
              />
            )}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-500">Vai trò hệ thống</label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                selectedKey={field.value}
                onSelectionChange={(key) => field.onChange(key as string)}
                className="w-full"
              >
                <Select.Trigger className="w-full flex items-center justify-between text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg h-9 px-3 outline-none cursor-pointer transition-all duration-150">
                  <Select.Value />
                  <Select.Indicator>
                    <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-slate-400" />
                  </Select.Indicator>
                </Select.Trigger>
                <Select.Popover className="w-[--trigger-width] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                  <ListBox className="p-1 outline-none">
                    {[
                      { value: 'USER', label: 'Người dùng' },
                      { value: 'MODERATOR', label: 'Điều hành viên (Moderator)' },
                      { value: 'ADMIN', label: 'Quản trị viên' }
                    ].map(opt => (
                      <ListBox.Item
                        key={opt.value}
                        id={opt.value}
                        textValue={opt.label}
                        className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded text-slate-600 hover:bg-slate-50 cursor-pointer outline-none data-[focused]:bg-slate-100 data-[selected]:bg-slate-100 data-[selected]:text-blue-600 font-medium"
                      >
                        {({ isSelected }) => (
                          <>
                            <span>{opt.label}</span>
                            {isSelected && (
                              <Icon icon="lucide:check" className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </>
                        )}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}
          />
          {errors.role && (
            <p className="text-sm font-medium text-red-500 mt-1">
              {errors.role.message}
            </p>
          )}
        </div>
      </form>
    );
  }
);

AddUserForm.displayName = 'AddUserForm';
