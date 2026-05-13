'use client';

import { Page, Layout, Card, IndexTable, Badge, Text, EmptyState } from '@shopify/polaris';
import { format } from 'date-fns';

interface UserOrdersClientProps {
  orders: any[];
}

export function UserOrdersClient({ orders }: UserOrdersClientProps) {
  const resourceName = {
    singular: 'đơn hàng',
    plural: 'đơn hàng',
  };

  const rowMarkup = orders.map(
    ({ id, totalAmount, status, createdAt }, index) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <Text variant="bodySm" fontWeight="bold" as="span" tone="brand">
            ORD-{id.slice(0, 8).toUpperCase()}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div className="space-y-0.5">
            <Text variant="bodySm" fontWeight="bold" as="p">Mua Proxy lẻ</Text>
            <Text variant="bodyXs" as="p" tone="subdued">
              {format(new Date(createdAt), 'dd/MM/yyyy HH:mm')}
            </Text>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodySm" fontWeight="bold" as="span">
            {Number(totalAmount).toLocaleString()}đ
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={status === 'COMPLETED' ? 'success' : 'attention'}>
            {status === 'COMPLETED' ? 'Hoàn tất' : 'Đang xử lý'}
          </Badge>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
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
    <Page title="Đơn hàng đã mua" subtitle="Danh sách các gói proxy bạn đã thanh toán">
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <IndexTable
              resourceName={resourceName}
              itemCount={orders.length}
              emptyState={emptyStateMarkup}
              headings={[
                { title: 'Mã đơn' },
                { title: 'Dịch vụ' },
                { title: 'Tổng cộng' },
                { title: 'Trạng thái' },
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
