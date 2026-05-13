'use client';

import { format, differenceInHours } from 'date-fns';
import { toast } from 'sonner';
import { rotateUserProxyAction } from '../actions/user-proxy.action';
import { useState } from 'react';
import { 
  Copy, 
  Trash2, 
  RotateCw, 
  StickyNote, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Hash,
  User,
  Key,
  Globe
} from 'lucide-react';

interface UserProxyTableProps {
  proxies: any[];
}

export function UserProxyTable({ proxies }: UserProxyTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const getRemainingTime = (date: Date) => {
    const hours = differenceInHours(new Date(date), new Date());
    if (hours < 0) return 'Hết hạn';
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  };

  return (
    <div className="w-full border border-slate-200 rounded-lg overflow-hidden bg-white">
      {proxies.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm font-medium">Bạn chưa thuê proxy nào</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {proxies.map((proxy) => (
            <div key={proxy.id} className="p-4 flex flex-col lg:flex-row items-start gap-6 hover:bg-slate-50/50 transition-colors group">
              {/* Status & Type */}
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <input type="checkbox" className="w-4 h-4 accent-blue-600 cursor-pointer" />
                <div className="flex flex-col items-center gap-1.5 min-w-[50px]">
                   <span className="text-xl">🇻🇳</span>
                   <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-none">
                     {proxy.ipType}
                   </span>
                </div>
              </div>

              {/* Connection Info - Compact Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <div className="space-y-1">
                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      <Globe className="w-2.5 h-2.5" /> IP:PORT
                   </div>
                   <div className="text-[13px] font-bold text-slate-900 font-mono tracking-tight flex items-center gap-2 group/copy">
                      {proxy.server.host}:{proxy.port}
                      <button onClick={() => copyToClipboard(`${proxy.server.host}:${proxy.port}`)} className="opacity-0 group-hover/copy:opacity-100 p-1 hover:bg-slate-200 rounded transition-all">
                        <Copy className="w-3 h-3 text-slate-400" />
                      </button>
                   </div>
                </div>

                <div className="space-y-1">
                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      <User className="w-2.5 h-2.5" /> Login
                   </div>
                   <div className="text-[13px] font-bold text-slate-900 font-mono">{proxy.username}</div>
                </div>

                <div className="space-y-1">
                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      <Key className="w-2.5 h-2.5" /> Password
                   </div>
                   <div className="text-[13px] font-bold text-slate-900 font-mono">{proxy.password}</div>
                </div>

                <div className="space-y-1">
                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      <Hash className="w-2.5 h-2.5" /> Protocol
                   </div>
                   <div className="text-[11px] font-bold text-slate-500 uppercase">HTTP/Socks5</div>
                </div>
              </div>

              {/* Expiration Info - Tighter */}
              <div className="w-full lg:w-44 flex flex-row lg:flex-col justify-between lg:justify-start gap-2 pt-2 lg:pt-0">
                <div className="flex lg:flex-col lg:items-end gap-2 lg:gap-1">
                   <span className="text-[9px] font-bold uppercase text-slate-400">Hết hạn:</span>
                   <span className="text-[11px] font-bold text-amber-600">{proxy.expiresAt ? format(new Date(proxy.expiresAt), 'dd/MM/yy HH:mm') : 'N/A'}</span>
                </div>
                <div className="flex lg:flex-col lg:items-end gap-2 lg:gap-1">
                   <span className="text-[9px] font-bold uppercase text-slate-400">Còn lại:</span>
                   <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                     <Clock className="w-2.5 h-2.5" />
                     {proxy.expiresAt ? getRemainingTime(new Date(proxy.expiresAt)) : 'N/A'}
                   </span>
                </div>
              </div>

              {/* Action Buttons - Compact */}
              <div className="w-full lg:w-auto flex items-center justify-end gap-1 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                 <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all" title="Ghi chú">
                    <StickyNote className="w-4 h-4" />
                 </button>
                 <button 
                  onClick={() => copyToClipboard(`${proxy.server.host}:${proxy.port}:${proxy.username}:${proxy.password}`)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                  title="Sao chép tất cả"
                 >
                    <Copy className="w-4 h-4" />
                 </button>
                 <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all" title="Xem">
                    <Eye className="w-4 h-4" />
                 </button>
                 <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
