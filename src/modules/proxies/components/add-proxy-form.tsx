"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { proxySchema, ProxySchema } from '../schemas/proxy.schema';
import { useProxies } from '@/hooks/use-proxies';
import { useServers } from '@/hooks/use-servers';
import { 
  Form, 
  FormLayout, 
  TextField, 
  Select, 
  Popover,
  DatePicker,
  Box,
  Icon
} from "@shopify/polaris";
import { CalendarIcon } from "@shopify/polaris-icons";
import { useCallback, useState, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { format } from 'date-fns';
import { Proxy } from '@prisma/client';

interface AddProxyFormProps {
  onClose: () => void;
  proxy?: Proxy;
}

export interface AddProxyFormRef {
  submit: () => void;
}

export const AddProxyForm = forwardRef<AddProxyFormRef, AddProxyFormProps>(
  ({ onClose, proxy }, ref) => {
    const { createMutation, updateMutation } = useProxies();
    const { servers } = useServers();
    const [popoverActive, setPopoverActive] = useState(false);
    
    const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ProxySchema>({
      resolver: zodResolver(proxySchema),
      defaultValues: {
        port: 1080,
        username: '',
        password: '',
        ipv6: '',
        serverId: '',
        expiresAt: '',
      }
    });

    useEffect(() => {
      if (proxy) {
        reset({
          serverId: proxy.serverId,
          port: proxy.port,
          username: proxy.username,
          password: proxy.password,
          ipv6: proxy.ipv6 || '',
          expiresAt: proxy.expiresAt ? format(new Date(proxy.expiresAt), 'yyyy-MM-dd') : '',
        });
      }
    }, [proxy, reset]);

    const expiresAtValue = watch('expiresAt');
    const [{ month, year }, setDate] = useState({ 
      month: new Date().getMonth(), 
      year: new Date().getFullYear() 
    });

    const selectedDate = useMemo(() => {
      return expiresAtValue ? new Date(expiresAtValue) : new Date();
    }, [expiresAtValue]);

    const handleMonthChange = useCallback(
      (month: number, year: number) => setDate({ month, year }),
      [],
    );

    const onSubmit = useCallback((data: ProxySchema) => {
      if (proxy) {
        updateMutation.mutate({ id: proxy.id, data }, {
          onSuccess: () => onClose(),
        });
      } else {
        createMutation.mutate(data, {
          onSuccess: () => onClose(),
        });
      }
    }, [createMutation, updateMutation, onClose, proxy]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        handleSubmit(onSubmit)();
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

    return (
      <Form id="add-proxy-form" onSubmit={handleSubmit(onSubmit)}>
        <Box padding="400">
          <FormLayout>
            <FormLayout.Group>
              <Controller
                name="serverId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Máy chủ đích"
                    options={serverOptions}
                    onChange={field.onChange}
                    value={field.value}
                    error={errors.serverId?.message}
                    disabled={!!proxy} // Không cho đổi server khi edit
                  />
                )}
              />
              <Controller
                name="port"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Cổng Proxy (Port)"
                    type="number"
                    autoComplete="off"
                    placeholder="1080"
                    value={field.value?.toString()}
                    onChange={(val) => field.onChange(parseInt(val))}
                    error={errors.port?.message}
                  />
                )}
              />
            </FormLayout.Group>

            <FormLayout.Group>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Tài khoản Proxy"
                    autoComplete="username"
                    placeholder="Ví dụ: user01"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.username?.message}
                  />
                )}
              />
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Mật khẩu Proxy"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mật khẩu"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.password?.message}
                  />
                )}
              />
            </FormLayout.Group>

            <FormLayout.Group>
              <Controller
                name="ipv6"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Địa chỉ IPv6 (Tùy chọn)"
                    autoComplete="off"
                    placeholder="2001:db8::1"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <Box>
                <Popover
                  active={popoverActive}
                  activator={
                    <TextField
                      label="Ngày hết hạn (Tùy chọn)"
                      autoComplete="off"
                      prefix={<Icon source={CalendarIcon} />}
                      value={expiresAtValue ? format(new Date(expiresAtValue), 'dd/MM/yyyy') : ''}
                      onFocus={togglePopoverActive}
                      placeholder="Chọn ngày hết hạn"
                    />
                  }
                  onClose={togglePopoverActive}
                >
                  <Box padding="400">
                    <DatePicker
                      month={month}
                      year={year}
                      onChange={(date) => {
                        setValue('expiresAt', format(date.start, 'yyyy-MM-dd'));
                        togglePopoverActive();
                      }}
                      onMonthChange={handleMonthChange}
                      selected={selectedDate}
                    />
                  </Box>
                </Popover>
              </Box>
            </FormLayout.Group>
          </FormLayout>
        </Box>
      </Form>
    );
  }
);

AddProxyForm.displayName = 'AddProxyForm';
