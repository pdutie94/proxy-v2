'use client';

import { Card, IndexTable, Badge, Text, Button, InlineStack, Tooltip, EmptyState } from '@shopify/polaris';
import { DuplicateIcon, DeleteIcon, ViewIcon, RefreshIcon } from '@shopify/polaris-icons';
import { format, differenceInHours } from 'date-fns';
import { toast } from 'sonner';

interface UserProxyIndexTableProps {
  proxies: any[];
}

export function UserProxyIndexTable({ proxies }: UserProxyIndexTableProps) {
  const resourceName = {
    singular: 'proxy',
    plural: 'proxies',
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const getRemainingTime = (date: Date) => {
    const hours = differenceInHours(new Date(date), new Date());
    if (hours < 0) return 'Hết hạn';
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days} ngày ${remHours} giờ`;
  };

  const rowMarkup = proxies.map(
    ({ id, server, port, username, password, ipType, expiresAt, ipv6 }, index) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <InlineStack gap="200" align="center">
             <span className="text-xl">🇻🇳</span>
             <Badge tone={ipType === 'IPv6' ? 'critical' : 'info'}>{ipType}</Badge>
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div className="font-mono text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded">
            {server.host}:{port}
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodySm" as="span" fontWeight="medium">{username}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodySm" as="span" fontWeight="medium">{password}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
           <div className="space-y-1">
              <Text variant="bodyXs" as="p" tone="subdued">
                {expiresAt ? format(new Date(expiresAt), 'dd/MM/yy HH:mm') : 'N/A'}
              </Text>
              <Badge tone={differenceInHours(new Date(expiresAt), new Date()) < 48 ? 'attention' : 'success'}>
                {expiresAt ? getRemainingTime(new Date(expiresAt)) : 'N/A'}
              </Badge>
           </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="100">
            <Tooltip content="Sao chép tất cả">
               <Button 
                icon={DuplicateIcon} 
                onClick={() => copyToClipboard(`${server.host}:${port}:${username}:${password}`)} 
                size="slim"
               />
            </Tooltip>
            <Tooltip content="Xoay IP (Nếu hỗ trợ)">
               <Button icon={RefreshIcon} size="slim" />
            </Tooltip>
            <Tooltip content="Xóa">
               <Button icon={DeleteIcon} tone="critical" size="slim" />
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
      <IndexTable
        resourceName={resourceName}
        itemCount={proxies.length}
        emptyState={emptyStateMarkup}
        headings={[
          { title: 'Quốc gia/Loại' },
          { title: 'IP:PORT' },
          { title: 'Tài khoản' },
          { title: 'Mật khẩu' },
          { title: 'Hết hạn' },
          { title: 'Thao tác' },
        ]}
        selectable={false}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );
}
