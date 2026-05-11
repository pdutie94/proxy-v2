"use client";

import { useProxies } from '@/hooks/use-proxies';
import { useServers } from '@/hooks/use-servers';
import { 
  IndexTable, 
  Card,
  LegacyCard,
  Badge,
  Text,
  Button,
  Box,
  SkeletonBodyText,
  InlineStack,
  Modal,
  Filters,
  useSetIndexFiltersMode,
  IndexFilters,
  TabProps,
  useBreakpoints,
  ChoiceList,
  Tooltip,
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, RefreshIcon, ClipboardIcon, SearchIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";
import { Proxy, Server } from '@prisma/client';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { JobProgressModal } from '@/components/jobs/job-progress-modal';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface ProxyWithServer extends Proxy {
  server: Server;
}

interface ProxyListProps {
  onEdit: (proxy: Proxy) => void;
}

export function ProxyList({ onEdit }: ProxyListProps) {
  const { smDown, mdDown } = useBreakpoints();
  const { proxies, isLoading, deleteMutation, bulkDeleteMutation, rotateProxyMutation, checkGoogleMutation } = useProxies();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "USER";
  const canDelete = userRole === "ADMIN";

  const { servers } = useServers();

  // Filters State
  const { mode, setMode } = useSetIndexFiltersMode();
  const [queryValue, setQueryValue] = useState('');
  const [status, setStatus] = useState<string[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string[]>([]);
  const [itemStrings, setItemStrings] = useState(['Tất cả', 'Hoạt động', 'Đang tạo', 'Lỗi']);
  const [selectedTab, setSelectedTab] = useState(0);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const tabs: TabProps[] = useMemo(() => itemStrings.map((item, index) => ({
    content: item,
    index,
    id: `${item}-${index}`,
    isLocked: index <= 3,
  })), [itemStrings]);

  const onCreateNewView = async (value: string) => {
    setItemStrings([...itemStrings, value]);
    setSelectedTab(itemStrings.length);
    return true;
  };

  const onHandleStatusChange = useCallback((value: string[]) => setStatus(value), []);
  const onHandleServerChange = useCallback((value: string[]) => setSelectedServerId(value), []);
  const onHandleQueryValueChange = useCallback((value: string) => setQueryValue(value), []);
  const onHandleFiltersClearAll = useCallback(() => {
    setStatus([]);
    setSelectedServerId([]);
    setQueryValue('');
    setPage(1);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedTab, queryValue, status, selectedServerId]);

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
    let result = (proxies as ProxyWithServer[]).filter((proxy) => {
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
        let valA: any = a[key as keyof ProxyWithServer];
        let valB: any = b[key as keyof ProxyWithServer];

        // Handle numeric port
        if (key === 'port') {
          valA = parseInt(a.port.toString());
          valB = parseInt(b.port.toString());
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
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

  // MANUAL SELECTION LOGIC
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  const handleSelectionChange = useCallback((selectionType: any, isSelected: boolean, selection?: string | any) => {
    if (selectionType === 'all' || selectionType === 'page') {
      setSelectedResources(isSelected ? paginatedProxies.map(p => p.id) : []);
    } else if (selectionType === 'single') {
      const id = selection as string;
      setSelectedResources(prev => 
        isSelected ? [...prev, id] : prev.filter(item => item !== id)
      );
    } else if (selectionType === 'multi') {
      const [start, end] = selection as [number, number];
      const sliceIds = paginatedProxies.slice(start, end + 1).map(p => p.id);
      setSelectedResources(prev => {
        const otherIds = prev.filter(id => !sliceIds.includes(id));
        return isSelected ? [...otherIds, ...sliceIds] : otherIds;
      });
    }
  }, [paginatedProxies]);

  const allResourcesSelected = useMemo(() => {
    return paginatedProxies.length > 0 && selectedResources.length === paginatedProxies.length;
  }, [selectedResources, paginatedProxies]);

  const clearSelection = useCallback(() => setSelectedResources([]), []);

  useEffect(() => {
    if (selectedResources.length > 0) {
      clearSelection();
    }
  }, [page, filteredProxies, clearSelection]);

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
    setProxyToDelete(null);
    setActiveDeleteModal(true);
  };

  const confirmDelete = () => {
    if (isBulkDelete) {
      bulkDeleteMutation.mutate(selectedResources, {
        onSuccess: () => {
          clearSelection();
          setActiveDeleteModal(false);
        }
      });
    } else if (proxyToDelete) {
      deleteMutation.mutate(proxyToDelete, {
        onSuccess: () => setActiveDeleteModal(false)
      });
    }
  };

  const indeterminate = useMemo(() => {
    return selectedResources.length > 0 && selectedResources.length < paginatedProxies.length;
  }, [paginatedProxies, selectedResources]);

  const handleCopyProxies = useCallback(() => {
    const selectedProxies = filteredProxies.filter(p => selectedResources.includes(p.id));
    if (selectedProxies.length === 0) return;
    
    const text = selectedProxies.map(p => {
      const host = p.server?.host || '0.0.0.0';
      return `${host}:${p.port}:${p.username}:${p.password}`;
    }).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Đã copy ${selectedProxies.length} proxy vào bộ nhớ tạm`);
      setSelectedResources([]);
    });
  }, [selectedResources, filteredProxies]);

  const handleBulkCheckGoogle = useCallback(() => {
    if (selectedResources.length === 0) return;
    
    selectedResources.forEach(id => {
      checkGoogleMutation.mutate(id);
    });
    
    setSelectedResources([]);
  }, [selectedResources, checkGoogleMutation]);

  const promotedBulkActions = [
    {
      content: `Copy ${selectedResources.length} Proxy`,
      onAction: handleCopyProxies,
      icon: ClipboardIcon,
    },
    {
      content: `Check Google`,
      onAction: handleBulkCheckGoogle,
      icon: SearchIcon,
    },
  ];

  const bulkActions = [
    {
      content: 'Xóa đã chọn',
      onAction: handleBulkDeleteClick,
      icon: DeleteIcon,
      destructive: true,
    },
  ];



  if (isLoading) {
    return (
      <Card>
        <Box padding="400">
          <SkeletonBodyText lines={5} />
        </Box>
      </Card>
    );
  }


  const rowMarkup = paginatedProxies.map(
    (proxy, index) => (
      <IndexTable.Row 
        id={proxy.id} 
        key={proxy.id} 
        position={index}
        selected={selectedResources.includes(proxy.id)}
      >
        <IndexTable.Cell>
          <Text as="span" fontWeight="bold">{proxy.port}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{proxy.username}</IndexTable.Cell>
        <IndexTable.Cell>{proxy.server?.name || '-'}</IndexTable.Cell>
        {!mdDown && (
          <IndexTable.Cell>
            <Text as="span" variant="bodyXs" color="subdued" breakWord>{proxy.ipv6 || '-'}</Text>
          </IndexTable.Cell>
        )}
        <IndexTable.Cell>
          <Badge tone={proxy.status === 'ACTIVE' ? 'success' : proxy.status === 'CREATING' ? 'attention' : 'critical'}>
            {proxy.status === 'ACTIVE' ? 'Hoạt động' : proxy.status === 'CREATING' ? 'Đang tạo' : 'Lỗi'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {proxy.expiresAt ? format(new Date(proxy.expiresAt), 'dd/MM/yyyy') : 'Vĩnh viễn'}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={{ minWidth: smDown ? '120px' : 'auto' }}>
            <InlineStack align="end" gap="200" wrap={false}>
              {smDown ? (
                <Button icon={SearchIcon} variant="tertiary" onClick={() => checkGoogleMutation.mutate(proxy.id, { onSuccess: (job) => setActiveJobId(job.id) })} loading={checkGoogleMutation.isPending && checkGoogleMutation.variables === proxy.id} disabled={proxy.status !== 'ACTIVE'} />
              ) : (
                <Tooltip content="Kiểm tra Google">
                  <Button icon={SearchIcon} variant="tertiary" onClick={() => checkGoogleMutation.mutate(proxy.id, { onSuccess: (job) => setActiveJobId(job.id) })} loading={checkGoogleMutation.isPending && checkGoogleMutation.variables === proxy.id} disabled={proxy.status !== 'ACTIVE'} />
                </Tooltip>
              )}
              
              {smDown ? (
                <Button icon={RefreshIcon} variant="tertiary" onClick={() => rotateProxyMutation.mutate(proxy.id, { onSuccess: (job) => setActiveJobId(job.id) })} loading={rotateProxyMutation.isPending && rotateProxyMutation.variables === proxy.id} disabled={proxy.status !== 'ACTIVE'} />
              ) : (
                <Tooltip content="Đổi IP (Rotate)">
                  <Button icon={RefreshIcon} variant="tertiary" onClick={() => rotateProxyMutation.mutate(proxy.id, { onSuccess: (job) => setActiveJobId(job.id) })} loading={rotateProxyMutation.isPending && rotateProxyMutation.variables === proxy.id} disabled={proxy.status !== 'ACTIVE'} />
                </Tooltip>
              )}

              {smDown ? (
                <Button icon={EditIcon} variant="tertiary" onClick={() => onEdit(proxy)} />
              ) : (
                <Tooltip content="Chỉnh sửa">
                  <Button icon={EditIcon} variant="tertiary" onClick={() => onEdit(proxy)} />
                </Tooltip>
              )}

              {canDelete && (
                smDown ? (
                  <Button icon={DeleteIcon} variant="tertiary" tone="critical" onClick={() => handleDeleteClick(proxy.id)} />
                ) : (
                  <Tooltip content="Xóa Proxy" tone="critical">
                    <Button icon={DeleteIcon} variant="tertiary" tone="critical" onClick={() => handleDeleteClick(proxy.id)} />
                  </Tooltip>
                )
              )}
            </InlineStack>
          </div>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  const headings = [
    { title: 'Port' },
    { title: 'Tài khoản' },
    { title: 'Máy chủ' },
    ...(mdDown ? [] : [{ title: 'IPv6 (Exit IP)' }]),
    { title: 'Trạng thái' },
    { title: 'Hết hạn' },
    { title: 'Thao tác', alignment: 'end' },
  ] as any;


  const appliedFilters: IndexFiltersProps['appliedFilters'] = [];
  if (status.length > 0) {
    appliedFilters.push({
      key: 'status',
      label: `Trạng thái: ${status.join(', ')}`,
      onRemove: () => setStatus([]),
    });
  }
  if (selectedServerId.length > 0) {
    const serverNames = servers
      .filter(s => selectedServerId.includes(s.id))
      .map(s => s.name)
      .join(', ');
    appliedFilters.push({
      key: 'serverId',
      label: `Máy chủ: ${serverNames}`,
      onRemove: () => setSelectedServerId([]),
    });
  }

  return (
    <Box paddingInline={{ xs: '400', sm: '0' }} paddingBlockEnd="400">
      <LegacyCard>
        <IndexFilters
          sortOptions={sortOptions}
          sortSelected={sortSelected}
          queryValue={queryValue}
          queryPlaceholder="Searching in all"
          onQueryChange={onHandleQueryValueChange}
          onQueryClear={() => setQueryValue('')}
          onSort={setSortSelected}
          primaryAction={{
            type: 'save-as',
            onAction: onCreateNewView,
            disabled: false,
            loading: false,
          }}
          cancelAction={{
            onAction: () => setQueryValue(''),
            disabled: false,
            loading: false,
          }}
          tabs={tabs}
          selected={selectedTab}
          onSelect={setSelectedTab}
          canCreateNewView
          onCreateNewView={onCreateNewView}
          filters={[
            {
              key: 'status',
              label: 'Trạng thái',
              filter: (
                <ChoiceList
                  title="Trạng thái"
                  choices={[
                    { label: 'Hoạt động', value: 'ACTIVE' },
                    { label: 'Đang tạo', value: 'CREATING' },
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
                  choices={servers.map(s => ({ label: s.name, value: s.id }))}
                  selected={selectedServerId}
                  onChange={onHandleServerChange}
                  allowMultiple
                />
              ),
              shortcut: true,
            },
          ]}
          appliedFilters={appliedFilters}
          onClearAll={onHandleFiltersClearAll}
          mode={mode}
          setMode={setMode}
        />
        <IndexTable
          resourceName={{
            singular: 'proxy',
            plural: 'proxies',
          }}
          itemCount={paginatedProxies.length}
          selectedItemsCount={selectedResources.length}
          headings={headings}
          onSelectionChange={handleSelectionChange}
          promotedBulkActions={promotedBulkActions}
          bulkActions={canDelete ? bulkActions : []}
          pagination={{
            hasNext: page < totalPages,
            hasPrevious: page > 1,
            onNext: () => setPage(page + 1),
            onPrevious: () => setPage(page - 1),
            label: "",
          }}
        >
          {rowMarkup}
        </IndexTable>
      </LegacyCard>

      <Modal
        open={activeDeleteModal}
        onClose={() => setActiveDeleteModal(false)}
        title={isBulkDelete ? "Xác nhận xóa hàng loạt?" : "Xác nhận xóa Proxy?"}
        primaryAction={{
          content: 'Xóa',
          onAction: confirmDelete,
          destructive: true,
          loading: deleteMutation.isPending || bulkDeleteMutation.isPending,
        }}
        secondaryActions={[{ content: 'Hủy bỏ', onAction: () => setActiveDeleteModal(false) }]}
      >
        <Modal.Section>
          <Text as="p">
            {isBulkDelete 
              ? `Bạn có chắc chắn muốn xóa ${selectedResources.length} Proxy đã chọn? Cấu hình sẽ bị gỡ bỏ khỏi máy chủ và không thể khôi phục.`
              : "Bạn có chắc chắn muốn xóa Proxy này? Cấu hình sẽ bị gỡ bỏ khỏi máy chủ và không thể khôi phục."}
          </Text>
        </Modal.Section>
      </Modal>

      <JobProgressModal 
        jobId={activeJobId}
        open={!!activeJobId}
        onClose={() => setActiveJobId(null)}
      />
    </Box>
  );
}
