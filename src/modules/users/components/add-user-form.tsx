"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserSchema } from '../schemas/user.schema';
import { useUsers } from '@/hooks/use-users';
import { 
  Form, 
  FormLayout, 
  TextField, 
  Select, 
  Box
} from "@shopify/polaris";
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
      resolver: zodResolver(userSchema) as any,
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
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Box padding="400">
          <FormLayout>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Địa chỉ Email"
                  type="email"
                  autoComplete="email"
                  placeholder="vidu@example.com"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  label={user ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.password?.message}
                />
              )}
            />
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  label="Vai trò hệ thống"
                  options={[
                    { label: 'Người dùng', value: 'USER' },
                    { label: 'Điều hành viên (Moderator)', value: 'MODERATOR' },
                    { label: 'Quản trị viên', value: 'ADMIN' },
                  ]}
                  onChange={field.onChange}
                  value={field.value}
                  error={errors.role?.message}
                />
              )}
            />
          </FormLayout>
        </Box>
      </Form>
    );
  }
);

AddUserForm.displayName = 'AddUserForm';
