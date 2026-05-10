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
  Button, 
  BlockStack,
  InlineStack,
  Popover,
  DatePicker,
  Box,
  Icon
} from "@shopify/polaris";
import { CalendarIcon } from "@shopify/polaris-icons";
import { useCallback, useState, useMemo } from 'react';
import { format } from 'date-fns';

interface AddProxyFormProps {
  onClose: () => void;
}

export function AddProxyForm({ onClose }: AddProxyFormProps) {
  const { createMutation } = useProxies();
  const { servers } = useServers();
  const [popoverActive, setPopoverActive] = useState(false);
  
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProxySchema>({
    resolver: zodResolver(proxySchema),
    defaultValues: {
      port: 1080,
    }
  });

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
    createMutation.mutate(data, {
      onSuccess: () => onClose(),
    });
  }, [createMutation, onClose]);

  const serverOptions = useMemo(() => [
    { label: 'Select a server', value: '' },
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
      <FormLayout>
        <FormLayout.Group>
          <Controller
            name="serverId"
            control={control}
            render={({ field }) => (
              <Select
                label="Target Server"
                options={serverOptions}
                onChange={field.onChange}
                value={field.value}
                error={errors.serverId?.message}
              />
            )}
          />
          <Controller
            name="port"
            control={control}
            render={({ field }) => (
              <TextField
                label="Proxy Port"
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
                label="Proxy Username"
                autoComplete="username"
                placeholder="user"
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
                label="Proxy Password"
                type="password"
                autoComplete="new-password"
                placeholder="password"
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
                label="IPv6 (Optional)"
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
                  label="Expires At (Optional)"
                  autoComplete="off"
                  prefix={<Icon source={CalendarIcon} />}
                  value={expiresAtValue ? format(new Date(expiresAtValue), 'yyyy-MM-dd') : ''}
                  onFocus={togglePopoverActive}
                  placeholder="Select expiration date"
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
    </Form>
  );
}
