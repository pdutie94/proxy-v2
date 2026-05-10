"use client";

import { useServers } from '@/hooks/use-servers';
import { 
  IndexTable, 
  Card, 
  Badge, 
  Text, 
  Button, 
  Box, 
  ProgressBar,
  InlineStack,
  Tooltip,
  SkeletonBodyText
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, PlayIcon } from "@shopify/polaris-icons";

export function ServerList() {
  const { servers, isLoading, deleteMutation } = useServers();

  const resourceName = {
    singular: 'server',
    plural: 'servers',
  };

  if (isLoading) {
    return (
      <Card>
        <Box padding="400">
          <SkeletonBodyText lines={8} />
        </Box>
      </Card>
    );
  }

  const rowMarkup = servers.map(
    (server, index) => {
      const statusTone = server.status === 'ONLINE' ? 'success' : server.status === 'PENDING' ? 'attention' : 'critical';
      const utilization = 0; 

      return (
        <IndexTable.Row id={server.id} key={server.id} position={index}>
          <IndexTable.Cell>
            <Box paddingBlock="200">
              <Text as="span" fontWeight="bold">{server.name}</Text>
              <Text as="p" variant="bodySm" tone="subdued">{server.provider || 'VPS Provider'}</Text>
            </Box>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" variant="bodySm" fontWeight="medium">
              {server.host}:{server.port}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <div style={{ width: '100px' }}>
              <Box paddingBlockEnd="100">
                <InlineStack align="space-between">
                  <Text as="span" variant="bodyXs" tone="subdued">0 / {server.maxProxies}</Text>
                  <Text as="span" variant="bodyXs" tone="subdued">{utilization}%</Text>
                </InlineStack>
              </Box>
              <ProgressBar progress={utilization} size="small" tone="primary" />
            </div>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Badge tone={statusTone}>{server.status}</Badge>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <InlineStack align="end" gap="100">
              <Tooltip content="Setup/Sync">
                <Button icon={PlayIcon} variant="tertiary" />
              </Tooltip>
              <Tooltip content="Edit">
                <Button icon={EditIcon} variant="tertiary" />
              </Tooltip>
              <Tooltip content="Delete">
                <Button 
                  icon={DeleteIcon} 
                  variant="tertiary" 
                  tone="critical"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this server?')) {
                      deleteMutation.mutate(server.id);
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
        itemCount={servers.length}
        headings={[
          { title: 'Server' },
          { title: 'Host' },
          { title: 'Capacity' },
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
