"use client";

import { useServers } from '@/hooks/use-servers';
import { ServerAuthType, ServerStatus } from '@prisma/client';
import { MoreHorizontal, Trash2, Edit2, Play, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ServerList() {
  const { servers, isLoading, deleteMutation } = useServers();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-8 text-center">
        <p className="text-sm text-slate-500">No servers found. Add your first server to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
          <tr>
            <th className="py-2 px-4">Server Name</th>
            <th className="py-2 px-4">Host</th>
            <th className="py-2 px-4">Auth</th>
            <th className="py-2 px-4">Proxies</th>
            <th className="py-2 px-4">Status</th>
            <th className="py-2 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {servers.map((server) => (
            <tr key={server.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-2 px-4 font-medium text-slate-900">{server.name}</td>
              <td className="py-2 px-4 text-slate-600">{server.host}</td>
              <td className="py-2 px-4 text-slate-600">
                <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                  {server.authType === ServerAuthType.PASSWORD ? 'Password' : 'SSH Key'}
                </span>
              </td>
              <td className="py-2 px-4 text-slate-600">0 / {server.maxProxies}</td>
              <td className="py-2 px-4">
                <div className="flex items-center gap-1.5">
                  <Circle className={cn(
                    "h-2 w-2 fill-current",
                    server.status === 'ONLINE' ? 'text-green-500' :
                    server.status === 'PENDING' ? 'text-amber-500' : 'text-red-500'
                  )} />
                  <span className="text-[12px] font-medium text-slate-700 uppercase tracking-tight">
                    {server.status}
                  </span>
                </div>
              </td>
              <td className="py-2 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500">
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this server?')) {
                        deleteMutation.mutate(server.id);
                      }
                    }}
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600"
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
