"use client";

import { format } from "date-fns";
import { useLogs } from "@/hooks/use-logs";
import { useState, useCallback, useMemo } from "react";
import { ServerJob, Server, Proxy } from "@prisma/client";
import { 
  Calendar, 
  Eye, 
  X, 
  Trash2, 
  Server as ServerIcon 
} from "lucide-react";
import { Button } from "@heroui/react";

type LogEntry = ServerJob & {
  server?: Server | null;
  proxy?: Proxy | null;
};

export default function LogsPage() {
  const { logs, isLoading, clearLogs, isClearing } = useLogs(500); 
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const tabs = [
    { id: 'all', content: 'Tất cả' },
    { id: 'completed', content: 'Thành công' },
    { id: 'failed', content: 'Thất bại' },
    { id: 'active', content: 'Đang chạy' },
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((log: LogEntry) => {
      if (selectedTab === 1 && log.status !== 'COMPLETED') return false;
      if (selectedTab === 2 && log.status !== 'FAILED') return false;
      if (selectedTab === 3 && log.status !== 'ACTIVE') return false;
      return true;
    });
  }, [logs, selectedTab]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const getJobTitle = (job: LogEntry) => {
    switch (job.type) {
      case 'SETUP_SERVER': return `Thiết lập server ${job.server?.name || ''}`;
      case 'PROVISION_PROXY': return `Tạo Proxy cổng ${job.proxy?.port || ''}`;
      case 'BULK_PROVISION_PROXY': return `Tạo hàng loạt Proxy (${job.server?.name || ''})`;
      case 'ROTATE_PROXY': return `Xoay IP cổng ${job.proxy?.port || ''}`;
      case 'DELETE_PROXY': return `Xóa Proxy cổng ${job.proxy?.port || ''}`;
      case 'RESET_SERVER': return `Reset server ${job.server?.name || ''}`;
      case 'SYNC_SERVER_PORT': return `Đồng bộ cổng server ${job.server?.name || ''}`;
      case 'AUTOMATION': return 'Chạy chu kỳ tự động hóa';
      default: return job.type;
    }
  };

  const getStatusBadge = (status: string) => {
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

  const handleDeleteAll = useCallback(() => {
    clearLogs();
    setIsDeleteModalOpen(false);
  }, [clearLogs]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">Nhật ký hệ thống</h1>
            <p className="text-xs text-slate-400">Đang tải lịch sử hoạt động...</p>
          </div>
        </div>

        {/* Skeleton lines with pulse animation */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3.5">
          <div className="h-6 bg-slate-100/80 rounded w-1/4 animate-pulse mb-4" />
          <div className="space-y-2.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-9 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Nhật ký hệ thống</h1>
          <p className="text-xs text-slate-400">Theo dõi chi tiết các hoạt động và tiến trình xử lý trên máy chủ</p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onPress={() => setIsDeleteModalOpen(true)}
          isDisabled={logs.length === 0 || isClearing}
          className="cursor-pointer font-bold text-xs h-9 px-3 flex items-center gap-1.5 self-start sm:self-auto rounded-lg"
        >
          <Trash2 className="w-3.5 h-3.5 shrink-0" />
          Dọn dẹp nhật ký
        </Button>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Compact Filters Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-2 overflow-x-auto text-xs scrollbar-none">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedTab(index);
                setPage(1);
              }}
              className={`px-4 py-2.5 border-b-2 font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedTab === index 
                  ? 'border-blue-500 text-blue-600 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
              }`}
            >
              {tab.content}
            </button>
          ))}
        </div>

        {/* Table representation */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Loại công việc</th>
                <th className="py-2.5 px-3">Máy chủ</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedLogs.map((log: LogEntry) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{getJobTitle(log)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                    {log.server ? (
                      <div className="flex items-center gap-1.5">
                        <ServerIcon className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{log.server.name}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center justify-center p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    Chưa có nhật ký nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Flat Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-slate-100 text-xs bg-slate-50/50">
            <span className="text-slate-400 font-semibold">Trang {page} / {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <Button
                isDisabled={page <= 1}
                onPress={() => setPage(page - 1)}
                className="px-2.5 py-1 text-xs border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold h-7 min-w-0 rounded-lg cursor-pointer transition-all"
              >
                Trước
              </Button>
              <Button
                isDisabled={page >= totalPages}
                onPress={() => setPage(page + 1)}
                className="px-2.5 py-1 text-xs border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold h-7 min-w-0 rounded-lg cursor-pointer transition-all"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Compact Log Details Overlay Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-lg flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">
                Chi tiết công việc: {getJobTitle(selectedLog)}
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

      {/* Delete Confirmation Overlay Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">Xác nhận dọn dẹp nhật ký?</h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed">
              Hành động này sẽ xóa vĩnh viễn toàn bộ lịch sử công việc trong cơ sở dữ liệu. Bạn có chắc chắn muốn thực hiện?
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setIsDeleteModalOpen(false)}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={handleDeleteAll}
                isDisabled={isClearing}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1"
              >
                {isClearing && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Xác nhận xóa sạch
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
