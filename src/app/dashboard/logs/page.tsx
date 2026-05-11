"use client";

import { 
  Page, 
  Card, 
  IndexTable, 
  Text, 
  Badge, 
  Box,
  EmptyState,
  Button,
  Modal,
  Scrollable,
  InlineStack,
  SkeletonBodyText
} from "@shopify/polaris";
import { ViewIcon, DeleteIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";
import { useLogs } from "@/hooks/use-logs";
import { useState, useCallback } from "react";

export default function LogsPage() {
  const { logs, isLoading, clearLogs, isClearing } = useLogs(100); // Lấy nhiều hơn để xem
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const getJobTitle = (job: any) => {
    switch (job.type) {
      case 'SETUP_SERVER': return `Thiết lập server ${job.server?.name || ''}`;
      case 'PROVISION_PROXY': return `Tạo Proxy cổng ${job.proxy?.port || ''}`;
      case 'BULK_PROVISION_PROXY': return `Tạo hàng loạt Proxy (${job.server?.name || ''})`;
      case 'ROTATE_PROXY': return `Xoay IP cổng ${job.proxy?.port || ''}`;
      case 'DELETE_PROXY': return `Xóa Proxy cổng ${job.proxy?.port || ''}`;
      case 'RESET_SERVER': return `Reset server ${job.server?.name || ''}`;
      case 'SYNC_SERVER_PORT': return `Đồng bộ cổng server ${job.server?.name || ''}`;
      case 'AUTOMATION': return 'Chạy chu kỳ tự động hóa';
      default: return job.type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge tone="success">THÀNH CÔNG</Badge>;
      case 'FAILED': return <Badge tone="critical">THẤT BẠI</Badge>;
      case 'ACTIVE': return <Badge tone="attention">ĐANG CHẠY</Badge>;
      default: return <Badge tone="info">ĐANG CHỜ</Badge>;
    }
  };

  const handleDeleteAll = useCallback(() => {
    clearLogs();
    setIsDeleteModalOpen(false);
  }, [clearLogs]);

  if (isLoading) {
    return (
      <Page title="Nhật ký hệ thống">
        <Card>
          <Box padding="400">
            <SkeletonBodyText lines={10} />
          </Box>
        </Card>
      </Page>
    );
  }

  return (
    <Page 
      title="Nhật ký hệ thống"
      subtitle="Theo dõi chi tiết các hoạt động và tiến trình xử lý trên máy chủ"
      primaryAction={{
        content: 'Dọn dẹp nhật ký',
        icon: DeleteIcon,
        tone: 'critical',
        onAction: () => setIsDeleteModalOpen(true),
        disabled: logs.length === 0
      }}
    >
      <Card padding="0">
        <IndexTable
          resourceName={{ singular: 'nhật ký', plural: 'nhật ký' }}
          itemCount={logs.length}
          headings={[
            { title: 'Thời gian' },
            { title: 'Loại công việc' },
            { title: 'Máy chủ' },
            { title: 'Trạng thái' },
            { title: 'Hành động', alignment: 'end' },
          ]}
          selectable={false}
        >
          {logs.length === 0 ? (
            <IndexTable.Row id="empty" position={0}>
              <IndexTable.Cell colSpan={5}>
                <Box padding="1000">
                  <EmptyState
                    heading="Chưa có nhật ký nào"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Các hoạt động thiết lập máy chủ và khởi tạo proxy sẽ được hiển thị tại đây.</p>
                  </EmptyState>
                </Box>
              </IndexTable.Cell>
            </IndexTable.Row>
          ) : (
            logs.map((log: any, index: number) => (
              <IndexTable.Row id={log.id} key={log.id} position={index}>
                <IndexTable.Cell>
                  <Text as="span" variant="bodySm">
                    {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                  </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span" fontWeight="medium">{getJobTitle(log)}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{log.server?.name || '-'}</IndexTable.Cell>
                <IndexTable.Cell>
                  {getStatusBadge(log.status)}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <InlineStack align="end">
                    <Button 
                      icon={ViewIcon} 
                      variant="tertiary" 
                      onClick={() => setSelectedLog(log)}
                    />
                  </InlineStack>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))
          )}
        </IndexTable>
      </Card>

      {/* Modal xem chi tiết log */}
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Chi tiết công việc: ${selectedLog ? getJobTitle(selectedLog) : ''}`}
        large
      >
        <Modal.Section>
          <Box background="bg-surface-secondary" padding="400" borderRadius="200">
            <Scrollable style={{ maxHeight: '500px' }}>
              <pre style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.5'
              }}>
                {selectedLog?.logs || 'Không có dữ liệu nhật ký chi tiết.'}
              </pre>
            </Scrollable>
          </Box>
        </Modal.Section>
      </Modal>

      {/* Modal xác nhận xóa sạch log */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác nhận dọn dẹp nhật ký?"
        primaryAction={{
          content: 'Xác nhận xóa sạch',
          onAction: handleDeleteAll,
          destructive: true,
          loading: isClearing,
        }}
        secondaryActions={[
          {
            content: 'Hủy bỏ',
            onAction: () => setIsDeleteModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Hành động này sẽ xóa vĩnh viễn toàn bộ lịch sử công việc trong cơ sở dữ liệu. Bạn có chắc chắn muốn thực hiện?
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
