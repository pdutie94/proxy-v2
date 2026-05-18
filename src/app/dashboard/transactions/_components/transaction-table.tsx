'use client';

import { Icon } from '@iconify/react';
import { SearchField, Label, Table, Chip, Button, Popover, PopoverTrigger, PopoverContent, Pagination, Input } from '@heroui/react';
import { format } from 'date-fns';
import { approveTransactionAction, rejectTransactionAction } from '@/modules/wallet/actions/admin-transaction.action';
import { toast } from '@heroui/react';
import { useState } from 'react';

import { TransactionWithUser } from '@/types';

interface TransactionTableProps {
  transactions: TransactionWithUser[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Filters State
  const [queryValue, setQueryValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DEPOSIT' | 'PAYMENT'>('ALL');

  const filteredTransactions = transactions.filter((tx) => {
    const email = tx.user?.email || '';
    const matchesQuery = email.toLowerCase().includes(queryValue.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    return matchesQuery && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const startItem = filteredTransactions.length === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, filteredTransactions.length);
  const pages = Array.from({length: totalPages}, (_, i) => i + 1);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      const result = await approveTransactionAction(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.danger(result.message);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    try {
      const result = await rejectTransactionAction(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.danger(result.message);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Chip size="sm" variant="soft" color="success" className="font-medium text-[10px] uppercase">
            Thành công
          </Chip>
        );
      case 'PENDING':
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-medium text-[10px] uppercase">
            Chờ duyệt
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="soft" color="danger" className="font-medium text-[10px] uppercase">
            Đã từ chối
          </Chip>
        );
    }
  };

  const getTypeChip = (type: string) => {
    return type === 'DEPOSIT' ? (
      <Chip size="sm" variant="soft" color="success" className="font-medium text-[10px] uppercase">
        Nạp tiền
      </Chip>
    ) : (
      <Chip size="sm" variant="soft" color="accent" className="font-medium text-[10px] uppercase">
        Thanh toán
      </Chip>
    );
  };

  return (
    <div className="w-full">
      {/* Sleek Ultra-Compact Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 mt-1">
        {/* Left Side: Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <Popover>
            <PopoverTrigger>
              <button className={`h-8 px-2.5 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 shadow-none ${
                statusFilter !== 'ALL' ? 'bg-blue-50/50 border border-blue-200 text-blue-600' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
              }`}>
                <Icon icon="lucide:check-circle" width={14} height={14} className={statusFilter !== 'ALL' ? 'text-blue-500' : 'text-slate-400'} />
                <span>{statusFilter === 'ALL' ? 'Trạng thái' : statusFilter === 'PENDING' ? 'Chờ duyệt' : statusFilter === 'COMPLETED' ? 'Thành công' : 'Đã từ chối'}</span>
                <Icon icon="lucide:chevron-down" width={12} height={12} className={statusFilter !== 'ALL' ? 'text-blue-400' : 'text-slate-400'} />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom start" offset={8} className="p-2 w-40 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md z-50">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'PENDING', label: 'Chờ duyệt' },
                { key: 'COMPLETED', label: 'Thành công' },
                { key: 'REJECTED', label: 'Đã từ chối' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setStatusFilter(opt.key as 'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED');
                    setPage(1);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors cursor-pointer border-none bg-transparent ${
                    statusFilter === opt.key
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Type Filter */}
          <Popover>
            <PopoverTrigger>
              <button className={`h-8 px-2.5 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 shadow-none ${
                typeFilter !== 'ALL' ? 'bg-blue-50/50 border border-blue-200 text-blue-600' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
              }`}>
                <Icon icon="lucide:sliders" width={14} height={14} className={typeFilter !== 'ALL' ? 'text-blue-500' : 'text-slate-400'} />
                <span>{typeFilter === 'ALL' ? 'Loại GD' : typeFilter === 'DEPOSIT' ? 'Nạp tiền' : 'Thanh toán'}</span>
                <Icon icon="lucide:chevron-down" width={12} height={12} className={typeFilter !== 'ALL' ? 'text-blue-400' : 'text-slate-400'} />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom start" offset={8} className="p-2 w-40 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md z-50">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'DEPOSIT', label: 'Nạp tiền' },
                { key: 'PAYMENT', label: 'Thanh toán' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setTypeFilter(opt.key as 'ALL' | 'DEPOSIT' | 'PAYMENT');
                    setPage(1);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors cursor-pointer border-none bg-transparent ${
                    typeFilter === opt.key
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {(statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setTypeFilter('ALL');
                setPage(1);
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700 border-none bg-transparent cursor-pointer ml-1"
            >
              Xóa lọc
            </button>
          )}
        </div>

        {/* Right Side: Search Input */}
        <SearchField 
          name="search"
          aria-label="Tìm email người dùng"
          value={queryValue}
          onChange={(value) => {
            setQueryValue(value);
            setPage(1);
          }}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input className="w-[280px]" placeholder="Tìm email người dùng..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {/* Transactions Table list */}
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Danh sách giao dịch hệ thống">
            <Table.Header>
              <Table.Column isRowHeader>Người dùng</Table.Column>
              <Table.Column className="w-36">Số tiền</Table.Column>
              <Table.Column className="w-28">Loại</Table.Column>
              <Table.Column className="w-30">Trạng thái</Table.Column>
              <Table.Column className="w-40">Thời gian</Table.Column>
              <Table.Column className="w-44 text-end">Thao tác</Table.Column>
            </Table.Header>
            <Table.Body>
              {paginatedTransactions.map((tx) => (
                <Table.Row key={tx.id}>
                  <Table.Cell className="align-top  font-medium text-slate-800">
                    {tx.user?.email}
                  </Table.Cell>
                  <Table.Cell className="align-top">
                    <span className={`font-semibold text-sm ${tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{Number(tx.amount).toLocaleString()}đ
                    </span>
                  </Table.Cell>
                  <Table.Cell className="align-top">
                    {getTypeChip(tx.type)}
                  </Table.Cell>
                  <Table.Cell className="align-top">
                    {getStatusChip(tx.status)}
                  </Table.Cell>
                  <Table.Cell className="align-top  text-slate-500 font-medium whitespace-nowrap">
                    {format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm')}
                  </Table.Cell>
                  <Table.Cell className="align-top text-right">
                    {tx.status === 'PENDING' && tx.type === 'DEPOSIT' ? (
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Button
                          size="sm"
                          onPress={() => handleApprove(tx.id)}
                          isDisabled={loadingId !== null}
                          className="cursor-pointer font-medium h-7 text-xs px-2.5 rounded-lg inline-flex items-center gap-1 border-0 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {loadingId === tx.id ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <Icon icon="lucide:check" className="w-3.5 h-3.5" />
                          )}
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          onPress={() => handleReject(tx.id)}
                          isDisabled={loadingId !== null}
                          className="cursor-pointer font-medium h-7 text-xs px-2.5 rounded-lg inline-flex items-center gap-1 border-0 bg-red-600 hover:bg-red-700 text-white"
                        >
                          {loadingId === tx.id ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                          )}
                          Từ chối
                        </Button>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-medium italic text-xs block">
                        {tx.notes || '-'}
                      </span>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
              {paginatedTransactions.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Danh sách giao dịch trống.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        {totalPages > 1 && (
          <Table.Footer>
            <Pagination size="sm">
              <Pagination.Summary>
                Hiển thị {startItem} - {endItem} trong tổng số {filteredTransactions.length} kết quả
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
    </div>
  );
}
