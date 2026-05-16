'use client';

import { 
  IndexTable, 
  Card, 
  Text, 
  Badge, 
  InlineStack, 
  Tooltip, 
  Button, 
  BlockStack,
  EmptyState
} from '@shopify/polaris';
import { 
  ClipboardIcon, 
  NoteIcon, 
  ViewIcon
} from '@shopify/polaris-icons';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ProxyWithServer } from '@/types';
import { copyToClipboard } from '@/utils/clipboard';
import { getCountdown } from '@/utils/date';
import Image from 'next/image';

interface UserProxyTableProps {
  proxies: ProxyWithServer[];
}

export function UserProxyTable({ proxies }: UserProxyTableProps) {

  const handleCopy = (proxy: ProxyWithServer) => {
    const text = `${proxy.server.host}:${proxy.port}:${proxy.username}:${proxy.password}`;
    copyToClipboard(text).then(success => {
      if (success) toast.success('Đã sao chép Proxy!');
      else toast.error('Lỗi khi sao chép');
    });
  };

  const resourceName = {
    singular: 'proxy',
    plural: 'proxy',
  };

  const rowMarkup = proxies.map((proxy, index) => (
    <IndexTable.Row id={proxy.id} key={proxy.id} position={index}>
      <IndexTable.Cell>
        <InlineStack gap="200" align="start" wrap={false}>
          {proxy.server.location?.countryCode && (
            <div style={{ marginTop: '4px' }}>
              <Image 
                src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${proxy.server.location.countryCode.toUpperCase()}.svg`} 
                width={20} 
                height={14}
                alt={proxy.server.location.countryCode}
                style={{ borderRadius: '2px', border: '1px solid #E2E8F0' }}
              />
            </div>
          )}
          <BlockStack gap="050">
            <Text as="span" variant="bodyMd" fontWeight="bold">
              {proxy.server.location?.name || 'Việt Nam'}
            </Text>
            <Badge size="small" tone="info">{proxy.ipType}</Badge>
          </BlockStack>
        </InlineStack>
      </IndexTable.Cell>
      
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd">
          <span style={{ fontFamily: 'monospace' }}>{proxy.server.host}:{proxy.port}</span>
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <BlockStack gap="050">
          <Text as="span" variant="bodySm" tone="subdued">
            <span style={{ fontFamily: 'monospace' }}>User: {proxy.username}</span>
          </Text>
          <Text as="span" variant="bodySm" tone="subdued">
            <span style={{ fontFamily: 'monospace' }}>Pass: {proxy.password}</span>
          </Text>
        </BlockStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <BlockStack gap="050">
          <Text as="span" variant="bodySm">
            {proxy.expiresAt ? format(new Date(proxy.expiresAt), 'dd/MM/yy HH:mm') : 'Vĩnh viễn'}
          </Text>
          {proxy.expiresAt && (
            <Text as="span" variant="bodyXs" tone="caution">
              Còn {getCountdown(proxy.expiresAt)}
            </Text>
          )}
        </BlockStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Badge tone={proxy.status === 'ACTIVE' ? 'success' : 'attention'}>
          {proxy.status === 'ACTIVE' ? 'Hoạt động' : 'Đang xử lý'}
        </Badge>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <InlineStack align="end" gap="100">
          <Tooltip content="Sao chép">
            <Button icon={ClipboardIcon} variant="tertiary" onClick={() => handleCopy(proxy)} />
          </Tooltip>
          {proxy.comment && (
            <Tooltip content={proxy.comment}>
              <Button icon={NoteIcon} variant="tertiary" />
            </Tooltip>
          )}
          <Button icon={ViewIcon} variant="tertiary" url={`/user/proxies/${proxy.id}`} />
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Card padding="0">
      <IndexTable
        resourceName={resourceName}
        itemCount={proxies.length}
        emptyState={(
          <EmptyState
            heading="Bạn chưa có Proxy nào"
            action={{
              content: 'Mua Proxy đầu tiên',
              url: '/',
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Hãy thuê proxy để bắt đầu trải nghiệm dịch vụ của chúng tôi.</p>
          </EmptyState>
        )}
        headings={[
          { title: 'Quốc gia' },
          { title: 'IP:Port' },
          { title: 'Thông tin đăng nhập' },
          { title: 'Hạn dùng' },
          { title: 'Trạng thái' },
          { title: 'Thao tác', alignment: 'end' },
        ]}
        selectable={false}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );
}
