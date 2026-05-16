'use client';

import { Card, IndexTable, Badge, Button, Text, InlineStack, EmptyState } from '@shopify/polaris';
import { format } from 'date-fns';
import { approveTransactionAction, rejectTransactionAction } from '@/modules/wallet/actions/admin-transaction.action';
import { toast } from 'sonner';
import { useState } from 'react';

import { TransactionWithUser } from '@/types';

interface TransactionTableProps {
  transactions: TransactionWithUser[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      const result = await approveTransactionAction(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
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
        toast.error(result.message);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const resourceName = {
    singular: 'giao dịch',
    plural: 'giao dịch',
  };

  const rowMarkup = transactions.map(
    ({ id, user, amount, type, status, notes, createdAt }, index) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {user?.email}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
           <Text variant="bodyMd" fontWeight="bold" as="span" tone={type === 'DEPOSIT' ? 'success' : 'critical'}>
            {type === 'DEPOSIT' ? '+' : '-'}{Number(amount).toLocaleString()}đ
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={type === 'DEPOSIT' ? 'success' : 'attention'}>
            {type === 'DEPOSIT' ? 'Nạp tiền' : 'Thanh toán'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={
            status === 'COMPLETED' ? 'success' : 
            status === 'PENDING' ? 'attention' : 'critical'
          }>
            {status === 'COMPLETED' ? 'Thành công' : 
             status === 'PENDING' ? 'Chờ duyệt' : 'Thất bại'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span" tone="subdued">
            {format(new Date(createdAt), 'dd/MM/yyyy HH:mm')}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {status === 'PENDING' && type === 'DEPOSIT' ? (
            <InlineStack gap="200">
              <Button 
                size="slim" 
                variant="primary" 
                onClick={() => handleApprove(id)}
                loading={loadingId === id}
              >
                Duyệt
              </Button>
              <Button 
                size="slim" 
                tone="critical" 
                onClick={() => handleReject(id)}
                loading={loadingId === id}
              >
                Từ chối
              </Button>
            </InlineStack>
          ) : (
             <Text variant="bodyMd" as="span" tone="subdued">{notes || '-'}</Text>
          )}
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Card padding="0">
      <IndexTable
        resourceName={resourceName}
        itemCount={transactions.length}
        emptyState={(
          <EmptyState
            heading="Chưa có giao dịch nào"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Lịch sử nạp tiền và thanh toán của toàn bộ hệ thống sẽ hiển thị tại đây.</p>
          </EmptyState>
        )}
        headings={[
          { title: 'Người dùng' },
          { title: 'Số tiền' },
          { title: 'Loại' },
          { title: 'Trạng thái' },
          { title: 'Thời gian' },
          { title: 'Thao tác' },
        ]}
        selectable={false}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );
}
