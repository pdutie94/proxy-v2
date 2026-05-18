"use client";

import { useProxies } from '@/hooks/use-proxies';
import { useServers } from '@/hooks/use-servers';
import { SearchField, Button, Table, Chip, Checkbox, Popover, PopoverTrigger, PopoverContent, Selection, Pagination, Skeleton, EmptyState } from "@heroui/react";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import React, { useState, useCallback, useMemo } from 'react';
import { JobProgressModal } from '@/components/jobs/job-progress-modal';
import { toast } from '@heroui/react';
import { useSession } from 'next-auth/react';
import { copyToClipboard } from '@/utils/clipboard';
import { getCountdown } from '@/utils/date';

import { ProxyWithServer, AuthUser } from '@/types';

interface ProxyListProps {
  onEdit: (proxy: ProxyWithServer) => void;
  onAdd?: () => void;
}

export function ProxyList({ onEdit }: ProxyListProps) {
  const { 
    proxies, 
    isLoading, 
    deleteMutation, 
    bulkDeleteMutation, 
    bulkRenewMutation,
    bulkUpdateAutoRenewMutation,
    rotateProxyMutation, 
    checkGoogleMutation 
  } = useProxies();
  const { data: session } = useSession();
  const userRole = (session?.user as AuthUser | undefined)?.role || "USER";
  const canDelete = userRole === "ADMIN";

  const { servers } = useServers();
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

  // Filters State
  const [queryValue, setQueryValue] = useState('');
  const [selectedServerId, setSelectedServerId] = useState<string[]>([]);
  const [expirationFilter, setExpirationFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [ipTypeFilter, setIpTypeFilter] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState<string[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  // Extract unique IP types and user emails dynamically
  const uniqueIpTypes = useMemo(() => {
    const types = new Set<string>();
    (proxies as ProxyWithServer[])?.forEach(p => {
      if (p.ipType) types.add(p.ipType);
    });
    return Array.from(types);
  }, [proxies]);

  const uniqueUserEmails = useMemo(() => {
    const emails = new Set<string>();
    (proxies as ProxyWithServer[])?.forEach(p => {
      const email = p.user?.email || 'Hệ thống';
      emails.add(email);
    });
    return Array.from(emails);
  }, [proxies]);

  // Column Visibility State ('status' is hidden by default)
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'server',
    'info',
    'expiration',
    'comment',
    'user',
    'actions',
  ]);
  const toggleColumn = (col: string) => {
    setVisibleColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };
  const isColumnVisible = (col: string) => visibleColumns.includes(col);

  const renderedColumnsCount = useMemo(() => {
    let count = 2; // Selection checkbox + Thao tác (Actions)
    if (isColumnVisible('server')) count++;
    if (isColumnVisible('info')) count++;
    if (isColumnVisible('expiration')) count++;
    if (isColumnVisible('status')) count++;
    if (isColumnVisible('comment')) count++;
    if (isColumnVisible('user') && userRole === 'ADMIN') count++;
    return count;
  }, [visibleColumns, userRole]);

  const onHandleQueryValueChange = useCallback((value: string) => {
    setQueryValue(value);
    setPage(1);
    setSelectedKeys(new Set());
  }, []);

  const [sortSelected, setSortSelected] = useState(['id desc']);
  const sortOptions = [
    { label: 'Mới nhất', value: 'id desc' },
    { label: 'Cũ nhất', value: 'id asc' },
    { label: 'Port tăng dần', value: 'port asc' },
    { label: 'Port giảm dần', value: 'port desc' },
  ];

  // Smart memos for premium filter button labels
  const serverLabel = useMemo(() => {
    const selectedNames = selectedServerId.map(id => servers.find(s => s.id === id)?.name || id);
    if (selectedNames.length === 0) return "Máy chủ";
    if (selectedNames.length <= 2) return `Máy chủ: ${selectedNames.join(', ')}`;
    return `Máy chủ: ${selectedNames.slice(0, 2).join(', ')} (+${selectedNames.length - 2})`;
  }, [selectedServerId, servers]);

  const expirationLabel = useMemo(() => {
    if (expirationFilter === 'all') return "Thời hạn";
    return `Thời hạn: ${expirationFilter === 'active' ? 'Còn hạn' : 'Hết hạn'}`;
  }, [expirationFilter]);

  const ipTypeLabel = useMemo(() => {
    if (ipTypeFilter.length === 0) return "Loại";
    if (ipTypeFilter.length <= 2) return `Loại: ${ipTypeFilter.join(', ')}`;
    return `Loại: ${ipTypeFilter.slice(0, 2).join(', ')} (+${ipTypeFilter.length - 2})`;
  }, [ipTypeFilter]);

  const userLabel = useMemo(() => {
    if (userFilter.length === 0) return "Người dùng";
    if (userFilter.length <= 2) return `Người dùng: ${userFilter.map(e => e.split('@')[0]).join(', ')}`;
    return `Người dùng: ${userFilter.slice(0, 2).map(e => e.split('@')[0]).join(', ')} (+${userFilter.length - 2})`;
  }, [userFilter]);

  const hasActiveFilters = selectedServerId.length > 0 || expirationFilter !== 'all' || ipTypeFilter.length > 0 || userFilter.length > 0;

  const filteredProxies = useMemo(() => {
    const now = new Date();
    const result = (proxies as ProxyWithServer[]).filter((proxy) => {
      const queryLower = queryValue.toLowerCase();
      if (queryValue && !proxy.port.toString().includes(queryValue) && !proxy.username.toLowerCase().includes(queryLower)) {
        return false;
      }

      if (selectedServerId.length > 0 && !selectedServerId.includes(proxy.serverId)) {
        return false;
      }

      // Expiration Filter
      if (expirationFilter === 'active') {
        if (proxy.expiresAt && new Date(proxy.expiresAt) <= now) return false;
      } else if (expirationFilter === 'expired') {
        if (!proxy.expiresAt || new Date(proxy.expiresAt) > now) return false;
      }

      // IP Type Filter
      if (ipTypeFilter.length > 0 && !ipTypeFilter.includes(proxy.ipType)) {
        return false;
      }

      // User Filter
      if (userFilter.length > 0) {
        const email = proxy.user?.email || 'Hệ thống';
        if (!userFilter.includes(email)) return false;
      }

      return true;
    });

    // Handle Sorting
    if (sortSelected.length > 0) {
      const [key, direction] = sortSelected[0].split(' ');
      result.sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let valA: any = a[key as keyof ProxyWithServer];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let valB: any = b[key as keyof ProxyWithServer];

        // Handle numeric port
        if (key === 'port') {
          valA = parseInt(a.port.toString());
          valB = parseInt(b.port.toString());
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by id desc
      result.sort((a, b) => (b.id > a.id ? 1 : -1));
    }

    return result;
  }, [proxies, queryValue, selectedServerId, expirationFilter, ipTypeFilter, userFilter, sortSelected]);

  const totalPages = Math.ceil(filteredProxies.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedProxies = filteredProxies.slice(startIndex, startIndex + itemsPerPage);

  const startItem = filteredProxies.length === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, filteredProxies.length);
  const pages = Array.from({length: totalPages}, (_, i) => i + 1);

  // SELECTION LOGIC
  const selectedIds = useMemo(() => {
    if (selectedKeys === 'all') {
      return filteredProxies.map(p => p.id);
    }
    return Array.from(selectedKeys as Set<string>);
  }, [selectedKeys, filteredProxies]);

  const [activeDeleteModal, setActiveDeleteModal] = useState(false);
  const [proxyToDelete, setProxyToDelete] = useState<string | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const handleDeleteClick = (id: string) => {
    setProxyToDelete(id);
    setIsBulkDelete(false);
    setActiveDeleteModal(true);
  };

  const handleBulkDeleteClick = () => {
    setIsBulkDelete(true);
    setProxyToDelete(null);
    setActiveDeleteModal(true);
  };

  const confirmDelete = () => {
    if (isBulkDelete) {
      bulkDeleteMutation.mutate(selectedIds, {
        onSuccess: () => {
          setSelectedKeys(new Set());
          setActiveDeleteModal(false);
          toast.success('Xóa hàng loạt thành công');
        }
      });
    } else if (proxyToDelete) {
      deleteMutation.mutate(proxyToDelete, {
        onSuccess: () => {
          setActiveDeleteModal(false);
          toast.success('Xóa Proxy thành công');
        }
      });
    }
  };

  const handleCopyProxies = useCallback(() => {
    const selectedProxies = filteredProxies.filter(p => selectedIds.includes(p.id));
    if (selectedProxies.length === 0) return;
    
    const text = selectedProxies.map(p => {
      const host = p.server?.host || '0.0.0.0';
      return `${host}:${p.port}:${p.username}:${p.password}`;
    }).join('\n');

    copyToClipboard(text).then((success) => {
      if (success) {
        toast.success(`Đã copy ${selectedProxies.length} proxy vào bộ nhớ tạm`);
        setSelectedKeys(new Set());
      } else {
        toast.danger('Không thể copy vào bộ nhớ tạm');
      }
    });
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
    a.download = `proxies_${format(new Date(), 'yyyyMMdd_HHmmss')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Đã xuất ${selectedProxies.length} proxy ra file TXT`);
    setSelectedKeys(new Set());
  }, [selectedIds, filteredProxies]);

  const [activeRenewModal, setActiveRenewModal] = useState(false);
  const [renewalDuration, setRenewalDuration] = useState('1m');

  const handleBulkRenew = () => {
    bulkRenewMutation.mutate({ ids: selectedIds, duration: renewalDuration }, {
      onSuccess: () => {
        setActiveRenewModal(false);
        setSelectedKeys(new Set());
        toast.success('Gia hạn hàng loạt thành công');
      }
    });
  };

  const handleBulkToggleAutoRenew = (status: boolean) => {
    bulkUpdateAutoRenewMutation.mutate({ ids: selectedIds, autoRenew: status }, {
      onSuccess: () => {
        setSelectedKeys(new Set());
        toast.success('Cập nhật tự động gia hạn thành công');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Flat Premium Toolbar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 mt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            {userRole === 'ADMIN' && <Skeleton className="h-8 w-20 rounded-lg" />}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-48 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* Realistic Table Skeleton */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          {/* Table Header */}
          <div className="grid grid-cols-7 gap-4 pb-2 border-b border-slate-100 items-center">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-4 w-1/3 rounded" />
            {userRole === 'ADMIN' ? <Skeleton className="h-4 w-2/3 rounded" /> : <div />}
            <Skeleton className="h-4 w-12 rounded justify-self-end" />
          </div>
          {/* Table Body Rows */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4 py-3 border-b border-slate-50 items-center">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-4/5 rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-4/5 rounded" />
                <Skeleton className="h-3.5 w-2/3 rounded" />
              </div>
              <Skeleton className="h-4 w-3/4 rounded" />
              {userRole === 'ADMIN' ? <Skeleton className="h-4 w-3/4 rounded" /> : <div />}
              <div className="flex gap-2 justify-end">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Chip size="sm" variant="soft" color="success" className="font-medium text-xs uppercase">
            Hoạt động
          </Chip>
        );
      case 'CREATING':
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-medium text-xs uppercase animate-pulse">
            Đang tạo
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="soft" color="danger" className="font-medium text-xs uppercase">
            Lỗi
          </Chip>
        );
    }
  };

  return (
    <div className="w-full">
      {/* Sleek Floating Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 mb-3 bg-blue-50/50 border border-blue-200/50 rounded-lg animate-fade-in  font-medium text-blue-700 shadow-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium">Đã chọn {selectedIds.length} proxy</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onPress={handleCopyProxies}
            >
              <Icon icon="lucide:clipboard" width={14} height={14} className="shrink-0" />
              <span>Copy</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={handleExportProxies}
            >
              <Icon icon="lucide:download" width={14} height={14} className="shrink-0" />
              <span>Xuất file</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => setActiveRenewModal(true)}
            >
              <Icon icon="lucide:calendar" width={14} height={14} className="shrink-0" />
              <span>Gia hạn</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => handleBulkToggleAutoRenew(true)}
            >
              <Icon icon="lucide:toggle-right" width={14} height={14} className="shrink-0 text-emerald-500" />
              <span>Bật tự động</span>
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => handleBulkToggleAutoRenew(false)}
            >
              <Icon icon="lucide:toggle-left" width={14} height={14} className="shrink-0 text-slate-400" />
              <span>Tắt tự động</span>
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="danger-soft"
                onPress={handleBulkDeleteClick}
              >
                <Icon icon="lucide:trash-2" width={14} height={14} className="shrink-0" />
                <span>Xóa</span>
              </Button>
            )}
            <button
              onClick={() => setSelectedKeys(new Set())}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 hover:bg-slate-100 rounded-md transition-colors ml-1 animate-none flex items-center justify-center border-none bg-transparent"
            >
              <Icon icon="lucide:x" width={14} height={14} />
            </button>
          </div>
        </div>
      )}      {/* Flat Premium Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 mt-1">
        {/* Left Side: Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Server Filter Dropdown */}
          <Popover>
            <PopoverTrigger>
              <button className={`h-8 px-2.5 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 shadow-none ${
                selectedServerId.length > 0 ? 'bg-blue-50/50 border border-blue-200 text-blue-600' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
              }`}>
                <Icon icon="lucide:server" width={16} height={16} className={selectedServerId.length > 0 ? 'text-blue-500' : 'text-slate-400'} />
                <span>{serverLabel}</span>
                <Icon icon="lucide:chevron-down" width={14} height={14} className={selectedServerId.length > 0 ? 'text-blue-400' : 'text-slate-400'} />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom start" offset={8} className="p-3 w-40 flex flex-col gap-2 bg-white border border-slate-200 rounded-lg shadow-md">
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                {servers.map(s => (
                  <Checkbox
                    key={s.id}
                    isSelected={selectedServerId.includes(s.id)}
                    onChange={(isSelected: boolean) => {
                      if (!isSelected) {
                        setSelectedServerId(selectedServerId.filter(id => id !== s.id));
                      } else {
                        setSelectedServerId([...selectedServerId, s.id]);
                      }
                      setPage(1);
                    }}
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <span className="text-sm text-slate-700 hover:text-slate-900">{s.name}</span>
                  </Checkbox>
                ))}
                {servers.length === 0 && (
                  <span className="text-sm text-slate-400">Không có máy chủ</span>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Expiration Filter Dropdown */}
          <Popover>
            <PopoverTrigger>
              <button className={`h-8 px-2.5 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 shadow-none ${
                expirationFilter !== 'all' ? 'bg-blue-50/50 border border-blue-200 text-blue-600' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
              }`}>
                <Icon icon="lucide:calendar" width={16} height={16} className={expirationFilter !== 'all' ? 'text-blue-500' : 'text-slate-400'} />
                <span>{expirationLabel}</span>
                <Icon icon="lucide:chevron-down" width={14} height={14} className={expirationFilter !== 'all' ? 'text-blue-400' : 'text-slate-400'} />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom start" offset={8} className="p-2 w-40 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'active', label: 'Còn hạn' },
                { key: 'expired', label: 'Hết hạn' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setExpirationFilter(opt.key as 'all' | 'active' | 'expired');
                    setPage(1);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors cursor-pointer border-none bg-transparent ${
                    expirationFilter === opt.key
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* IP Type Filter Dropdown */}
          <Popover>
            <PopoverTrigger>
              <button className={`h-8 px-2.5 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 shadow-none ${
                ipTypeFilter.length > 0 ? 'bg-blue-50/50 border border-blue-200 text-blue-600' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
              }`}>
                <Icon icon="lucide:globe" width={16} height={16} className={ipTypeFilter.length > 0 ? 'text-blue-500' : 'text-slate-400'} />
                <span>{ipTypeLabel}</span>
                <Icon icon="lucide:chevron-down" width={14} height={14} className={ipTypeFilter.length > 0 ? 'text-blue-400' : 'text-slate-400'} />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom start" offset={8} className="p-3 w-40 flex flex-col gap-2 bg-white border border-slate-200 rounded-lg shadow-md">
              <div className="flex flex-col gap-2">
                {uniqueIpTypes.map(type => (
                  <Checkbox
                    key={type}
                    isSelected={ipTypeFilter.includes(type)}
                    onChange={(isSelected: boolean) => {
                      if (!isSelected) {
                        setIpTypeFilter(ipTypeFilter.filter(t => t !== type));
                      } else {
                        setIpTypeFilter([...ipTypeFilter, type]);
                      }
                      setPage(1);
                    }}
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <span className="text-sm text-slate-700 hover:text-slate-900">{type}</span>
                  </Checkbox>
                ))}
                {uniqueIpTypes.length === 0 && (
                  <span className="text-sm text-slate-400">Không có loại IP</span>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* User Filter Dropdown (ADMIN ONLY) */}
          {userRole === 'ADMIN' && (
            <Popover>
              <PopoverTrigger>
                <button className={`h-8 px-2.5 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 shadow-none ${
                  userFilter.length > 0 ? 'bg-blue-50/50 border border-blue-200 text-blue-600' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
                }`}>
                  <Icon icon="lucide:user" width={16} height={16} className={userFilter.length > 0 ? 'text-blue-500' : 'text-slate-400'} />
                  <span>{userLabel}</span>
                  <Icon icon="lucide:chevron-down" width={14} height={14} className={userFilter.length > 0 ? 'text-blue-400' : 'text-slate-400'} />
                </button>
              </PopoverTrigger>
              <PopoverContent placement="bottom start" offset={8} className="p-3 w-56 flex flex-col gap-2 bg-white border border-slate-200 rounded-lg shadow-md">
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  {uniqueUserEmails.map(email => (
                    <Checkbox
                      key={email}
                      isSelected={userFilter.includes(email)}
                      onChange={(isSelected: boolean) => {
                        if (!isSelected) {
                          setUserFilter(userFilter.filter(e => e !== email));
                        } else {
                          setUserFilter([...userFilter, email]);
                        }
                        setPage(1);
                      }}
                    >
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <span className="text-sm text-slate-700 hover:text-slate-900 truncate" title={email}>{email}</span>
                    </Checkbox>
                  ))}
                  {uniqueUserEmails.length === 0 && (
                    <span className="text-sm text-slate-400">Không có người dùng</span>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Reset Filter Button */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedServerId([]);
                setExpirationFilter('all');
                setIpTypeFilter([]);
                setUserFilter([]);
                setPage(1);
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer transition-colors border-none bg-transparent ml-1"
            >
              Xóa lọc
            </button>
          )}
        </div>

        {/* Right Side: Search, Sort, Columns */}
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <SearchField 
            name="search"
            aria-label="Tìm kiếm"
            value={queryValue}
            onChange={onHandleQueryValueChange}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Tìm kiếm..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <Popover>
            <PopoverTrigger>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 bg-white transition-all duration-150 cursor-pointer outline-none shadow-none" title="Sắp xếp">
                <Icon icon="lucide:arrow-up-down" width={16} height={16} />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom end" offset={8} className="p-2 w-36 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md z-50">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortSelected([opt.value]);
                    setPage(1);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors cursor-pointer border-none bg-transparent ${
                    sortSelected[0] === opt.value
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Columns Button (Icon Only) */}
          <Popover>
            <PopoverTrigger>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 bg-white transition-all duration-150 cursor-pointer outline-none shadow-none" title="Hiển thị cột">
                <Icon icon="lucide:columns" width={16} height={16} />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom end" offset={8} className="p-3 w-48 flex flex-col gap-2 bg-white border border-slate-200 rounded-lg shadow-md">
              <span className="text-sm font-medium text-slate-500 mb-1">Chọn cột hiển thị</span>
              <div className="flex flex-col gap-2">
                {[
                  { key: 'server', label: 'Máy chủ' },
                  { key: 'info', label: 'Thông tin Proxy' },
                  { key: 'expiration', label: 'Hết hạn' },
                  { key: 'status', label: 'Trạng thái' },
                  { key: 'comment', label: 'Ghi chú' },
                  ...(userRole === 'ADMIN' ? [{ key: 'user', label: 'Người dùng' }] : []),
                ].map(col => (
                  <Checkbox
                    key={col.key}
                    isSelected={isColumnVisible(col.key)}
                    onChange={() => toggleColumn(col.key)}
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <span className="text-sm text-slate-700 hover:text-slate-900">{col.label}</span>
                  </Checkbox>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Proxies Table list */}
        <Table>
          <Table.ScrollContainer>
            <Table.Content
              aria-label="Danh sách Proxy"
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
                {isColumnVisible('info') && <Table.Column className="w-auto">Thông tin Proxy</Table.Column>}
                {isColumnVisible('expiration') && <Table.Column className="w-40">Hết hạn</Table.Column>}
                {isColumnVisible('status') && <Table.Column>Trạng thái</Table.Column>}
                {isColumnVisible('comment') && <Table.Column>Ghi chú</Table.Column>}
                {isColumnVisible('user') && userRole === 'ADMIN' && (
                  <Table.Column>Người dùng</Table.Column>
                )}
                <Table.Column className="text-end">Thao tác</Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => (
                  <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center py-12">
                    <Icon className="size-6 text-slate-400" icon="gravity-ui:tray" />
                    <span className="text-sm text-slate-500 font-medium">Danh sách Proxy hiện đang trống.</span>
                  </EmptyState>
                )}
              >
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
                      <Table.Cell className="align-top ">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-800">
                            {proxy.server?.name || proxy.server?.host || 'Không xác định'}
                          </span>
                          <div className="flex items-center mt-0.5">
                            <Chip size="sm" variant="soft" color="accent" className="font-medium text-xs px-1 py-0 h-4">
                              {proxy.ipType}
                            </Chip>
                          </div>
                        </div>
                      </Table.Cell>
                    )}
                    {isColumnVisible('info') && (
                      <Table.Cell className="align-top ">
                        <div className="space-y-1 max-w-[350px]">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-slate-500 select-none">IP:PORT</span>
                            <div className="flex-1 border-b border-dotted border-slate-300"></div>
                            <span className="font-medium text-slate-700">{proxy.server?.host}:{proxy.port}</span>
                          </div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-slate-500 select-none">Tài khoản</span>
                            <div className="flex-1 border-b border-dotted border-slate-300"></div>
                            <span className="font-medium text-slate-700">{proxy.username}</span>
                          </div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-slate-500 select-none">Mật khẩu</span>
                            <div className="flex-1 border-b border-dotted border-slate-300"></div>
                            <span className="font-medium text-slate-700">{proxy.password}</span>
                          </div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-slate-500 select-none">Loại</span>
                            <div className="flex-1 border-b border-dotted border-slate-300"></div>
                            <span className="text-slate-700 uppercase bg-slate-100 px-1 rounded">HTTPS/SOCKS5</span>
                          </div>
                          {proxy.ipv6 && (
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <span className="text-slate-500 select-none">IPv6</span>
                              <div className="flex-1 border-b border-dotted border-slate-300"></div>
                              <span className="text-slate-700 overflow-hidden text-ellipsis max-w-[200px]" title={proxy.ipv6}>
                                {proxy.ipv6}
                              </span>
                            </div>
                          )}
                        </div>
                      </Table.Cell>
                    )}
                    {isColumnVisible('expiration') && (
                      <Table.Cell className="align-top ">
                        {(() => {
                          const isExpired = proxy.expiresAt ? new Date(proxy.expiresAt) <= new Date() : false;
                          const valueColorClass = isExpired 
                            ? "text-slate-400" 
                            : (proxy.autoRenew ? "text-emerald-600" : "text-amber-600");
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className="text-slate-700 select-none">Hết hạn</span>
                                <div className="flex-1 border-b border-dotted border-slate-300"></div>
                                <span className={`font-medium ${valueColorClass}`}>
                                  {proxy.expiresAt ? format(new Date(proxy.expiresAt), 'dd/MM/yyyy HH:mm') : 'Vĩnh viễn'}
                                </span>
                              </div>
                              {proxy.expiresAt && (
                                <>
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <span className="text-slate-700 select-none">Còn lại</span>
                                    <div className="flex-1 border-b border-dotted border-slate-300"></div>
                                    <span className={`font-medium ${valueColorClass}`}>
                                      {getCountdown(proxy.expiresAt)}
                                    </span>
                                  </div>
                                  {proxy.autoRenew && !isExpired && (
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                      <span className="text-slate-700 select-none">Gia hạn tự động</span>
                                      <div className="flex-1 border-b border-dotted border-slate-300"></div>
                                      <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                                        <Icon icon="lucide:check" width={14} height={14} className="shrink-0" />
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
                      <Table.Cell className="align-top ">
                        {getStatusChip(proxy.status)}
                      </Table.Cell>
                    )}
                    {isColumnVisible('comment') && (
                      <Table.Cell className="align-top">
                        <div className="text-slate-600 font-medium max-w-[200px] truncate" title={proxy.comment || ''}>
                          {proxy.comment || '---'}
                        </div>
                      </Table.Cell>
                    )}
                    {isColumnVisible('user') && userRole === 'ADMIN' && (
                      <Table.Cell className="align-top  text-slate-600 font-medium whitespace-nowrap">
                        {proxy.user?.email || 'Hệ thống'}
                      </Table.Cell>
                    )}
                    <Table.Cell className="align-top text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        {/* Rotate Button */}
                        <button
                          onClick={() => {
                            rotateProxyMutation.mutate(proxy.id, {
                              onSuccess: (data) => {
                                if (data?.jobId) setActiveJobId(data.jobId);
                                toast.success('Đã bắt đầu xoay IP');
                              }
                            });
                          }}
                          disabled={proxy.status !== 'ACTIVE' || !proxy.server?.provider?.includes('ipv6') || rotateProxyMutation.isPending}
                          className="w-7 h-7 rounded-md bg-transparent hover:bg-amber-50 text-amber-600 hover:text-amber-700 border-none flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Xoay IP (Chỉ hỗ trợ IPv6 Server)"
                        >
                          {rotateProxyMutation.isPending && rotateProxyMutation.variables === proxy.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin shrink-0"></span>
                          ) : (
                            <Icon icon="lucide:rotate-cw" className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <Popover
                          isOpen={openPopoverId === proxy.id}
                          onOpenChange={(open) => setOpenPopoverId(open ? proxy.id : null)}
                        >
                          <PopoverTrigger>
                            <button
                              className="w-7 h-7 rounded-md bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-none flex items-center justify-center cursor-pointer transition-colors"
                              title="Thao tác khác"
                            >
                              <Icon icon="lucide:more-horizontal" width={14} height={14} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent placement="bottom end" offset={4} className="p-2.5 w-40 bg-white border border-slate-200 rounded-lg shadow-md flex flex-col gap-2 z-50">
                            <button
                              onClick={() => {
                                setOpenPopoverId(null);
                                checkGoogleMutation.mutate(proxy.id, { onSuccess: (job) => setActiveJobId(job.id) });
                              }}
                              disabled={proxy.status !== 'ACTIVE' || checkGoogleMutation.isPending}
                              className="w-full text-left text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2 cursor-pointer border-none bg-transparent p-0 m-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {checkGoogleMutation.isPending && checkGoogleMutation.variables === proxy.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin shrink-0"></span>
                              ) : (
                                <Icon icon="lucide:search" width={13} height={13} className="text-slate-400 shrink-0" />
                              )}
                              <span>Kiểm tra Google</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenPopoverId(null);
                                onEdit(proxy);
                              }}
                              className="w-full text-left text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2 cursor-pointer border-none bg-transparent p-0 m-0"
                            >
                              <Icon icon="lucide:edit-2" width={13} height={13} className="text-slate-400 shrink-0" />
                              <span>Chỉnh sửa</span>
                            </button>

                            {canDelete && (
                              <button
                                onClick={() => {
                                  setOpenPopoverId(null);
                                  handleDeleteClick(proxy.id);
                                }}
                                className="w-full text-left text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-2 cursor-pointer border-none bg-transparent p-0 m-0"
                              >
                                <Icon icon="lucide:trash-2" width={13} height={13} className="text-red-400 shrink-0" />
                                <span>Xóa Proxy</span>
                              </button>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
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
                  Hiển thị {startItem} - {endItem} trong tổng số {filteredProxies.length} kết quả
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

      {/* Modern Compact Overlay Modal for Deleting Proxy */}
      {activeDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1.5 text-danger">
                <Icon icon="lucide:alert-triangle" className="w-4 h-4 shrink-0 text-red-500" />
                {isBulkDelete ? "Xác nhận xóa hàng loạt?" : "Xác nhận xóa Proxy?"}
              </h3>
              <button 
                onClick={() => setActiveDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors bg-transparent border-none flex items-center justify-center"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white">
              {isBulkDelete 
                ? `Bạn có chắc chắn muốn xóa ${selectedIds.length} Proxy đã chọn? Cấu hình sẽ bị gỡ bỏ khỏi máy chủ và không thể khôi phục.`
                : "Bạn có chắc chắn muốn xóa Proxy này? Cấu hình sẽ bị gỡ bỏ khỏi máy chủ và không thể khôi phục."}
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                variant="outline"
                onPress={() => setActiveDeleteModal(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={confirmDelete}
                isDisabled={deleteMutation.isPending || bulkDeleteMutation.isPending}
              >
                {(deleteMutation.isPending || bulkDeleteMutation.isPending) && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Compact Overlay Modal for Renew Proxy */}
      {activeRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <Icon icon="lucide:calendar" className="w-4 h-4 shrink-0 text-slate-500" />
                Gia hạn Proxy hàng loạt
              </h3>
              <button 
                onClick={() => setActiveRenewModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors bg-transparent border-none flex items-center justify-center"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 space-y-3.5 text-xs bg-white">
              <p className="text-slate-600 font-medium leading-relaxed">
                Chọn thời gian gia hạn cho <b>{selectedIds.length}</b> proxy đã chọn:
              </p>
              <div className="relative">
                <select
                  value={renewalDuration}
                  onChange={(e) => setRenewalDuration(e.target.value)}
                  className="w-full text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg h-9 px-3 outline-none cursor-pointer appearance-none transition-all duration-150"
                >
                  <option value="1d">1 ngày</option>
                  <option value="3d">3 ngày</option>
                  <option value="1w">1 tuần</option>
                  <option value="1m">1 tháng</option>
                  <option value="3m">3 tháng</option>
                  <option value="6m">6 tháng</option>
                  <option value="1y">1 năm</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                  <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                variant="outline"
                onPress={() => setActiveRenewModal(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="primary"
                onPress={handleBulkRenew}
                isDisabled={bulkRenewMutation.isPending}
              >
                {bulkRenewMutation.isPending && (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Xác nhận gia hạn
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Job feedback modal */}
      <JobProgressModal 
        key={activeJobId || 'none'}
        jobId={activeJobId}
        open={!!activeJobId}
        onClose={() => setActiveJobId(null)}
      />
    </div>
  );
}
