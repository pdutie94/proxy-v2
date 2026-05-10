"use client";

import { useProxies } from '@/hooks/use-proxies';
import { ShieldCheck, Trash2, Globe, Clock, Server as ServerIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function ProxyList() {
  const { proxies, isLoading, deleteMutation, toggleMutation } = useProxies();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (proxies.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-8 text-center">
        <p className="text-sm text-slate-500">No proxies found. Create your first proxy to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
          <tr>
            <th className="py-2 px-4">Proxy info</th>
            <th className="py-2 px-4">Server</th>
            <th className="py-2 px-4">IPv6</th>
            <th className="py-2 px-4">Expires</th>
            <th className="py-2 px-4">Status</th>
            <th className="py-2 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {proxies.map((proxy: any) => (
            <tr key={proxy.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-2 px-4">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900">{proxy.username}:{proxy.password}</span>
                  <span className="text-[11px] text-slate-500">Port: {proxy.port}</span>
                </div>
              </td>
              <td className="py-2 px-4">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <ServerIcon className="h-3 w-3" />
                  <span className="text-[12px]">{proxy.server.name}</span>
                </div>
              </td>
              <td className="py-2 px-4 text-slate-600 font-mono text-[11px]">
                {proxy.ipv6 || '—'}
              </td>
              <td className="py-2 px-4">
                {proxy.expiresAt ? (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="h-3 w-3" />
                    <span className="text-[12px]">{format(new Date(proxy.expiresAt), 'MMM dd, yyyy')}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-[12px]">Never</span>
                )}
              </td>
              <td className="py-2 px-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    proxy.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                    proxy.status === 'CREATING' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  )}>
                    {proxy.status}
                  </span>
                  {!proxy.isEnabled && (
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                      DISABLED
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button 
                    onClick={() => toggleMutation.mutate({ id: proxy.id, isEnabled: !proxy.isEnabled })}
                    className={cn(
                      "h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100",
                      proxy.isEnabled ? "text-blue-600" : "text-slate-400"
                    )}
                    title={proxy.isEnabled ? "Disable" : "Enable"}
                  >
                    {proxy.isEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this proxy?')) {
                        deleteMutation.mutate(proxy.id);
                      }
                    }}
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
