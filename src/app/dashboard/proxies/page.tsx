"use client";

import { useState, useCallback, useRef } from "react";
import { ProxyList } from "@/modules/proxies/components/proxy-list";
import { AddProxyForm, AddProxyFormRef } from "@/modules/proxies/components/add-proxy-form";
import { useProxies } from "@/hooks/use-proxies";
import { Proxy } from "@prisma/client";
import { JobProgressModal } from "@/components/jobs/job-progress-modal";
import { Button } from "@heroui/react";
import { Plus, X } from "lucide-react";

export default function ProxiesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | undefined>(undefined);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  const { createMutation, updateMutation, bulkCreateMutation } = useProxies();
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

  const handleJobCreated = useCallback((jobId: string) => {
    setIsModalOpen(false); // Close the input modal immediately
    setEditingProxy(undefined);
    setActiveJobId(jobId); // Open the progress modal
  }, []);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Quản lý Proxy</h1>
          <p className="text-xs text-slate-400">Danh sách các Proxy đã được khởi tạo trên hệ thống</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onPress={toggleModal}
          className="cursor-pointer font-bold text-xs h-9 px-3 flex items-center gap-1.5 self-start sm:self-auto rounded-lg"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          Tạo Proxy mới
        </Button>
      </div>

      {/* Proxy List Component */}
      <ProxyList onEdit={handleEdit} onAdd={toggleModal} />

      {/* Modern Compact Overlay Modal for Add/Edit Proxy */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">
                {editingProxy ? "Chỉnh sửa Proxy" : "Tạo Proxy mới"}
              </h3>
              <button 
                onClick={toggleModal}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="bg-white max-h-[75vh] overflow-y-auto">
              <AddProxyForm 
                ref={formRef} 
                onClose={toggleModal} 
                onJobCreated={handleJobCreated}
                proxy={editingProxy}
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
                isDisabled={createMutation.isPending || updateMutation.isPending || bulkCreateMutation.isPending}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
              >
                {(createMutation.isPending || updateMutation.isPending || bulkCreateMutation.isPending) && (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                {editingProxy ? 'Cập nhật' : 'Tạo ngay'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SSH Terminal/Job feedback modal */}
      <JobProgressModal 
        key={activeJobId || 'none'}
        jobId={activeJobId}
        open={!!activeJobId}
        onClose={() => setActiveJobId(null)}
      />
    </div>
  );
}
