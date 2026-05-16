"use client";

import { useProxies } from '@/hooks/use-proxies';
import { useServers } from '@/hooks/use-servers';
import { 
  IndexTable, 
  Card,
  Badge,
  Text,
  Button,
  EmptyState,
  Box,
  SkeletonBodyText,
  InlineStack,
  Modal,
  useSetIndexFiltersMode,
  IndexFilters,
  TabProps,
  useBreakpoints,
  ChoiceList,
  Tooltip,
  IndexFiltersProps,
  BlockStack,
  Icon
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, RefreshIcon, ClipboardIcon, SearchIcon, NoteIcon, ExportIcon, CalendarIcon, CheckIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";
import { Proxy } from '@prisma/client';
import React, { useState, useCallback, useMemo } from 'react';
import { JobProgressModal } from '@/components/jobs/job-progress-modal';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { copyToClipboard } from '@/utils/clipboard';
import { getCountdown } from '@/utils/date';

import { ProxyWithServer, AuthUser } from '@/types';

interface ProxyListProps {
  onEdit: (proxy: any) => void;
  onAdd?: () => void;
}

export function ProxyList({ onEdit, onAdd }: ProxyListProps) {
  const { smDown } = useBreakpoints();
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
  const { data: session } = useSession();
  const userRole = (session?.user as AuthUser | undefined)?.role || "USER";
  const canDelete = userRole === "ADMIN";

  const { servers } = useServers();
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let valA: any = a[key as keyof ProxyWithServer];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    setProxyToDelete(null);
    setActiveDeleteModal(true);
  };

  const confirmDelete = () => {
    if (isBulkDelete) {
      bulkDeleteMutation.mutate(selectedResources, {
        onSuccess: () => {
          setSelectedResources([]);
          setActiveDeleteModal(false);
        }
      });
    } else if (proxyToDelete) {
      deleteMutation.mutate(proxyToDelete, {
        onSuccess: () => setActiveDeleteModal(false)
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
  const [renewalDuration, setRenewalDuration] = useState('1m');

  const handleBulkRenew = () => {
    bulkRenewMutation.mutate({ ids: selectedResources, duration: renewalDuration }, {
      onSuccess: () => {
        setActiveRenewModal(false);
        setSelectedResources([]);
      }
    });
  };

  const handleBulkToggleAutoRenew = (status: boolean) => {
    bulkUpdateAutoRenewMutation.mutate({ ids: selectedResources, autoRenew: status }, {
      onSuccess: () => {
        setSelectedResources([]);
      }
    });
  };


  const promotedBulkActions = [
    {
      content: `Copy ${selectedResources.length} Proxy`,
      onAction: handleCopyProxies,
      icon: ClipboardIcon,
    },
    {
      content: `Xuất file TXT`,
      onAction: handleExportProxies,
      icon: ExportIcon,
    },
    {
      content: `Gia hạn`,
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
              <Text as="span" variant="bodyMd" fontWeight="bold">
                <span style={{ fontFamily: 'monospace' }}>{proxy.server?.host}:{proxy.port}</span>
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <Text as="span" variant="bodyMd" tone="subdued">Tài khoản</Text>
              <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
              <Text as="span" variant="bodyMd" fontWeight="medium">
                <span style={{ fontFamily: 'monospace' }}>{proxy.username}</span>
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <Text as="span" variant="bodyMd" tone="subdued">Mật khẩu</Text>
              <div style={{ flexGrow: 1, borderBottom: '1px dotted #E2E8F0' }}></div>
              <Text as="span" variant="bodyMd" fontWeight="medium">
                <span style={{ fontFamily: 'monospace' }}>{proxy.password}</span>
              </Text>
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
                <Text as="span" variant="bodyMd">
                  <span style={{ fontFamily: 'monospace' }}>{proxy.ipv6}</span>
                </Text>
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
        {userRole === 'ADMIN' && (
          <IndexTable.Cell>
            <div style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Text as="span" variant="bodyMd">
                {proxy.user?.email || 'Hệ thống'}
              </Text>
            </div>
          </IndexTable.Cell>
        )}
        <IndexTable.Cell>
          <div style={{ minWidth: smDown ? '120px' : 'auto' }}>
            <InlineStack align="end" gap="200" wrap={false}>
              {smDown ? (
                <Button icon={ClipboardIcon} variant="tertiary" onClick={() => {
                  const host = proxy.server?.host || '0.0.0.0';
                  const text = `${host}:${proxy.port}:${proxy.username}:${proxy.password}`;
                  copyToClipboard(text).then(success => {
                    if (success) toast.success('Đã copy proxy');
                    else toast.error('Lỗi khi copy');
                  });
                }} />
              ) : (
                <Tooltip content="Sao chép Proxy (host:port:user:pass)">
                  <Button icon={ClipboardIcon} variant="tertiary" onClick={() => {
                    const host = proxy.server?.host || '0.0.0.0';
                    const text = `${host}:${proxy.port}:${proxy.username}:${proxy.password}`;
                    copyToClipboard(text).then(success => {
                      if (success) toast.success('Đã copy proxy');
                      else toast.error('Lỗi khi copy');
                    });
                  }} />
                </Tooltip>
              )}

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
                  <Tooltip content="Xóa Proxy">
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headings: any = [
    { title: 'Máy chủ' },
    { title: 'Thông tin Proxy', width: '200px' },
    { title: 'Hết hạn', width: '160px' },
    { title: 'Trạng thái' },
    { title: 'Ghi chú' },
    ...(userRole === 'ADMIN' ? [{ title: 'Người dùng' }] : []),
    { title: 'Thao tác', alignment: 'end' },
  ];


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
      <Card padding="0">
        <IndexFilters
          sortOptions={sortOptions}
          sortSelected={sortSelected}
          queryValue={queryValue}
          queryPlaceholder="Tìm kiếm trong tất cả..."
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
            plural: 'proxy',
          }}
          itemCount={paginatedProxies.length}
          emptyState={(
            <EmptyState
              heading="Không tìm thấy proxy nào"
              action={onAdd ? {
                content: 'Tạo proxy mới',
                onAction: onAdd,
              } : undefined}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Hãy thử thay đổi bộ lọc hoặc tạo proxy mới để bắt đầu.</p>
            </EmptyState>
          )}
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
            label: `Trang ${page} / ${totalPages || 1}`,
          }}
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

      <Modal
        open={activeRenewModal}
        onClose={() => setActiveRenewModal(false)}
        title="Gia hạn Proxy"
        primaryAction={{
          content: 'Xác nhận gia hạn',
          onAction: handleBulkRenew,
          loading: bulkRenewMutation.isPending,
        }}
        secondaryActions={[{ content: 'Hủy bỏ', onAction: () => setActiveRenewModal(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p">Chọn thời gian gia hạn cho {selectedResources.length} proxy đã chọn:</Text>
            <ChoiceList
              title="Thời gian gia hạn"
              choices={[
                { label: '1 ngày', value: '1d' },
                { label: '3 ngày', value: '3d' },
                { label: '1 tuần', value: '1w' },
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

      <JobProgressModal 
        jobId={activeJobId}
        open={!!activeJobId}
        onClose={() => setActiveJobId(null)}
      />
    </Box>
  );
}
