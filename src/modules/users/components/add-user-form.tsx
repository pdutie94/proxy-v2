"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserSchema } from '../schemas/user.schema';
import { useUsers } from '@/hooks/use-users';
import { Role } from '@prisma/client';
import { 
  Form, 
  FormLayout, 
  TextField, 
  Select, 
  Button, 
  InlineStack,
  BlockStack
} from "@shopify/polaris";
import { useCallback } from 'react';

interface AddUserFormProps {
  onClose: () => void;
}

export function AddUserForm({ onClose }: AddUserFormProps) {
  const { createMutation } = useUsers();
  const { control, handleSubmit, formState: { errors } } = useForm<UserSchema>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: Role.USER,
    }
  });

  const onSubmit = useCallback((data: UserSchema) => {
    createMutation.mutate(data, {
      onSuccess: () => onClose(),
    });
  }, [createMutation, onClose]);

  const roleOptions = [
    { label: 'User', value: Role.USER },
    { label: 'Admin', value: Role.ADMIN },
  ];

  return (
    <Form id="add-user-form" onSubmit={handleSubmit(onSubmit)}>
      <FormLayout>
        <FormLayout.Group>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                label="Email Address"
                type="email"
                autoComplete="email"
                placeholder="user@example.com"
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
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={field.value}
                onChange={field.onChange}
                error={errors.password?.message}
              />
            )}
          />
        </FormLayout.Group>

        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select
              label="Role"
              options={roleOptions}
              onChange={field.onChange}
              value={field.value}
            />
          )}
        />
      </FormLayout>
    </Form>
  );
}
