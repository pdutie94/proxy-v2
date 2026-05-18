"use client";

import { Icon } from '@iconify/react';
import { useState, useCallback, useRef } from "react";
import { UserList } from "@/modules/users/components/user-list";
import { AddUserForm, AddUserFormRef } from "@/modules/users/components/add-user-form";
import { useUsers } from "@/hooks/use-users";
import { User } from "@prisma/client";
import { Button } from "@heroui/react";


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
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Người dùng</h1>
          <p className="text-xs text-slate-400">Quản lý danh sách quản trị viên và người vận hành hệ thống</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onPress={toggleModal}
          className="cursor-pointer font-medium text-sm h-8 flex items-center gap-1.5 self-start sm:self-auto px-3"
        >
          <Icon icon="lucide:plus" className="w-4 h-4 shrink-0"  />
          Thêm người dùng
        </Button>
      </div>

      {/* User Table List */}
      <UserList onEdit={handleEdit} />

      {/* Modern Compact Overlay Modal for Add/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">
                {editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
              </h3>
              <button 
                onClick={toggleModal}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Icon icon="lucide:x" className="w-4 h-4"  />
              </button>
            </div>
            {/* Modal Body */}
            <div className="bg-white">
              <AddUserForm 
                ref={formRef} 
                onClose={toggleModal} 
                user={editingUser}
              />
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={toggleModal}
                className="cursor-pointer font-bold text-xs h-8 px-3 border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="primary"
                onPress={handlePrimaryAction}
                isDisabled={createMutation.isPending || updateMutation.isPending}
                className="cursor-pointer font-bold text-xs h-8 px-3 flex items-center gap-1.5"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                {editingUser ? 'Cập nhật' : 'Lưu thông tin'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
