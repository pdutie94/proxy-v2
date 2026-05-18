"use client";

import { Icon } from '@iconify/react';
import { useUsers } from '@/hooks/use-users';
import { SearchField, Label, Button, Table, Chip, Pagination, Popover, PopoverTrigger, PopoverContent, Input } from "@heroui/react";

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

  // Filters State
  const [queryValue, setQueryValue] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');

  const filteredUsers = users.filter((user: User) => {
    const matchesQuery = user.email.toLowerCase().includes(queryValue.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const startItem = filteredUsers.length === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, filteredUsers.length);
  const pages = Array.from({length: totalPages}, (_, i) => i + 1);

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
          <Chip size="sm" variant="soft" color="accent" className="font-medium text-[10px] uppercase">
            Quản trị viên
          </Chip>
        );
      case 'MODERATOR':
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-medium text-[10px] uppercase">
            Điều hành viên
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="soft" color="default" className="font-medium text-[10px] uppercase">
            Người dùng
          </Chip>
        );
    }
  };

  const getStatusChip = (isActive: boolean) => {
    if (isActive) {
      return (
        <Chip size="sm" variant="soft" color="success" className="font-medium text-[10px] uppercase">
          Hoạt động
        </Chip>
      );
    }
    return (
      <Chip size="sm" variant="soft" color="danger" className="font-medium text-[10px] uppercase">
        Bị khóa
      </Chip>
    );
  };

  return (
    <div className="w-full">
      {/* Sleek Ultra-Compact Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 mt-1">
        {/* Left Side: Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger>
              <button className={`h-8 px-2.5 text-sm font-medium rounded-lg flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 shadow-none ${
                roleFilter !== 'ALL' ? 'bg-blue-50/50 border border-blue-200 text-blue-600' : 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
              }`}>
                <Icon icon="lucide:user" width={14} height={14} className={roleFilter !== 'ALL' ? 'text-blue-500' : 'text-slate-400'} />
                <span>{roleFilter === 'ALL' ? 'Vai trò' : roleFilter === 'ADMIN' ? 'Vai trò: Quản trị viên' : 'Vai trò: Người dùng'}</span>
                <Icon icon="lucide:chevron-down" width={12} height={12} className={roleFilter !== 'ALL' ? 'text-blue-400' : 'text-slate-400'} />
              </button>
            </PopoverTrigger>
            <PopoverContent placement="bottom start" offset={8} className="p-2 w-40 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md z-50">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'ADMIN', label: 'Quản trị viên' },
                { key: 'USER', label: 'Người dùng' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setRoleFilter(opt.key as 'ALL' | 'ADMIN' | 'USER');
                    setPage(1);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors cursor-pointer border-none bg-transparent ${
                    roleFilter === opt.key
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {roleFilter !== 'ALL' && (
            <button
              onClick={() => {
                setRoleFilter('ALL');
                setPage(1);
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700 border-none bg-transparent cursor-pointer ml-1"
            >
              Xóa lọc
            </button>
          )}
        </div>

        {/* Right Side: Search Input */}
        <SearchField 
          name="search"
          aria-label="Tìm kiếm người dùng"
          value={queryValue}
          onChange={(value) => {
            setQueryValue(value);
            setPage(1);
          }}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input className="w-[280px]" placeholder="Tìm email người dùng..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {/* Users Table list */}
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Danh sách thành viên">
            <Table.Header>
              <Table.Column isRowHeader>Email</Table.Column>
              <Table.Column>Vai trò</Table.Column>
              <Table.Column>Trạng thái</Table.Column>
              <Table.Column>Ngày đăng ký</Table.Column>
              <Table.Column className="text-end">Thao tác</Table.Column>
            </Table.Header>
            <Table.Body>
              {paginatedUsers.map((user: User) => (
                <Table.Row key={user.id}>
                  <Table.Cell className="align-top  font-medium text-slate-800">
                    {user.email}
                  </Table.Cell>
                  <Table.Cell className="align-top">
                    {getRoleChip(user.role)}
                  </Table.Cell>
                  <Table.Cell className="align-top">
                    {getStatusChip(user.isActive)}
                  </Table.Cell>
                  <Table.Cell className="align-top  text-slate-500 font-medium whitespace-nowrap">
                    {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy HH:mm') : '---'}
                  </Table.Cell>
                  <Table.Cell className="align-top text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      {/* Edit Button */}
                      <button
                        onClick={() => onEdit(user)}
                        className="w-7 h-7 rounded-md bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-none flex items-center justify-center cursor-pointer transition-colors"
                        title="Chỉnh sửa vai trò"
                      >
                        <Icon icon="lucide:edit-3" className="w-3.5 h-3.5" />
                      </button>

                      {/* Toggle Active state Button */}
                      {user.isActive ? (
                        <button
                          onClick={() => setDeleteId(user.id)}
                          className="w-7 h-7 rounded-md bg-transparent hover:bg-red-50 text-red-500 hover:text-red-700 border-none flex items-center justify-center cursor-pointer transition-colors"
                          title="Khóa tài khoản"
                        >
                          <Icon icon="lucide:lock" className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setRestoreId(user.id)}
                          className="w-7 h-7 rounded-md bg-transparent hover:bg-green-50 text-green-500 hover:text-green-700 border-none flex items-center justify-center cursor-pointer transition-colors"
                          title="Kích hoạt tài khoản"
                        >
                          <Icon icon="lucide:unlock" className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
              {paginatedUsers.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy người dùng nào.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        {totalPages > 1 && (
          <Table.Footer>
            <Pagination size="sm">
              <Pagination.Summary>
                Hiển thị {startItem} - {endItem} trong tổng số {filteredUsers.length} kết quả
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page <= 1}
                    onPress={() => setPage(page - 1)}
                  >
                    <Pagination.PreviousIcon />
                    Trước
                  </Pagination.Previous>
                </Pagination.Item>
                {pages.map((p) => (
                  <Pagination.Item key={p}>
                    <Pagination.Link
                      isActive={p === page}
                      onPress={() => setPage(p)}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page >= totalPages}
                    onPress={() => setPage(page + 1)}
                  >
                    Sau
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Table.Footer>
        )}
      </Table>

      {/* Lock Confirmation Overlay Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 text-danger">
                <Icon icon="lucide:lock" className="w-4 h-4 shrink-0 text-red-500" />
                Khóa tài khoản?
              </h3>
              <button 
                onClick={() => setDeleteId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors bg-transparent border-none flex items-center justify-center"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white">
              Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập hoặc mua/quản lý proxy trên hệ thống nữa.
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setDeleteId(null)}
                className="cursor-pointer font-medium text-sm h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={handleDelete}
                isDisabled={deleteMutation.isPending}
                className="cursor-pointer font-medium text-sm h-9 px-3 rounded-lg flex items-center gap-1.5 bg-red-500 text-white"
              >
                {deleteMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Xác nhận khóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Confirmation Overlay Modal */}
      {restoreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 text-success">
                <Icon icon="lucide:unlock" className="w-4 h-4 shrink-0 text-emerald-500" />
                Mở khóa tài khoản?
              </h3>
              <button 
                onClick={() => setRestoreId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors bg-transparent border-none flex items-center justify-center"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white">
              Bạn có chắc chắn muốn mở khóa và kích hoạt lại tài khoản này? Người dùng sẽ lấy lại toàn bộ quyền sử dụng bình thường.
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setRestoreId(null)}
                className="cursor-pointer font-medium text-sm h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onPress={handleRestore}
                isDisabled={restoreMutation.isPending}
                className="cursor-pointer font-medium text-sm h-9 px-3 rounded-lg flex items-center gap-1.5 bg-blue-600 text-white"
              >
                {restoreMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Xác nhận kích hoạt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
