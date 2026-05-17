"use client";

import { Icon } from '@iconify/react';
import { useState, useCallback, useRef } from "react";
import { ServerList } from "@/modules/servers/components/server-list";
import { AddServerForm, AddServerFormRef } from "@/modules/servers/components/add-server-form";
import { useServers } from "@/hooks/use-servers";
import { Server } from "@prisma/client";
import { Button } from "@heroui/react";


export default function ServersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | undefined>(undefined);
  
  const { createMutation, updateMutation } = useServers();
  const formRef = useRef<AddServerFormRef>(null);

  const toggleModal = useCallback(() => {
    if (isModalOpen) {
      setEditingServer(undefined);
    }
    setIsModalOpen((open) => !open);
  }, [isModalOpen]);

  const handleEdit = useCallback((server: Server) => {
    setEditingServer(server);
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
          <h1 className="text-lg font-semibold text-slate-800">Máy chủ</h1>
          <p className="text-xs text-slate-400">Quản lý các máy chủ từ xa để cung cấp Proxy</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onPress={toggleModal}
          className="cursor-pointer font-bold text-xs h-9 px-3 flex items-center gap-1.5 self-start sm:self-auto rounded-lg"
        >
          <Icon icon="lucide:plus" className="w-3.5 h-3.5 shrink-0"  />
          Thêm Máy chủ
        </Button>
      </div>

      {/* Server List Component */}
      <ServerList onEdit={handleEdit} onAdd={toggleModal} />

      {/* Modern Compact Overlay Modal for Add/Edit Server */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">
                {editingServer ? "Chỉnh sửa máy chủ" : "Thêm máy chủ mới"}
              </h3>
              <button 
                onClick={toggleModal}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Icon icon="lucide:x" className="w-4 h-4"  />
              </button>
            </div>
            {/* Modal Body */}
            <div className="bg-white max-h-[75vh] overflow-y-auto">
              <AddServerForm 
                ref={formRef} 
                onClose={toggleModal} 
                server={editingServer}
              />
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={toggleModal}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="primary"
                onPress={handlePrimaryAction}
                isDisabled={createMutation.isPending || updateMutation.isPending}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                {editingServer ? 'Cập nhật' : 'Lưu máy chủ'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
