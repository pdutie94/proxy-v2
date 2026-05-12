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
  useBreakpoints
} from "@shopify/polaris";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";
import { User } from '@prisma/client';
import { useState, useCallback, useMemo, useEffect } from 'react';

interface UserListProps {
  onEdit: (user: User) => void;
}

export function UserList({ onEdit }: UserListProps) {
  const { users, isLoading, deleteMutation } = useUsers();
  const { smDown } = useBreakpoints();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [sortSelected, setSortSelected] = useState(['createdAt desc']);
  const itemsPerPage = 20;

  const handleSort = useCallback((headingIndex: number, direction: 'ascending' | 'descending') => {
    const keys = ['email', 'role', 'createdAt'];
    const key = keys[headingIndex];
    if (key) {
      setSortSelected([`${key} ${direction === 'ascending' ? 'asc' : 'desc'}`]);
    }
  }, []);

  const sortedUsers = useMemo(() => {
    let result = [...users];
    if (sortSelected.length > 0) {
      const [key, direction] = sortSelected[0].split(' ');
      result.sort((a, b) => {
        const valA = a[key as keyof User]?.toString().toLowerCase() || '';
        const valB = b[key as keyof User]?.toString().toLowerCase() || '';
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [users, sortSelected]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + itemsPerPage);

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
                icon={DeleteIcon} 
                variant="tertiary" 
                tone="critical"
                onClick={() => setDeleteId(user.id)}
              />
            ) : (
              <Tooltip content="Xóa người dùng">
                <Button 
                  icon={DeleteIcon} 
                  variant="tertiary" 
                  tone="critical"
                  onClick={() => setDeleteId(user.id)}
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
          itemCount={sortedUsers.length}
          headings={[
            { title: 'Email', id: 'email' },
            { title: 'Vai trò', id: 'role' },
            { title: 'Ngày tạo', id: 'createdAt' },
            { title: 'Thao tác', alignment: 'end' },
          ]}
          selectable={false}
          sortable={[true, true, true, false]}
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
