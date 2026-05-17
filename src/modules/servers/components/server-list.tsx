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
  BlockStack,
  useBreakpoints,
  IndexFilters,
  useSetIndexFiltersMode,
  ChoiceList,
  EmptyState
} from "@shopify/polaris";
import { 
  DeleteIcon, 
  EditIcon, 
  PlayIcon, 
  RefreshIcon, 
  ResetIcon 
} from "@shopify/polaris-icons";
import { Server } from '@prisma/client';
import { useState, useCallback } from 'react';
import { JobProgressModal } from '@/components/jobs/job-progress-modal';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ServerListProps {
  onEdit: (server: Server) => void;
  onAdd?: () => void;
}

export function ServerList({ onEdit, onAdd }: ServerListProps) {
  const { servers, isLoading, deleteMutation, setupMutation, resetMutation, syncMutation } = useServers();
  const queryClient = useQueryClient();
  const { smDown } = useBreakpoints();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeConfirmServer, setActiveConfirmServer] = useState<Server | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Filters state
  const [queryValue, setQueryValue] = useState('');
  const [status, setStatus] = useState<string[]>([]);
  const { mode, setMode } = useSetIndexFiltersMode();

  const onHandleStatusChange = useCallback(
    (value: string[]) => setStatus(value),
    [],
  );


  const onHandleStatusRemove = useCallback(() => setStatus([]), []);
  const onHandleQueryValueRemove = useCallback(() => setQueryValue(''), []);
  const onHandleFiltersClearAll = useCallback(() => {
    onHandleStatusRemove();
    onHandleQueryValueRemove();
  }, [onHandleStatusRemove, onHandleQueryValueRemove]);

  const [itemStrings] = useState([
    'Tất cả',
    'Trực tuyến',
    'Đang cài đặt',
    'Lỗi',
  ]);

  const [selected, setSelected] = useState(0);

  const filteredServers = servers.filter((server) => {
    const matchesQuery = server.name.toLowerCase().includes(queryValue.toLowerCase()) || 
                        server.host.toLowerCase().includes(queryValue.toLowerCase());
    
    const matchesTab = selected === 0 || 
                      (selected === 1 && server.status === 'ONLINE') ||
                      (selected === 2 && server.status === 'SETTING_UP') ||
                      (selected === 3 && server.status === 'ERROR');

    const matchesStatus = status.length === 0 || status.includes(server.status);

    return matchesQuery && matchesTab && matchesStatus;
  });


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

  const resourceName = {
    singular: 'máy chủ',
    plural: 'máy chủ',
  };

  const totalPages = Math.ceil(filteredServers.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedServers = filteredServers.slice(startIndex, startIndex + itemsPerPage);

  const rowMarkup = paginatedServers.map(
    (server, index) => (
      <IndexTable.Row id={server.id} key={server.id} position={index}>
        <IndexTable.Cell>
          <Text as="span" fontWeight="bold">
            {server.name}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            <span style={{ fontFamily: 'monospace' }}>{server.host}</span>
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={
            server.status === 'ONLINE' ? 'success' : 
            server.status === 'SETTING_UP' ? 'attention' : 
            server.status === 'PENDING' ? 'attention' : 
            'critical'
          }>
            {server.status === 'ONLINE' ? 'Trực tuyến' : 
             server.status === 'SETTING_UP' ? 'Đang cài đặt' : 
             server.status === 'PENDING' ? 'Đang chờ' : 
             'Lỗi'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>{server.maxProxies}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" fontWeight="medium">
            <span style={{ fontFamily: 'monospace' }}>{server.lastPort || '---'}</span>
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={{ minWidth: smDown ? '180px' : 'auto' }}>
            <InlineStack align="end" gap="200" wrap={false}>
              {smDown ? (
                <Button 
                  icon={PlayIcon} 
                  variant="tertiary" 
                  onClick={() => setActiveConfirmServer(server)}
                  loading={setupMutation.isPending && setupMutation.variables === server.id}
                  disabled={server.status === 'SETTING_UP'}
                />
              ) : (
                <Tooltip content="Thiết lập Server (Cài đặt Gost/IP)">
                  <Button 
                    icon={PlayIcon} 
                    variant="tertiary" 
                    onClick={() => setActiveConfirmServer(server)}
                    loading={setupMutation.isPending && setupMutation.variables === server.id}
                    disabled={server.status === 'SETTING_UP'}
                  />
                </Tooltip>
              )}

              {smDown ? (
                <Button 
                  icon={ResetIcon} 
                  variant="tertiary" 
                  tone="critical"
                  onClick={() => resetMutation.mutate(server.id, {
                    onSuccess: (job) => setActiveJobId(job.jobId)
                  })}
                  loading={resetMutation.isPending && resetMutation.variables === server.id}
                  disabled={server.status === 'SETTING_UP'}
                />
              ) : (
                <Tooltip content="Reset Server (Xóa hết Proxy)">
                  <Button 
                    icon={ResetIcon} 
                    variant="tertiary" 
                    tone="critical"
                    onClick={() => resetMutation.mutate(server.id, {
                      onSuccess: (job) => setActiveJobId(job.jobId)
                    })}
                    loading={resetMutation.isPending && resetMutation.variables === server.id}
                    disabled={server.status === 'SETTING_UP'}
                  />
                </Tooltip>
              )}

              {smDown ? (
                <Button 
                  icon={RefreshIcon} 
                  variant="tertiary" 
                  onClick={() => syncMutation.mutate(server.id, {
                    onSuccess: (job) => setActiveJobId(job.jobId)
                  })}
                  loading={syncMutation.isPending && syncMutation.variables === server.id}
                />
              ) : (
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
              )}


              {smDown ? (
                <Button 
                  icon={EditIcon} 
                  variant="tertiary" 
                  onClick={() => onEdit(server)}
                />
              ) : (
                <Tooltip content="Chỉnh sửa">
                  <Button 
                    icon={EditIcon} 
                    variant="tertiary" 
                    onClick={() => onEdit(server)}
                  />
                </Tooltip>
              )}

              {smDown ? (
                <Button 
                  icon={DeleteIcon} 
                  variant="tertiary" 
                  tone="critical"
                  onClick={() => setDeleteId(server.id)}
                />
              ) : (
                <Tooltip content="Xóa Server">
                  <Button 
                    icon={DeleteIcon} 
                    variant="tertiary" 
                    tone="critical"
                    onClick={() => setDeleteId(server.id)}
                  />
                </Tooltip>
              )}
            </InlineStack>
          </div>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <>
    <Box paddingInline={{ xs: '400', sm: '0' }}>
      <Card padding="0">
        <IndexFilters
          queryValue={queryValue}
          queryPlaceholder="Tìm kiếm máy chủ..."
          onQueryChange={(val) => setQueryValue(val)}
          onQueryClear={() => setQueryValue('')}
          cancelAction={{
            onAction: onHandleFiltersClearAll,
            disabled: false,
            loading: false,
          }}
          tabs={itemStrings.map((item, index) => ({
            content: item,
            index,
            id: item,
            isLocked: index === 0,
          }))}
          selected={selected}
          onSelect={setSelected}
          mode={mode}
          setMode={setMode}
          filters={[
            {
              key: 'status',
              label: 'Trạng thái',
              filter: (
                <ChoiceList
                  title="Trạng thái"
                  titleHidden
                  choices={[
                    { label: 'Trực tuyến', value: 'ONLINE' },
                    { label: 'Đang cài đặt', value: 'SETTING_UP' },
                    { label: 'Đang chờ', value: 'PENDING' },
                    { label: 'Lỗi', value: 'ERROR' },
                  ]}
                  selected={status}
                  onChange={onHandleStatusChange}
                  allowMultiple
                />
              ),
              shortcut: true,
            },
          ]}
          onClearAll={onHandleFiltersClearAll}
        />
        <IndexTable
          resourceName={resourceName}
          itemCount={filteredServers.length}
          emptyState={(
            <EmptyState
              heading="Chưa có máy chủ nào"
              action={onAdd ? {
                content: 'Thêm máy chủ đầu tiên',
                onAction: onAdd,
              } : undefined}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Hãy thêm máy chủ để bắt đầu khởi tạo hệ thống Proxy của bạn.</p>
            </EmptyState>
          )}
          headings={[
            { title: 'Tên Máy chủ', id: 'name' },
            { title: 'Địa chỉ IP', id: 'host' },
            { title: 'Trạng thái' },
            { title: 'Giới hạn Proxy' },
            { title: 'Cổng cuối (SV)' },
            { title: 'Thao tác', alignment: 'end' },
          ]}
          selectable={false}
          pagination={{
            hasNext: page < totalPages,
            hasPrevious: page > 1,
            onNext: () => setPage(page + 1),
            onPrevious: () => setPage(page - 1),
            label: `Trang ${page} / ${totalPages || 1}`,
          }}
        >
          {rowMarkup}
        </IndexTable>
      </Card>
    </Box>

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
              <Box padding="300" background="bg-surface-critical" borderRadius="200">
                <Text as="p" tone="critical" fontWeight="bold">
                  ⚠️ CẢNH BÁO: Máy chủ này đang ở trạng thái HOẠT ĐỘNG (ONLINE). 
                  Việc thiết lập lại sẽ xóa sạch toàn bộ cấu hình Proxy hiện tại và ngắt các kết nối đang chạy!
                </Text>
              </Box>
            )}
            <Text as="p">
              Hệ thống sẽ thực hiện dọn dẹp (Deep Clean) và cài đặt lại toàn bộ môi trường Super-V5.0.0 trên máy chủ <b>{activeConfirmServer?.host}</b>.
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Quá trình này có thể mất 1-2 phút. Bạn có muốn tiếp tục không?
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>

      <JobProgressModal 
        key={activeJobId || 'none'}
        jobId={activeJobId}
        open={!!activeJobId}
        onClose={() => setActiveJobId(null)}
        onCompleted={() => {
          queryClient.invalidateQueries({ queryKey: ['servers'] });
          queryClient.invalidateQueries({ queryKey: ['proxies'] });
          toast.success('Xử lý hoàn tất');
        }}
      />

    </>
  );
}
