"use client";

import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serverSchema, ServerSchema } from '../schemas/server.schema';
import { useServers } from '@/hooks/use-servers';
import { Input, Select, ListBox } from "@heroui/react";

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
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 text-xs bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tên Máy chủ */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500">Tên Máy chủ</label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  placeholder="Ví dụ: US-West-01"
                  value={field.value}
                  onChange={field.onChange}
                  className={`w-full h-9 px-2.5 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                    errors.name 
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                      : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                  }`}
                />
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Địa chỉ IP */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500">Địa chỉ IP / Hostname</label>
            <Controller
              name="host"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  placeholder="Ví dụ: 1.2.3.4"
                  value={field.value}
                  onChange={field.onChange}
                  className={`w-full h-9 px-2.5 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                    errors.host 
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                      : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                  }`}
                />
              )}
            />
            {errors.host && (
              <p className="mt-1 text-sm text-red-500 font-medium">{errors.host.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cổng SSH */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500">Cổng SSH</label>
            <Controller
              name="port"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  placeholder="22"
                  value={field.value?.toString() || ''}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 22)}
                  className={`w-full h-9 px-2.5 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                    errors.port 
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                      : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                  }`}
                />
              )}
            />
            {errors.port && (
              <p className="mt-1 text-sm text-red-500 font-medium">{errors.port.message}</p>
            )}
          </div>

          {/* Tài khoản SSH */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500">Tài khoản SSH</label>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  placeholder="root"
                  value={field.value}
                  onChange={field.onChange}
                  className={`w-full h-9 px-2.5 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                    errors.username 
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                      : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                  }`}
                />
              )}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500 font-medium">{errors.username.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mật khẩu SSH */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500 text-slate-500">
              {server ? "Mật khẩu SSH (Để trống nếu không đổi)" : "Mật khẩu SSH"}
            </label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  type="password"
                  placeholder="Mật khẩu"
                  value={field.value}
                  onChange={field.onChange}
                  className={`w-full h-9 px-2.5 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                      : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                  }`}
                />
              )}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* IPv6 Prefix */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <label className="block text-sm font-medium text-slate-500">IPv6 Prefix</label>
              <div className="group relative cursor-pointer text-slate-400 hover:text-slate-600">
                <Icon icon="lucide:info" className="w-3 h-3"  />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-slate-800 text-[9px] text-white p-2 rounded shadow-lg z-20 pointer-events-none leading-relaxed">
                  Nhập 4 cụm đầu của dải IPv6 được cấp (Ví dụ: 2001:19f0:4401:903)
                </div>
              </div>
            </div>
            <Controller
              name="ipv6"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  placeholder="Ví dụ: 2001:19f0:4401:903"
                  value={field.value}
                  onChange={field.onChange}
                  className={`w-full h-9 px-2.5 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                    errors.ipv6 
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                      : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                  }`}
                />
              )}
            />
            {errors.ipv6 && (
              <p className="mt-1 text-sm text-red-500 font-medium">{errors.ipv6.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vị trí máy chủ */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500">Vị trí máy chủ</label>
            <Controller
              name="locationId"
              control={control}
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
                    <ListBox className="p-1 outline-none">
                      {locationOptions.map(opt => (
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
            {errors.locationId && (
              <p className="mt-1 text-sm text-red-500 font-medium">{errors.locationId.message}</p>
            )}
          </div>

          {/* Số lượng Proxy tối đa */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-500">Số lượng Proxy tối đa</label>
            <Controller
              name="maxProxies"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  placeholder="100"
                  value={field.value?.toString() || ''}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                  className={`w-full h-9 px-2.5 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                    errors.maxProxies 
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                      : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                  }`}
                />
              )}
            />
            {errors.maxProxies && (
              <p className="mt-1 text-sm text-red-500 font-medium">{errors.maxProxies.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cổng bắt đầu */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <label className="block text-sm font-medium text-slate-500">Cổng bắt đầu</label>
              <div className="group relative cursor-pointer text-slate-400 hover:text-slate-600">
                <Icon icon="lucide:info" className="w-3 h-3"  />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-slate-800 text-[9px] text-white p-2 rounded shadow-lg z-20 pointer-events-none leading-relaxed">
                  Cổng mặc định khi tạo Proxy hàng loạt (Ví dụ: 10000)
                </div>
              </div>
            </div>
            <Controller
              name="startPort"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  placeholder="10000"
                  value={field.value?.toString() || ''}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 10000)}
                  className={`w-full h-9 px-2.5 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                    errors.startPort 
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                      : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                  }`}
                />
              )}
            />
            {errors.startPort && (
              <p className="mt-1 text-sm text-red-500 font-medium">{errors.startPort.message}</p>
            )}
          </div>

          {/* Tự động xoay IPv6 */}
          <div className="flex items-center h-full pt-4">
            <Controller
              name="autoRotate"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500/50 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-600">Tự động xoay IPv6</span>
                </label>
              )}
            />
          </div>
        </div>

        {isAutoRotate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chu kỳ xoay */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <label className="block text-sm font-medium text-slate-500">Chu kỳ xoay (Phút)</label>
                <div className="group relative cursor-pointer text-slate-400 hover:text-slate-600">
                  <Icon icon="lucide:info" className="w-3 h-3"  />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-slate-800 text-[9px] text-white p-2 rounded shadow-lg z-20 pointer-events-none leading-relaxed">
                    Hệ thống sẽ tự động đổi toàn bộ IP Proxy sau mỗi X phút
                  </div>
                </div>
              </div>
              <Controller
                name="rotationInterval"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    placeholder="60"
                    value={field.value?.toString() || ''}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className={`w-full h-9 px-2.5 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                      errors.rotationInterval 
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                        : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                    }`}
                  />
                )}
              />
              {errors.rotationInterval && (
                <p className="mt-1 text-sm text-red-500 font-medium">{errors.rotationInterval.message}</p>
              )}
            </div>
          </div>
        )}
      </form>
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
