"use client";

import { useProxies } from '@/hooks/use-proxies';
import { 
  IndexTable, 
  Card, 
  Badge, 
  Text, 
  Button, 
  Box, 
  InlineStack,
  Tooltip,
  SkeletonBodyText
} from "@shopify/polaris";
import { DeleteIcon, ClipboardIcon, StatusActiveIcon, LockIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";
import { toast } from "sonner";

export function ProxyList() {
  const { proxies, isLoading, deleteMutation, toggleMutation } = useProxies();

  const resourceName = {
    singular: 'proxy',
    plural: 'proxies',
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <Card>
        <Box padding="400">
          <SkeletonBodyText lines={10} />
        </Box>
      </Card>
    );
  }

  const rowMarkup = proxies.map(
    (proxy: any, index) => {
      const statusTone = proxy.status === 'ACTIVE' ? 'success' : proxy.status === 'CREATING' ? 'attention' : 'critical';

      return (
        <IndexTable.Row id={proxy.id} key={proxy.id} position={index}>
          <IndexTable.Cell>
            <Box paddingBlock="200">
              <InlineStack gap="200" align="start">
                <div>
                  <Text as="span" fontWeight="bold">{proxy.username}:{proxy.password}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">Port: {proxy.port}</Text>
                </div>
                <Button 
                  icon={ClipboardIcon} 
                  variant="tertiary" 
                  size="slim" 
                  onClick={() => copyToClipboard(`${proxy.server.host}:${proxy.port}:${proxy.username}:${proxy.password}`)}
                />
              </InlineStack>
            </Box>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <InlineStack gap="100" align="start">
              <StatusActiveIcon style={{ width: '16px' }} />
              <Text as="span" variant="bodySm">{proxy.server.name}</Text>
            </InlineStack>
          </IndexTable.Cell>
          <IndexTable.Cell>
            {proxy.ipv6 ? (
              <Box maxWidth="120px">
                <Text as="span" variant="bodySm">
                  {proxy.ipv6}
                </Text>
              </Box>
            ) : (
              <Text as="span" variant="bodySm" tone="subdued">Not assigned</Text>
            )}
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" variant="bodySm">
              {proxy.expiresAt ? format(new Date(proxy.expiresAt), 'MMM dd, yyyy') : 'Lifetime'}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <InlineStack gap="200">
              <Badge tone={statusTone}>{proxy.status}</Badge>
              {!proxy.isEnabled && <Badge tone="warning">DISABLED</Badge>}
            </InlineStack>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <InlineStack align="end" gap="100">
              <Tooltip content={proxy.isEnabled ? "Disable" : "Enable"}>
                <Button 
                  icon={proxy.isEnabled ? StatusActiveIcon : LockIcon} 
                  variant="tertiary"
                  onClick={() => toggleMutation.mutate({ id: proxy.id, isEnabled: !proxy.isEnabled })}
                />
              </Tooltip>
              <Tooltip content="Delete">
                <Button 
                  icon={DeleteIcon} 
                  variant="tertiary" 
                  tone="critical"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this proxy?')) {
                      deleteMutation.mutate(proxy.id);
                    }
                  }}
                />
              </Tooltip>
            </InlineStack>
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    },
  );

  return (
    <Card padding="0">
      <IndexTable
        resourceName={resourceName}
        itemCount={proxies.length}
        headings={[
          { title: 'Credentials' },
          { title: 'Server' },
          { title: 'IPv6' },
          { title: 'Expiration' },
          { title: 'Status' },
          { title: 'Actions', alignment: 'end' },
        ]}
        selectable={false}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );
}
