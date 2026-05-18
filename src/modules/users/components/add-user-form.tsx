"use client";

import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserSchema } from '../schemas/user.schema';
import { useUsers } from '@/hooks/use-users';
import { Input, Select, ListBox, TextField, Label, FieldError } from "@heroui/react";

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
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 bg-white">
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <TextField isRequired isInvalid={!!fieldState.error}>
              <Label>Địa chỉ Email</Label>
              <Input
                type="email"
                placeholder="vidu@example.com"
                value={field.value}
                onChange={field.onChange}
              />
              <FieldError />
            </TextField>
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <TextField isRequired={!user} isInvalid={!!fieldState.error}>
              <Label>{user ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}</Label>
              <Input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={field.value}
                onChange={field.onChange}
              />
              <FieldError />
            </TextField>
          )}
        />

        <Controller
          name="role"
          control={control}
          render={({ field, fieldState }) => (
            <Select
              selectedKey={field.value}
              onSelectionChange={(key) => field.onChange(key as string)}
              className="w-full"
              isRequired
              isInvalid={!!fieldState.error}
            >
              <Label>Vai trò hệ thống</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {[
                    { value: 'USER', label: 'Người dùng' },
                    { value: 'MODERATOR', label: 'Điều hành viên (Moderator)' },
                    { value: 'ADMIN', label: 'Quản trị viên' }
                  ].map(opt => (
                    <ListBox.Item
                      key={opt.value}
                      id={opt.value}
                      textValue={opt.label}
                    >
                      {opt.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
              <FieldError />
            </Select>
          )}
        />
      </form>
    );
  }
);

AddUserForm.displayName = 'AddUserForm';
