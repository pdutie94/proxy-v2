'use client';

import { Icon } from '@iconify/react';
import { SearchField, Table, Chip, Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';

import { format } from 'date-fns';
import { payOrderAction } from '@/modules/store/actions/purchase.action';
import { toast } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';

interface Order {
  id: string;
  totalAmount: number | string;
  status: string;
  notes: string | null;
  createdAt: Date | string;
}

interface UserOrdersClientProps {
  orders: Order[];
}

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Hoàn tất',
  PENDING: 'Chờ thanh toán',
  PROCESSING: 'Đang xử lý',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
};

export function UserOrdersClient({ orders }: UserOrdersClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // --- Filter state ---
  const [queryValue, setQueryValue] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortSelected, setSortSelected] = useState(['createdAt desc']);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const itemStrings = ['Tất cả', 'Chờ thanh toán', 'Hoàn tất', 'Thất bại'];

  const sortOptions = [
    { label: 'Ngày tạo', value: 'createdAt desc', directionLabel: 'Mới nhất' },
    { label: 'Ngày tạo', value: 'createdAt asc', directionLabel: 'Cũ nhất' },
    { label: 'Tổng tiền', value: 'totalAmount desc', directionLabel: 'Cao nhất' },
    { label: 'Tổng tiền', value: 'totalAmount asc', directionLabel: 'Thấp nhất' },
  ];

  const resetPage = useCallback(() => setPage(1), []);

  const filteredOrders = useMemo(() => {
    const tabName = itemStrings[selectedTab];

    const result = orders.filter((order) => {
      // Tab filter
      if (tabName === 'Chờ thanh toán' && order.status !== 'PENDING') return false;
      if (tabName === 'Hoàn tất' && order.status !== 'COMPLETED') return false;
      if (tabName === 'Thất bại' && order.status !== 'FAILED') return false;

      // Search: mã đơn
      if (queryValue && !order.id.toLowerCase().includes(queryValue.toLowerCase())) return false;

      // Status filter
      if (filterStatus && order.status !== filterStatus) return false;

      return true;
    });

    // Sort
    const [key, dir] = sortSelected[0].split(' ');
    result.sort((a, b) => {
      let valA: number, valB: number;
      if (key === 'totalAmount') {
        valA = Number(a.totalAmount);
        valB = Number(b.totalAmount);
      } else {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }
      return dir === 'asc' ? valA - valB : valB - valA;
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, selectedTab, queryValue, filterStatus, sortSelected]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handlePay = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      const result = await payOrderAction(orderId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.danger(result.message);
      }
    } catch {
      toast.danger('Có lỗi xảy ra khi thanh toán.');
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Chip size="sm" variant="soft" color="success" className="font-medium text-xs uppercase">
            Hoàn tất
          </Chip>
        );
      case 'PENDING':
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-medium text-xs uppercase">
            Chờ thanh toán
          </Chip>
        );
      case 'PROCESSING':
        return (
          <Chip size="sm" variant="soft" color="accent" className="font-medium text-xs uppercase">
            Đang xử lý
          </Chip>
        );
      case 'FAILED':
        return (
          <Chip size="sm" variant="soft" color="danger" className="font-medium text-xs uppercase">
            Thất bại
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="soft" color="default" className="font-medium text-xs uppercase">
            Đã hủy
          </Chip>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Đơn hàng</h1>
        <p className="text-xs text-slate-400">Danh sách các gói proxy bạn đã đặt mua</p>
      </div>

      {/* Flat Premium Toolbar - Single Row, No Outer Background/Padding */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 mt-1">
        {/* Left Side: Tabs & Popovers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 mr-2 bg-slate-100/60 p-0.5 rounded-lg">
            {itemStrings.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedTab(idx);
                  resetPage();
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

          {/* Status Filter Popover */}
          <Popover>
            <PopoverTrigger>
              <button className={`h-8 px-2.5 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 shadow-none ${
                filterStatus ? 'bg-blue-50/50 border border-blue-200 text-blue-600' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
              }`}>
                <Icon icon="lucide:check-circle" className={`w-4 h-4 ${filterStatus ? 'text-blue-500' : 'text-slate-400'}`} />
                <span>{filterStatus ? STATUS_LABELS[filterStatus] || 'Trạng thái' : 'Trạng thái'}</span>
                <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom start" offset={8} className="p-2 w-44 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md z-50">
              {[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'PENDING', label: 'Chờ thanh toán' },
                { value: 'PROCESSING', label: 'Đang xử lý' },
                { value: 'COMPLETED', label: 'Hoàn tất' },
                { value: 'FAILED', label: 'Thất bại' },
                { value: 'CANCELLED', label: 'Đã hủy' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFilterStatus(opt.value);
                    resetPage();
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors cursor-pointer border-none bg-transparent ${
                    filterStatus === opt.value
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Reset Filter Button */}
          {filterStatus && (
            <button
              onClick={() => {
                setFilterStatus('');
                resetPage();
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer transition-colors border-none bg-transparent ml-1"
            >
              Xóa lọc
            </button>
          )}
        </div>

        {/* Right Side: Search, Sort */}
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <SearchField 
            name="search"
            aria-label="Tìm theo mã đơn"
            value={queryValue}
            onChange={(value) => {
              setQueryValue(value);
              resetPage();
            }}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Tìm theo mã đơn..." className="w-[200px]" />
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
        </div>
      </div>

      {/* Orders Table */}
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Danh sách đơn hàng">
            <Table.Header>
              <Table.Column isRowHeader className="w-32">Mã đơn</Table.Column>
              <Table.Column>Loại đơn</Table.Column>
              <Table.Column className="w-60">Chi tiết đơn hàng</Table.Column>
              <Table.Column className="w-36">Tổng tiền</Table.Column>
              <Table.Column className="text-end w-40">Trạng thái</Table.Column>
            </Table.Header>
            <Table.Body>
              {paginatedOrders.map(({ id, totalAmount, status, createdAt, notes }) => {
                let details = { type: 'proxy', count: 1, days: 30, country: 'VN' };
                try {
                  if (notes) details = { ...details, ...JSON.parse(notes) };
                } catch {}

                const countryFlag = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${details.country.toUpperCase()}.svg`;

                return (
                  <Table.Row key={id}>
                    <Table.Cell className="align-top font-medium text-slate-400">
                      ORD-{id.slice(0, 8).toUpperCase()}
                    </Table.Cell>
                    <Table.Cell className="align-top whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-800">
                          Mua {details.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400 font-medium mt-0.5">
                          {format(new Date(createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="align-top">
                      <div className="space-y-1 py-1 max-w-[240px]">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-xs text-slate-500 select-none">Số lượng IP</span>
                          <div className="flex-grow border-b border-dotted border-slate-300"></div>
                          <span className=" font-medium text-slate-700">{details.count}</span>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-xs text-slate-500 select-none">Số ngày</span>
                          <div className="flex-grow border-b border-dotted border-slate-300"></div>
                          <span className=" font-medium text-slate-600">{details.days} ngày</span>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-xs text-slate-500 select-none">Quốc gia</span>
                          <div className="flex-grow border-b border-dotted border-slate-300"></div>
                          <div className="flex items-center gap-1">
                            <Image
                              src={countryFlag}
                              alt={details.country}
                              width={14}
                              height={10}
                              style={{ borderRadius: '2px', border: '1px solid #E2E8F0', objectFit: 'cover' }}
                            />
                            <span className="font-medium text-slate-600">{details.country.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="align-top font-semibold text-slate-800 whitespace-nowrap">
                      {Number(totalAmount).toLocaleString()}đ
                    </Table.Cell>
                    <Table.Cell className="align-top text-end">
                      {status === 'PENDING' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onPress={() => handlePay(id)}
                          isDisabled={loadingId !== null}
                          className="cursor-pointer font-medium h-7 text-xs px-2.5 rounded-lg inline-flex items-center gap-1 border-0 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {loadingId === id && (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          )}
                          Thanh toán
                        </Button>
                      ) : (
                        getStatusChip(status)
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
              {paginatedOrders.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    Danh sách đơn hàng hiện trống.
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
