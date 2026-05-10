"use client";

import { useUsers } from '@/hooks/use-users';
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
import { User } from '@prisma/client';
import { useState, useCallback } from 'react';

interface UserListProps {
  onEdit: (user: User) => void;
}

export function UserList({ onEdit }: UserListProps) {
  const { users, isLoading, deleteMutation } = useUsers();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resourceName = {
    singular: 'người dùng',
    plural: 'người dùng',
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

  const rowMarkup = users.map(
    (user, index) => (
      <IndexTable.Row id={user.id} key={user.id} position={index}>
        <IndexTable.Cell>
          <Text as="span" fontWeight="bold">
            {user.email}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={user.role === 'ADMIN' ? 'info' : 'default'}>
            {user.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'NGƯỜI DÙNG'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {format(new Date(user.createdAt), 'dd/MM/yyyy')}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="end" gap="200">
            <Button 
              icon={EditIcon} 
              variant="tertiary" 
              onClick={() => onEdit(user)}
            />
            <Button 
              icon={DeleteIcon} 
              variant="tertiary" 
              tone="critical"
              onClick={() => setDeleteId(user.id)}
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
          itemCount={users.length}
          headings={[
            { title: 'Email' },
            { title: 'Vai trò' },
            { title: 'Ngày tạo' },
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
        title="Xác nhận xóa người dùng?"
        primaryAction={{
          content: 'Xóa người dùng',
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
            Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác và người dùng sẽ mất quyền truy cập vào hệ thống ngay lập tức.
          </Text>
        </Modal.Section>
      </Modal>
    </>
  );
}
