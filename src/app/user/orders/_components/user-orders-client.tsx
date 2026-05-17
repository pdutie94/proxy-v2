'use client';

import { Table, Chip, Button } from '@heroui/react';
import { ChevronDown, Search, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { payOrderAction } from '@/modules/store/actions/purchase.action';
import { toast } from 'sonner';
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
        toast.error(result.message);
      }
    } catch {
      toast.error('Có lỗi xảy ra khi thanh toán.');
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Chip size="sm" variant="soft" color="success" className="font-semibold text-[10px] uppercase">
            Hoàn tất
          </Chip>
        );
      case 'PENDING':
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-semibold text-[10px] uppercase">
            Chờ thanh toán
          </Chip>
        );
      case 'PROCESSING':
        return (
          <Chip size="sm" variant="soft" color="accent" className="font-semibold text-[10px] uppercase">
            Đang xử lý
          </Chip>
        );
      case 'FAILED':
        return (
          <Chip size="sm" variant="soft" color="danger" className="font-semibold text-[10px] uppercase">
            Thất bại
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="soft" color="default" className="font-semibold text-[10px] uppercase">
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

      {/* Sleek Ultra-Compact Filter & Search Bar */}
      <div className="flex flex-col gap-2.5 bg-white p-2.5 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {itemStrings.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedTab(idx);
                  resetPage();
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

          {/* Right: Search, Status & Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <input
                type="text"
                placeholder="Tìm theo mã đơn hàng..."
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

            {/* Status Select Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}
                className="h-8 pl-3 pr-8 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none cursor-pointer appearance-none transition-all duration-150"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ thanh toán</option>
                <option value="PROCESSING">Đang xử lý</option>
                <option value="COMPLETED">Hoàn tất</option>
                <option value="FAILED">Thất bại</option>
                <option value="CANCELLED">Đã hủy</option>
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

      {/* Orders Table */}
      <div className="w-full border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <Table className="w-full text-left border-collapse">
          <Table.ScrollContainer>
            <Table.Content aria-label="Danh sách đơn hàng">
              <Table.Header className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50">
                <Table.Column isRowHeader className="py-2.5 px-3 w-32">Mã đơn</Table.Column>
                <Table.Column className="py-2.5 px-3">Loại đơn</Table.Column>
                <Table.Column className="py-2.5 px-3 w-60">Chi tiết đơn hàng</Table.Column>
                <Table.Column className="py-2.5 px-3 w-36">Tổng tiền</Table.Column>
                <Table.Column className="py-2.5 px-3 w-40 text-right">Trạng thái</Table.Column>
              </Table.Header>
              <Table.Body className="divide-y divide-slate-100 text-xs">
                {paginatedOrders.map(({ id, totalAmount, status, createdAt, notes }) => {
                  let details = { type: 'proxy', count: 1, days: 30, country: 'VN' };
                  try {
                    if (notes) details = { ...details, ...JSON.parse(notes) };
                  } catch {}

                  const countryFlag = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${details.country.toUpperCase()}.svg`;

                  return (
                    <Table.Row key={id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                      <Table.Cell className="py-2.5 px-3 font-mono font-bold text-slate-400">
                        ORD-{id.slice(0, 8).toUpperCase()}
                      </Table.Cell>
                      <Table.Cell className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-800">
                            Mua {details.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {format(new Date(createdAt), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell className="py-2.5 px-3">
                        <div className="space-y-1 py-1 max-w-[240px]">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-[10px] text-slate-400 select-none">Số lượng IP</span>
                            <div className="flex-grow border-b border-dotted border-slate-200"></div>
                            <span className="font-mono font-bold text-slate-700">{details.count}</span>
                          </div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-[10px] text-slate-400 select-none">Số ngày</span>
                            <div className="flex-grow border-b border-dotted border-slate-200"></div>
                            <span className="font-mono font-semibold text-slate-600">{details.days} ngày</span>
                          </div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-[10px] text-slate-400 select-none">Quốc gia</span>
                            <div className="flex-grow border-b border-dotted border-slate-200"></div>
                            <div className="flex items-center gap-1">
                              <Image
                                src={countryFlag}
                                alt={details.country}
                                width={14}
                                height={10}
                                style={{ borderRadius: '2px', border: '1px solid #E2E8F0', objectFit: 'cover' }}
                              />
                              <span className="font-bold text-slate-600">{details.country.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                        {Number(totalAmount).toLocaleString()}đ
                      </Table.Cell>
                      <Table.Cell className="py-2.5 px-3 text-right">
                        {status === 'PENDING' ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onPress={() => handlePay(id)}
                            isDisabled={loadingId !== null}
                            className="cursor-pointer font-bold h-7 text-[10px] px-2.5 rounded-lg inline-flex items-center gap-1 border-0"
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
    </div>
  );
}
