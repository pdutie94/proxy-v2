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
  SkeletonBodyText,
  IndexFilters,
  IndexFiltersMode,
  useBreakpoints,
  Tooltip,
} from "@shopify/polaris";
import { ViewIcon, DeleteIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";
import { useLogs } from "@/hooks/use-logs";
import { useState, useCallback, useMemo, useEffect } from "react";

export default function LogsPage() {
  const { logs, isLoading, clearLogs, isClearing } = useLogs(500); 
  const { smDown } = useBreakpoints();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const tabs = [
    { id: 'all', content: 'Tất cả' },
    { id: 'completed', content: 'Thành công' },
    { id: 'failed', content: 'Thất bại' },
    { id: 'active', content: 'Đang chạy' },
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      if (selectedTab === 1 && log.status !== 'COMPLETED') return false;
      if (selectedTab === 2 && log.status !== 'FAILED') return false;
      if (selectedTab === 3 && log.status !== 'ACTIVE') return false;
      return true;
    });
  }, [logs, selectedTab]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

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
      case 'COMPLETED': return <Badge tone="success">Thành công</Badge>;
      case 'FAILED': return <Badge tone="critical">Thất bại</Badge>;
      case 'ACTIVE': return <Badge tone="attention">Đang chạy</Badge>;
      default: return <Badge tone="info">Đang chờ</Badge>;
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

  const rowMarkup = paginatedLogs.map((log: any, index: number) => (
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
        <InlineStack align="end" wrap={false}>
          {smDown ? (
            <Button 
              icon={ViewIcon} 
              variant="tertiary" 
              onClick={() => setSelectedLog(log)}
            />
          ) : (
            <Tooltip content="Xem chi tiết">
              <Button 
                icon={ViewIcon} 
                variant="tertiary" 
                onClick={() => setSelectedLog(log)}
              />
            </Tooltip>
          )}
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

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
      <Box paddingInline={{ xs: '400', sm: '0' }}>
        <Card padding="0">
          <IndexFilters
            tabs={tabs}
            selected={selectedTab}
            onSelect={(index) => {
              setSelectedTab(index);
              setPage(1);
            }}
            mode={IndexFiltersMode.Filtering}
            setMode={() => {}}
            filters={[]}
            onClearAll={() => {}}
            hideFilters
            hideQueryField
          />
          <IndexTable
            resourceName={{ singular: 'nhật ký', plural: 'nhật ký' }}
            itemCount={filteredLogs.length}
            headings={[
              { title: 'Thời gian' },
              { title: 'Loại công việc' },
              { title: 'Máy chủ' },
              { title: 'Trạng thái' },
              { title: 'Thao tác', alignment: 'end' },
            ]}
            selectable={false}
            pagination={{
              hasNext: page < totalPages,
              hasPrevious: page > 1,
              onNext: () => setPage(page + 1),
              onPrevious: () => setPage(page - 1),
            }}
          >
            {rowMarkup}
          </IndexTable>
        </Card>
      </Box>

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
