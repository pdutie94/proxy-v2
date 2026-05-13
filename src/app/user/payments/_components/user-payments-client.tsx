'use client';

import { Page, Layout, Card, IndexTable, Badge, Text, EmptyState } from '@shopify/polaris';
import { format } from 'date-fns';

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
  const resourceName = {
    singular: 'giao dịch',
    plural: 'giao dịch',
  };

  const rowMarkup = transactions.map(
    ({ id, amount, type, status, createdAt }, index) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span" tone="subdued">
            #{id.slice(0, 10).toUpperCase()}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={type === 'DEPOSIT' ? 'success' : 'attention'}>
            {type === 'DEPOSIT' ? 'Nạp tiền' : 'Thanh toán'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span" tone={type === 'DEPOSIT' ? 'success' : 'critical'}>
            {type === 'DEPOSIT' ? '+' : '-'}{Number(amount).toLocaleString()}đ
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={status === 'COMPLETED' ? 'success' : 'attention'}>
            {status === 'COMPLETED' ? 'Thành công' : 'Chờ duyệt'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyXs" as="span" tone="subdued">
            {format(new Date(createdAt), 'dd/MM/yyyy HH:mm')}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  const emptyStateMarkup = (
    <EmptyState
      heading="Chưa có giao dịch nào"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Lịch sử nạp tiền và thanh toán sẽ hiển thị tại đây.</p>
    </EmptyState>
  );

  return (
    <Page title="Lịch sử giao dịch" subtitle="Chi tiết các giao dịch nạp tiền và thanh toán của bạn">
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <IndexTable
              resourceName={resourceName}
              itemCount={transactions.length}
              emptyState={emptyStateMarkup}
              headings={[
                { title: 'Mã GD' },
                { title: 'Loại' },
                { title: 'Số tiền' },
                { title: 'Trạng thái' },
                { title: 'Thời gian' },
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
