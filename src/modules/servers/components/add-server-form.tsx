"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serverSchema, ServerSchema } from '../schemas/server.schema';
import { useServers } from '@/hooks/use-servers';
import { ServerAuthType } from '@prisma/client';
import { Loader2, X } from 'lucide-react';

interface AddServerFormProps {
  onClose: () => void;
}

export function AddServerForm({ onClose }: AddServerFormProps) {
  const { createMutation } = useServers();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ServerSchema>({
    resolver: zodResolver(serverSchema),
    defaultOptions: {
      authType: ServerAuthType.PASSWORD,
      port: 22,
      maxProxies: 100,
    },
  });

  const authType = watch('authType');

  const onSubmit = (data: ServerSchema) => {
    createMutation.mutate(data, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-semibold text-slate-900">Add New Server</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Server Name</label>
            <input 
              {...register('name')}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Primary Server"
            />
            {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Host / IP</label>
            <input 
              {...register('host')}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="1.2.3.4"
            />
            {errors.host && <p className="text-[10px] text-red-500">{errors.host.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">SSH Port</label>
            <input 
              type="number"
              {...register('port', { valueAsNumber: true })}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">SSH User</label>
            <input 
              {...register('username')}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="root"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Auth Type</label>
            <select 
              {...register('authType')}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={ServerAuthType.PASSWORD}>Password</option>
              <option value={ServerAuthType.SSH_KEY}>SSH Key</option>
            </select>
          </div>
        </div>

        {authType === ServerAuthType.PASSWORD ? (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">SSH Password</label>
            <input 
              type="password"
              {...register('password')}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Private Key</label>
            <textarea 
              {...register('privateKey')}
              className="h-24 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="-----BEGIN RSA PRIVATE KEY-----"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button 
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={createMutation.isPending}
            className="h-9 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save Server"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
