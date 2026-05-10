"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serverSchema, ServerSchema } from '../schemas/server.schema';
import { useServers } from '@/hooks/use-servers';
import { ServerAuthType } from '@prisma/client';
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

interface AddServerFormProps {
  onClose: () => void;
}

export function AddServerForm({ onClose }: AddServerFormProps) {
  const { createMutation } = useServers();
  const { control, handleSubmit, watch, formState: { errors } } = useForm<ServerSchema>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      authType: ServerAuthType.PASSWORD,
      port: 22,
      maxProxies: 100,
    },
  });

  const authType = watch('authType');

  const onSubmit = useCallback((data: ServerSchema) => {
    createMutation.mutate(data, {
      onSuccess: () => onClose(),
    });
  }, [createMutation, onClose]);

  const authTypeOptions = [
    { label: 'Password', value: ServerAuthType.PASSWORD },
    { label: 'SSH Key', value: ServerAuthType.SSH_KEY },
  ];

  return (
    <Form id="add-server-form" onSubmit={handleSubmit(onSubmit)}>
      <FormLayout>
        <FormLayout.Group>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                label="Server Name"
                placeholder="Primary Server"
                autoComplete="off"
                value={field.value}
                onChange={field.onChange}
                error={errors.name?.message}
              />
            )}
          />
          <Controller
            name="host"
            control={control}
            render={({ field }) => (
              <TextField
                label="Host / IP"
                placeholder="1.2.3.4"
                autoComplete="off"
                value={field.value}
                onChange={field.onChange}
                error={errors.host?.message}
              />
            )}
          />
        </FormLayout.Group>

        <FormLayout.Group>
          <Controller
            name="port"
            control={control}
            render={({ field }) => (
              <TextField
                label="SSH Port"
                type="number"
                autoComplete="off"
                value={field.value?.toString()}
                onChange={(val) => field.onChange(parseInt(val))}
              />
            )}
          />
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <TextField
                label="SSH User"
                placeholder="root"
                autoComplete="username"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="authType"
            control={control}
            render={({ field }) => (
              <Select
                label="Auth Type"
                options={authTypeOptions}
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
        </FormLayout.Group>

        {authType === ServerAuthType.PASSWORD ? (
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                label="SSH Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        ) : (
          <Controller
            name="privateKey"
            control={control}
            render={({ field }) => (
              <TextField
                label="Private Key"
                multiline={4}
                placeholder="-----BEGIN RSA PRIVATE KEY-----"
                autoComplete="off"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}
      </FormLayout>
    </Form>
  );
}
