"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { proxySchema, ProxySchema } from '../schemas/proxy.schema';
import { useProxies } from '@/hooks/use-proxies';
import { useServers } from '@/hooks/use-servers';
import { Loader2, X } from 'lucide-react';

interface AddProxyFormProps {
  onClose: () => void;
}

export function AddProxyForm({ onClose }: AddProxyFormProps) {
  const { createMutation } = useProxies();
  const { servers } = useServers();
  const { register, handleSubmit, formState: { errors } } = useForm<ProxySchema>({
    resolver: zodResolver(proxySchema),
    defaultValues: {
      port: 1080,
    }
  });

  const onSubmit = (data: ProxySchema) => {
    createMutation.mutate(data, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-semibold text-slate-900">Add New Proxy</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Target Server</label>
            <select 
              {...register('serverId')}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a server</option>
              {servers.map((server) => (
                <option key={server.id} value={server.id}>{server.name} ({server.host})</option>
              ))}
            </select>
            {errors.serverId && <p className="text-[10px] text-red-500">{errors.serverId.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Proxy Port</label>
            <input 
              type="number"
              {...register('port', { valueAsNumber: true })}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="1080"
            />
            {errors.port && <p className="text-[10px] text-red-500">{errors.port.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Proxy Username</label>
            <input 
              {...register('username')}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="user"
            />
            {errors.username && <p className="text-[10px] text-red-500">{errors.username.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Proxy Password</label>
            <input 
              {...register('password')}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="password"
            />
            {errors.password && <p className="text-[10px] text-red-500">{errors.password.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">IPv6 (Optional)</label>
            <input 
              {...register('ipv6')}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="2001:db8::1"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Expires At (Optional)</label>
            <input 
              type="date"
              {...register('expiresAt')}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

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
              "Create Proxy"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
