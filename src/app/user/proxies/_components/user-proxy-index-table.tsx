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
  EmptyState,
  TextField,
  Modal,
  TextContainer,
} from "@shopify/polaris";
import { DuplicateIcon, RefreshIcon, SearchIcon, NoteIcon, ExportIcon, CheckIcon, DeleteIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/utils/clipboard';
import { getCountdown } from '@/utils/date';
import { ProxyWithServer } from '@/types';
import { useProxies } from '@/hooks/use-proxies';
import { useLocations } from '@/modules/locations/hooks/use-locations';

interface UserProxyIndexTableProps {
  proxies: ProxyWithServer[];
}

export function UserProxyIndexTable({ proxies: initialProxies }: UserProxyIndexTableProps) {
  const { 
    rotateProxyMutation, 
    checkGoogleMutation,
    bulkUpdateAutoRenewMutation,
    deleteMutation,
    bulkDeleteMutation,
    proxies: displayProxies
  } = useProxies(initialProxies);

  const { data: locationsData } = useLocations();
  const locations = locationsData ?? [];

  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  // Filters State
  const { mode, setMode } = useSetIndexFiltersMode();
  const [queryValue, setQueryValue] = useState('');

  // Filter values
  const [filterUsername, setFilterUsername] = useState('');
  const [filterPassword, setFilterPassword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterLocationId, setFilterLocationId] = useState<string[]>([]);

  // Delete Modal State
  const [deleteConfirmState, setDeleteConfirmState] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmState.id) {
      deleteMutation.mutate(deleteConfirmState.id, {
        onSuccess: () => setDeleteConfirmState({ isOpen: false, id: null })
      });
    } else {
      bulkDeleteMutation.mutate(selectedResources, {
        onSuccess: () => {
          setSelectedResources([]);
          setDeleteConfirmState({ isOpen: false, id: null });
        }
      });
    }
  }, [deleteConfirmState.id, selectedResources, deleteMutation, bulkDeleteMutation]);

  // Tabs: Tất cả / Còn hạn / Hết hạn
  const [itemStrings] = useState(['Tất cả', 'Còn hạn', 'Hết hạn']);
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const tabs: TabProps[] = useMemo(() => itemStrings.map((item, index) => ({
    content: item,
    index,
    id: `user-proxy-tab-${index}`,
    isLocked: true,
  })), [itemStrings]);

  const resetPage = useCallback(() => {
    setPage(1);
    setSelectedResources([]);
  }, []);

  const onHandleFiltersClearAll = useCallback(() => {
    setFilterUsername('');
    setFilterPassword('');
    setFilterStatus([]);
    setFilterLocationId([]);
    setQueryValue('');
    setPage(1);
  }, []);

  // Sort: chỉ Cũ nhất / Mới nhất
  const [sortSelected, setSortSelected] = useState(['id desc']);
  const sortOptions: IndexFiltersProps['sortOptions'] = [
    { label: 'Ngày tạo', value: 'id asc', directionLabel: 'Cũ nhất' },
    { label: 'Ngày tạo', value: 'id desc', directionLabel: 'Mới nhất' },
  ];

  const filteredProxies = useMemo(() => {
    const now = new Date();
    const result = (displayProxies as ProxyWithServer[]).filter((proxy) => {
      // Tab filter
      const tabName = itemStrings[selectedTab];
      if (tabName === 'Còn hạn') {
        if (!proxy.expiresAt || new Date(proxy.expiresAt) <= now) return false;
      }
      if (tabName === 'Hết hạn') {
        if (!proxy.expiresAt || new Date(proxy.expiresAt) > now) return false;
      }

      // Search bar: port hoặc username
      if (queryValue) {
        const q = queryValue.toLowerCase();
        if (
          !proxy.port.toString().includes(queryValue) &&
          !proxy.username.toLowerCase().includes(q)
        ) return false;
      }

      // Filter: tài khoản
      if (filterUsername && !proxy.username.toLowerCase().includes(filterUsername.toLowerCase())) {
        return false;
      }

      // Filter: mật khẩu
      if (filterPassword && !proxy.password.toLowerCase().includes(filterPassword.toLowerCase())) {
        return false;
      }

      // Filter: trạng thái
      if (filterStatus.length > 0 && !filterStatus.includes(proxy.status)) {
        return false;
      }

      // Filter: vị trí (location)
      if (filterLocationId.length > 0) {
        const serverLocationId = proxy.server?.locationId ?? null;
        if (!serverLocationId || !filterLocationId.includes(serverLocationId)) return false;
      }

      return true;
    });

    // Sort
    if (sortSelected.length > 0) {
      const [, direction] = sortSelected[0].split(' ');
      result.sort((a, b) => {
        const valA = new Date(a.createdAt).getTime();
        const valB = new Date(b.createdAt).getTime();
        return direction === 'asc' ? valA - valB : valB - valA;
      });
    }

    return result;
  }, [displayProxies, selectedTab, queryValue, filterUsername, filterPassword, filterStatus, filterLocationId, sortSelected, itemStrings]);

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
  }, [paginatedProxies]);

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
    {
      content: 'Xóa proxy',
      destructive: true,
      onAction: () => setDeleteConfirmState({ isOpen: true, id: null }),
    },
  ];

  // Applied filters (tags shown below search bar)
  const appliedFilters: IndexFiltersProps['appliedFilters'] = [];
  if (filterUsername) {
    appliedFilters.push({
      key: 'username',
      label: `Tài khoản: ${filterUsername}`,
      onRemove: () => { setFilterUsername(''); resetPage(); },
    });
  }
  if (filterPassword) {
    appliedFilters.push({
      key: 'password',
      label: `Mật khẩu: ${filterPassword}`,
      onRemove: () => { setFilterPassword(''); resetPage(); },
    });
  }
  if (filterStatus.length > 0) {
    const labels: Record<string, string> = { ACTIVE: 'Hoạt động', CREATING: 'Đang tạo', ERROR: 'Lỗi', EXPIRED: 'Hết hạn' };
    appliedFilters.push({
      key: 'status',
      label: `Trạng thái: ${filterStatus.map(s => labels[s] ?? s).join(', ')}`,
      onRemove: () => { setFilterStatus([]); resetPage(); },
    });
  }
  if (filterLocationId.length > 0) {
    const names = locations
      .filter(l => filterLocationId.includes(l.id))
      .map(l => l.name)
      .join(', ');
    appliedFilters.push({
      key: 'locationId',
      label: `Vị trí: ${names}`,
      onRemove: () => { setFilterLocationId([]); resetPage(); },
    });
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
            
            <Tooltip content="Xóa Proxy">
              <Button icon={DeleteIcon} variant="tertiary" tone="critical" onClick={() => setDeleteConfirmState({ isOpen: true, id: proxy.id })} loading={deleteMutation.isPending && deleteMutation.variables === proxy.id} />
            </Tooltip>
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

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
        onQueryChange={(value) => { setQueryValue(value); resetPage(); }}
        onQueryClear={() => { setQueryValue(''); resetPage(); }}
        onSort={setSortSelected}
        tabs={tabs}
        selected={selectedTab}
        onSelect={(index) => { setSelectedTab(index); resetPage(); }}
        filters={[
          {
            key: 'username',
            label: 'Tài khoản',
            filter: (
              <TextField
                label="Tài khoản"
                labelHidden
                value={filterUsername}
                onChange={(value) => { setFilterUsername(value); resetPage(); }}
                placeholder="Nhập tài khoản..."
                autoComplete="off"
                clearButton
                onClearButtonClick={() => { setFilterUsername(''); resetPage(); }}
              />
            ),
            shortcut: true,
          },
          {
            key: 'password',
            label: 'Mật khẩu',
            filter: (
              <TextField
                label="Mật khẩu"
                labelHidden
                value={filterPassword}
                onChange={(value) => { setFilterPassword(value); resetPage(); }}
                placeholder="Nhập mật khẩu..."
                autoComplete="off"
                clearButton
                onClearButtonClick={() => { setFilterPassword(''); resetPage(); }}
              />
            ),
            shortcut: false,
          },
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
                selected={filterStatus}
                onChange={(value) => { setFilterStatus(value); resetPage(); }}
                allowMultiple
              />
            ),
            shortcut: true,
          },
          {
            key: 'locationId',
            label: 'Vị trí',
            filter: (
              <ChoiceList
                title="Vị trí"
                choices={locations.map(l => ({ label: l.name, value: l.id }))}
                selected={filterLocationId}
                onChange={(value) => { setFilterLocationId(value); resetPage(); }}
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

      <Modal
        open={deleteConfirmState.isOpen}
        onClose={() => setDeleteConfirmState({ isOpen: false, id: null })}
        title="Xác nhận xóa Proxy"
        primaryAction={{
          content: 'Xóa ngay',
          destructive: true,
          onAction: handleDeleteConfirm,
          loading: deleteConfirmState.id ? deleteMutation.isPending : bulkDeleteMutation.isPending
        }}
        secondaryActions={[
          {
            content: 'Hủy',
            onAction: () => setDeleteConfirmState({ isOpen: false, id: null }),
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>
              Bạn có chắc chắn muốn xóa {deleteConfirmState.id ? 'proxy này' : `${selectedResources.length} proxy đã chọn`}? Thao tác này không thể hoàn tác và cấu hình proxy trên máy chủ sẽ bị xóa vĩnh viễn.
            </p>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </Card>
  );
}
