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
  SkeletonBodyText,
  InlineStack,
  Modal,
  Filters,
  useSetIndexFiltersMode,
  IndexFilters,
  TabProps,
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, RefreshIcon, ClipboardIcon, SearchIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";
import { Proxy, Server } from '@prisma/client';
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface ProxyWithServer extends Proxy {
  server: Server;
}

interface ProxyListProps {
  onEdit: (proxy: Proxy) => void;
}

export function ProxyList({ onEdit }: ProxyListProps) {
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
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs: TabProps[] = useMemo(() => ['Tất cả', 'Hoạt động', 'Đang tạo', 'Lỗi'].map((item, index) => ({
    content: item,
    index,
    id: `${item}-${index}`,
    isLocked: index === 0,
  })), []);

  const onHandleStatusChange = useCallback((value: string[]) => setStatus(value), []);
  const onHandleServerChange = useCallback((value: string[]) => setSelectedServerId(value), []);
  const onHandleQueryValueChange = useCallback((value: string) => setQueryValue(value), []);
  const onHandleFiltersClearAll = useCallback(() => {
    setStatus([]);
    setSelectedServerId([]);
    setQueryValue('');
  }, []);

  const filteredProxies = useMemo(() => {
    return (proxies as ProxyWithServer[]).filter((proxy) => {
      if (selectedTab === 1 && proxy.status !== 'ACTIVE') return false;
      if (selectedTab === 2 && proxy.status !== 'CREATING') return false;
      if (selectedTab === 3 && proxy.status !== 'ERROR') return false;
      if (queryValue && !proxy.port.toString().includes(queryValue) && !proxy.username.toLowerCase().includes(queryValue.toLowerCase())) return false;
      if (status.length > 0 && !status.includes(proxy.status)) return false;
      if (selectedServerId.length > 0 && !selectedServerId.includes(proxy.serverId)) return false;
      return true;
    });
  }, [proxies, selectedTab, queryValue, status, selectedServerId]);

  // MANUAL SELECTION LOGIC
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  const handleSelectionChange = useCallback((selectionType: any, isSelected: boolean, selection?: string | any) => {
    if (selectionType === 'all' || selectionType === 'page') {
      setSelectedResources(isSelected ? filteredProxies.map(p => p.id) : []);
    } else if (selectionType === 'single') {
      const id = selection as string;
      setSelectedResources(prev => 
        isSelected ? [...prev, id] : prev.filter(item => item !== id)
      );
    } else if (selectionType === 'multi') {
      const [start, end] = selection as [number, number];
      const sliceIds = filteredProxies.slice(start, end + 1).map(p => p.id);
      setSelectedResources(prev => {
        const otherIds = prev.filter(id => !sliceIds.includes(id));
        return isSelected ? [...otherIds, ...sliceIds] : otherIds;
      });
    }
  }, [filteredProxies]);

  const allResourcesSelected = useMemo(() => {
    return filteredProxies.length > 0 && selectedResources.length === filteredProxies.length;
  }, [selectedResources, filteredProxies]);

  const clearSelection = useCallback(() => setSelectedResources([]), []);

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
    return selectedResources.length > 0 && selectedResources.length < filteredProxies.length;
  }, [filteredProxies, selectedResources]);

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



  if (isLoading) {
    return (
      <Card>
        <Box padding="400">
          <SkeletonBodyText lines={5} />
        </Box>
      </Card>
    );
  }

  const rowMarkup = filteredProxies.map(
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
        <IndexTable.Cell>
          <Text as="span" variant="bodyXs" color="subdued" breakWord>{proxy.ipv6 || '-'}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={proxy.status === 'ACTIVE' ? 'success' : proxy.status === 'CREATING' ? 'attention' : 'critical'}>
            {proxy.status === 'ACTIVE' ? 'Hoạt động' : proxy.status === 'CREATING' ? 'Đang khởi tạo' : 'Lỗi'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {proxy.expiresAt ? format(new Date(proxy.expiresAt), 'dd/MM/yyyy') : 'Vĩnh viễn'}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="end" gap="200">
            <Button icon={SearchIcon} variant="tertiary" onClick={() => checkGoogleMutation.mutate(proxy.id)} loading={checkGoogleMutation.isPending && checkGoogleMutation.variables === proxy.id} disabled={proxy.status !== 'ACTIVE'} />
            <Button icon={RefreshIcon} variant="tertiary" onClick={() => rotateProxyMutation.mutate(proxy.id)} loading={rotateProxyMutation.isPending && rotateProxyMutation.variables === proxy.id} disabled={proxy.status !== 'ACTIVE'} />
            <Button icon={EditIcon} variant="tertiary" onClick={() => onEdit(proxy)} />
            {canDelete && <Button icon={DeleteIcon} variant="tertiary" tone="critical" onClick={() => handleDeleteClick(proxy.id)} />}
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Box paddingBlockEnd="400">
      <Box paddingBlockEnd="400">
        <InlineStack align="space-between">
          <InlineStack gap="200">
            {selectedResources.length > 0 && (
              <>
                <Button 
                  icon={ClipboardIcon} 
                  variant="primary" 
                  tone="success"
                  onClick={handleCopyProxies}
                >
                  Copy {selectedResources.length} Proxy
                </Button>
                <Button 
                  icon={SearchIcon} 
                  onClick={handleBulkCheckGoogle}
                >
                  Check Google {selectedResources.length} Proxy
                </Button>
                {canDelete && (
                  <Button 
                    icon={DeleteIcon} 
                    tone="critical"
                    onClick={handleBulkDeleteClick}
                  >
                    Xóa {selectedResources.length} Proxy
                  </Button>
                )}
              </>
            )}
          </InlineStack>
        </InlineStack>
      </Box>

      <Card padding="0">
        <IndexFilters
          sortOptions={[]}
          sortSelected={['']}
          queryValue={queryValue}
          queryPlaceholder="Tìm kiếm theo Port hoặc Username"
          onQueryChange={onHandleQueryValueChange}
          onQueryClear={() => setQueryValue('')}
          tabs={tabs}
          selected={selectedTab}
          onSelect={setSelectedTab}
          filters={[
            {
              key: 'status',
              label: 'Trạng thái',
              filter: (
                <Filters.ChoiceList
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
                <Filters.ChoiceList
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
          appliedFilters={[]}
          onClearAll={onHandleFiltersClearAll}
          mode={mode}
          setMode={setMode}
        />
        <IndexTable
          resourceName={{ singular: 'proxy', plural: 'proxies' }}
          itemCount={filteredProxies.length}
          headings={[
            { title: 'Port' },
            { title: 'Tài khoản' },
            { title: 'Máy chủ' },
            { title: 'IPv6 (Exit IP)' },
            { title: 'Trạng thái' },
            { title: 'Hết hạn' },
            { title: 'Thao tác', alignment: 'end' },
          ]}
          selectedResources={selectedResources}
          allResourcesSelected={indeterminate ? 'indeterminate' : allResourcesSelected}
          onSelectionChange={handleSelectionChange}
        >
          {rowMarkup}
        </IndexTable>
      </Card>

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
    </Box>
  );
}
