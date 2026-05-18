'use client';

import { Table, Chip, Button, SearchField, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { useState, useCallback } from 'react';

interface Transaction {
  id: string;
  amount: number | string;
  type: string;
  status: string;
  createdAt: Date | string;
  notes?: string | null;
}

interface UserPaymentsClientProps {
  transactions: Transaction[];
}

export function UserPaymentsClient({ transactions }: UserPaymentsClientProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Filters State
  const [queryValue, setQueryValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DEPOSIT' | 'PAYMENT'>('ALL');

  const resetPage = useCallback(() => setPage(1), []);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesQuery = tx.id.toLowerCase().includes(queryValue.toLowerCase()) || 
                         (tx.notes && tx.notes.toLowerCase().includes(queryValue.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    return matchesQuery && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Chip size="sm" variant="soft" color="success" className="font-medium text-xs uppercase">
            Thành công
          </Chip>
        );
      case 'PENDING':
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-medium text-xs uppercase">
            Chờ duyệt
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="soft" color="danger" className="font-medium text-xs uppercase">
            Đã từ chối
          </Chip>
        );
    }
  };

  const getTypeChip = (type: string) => {
    return type === 'DEPOSIT' ? (
      <Chip size="sm" variant="soft" color="success" className="font-medium text-xs uppercase">
        Nạp tiền
      </Chip>
    ) : (
      <Chip size="sm" variant="soft" color="accent" className="font-medium text-xs uppercase">
        Thanh toán
      </Chip>
    );
  };

  const hasActiveFilters = statusFilter !== 'ALL' || typeFilter !== 'ALL';

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Lịch sử giao dịch</h1>
        <p className="text-xs text-slate-400">Chi tiết các giao dịch nạp tiền và thanh toán của bạn</p>
      </div>

      {/* Flat Premium Toolbar - Single Row, No Outer Background/Padding */}
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
                <span>
                  {statusFilter === 'ALL' ? 'Trạng thái' : statusFilter === 'PENDING' ? 'Chờ duyệt' : statusFilter === 'COMPLETED' ? 'Thành công' : 'Đã từ chối'}
                </span>
                <Icon icon="lucide:chevron-down" width={12} height={12} className="text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom start" offset={8} className="p-2 w-40 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md z-50">
              {[
                { key: 'ALL', label: 'Tất cả trạng thái' },
                { key: 'PENDING', label: 'Chờ duyệt' },
                { key: 'COMPLETED', label: 'Thành công' },
                { key: 'REJECTED', label: 'Đã từ chối' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setStatusFilter(opt.key as 'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED');
                    resetPage();
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
                <Icon icon="lucide:filter" width={14} height={14} className={typeFilter !== 'ALL' ? 'text-blue-500' : 'text-slate-400'} />
                <span>{typeFilter === 'ALL' ? 'Loại GD' : typeFilter === 'DEPOSIT' ? 'Nạp tiền' : 'Thanh toán'}</span>
                <Icon icon="lucide:chevron-down" width={12} height={12} className="text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom start" offset={8} className="p-2 w-40 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md z-50">
              {[
                { key: 'ALL', label: 'Tất cả các loại' },
                { key: 'DEPOSIT', label: 'Nạp tiền' },
                { key: 'PAYMENT', label: 'Thanh toán' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setTypeFilter(opt.key as 'ALL' | 'DEPOSIT' | 'PAYMENT');
                    resetPage();
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

          {/* Reset Filter Button */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setTypeFilter('ALL');
                resetPage();
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer transition-colors border-none bg-transparent ml-1"
            >
              Xóa lọc
            </button>
          )}
        </div>

        {/* Right Side: Search */}
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <SearchField 
            name="search"
            aria-label="Tìm kiếm giao dịch"
            value={queryValue}
            onChange={(value) => {
              setQueryValue(value);
              resetPage();
            }}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Tìm kiếm giao dịch..." className="w-[200px]" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
      </div>

      {/* Transaction Table */}
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Danh sách lịch sử giao dịch">
            <Table.Header>
              <Table.Column isRowHeader className="w-40">Mã GD</Table.Column>
              <Table.Column>Loại</Table.Column>
              <Table.Column className="w-36">Số tiền</Table.Column>
              <Table.Column className="w-32">Trạng thái</Table.Column>
              <Table.Column className="text-end">Thời gian</Table.Column>
            </Table.Header>
            <Table.Body>
              {paginatedTransactions.map((tx: Transaction) => (
                <Table.Row key={tx.id}>
                  <Table.Cell className="align-top  font-medium text-slate-400">
                    #{tx.id.slice(0, 10).toUpperCase()}
                  </Table.Cell>
                  <Table.Cell className="align-top">
                    {getTypeChip(tx.type)}
                  </Table.Cell>
                  <Table.Cell className="align-top">
                    <span className={`font-semibold ${tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{Number(tx.amount).toLocaleString()}đ
                    </span>
                  </Table.Cell>
                  <Table.Cell className="align-top">
                    {getStatusChip(tx.status)}
                  </Table.Cell>
                  <Table.Cell className="align-top text-end text-slate-500 font-medium">
                    {format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm')}
                  </Table.Cell>
                </Table.Row>
              ))}
              {paginatedTransactions.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    Lịch sử nạp tiền và thanh toán hiện đang trống.
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
    </div>
  );
}
