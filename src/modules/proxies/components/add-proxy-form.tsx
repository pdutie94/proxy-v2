"use client";

import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bulkProxySchema, BulkProxySchema } from '../schemas/bulk-proxy.schema';
import { useProxies } from '@/hooks/use-proxies';
import { useServers } from '@/hooks/use-servers';
import { Input, Select, ListBox, NumberField, Checkbox } from "@heroui/react";

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
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500">Chủ sở hữu (User)</label>
            <Controller
              name="userId"
              control={form.control}
              render={({ field }) => (
                <Select
                  selectedKey={field.value || ''}
                  onSelectionChange={(key) => field.onChange(key as string)}
                  className="w-full"
                >
                  <Select.Trigger className="w-full flex items-center justify-between text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg h-9 px-3 outline-none cursor-pointer transition-all duration-150">
                    <Select.Value />
                    <Select.Indicator>
                      <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-slate-400" />
                    </Select.Indicator>
                  </Select.Trigger>
                  <Select.Popover className="w-[--trigger-width] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                    <ListBox className="p-1 outline-none max-h-60 overflow-y-auto">
                      {userOptions.map(opt => (
                        <ListBox.Item
                          key={opt.value}
                          id={opt.value}
                          textValue={opt.label}
                          className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded text-slate-600 hover:bg-slate-50 cursor-pointer outline-none data-[focused]:bg-slate-100 data-[selected]:bg-slate-100 data-[selected]:text-blue-600 font-medium"
                        >
                          {({ isSelected }) => (
                            <>
                              <span>{opt.label}</span>
                              {isSelected && (
                                <Icon icon="lucide:check" className="w-3.5 h-3.5 text-blue-600" />
                              )}
                            </>
                          )}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              )}
            />
            {form.formState.errors.userId && (
              <p className="mt-1 text-sm text-red-500 font-medium">{form.formState.errors.userId.message}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Máy chủ đích */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500">Máy chủ đích</label>
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
                  <Select.Trigger className={`w-full flex items-center justify-between text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg h-9 px-3 outline-none cursor-pointer transition-all duration-150 ${
                    proxy ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100 hover:border-slate-100' : ''
                  }`}>
                    <Select.Value />
                    <Select.Indicator>
                      <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-slate-400" />
                    </Select.Indicator>
                  </Select.Trigger>
                  <Select.Popover className="w-[--trigger-width] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                    <ListBox className="p-1 outline-none max-h-60 overflow-y-auto">
                      {serverOptions.map(opt => (
                        <ListBox.Item
                          key={opt.value}
                          id={opt.value}
                          textValue={opt.label}
                          className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded text-slate-600 hover:bg-slate-50 cursor-pointer outline-none data-[focused]:bg-slate-100 data-[selected]:bg-slate-100 data-[selected]:text-blue-600 font-medium"
                        >
                          {({ isSelected }) => (
                            <>
                              <span>{opt.label}</span>
                              {isSelected && (
                                <Icon icon="lucide:check" className="w-3.5 h-3.5 text-blue-600" />
                              )}
                            </>
                          )}
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
          </div>

          {/* Số lượng Proxy */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <label className="block text-sm font-medium text-slate-500">Số lượng Proxy</label>
              {!proxy && (
                <div className="group relative cursor-pointer text-slate-400 hover:text-slate-600">
                  <Icon icon="lucide:info" className="w-3 h-3"  />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-slate-800 text-[9px] text-white p-2 rounded shadow-lg z-20 pointer-events-none leading-relaxed">
                    Tối đa 1000 proxy một lần tạo
                  </div>
                </div>
              )}
            </div>
            <Controller
              name="count"
              control={form.control}
              render={({ field }) => (
                <NumberField
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  minValue={1}
                  maxValue={1000}
                  isDisabled={!!proxy}
                  className="w-full"
                >
                  <NumberField.Group className={`w-full flex items-center border rounded-lg h-9 overflow-hidden transition-all duration-150 ${
                    !!proxy ? 'bg-slate-50 border-slate-100 cursor-not-allowed' : 'bg-white'
                  } ${
                    form.formState.errors.count 
                      ? 'border-red-500 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/50' 
                      : 'border-slate-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50'
                  }`}>
                    <NumberField.DecrementButton className="h-full px-2.5 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-r border-slate-100 cursor-pointer outline-none transition-colors select-none disabled:opacity-50 disabled:pointer-events-none">
                      <Icon icon="lucide:minus" className="w-3.5 h-3.5" />
                    </NumberField.DecrementButton>
                    <NumberField.Input 
                      placeholder="10"
                      className="w-full h-full px-2.5 text-sm bg-transparent outline-none border-none text-slate-600 font-medium disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <NumberField.IncrementButton className="h-full px-2.5 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-l border-slate-100 cursor-pointer outline-none transition-colors select-none disabled:opacity-50 disabled:pointer-events-none">
                      <Icon icon="lucide:plus" className="w-3.5 h-3.5" />
                    </NumberField.IncrementButton>
                  </NumberField.Group>
                </NumberField>
              )}
            />
            {form.formState.errors.count && (
              <p className="mt-1 text-sm text-red-500 font-medium">{form.formState.errors.count.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cổng SSH / Cổng bắt đầu */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <label className="block text-sm font-medium text-slate-500">{proxy ? "Cổng (Port)" : "Cổng bắt đầu"}</label>
              {!proxy && (
                <div className="group relative cursor-pointer text-slate-400 hover:text-slate-600">
                  <Icon icon="lucide:info" className="w-3 h-3"  />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-slate-800 text-[9px] text-white p-2 rounded shadow-lg z-20 pointer-events-none leading-relaxed">
                    Các port sẽ được tăng dần từ cổng này
                  </div>
                </div>
              )}
            </div>
            <Controller
              name="startPort"
              control={form.control}
              render={({ field }) => (
                <NumberField
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  minValue={1}
                  maxValue={65535}
                  className="w-full"
                >
                  <NumberField.Group className={`w-full flex items-center border rounded-lg h-9 overflow-hidden transition-all duration-150 bg-white ${
                    form.formState.errors.startPort 
                      ? 'border-red-500 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/50' 
                      : 'border-slate-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50'
                  }`}>
                    <NumberField.DecrementButton className="h-full px-2.5 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-r border-slate-100 cursor-pointer outline-none transition-colors select-none disabled:opacity-50 disabled:pointer-events-none">
                      <Icon icon="lucide:minus" className="w-3.5 h-3.5" />
                    </NumberField.DecrementButton>
                    <NumberField.Input 
                      placeholder="10000"
                      className="w-full h-full px-2.5 text-sm bg-transparent outline-none border-none text-slate-600 font-medium"
                    />
                    <NumberField.IncrementButton className="h-full px-2.5 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-l border-slate-100 cursor-pointer outline-none transition-colors select-none disabled:opacity-50 disabled:pointer-events-none">
                      <Icon icon="lucide:plus" className="w-3.5 h-3.5" />
                    </NumberField.IncrementButton>
                  </NumberField.Group>
                </NumberField>
              )}
            />
            {form.formState.errors.startPort && (
              <p className="mt-1 text-[10px] text-red-500 font-semibold">{form.formState.errors.startPort.message}</p>
            )}
          </div>

          {/* Tài khoản */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500">Tài khoản</label>
            <div className="relative">
              <Controller
                name="username"
                control={form.control}
                render={({ field }) => (
                  <Input
                    type="text"
                    placeholder="Ví dụ: user"
                    value={field.value}
                    onChange={field.onChange}
                    className={`w-full h-9 pl-2.5 pr-8 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                      form.formState.errors.username 
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                        : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                    }`}
                  />
                )}
              />
              <button
                type="button"
                onClick={refreshRandom}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                title="Tạo ngẫu nhiên"
              >
                <Icon icon="lucide:refresh-cw" className="w-3.5 h-3.5"  />
              </button>
            </div>
            {form.formState.errors.username && (
              <p className="mt-1 text-sm text-red-500 font-medium">{form.formState.errors.username.message}</p>
            )}
          </div>
        </div>

        {/* Mật khẩu */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-500">Mật khẩu</label>
          <Controller
            name="password"
            control={form.control}
            render={({ field }) => (
              <Input
                type="text"
                placeholder="Mật khẩu"
                value={field.value}
                onChange={field.onChange}
                className={`w-full h-9 px-2.5 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                  form.formState.errors.password 
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                    : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                }`}
              />
            )}
          />
          {form.formState.errors.password && (
            <p className="mt-1 text-sm text-red-500 font-medium">{form.formState.errors.password.message}</p>
          )}
        </div>

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
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500">Thời hạn sử dụng</label>
            <Select
              selectedKey={expirationOption}
              onSelectionChange={(key) => handleExpirationChange(key as string)}
              className="w-full"
            >
              <Select.Trigger className="w-full flex items-center justify-between text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg h-9 px-3 outline-none cursor-pointer transition-all duration-150">
                <Select.Value />
                <Select.Indicator>
                  <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-slate-400" />
                </Select.Indicator>
              </Select.Trigger>
              <Select.Popover className="w-[--trigger-width] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                <ListBox className="p-1 outline-none max-h-60 overflow-y-auto">
                  {EXPIRATION_OPTIONS.map(opt => (
                    <ListBox.Item
                      key={opt.value}
                      id={opt.value}
                      textValue={opt.label}
                      className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded text-slate-600 hover:bg-slate-50 cursor-pointer outline-none data-[focused]:bg-slate-100 data-[selected]:bg-slate-100 data-[selected]:text-blue-600 font-medium"
                    >
                      {({ isSelected }) => (
                        <>
                          <span>{opt.label}</span>
                          {isSelected && (
                            <Icon icon="lucide:check" className="w-3.5 h-3.5 text-blue-600" />
                          )}
                        </>
                      )}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          {expirationOption === 'custom' && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <label className="block text-sm font-medium text-slate-500">Chọn ngày hết hạn</label>
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
                className="w-full h-9 px-3 text-sm bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-medium text-slate-600"
              />
            </div>
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
                    className="text-sm font-medium text-slate-600 select-none cursor-pointer"
                  >
                    Tự động gia hạn
                  </Checkbox>
                )}
              />
              <span className="text-xs text-slate-400 font-medium pl-6">
                Tự động kéo dài thời gian khi sắp hết hạn (dưới 24h)
              </span>
            </div>

            {form.watch('autoRenew') && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-500">Thời hạn gia hạn tự động</label>
                <Controller
                  name="renewalDuration"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      selectedKey={field.value || ''}
                      onSelectionChange={(key) => field.onChange(key as string)}
                      className="w-full"
                    >
                      <Select.Trigger className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg h-9 px-3 outline-none cursor-pointer transition-all duration-150">
                        <Select.Value />
                        <Select.Indicator>
                          <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-slate-400" />
                        </Select.Indicator>
                      </Select.Trigger>
                      <Select.Popover className="w-[--trigger-width] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                        <ListBox className="p-1 outline-none max-h-60 overflow-y-auto">
                          {RENEWAL_OPTIONS.map(opt => (
                            <ListBox.Item
                              key={opt.value}
                              id={opt.value}
                              textValue={opt.label}
                              className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded text-slate-600 hover:bg-slate-50 cursor-pointer outline-none data-[focused]:bg-slate-100 data-[selected]:bg-slate-100 data-[selected]:text-blue-600 font-medium"
                            >
                              {({ isSelected }) => (
                                <>
                                  <span>{opt.label}</span>
                                  {isSelected && (
                                    <Icon icon="lucide:check" className="w-3.5 h-3.5 text-blue-600" />
                                  )}
                                </>
                              )}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  )}
                />
              </div>
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
              <textarea
                placeholder="Ví dụ: Nuôi nick Facebook, chạy tool..."
                value={field.value || ''}
                onChange={field.onChange}
                rows={2}
                className="w-full p-2.5 text-sm bg-white placeholder:text-slate-400 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-medium text-slate-600"
              />
            )}
          />
        </div>
      </form>
    );
  }
);

AddProxyForm.displayName = 'AddProxyForm';
