'use client';

import { 
  IndexTable, 
  Card,
  Badge,
  Text,
  Button,
  InlineStack,
  useSetIndexFiltersMode,
  IndexFilters,
  TabProps,
  ChoiceList,
  Tooltip,
  IndexFiltersProps,
  BlockStack,
  Icon,
  EmptyState
} from "@shopify/polaris";
import { DuplicateIcon, RefreshIcon, SearchIcon, NoteIcon, ExportIcon, CheckIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/utils/clipboard';
import { getCountdown } from '@/utils/date';
import { ProxyWithServer } from '@/types';
import { useProxies } from '@/hooks/use-proxies';
import { useServers } from '@/hooks/use-servers';

interface UserProxyIndexTableProps {
  proxies: ProxyWithServer[];
}

export function UserProxyIndexTable({ proxies: initialProxies }: UserProxyIndexTableProps) {
  const { 
    rotateProxyMutation, 
    checkGoogleMutation,
    bulkUpdateAutoRenewMutation,
    proxies: liveProxies
  } = useProxies();
  
  // Use live data if available, fallback to initial data from server
  const displayProxies = liveProxies.length > 0 ? liveProxies : initialProxies;

  const { servers } = useServers();
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  // Filters State
  const { mode, setMode } = useSetIndexFiltersMode();
  const [queryValue, setQueryValue] = useState('');
  const [status, setStatus] = useState<string[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string[]>([]);
  const [itemStrings] = useState(['Tất cả', 'Hoạt động', 'Đang tạo', 'Lỗi']);
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const tabs: TabProps[] = useMemo(() => itemStrings.map((item, index) => ({
    content: item,
    index,
    id: `${item}-${index}`,
    isLocked: index <= 3,
  })), [itemStrings]);

  const onHandleStatusChange = useCallback((value: string[]) => {
    setStatus(value);
    setPage(1);
    setSelectedResources([]);
  }, []);
  const onHandleServerChange = useCallback((value: string[]) => {
    setSelectedServerId(value);
    setPage(1);
    setSelectedResources([]);
  }, []);
  const onHandleQueryValueChange = useCallback((value: string) => {
    setQueryValue(value);
    setPage(1);
    setSelectedResources([]);
  }, []);
  const onHandleFiltersClearAll = useCallback(() => {
    setStatus([]);
    setSelectedServerId([]);
    setQueryValue('');
    setPage(1);
  }, []);

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
    const result = (displayProxies as ProxyWithServer[]).filter((proxy) => {
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

    if (sortSelected.length > 0) {
      const [key, direction] = sortSelected[0].split(' ');
      result.sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let valA: any = a[key as keyof ProxyWithServer];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let valB: any = b[key as keyof ProxyWithServer];

        if (key === 'port') {
          valA = parseInt(a.port.toString());
          valB = parseInt(b.port.toString());
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [displayProxies, selectedTab, queryValue, status, selectedServerId, sortSelected, itemStrings]);

  const totalPages = Math.ceil(filteredProxies.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedProxies = filteredProxies.slice(startIndex, startIndex + itemsPerPage);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectionChange = useCallback((selectionType: any, isSelected: boolean, selection?: string | any) => {
    if (selectionType === 'all' || selectionType === 'page') {
      setSelectedResources(isSelected ? paginatedProxies.map(p => p.id) : []);
    } else if (selectionType === 'single') {
      const id = selection as string;
      setSelectedResources(prev => 
        isSelected ? [...prev, id] : prev.filter(item => item !== id)
      );
    }
  }, [paginatedProxies, setSelectedResources]);

  const handleCopyProxies = useCallback(() => {
    const selectedProxies = filteredProxies.filter(p => selectedResources.includes(p.id));
    if (selectedProxies.length === 0) return;
    
    const text = selectedProxies.map(p => {
      const host = p.server?.host || '0.0.0.0';
      return `${host}:${p.port}:${p.username}:${p.password}`;
    }).join('\n');

    copyToClipboard(text).then(success => {
      if (success) toast.success(`Đã copy ${selectedProxies.length} proxy`);
    });
    setSelectedResources([]);
  }, [selectedResources, filteredProxies]);

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
    a.download = `my_proxies_${format(new Date(), 'yyyyMMdd_HHmmss')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Đã xuất ${selectedProxies.length} proxy`);
    setSelectedResources([]);
  }, [selectedResources, filteredProxies]);

  const promotedBulkActions = [
    {
      content: `Copy ${selectedResources.length} Proxy`,
      onAction: handleCopyProxies,
      icon: DuplicateIcon,
    },
    {
      content: `Xuất file TXT`,
      onAction: handleExportProxies,
      icon: ExportIcon,
    }
  ];

  const bulkActions = [
    {
      content: 'Bật tự động gia hạn',
      onAction: () => bulkUpdateAutoRenewMutation.mutate({ ids: selectedResources, autoRenew: true }, { onSuccess: () => setSelectedResources([]) }),
    },
    {
      content: 'Tắt tự động gia hạn',
      onAction: () => bulkUpdateAutoRenewMutation.mutate({ ids: selectedResources, autoRenew: false }, { onSuccess: () => setSelectedResources([]) }),
    },
  ];

  const rowMarkup = paginatedProxies.map(
    (proxy, index) => (
      <IndexTable.Row 
        id={proxy.id} 
        key={proxy.id} 
        position={index}
        selected={selectedResources.includes(proxy.id)}
      >
      <IndexTable.Cell>
        <BlockStack gap="100">
          <Text as="span" variant="bodyMd" fontWeight="bold">
            {proxy.server?.name || proxy.server?.host || 'Không xác định'}
          </Text>
          <InlineStack gap="100">
            <Badge tone="info">{proxy.ipType}</Badge>
          </InlineStack>
        </BlockStack>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <div style={{ minWidth: '240px' }}>
          <BlockStack gap="050">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <Text as="span" variant="bodyMd" tone="subdued">IP:PORT</Text>
              <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
              <Text as="span" variant="bodyMd" fontWeight="bold">{proxy.server?.host}:{proxy.port}</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <Text as="span" variant="bodyMd" tone="subdued">Tài khoản</Text>
              <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
              <Text as="span" variant="bodyMd" fontWeight="medium">{proxy.username}</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <Text as="span" variant="bodyMd" tone="subdued">Mật khẩu</Text>
              <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
              <Text as="span" variant="bodyMd" fontWeight="medium">{proxy.password}</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <Text as="span" variant="bodyMd" tone="subdued">Loại</Text>
              <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
              <Badge size="small">HTTPS / SOCKS5</Badge>
            </div>
            {proxy.ipv6 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                <Text as="span" variant="bodyMd" tone="subdued">IPv6</Text>
                <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
                <Text as="span" variant="bodyMd">{proxy.ipv6}</Text>
              </div>
            )}
          </BlockStack>
        </div>
      </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={{ minWidth: '160px' }}>
            <BlockStack gap="050">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                <Text as="span" variant="bodyMd" tone="subdued">Hết hạn</Text>
                <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
                <Text as="span" variant="bodyMd" tone={proxy.autoRenew ? "success" : "caution"} fontWeight="medium">
                  {proxy.expiresAt ? format(new Date(proxy.expiresAt), 'dd/MM/yyyy HH:mm') : 'Vĩnh viễn'}
                </Text>
              </div>
              {proxy.expiresAt && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                    <Text as="span" variant="bodyMd" tone="subdued">Còn lại</Text>
                    <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
                    <Text as="span" variant="bodyMd" fontWeight="medium" tone={proxy.autoRenew ? "success" : "caution"}>
                      {getCountdown(proxy.expiresAt)}
                    </Text>
                  </div>
                  {proxy.autoRenew && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                      <Text as="span" variant="bodyMd" tone="subdued">Tự động gia hạn</Text>
                      <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
                      <div style={{ color: '#008060', display: 'flex' }}>
                        <Icon source={CheckIcon} tone="success" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </BlockStack>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={proxy.status === 'ACTIVE' ? 'success' : proxy.status === 'CREATING' ? 'attention' : 'critical'}>
            {proxy.status === 'ACTIVE' ? 'Hoạt động' : proxy.status === 'CREATING' ? 'Đang tạo' : 'Lỗi'}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {proxy.comment ? (
            <Tooltip content={proxy.comment}>
              <Icon source={NoteIcon} tone="base" />
            </Tooltip>
          ) : '-'}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="end" gap="200" wrap={false}>
            <Tooltip content="Sao chép">
              <Button icon={DuplicateIcon} variant="tertiary" onClick={() => {
                const text = `${proxy.server?.host}:${proxy.port}:${proxy.username}:${proxy.password}`;
                copyToClipboard(text).then(success => {
                  if (success) toast.success('Đã copy proxy');
                });
              }} />
            </Tooltip>
            
            <Tooltip content="Kiểm tra Google">
              <Button icon={SearchIcon} variant="tertiary" onClick={() => checkGoogleMutation.mutate(proxy.id)} loading={checkGoogleMutation.isPending && checkGoogleMutation.variables === proxy.id} disabled={proxy.status !== 'ACTIVE'} />
            </Tooltip>
            
            <Tooltip content="Đổi IP (Rotate)">
              <Button icon={RefreshIcon} variant="tertiary" onClick={() => rotateProxyMutation.mutate(proxy.id)} loading={rotateProxyMutation.isPending && rotateProxyMutation.variables === proxy.id} disabled={proxy.status !== 'ACTIVE' || proxy.ipType !== 'IPv6'} />
            </Tooltip>
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

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

  const emptyStateMarkup = (
    <EmptyState
      heading="Không tìm thấy proxy nào"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Hãy thử thay đổi bộ lọc hoặc mua proxy mới để bắt đầu.</p>
    </EmptyState>
  );

  return (
    <Card padding="0">
      <IndexFilters
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        queryValue={queryValue}
        queryPlaceholder="Tìm kiếm proxy..."
        onQueryChange={onHandleQueryValueChange}
        onQueryClear={() => setQueryValue('')}
        onSort={setSortSelected}
        tabs={tabs}
        selected={selectedTab}
        onSelect={setSelectedTab}
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
          plural: 'proxy',
        }}
        itemCount={filteredProxies.length}
        selectedItemsCount={selectedResources.length}
        headings={[
          { title: 'Máy chủ' },
          { title: 'Thông tin Proxy' },
          { title: 'Hết hạn' },
          { title: 'Trạng thái' },
          { title: 'Ghi chú' },
          { title: 'Thao tác', alignment: 'end' },
        ]}
        onSelectionChange={handleSelectionChange}
        promotedBulkActions={promotedBulkActions}
        bulkActions={bulkActions}
        emptyState={emptyStateMarkup}
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
    </Card>
  );
}
