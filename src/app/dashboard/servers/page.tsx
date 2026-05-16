"use client";

import { Page, Modal } from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { useState, useCallback, useRef } from "react";
import { ServerList } from "@/modules/servers/components/server-list";
import { AddServerForm, AddServerFormRef } from "@/modules/servers/components/add-server-form";
import { useServers } from "@/hooks/use-servers";
import { Server } from "@prisma/client";

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
    <Page
      fullWidth
      title="Máy chủ"
      subtitle="Quản lý các máy chủ từ xa để cung cấp Proxy"
      primaryAction={{
        content: 'Thêm Máy chủ',
        icon: PlusIcon,
        onAction: toggleModal,
      }}
    >
      <ServerList onEdit={handleEdit} onAdd={toggleModal} />

      <Modal
        open={isModalOpen}
        onClose={toggleModal}
        title={editingServer ? "Chỉnh sửa máy chủ" : "Thêm máy chủ mới"}
        primaryAction={{
          content: editingServer ? 'Cập nhật' : 'Lưu máy chủ',
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
        <AddServerForm 
          ref={formRef} 
          onClose={toggleModal} 
          server={editingServer}
        />
      </Modal>
    </Page>
  );
}
