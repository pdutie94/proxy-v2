"use client";

import { useServers } from "@/hooks/use-servers";
import { useProxies } from "@/hooks/use-proxies";
import { useUsers } from "@/hooks/use-users";
import { useLogs } from "@/hooks/use-logs";
import { useSystemHealth } from "@/hooks/use-system-health";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useState, useMemo } from "react";
import { ServerJob, Server, Proxy } from "@prisma/client";
import { 
  Server as ServerIcon, 
  ShieldCheck, 
  Users, 
  Calendar, 
  Eye, 
  X, 
  Database, 
  Activity, 
  Layers,
  Cpu
} from "lucide-react";
import { Button } from "@heroui/react";
import Link from "next/link";

type LogEntry = ServerJob & {
  server?: Server | null;
  proxy?: Proxy | null;
};

export default function DashboardPage() {
  const { servers } = useServers();
  const { proxies } = useProxies();
  const { users } = useUsers();
  const { logs } = useLogs(8);
  const { data: healthData, isLoading: isHealthLoading } = useSystemHealth();
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const activeProxies = useMemo(() => proxies.filter(p => p.status === 'ACTIVE').length, [proxies]);
  const onlineServers = useMemo(() => servers.filter(s => s.status === 'ONLINE').length, [servers]);

  const stats = [
    {
      title: "Máy chủ trực tuyến",
      value: `${onlineServers}/${servers.length}`,
      icon: ServerIcon,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50/80 border-blue-100"
    },
    {
      title: "Proxy hoạt động",
      value: activeProxies.toString(),
      icon: ShieldCheck,
      iconColor: "text-green-600",
      iconBg: "bg-green-50/80 border-green-100"
    },
    {
      title: "Tổng người dùng",
      value: users.length.toString(),
      icon: Users,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50/80 border-amber-100"
    }
  ];

  const getJobTitle = (job: LogEntry) => {
    switch (job.type) {
      case 'SETUP_SERVER': return `Thiết lập server ${job.server?.name || 'Không xác định'}`;
      case 'PROVISION_PROXY': return `Tạo Proxy cổng ${job.proxy?.port || ''}`;
      case 'BULK_PROVISION_PROXY': return `Tạo hàng loạt Proxy (${job.server?.name || ''})`;
      case 'ROTATE_PROXY': return `Xoay IP cổng ${job.proxy?.port || ''}`;
      case 'DELETE_PROXY': return `Xóa Proxy cổng ${job.proxy?.port || ''}`;
      case 'RESET_SERVER': return `Reset server ${job.server?.name || ''}`;
      case 'SYNC_SERVER_PORT': return `Đồng bộ cổng ${job.server?.name || ''}`;
      case 'AUTOMATION': return 'Tự động hóa hệ thống';
      default: return job.type;
    }
  };

  const getJobBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200/50">
            Thành công
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200/50">
            Thất bại
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
            Đang chạy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
            Đang chờ
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Tổng quan hệ thống</h1>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${stat.iconBg}`}>
                <IconComponent className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                <p className="text-xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-800">Hoạt động gần đây</h2>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Sự kiện</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map((job: LogEntry) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: vi })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{getJobTitle(job)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {getJobBadge(job.status)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedLog(job)}
                        className="inline-flex items-center justify-center p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      Chưa có hoạt động nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center border-t border-slate-100 pt-3">
            <Link href="/dashboard/logs">
              <Button
                size="sm"
                variant="outline"
                className="text-slate-600 hover:bg-slate-100/70 border border-slate-200 bg-white font-semibold text-xs h-8 px-4 cursor-pointer rounded-lg"
              >
                Xem tất cả nhật ký
              </Button>
            </Link>
          </div>
        </div>

        {/* Server Status & Service Health */}
        <div className="space-y-4">
          {/* Server resources */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Tài nguyên Server</h2>
            <div className="space-y-3">
              {servers.length === 0 && <p className="text-xs text-slate-400 font-medium py-2">Chưa có máy chủ nào</p>}
              {servers.slice(0, 5).map((server) => {
                const proxyCount = proxies.filter(p => p.serverId === server.id).length;
                const percentage = Math.min(Math.round((proxyCount / server.maxProxies) * 100), 100);
                
                return (
                  <div key={server.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">{server.name}</span>
                      <span className="text-slate-400 font-bold">{proxyCount}/{server.maxProxies}</span>
                    </div>
                    {/* Compact progress bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          percentage > 85 ? 'bg-red-500' : percentage > 60 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {servers.length > 5 && (
                <div className="pt-2 border-t border-slate-50 flex justify-center">
                  <Link href="/dashboard/servers">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-slate-500 font-semibold text-[11px] h-7 px-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 cursor-pointer rounded-lg"
                    >
                      Xem thêm {servers.length - 5} máy chủ
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Service health */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Trạng thái dịch vụ</h2>
            <div className="space-y-3.5">
              {/* Database */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-semibold">
                  <Database className={`w-4 h-4 shrink-0 ${healthData?.database === 'ONLINE' ? 'text-green-600' : 'text-red-500'}`} />
                  <span>Cơ sở dữ liệu</span>
                </div>
                {isHealthLoading ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600">
                    Đang kiểm tra...
                  </span>
                ) : (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    healthData?.database === 'ONLINE' 
                      ? 'bg-green-50 text-green-700 border border-green-200/50' 
                      : 'bg-red-50 text-red-700 border border-red-200/50'
                  }`}>
                    {healthData?.database === 'ONLINE' ? 'Sẵn sàng' : 'Ngoại tuyến'}
                  </span>
                )}
              </div>

              {/* Redis */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-semibold">
                  <Layers className={`w-4 h-4 shrink-0 ${healthData?.redis === 'ONLINE' ? 'text-green-600' : 'text-red-500'}`} />
                  <span>Hàng chờ (Redis)</span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  healthData?.redis === 'ONLINE' 
                    ? 'bg-green-50 text-green-700 border border-green-200/50' 
                    : 'bg-red-50 text-red-700 border border-red-200/50'
                }`}>
                  {healthData?.redis === 'ONLINE' ? 'Kết nối' : 'Mất kết nối'}
                </span>
              </div>

              {/* Worker */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-semibold">
                  <Cpu className={`w-4 h-4 shrink-0 ${healthData?.worker === 'ONLINE' ? 'text-green-600' : 'text-red-500'}`} />
                  <span>SSH Workers</span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  healthData?.worker === 'ONLINE' 
                    ? 'bg-green-50 text-green-700 border border-green-200/50' 
                    : 'bg-red-50 text-red-700 border border-red-200/50'
                }`}>
                  {healthData?.worker === 'ONLINE' ? 'Hoạt động' : 'Dừng'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Compact Log View Overlay Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-lg flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">
                Chi tiết: {getJobTitle(selectedLog)}
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 overflow-y-auto bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed flex-1">
              <pre className="whitespace-pre-wrap break-all">
                {selectedLog.logs || 'Không có dữ liệu nhật ký chi tiết.'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
