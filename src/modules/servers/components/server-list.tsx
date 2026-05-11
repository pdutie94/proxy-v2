"use client";

import { useServers } from '@/hooks/use-servers';
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
  BlockStack
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, PlayIcon, RefreshIcon } from "@shopify/polaris-icons";
import { Server } from '@prisma/client';
import { useState, useCallback } from 'react';
import { JobProgressModal } from '@/components/jobs/job-progress-modal';

interface ServerListProps {
  onEdit: (server: Server) => void;
}

export function ServerList({ onEdit }: ServerListProps) {
  const { servers, isLoading, deleteMutation, setupMutation, resetMutation, syncMutation } = useServers();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeConfirmServer, setActiveConfirmServer] = useState<Server | null>(null);

  const resourceName = {
    singular: 'máy chủ',
    plural: 'máy chủ',
  };

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

  const rowMarkup = servers.map(
    (server, index) => (
      <IndexTable.Row id={server.id} key={server.id} position={index}>
        <IndexTable.Cell>
          <Text as="span" fontWeight="bold">
            {server.name}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{server.host}</IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={
            (server.status as any) === 'ONLINE' ? 'success' : 
            (server.status as any) === 'SETTING_UP' ? 'attention' : 
            (server.status as any) === 'PENDING' ? 'attention' : 
            'critical'
          }>
            {(server.status as any) === 'ONLINE' ? 'TRỰC TUYẾN' : 
             (server.status as any) === 'SETTING_UP' ? 'ĐANG CÀI ĐẶT' : 
             (server.status as any) === 'PENDING' ? 'ĐANG CHỜ' : 
             'LỖI'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>{server.maxProxies}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" fontWeight="medium">
            {server.lastPort || '---'}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="end" gap="200">
            <Tooltip content="Thiết lập Server (Cài đặt Gost/IP)">
              <Button 
                icon={PlayIcon} 
                variant="tertiary" 
                onClick={() => setActiveConfirmServer(server)}
                loading={setupMutation.isPending && setupMutation.variables === server.id}
                disabled={(server.status as any) === 'SETTING_UP'}
              />
            </Tooltip>
            <Tooltip content="Reset Server (Xóa hết Proxy)">
              <Button 
                icon={RefreshIcon} 
                variant="tertiary" 
                tone="critical"
                onClick={() => resetMutation.mutate(server.id, {
                  onSuccess: (job) => setActiveJobId(job.jobId)
                })}
                loading={resetMutation.isPending && resetMutation.variables === server.id}
                disabled={(server.status as any) === 'SETTING_UP'}
              />
            </Tooltip>
            <Tooltip content="Đồng bộ cổng từ Server">
              <Button 
                icon={RefreshIcon} 
                variant="tertiary" 
                onClick={() => syncMutation.mutate(server.id, {
                  onSuccess: (job) => setActiveJobId(job.jobId)
                })}
                loading={syncMutation.isPending && syncMutation.variables === server.id}
              />
            </Tooltip>
            <Tooltip content="Chỉnh sửa">
              <Button 
                icon={EditIcon} 
                variant="tertiary" 
                onClick={() => onEdit(server)}
              />
            </Tooltip>
            <Tooltip content="Xóa Server">
              <Button 
                icon={DeleteIcon} 
                variant="tertiary" 
                tone="critical"
                onClick={() => setDeleteId(server.id)}
              />
            </Tooltip>
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <>
      <Card padding="0">
        <IndexTable
          resourceName={resourceName}
          itemCount={servers.length}
          headings={[
            { title: 'Tên Máy chủ' },
            { title: 'Địa chỉ IP' },
            { title: 'Trạng thái' },
            { title: 'Giới hạn Proxy' },
            { title: 'Cổng cuối (SV)' },
            { title: 'Thao tác', alignment: 'end' },
          ]}
          selectable={false}
        >
          {rowMarkup}
        </IndexTable>
      </Card>

      {/* Modal xác nhận xóa */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác nhận xóa máy chủ?"
        primaryAction={{
          content: 'Xóa máy chủ',
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
            Bạn có chắc chắn muốn xóa máy chủ này? Hành động này không thể hoàn tác và sẽ ảnh hưởng đến các Proxy đang chạy trên máy chủ này.
          </Text>
        </Modal.Section>
      </Modal>

      {/* MODAL XÁC NHẬN SETUP */}
      <Modal
        open={!!activeConfirmServer}
        onClose={() => setActiveConfirmServer(null)}
        title="Xác nhận thiết lập máy chủ?"
        primaryAction={{
          content: 'Bắt đầu thiết lập',
          onAction: () => {
            if (activeConfirmServer) {
              setupMutation.mutate(activeConfirmServer.id, {
                onSuccess: (job) => {
                  setActiveJobId(job.jobId);
                  setActiveConfirmServer(null);
                }
              });
            }
          },
          loading: setupMutation.isPending
        }}
        secondaryActions={[{
          content: 'Hủy bỏ',
          onAction: () => setActiveConfirmServer(null)
        }]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            {activeConfirmServer?.status === 'ONLINE' && (
              <Box padding="300" background="bg-surface-critical-subdued" borderRadius="200">
                <Text as="p" tone="critical" fontWeight="bold">
                  ⚠️ CẢNH BÁO: Máy chủ này đang ở trạng thái HOẠT ĐỘNG (ONLINE). 
                  Việc thiết lập lại sẽ xóa sạch toàn bộ cấu hình Proxy hiện tại và ngắt các kết nối đang chạy!
                </Text>
              </Box>
            )}
            <Text as="p">
              Hệ thống sẽ thực hiện dọn dẹp (Deep Clean) và cài đặt lại toàn bộ môi trường Super-V5.0.0 trên máy chủ <b>{activeConfirmServer?.host}</b>.
            </Text>
            <Text as="p" variant="bodySm" color="subdued">
              Quá trình này có thể mất 1-2 phút. Bạn có muốn tiếp tục không?
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>

      <JobProgressModal 
        jobId={activeJobId}
        open={!!activeJobId}
        onClose={() => setActiveJobId(null)}
      />
    </>
  );
}
