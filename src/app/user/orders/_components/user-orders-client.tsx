'use client';

import {
  Page,
  Layout,
  Card,
  IndexTable,
  IndexFilters,
  Badge,
  Text,
  EmptyState,
  Button,
  useSetIndexFiltersMode,
  TabProps,
  ChoiceList,
  IndexFiltersProps,
  InlineStack,
} from '@shopify/polaris';
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

const STATUS_TONES: Record<string, 'success' | 'attention' | 'info' | 'critical' | 'warning'> = {
  COMPLETED: 'success',
  PENDING: 'attention',
  PROCESSING: 'info',
  FAILED: 'critical',
  CANCELLED: 'warning',
};

export function UserOrdersClient({ orders }: UserOrdersClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // --- Filter state ---
  const { mode, setMode } = useSetIndexFiltersMode();
  const [queryValue, setQueryValue] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortSelected, setSortSelected] = useState(['createdAt desc']);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const itemStrings = ['Tất cả', 'Chờ thanh toán', 'Hoàn tất', 'Thất bại'];
  const tabs: TabProps[] = useMemo(
    () =>
      itemStrings.map((item, index) => ({
        content: item,
        index,
        id: `order-tab-${index}`,
        isLocked: true,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const sortOptions: IndexFiltersProps['sortOptions'] = [
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
      if (filterStatus.length > 0 && !filterStatus.includes(order.status)) return false;

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
  const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const appliedFilters: IndexFiltersProps['appliedFilters'] = [];
  if (filterStatus.length > 0) {
    appliedFilters.push({
      key: 'status',
      label: `Trạng thái: ${filterStatus.map((s) => STATUS_LABELS[s] ?? s).join(', ')}`,
      onRemove: () => { setFilterStatus([]); resetPage(); },
    });
  }

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

  const rowMarkup = paginatedOrders.map(({ id, totalAmount, status, createdAt, notes }, index) => {
    let details = { type: 'proxy', count: 1, days: 30, country: 'VN' };
    try {
      if (notes) details = { ...details, ...JSON.parse(notes) };
    } catch {}

    const countryFlag = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${details.country.toUpperCase()}.svg`;

    return (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span" tone="subdued">
            ORD-{id.slice(0, 8).toUpperCase()}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={{ minWidth: '140px' }}>
            <Text variant="bodyMd" fontWeight="bold" as="p">
              Mua {details.type.toUpperCase()}
            </Text>
            <Text variant="bodyXs" as="p" tone="subdued">
              {format(new Date(createdAt), 'dd/MM/yyyy HH:mm')}
            </Text>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={{ minWidth: '160px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                <Text as="span" variant="bodyMd" tone="subdued">Số lượng IP</Text>
                <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
                <Text as="span" variant="bodyMd" fontWeight="medium">{details.count}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                <Text as="span" variant="bodyMd" tone="subdued">Số ngày</Text>
                <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
                <Text as="span" variant="bodyMd" fontWeight="medium">{details.days}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                <Text as="span" variant="bodyMd" tone="subdued">Quốc gia</Text>
                <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
                <InlineStack gap="100" blockAlign="center">
                  <Image
                    src={countryFlag}
                    alt={details.country}
                    width={14}
                    height={10}
                    style={{ borderRadius: '2px', border: '1px solid #E2E8F0', objectFit: 'cover' }}
                  />
                  <Text as="span" variant="bodyMd" fontWeight="medium">{details.country.toUpperCase()}</Text>
                </InlineStack>
              </div>
            </div>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {Number(totalAmount).toLocaleString()}đ
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {status === 'PENDING' ? (
            <Button
              size="slim"
              variant="primary"
              onClick={() => handlePay(id)}
              loading={loadingId === id}
            >
              Thanh toán
            </Button>
          ) : (
            <Badge tone={STATUS_TONES[status] ?? 'info'}>
              {STATUS_LABELS[status] ?? status}
            </Badge>
          )}
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  const emptyStateMarkup = (
    <EmptyState
      heading="Chưa có đơn hàng nào"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Các đơn hàng bạn đã mua sẽ xuất hiện tại đây.</p>
    </EmptyState>
  );

  return (
    <Page title="Đơn hàng" subtitle="Danh sách các gói proxy bạn đã đặt mua">
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <IndexFilters
              sortOptions={sortOptions}
              sortSelected={sortSelected}
              queryValue={queryValue}
              queryPlaceholder="Tìm theo mã đơn hàng..."
              onQueryChange={(v) => { setQueryValue(v); resetPage(); }}
              onQueryClear={() => { setQueryValue(''); resetPage(); }}
              onSort={setSortSelected}
              tabs={tabs}
              selected={selectedTab}
              onSelect={(i) => { setSelectedTab(i); resetPage(); }}
              filters={[
                {
                  key: 'status',
                  label: 'Trạng thái',
                  shortcut: true,
                  filter: (
                    <ChoiceList
                      title="Trạng thái"
                      choices={[
                        { label: 'Chờ thanh toán', value: 'PENDING' },
                        { label: 'Đang xử lý', value: 'PROCESSING' },
                        { label: 'Hoàn tất', value: 'COMPLETED' },
                        { label: 'Thất bại', value: 'FAILED' },
                        { label: 'Đã hủy', value: 'CANCELLED' },
                      ]}
                      selected={filterStatus}
                      onChange={(v) => { setFilterStatus(v); resetPage(); }}
                      allowMultiple
                    />
                  ),
                },
              ]}
              appliedFilters={appliedFilters}
              onClearAll={() => { setFilterStatus([]); setQueryValue(''); resetPage(); }}
              mode={mode}
              setMode={setMode}
            />
            <IndexTable
              resourceName={{ singular: 'đơn hàng', plural: 'đơn hàng' }}
              itemCount={filteredOrders.length}
              headings={[
                { title: 'Mã đơn' },
                { title: 'Loại đơn' },
                { title: 'Chi tiết' },
                { title: 'Tổng tiền' },
                { title: 'Trạng thái' },
              ]}
              selectable={false}
              emptyState={emptyStateMarkup}
              pagination={{
                hasNext: page < totalPages,
                hasPrevious: page > 1,
                onNext: () => setPage(page + 1),
                onPrevious: () => setPage(page - 1),
                label: '',
              }}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
