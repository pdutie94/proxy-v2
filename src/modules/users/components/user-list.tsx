"use client";

import { useUsers } from '@/hooks/use-users';
import { Button, Table, Chip } from "@heroui/react";
import { Edit2, Lock, Unlock, Calendar, X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { User } from '@prisma/client';
import { useState, useCallback } from 'react';

interface UserListProps {
  onEdit: (user: User) => void;
}

export function UserList({ onEdit }: UserListProps) {
  const { users, isLoading, deleteMutation, restoreMutation } = useUsers();
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
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3.5">
        <div className="h-6 bg-slate-100/80 rounded w-1/4 animate-pulse mb-4" />
        <div className="space-y-2.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-9 bg-slate-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getRoleChip = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <Chip size="sm" variant="soft" color="accent" className="font-semibold text-[10px] uppercase">
            Quản trị viên
          </Chip>
        );
      case 'MODERATOR':
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-semibold text-[10px] uppercase">
            Điều hành viên
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="soft" color="default" className="font-semibold text-[10px] uppercase">
            Người dùng
          </Chip>
        );
    }
  };

  const getStatusChip = (isActive: boolean) => {
    if (isActive) {
      return (
        <Chip size="sm" variant="soft" color="success" className="font-semibold text-[10px] uppercase">
          Hoạt động
        </Chip>
      );
    }
    return (
      <Chip size="sm" variant="soft" color="danger" className="font-semibold text-[10px] uppercase">
        Bị khóa
      </Chip>
    );
  };

  return (
    <div className="w-full">
      <div className="w-full border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <Table className="w-full text-left border-collapse">
          <Table.ScrollContainer>
            <Table.Content aria-label="Danh sách người dùng">
              <Table.Header className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50">
                <Table.Column isRowHeader className="py-2.5 px-3">Email</Table.Column>
                <Table.Column className="py-2.5 px-3">Vai trò</Table.Column>
                <Table.Column className="py-2.5 px-3">Trạng thái</Table.Column>
                <Table.Column className="py-2.5 px-3">Ngày tạo</Table.Column>
                <Table.Column className="py-2.5 px-3 text-right">Thao tác</Table.Column>
              </Table.Header>
              <Table.Body className="divide-y divide-slate-100 text-xs">
                {paginatedUsers.map((user: User) => (
                  <Table.Row key={user.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                    <Table.Cell className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {user.email}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3">
                      {getRoleChip(user.role)}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3">
                      {getStatusChip(user.isActive)}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{format(new Date(user.createdAt), 'dd/MM/yyyy')}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onEdit(user)}
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => user.isActive ? setDeleteId(user.id) : setRestoreId(user.id)}
                          className={`inline-flex items-center justify-center p-1.5 rounded-lg cursor-pointer transition-colors ${
                            user.isActive 
                              ? 'text-danger/70 hover:text-danger hover:bg-danger-50' 
                              : 'text-success/70 hover:text-success hover:bg-success-50'
                          }`}
                          title={user.isActive ? "Khóa người dùng" : "Mở khóa người dùng"}
                        >
                          {user.isActive ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {paginatedUsers.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                      Danh sách người dùng hiện đang trống.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        {/* Compact Flat Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-slate-100 text-xs bg-slate-50/50">
            <span className="text-slate-400 font-semibold">Trang {page} / {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <Button
                isDisabled={page <= 1}
                onPress={() => setPage(page - 1)}
                className="px-2.5 py-1 text-xs border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold h-7 min-w-0 rounded-lg cursor-pointer transition-all"
              >
                Trước
              </Button>
              <Button
                isDisabled={page >= totalPages}
                onPress={() => setPage(page + 1)}
                className="px-2.5 py-1 text-xs border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold h-7 min-w-0 rounded-lg cursor-pointer transition-all"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Compact Overlay Modal for Locking User */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 text-danger">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Khóa người dùng?
              </h3>
              <button 
                onClick={() => setDeleteId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white">
              Bạn có chắc chắn muốn khóa người dùng này? Người dùng sẽ bị mất quyền đăng nhập và truy cập vào hệ thống ngay lập tức.
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setDeleteId(null)}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={handleDelete}
                isDisabled={deleteMutation.isPending}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1"
              >
                {deleteMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Khóa người dùng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Compact Overlay Modal for Restoring User */}
      {restoreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">Khôi phục người dùng?</h3>
              <button 
                onClick={() => setRestoreId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white">
              Bạn có chắc chắn muốn mở khóa người dùng này? Người dùng sẽ có thể đăng nhập lại vào hệ thống.
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setRestoreId(null)}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="primary"
                onPress={handleRestore}
                isDisabled={restoreMutation.isPending}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1"
              >
                {restoreMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Mở khóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
