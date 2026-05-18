'use client';

import { SearchField, Label, Table, Chip, Button, Checkbox, Popover, PopoverTrigger, PopoverContent, Selection, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from '@heroui/react';
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

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

  // Columns visibility state: default hide status column
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['server', 'info', 'expiration', 'comment']);

  // Filters State
  const [queryValue, setQueryValue] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterLocationId, setFilterLocationId] = useState<string[]>([]);

  // Delete Modal State
  const [deleteConfirmState, setDeleteConfirmState] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });

  // Tabs: Tất cả / Còn hạn / Hết hạn
  const [itemStrings] = useState(['Tất cả', 'Còn hạn', 'Hết hạn']);
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const resetPage = useCallback(() => {
    setPage(1);
    setSelectedKeys(new Set());
  }, []);

  const isColumnVisible = useCallback((columnKey: string) => {
    return visibleColumns.includes(columnKey);
  }, [visibleColumns]);

  const renderedColumnsCount = useMemo(() => {
    let count = 2; // Selection checkbox + Thao tác (Actions)
    if (isColumnVisible('server')) count++;
    if (isColumnVisible('info')) count++;
    if (isColumnVisible('expiration')) count++;
    if (isColumnVisible('status')) count++;
    if (isColumnVisible('comment')) count++;
    return count;
  }, [visibleColumns, isColumnVisible]);

  const toggleColumn = useCallback((columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  }, []);

  const [sortSelected, setSortSelected] = useState(['id desc']);
  const sortOptions = [
    { label: 'Ngày tạo', value: 'id asc', directionLabel: 'Cũ nhất' },
    { label: 'Ngày tạo', value: 'id desc', directionLabel: 'Mới nhất' },
  ];

  const locationLabel = useMemo(() => {
    const selectedNames = filterLocationId.map(id => locations.find(l => l.id === id)?.name || id);
    if (selectedNames.length === 0) return "Vị trí";
    if (selectedNames.length <= 2) return `Vị trí: ${selectedNames.join(', ')}`;
    return `Vị trí: ${selectedNames.slice(0, 2).join(', ')} (+${selectedNames.length - 2})`;
  }, [filterLocationId, locations]);

  const hasActiveFilters = filterLocationId.length > 0;

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
  const selectedIds = useMemo(() => {
    if (selectedKeys === 'all') {
      return filteredProxies.map(p => p.id);
    }
    return Array.from(selectedKeys as Set<string>);
  }, [selectedKeys, filteredProxies]);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmState.id) {
      deleteMutation.mutate(deleteConfirmState.id, {
        onSuccess: () => {
          setDeleteConfirmState({ isOpen: false, id: null });
          toast.success('Xóa Proxy thành công');
        }
      });
    } else {
      bulkDeleteMutation.mutate(selectedIds, {
        onSuccess: () => {
          setSelectedKeys(new Set());
          setDeleteConfirmState({ isOpen: false, id: null });
          toast.success('Xóa hàng loạt thành công');
        }
      });
    }
  }, [deleteConfirmState.id, selectedIds, deleteMutation, bulkDeleteMutation]);

  const handleCopyProxies = useCallback(() => {
    const selectedProxies = filteredProxies.filter(p => selectedIds.includes(p.id));
    if (selectedProxies.length === 0) return;
    
    const text = selectedProxies.map(p => {
      const host = p.server?.host || '0.0.0.0';
      return `${host}:${p.port}:${p.username}:${p.password}`;
    }).join('\n');

    copyToClipboard(text).then(success => {
      if (success) toast.success(`Đã copy ${selectedProxies.length} proxy`);
    });
    setSelectedKeys(new Set());
  }, [selectedIds, filteredProxies]);

  const handleExportProxies = useCallback(() => {
    const selectedProxies = filteredProxies.filter(p => selectedIds.includes(p.id));
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
    setSelectedKeys(new Set());
  }, [selectedIds, filteredProxies]);

  const handleBulkToggleAutoRenew = (status: boolean) => {
    bulkUpdateAutoRenewMutation.mutate({ ids: selectedIds, autoRenew: status }, { 
      onSuccess: () => {
        setSelectedKeys(new Set());
        toast.success('Cập nhật tự động gia hạn thành công');
      } 
    });
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Chip size="sm" variant="soft" color="success" className="font-medium text-[10px] uppercase">
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
          <Chip size="sm" variant="soft" color="danger" className="font-medium text-[10px] uppercase">
            Lỗi
          </Chip>
        );
    }
  };

  return (
    <div className="w-full">
      {/* Sleek Floating Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 mb-3 bg-blue-50 border border-blue-100 rounded-xl animate-fade-in text-xs font-semibold text-blue-800 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Đã chọn {selectedIds.length} proxy</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              onPress={handleCopyProxies}
              className="cursor-pointer h-7 px-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg flex items-center gap-1 border-0"
            >
              <Icon icon="lucide:clipboard" className="w-3.5 h-3.5 shrink-0" />
              Copy
            </Button>
            <Button
              size="sm"
              onPress={handleExportProxies}
              className="cursor-pointer h-7 px-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg flex items-center gap-1 border-0"
            >
              <Icon icon="lucide:download" className="w-3.5 h-3.5 shrink-0" />
              Xuất file
            </Button>
            <Button
              size="sm"
              onPress={() => handleBulkToggleAutoRenew(true)}
              className="cursor-pointer h-7 px-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold rounded-lg border-0"
            >
              Bật gia hạn tự động
            </Button>
            <Button
              size="sm"
              onPress={() => handleBulkToggleAutoRenew(false)}
              className="cursor-pointer h-7 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg border-0"
            >
              Tắt gia hạn tự động
            </Button>
            <Button
              size="sm"
              onPress={() => setDeleteConfirmState({ isOpen: true, id: null })}
              className="cursor-pointer h-7 px-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg border-0"
            >
              Xóa
            </Button>
            <button
              onClick={() => setSelectedKeys(new Set())}
              className="text-blue-500 hover:text-blue-700 cursor-pointer p-1 hover:bg-blue-100 rounded-lg transition-colors ml-1 animate-none flex items-center justify-center border-none bg-transparent"
            >
              <Icon icon="lucide:x" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Flat Premium Toolbar - Single Row, No Outer Background/Padding */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 mt-1">
        {/* Left: Tabs & Popovers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 mr-2 bg-slate-100/60 p-0.5 rounded-lg">
            {itemStrings.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedTab(idx);
                  setPage(1);
                  setSelectedKeys(new Set());
                }}
                className={`px-2.5 py-1 text-sm font-medium rounded-md transition-all cursor-pointer whitespace-nowrap border-none ${
                  selectedTab === idx
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 bg-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Location Filter Popover */}
          <Popover>
            <PopoverTrigger>
              <button className={`h-8 px-2.5 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 shadow-none ${
                filterLocationId.length > 0 ? 'bg-blue-50/50 border border-blue-200 text-blue-600' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
              }`}>
                <Icon icon="lucide:map-pin" className={`w-4 h-4 ${filterLocationId.length > 0 ? 'text-blue-500' : 'text-slate-400'}`} />
                <span>{locationLabel}</span>
                <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom start" offset={8} className="p-3 w-48 border border-slate-200 rounded-lg shadow-md bg-white">
              <div className="flex flex-col gap-2 w-full">
                {locations.map(loc => (
                  <div key={loc.id} className="flex items-center">
                    <Checkbox
                      isSelected={filterLocationId.includes(loc.id)}
                      onChange={(isSelected) => {
                        const newLocs = isSelected
                          ? [...filterLocationId, loc.id]
                          : filterLocationId.filter(id => id !== loc.id);
                        setFilterLocationId(newLocs);
                        resetPage();
                      }}
                      className="text-sm font-medium text-slate-700 select-none cursor-pointer"
                    >
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      {loc.name}
                    </Checkbox>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Reset Filter Button */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setFilterLocationId([]);
                resetPage();
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer transition-colors border-none bg-transparent ml-1"
            >
              Xóa lọc
            </button>
          )}
        </div>

        {/* Right: Search, Sort & Columns */}
        <div className="flex items-center gap-2">
          {/* Search Pill */}
          <SearchField 
            name="search"
            aria-label="Tìm kiếm proxy"
            value={queryValue}
            onChange={(value) => {
              setQueryValue(value);
              resetPage();
            }}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input className="w-[200px]" placeholder="Tìm kiếm..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          {/* Sort Popover */}
          <Popover>
            <PopoverTrigger>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 bg-white transition-all duration-150 cursor-pointer outline-none shadow-none" title="Sắp xếp">
                <Icon icon="lucide:arrow-up-down" className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom end" offset={8} className="p-2 w-44 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md z-50">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortSelected([opt.value]);
                    resetPage();
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors cursor-pointer border-none bg-transparent ${
                    sortSelected[0] === opt.value
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label} ({opt.directionLabel})
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Columns Toggle Popover */}
          <Popover>
            <PopoverTrigger>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 bg-white transition-all duration-150 cursor-pointer outline-none shadow-none" title="Hiển thị cột">
                <Icon icon="lucide:columns" className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom end" offset={8} className="p-3 w-48 border border-slate-200 rounded-lg shadow-md bg-white">
              <div className="flex flex-col gap-2 w-full">
                <span className="text-sm font-medium text-slate-500 mb-1">Bật/tắt các cột</span>
                {[
                  { key: 'server', label: 'Máy chủ' },
                  { key: 'info', label: 'Thông tin Proxy' },
                  { key: 'expiration', label: 'Hết hạn' },
                  { key: 'status', label: 'Trạng thái' },
                  { key: 'comment', label: 'Ghi chú' },
                ].map(col => (
                  <div key={col.key} className="flex items-center">
                    <Checkbox
                      isSelected={isColumnVisible(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      className="text-sm font-medium text-slate-700 select-none cursor-pointer"
                    >
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      {col.label}
                    </Checkbox>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* User Proxies Table list */}
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Danh sách Proxy của tôi"
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            onSelectionChange={setSelectedKeys}
          >
            <Table.Header>
              <Table.Column className="pr-0">
                <Checkbox
                  aria-label="Select all"
                  slot="selection"
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox>
              </Table.Column>
              {isColumnVisible('server') && <Table.Column isRowHeader>Máy chủ</Table.Column>}
              {isColumnVisible('info') && <Table.Column className="w-60">Thông tin Proxy</Table.Column>}
              {isColumnVisible('expiration') && <Table.Column className="w-40">Hết hạn</Table.Column>}
              {isColumnVisible('status') && <Table.Column>Trạng thái</Table.Column>}
              {isColumnVisible('comment') && <Table.Column>Ghi chú</Table.Column>}
              <Table.Column className="text-end">Thao tác</Table.Column>
            </Table.Header>
            <Table.Body>
              {paginatedProxies.map((proxy: ProxyWithServer) => (
                <Table.Row key={proxy.id} id={proxy.id}>
                  <Table.Cell className="pr-0 align-top">
                    <Checkbox
                      aria-label="Select row"
                      slot="selection"
                    >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox>
                    </Table.Cell>
                    {isColumnVisible('server') && (
                      <Table.Cell className="align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-800">
                            {proxy.server?.name || proxy.server?.host || 'Không xác định'}
                          </span>
                          <div className="flex items-center mt-0.5">
                            <Chip size="sm" variant="soft" color="accent" className="font-medium text-xs uppercase px-1 py-0 h-4">
                              {proxy.ipType}
                            </Chip>
                          </div>
                        </div>
                      </Table.Cell>
                    )}
                    {isColumnVisible('info') && (
                      <Table.Cell className="align-top">
                        <div className="space-y-1 py-1 max-w-[240px]">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-xs text-slate-500 select-none">IP:PORT</span>
                            <div className="flex-1 border-b border-dotted border-slate-300"></div>
                            <span className="font-mono font-medium text-slate-700">{proxy.server?.host}:{proxy.port}</span>
                          </div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-xs text-slate-500 select-none">Tài khoản</span>
                            <div className="flex-1 border-b border-dotted border-slate-300"></div>
                            <span className="font-mono font-semibold text-slate-600">{proxy.username}</span>
                          </div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-xs text-slate-500 select-none">Mật khẩu</span>
                            <div className="flex-1 border-b border-dotted border-slate-300"></div>
                            <span className="font-mono font-semibold text-slate-600">{proxy.password}</span>
                          </div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-xs text-slate-500 select-none">Loại</span>
                            <div className="flex-1 border-b border-dotted border-slate-300"></div>
                            <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-1 rounded">HTTPS/SOCKS5</span>
                          </div>
                          {proxy.ipv6 && (
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <span className="text-xs text-slate-500 select-none">IPv6</span>
                              <div className="flex-1 border-b border-dotted border-slate-300"></div>
                              <span className="font-mono text-slate-500 overflow-hidden text-ellipsis max-w-[120px]" title={proxy.ipv6}>
                                {proxy.ipv6}
                              </span>
                            </div>
                          )}
                        </div>
                      </Table.Cell>
                    )}
                    {isColumnVisible('expiration') && (
                      <Table.Cell className="align-top">
                        {(() => {
                          const isExpired = proxy.expiresAt ? new Date(proxy.expiresAt) <= new Date() : false;
                          const valueColorClass = isExpired 
                            ? "text-slate-400" 
                            : (proxy.autoRenew ? "text-emerald-600" : "text-amber-600");
                          return (
                            <div className="space-y-1 max-w-[160px]">
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className="text-xs text-slate-500 select-none">Hết hạn</span>
                                <div className="flex-1 border-b border-dotted border-slate-300"></div>
                                <span className={`font-medium ${valueColorClass}`}>
                                  {proxy.expiresAt ? format(new Date(proxy.expiresAt), 'dd/MM/yyyy HH:mm') : 'Vĩnh viễn'}
                                </span>
                              </div>
                              {proxy.expiresAt && (
                                <>
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="text-xs text-slate-500 select-none">Còn lại</span>
                                    <div className="flex-1 border-b border-dotted border-slate-300"></div>
                                    <span className={`font-medium ${valueColorClass}`}>
                                      {getCountdown(proxy.expiresAt)}
                                    </span>
                                  </div>
                                  {proxy.autoRenew && !isExpired && (
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                      <span className="text-xs text-slate-500 select-none">Gia hạn tự động</span>
                                      <div className="flex-1 border-b border-dotted border-slate-300"></div>
                                      <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                                        <Icon icon="lucide:check" className="w-3.5 h-3.5 shrink-0" />
                                        Bật
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </Table.Cell>
                    )}
                    {isColumnVisible('status') && (
                      <Table.Cell className="align-top">
                        {getStatusChip(proxy.status)}
                      </Table.Cell>
                    )}
                    {isColumnVisible('comment') && (
                      <Table.Cell className="align-top">
                        {proxy.comment ? (
                          <div className="group relative cursor-pointer text-slate-400 hover:text-slate-600">
                            <Icon icon="lucide:file-text" className="w-4 h-4" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-36 bg-slate-800 text-xs text-white p-2 rounded shadow-lg z-20 pointer-events-none leading-relaxed">
                              {proxy.comment}
                            </div>
                          </div>
                        ) : '-'}
                      </Table.Cell>
                    )}
                    <Table.Cell className="align-top text-right">
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
                          <Icon icon="lucide:clipboard" className="w-3.5 h-3.5" />
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
                            <Icon icon="lucide:search" className="w-3.5 h-3.5" />
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
                            <Icon icon="lucide:refresh-cw" className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmState({ isOpen: true, id: proxy.id })}
                          className="inline-flex items-center justify-center p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Xóa Proxy"
                        >
                          <Icon icon="lucide:trash2" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {paginatedProxies.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={renderedColumnsCount} className="py-12 text-center text-slate-400 font-medium">
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
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-slate-100 text-xs bg-slate-50/50 mt-4">
          <span className="text-slate-400 font-medium">Trang {page} / {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <Button
              isDisabled={page <= 1}
              onPress={() => setPage(page - 1)}
              className="px-2.5 py-1 text-sm border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-medium h-8 min-w-0 rounded-lg cursor-pointer transition-all"
            >
              Trước
            </Button>
            <Button
              isDisabled={page >= totalPages}
              onPress={() => setPage(page + 1)}
              className="px-2.5 py-1 text-sm border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-medium h-8 min-w-0 rounded-lg cursor-pointer transition-all"
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Modern Compact Overlay Modal for Deleting User Proxy */}
      {deleteConfirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 text-danger">
                <Icon icon="lucide:alert-triangle" className="w-4 h-4 shrink-0" />
                Xác nhận xóa Proxy?
              </h3>
              <button 
                onClick={() => setDeleteConfirmState({ isOpen: false, id: null })}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white">
              Bạn có chắc chắn muốn xóa {deleteConfirmState.id ? 'proxy này' : `${selectedIds.length} proxy đã chọn`}? Thao tác này không thể hoàn tác và cấu hình proxy trên máy chủ sẽ bị xóa vĩnh viễn.
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setDeleteConfirmState({ isOpen: false, id: null })}
                className="cursor-pointer font-medium text-sm h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={handleDeleteConfirm}
                isDisabled={deleteConfirmState.id ? deleteMutation.isPending : bulkDeleteMutation.isPending}
                className="cursor-pointer font-medium text-sm h-9 px-3 rounded-lg flex items-center gap-1 bg-red-500 text-white"
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
