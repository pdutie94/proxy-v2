'use client';

import { Table, Chip, Button } from "@heroui/react";
import { 
  Clipboard, 
  Download, 
  RefreshCw, 
  Trash2, 
  Search, 
  X, 
  AlertTriangle, 
  Check, 
  ChevronDown, 
  FileText 
} from "lucide-react";
import { format } from "date-fns";
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/utils/clipboard';
import { getCountdown } from '@/utils/date';
import { ProxyWithServer } from '@/types';
import { useProxies } from '@/hooks/use-proxies';
import { useLocations } from '@/modules/locations/hooks/use-locations';

interface UserProxyIndexTableProps {
  proxies: ProxyWithServer[];
}

export function UserProxyIndexTable({ proxies: initialProxies }: UserProxyIndexTableProps) {
  const { 
    rotateProxyMutation, 
    checkGoogleMutation,
    bulkUpdateAutoRenewMutation,
    deleteMutation,
    bulkDeleteMutation,
    proxies: displayProxies
  } = useProxies(initialProxies);

  const { data: locationsData } = useLocations();
  const locations = locationsData ?? [];

  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  // Filters State
  const [queryValue, setQueryValue] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterLocationId, setFilterLocationId] = useState<string[]>([]);

  // Delete Modal State
  const [deleteConfirmState, setDeleteConfirmState] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmState.id) {
      deleteMutation.mutate(deleteConfirmState.id, {
        onSuccess: () => {
          setDeleteConfirmState({ isOpen: false, id: null });
          toast.success('Xóa Proxy thành công');
        }
      });
    } else {
      bulkDeleteMutation.mutate(selectedResources, {
        onSuccess: () => {
          setSelectedResources([]);
          setDeleteConfirmState({ isOpen: false, id: null });
          toast.success('Xóa hàng loạt thành công');
        }
      });
    }
  }, [deleteConfirmState.id, selectedResources, deleteMutation, bulkDeleteMutation]);

  // Tabs: Tất cả / Còn hạn / Hết hạn
  const [itemStrings] = useState(['Tất cả', 'Còn hạn', 'Hết hạn']);
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const resetPage = useCallback(() => {
    setPage(1);
    setSelectedResources([]);
  }, []);

  const [sortSelected, setSortSelected] = useState(['id desc']);
  const sortOptions = [
    { label: 'Ngày tạo', value: 'id asc', directionLabel: 'Cũ nhất' },
    { label: 'Ngày tạo', value: 'id desc', directionLabel: 'Mới nhất' },
  ];

  const filteredProxies = useMemo(() => {
    const now = new Date();
    const result = (displayProxies as ProxyWithServer[]).filter((proxy) => {
      // Tab filter
      const tabName = itemStrings[selectedTab];
      if (tabName === 'Còn hạn') {
        if (!proxy.expiresAt || new Date(proxy.expiresAt) <= now) return false;
      }
      if (tabName === 'Hết hạn') {
        if (!proxy.expiresAt || new Date(proxy.expiresAt) > now) return false;
      }

      // Search bar: port hoặc username
      if (queryValue) {
        const q = queryValue.toLowerCase();
        if (
          !proxy.port.toString().includes(queryValue) &&
          !proxy.username.toLowerCase().includes(q)
        ) return false;
      }

      // Filter: trạng thái
      if (filterStatus.length > 0 && !filterStatus.includes(proxy.status)) {
        return false;
      }

      // Filter: vị trí (location)
      if (filterLocationId.length > 0) {
        const serverLocationId = proxy.server?.locationId ?? null;
        if (!serverLocationId || !filterLocationId.includes(serverLocationId)) return false;
      }

      return true;
    });

    // Sort
    if (sortSelected.length > 0) {
      const [, direction] = sortSelected[0].split(' ');
      result.sort((a, b) => {
        const valA = new Date(a.createdAt).getTime();
        const valB = new Date(b.createdAt).getTime();
        return direction === 'asc' ? valA - valB : valB - valA;
      });
    }

    return result;
  }, [displayProxies, selectedTab, queryValue, filterStatus, filterLocationId, sortSelected, itemStrings]);

  const totalPages = Math.ceil(filteredProxies.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedProxies = filteredProxies.slice(startIndex, startIndex + itemsPerPage);

  // SELECTION LOGIC
  const isAllSelected = paginatedProxies.length > 0 && paginatedProxies.every(p => selectedResources.includes(p.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedResources(prev => prev.filter(id => !paginatedProxies.map(p => p.id).includes(id)));
    } else {
      setSelectedResources(prev => Array.from(new Set([...prev, ...paginatedProxies.map(p => p.id)])));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedResources(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCopyProxies = useCallback(() => {
    const selectedProxies = filteredProxies.filter(p => selectedResources.includes(p.id));
    if (selectedProxies.length === 0) return;
    
    const text = selectedProxies.map(p => {
      const host = p.server?.host || '0.0.0.0';
      return `${host}:${p.port}:${p.username}:${p.password}`;
    }).join('\n');

    copyToClipboard(text).then(success => {
      if (success) toast.success(`Đã copy ${selectedProxies.length} proxy`);
    });
    setSelectedResources([]);
  }, [selectedResources, filteredProxies]);

  const handleExportProxies = useCallback(() => {
    const selectedProxies = filteredProxies.filter(p => selectedResources.includes(p.id));
    if (selectedProxies.length === 0) return;
    
    const text = selectedProxies.map(p => {
      const host = p.server?.host || '0.0.0.0';
      return `${host}:${p.port}:${p.username}:${p.password}`;
    }).join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_proxies_${format(new Date(), 'yyyyMMdd_HHmmss')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Đã xuất ${selectedProxies.length} proxy`);
    setSelectedResources([]);
  }, [selectedResources, filteredProxies]);

  const handleBulkToggleAutoRenew = (status: boolean) => {
    bulkUpdateAutoRenewMutation.mutate({ ids: selectedResources, autoRenew: status }, { 
      onSuccess: () => {
        setSelectedResources([]);
        toast.success('Cập nhật tự động gia hạn thành công');
      } 
    });
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Chip size="sm" variant="soft" color="success" className="font-semibold text-[10px] uppercase">
            Hoạt động
          </Chip>
        );
      case 'CREATING':
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-semibold text-[10px] uppercase animate-pulse">
            Đang tạo
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
      {/* Sleek Floating Batch Actions Bar */}
      {selectedResources.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 mb-3 bg-blue-50 border border-blue-100 rounded-xl animate-fade-in text-xs font-semibold text-blue-800 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Đã chọn {selectedResources.length} proxy</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              onPress={handleCopyProxies}
              className="cursor-pointer h-7 px-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg flex items-center gap-1 border-0"
            >
              <Clipboard className="w-3.5 h-3.5 shrink-0" />
              Copy
            </Button>
            <Button
              size="sm"
              onPress={handleExportProxies}
              className="cursor-pointer h-7 px-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg flex items-center gap-1 border-0"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              Xuất file
            </Button>
            <Button
              size="sm"
              onPress={() => handleBulkToggleAutoRenew(true)}
              className="cursor-pointer h-7 px-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-lg border-0"
            >
              Bật gia hạn tự động
            </Button>
            <Button
              size="sm"
              onPress={() => handleBulkToggleAutoRenew(false)}
              className="cursor-pointer h-7 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg border-0"
            >
              Tắt gia hạn tự động
            </Button>
            <Button
              size="sm"
              onPress={() => setDeleteConfirmState({ isOpen: true, id: null })}
              className="cursor-pointer h-7 px-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg border-0"
            >
              Xóa
            </Button>
            <button
              onClick={() => setSelectedResources([])}
              className="text-blue-500 hover:text-blue-700 cursor-pointer p-1 hover:bg-blue-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sleek Ultra-Compact Filter & Search Bar */}
      <div className="flex flex-col gap-2.5 mb-3 bg-white p-2.5 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {itemStrings.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedTab(idx);
                  setPage(1);
                  setSelectedResources([]);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  selectedTab === idx
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Right: Search, Location & Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-40">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={queryValue}
                onChange={(e) => { setQueryValue(e.target.value); resetPage(); }}
                className="w-full h-8 pl-8 pr-8 text-xs bg-white placeholder:text-slate-400 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150"
              />
              <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5 shrink-0" />
              </div>
              {queryValue && (
                <button
                  onClick={() => { setQueryValue(''); resetPage(); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Location Select Filter */}
            <div className="relative">
              <select
                value={filterLocationId[0] || ''}
                onChange={(e) => { setFilterLocationId(e.target.value ? [e.target.value] : []); resetPage(); }}
                className="h-8 pl-3 pr-8 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none cursor-pointer appearance-none transition-all duration-150"
              >
                <option value="">Tất cả vị trí</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>

            {/* Sort Select */}
            <div className="relative">
              <select
                value={sortSelected[0]}
                onChange={(e) => setSortSelected([e.target.value])}
                className="h-8 pl-3 pr-8 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none cursor-pointer appearance-none transition-all duration-150"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>Sắp xếp: {opt.label} ({opt.directionLabel})</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Proxies Table list */}
      <div className="w-full border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <Table className="w-full text-left border-collapse">
          <Table.ScrollContainer>
            <Table.Content aria-label="Danh sách Proxy của tôi">
              <Table.Header className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50">
                <Table.Column className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500/50 cursor-pointer"
                  />
                </Table.Column>
                <Table.Column isRowHeader className="py-2.5 px-3">Máy chủ</Table.Column>
                <Table.Column className="py-2.5 px-3 w-60">Thông tin Proxy</Table.Column>
                <Table.Column className="py-2.5 px-3 w-40">Hết hạn</Table.Column>
                <Table.Column className="py-2.5 px-3">Trạng thái</Table.Column>
                <Table.Column className="py-2.5 px-3">Ghi chú</Table.Column>
                <Table.Column className="py-2.5 px-3 text-right">Thao tác</Table.Column>
              </Table.Header>
              <Table.Body className="divide-y divide-slate-100 text-xs">
                {paginatedProxies.map((proxy: ProxyWithServer) => (
                  <Table.Row key={proxy.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                    <Table.Cell className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedResources.includes(proxy.id)}
                        onChange={() => toggleSelectRow(proxy.id)}
                        className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500/50 cursor-pointer"
                      />
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800">
                          {proxy.server?.name || proxy.server?.host || 'Không xác định'}
                        </span>
                        <div className="flex items-center mt-0.5">
                          <Chip size="sm" variant="soft" color="accent" className="font-semibold text-[9px] uppercase px-1 py-0 h-4">
                            {proxy.ipType}
                          </Chip>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3">
                      <div className="space-y-1 py-1 max-w-[240px]">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-[10px] text-slate-400 select-none">IP:PORT</span>
                          <div className="flex-1 border-b border-dotted border-slate-200"></div>
                          <span className="font-mono font-bold text-slate-700">{proxy.server?.host}:{proxy.port}</span>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-[10px] text-slate-400 select-none">Tài khoản</span>
                          <div className="flex-1 border-b border-dotted border-slate-200"></div>
                          <span className="font-mono font-semibold text-slate-600">{proxy.username}</span>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-[10px] text-slate-400 select-none">Mật khẩu</span>
                          <div className="flex-1 border-b border-dotted border-slate-200"></div>
                          <span className="font-mono font-semibold text-slate-600">{proxy.password}</span>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-[10px] text-slate-400 select-none">Loại</span>
                          <div className="flex-1 border-b border-dotted border-slate-200"></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-1 rounded">HTTPS/SOCKS5</span>
                        </div>
                        {proxy.ipv6 && (
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-[10px] text-slate-400 select-none">IPv6</span>
                            <div className="flex-1 border-b border-dotted border-slate-200"></div>
                            <span className="font-mono text-slate-500 overflow-hidden text-ellipsis max-w-[120px]" title={proxy.ipv6}>
                              {proxy.ipv6}
                            </span>
                          </div>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3">
                      <div className="space-y-1 max-w-[160px]">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-[10px] text-slate-400 select-none">Hết hạn</span>
                          <div className="flex-1 border-b border-dotted border-slate-200"></div>
                          <span className={`font-semibold ${proxy.autoRenew ? "text-emerald-600" : "text-amber-600"}`}>
                            {proxy.expiresAt ? format(new Date(proxy.expiresAt), 'dd/MM/yyyy HH:mm') : 'Vĩnh viễn'}
                          </span>
                        </div>
                        {proxy.expiresAt && (
                          <>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <span className="text-[10px] text-slate-400 select-none">Còn lại</span>
                              <div className="flex-1 border-b border-dotted border-slate-200"></div>
                              <span className={`font-bold ${proxy.autoRenew ? "text-emerald-600" : "text-amber-600"}`}>
                                {getCountdown(proxy.expiresAt)}
                              </span>
                            </div>
                            {proxy.autoRenew && (
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className="text-[10px] text-slate-400 select-none">Gia hạn tự động</span>
                                <div className="flex-1 border-b border-dotted border-slate-200"></div>
                                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                  <Check className="w-3.5 h-3.5 shrink-0" />
                                  Bật
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3">
                      {getStatusChip(proxy.status)}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3">
                      {proxy.comment ? (
                        <div className="group relative cursor-pointer text-slate-400 hover:text-slate-600">
                          <FileText className="w-4 h-4" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-36 bg-slate-800 text-[10px] text-white p-2 rounded shadow-lg z-20 pointer-events-none leading-relaxed">
                            {proxy.comment}
                          </div>
                        </div>
                      ) : '-'}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            const text = `${proxy.server?.host}:${proxy.port}:${proxy.username}:${proxy.password}`;
                            copyToClipboard(text).then(success => {
                              if (success) toast.success('Đã copy proxy');
                            });
                          }}
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                          title="Sao chép"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => checkGoogleMutation.mutate(proxy.id)}
                          disabled={proxy.status !== 'ACTIVE' || checkGoogleMutation.isPending}
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg cursor-pointer transition-colors"
                          title="Kiểm tra Google"
                        >
                          {checkGoogleMutation.isPending && checkGoogleMutation.variables === proxy.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></span>
                          ) : (
                            <Search className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => rotateProxyMutation.mutate(proxy.id)}
                          disabled={proxy.status !== 'ACTIVE' || proxy.ipType !== 'IPv6' || rotateProxyMutation.isPending}
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg cursor-pointer transition-colors"
                          title="Đổi IP (Rotate)"
                        >
                          {rotateProxyMutation.isPending && rotateProxyMutation.variables === proxy.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></span>
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmState({ isOpen: true, id: proxy.id })}
                          className="inline-flex items-center justify-center p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Xóa Proxy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {paginatedProxies.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      Danh sách Proxy hiện đang trống.
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

      {/* Modern Compact Overlay Modal for Deleting User Proxy */}
      {deleteConfirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 text-danger">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Xác nhận xóa Proxy?
              </h3>
              <button 
                onClick={() => setDeleteConfirmState({ isOpen: false, id: null })}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white">
              Bạn có chắc chắn muốn xóa {deleteConfirmState.id ? 'proxy này' : `${selectedResources.length} proxy đã chọn`}? Thao tác này không thể hoàn tác và cấu hình proxy trên máy chủ sẽ bị xóa vĩnh viễn.
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setDeleteConfirmState({ isOpen: false, id: null })}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={handleDeleteConfirm}
                isDisabled={deleteConfirmState.id ? deleteMutation.isPending : bulkDeleteMutation.isPending}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1"
              >
                {(deleteConfirmState.id ? deleteMutation.isPending : bulkDeleteMutation.isPending) && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
