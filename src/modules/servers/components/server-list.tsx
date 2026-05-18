"use client";

import { Icon } from '@iconify/react';
import { useServers, ServerWithLocation } from '@/hooks/use-servers';
import { SearchField, Button, Table, Chip, Popover, PopoverTrigger, PopoverContent, Pagination, Checkbox, Skeleton, EmptyState } from "@heroui/react";

import { Server } from '@prisma/client';
import { useState, useCallback, useMemo } from 'react';
import { JobProgressModal } from '@/components/jobs/job-progress-modal';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';

interface ServerListProps {
  onEdit: (server: Server) => void;
  onAdd?: () => void;
}

export function ServerList({ onEdit, onAdd }: ServerListProps) {
  const { servers, isLoading, deleteMutation, setupMutation, resetMutation, syncMutation } = useServers();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Filters & Sorting state
  const [queryValue, setQueryValue] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [sortSelected, setSortSelected] = useState(['createdAt desc']);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'name',
    'host',
    'location',
    'status',
    'maxProxies',
    'lastPort',
  ]);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const isColumnVisible = (col: string) => visibleColumns.includes(col);

  const renderedColumnsCount = useMemo(() => {
    let count = 1; // Actions (Thao tác) column is always rendered
    if (isColumnVisible('name')) count++;
    if (isColumnVisible('host')) count++;
    if (isColumnVisible('location')) count++;
    if (isColumnVisible('status')) count++;
    if (isColumnVisible('maxProxies')) count++;
    if (isColumnVisible('lastPort')) count++;
    return count;
  }, [visibleColumns]);

  const statusOptions = [
    { label: 'Trực tuyến', value: 'ONLINE' },
    { label: 'Đang cài đặt', value: 'SETTING_UP' },
    { label: 'Đang chờ', value: 'PENDING' },
    { label: 'Lỗi', value: 'ERROR' },
  ];

  const sortOptions = [
    { label: 'Mới nhất', value: 'createdAt desc' },
    { label: 'Cũ nhất', value: 'createdAt asc' },
    { label: 'Tên máy chủ A-Z', value: 'name asc' },
    { label: 'Tên máy chủ Z-A', value: 'name desc' },
  ];

  // Dynamic unique locations currently assigned to servers
  const uniqueLocations = useMemo(() => {
    const locationsMap = new Map<string, { id: string; name: string; countryCode: string }>();
    servers.forEach(server => {
      if (server.location) {
        locationsMap.set(server.location.id, {
          id: server.location.id,
          name: server.location.name,
          countryCode: server.location.countryCode,
        });
      }
    });
    return Array.from(locationsMap.values());
  }, [servers]);

  // Smart label for Location filter button
  const locationLabel = useMemo(() => {
    if (selectedLocations.length === 0) return "Vị trí";
    const selectedNames = selectedLocations.map(id => {
      const loc = uniqueLocations.find(l => l.id === id);
      return loc?.name || id;
    });
    if (selectedNames.length <= 2) return `Vị trí: ${selectedNames.join(', ')}`;
    return `Vị trí: ${selectedNames.slice(0, 2).join(', ')} (+${selectedNames.length - 2})`;
  }, [selectedLocations, uniqueLocations]);

  // Smart label for Status filter button
  const statusLabel = useMemo(() => {
    if (selectedStatuses.length === 0) return "Trạng thái";
    const selectedNames = selectedStatuses.map(status => {
      const opt = statusOptions.find(o => o.value === status);
      return opt?.label || status;
    });
    if (selectedNames.length <= 2) return `Trạng thái: ${selectedNames.join(', ')}`;
    return `Trạng thái: ${selectedNames.slice(0, 2).join(', ')} (+${selectedNames.length - 2})`;
  }, [selectedStatuses]);

  const hasActiveFilters = selectedLocations.length > 0 || selectedStatuses.length > 0;

  // Filtered & Sorted Servers
  const filteredServers = useMemo(() => {
    const result = servers.filter((server) => {
      const matchesQuery = server.name.toLowerCase().includes(queryValue.toLowerCase()) || 
                          server.host.toLowerCase().includes(queryValue.toLowerCase());
      
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(server.status);

      const matchesLocation = selectedLocations.length === 0 || 
                              (server.locationId && selectedLocations.includes(server.locationId));

      return matchesQuery && matchesStatus && matchesLocation;
    });

    // Apply sorting
    if (sortSelected.length > 0) {
      const [key, direction] = sortSelected[0].split(' ');
      result.sort((a, b) => {
        if (key === 'createdAt') {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return direction === 'asc' ? timeA - timeB : timeB - timeA;
        }
        if (key === 'name') {
          return direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        return 0;
      });
    }

    return result;
  }, [servers, queryValue, selectedStatuses, selectedLocations, sortSelected]);

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
      <div className="space-y-4">
        {/* Flat Premium Toolbar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 mt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-64 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* Realistic Table Skeleton */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          {/* Table Header */}
          <div className="grid grid-cols-7 gap-4 pb-2 border-b border-slate-100">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-12 rounded justify-self-end" />
          </div>
          {/* Table Body Rows */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4 py-3 border-b border-slate-50 items-center">
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-4 w-2/3 rounded font-mono" />
              <Skeleton className="h-4 w-6 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-4 w-8 rounded font-mono" />
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

  const totalPages = Math.ceil(filteredServers.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedServers = filteredServers.slice(startIndex, startIndex + itemsPerPage);

  const startItem = filteredServers.length === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, filteredServers.length);
  const pages = Array.from({length: totalPages}, (_, i) => i + 1);

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return (
          <Chip size="sm" variant="soft" color="success" className="font-medium text-[10px] uppercase">
            Trực tuyến
          </Chip>
        );
      case 'SETTING_UP':
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-medium text-[10px] uppercase">
            Đang cài đặt
          </Chip>
        );
      case 'PENDING':
        return (
          <Chip size="sm" variant="soft" color="default" className="font-medium text-[10px] uppercase">
            Đang chờ
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
      {/* Sleek Ultra-Compact Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 mt-1">
        {/* Left Side: Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter Dropdown */}
          <Popover>
            <PopoverTrigger>
              <button className={`h-8 px-2.5 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 shadow-none ${
                selectedStatuses.length > 0 ? 'bg-blue-50/50 border border-blue-200 text-blue-600' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
              }`}>
                <Icon icon="lucide:activity" width={14} height={14} className={selectedStatuses.length > 0 ? 'text-blue-500' : 'text-slate-400'} />
                <span>{statusLabel}</span>
                <Icon icon="lucide:chevron-down" width={12} height={12} className={selectedStatuses.length > 0 ? 'text-blue-400' : 'text-slate-400'} />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom start" offset={8} className="p-3 w-48 flex flex-col gap-2 bg-white border border-slate-200 rounded-lg shadow-md z-50">
              <div className="flex flex-col gap-2">
                {statusOptions.map(opt => (
                  <Checkbox
                    key={opt.value}
                    isSelected={selectedStatuses.includes(opt.value)}
                    onChange={(isSelected: boolean) => {
                      if (!isSelected) {
                        setSelectedStatuses(selectedStatuses.filter(s => s !== opt.value));
                      } else {
                        setSelectedStatuses([...selectedStatuses, opt.value]);
                      }
                      setPage(1);
                    }}
                    variant="secondary"
                    className="flex items-center gap-2 cursor-pointer outline-none select-none"
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <span className="text-sm text-slate-700 hover:text-slate-900">{opt.label}</span>
                  </Checkbox>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Location Filter Dropdown */}
          <Popover>
            <PopoverTrigger>
              <button className={`h-8 px-2.5 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 shadow-none ${
                selectedLocations.length > 0 ? 'bg-blue-50/50 border border-blue-200 text-blue-600' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
              }`}>
                <Icon icon="lucide:map-pin" width={14} height={14} className={selectedLocations.length > 0 ? 'text-blue-500' : 'text-slate-400'} />
                <span>{locationLabel}</span>
                <Icon icon="lucide:chevron-down" width={12} height={12} className={selectedLocations.length > 0 ? 'text-blue-400' : 'text-slate-400'} />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom start" offset={8} className="p-3 w-48 flex flex-col gap-2 bg-white border border-slate-200 rounded-lg shadow-md z-50">
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                {uniqueLocations.map(loc => (
                  <Checkbox
                    key={loc.id}
                    isSelected={selectedLocations.includes(loc.id)}
                    onChange={(isSelected: boolean) => {
                      if (!isSelected) {
                        setSelectedLocations(selectedLocations.filter(id => id !== loc.id));
                      } else {
                        setSelectedLocations([...selectedLocations, loc.id]);
                      }
                      setPage(1);
                    }}
                    variant="secondary"
                    className="flex items-center gap-2 cursor-pointer outline-none select-none"
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <span className="text-sm text-slate-700 hover:text-slate-900">{loc.name} ({loc.countryCode})</span>
                  </Checkbox>
                ))}
                {uniqueLocations.length === 0 && (
                  <span className="text-xs text-slate-400">Không có vị trí</span>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedLocations([]);
                setSelectedStatuses([]);
                setPage(1);
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700 border-none bg-transparent cursor-pointer ml-1"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Right Side: Search, Sort, Columns */}
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <SearchField 
            name="search"
            aria-label="Tìm kiếm máy chủ"
            value={queryValue}
            onChange={(value) => {
              setQueryValue(value);
              setPage(1);
            }}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input className="w-[280px]" placeholder="Tìm kiếm máy chủ..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          {/* Sort Button */}
          <Popover>
            <PopoverTrigger>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 bg-white transition-all duration-150 cursor-pointer outline-none shadow-none" title="Sắp xếp">
                <Icon icon="lucide:arrow-up-down" width={14} height={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom end" offset={8} className="p-2 w-40 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md z-50">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortSelected([opt.value]);
                    setPage(1);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors cursor-pointer border-none bg-transparent ${
                    sortSelected[0] === opt.value
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Columns Visibility Button */}
          <Popover>
            <PopoverTrigger>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 bg-white transition-all duration-150 cursor-pointer outline-none shadow-none" title="Hiển thị cột">
                <Icon icon="lucide:columns" width={14} height={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom end" offset={8} className="p-3 w-48 flex flex-col gap-2 bg-white border border-slate-200 rounded-lg shadow-md z-50">
              <span className="text-xs font-semibold text-slate-500 mb-1">Chọn cột hiển thị</span>
              <div className="flex flex-col gap-2">
                {[
                  { key: 'name', label: 'Tên Máy chủ' },
                  { key: 'host', label: 'Địa chỉ IP' },
                  { key: 'location', label: 'Vị trí' },
                  { key: 'status', label: 'Trạng thái' },
                  { key: 'maxProxies', label: 'Giới hạn Proxy' },
                  { key: 'lastPort', label: 'Cổng cuối (SV)' },
                ].map(col => (
                  <Checkbox
                    key={col.key}
                    isSelected={isColumnVisible(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    variant="secondary"
                    className="flex items-center gap-2 cursor-pointer outline-none select-none"
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

      {/* Servers Table list */}
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Danh sách máy chủ">
            <Table.Header>
              {isColumnVisible('name') && <Table.Column isRowHeader>Tên Máy chủ</Table.Column>}
              {isColumnVisible('host') && <Table.Column>Địa chỉ IP</Table.Column>}
              {isColumnVisible('location') && <Table.Column>Vị trí</Table.Column>}
              {isColumnVisible('status') && <Table.Column>Trạng thái</Table.Column>}
              {isColumnVisible('maxProxies') && <Table.Column>Giới hạn Proxy</Table.Column>}
              {isColumnVisible('lastPort') && <Table.Column>Cổng cuối (SV)</Table.Column>}
              <Table.Column className="text-end">Thao tác</Table.Column>
            </Table.Header>
            <Table.Body
              renderEmptyState={() => (
                <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center py-12">
                  <Icon className="size-6 text-slate-400" icon="gravity-ui:tray" />
                  <span className="text-sm text-slate-500 font-medium">Không tìm thấy máy chủ nào.</span>
                </EmptyState>
              )}
            >
              {paginatedServers.map((server: ServerWithLocation) => (
                <Table.Row key={server.id}>
                  {isColumnVisible('name') && (
                    <Table.Cell className="align-top  font-medium text-slate-800">
                      {server.name}
                    </Table.Cell>
                  )}
                  {isColumnVisible('host') && (
                    <Table.Cell className="align-top  font-mono text-slate-500">
                      {server.host}
                    </Table.Cell>
                  )}
                  {isColumnVisible('location') && (
                    <Table.Cell className="align-top  text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        {server.location?.countryCode ? (
                          <span 
                            className={`fi fi-${server.location.countryCode.toLowerCase()} rounded-[3px] shadow-[0_0_1px_rgba(0,0,0,0.3)] shrink-0`} 
                            style={{ width: '15px', height: '11px' }}
                          />
                        ) : (
                          <Icon icon="lucide:globe" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>{server.location?.name || 'Chưa định vị'}</span>
                      </div>
                    </Table.Cell>
                  )}
                  {isColumnVisible('status') && (
                    <Table.Cell className="align-top">
                      {getStatusChip(server.status)}
                    </Table.Cell>
                  )}
                  {isColumnVisible('maxProxies') && (
                    <Table.Cell className="align-top  text-slate-600 font-medium">
                      {server.maxProxies} IP
                    </Table.Cell>
                  )}
                  {isColumnVisible('lastPort') && (
                    <Table.Cell className="align-top  font-mono text-slate-500">
                      {server.lastPort || '---'}
                    </Table.Cell>
                  )}
                  <Table.Cell className="align-top text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      {/* Edit Button */}
                      <button
                        onClick={() => onEdit(server)}
                        className="w-7 h-7 rounded-md bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-none flex items-center justify-center cursor-pointer transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Icon icon="lucide:edit-3" className="w-3.5 h-3.5" />
                      </button>

                      {/* Setup Server Button */}
                      <button
                        onClick={() => {
                          setupMutation.mutate(server.id, {
                            onSuccess: (data) => {
                              if (data?.jobId) setActiveJobId(data.jobId);
                              toast.success('Đã bắt đầu thiết lập server');
                            },
                          });
                        }}
                        className="w-7 h-7 rounded-md bg-transparent hover:bg-blue-50 text-blue-500 hover:text-blue-700 border-none flex items-center justify-center cursor-pointer transition-colors"
                        title="Thiết lập server (SSH)"
                      >
                        <Icon icon="lucide:terminal" className="w-3.5 h-3.5" />
                      </button>

                      <Popover
                        isOpen={openPopoverId === server.id}
                        onOpenChange={(open) => setOpenPopoverId(open ? server.id : null)}
                      >
                        <PopoverTrigger>
                          <button
                            className="w-7 h-7 rounded-md bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-none flex items-center justify-center cursor-pointer transition-colors"
                            title="Tùy chọn khác"
                          >
                            <Icon icon="lucide:more-vertical" className="w-3.5 h-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent placement="bottom end" offset={8} className="p-1.5 w-40 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md z-50">
                          <button
                            onClick={() => {
                              setOpenPopoverId(null);
                              syncMutation.mutate(server.id, {
                                onSuccess: (data) => {
                                  if (data?.jobId) setActiveJobId(data.jobId);
                                  toast.success('Đã bắt đầu đồng bộ cổng');
                                },
                              });
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs rounded text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                          >
                            <Icon icon="lucide:refresh-cw" className="w-3.5 h-3.5 text-slate-400" />
                            <span>Đồng bộ cổng</span>
                          </button>
                          <button
                            onClick={() => {
                              setOpenPopoverId(null);
                              resetMutation.mutate(server.id, {
                                onSuccess: (data) => {
                                  if (data?.jobId) setActiveJobId(data.jobId);
                                  toast.success('Đã bắt đầu reset server');
                                },
                              });
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs rounded text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                          >
                            <Icon icon="lucide:rotate-ccw" className="w-3.5 h-3.5 text-slate-400" />
                            <span>Reset máy chủ</span>
                          </button>
                          <div className="h-px bg-slate-100 my-1 w-full" />
                          <button
                            onClick={() => {
                              setOpenPopoverId(null);
                              setDeleteId(server.id);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs rounded text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer border-none bg-transparent font-semibold"
                          >
                            <Icon icon="lucide:trash-2" className="w-3.5 h-3.5 text-red-400" />
                            <span>Xóa máy chủ</span>
                          </button>
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
                Hiển thị {startItem} - {endItem} trong tổng số {filteredServers.length} kết quả
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

      {/* Delete Confirmation Overlay Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 text-danger">
                <Icon icon="lucide:alert-triangle" className="w-4 h-4 shrink-0 text-red-500" />
                Xóa máy chủ?
              </h3>
              <button 
                onClick={() => setDeleteId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors bg-transparent border-none flex items-center justify-center"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white">
              Hành động này sẽ xóa máy chủ khỏi hệ thống và ngừng hoạt động toàn bộ proxy liên quan. Bạn có chắc chắn muốn thực hiện?
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setDeleteId(null)}
                className="cursor-pointer font-medium text-sm h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={handleDelete}
                isDisabled={deleteMutation.isPending}
                className="cursor-pointer font-medium text-sm h-9 px-3 rounded-lg flex items-center gap-1.5 bg-red-500 text-white"
              >
                {deleteMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Job Progress Modal */}
      <JobProgressModal
        key={activeJobId || 'none'}
        jobId={activeJobId}
        open={activeJobId !== null}
        onClose={() => {
          setActiveJobId(null);
          queryClient.invalidateQueries({ queryKey: ['servers'] });
        }}
      />
    </div>
  );
}
