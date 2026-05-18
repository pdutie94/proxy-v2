"use client";

import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bulkProxySchema, BulkProxySchema } from '../schemas/bulk-proxy.schema';
import { useProxies } from '@/hooks/use-proxies';
import { useServers } from '@/hooks/use-servers';
import { Input, Select, ListBox, Checkbox, TextArea, TextField, Label, FieldError } from "@heroui/react";

import { useCallback, useState, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { format, addMinutes, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { Proxy } from '@prisma/client';
import { generateRandomString, generateRandomPassword } from '@/utils/random';
import { useSession } from 'next-auth/react';
import { useUsers } from '@/hooks/use-users';

const EXPIRATION_OPTIONS = [
  { label: 'Vĩnh viễn', value: 'permanent' },
  { label: '2 phút (Thử nghiệm)', value: '2min' },
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
    const isAdmin = session?.user?.role === 'ADMIN';

    const { bulkCreateMutation, updateMutation } = useProxies();
    const { servers } = useServers();
    const [expirationOption, setExpirationOption] = useState('permanent');
    
    const form = useForm<BulkProxySchema>({
      resolver: zodResolver(bulkProxySchema),
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
          ipType: proxy.ipType,
          proxyType: proxy.proxyType,
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
        updateMutation.mutate({ id: proxy.id, data: updateData }, {
          onSuccess: () => onClose(),
        });
      } else {
        bulkCreateMutation.mutate(data, {
          onSuccess: (response) => {
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
      }
    }, [form]);

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4 text-xs bg-white">
        {isAdmin && (
          <Controller
            name="userId"
            control={form.control}
            render={({ field }) => (
              <Select
                selectedKey={field.value || ''}
                onSelectionChange={(key) => field.onChange(key as string)}
                className="w-full"
              >
                <Label>Chủ sở hữu (User)</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {userOptions.map(opt => (
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
              </Select>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="serverId"
            control={form.control}
            render={({ field }) => (
              <Select
                selectedKey={field.value || ''}
                onSelectionChange={(key) => field.onChange(key as string)}
                isDisabled={!!proxy}
                className="w-full"
              >
                <Label>Máy chủ đích</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {serverOptions.map(opt => (
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
              </Select>
            )}
          />
          {form.formState.errors.serverId && (
            <p className="mt-1 text-sm text-red-500 font-medium">{form.formState.errors.serverId.message}</p>
          )}

          {/* Số lượng Proxy */}
          <Controller
            name="count"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField isInvalid={!!fieldState.error} className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label className="block text-sm font-medium text-slate-500">Số lượng Proxy</Label>
                  {!proxy && (
                    <div className="group relative cursor-pointer text-slate-400 hover:text-slate-600">
                      <Icon icon="lucide:info" className="w-3 h-3"  />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-slate-800 text-[9px] text-white p-2 rounded shadow-lg z-20 pointer-events-none leading-relaxed">
                        Tối đa 1000 proxy một lần tạo
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="10"
                  value={field.value?.toString() || ''}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  disabled={!!proxy}
                />
                <FieldError className="mt-1 text-sm text-red-500 font-medium">{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cổng SSH / Cổng bắt đầu */}
          <Controller
            name="startPort"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField isInvalid={!!fieldState.error} className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label className="block text-sm font-medium text-slate-500">{proxy ? "Cổng (Port)" : "Cổng bắt đầu"}</Label>
                  {!proxy && (
                    <div className="group relative cursor-pointer text-slate-400 hover:text-slate-600">
                      <Icon icon="lucide:info" className="w-3 h-3"  />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-slate-800 text-[9px] text-white p-2 rounded shadow-lg z-20 pointer-events-none leading-relaxed">
                        Các port sẽ được tăng dần từ cổng này
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="10000"
                  value={field.value?.toString() || ''}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 10000)}
                />
                <FieldError className="mt-1 text-sm text-red-500 font-medium">{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />

          {/* Tài khoản */}
          <Controller
            name="username"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField isInvalid={!!fieldState.error} className="space-y-1">
                <Label className="block text-sm font-medium text-slate-500">Tài khoản</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Ví dụ: user"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                  <button
                    type="button"
                    onClick={refreshRandom}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors z-10"
                    title="Tạo ngẫu nhiên"
                  >
                    <Icon icon="lucide:refresh-cw" className="w-3.5 h-3.5"  />
                  </button>
                </div>
                <FieldError className="mt-1 text-sm text-red-500 font-medium">{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />
        </div>

        {/* Mật khẩu */}
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <TextField isInvalid={!!fieldState.error} className="space-y-1">
              <Label className="block text-sm font-medium text-slate-500">Mật khẩu</Label>
              <Input
                type="text"
                placeholder="Mật khẩu"
                value={field.value || ''}
                onChange={field.onChange}
              />
              <FieldError className="mt-1 text-sm text-red-500 font-medium">{fieldState.error?.message}</FieldError>
            </TextField>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Loại IP Outbound */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500">Loại IP Outbound</label>
            <Controller
              name="ipType"
              control={form.control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 border border-slate-200 rounded-lg h-9">
                  <button
                    type="button"
                    onClick={() => field.onChange('IPv4')}
                    className={`text-sm font-bold rounded-md transition-all cursor-pointer ${
                      field.value === 'IPv4'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    IPv4
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange('IPv6')}
                    className={`text-sm font-bold rounded-md transition-all cursor-pointer ${
                      field.value === 'IPv6'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    IPv6
                  </button>
                </div>
              )}
            />
          </div>

          {/* Giao thức Proxy */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500">Giao thức Proxy</label>
            <Controller
              name="proxyType"
              control={form.control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 border border-slate-200 rounded-lg h-9">
                  <button
                    type="button"
                    onClick={() => field.onChange('HTTP')}
                    className={`text-sm font-bold rounded-md transition-all cursor-pointer ${
                      field.value === 'HTTP'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    HTTP
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange('SOCKS5')}
                    className={`text-sm font-bold rounded-md transition-all cursor-pointer ${
                      field.value === 'SOCKS5'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    SOCKS5
                  </button>
                </div>
              )}
            />
          </div>
        </div>

        {/* Thời hạn sử dụng */}
        <div className="space-y-3">
          <Select
            selectedKey={expirationOption}
            onSelectionChange={(key) => handleExpirationChange(key as string)}
            className="w-full"
          >
            <Label>Thời hạn sử dụng</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {EXPIRATION_OPTIONS.map(opt => (
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
          </Select>

          {expirationOption === 'custom' && (
            <TextField className="space-y-1">
              <div className="flex items-center gap-1">
                <Label className="block text-sm font-medium text-slate-500">Chọn ngày hết hạn</Label>
                <Icon icon="lucide:calendar" className="w-3 h-3 text-slate-400"  />
              </div>
              <Input
                type="datetime-local"
                min={format(new Date(), 'yyyy-MM-dd\'T\'HH:mm')}
                value={form.watch('expiresAt') ? format(new Date(form.watch('expiresAt') as string), 'yyyy-MM-dd\'T\'HH:mm') : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = e.target.value;
                  if (val) {
                    form.setValue('expiresAt', new Date(val).toISOString());
                  }
                }}
              />
            </TextField>
          )}

          {expirationOption !== 'permanent' && expirationOption !== 'custom' && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium flex items-center gap-1.5">
              <span>Sẽ hết hạn vào:</span>
              <span className="text-slate-800 font-bold">
                {form.watch('expiresAt') ? format(new Date(form.watch('expiresAt') as string), 'dd/MM/yyyy HH:mm') : '---'}
              </span>
            </div>
          )}
        </div>

        {/* Tự động gia hạn */}
        {expirationOption !== 'permanent' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2 border-t border-slate-100">
            <div className="flex flex-col gap-1 pt-1.5">
              <Controller
                name="autoRenew"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    isSelected={field.value}
                    onChange={field.onChange}
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    Tự động gia hạn
                  </Checkbox>
                )}
              />
              <span className="text-xs text-slate-400 font-medium pl-6">
                Tự động kéo dài thời gian khi sắp hết hạn (dưới 24h)
              </span>
            </div>

            {form.watch('autoRenew') && (
              <Controller
                name="renewalDuration"
                control={form.control}
                render={({ field }) => (
                  <Select
                    selectedKey={field.value || ''}
                    onSelectionChange={(key) => field.onChange(key as string)}
                    className="w-full"
                  >
                    <Label>Thời hạn gia hạn tự động</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {RENEWAL_OPTIONS.map(opt => (
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
                  </Select>
                )}
              />
            )}
          </div>
        )}

        {/* Ghi chú */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-500">Ghi chú (Comment)</label>
          <Controller
            name="comment"
            control={form.control}
            render={({ field }) => (
              <TextArea
                placeholder="Ví dụ: Nuôi nick Facebook, chạy tool..."
                value={field.value || ''}
                onChange={field.onChange}
                rows={2}
              />
            )}
          />
        </div>
      </form>
    );
  }
);

AddProxyForm.displayName = 'AddProxyForm';
