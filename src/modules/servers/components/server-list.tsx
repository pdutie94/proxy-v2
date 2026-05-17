"use client";

import { useServers } from '@/hooks/use-servers';
import { Button, Table, Chip } from "@heroui/react";
import { 
  Play, 
  RotateCcw, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  AlertTriangle, 
  Cpu 
} from "lucide-react";
import { Server } from '@prisma/client';
import { useState, useCallback } from 'react';
import { JobProgressModal } from '@/components/jobs/job-progress-modal';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ServerListProps {
  onEdit: (server: Server) => void;
  onAdd?: () => void;
}

export function ServerList({ onEdit, onAdd }: ServerListProps) {
  const { servers, isLoading, deleteMutation, setupMutation, resetMutation, syncMutation } = useServers();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeConfirmServer, setActiveConfirmServer] = useState<Server | null>(null);
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Filters state
  const [queryValue, setQueryValue] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Trực tuyến', value: 'ONLINE' },
    { label: 'Đang cài đặt', value: 'SETTING_UP' },
    { label: 'Đang chờ', value: 'PENDING' },
    { label: 'Lỗi', value: 'ERROR' },
  ];

  const filteredServers = servers.filter((server) => {
    const matchesQuery = server.name.toLowerCase().includes(queryValue.toLowerCase()) || 
                        server.host.toLowerCase().includes(queryValue.toLowerCase());
    
    const matchesTab = selectedTab === 0 || 
                      (selectedTab === 1 && server.status === 'ONLINE') ||
                      (selectedTab === 2 && server.status === 'SETTING_UP') ||
                      (selectedTab === 3 && server.status === 'PENDING') ||
                      (selectedTab === 4 && server.status === 'ERROR');

    return matchesQuery && matchesTab;
  });

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          toast.success('Xóa máy chủ thành công');
        },
      });
    }
  }, [deleteId, deleteMutation]);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3.5 animate-pulse">
        <div className="h-6 bg-slate-100/80 rounded w-1/4 mb-4" />
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 bg-slate-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredServers.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedServers = filteredServers.slice(startIndex, startIndex + itemsPerPage);

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return (
          <Chip size="sm" variant="soft" color="success" className="font-semibold text-[10px] uppercase">
            Trực tuyến
          </Chip>
        );
      case 'SETTING_UP':
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-semibold text-[10px] uppercase">
            Đang cài đặt
          </Chip>
        );
      case 'PENDING':
        return (
          <Chip size="sm" variant="soft" color="default" className="font-semibold text-[10px] uppercase">
            Đang chờ
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="soft" color="danger" className="font-semibold text-[10px] uppercase">
            Lỗi
          </Chip>
        );
    }
  };

  return (
    <div className="w-full">
      {/* Sleek Ultra-Compact Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 bg-white p-2 border border-slate-200 rounded-xl shadow-sm">
        {/* Left: Tab selectors */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {tabs.map((tab, idx) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedTab(idx);
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedTab === idx
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Search Input */}
        <div className="relative w-full sm:w-60">
          <input
            type="text"
            placeholder="Tìm kiếm máy chủ..."
            value={queryValue}
            onChange={(e) => {
              setQueryValue(e.target.value);
              setPage(1);
            }}
            className="w-full h-8 pl-8 pr-8 text-xs bg-white placeholder:text-slate-400 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150"
          />
          <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5 shrink-0" />
          </div>
          {queryValue && (
            <button
              onClick={() => {
                setQueryValue('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Servers Table list */}
      <div className="w-full border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <Table className="w-full text-left border-collapse">
          <Table.ScrollContainer>
            <Table.Content aria-label="Danh sách máy chủ">
              <Table.Header className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50">
                <Table.Column isRowHeader className="py-2.5 px-3">Tên Máy chủ</Table.Column>
                <Table.Column className="py-2.5 px-3">Địa chỉ IP</Table.Column>
                <Table.Column className="py-2.5 px-3">Trạng thái</Table.Column>
                <Table.Column className="py-2.5 px-3">Giới hạn Proxy</Table.Column>
                <Table.Column className="py-2.5 px-3">Cổng cuối (SV)</Table.Column>
                <Table.Column className="py-2.5 px-3 text-right">Thao tác</Table.Column>
              </Table.Header>
              <Table.Body className="divide-y divide-slate-100 text-xs">
                {paginatedServers.map((server: Server) => (
                  <Table.Row key={server.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                    <Table.Cell className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {server.name}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {server.host}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3">
                      {getStatusChip(server.status)}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3 font-medium text-slate-600">
                      {server.maxProxies}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3 font-mono text-slate-500 font-semibold">
                      {server.lastPort || '---'}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setActiveConfirmServer(server)}
                          disabled={server.status === 'SETTING_UP' || (setupMutation.isPending && setupMutation.variables === server.id)}
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg cursor-pointer transition-colors"
                          title="Thiết lập Server (Cài đặt Gost/IP)"
                        >
                          {setupMutation.isPending && setupMutation.variables === server.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></span>
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Bạn có chắc chắn muốn reset server? Tác vụ này sẽ xóa sạch toàn bộ Proxy!")) {
                              resetMutation.mutate(server.id, {
                                onSuccess: (job) => {
                                  setActiveJobId(job.jobId);
                                  toast.success('Đã gửi yêu cầu reset server');
                                }
                              });
                            }
                          }}
                          disabled={server.status === 'SETTING_UP' || (resetMutation.isPending && resetMutation.variables === server.id)}
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg cursor-pointer transition-colors"
                          title="Reset Server (Xóa hết Proxy)"
                        >
                          {resetMutation.isPending && resetMutation.variables === server.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin"></span>
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => syncMutation.mutate(server.id, {
                            onSuccess: (job) => {
                              setActiveJobId(job.jobId);
                              toast.success('Đã gửi yêu cầu đồng bộ');
                            }
                          })}
                          disabled={syncMutation.isPending && syncMutation.variables === server.id}
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg cursor-pointer transition-colors"
                          title="Đồng bộ cổng từ Server"
                        >
                          {syncMutation.isPending && syncMutation.variables === server.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin"></span>
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onEdit(server)}
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(server.id)}
                          className="inline-flex items-center justify-center p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Xóa Server"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {paginatedServers.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Danh sách máy chủ hiện đang trống.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

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

      {/* Modern Compact Overlay Modal for Deleting Server */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 text-danger">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Xác nhận xóa máy chủ?
              </h3>
              <button 
                onClick={() => setDeleteId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white">
              Bạn có chắc chắn muốn xóa máy chủ này? Hành động này không thể hoàn tác và sẽ ảnh hưởng đến các Proxy đang chạy trên máy chủ này.
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setDeleteId(null)}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={handleDelete}
                isDisabled={deleteMutation.isPending}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1"
              >
                {deleteMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Xóa máy chủ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Compact Overlay Modal for Setup Server */}
      {activeConfirmServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 shrink-0 text-slate-600" />
                Xác nhận thiết lập máy chủ?
              </h3>
              <button 
                onClick={() => setActiveConfirmServer(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white space-y-3">
              {activeConfirmServer.status === 'ONLINE' && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-600 font-bold flex gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>
                    ⚠️ CẢNH BÁO: Máy chủ này đang ở trạng thái HOẠT ĐỘNG (ONLINE). Việc thiết lập lại sẽ xóa sạch toàn bộ cấu hình Proxy hiện tại và ngắt các kết nối đang chạy!
                  </span>
                </div>
              )}
              <p>
                Hệ thống sẽ thực hiện dọn dẹp (Deep Clean) và cài đặt lại toàn bộ môi trường Super-V5.0.0 trên máy chủ <b>{activeConfirmServer.host}</b>.
              </p>
              <p className="text-[11px] text-slate-400">
                Quá trình này có thể mất 1-2 phút. Bạn có muốn tiếp tục không?
              </p>
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setActiveConfirmServer(null)}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="primary"
                isDisabled={setupMutation.isPending}
                onPress={() => {
                  setupMutation.mutate(activeConfirmServer.id, {
                    onSuccess: (job) => {
                      setActiveJobId(job.jobId);
                      setActiveConfirmServer(null);
                      toast.success('Đã gửi yêu cầu thiết lập');
                    }
                  });
                }}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1"
              >
                {setupMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Bắt đầu thiết lập
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Job execution feedback modal */}
      <JobProgressModal 
        key={activeJobId || 'none'}
        jobId={activeJobId}
        open={!!activeJobId}
        onClose={() => setActiveJobId(null)}
        onCompleted={() => {
          queryClient.invalidateQueries({ queryKey: ['servers'] });
          queryClient.invalidateQueries({ queryKey: ['proxies'] });
          toast.success('Xử lý hoàn tất');
        }}
      />
    </div>
  );
}
