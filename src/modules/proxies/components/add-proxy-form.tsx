"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bulkProxySchema, BulkProxySchema } from '../schemas/bulk-proxy.schema';
import { useProxies } from '@/hooks/use-proxies';
import { useServers } from '@/hooks/use-servers';
import { 
  FormLayout, 
  TextField, 
  Select, 
  Popover,
  DatePicker,
  Box,
  Icon,
  ChoiceList,
  Button
} from "@shopify/polaris";
import { CalendarIcon, RefreshIcon } from "@shopify/polaris-icons";
import { useCallback, useState, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { format } from 'date-fns';
import { Proxy } from '@prisma/client';
import { generateRandomString, generateRandomPassword } from '@/utils/random';

interface AddProxyFormProps {
  onClose: () => void;
  proxy?: Proxy;
}

export interface AddProxyFormRef {
  submit: () => void;
}

export const AddProxyForm = forwardRef<AddProxyFormRef, AddProxyFormProps>(
  ({ onClose, proxy }, ref) => {
    const { bulkCreateMutation, updateMutation } = useProxies();
    const { servers } = useServers();
    const [popoverActive, setPopoverActive] = useState(false);
    
    const form = useForm<BulkProxySchema>({
      resolver: zodResolver(bulkProxySchema),
      defaultValues: {
        serverId: '',
        startPort: 10000,
        count: 10,
        username: generateRandomString(6),
        password: generateRandomPassword(6),
        ipType: 'IPv6',
        expiresAt: '',
      }
    });

    const selectedServerId = form.watch('serverId');

    useEffect(() => {
      if (selectedServerId && !proxy) {
        const server = servers.find(s => s.id === selectedServerId);
        if (server) {
          const nextPort = server.lastPort ? server.lastPort + 1 : server.startPort;
          form.setValue('startPort', nextPort);
        }
      }
    }, [selectedServerId, servers, form, proxy]);

    useEffect(() => {
      if (proxy) {
        form.reset({
          serverId: proxy.serverId,
          startPort: proxy.port,
          count: 1,
          username: proxy.username,
          password: proxy.password,
          ipType: proxy.ipType as any,
          expiresAt: proxy.expiresAt ? format(new Date(proxy.expiresAt), 'yyyy-MM-dd') : '',
        });
      }
    }, [proxy, form]);

    const onSubmit = useCallback((data: BulkProxySchema) => {
      if (proxy) {
        const updateData = {
          serverId: data.serverId,
          port: data.startPort,
          username: data.username,
          password: data.password,
          ipType: data.ipType,
          expiresAt: data.expiresAt
        };
        updateMutation.mutate({ id: proxy.id, data: updateData as any }, {
          onSuccess: () => onClose(),
        });
      } else {
        bulkCreateMutation.mutate(data, {
          onSuccess: () => onClose(),
        });
      }
    }, [bulkCreateMutation, updateMutation, onClose, proxy]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.handleSubmit(onSubmit)();
      }
    }));

    const serverOptions = useMemo(() => [
      { label: 'Chọn máy chủ', value: '' },
      ...servers.map((server) => ({
        label: `${server.name} (${server.host})`,
        value: server.id,
      }))
    ], [servers]);

    const togglePopoverActive = useCallback(
      () => setPopoverActive((active) => !active),
      [],
    );

    const refreshRandom = () => {
      form.setValue('username', generateRandomString(6));
      form.setValue('password', generateRandomPassword(6));
    };

    return (
      <Box padding="400">
        <FormLayout>
          <FormLayout.Group>
            <Controller
              name="serverId"
              control={form.control}
              render={({ field }) => (
                <Select
                  label="Máy chủ đích"
                  options={serverOptions}
                  onChange={field.onChange}
                  value={field.value}
                  error={form.formState.errors.serverId?.message}
                  disabled={!!proxy}
                />
              )}
            />
            <Controller
              name="count"
              control={form.control}
              render={({ field }) => (
                <TextField
                  label="Số lượng Proxy"
                  type="number"
                  autoComplete="off"
                  placeholder="10"
                  value={field.value?.toString()}
                  onChange={(val) => field.onChange(parseInt(val))}
                  error={form.formState.errors.count?.message}
                  disabled={!!proxy}
                  helpText={!proxy ? "Tối đa 1000 proxy một lần tạo" : "Đang ở chế độ chỉnh sửa"}
                />
              )}
            />
          </FormLayout.Group>

          <FormLayout.Group>
            <Controller
              name="startPort"
              control={form.control}
              render={({ field }) => (
                <TextField
                  label={proxy ? "Cổng (Port)" : "Cổng bắt đầu"}
                  type="number"
                  autoComplete="off"
                  placeholder="10000"
                  value={field.value?.toString()}
                  onChange={(val) => field.onChange(parseInt(val))}
                  error={form.formState.errors.startPort?.message}
                  helpText={!proxy ? "Các port sẽ được tăng dần từ cổng này" : ""}
                />
              )}
            />
            <Controller
              name="username"
              control={form.control}
              render={({ field }) => (
                <TextField
                  label="Tài khoản"
                  autoComplete="off"
                  placeholder="Ví dụ: user"
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.username?.message}
                  suffix={
                    <Button icon={RefreshIcon} variant="tertiary" onClick={refreshRandom} />
                  }
                />
              )}
            />
          </FormLayout.Group>

          <FormLayout.Group>
            <Controller
              name="password"
              control={form.control}
              render={({ field }) => (
                <TextField
                  label="Mật khẩu"
                  type="text"
                  autoComplete="off"
                  placeholder="Mật khẩu"
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.password?.message}
                />
              )}
            />
            <Controller
              name="ipType"
              control={form.control}
              render={({ field }) => (
                <ChoiceList
                  title="Loại IP Outbound"
                  choices={[
                    { label: 'IPv4 (Dùng IP Server)', value: 'IPv4' },
                    { label: 'IPv6 (Xoay IP ngẫu nhiên)', value: 'IPv6' },
                  ]}
                  selected={[field.value]}
                  onChange={(val) => field.onChange(val[0])}
                />
              )}
            />
          </FormLayout.Group>

          <FormLayout.Group>
            <Box>
              <Popover
                active={popoverActive}
                activator={
                  <TextField
                    label="Ngày hết hạn (Tùy chọn)"
                    autoComplete="off"
                    prefix={<Icon source={CalendarIcon} />}
                    value={form.watch('expiresAt') ? format(new Date(form.watch('expiresAt') as any), 'dd/MM/yyyy') : ''}
                    onFocus={togglePopoverActive}
                    placeholder="Chọn ngày hết hạn"
                  />
                }
                onClose={togglePopoverActive}
              >
                <Box padding="400">
                  <DatePicker
                    month={new Date(form.watch('expiresAt') || new Date()).getMonth()}
                    year={new Date(form.watch('expiresAt') || new Date()).getFullYear()}
                    onChange={(date) => {
                      form.setValue('expiresAt', format(date.start, 'yyyy-MM-dd'));
                      togglePopoverActive();
                    }}
                    selected={form.watch('expiresAt') ? new Date(form.watch('expiresAt') as any) : new Date()}
                  />
                </Box>
              </Popover>
            </Box>
            <Box />
          </FormLayout.Group>
        </FormLayout>
      </Box>
    );
  }
);

AddProxyForm.displayName = 'AddProxyForm';
