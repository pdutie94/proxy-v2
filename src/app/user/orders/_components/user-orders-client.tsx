'use client';

import { Page, Layout, Card, IndexTable, Badge, Text, EmptyState, Button } from '@shopify/polaris';
import { format } from 'date-fns';
import { payOrderAction } from '@/modules/store/actions/purchase.action';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

export function UserOrdersClient({ orders }: UserOrdersClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Hoàn tất';
      case 'PENDING': return 'Chờ thanh toán';
      case 'PROCESSING': return 'Đang xử lý';
      case 'FAILED': return 'Thất bại';
      default: return status;
    }
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'attention';
      case 'PROCESSING': return 'info';
      case 'FAILED': return 'critical';
      default: return 'info';
    }
  };

  const resourceName = {
    singular: 'đơn hàng',
    plural: 'đơn hàng',
  };

  const rowMarkup = orders.map(
    ({ id, totalAmount, status, createdAt, notes }, index) => {
      let details = { type: 'proxy', count: 1, days: 30, country: 'VN' };
      try {
        if (notes) {
          const parsed = JSON.parse(notes);
          details = { ...details, ...parsed };
        }
      } catch {}

      const countryFlag = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${details.country.toUpperCase()}.svg`;

      return (
        <IndexTable.Row id={id} key={id} position={index}>
          <IndexTable.Cell>
            <Text variant="bodyMd" fontWeight="bold" as="span" tone="subdued">
              {id.slice(0, 8).toUpperCase()}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <div className="space-y-1">
              <Text variant="bodyMd" fontWeight="bold" as="p">
                Mua {details.type.toUpperCase()}
              </Text>
              <Text variant="bodyXs" as="p" tone="subdued">
                {format(new Date(createdAt), 'dd.MM.yyyy, HH:mm')}
              </Text>
            </div>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <div className="space-y-1 text-[11px] max-w-[150px]">
              <div className="flex justify-between gap-4 border-b border-slate-50 pb-1">
                <span className="text-slate-400">Số lượng IP</span>
                <span className="font-bold">{details.count}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-50 pb-1">
                <span className="text-slate-400">Số ngày</span>
                <span className="font-bold">{details.days}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Quốc gia</span>
                <div className="flex items-center gap-1.5">
                   <Image src={countryFlag} alt={details.country} width={12} height={10} className="rounded-[1px] object-cover border border-slate-100" />
                   <span className="font-bold uppercase">{details.country}</span>
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
            <div className="flex items-center gap-2">
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
                <Badge tone={getStatusTone(status)}>
                  {getStatusLabel(status)}
                </Badge>
              )}
            </div>
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    },
  );

  const emptyStateMarkup = (
    <EmptyState
      heading="Chưa có đơn hàng nào"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Các đơn hàng bạn đã mua sẽ xuất hiện tại đây.</p>
    </EmptyState>
  );

  return (
    <Page title="Đơn hàng" subtitle="Danh sách các gói proxy bạn đã thanh toán">
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <IndexTable
              resourceName={resourceName}
              itemCount={orders.length}
              emptyState={emptyStateMarkup}
              headings={[
                { title: 'Mã đơn' },
                { title: 'Loại đơn' },
                { title: 'Chi tiết' },
                { title: 'Tổng tiền' },
                { title: 'Thao tác' },
              ]}
              selectable={false}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
