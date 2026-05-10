"use client";

import { useServers } from '@/hooks/use-servers';
import { 
  IndexTable, 
  Card, 
  Badge, 
  Text, 
  Button, 
  Box,
  SkeletonBodyText,
  InlineStack,
  Modal,
  Tooltip
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, PlayIcon, RefreshIcon } from "@shopify/polaris-icons";
import { Server } from '@prisma/client';
import { useState, useCallback } from 'react';

interface ServerListProps {
  onEdit: (server: Server) => void;
}

export function ServerList({ onEdit }: ServerListProps) {
  const { servers, isLoading, deleteMutation, setupMutation, resetMutation } = useServers();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resourceName = {
    singular: 'máy chủ',
    plural: 'máy chủ',
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

  const rowMarkup = servers.map(
    (server, index) => (
      <IndexTable.Row id={server.id} key={server.id} position={index}>
        <IndexTable.Cell>
          <Text as="span" fontWeight="bold">
            {server.name}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{server.host}</IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={
            (server.status as any) === 'ONLINE' ? 'success' : 
            (server.status as any) === 'SETTING_UP' ? 'attention' : 
            (server.status as any) === 'PENDING' ? 'attention' : 
            'critical'
          }>
            {(server.status as any) === 'ONLINE' ? 'TRỰC TUYẾN' : 
             (server.status as any) === 'SETTING_UP' ? 'ĐANG CÀI ĐẶT' : 
             (server.status as any) === 'PENDING' ? 'ĐANG CHỜ' : 
             'LỖI'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>{server.maxProxies}</IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="end" gap="200">
            <Tooltip content="Thiết lập Server">
              <Button 
                icon={PlayIcon} 
                variant="tertiary" 
                onClick={() => setupMutation.mutate(server.id)}
                loading={setupMutation.isPending && setupMutation.variables === server.id}
                disabled={(server.status as any) === 'SETTING_UP'}
              />
            </Tooltip>
            <Tooltip content="Reset Server (Xóa hết Proxy)">
              <Button 
                icon={RefreshIcon} 
                variant="tertiary" 
                tone="critical"
                onClick={() => resetMutation.mutate(server.id)}
                loading={resetMutation.isPending && resetMutation.variables === server.id}
                disabled={(server.status as any) === 'SETTING_UP'}
              />
            </Tooltip>
            <Tooltip content="Chỉnh sửa">
              <Button 
                icon={EditIcon} 
                variant="tertiary" 
                onClick={() => onEdit(server)}
              />
            </Tooltip>
            <Tooltip content="Xóa Server">
              <Button 
                icon={DeleteIcon} 
                variant="tertiary" 
                tone="critical"
                onClick={() => setDeleteId(server.id)}
              />
            </Tooltip>
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
          itemCount={servers.length}
          headings={[
            { title: 'Tên Máy chủ' },
            { title: 'Địa chỉ IP' },
            { title: 'Trạng thái' },
            { title: 'Giới hạn Proxy' },
            { title: 'Thao tác', alignment: 'end' },
          ]}
          selectable={false}
        >
          {rowMarkup}
        </IndexTable>
      </Card>

      {/* Modal xác nhận xóa */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác nhận xóa máy chủ?"
        primaryAction={{
          content: 'Xóa máy chủ',
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
            Bạn có chắc chắn muốn xóa máy chủ này? Hành động này không thể hoàn tác và sẽ ảnh hưởng đến các Proxy đang chạy trên máy chủ này.
          </Text>
        </Modal.Section>
      </Modal>
    </>
  );
}
