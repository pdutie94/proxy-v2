"use client";

import { useProxies } from '@/hooks/use-proxies';
import { 
  IndexTable, 
  Card, 
  Badge, 
  Text, 
  Button, 
  Box,
  SkeletonBodyText,
  InlineStack,
  Modal
} from "@shopify/polaris";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";
import { Proxy } from '@prisma/client';
import { useState, useCallback } from 'react';

interface ProxyListProps {
  onEdit: (proxy: Proxy) => void;
}

export function ProxyList({ onEdit }: ProxyListProps) {
  const { proxies, isLoading, deleteMutation } = useProxies();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resourceName = {
    singular: 'proxy',
    plural: 'proxies',
  };

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  }, [deleteId, deleteMutation]);

  if (isLoading) {
    return (
      <Card>
        <Box padding="400">
          <SkeletonBodyText lines={5} />
        </Box>
      </Card>
    );
  }

  const rowMarkup = proxies.map(
    (proxy, index) => (
      <IndexTable.Row id={proxy.id} key={proxy.id} position={index}>
        <IndexTable.Cell>
          <Text as="span" fontWeight="bold">
            {proxy.port}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{proxy.username}</IndexTable.Cell>
        <IndexTable.Cell>{proxy.ipv6 || '-'}</IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={proxy.status === 'ACTIVE' ? 'success' : proxy.status === 'CREATING' ? 'attention' : 'critical'}>
            {proxy.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : proxy.status === 'CREATING' ? 'ĐANG KHỞI TẠO' : 'LỖI'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {proxy.expiresAt ? format(new Date(proxy.expiresAt), 'dd/MM/yyyy') : 'Vĩnh viễn'}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="end" gap="200">
            <Button 
              icon={EditIcon} 
              variant="tertiary" 
              onClick={() => onEdit(proxy)}
            />
            <Button 
              icon={DeleteIcon} 
              variant="tertiary" 
              tone="critical"
              onClick={() => setDeleteId(proxy.id)}
            />
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <>
      <Card padding="0">
        <IndexTable
          resourceName={resourceName}
          itemCount={proxies.length}
          headings={[
            { title: 'Cổng (Port)' },
            { title: 'Tài khoản' },
            { title: 'IPv6' },
            { title: 'Trạng thái' },
            { title: 'Hết hạn' },
            { title: 'Thao tác', alignment: 'end' },
          ]}
          selectable={false}
        >
          {rowMarkup}
        </IndexTable>
      </Card>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác nhận xóa Proxy?"
        primaryAction={{
          content: 'Xóa Proxy',
          onAction: handleDelete,
          destructive: true,
          loading: deleteMutation.isPending,
        }}
        secondaryActions={[
          {
            content: 'Hủy bỏ',
            onAction: () => setDeleteId(null),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Bạn có chắc chắn muốn xóa Proxy này? Cấu hình sẽ bị gỡ bỏ khỏi máy chủ và không thể khôi phục.
          </Text>
        </Modal.Section>
      </Modal>
    </>
  );
}
