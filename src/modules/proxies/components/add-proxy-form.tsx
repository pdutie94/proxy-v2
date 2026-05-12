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
  Button,
  BlockStack,
  Text,
  ButtonGroup,
  Label,
  Tooltip,
  InlineStack,
  Checkbox
} from "@shopify/polaris";
import { CalendarIcon, RefreshIcon, InfoIcon } from "@shopify/polaris-icons";
import { useCallback, useState, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { format, addMinutes, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { Proxy } from '@prisma/client';
import { generateRandomString, generateRandomPassword } from '@/utils/random';
import { useSession } from 'next-auth/react';
import { useUsers } from '@/hooks/use-users';

const EXPIRATION_OPTIONS = [
  { label: 'Vĩnh viễn', value: 'permanent' },
  { label: '2 phút (Test)', value: '2min' },
  { label: '1 ngày', value: '1d' },
  { label: '3 ngày', value: '3d' },
  { label: '1 tuần', value: '1w' },
  { label: '1 tháng', value: '1m' },
  { label: '3 tháng', value: '3m' },
  { label: '6 tháng', value: '6m' },
  { label: '1 năm', value: '1y' },
  { label: 'Tùy chỉnh', value: 'custom' },
];

interface AddProxyFormProps {
  onClose: () => void;
  onJobCreated?: (jobId: string) => void;
  proxy?: Proxy;
}

export interface AddProxyFormRef {
  submit: () => void;
}

export const AddProxyForm = forwardRef<AddProxyFormRef, AddProxyFormProps>(
  ({ onClose, onJobCreated, proxy }, ref) => {
    const { data: session } = useSession();
    const { users } = useUsers();
    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    const { bulkCreateMutation, updateMutation } = useProxies();
    const { servers } = useServers();
    const [popoverActive, setPopoverActive] = useState(false);
    const [expirationOption, setExpirationOption] = useState('permanent');
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    
    const form = useForm<BulkProxySchema>({
      resolver: zodResolver(bulkProxySchema) as any,
      defaultValues: {
        userId: proxy?.userId || '',
        serverId: '',
        startPort: 10000,
        count: 10,
        username: generateRandomString(6),
        password: generateRandomPassword(6),
        ipType: 'IPv6' as const,
        proxyType: 'SOCKS5' as const,
        expiresAt: undefined,
        autoRenew: false,
        renewalDuration: '1m',
        comment: '',
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
          proxyType: proxy.proxyType as any,
          expiresAt: proxy.expiresAt ? format(new Date(proxy.expiresAt), 'yyyy-MM-dd HH:mm') : '',
          autoRenew: proxy.autoRenew || false,
          renewalDuration: proxy.renewalDuration || '1m',
          comment: proxy.comment || '',
        });
        setExpirationOption(proxy.expiresAt ? 'custom' : 'permanent');
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
          proxyType: data.proxyType,
          expiresAt: data.expiresAt,
          autoRenew: data.autoRenew,
          renewalDuration: data.renewalDuration,
          comment: data.comment,
        };
        updateMutation.mutate({ id: proxy.id, data: updateData as any }, {
          onSuccess: () => onClose(),
        });
      } else {
        bulkCreateMutation.mutate(data, {
          onSuccess: (response: any) => {
            const jobId = response.data?.jobId;
            if (jobId && onJobCreated) {
              onJobCreated(jobId);
            } else {
              onClose();
            }
          },
        });
      }
    }, [bulkCreateMutation, updateMutation, onClose, onJobCreated, proxy]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.handleSubmit(onSubmit)();
      }
    }));

    const serverOptions = useMemo(() => [
      { label: 'Chọn máy chủ', value: '' },
      ...servers
        .filter(server => server.status === 'ONLINE')
        .map((server) => ({
          label: `${server.name} (${server.host})`,
          value: server.id,
        }))
    ], [servers]);

    const userOptions = useMemo(() => [
      { label: 'Không gán (Hệ thống)', value: '' },
      ...users.map((u) => ({
        label: `${u.email} (${u.role})`,
        value: u.id,
      }))
    ], [users]);

    const togglePopoverActive = useCallback(
      () => setPopoverActive((active) => !active),
      [],
    );

    const RENEWAL_OPTIONS = EXPIRATION_OPTIONS.filter(o => o.value !== 'permanent' && o.value !== 'custom');

    const refreshRandom = () => {
      form.setValue('username', generateRandomString(6));
      form.setValue('password', generateRandomPassword(6));
    };

    const handleExpirationChange = useCallback((value: string) => {
      setExpirationOption(value);
      if (value === 'permanent') {
        form.setValue('expiresAt', null);
        form.setValue('autoRenew', false);
      } else if (value !== 'custom') {
        const now = new Date();
        let expiry: Date;
        switch (value) {
          case '2min': expiry = addMinutes(now, 2); break;
          case '1d': expiry = addDays(now, 1); break;
          case '3d': expiry = addDays(now, 3); break;
          case '1w': expiry = addWeeks(now, 1); break;
          case '1m': expiry = addMonths(now, 1); break;
          case '3m': expiry = addMonths(now, 3); break;
          case '6m': expiry = addMonths(now, 6); break;
          case '1y': expiry = addYears(now, 1); break;
          default: return;
        }
        form.setValue('expiresAt', expiry.toISOString());
      } else {
        if (!form.getValues('expiresAt')) {
          const tomorrow = addDays(new Date(), 1);
          form.setValue('expiresAt', tomorrow.toISOString());
        }
        setPopoverActive(true);
      }
    }, [form]);

    return (
      <Box padding="400">
        <FormLayout>
          {isAdmin && (
            <FormLayout.Group>
              <Controller
                name="userId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    label="Chủ sở hữu (User)"
                    options={userOptions}
                    onChange={field.onChange}
                    value={field.value || ''}
                    error={form.formState.errors.userId?.message}
                  />
                )}
              />
            </FormLayout.Group>
          )}

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
                  label={
                    <InlineStack gap="100">
                      <Text as="span">Số lượng Proxy</Text>
                      {!proxy && (
                        <Tooltip content="Tối đa 1000 proxy một lần tạo">
                          <Icon source={InfoIcon} tone="subdued" />
                        </Tooltip>
                      )}
                    </InlineStack>
                  }
                  type="number"
                  autoComplete="off"
                  placeholder="10"
                  value={field.value?.toString()}
                  onChange={(val) => field.onChange(parseInt(val))}
                  error={form.formState.errors.count?.message}
                  disabled={!!proxy}
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
                  label={
                    <InlineStack gap="100">
                      <Text as="span">{proxy ? "Cổng (Port)" : "Cổng bắt đầu"}</Text>
                      {!proxy && (
                        <Tooltip content="Các port sẽ được tăng dần từ cổng này">
                          <Icon source={InfoIcon} tone="subdued" />
                        </Tooltip>
                      )}
                    </InlineStack>
                  }
                  type="number"
                  autoComplete="off"
                  placeholder="10000"
                  value={field.value?.toString()}
                  onChange={(val) => field.onChange(parseInt(val))}
                  error={form.formState.errors.startPort?.message}
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
                    <div 
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                      onClick={refreshRandom}
                      title="Tạo ngẫu nhiên"
                    >
                      <Icon source={RefreshIcon} tone="subdued" />
                    </div>
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
          </FormLayout.Group>

          <FormLayout.Group>
            <Controller
              name="ipType"
              control={form.control}
              render={({ field }) => (
                <BlockStack gap="100">
                  <Label id="ipType">Loại IP Outbound</Label>
                  <ButtonGroup variant="segmented">
                    <Button 
                      pressed={field.value === 'IPv4'} 
                      onClick={() => field.onChange('IPv4')}
                      size="large"
                    >
                      IPv4
                    </Button>
                    <Button 
                      pressed={field.value === 'IPv6'} 
                      onClick={() => field.onChange('IPv6')}
                      size="large"
                    >
                      IPv6
                    </Button>
                  </ButtonGroup>
                </BlockStack>
              )}
            />
            <Controller
              name="proxyType"
              control={form.control}
              render={({ field }) => (
                <BlockStack gap="100">
                  <Label id="proxyType">Giao thức Proxy</Label>
                  <ButtonGroup variant="segmented">
                    <Button 
                      pressed={field.value === 'HTTP'} 
                      onClick={() => field.onChange('HTTP')}
                    >
                      HTTP
                    </Button>
                    <Button 
                      pressed={field.value === 'SOCKS5'} 
                      onClick={() => field.onChange('SOCKS5')}
                    >
                      SOCKS5
                    </Button>
                  </ButtonGroup>
                </BlockStack>
              )}
            />
          </FormLayout.Group>

          <BlockStack gap="300">
            <Select
              label="Thời hạn sử dụng"
              options={EXPIRATION_OPTIONS}
              onChange={handleExpirationChange}
              value={expirationOption}
            />

            {expirationOption === 'custom' && (
              <Popover
                active={popoverActive}
                activator={
                  <TextField
                    label="Ngày hết hạn cụ thể"
                    autoComplete="off"
                    prefix={<Icon source={CalendarIcon} />}
                    value={form.watch('expiresAt') ? format(new Date(form.watch('expiresAt') as string), 'dd/MM/yyyy HH:mm') : ''}
                    onFocus={() => setPopoverActive(true)}
                    placeholder="Chọn ngày hết hạn"
                    readOnly
                  />
                }
                onClose={() => setPopoverActive(false)}
              >
                <Box padding="400">
                  <DatePicker
                    month={viewMonth}
                    year={viewYear}
                    onChange={(date) => {
                      const currentDate = new Date(form.getValues('expiresAt') || new Date());
                      const newDate = new Date(date.start);
                      newDate.setHours(currentDate.getHours());
                      newDate.setMinutes(currentDate.getMinutes());
                      newDate.setSeconds(currentDate.getSeconds());
                      
                      form.setValue('expiresAt', newDate.toISOString());
                      setPopoverActive(false);
                    }}
                    onMonthChange={(month, year) => {
                      setViewMonth(month);
                      setViewYear(year);
                    }}
                    selected={form.watch('expiresAt') ? new Date(form.watch('expiresAt') as string) : new Date()}
                    disableDatesBefore={new Date()}
                  />
                </Box>
              </Popover>
            )}
            
            {expirationOption !== 'permanent' && expirationOption !== 'custom' && (
              <Box paddingInlineStart="100">
                <InlineStack gap="100" align="start">
                  <Text as="span" variant="bodySm" tone="subdued">Sẽ hết hạn vào:</Text>
                  <Text as="span" variant="bodySm" fontWeight="medium">
                    {form.watch('expiresAt') ? format(new Date(form.watch('expiresAt') as string), 'dd/MM/yyyy HH:mm') : '---'}
                  </Text>
                </InlineStack>
              </Box>
            )}
          </BlockStack>

          <FormLayout.Group>
            {expirationOption !== 'permanent' && (
              <>
                <Controller
                  name="autoRenew"
                  control={form.control}
                  render={({ field }) => (
                        <Checkbox
                          label="Tự động gia hạn"
                          helpText={
                            <Text as="p" variant="bodyXs" tone="subdued">
                              Tự động kéo dài thời gian khi sắp hết hạn (dưới 24h)
                            </Text>
                          }
                          checked={field.value}
                          onChange={field.onChange}
                        />
                  )}
                />
                {form.watch('autoRenew') && (
                  <Controller
                    name="renewalDuration"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        label="Thời hạn gia hạn tự động"
                        options={RENEWAL_OPTIONS}
                        onChange={field.onChange}
                        value={field.value}
                      />
                    )}
                  />
                )}
                {!form.watch('autoRenew') && <Box />}
              </>
            )}
          </FormLayout.Group>

          <Controller
            name="comment"
            control={form.control}
            render={({ field }) => (
              <TextField
                label="Ghi chú (Comment)"
                autoComplete="off"
                placeholder="Ví dụ: Nuôi nick Facebook, chạy tool..."
                value={field.value || ''}
                onChange={field.onChange}
                multiline={2}
              />
            )}
          />
        </FormLayout>
      </Box>
    );
  }
);

AddProxyForm.displayName = 'AddProxyForm';
