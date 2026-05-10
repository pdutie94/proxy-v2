"use client";

import { Page, Modal } from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { useState, useCallback, useRef } from "react";
import { ProxyList } from "@/modules/proxies/components/proxy-list";
import { AddProxyForm, AddProxyFormRef } from "@/modules/proxies/components/add-proxy-form";
import { useProxies } from "@/hooks/use-proxies";
import { Proxy } from "@prisma/client";

export default function ProxiesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | undefined>(undefined);
  
  const { createMutation, updateMutation } = useProxies();
  const formRef = useRef<AddProxyFormRef>(null);

  const toggleModal = useCallback(() => {
    if (isModalOpen) {
      setEditingProxy(undefined);
    }
    setIsModalOpen((open) => !open);
  }, [isModalOpen]);

  const handleEdit = useCallback((proxy: Proxy) => {
    setEditingProxy(proxy);
    setIsModalOpen(true);
  }, []);

  const handlePrimaryAction = useCallback(() => {
    formRef.current?.submit();
  }, []);

  return (
    <Page
      fullWidth
      title="Quản lý Proxy"
      subtitle="Danh sách các Proxy đã được khởi tạo trên hệ thống"
      primaryAction={{
        content: 'Tạo Proxy mới',
        icon: PlusIcon,
        onAction: toggleModal,
      }}
    >
      <ProxyList onEdit={handleEdit} />

      <Modal
        open={isModalOpen}
        onClose={toggleModal}
        title={editingProxy ? "Chỉnh sửa Proxy" : "Tạo Proxy mới"}
        primaryAction={{
          content: editingProxy ? 'Cập nhật' : 'Tạo ngay',
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
        <AddProxyForm 
          ref={formRef} 
          onClose={toggleModal} 
          proxy={editingProxy}
        />
      </Modal>
    </Page>
  );
}
