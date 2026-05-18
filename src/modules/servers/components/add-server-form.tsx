"use client";

import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serverSchema, ServerSchema } from '../schemas/server.schema';
import { z } from 'zod';
import { useServers } from '@/hooks/use-servers';
import { Select, ListBox, Checkbox, TextField, Label, FieldError, InputGroup, Description } from "@heroui/react";

import { useCallback, forwardRef, useImperativeHandle, useEffect, useMemo, useState } from 'react';
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
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

    const locationOptions = useMemo(() => {
      const options = (locationsData || []).map(loc => ({
        label: `${getFlagEmoji(loc.countryCode)} ${loc.name}`,
        value: loc.id
      }));
      return [{ label: 'Chọn vị trí...', value: '' }, ...options];
    }, [locationsData]);

    const dynamicSchema = useMemo(() => {
      return serverSchema.superRefine((data, ctx) => {
        if (!server && (!data.password || data.password.trim() === '')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['password'],
            message: 'Mật khẩu SSH là bắt buộc khi tạo máy chủ mới',
          });
        }
      });
    }, [server]);
    
    const { control, handleSubmit, formState: { errors }, reset, watch } = useForm<ServerSchema>({
      resolver: zodResolver(dynamicSchema),
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
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <TextField isRequired isInvalid={!!fieldState.error}>
                <Label>Tên Máy chủ</Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <Icon icon="lucide:server" className="w-3.5 h-3.5 text-slate-400" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    type="text"
                    placeholder="Ví dụ: US-West-01"
                    className="w-full"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                </InputGroup>
                <FieldError>{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />

          {/* Địa chỉ IP */}
          <Controller
            name="host"
            control={control}
            render={({ field, fieldState }) => (
              <TextField isRequired isInvalid={!!fieldState.error}>
                <Label>Địa chỉ IP / Hostname</Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <Icon icon="lucide:globe" className="w-3.5 h-3.5 text-slate-400" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    type="text"
                    placeholder="Ví dụ: 1.2.3.4"
                    className="w-full"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                </InputGroup>
                <FieldError>{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cổng SSH */}
          <Controller
            name="port"
            control={control}
            render={({ field, fieldState }) => (
              <TextField isRequired isInvalid={!!fieldState.error}>
                <Label>Cổng SSH</Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <Icon icon="lucide:terminal" className="w-3.5 h-3.5 text-slate-400" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    type="number"
                    placeholder="22"
                    className="w-full"
                    value={field.value?.toString() || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseInt(val);
                      field.onChange(isNaN(parsed) ? '' : parsed);
                    }}
                  />
                </InputGroup>
                <FieldError>{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />

          {/* Tài khoản SSH */}
          <Controller
            name="username"
            control={control}
            render={({ field, fieldState }) => (
              <TextField isRequired isInvalid={!!fieldState.error}>
                <Label>Tài khoản SSH</Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <Icon icon="lucide:user" className="w-3.5 h-3.5 text-slate-400" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    type="text"
                    placeholder="root"
                    className="w-full"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                </InputGroup>
                <FieldError>{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mật khẩu SSH */}
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <TextField isRequired={!server} isInvalid={!!fieldState.error}>
                <Label>
                  {server ? "Mật khẩu SSH (Để trống nếu không đổi)" : "Mật khẩu SSH"}
                </Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <Icon icon="lucide:lock" className="w-3.5 h-3.5 text-slate-400" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="Mật khẩu"
                    className="w-full"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                  <InputGroup.Suffix>
                    <button 
                      type="button" 
                      onClick={togglePasswordVisibility} 
                      className="focus:outline-none cursor-pointer text-slate-400 hover:text-slate-600 flex items-center justify-center p-0.5 rounded-full"
                    >
                      {isPasswordVisible ? <Icon icon="lucide:eye-off" className="w-3.5 h-3.5" /> : <Icon icon="lucide:eye" className="w-3.5 h-3.5" />}
                    </button>
                  </InputGroup.Suffix>
                </InputGroup>
                <FieldError>{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />

          {/* IPv6 Prefix */}
          <Controller
            name="ipv6"
            control={control}
            render={({ field, fieldState }) => (
              <TextField isInvalid={!!fieldState.error}>
                <Label>IPv6 Prefix</Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <Icon icon="lucide:network" className="w-3.5 h-3.5 text-slate-400" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    type="text"
                    placeholder="Ví dụ: 2001:19f0:4401:903"
                    className="w-full"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                </InputGroup>
                <FieldError>{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vị trí máy chủ */}
          <Controller
            name="locationId"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                selectedKey={field.value || ''}
                onSelectionChange={(key) => field.onChange(key as string)}
                className="w-full"
                isInvalid={!!fieldState.error}
              >
                <Label>Vị trí máy chủ</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {locationOptions.map(opt => (
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
                <FieldError>{fieldState.error?.message}</FieldError>
              </Select>
            )}
          />

          {/* Số lượng Proxy tối đa */}
          <Controller
            name="maxProxies"
            control={control}
            render={({ field, fieldState }) => (
              <TextField isRequired isInvalid={!!fieldState.error}>
                <Label>Số lượng Proxy tối đa</Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <Icon icon="lucide:hash" className="w-3.5 h-3.5 text-slate-400" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    type="number"
                    placeholder="100"
                    className="w-full"
                    value={field.value?.toString() || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseInt(val);
                      field.onChange(isNaN(parsed) ? '' : parsed);
                    }}
                  />
                </InputGroup>
                <FieldError>{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cổng bắt đầu */}
          <Controller
            name="startPort"
            control={control}
            render={({ field, fieldState }) => (
              <TextField isRequired isInvalid={!!fieldState.error}>
                <Label>Cổng bắt đầu</Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <Icon icon="lucide:key-round" className="w-3.5 h-3.5 text-slate-400" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    type="number"
                    placeholder="10000"
                    className="w-full"
                    value={field.value?.toString() || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseInt(val);
                      field.onChange(isNaN(parsed) ? '' : parsed);
                    }}
                  />
                </InputGroup>
                <FieldError>{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />

          {/* Tự động xoay IPv6 */}
          <div className="flex items-center h-full pt-4">
            <Controller
              name="autoRotate"
              control={control}
              render={({ field }) => (
                <Checkbox
                  isSelected={field.value}
                  onChange={field.onChange}
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <Label htmlFor="auto-rotate">Tự động xoay IPv6</Label>
                    <Description>
                      Hệ thống tự động đổi toàn bộ IP Proxy sau chu kỳ thiết lập
                    </Description>
                  </Checkbox.Content>
                </Checkbox>
              )}
            />
          </div>
        </div>

        {isAutoRotate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chu kỳ xoay */}
            <Controller
              name="rotationInterval"
              control={control}
              render={({ field, fieldState }) => (
                <TextField isInvalid={!!fieldState.error}>
                  <Label>Chu kỳ xoay (Phút)</Label>
                  <InputGroup>
                    <InputGroup.Prefix>
                      <Icon icon="lucide:clock" className="w-3.5 h-3.5 text-slate-400" />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      type="number"
                      placeholder="60"
                      value={field.value?.toString() || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const parsed = parseInt(val);
                        field.onChange(isNaN(parsed) ? '' : parsed);
                      }}
                    />
                  </InputGroup>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </TextField>
              )}
            />
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
