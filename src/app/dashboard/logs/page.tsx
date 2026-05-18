"use client";

import { format } from "date-fns";
import { useLogs } from "@/hooks/use-logs";
import { useState, useCallback, useMemo } from "react";
import { ServerJob, Server, Proxy } from "@prisma/client";
import { Icon } from '@iconify/react';
import { Button, Table, Pagination, Chip, SearchField, Skeleton, EmptyState } from "@heroui/react";

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

  const [queryValue, setQueryValue] = useState('');

  const tabs = [
    { id: 'all', content: 'Tất cả' },
    { id: 'completed', content: 'Thành công' },
    { id: 'failed', content: 'Thất bại' },
    { id: 'active', content: 'Đang chạy' },
  ];

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

  const filteredLogs = useMemo(() => {
    return logs.filter((log: LogEntry) => {
      // Tab filter
      if (selectedTab === 1 && log.status !== 'COMPLETED') return false;
      if (selectedTab === 2 && log.status !== 'FAILED') return false;
      if (selectedTab === 3 && log.status !== 'ACTIVE') return false;

      // Search filter
      if (queryValue) {
        const jobTitle = getJobTitle(log).toLowerCase();
        const logContent = (log.logs || '').toLowerCase();
        const serverName = (log.server?.name || '').toLowerCase();
        const searchLower = queryValue.toLowerCase();

        return jobTitle.includes(searchLower) || logContent.includes(searchLower) || serverName.includes(searchLower);
      }

      return true;
    });
  }, [logs, selectedTab, queryValue]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const startItem = filteredLogs.length === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, filteredLogs.length);
  const pages = Array.from({length: totalPages}, (_, i) => i + 1);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Chip size="sm" variant="soft" color="success" className="font-medium">
            Thành công
          </Chip>
        );
      case 'FAILED':
        return (
          <Chip size="sm" variant="soft" color="danger" className="font-medium">
            Thất bại
          </Chip>
        );
      case 'ACTIVE':
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-medium">
            Đang chạy
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="soft" color="default" className="font-medium">
            Đang chờ
          </Chip>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">Nhật ký hệ thống</h1>
            <p className="text-xs text-slate-400">Đang tải lịch sử hoạt động...</p>
          </div>
        </div>

        {/* Flat Premium Toolbar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 mt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {[...Array(4)].map((_, idx) => (
              <Skeleton key={idx} className="h-8 w-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-9 w-64 rounded-lg" />
        </div>

        {/* Realistic Table Skeleton */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 pb-2 border-b border-slate-100">
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-3/5 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-4 w-12 rounded justify-self-end" />
          </div>
          {/* Table Body Rows */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b border-slate-50 items-center">
              <Skeleton className="h-4 w-4/5 rounded font-mono" />
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-7 w-7 rounded-md justify-self-end" />
            </div>
          ))}
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
          className="cursor-pointer font-medium text-sm h-8 w-36 flex items-center gap-1.5 self-start sm:self-auto rounded-lg"
        >
          <Icon icon="lucide:trash-2" className="w-4 h-4 shrink-0" />
          Dọn dẹp nhật ký
        </Button>
      </div>

      {/* Flat Premium Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 mt-1">
        {/* Left Side: Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedTab(idx);
                setPage(1);
              }}
              className={`h-8 px-3 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 shadow-none ${
                selectedTab === idx
                  ? 'bg-blue-50/50 border border-blue-200 text-blue-600'
                  : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
              }`}
            >
              <span>{tab.content}</span>
            </button>
          ))}
        </div>

        {/* Right Side: Search Input */}
        <SearchField 
          name="search"
          aria-label="Tìm sự kiện, nội dung"
          value={queryValue}
          onChange={(value) => {
            setQueryValue(value);
            setPage(1);
          }}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input className="w-[280px]" placeholder="Tìm sự kiện, nội dung..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {/* Logs Table representation */}
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Nhật ký hệ thống">
            <Table.Header>
              <Table.Column isRowHeader>Thời gian</Table.Column>
              <Table.Column>Loại công việc</Table.Column>
              <Table.Column>Máy chủ</Table.Column>
              <Table.Column>Trạng thái</Table.Column>
              <Table.Column className="text-end">Thao tác</Table.Column>
            </Table.Header>
            <Table.Body
              renderEmptyState={() => (
                <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center py-12">
                  <Icon className="size-6 text-slate-400" icon="gravity-ui:tray" />
                  <span className="text-sm text-slate-500 font-medium">Chưa có nhật ký nào phù hợp.</span>
                </EmptyState>
              )}
            >
              {paginatedLogs.map((log: LogEntry) => (
                <Table.Row key={log.id}>
                  <Table.Cell className="align-top  text-slate-500 whitespace-nowrap font-medium">
                    {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                  </Table.Cell>
                  <Table.Cell className="align-top  font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Icon icon="lucide:calendar" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{getJobTitle(log)}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="align-top  text-slate-600 font-medium whitespace-nowrap">
                    {log.server ? (
                      <div className="flex items-center gap-1.5">
                        <Icon icon="lucide:server" className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{log.server.name}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </Table.Cell>
                  <Table.Cell className="align-top">
                    {getStatusBadge(log.status)}
                  </Table.Cell>
                  <Table.Cell className="align-top text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="w-7 h-7 rounded-md bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-none flex items-center justify-center cursor-pointer transition-colors inline-flex"
                      title="Xem chi tiết"
                    >
                      <Icon icon="lucide:eye" className="w-3.5 h-3.5" />
                    </button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        {totalPages > 1 && (
          <Table.Footer>
            <Pagination size="sm">
              <Pagination.Summary>
                Hiển thị {startItem} - {endItem} trong tổng số {filteredLogs.length} kết quả
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page <= 1}
                    onPress={() => setPage(page - 1)}
                  >
                    <Pagination.PreviousIcon />
                    Trước
                  </Pagination.Previous>
                </Pagination.Item>
                {pages.map((p) => (
                  <Pagination.Item key={p}>
                    <Pagination.Link
                      isActive={p === page}
                      onPress={() => setPage(p)}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page >= totalPages}
                    onPress={() => setPage(page + 1)}
                  >
                    Sau
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Table.Footer>
        )}
      </Table>

      {/* Modern Compact Log Details Overlay Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl overflow-hidden shadow-lg flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">
                Chi tiết công việc: {getJobTitle(selectedLog)}
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors bg-transparent border-none flex items-center justify-center"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
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
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 text-danger">
                <Icon icon="lucide:alert-triangle" className="w-4 h-4 shrink-0 text-red-500" />
                Xác nhận dọn dẹp nhật ký?
              </h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors bg-transparent border-none flex items-center justify-center"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white">
              Hành động này sẽ xóa vĩnh viễn toàn bộ lịch sử công việc trong cơ sở dữ liệu. Bạn có chắc chắn muốn thực hiện?
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setIsDeleteModalOpen(false)}
                className="cursor-pointer font-medium text-sm h-9 px-3 border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={handleDeleteAll}
                isDisabled={isClearing}
                className="cursor-pointer font-medium text-sm h-9 px-3 flex items-center gap-1.5 bg-red-500 text-white"
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
