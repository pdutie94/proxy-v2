"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serverSchema, ServerSchema } from '../schemas/server.schema';
import { useServers } from '@/hooks/use-servers';
import { 
  Form, 
  FormLayout, 
  TextField, 
  Box,
  Checkbox,
  Text,
  Tooltip,
  Icon,
  InlineStack,
  Select
} from "@shopify/polaris";
import { InfoIcon } from "@shopify/polaris-icons";
import { useCallback, forwardRef, useImperativeHandle, useEffect, useMemo } from 'react';
import { Server } from '@prisma/client';
import { useLocations } from '@/modules/locations/hooks/use-locations';

interface AddServerFormProps {
  onClose: () => void;
  server?: Server;
}

export interface AddServerFormRef {
  submit: () => void;
}

export const AddServerForm = forwardRef<AddServerFormRef, AddServerFormProps>(
  ({ onClose, server }, ref) => {
    const { createMutation, updateMutation } = useServers();
    const { data: locationsData } = useLocations();

    const locationOptions = useMemo(() => {
      const options = (locationsData || []).map(loc => ({
        label: `${getFlagEmoji(loc.countryCode)} ${loc.name}`,
        value: loc.id
      }));
      return [{ label: 'Chọn vị trí...', value: '' }, ...options];
    }, [locationsData]);
    
    const { control, handleSubmit, formState: { errors }, reset, watch } = useForm<ServerSchema>({
      resolver: zodResolver(serverSchema),
      defaultValues: {
        name: '',
        host: '',
        port: 22,
        username: 'root',
        password: '',
        ipv6: '',
        maxProxies: 100,
        startPort: 10000,
        autoRotate: false,
        rotationInterval: 0,
        locationId: '',
      }
    });

    const isAutoRotate = watch('autoRotate');

    useEffect(() => {
      if (server) {
        reset({
          name: server.name,
          host: server.host,
          port: server.port,
          username: server.username,
          ipv6: server.ipv6 || '',
          maxProxies: server.maxProxies,
          startPort: server.startPort,
          autoRotate: server.autoRotate,
          rotationInterval: server.rotationInterval,
          locationId: server.locationId || '',
          password: '',
        });
      }
    }, [server, reset]);

    const onSubmit = useCallback((data: ServerSchema) => {
      if (server) {
        updateMutation.mutate({ id: server.id, data }, {
          onSuccess: () => onClose(),
        });
      } else {
        createMutation.mutate(data, {
          onSuccess: () => onClose(),
        });
      }
    }, [createMutation, updateMutation, onClose, server]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        handleSubmit(onSubmit)();
      }
    }));

    return (
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Box padding="400">
          <FormLayout>
            <FormLayout.Group>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Tên Máy chủ"
                    autoComplete="off"
                    placeholder="Ví dụ: US-West-01"
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
                    label="Địa chỉ IP / Hostname"
                    autoComplete="off"
                    placeholder="Ví dụ: 1.2.3.4"
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
                    label="Cổng SSH"
                    type="number"
                    autoComplete="off"
                    placeholder="22"
                    value={field.value?.toString()}
                    onChange={(val) => field.onChange(parseInt(val))}
                    error={errors.port?.message}
                  />
                )}
              />
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Tài khoản SSH"
                    autoComplete="username"
                    placeholder="root"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.username?.message}
                  />
                )}
              />
            </FormLayout.Group>

            <FormLayout.Group>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    label={server ? "Mật khẩu SSH (Để trống nếu không đổi)" : "Mật khẩu SSH"}
                    type="password"
                    autoComplete="current-password"
                    placeholder="Mật khẩu"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.password?.message}
                  />
                )}
              />
              <Controller
                name="ipv6"
                control={control}
                render={({ field }) => (
                  <TextField
                    label={
                      <InlineStack gap="100">
                        <Text as="span">IPv6 Prefix</Text>
                        <Tooltip content="Nhập 4 cụm đầu của dải IPv6 được cấp (Ví dụ: 2001:19f0:4401:903)">
                          <Icon source={InfoIcon} tone="subdued" />
                        </Tooltip>
                      </InlineStack>
                    }
                    autoComplete="off"
                    placeholder="Ví dụ: 2001:19f0:4401:903"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.ipv6?.message}
                  />
                )}
              />
            </FormLayout.Group>

            <FormLayout.Group>
              <Controller
                name="locationId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Vị trí máy chủ"
                    options={locationOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    error={errors.locationId?.message}
                  />
                )}
              />
              <Controller
                name="maxProxies"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Số lượng Proxy tối đa"
                    type="number"
                    autoComplete="off"
                    placeholder="100"
                    value={field.value?.toString()}
                    onChange={(val) => field.onChange(parseInt(val))}
                    error={errors.maxProxies?.message}
                  />
                )}
              />
            </FormLayout.Group>

            <FormLayout.Group>
              <Controller
                name="startPort"
                control={control}
                render={({ field }) => (
                  <TextField
                    label={
                      <InlineStack gap="100">
                        <Text as="span">Cổng bắt đầu</Text>
                        <Tooltip content="Cổng mặc định khi tạo Proxy hàng loạt (Ví dụ: 10000)">
                          <Icon source={InfoIcon} tone="subdued" />
                        </Tooltip>
                      </InlineStack>
                    }
                    type="number"
                    autoComplete="off"
                    placeholder="10000"
                    value={field.value?.toString()}
                    onChange={(val) => field.onChange(parseInt(val))}
                    error={errors.startPort?.message}
                  />
                )}
              />
              <Controller
                name="autoRotate"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="Tự động xoay IPv6"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormLayout.Group>

            {isAutoRotate && (
              <FormLayout.Group>
                <Controller
                  name="rotationInterval"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label={
                        <InlineStack gap="100">
                          <Text as="span">Chu kỳ xoay (Phút)</Text>
                          <Tooltip content="Hệ thống sẽ tự động đổi toàn bộ IP Proxy sau mỗi X phút">
                            <Icon source={InfoIcon} tone="subdued" />
                          </Tooltip>
                        </InlineStack>
                      }
                      type="number"
                      autoComplete="off"
                      placeholder="60"
                      value={field.value?.toString()}
                      onChange={(val) => field.onChange(parseInt(val))}
                    />
                  )}
                />
              </FormLayout.Group>
            )}
          </FormLayout>
        </Box>
      </Form>
    );
  }
);

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

AddServerForm.displayName = 'AddServerForm';
