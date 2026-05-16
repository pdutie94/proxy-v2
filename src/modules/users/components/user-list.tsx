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
  Modal,
  Tooltip,
  useBreakpoints,
  EmptyState
} from "@shopify/polaris";
import { EditIcon, LockIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";
import { User } from '@prisma/client';
import { useState, useCallback } from 'react';

interface UserListProps {
  onEdit: (user: User) => void;
}

export function UserList({ onEdit }: UserListProps) {
  const { users, isLoading, deleteMutation, restoreMutation } = useUsers();
  const { smDown } = useBreakpoints();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  }, [deleteId, deleteMutation]);

  const handleRestore = useCallback(() => {
    if (restoreId) {
      restoreMutation.mutate(restoreId, {
        onSuccess: () => setRestoreId(null),
      });
    }
  }, [restoreId, restoreMutation]);

  if (isLoading) {
    return (
      <Card>
        <Box padding="400">
          <SkeletonBodyText lines={5} />
        </Box>
      </Card>
    );
  }

  const resourceName = {
    singular: 'người dùng',
    plural: 'người dùng',
  };

  const rowMarkup = paginatedUsers.map(
    (user, index) => (
      <IndexTable.Row id={user.id} key={user.id} position={index}>
        <IndexTable.Cell>
          <Text as="span" fontWeight="bold">
            {user.email}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={
            user.role === 'ADMIN' ? 'info' : 
            user.role === 'MODERATOR' ? 'attention' : 
            undefined
          }>
            {user.role === 'ADMIN' ? 'Quản trị viên' : 
             user.role === 'MODERATOR' ? 'Điều hành viên' : 
             'Người dùng'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={user.isActive ? 'success' : 'critical'}>
            {user.isActive ? 'Hoạt động' : 'Bị khóa'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {format(new Date(user.createdAt), 'dd/MM/yyyy')}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="end" gap="200" wrap={false}>
            {smDown ? (
              <Button 
                icon={EditIcon} 
                variant="tertiary" 
                onClick={() => onEdit(user)}
              />
            ) : (
              <Tooltip content="Chỉnh sửa">
                <Button 
                  icon={EditIcon} 
                  variant="tertiary" 
                  onClick={() => onEdit(user)}
                />
              </Tooltip>
            )}

            {smDown ? (
              <Button 
                icon={LockIcon} 
                variant="tertiary" 
                tone={user.isActive ? "critical" : "success"}
                onClick={() => user.isActive ? setDeleteId(user.id) : setRestoreId(user.id)}
              />
            ) : (
              <Tooltip content={user.isActive ? "Khóa người dùng" : "Mở khóa người dùng"}>
                <Button 
                  icon={LockIcon} 
                  variant="tertiary" 
                  tone={user.isActive ? "critical" : "success"}
                  onClick={() => user.isActive ? setDeleteId(user.id) : setRestoreId(user.id)}
                />
              </Tooltip>
            )}
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <>
    <Box paddingInline={{ xs: '400', sm: '0' }}>
      <Card padding="0">
        <IndexTable
          resourceName={resourceName}
          itemCount={users.length}
          emptyState={(
            <EmptyState
              heading="Chưa có người dùng nào"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Danh sách người dùng hiện đang trống. Người dùng mới sẽ hiển thị tại đây sau khi đăng ký.</p>
            </EmptyState>
          )}
          headings={[
            { title: 'Email', id: 'email' },
            { title: 'Vai trò', id: 'role' },
            { title: 'Trạng thái', id: 'status' },
            { title: 'Ngày tạo', id: 'createdAt' },
            { title: 'Thao tác', alignment: 'end' },
          ]}
          selectable={false}
          pagination={{
            hasNext: page < totalPages,
            hasPrevious: page > 1,
            onNext: () => setPage(page + 1),
            onPrevious: () => setPage(page - 1),
          }}
        >
          {rowMarkup}
        </IndexTable>
      </Card>
    </Box>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác nhận khóa người dùng?"
        primaryAction={{
          content: 'Khóa người dùng',
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
            Bạn có chắc chắn muốn khóa người dùng này? Người dùng sẽ bị mất quyền đăng nhập và truy cập vào hệ thống ngay lập tức.
          </Text>
        </Modal.Section>
      </Modal>

      <Modal
        open={!!restoreId}
        onClose={() => setRestoreId(null)}
        title="Xác nhận khôi phục người dùng?"
        primaryAction={{
          content: 'Mở khóa',
          onAction: handleRestore,
          loading: restoreMutation.isPending,
        }}
        secondaryActions={[
          {
            content: 'Hủy bỏ',
            onAction: () => setRestoreId(null),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Bạn có chắc chắn muốn mở khóa người dùng này? Người dùng sẽ có thể đăng nhập lại vào hệ thống.
          </Text>
        </Modal.Section>
      </Modal>
    </>
  );
}
