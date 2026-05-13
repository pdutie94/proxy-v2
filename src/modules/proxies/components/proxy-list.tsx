"use client";

import { useProxies } from '@/hooks/use-proxies';
import { useServers } from '@/hooks/use-servers';
import { 
  IndexTable, 
  Card,
  Badge,
  Text,
  Button,
  Box,
  InlineStack,
  Modal,
  useSetIndexFiltersMode,
  IndexFilters,
  TabProps,
  ChoiceList,
  Tooltip,
  IndexFiltersProps,
  BlockStack,
  Pagination
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, RefreshIcon, ClipboardIcon, SearchIcon, ExportIcon, CalendarIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";
import { Proxy } from '@prisma/client';
import { useState, useCallback, useMemo } from 'react';
import { JobProgressModal } from '@/components/jobs/job-progress-modal';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { copyToClipboard } from '@/utils/clipboard';
import { getCountdown } from '@/utils/date';
import { getProxyStatusTone } from '@/utils/status';
import { useQueryClient } from '@tanstack/react-query';

import { ProxyWithServer } from '@/types';

interface ProxyListProps {
  onEdit: (proxy: Proxy) => void;
}

export function ProxyList({ onEdit }: ProxyListProps) {
  const { 
    proxies, 
    isLoading, 
    deleteMutation, 
    bulkDeleteMutation, 
    bulkRenewMutation,
    bulkUpdateAutoRenewMutation,
    rotateProxyMutation, 
    checkGoogleMutation 
  } = useProxies();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "USER";
  const canDelete = userRole === "ADMIN";

  const { servers } = useServers();

  // State declarations moved up to avoid access before declaration
  const [queryValue, setQueryValue] = useState('');
  const [status, setStatus] = useState<string[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string[]>([]);
  const [itemStrings, setItemStrings] = useState(['Tất cả', 'Hoạt động', 'Đang tạo', 'Lỗi']);
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  const itemsPerPage = 20;

  // Filters State
  const { mode, setMode } = useSetIndexFiltersMode();
  
  const onHandleTabSelect = useCallback((index: number) => {
    setSelectedTab(index);
    setPage(1);
    setSelectedResources([]);
  }, [setSelectedTab, setPage, setSelectedResources]);

  const onHandleStatusChange = useCallback((value: string[]) => {
    setStatus(value);
    setPage(1);
    setSelectedResources([]);
  }, [setStatus, setPage, setSelectedResources]);

  const onHandleServerChange = useCallback((value: string[]) => {
    setSelectedServerId(value);
    setPage(1);
    setSelectedResources([]);
  }, [setSelectedServerId, setPage, setSelectedResources]);

  const onHandleQueryValueChange = useCallback((value: string) => {
    setQueryValue(value);
    setPage(1);
    setSelectedResources([]);
  }, [setQueryValue, setPage, setSelectedResources]);

  const onHandleFiltersClearAll = useCallback(() => {
    setStatus([]);
    setSelectedServerId([]);
    setQueryValue('');
    setPage(1);
    setSelectedResources([]);
  }, [setStatus, setSelectedServerId, setQueryValue, setPage, setSelectedResources]);

  const tabs: TabProps[] = useMemo(() => itemStrings.map((item, index) => ({
    content: item,
    index,
    id: `${item}-${index}`,
    isLocked: index <= 3,
  })), [itemStrings]);

  const onCreateNewView = async (value: string) => {
    setItemStrings([...itemStrings, value]);
    onHandleTabSelect(itemStrings.length);
    return true;
  };

  const [sortSelected, setSortSelected] = useState(['id desc']);
  const sortOptions: IndexFiltersProps['sortOptions'] = [
    { label: 'ID', value: 'id asc', directionLabel: 'Cũ nhất' },
    { label: 'ID', value: 'id desc', directionLabel: 'Mới nhất' },
    { label: 'Port', value: 'port asc', directionLabel: 'Tăng dần' },
    { label: 'Port', value: 'port desc', directionLabel: 'Giảm dần' },
    { label: 'Hết hạn', value: 'expiresAt asc', directionLabel: 'Gần nhất' },
    { label: 'Hết hạn', value: 'expiresAt desc', directionLabel: 'Xa nhất' },
  ];

  const filteredProxies = useMemo(() => {
    const result = (proxies as ProxyWithServer[]).filter((proxy) => {
      // Filter by dynamic tabs
      const currentTabName = itemStrings[selectedTab];
      if (currentTabName === 'Hoạt động' && proxy.status !== 'ACTIVE') return false;
      if (currentTabName === 'Đang tạo' && proxy.status !== 'CREATING') return false;
      if (currentTabName === 'Lỗi' && proxy.status !== 'ERROR') return false;

      const queryLower = queryValue.toLowerCase();
      if (queryValue && !proxy.port.toString().includes(queryValue) && !proxy.username.toLowerCase().includes(queryLower)) {
        return false;
      }

      if (status.length > 0 && !status.includes(proxy.status)) {
        return false;
      }

      if (selectedServerId.length > 0 && !selectedServerId.includes(proxy.serverId)) {
        return false;
      }

      return true;
    });

    // Handle Sorting
    if (sortSelected.length > 0) {
      const [key, direction] = sortSelected[0].split(' ');
      result.sort((a, b) => {
        const valA = a[key as keyof ProxyWithServer];
        const valB = b[key as keyof ProxyWithServer];

        // Handle numeric port
        if (key === 'port') {
          const portA = parseInt(a.port.toString());
          const portB = parseInt(b.port.toString());
          if (portA < portB) return direction === 'asc' ? -1 : 1;
          if (portA > portB) return direction === 'asc' ? 1 : -1;
          return 0;
        }

        const aValue = valA ?? '';
        const bValue = valB ?? '';

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by id desc
      result.sort((a, b) => (b.id > a.id ? 1 : -1));
    }

    return result;
  }, [proxies, selectedTab, queryValue, status, selectedServerId, sortSelected, itemStrings]);

  const totalPages = Math.ceil(filteredProxies.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedProxies = filteredProxies.slice(startIndex, startIndex + itemsPerPage);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectionChange = useCallback((selectionType: any, toggleType: boolean, selection?: string | [number, number]) => {
    if (selectionType === 'all' || selectionType === 'page') {
      setSelectedResources(toggleType ? paginatedProxies.map(p => p.id) : []);
    } else if (selectionType === 'single') {
      const id = selection as string;
      setSelectedResources(prev => 
        toggleType ? [...prev, id] : prev.filter(item => item !== id)
      );
    } else if (selectionType === 'multi') {
      const [start, end] = selection as [number, number];
      const sliceIds = paginatedProxies.slice(start, end + 1).map(p => p.id);
      setSelectedResources(prev => {
        const otherIds = prev.filter(id => !sliceIds.includes(id));
        return toggleType ? [...otherIds, ...sliceIds] : otherIds;
      });
    }
  }, [paginatedProxies, setSelectedResources]);


  const [activeDeleteModal, setActiveDeleteModal] = useState(false);
  const [proxyToDelete, setProxyToDelete] = useState<string | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const handleDeleteClick = (id: string) => {
    setProxyToDelete(id);
    setIsBulkDelete(false);
    setActiveDeleteModal(true);
  };

  const handleBulkDeleteClick = () => {
    setIsBulkDelete(true);
    setActiveDeleteModal(true);
  };

  const confirmDelete = () => {
    if (isBulkDelete) {
      bulkDeleteMutation.mutate(selectedResources, {
        onSuccess: () => {
          setActiveDeleteModal(false);
          setSelectedResources([]);
        }
      });
    } else if (proxyToDelete) {
      deleteMutation.mutate(proxyToDelete, {
        onSuccess: () => {
          setActiveDeleteModal(false);
        }
      });
    }
  };

  const handleCopyProxies = useCallback(() => {
    const selectedProxies = filteredProxies.filter(p => selectedResources.includes(p.id));
    if (selectedProxies.length === 0) return;
    
    const text = selectedProxies.map(p => {
      const host = p.server?.host || '0.0.0.0';
      return `${host}:${p.port}:${p.username}:${p.password}`;
    }).join('\n');

    copyToClipboard(text).then((success) => {
      if (success) {
        toast.success(`Đã copy ${selectedProxies.length} proxy vào bộ nhớ tạm`);
        setSelectedResources([]);
      } else {
        toast.error('Không thể copy vào bộ nhớ tạm');
      }
    });
  }, [selectedResources, filteredProxies, setSelectedResources]);

  const handleExportProxies = useCallback(() => {
    const selectedProxies = filteredProxies.filter(p => selectedResources.includes(p.id));
    if (selectedProxies.length === 0) return;
    
    const text = selectedProxies.map(p => {
      const host = p.server?.host || '0.0.0.0';
      return `${host}:${p.port}:${p.username}:${p.password}`;
    }).join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxies_${format(new Date(), 'yyyyMMdd_HHmmss')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Đã xuất ${selectedProxies.length} proxy ra file TXT`);
    setSelectedResources([]);
  }, [selectedResources, filteredProxies, setSelectedResources]);

  const [activeRenewModal, setActiveRenewModal] = useState(false);
  const [activeAutoRenewModal, setActiveAutoRenewModal] = useState(false);
  const [renewalDuration, setRenewalDuration] = useState('1m');

  const handleBulkRenew = useCallback(() => {
    bulkRenewMutation.mutate({ ids: selectedResources, duration: renewalDuration }, {
      onSuccess: () => {
        setActiveRenewModal(false);
        setSelectedResources([]);
      }
    });
  }, [selectedResources, renewalDuration, bulkRenewMutation, setSelectedResources]);

  const handleBulkToggleAutoRenew = useCallback((status: boolean) => {
    if (status) {
      setActiveAutoRenewModal(true);
    } else {
      bulkUpdateAutoRenewMutation.mutate({ ids: selectedResources, autoRenew: false }, {
        onSuccess: () => {
          setSelectedResources([]);
        }
      });
    }
  }, [selectedResources, bulkUpdateAutoRenewMutation, setSelectedResources]);

  const confirmBulkAutoRenew = useCallback(() => {
    bulkUpdateAutoRenewMutation.mutate({ 
      ids: selectedResources, 
      autoRenew: true,
      renewalDuration: renewalDuration 
    }, {
      onSuccess: () => {
        setActiveAutoRenewModal(false);
        setSelectedResources([]);
      }
    });
  }, [selectedResources, renewalDuration, bulkUpdateAutoRenewMutation, setSelectedResources]);


  const promotedBulkActions = [
    {
      content: `Copy ${selectedResources.length} Proxy`,
      onAction: handleCopyProxies,
      icon: ClipboardIcon,
    },
    {
      content: `Xuất file (.txt)`,
      onAction: handleExportProxies,
      icon: ExportIcon,
    },
    {
      content: 'Gia hạn',
      onAction: () => setActiveRenewModal(true),
      icon: CalendarIcon,
    },
  ];

  const bulkActions = [
    {
      content: 'Bật tự động gia hạn',
      onAction: () => handleBulkToggleAutoRenew(true),
    },
    {
      content: 'Tắt tự động gia hạn',
      onAction: () => handleBulkToggleAutoRenew(false),
    },
    {
      content: 'Xoay IPv6 (Rotate)',
      onAction: () => {
        selectedResources.forEach(id => rotateProxyMutation.mutate(id));
        setSelectedResources([]);
      },
    },
    {
      content: 'Kiểm tra Google',
      onAction: () => {
        selectedResources.forEach(id => checkGoogleMutation.mutate(id));
        setSelectedResources([]);
      },
    },
    {
      content: 'Xóa các mục đã chọn',
      onAction: handleBulkDeleteClick,
    },
  ];

  const resourceName = {
    singular: 'proxy',
    plural: 'proxies',
  };

  const rowMarkup = paginatedProxies.map(
    (proxy, index) => (
      <IndexTable.Row
        id={proxy.id}
        key={proxy.id}
        selected={selectedResources.includes(proxy.id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {proxy.port}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <BlockStack gap="100">
            <Text variant="bodySm" as="span">{proxy.server.name}</Text>
            <Text variant="bodyXs" tone="subdued" as="span">{proxy.server.host}</Text>
          </BlockStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Tooltip content={`Click để copy: ${proxy.username}:${proxy.password}`}>
            <Button 
              variant="tertiary" 
              size="slim"
              onClick={() => {
                copyToClipboard(`${proxy.username}:${proxy.password}`);
                toast.success('Đã copy User:Pass');
              }}
            >
              {proxy.username}
            </Button>
          </Tooltip>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={getProxyStatusTone(proxy.status)}>
            {proxy.status}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <BlockStack gap="100">
            <Text variant="bodySm" as="span">
              {proxy.expiresAt ? format(new Date(proxy.expiresAt), 'HH:mm dd/MM') : 'N/A'}
            </Text>
            {proxy.expiresAt && (
              <Text variant="bodyXs" tone="subdued" as="span">
                {getCountdown(proxy.expiresAt)}
              </Text>
            )}
          </BlockStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {proxy.autoRenew ? (
             <Badge tone="success">{`BẬT (${proxy.renewalDuration})`}</Badge>
          ) : (
             <Badge>TẮT</Badge>
          )}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="100">
            <Tooltip content="Xoay IPv6">
              <Button
                icon={RefreshIcon}
                onClick={() => rotateProxyMutation.mutate(proxy.id)}
                loading={rotateProxyMutation.isPending && rotateProxyMutation.variables === proxy.id}
              />
            </Tooltip>
            <Tooltip content="Kiểm tra Google">
              <Button
                icon={SearchIcon}
                onClick={() => checkGoogleMutation.mutate(proxy.id)}
                loading={checkGoogleMutation.isPending && checkGoogleMutation.variables === proxy.id}
              />
            </Tooltip>
            <Tooltip content="Chỉnh sửa">
              <Button
                icon={EditIcon}
                onClick={() => onEdit(proxy)}
              />
            </Tooltip>
            {canDelete && (
              <Tooltip content="Xóa">
                <Button
                  tone="critical"
                  icon={DeleteIcon}
                  onClick={() => handleDeleteClick(proxy.id)}
                />
              </Tooltip>
            )}
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Card padding="0">
      <IndexFilters
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        queryValue={queryValue}
        queryPlaceholder="Tìm theo port hoặc user..."
        onQueryChange={onHandleQueryValueChange}
        onQueryClear={() => onHandleQueryValueChange('')}
        onSort={setSortSelected}
        primaryAction={{
          type: 'save',
          onAction: async () => true,
        }}
        cancelAction={{
          onAction: () => {},
          disabled: false,
          loading: false,
        }}
        tabs={tabs}
        selected={selectedTab}
        onSelect={onHandleTabSelect}
        canCreateNewView
        onCreateNewView={onCreateNewView}
        filters={[
          {
            key: 'status',
            label: 'Trạng thái',
            filter: (
              <ChoiceList
                title="Trạng thái"
                titleHidden
                choices={[
                  { label: 'Hoạt động', value: 'ACTIVE' },
                  { label: 'Đang tạo', value: 'CREATING' },
                  { label: 'Hết hạn', value: 'EXPIRED' },
                  { label: 'Lỗi', value: 'ERROR' },
                ]}
                selected={status}
                onChange={onHandleStatusChange}
                allowMultiple
              />
            ),
            shortcut: true,
          },
          {
            key: 'serverId',
            label: 'Máy chủ',
            filter: (
              <ChoiceList
                title="Máy chủ"
                titleHidden
                choices={servers.map(s => ({ label: s.name, value: s.id }))}
                selected={selectedServerId}
                onChange={onHandleServerChange}
                allowMultiple
              />
            ),
            shortcut: true,
          },
        ]}
        onClearAll={onHandleFiltersClearAll}
        mode={mode}
        setMode={setMode}
      />
      
      <IndexTable
        resourceName={resourceName}
        itemCount={filteredProxies.length}
        selectedItemsCount={
          selectedResources.length === filteredProxies.length ? 'All' : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        promotedBulkActions={promotedBulkActions}
        bulkActions={bulkActions}
        headings={[
          { title: 'Port' },
          { title: 'Máy chủ' },
          { title: 'Username' },
          { title: 'Trạng thái' },
          { title: 'Hết hạn' },
          { title: 'Tự động gia hạn' },
          { title: 'Hành động' },
        ]}
        loading={isLoading}
      >
        {rowMarkup}
      </IndexTable>

      <Box padding="400">
        <InlineStack align="center">
          <Pagination
            hasNext={page < totalPages}
            hasPrevious={page > 1}
            onNext={() => {
              setPage(page + 1);
              setSelectedResources([]);
            }}
            onPrevious={() => {
              setPage(page - 1);
              setSelectedResources([]);
            }}
          />
        </InlineStack>
      </Box>

      <JobProgressModal 
        key={activeJobId || 'none'}
        jobId={activeJobId}
        open={!!activeJobId}
        onClose={() => setActiveJobId(null)}
        onCompleted={() => {
          queryClient.invalidateQueries({ queryKey: ['proxies'] });
        }}
      />

      <Modal
        open={activeDeleteModal}
        onClose={() => setActiveDeleteModal(false)}
        title={isBulkDelete ? "Xóa nhiều Proxy" : "Xác nhận xóa"}
        primaryAction={{
          content: 'Xóa',
          destructive: true,
          onAction: confirmDelete,
          loading: deleteMutation.isPending || bulkDeleteMutation.isPending
        }}
        secondaryActions={[
          {
            content: 'Hủy',
            onAction: () => setActiveDeleteModal(false),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            {isBulkDelete 
              ? `Bạn có chắc chắn muốn xóa ${selectedResources.length} proxy đã chọn? Hành động này không thể hoàn tác.`
              : "Bạn có chắc chắn muốn xóa proxy này? Mọi cấu hình liên quan trên server sẽ bị gỡ bỏ."}
          </Text>
        </Modal.Section>
      </Modal>

      <Modal
        open={activeRenewModal}
        onClose={() => setActiveRenewModal(false)}
        title={`Gia hạn ${selectedResources.length} Proxy`}
        primaryAction={{
          content: 'Gia hạn ngay',
          onAction: handleBulkRenew,
          loading: bulkRenewMutation.isPending
        }}
        secondaryActions={[
          {
            content: 'Hủy',
            onAction: () => setActiveRenewModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p">Chọn thời gian gia hạn cho các proxy đã chọn:</Text>
            <ChoiceList
              title="Thời gian gia hạn"
              titleHidden
              choices={[
                { label: '1 tháng', value: '1m' },
                { label: '3 tháng', value: '3m' },
                { label: '6 tháng', value: '6m' },
                { label: '1 năm', value: '1y' },
              ]}
              selected={[renewalDuration]}
              onChange={(val) => setRenewalDuration(val[0])}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Modal
        open={activeAutoRenewModal}
        onClose={() => setActiveAutoRenewModal(false)}
        title="Bật tự động gia hạn"
        primaryAction={{
          content: 'Xác nhận',
          onAction: confirmBulkAutoRenew,
          loading: bulkUpdateAutoRenewMutation.isPending
        }}
        secondaryActions={[
          {
            content: 'Hủy',
            onAction: () => setActiveAutoRenewModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p">Chọn thời gian gia hạn tự động (mỗi khi hết hạn):</Text>
            <ChoiceList
              title="Thời gian gia hạn"
              titleHidden
              choices={[
                { label: '1 tháng', value: '1m' },
                { label: '3 tháng', value: '3m' },
                { label: '6 tháng', value: '6m' },
                { label: '1 năm', value: '1y' },
              ]}
              selected={[renewalDuration]}
              onChange={(val) => setRenewalDuration(val[0])}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Card>
  );
}
