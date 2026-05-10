"use client";

import { Page, Modal } from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { useState, useCallback, useRef } from "react";
import { UserList } from "@/modules/users/components/user-list";
import { AddUserForm, AddUserFormRef } from "@/modules/users/components/add-user-form";
import { useUsers } from "@/hooks/use-users";
import { User } from "@prisma/client";

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  
  const { createMutation, updateMutation } = useUsers();
  const formRef = useRef<AddUserFormRef>(null);

  const toggleModal = useCallback(() => {
    if (isModalOpen) {
      setEditingUser(undefined);
    }
    setIsModalOpen((open) => !open);
  }, [isModalOpen]);

  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  }, []);

  const handlePrimaryAction = useCallback(() => {
    formRef.current?.submit();
  }, []);

  return (
    <Page
      fullWidth
      title="Người dùng"
      subtitle="Quản lý danh sách quản trị viên và người vận hành hệ thống"
      primaryAction={{
        content: 'Thêm người dùng',
        icon: PlusIcon,
        onAction: toggleModal,
      }}
    >
      <UserList onEdit={handleEdit} />

      <Modal
        open={isModalOpen}
        onClose={toggleModal}
        title={editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
        primaryAction={{
          content: editingUser ? 'Cập nhật' : 'Lưu thông tin',
          onAction: handlePrimaryAction,
          loading: createMutation.isPending || updateMutation.isPending,
        }}
        secondaryActions={[
          {
            content: 'Hủy bỏ',
            onAction: toggleModal,
          },
        ]}
      >
        <AddUserForm 
          ref={formRef} 
          onClose={toggleModal} 
          user={editingUser}
        />
      </Modal>
    </Page>
  );
}
