"use client";

import { Page, Card, IndexTable, Text, Badge, Box, BlockStack } from "@shopify/polaris";

export default function LogsPage() {
  const resourceName = {
    singular: 'log',
    plural: 'logs',
  };

  // Mock data for now
  const logs = [
    {
      id: '1',
      event: 'Server Setup',
      status: 'completed',
      target: '192.168.1.1',
      time: '2 minutes ago',
    },
    {
      id: '2',
      event: 'Proxy Rotation',
      status: 'active',
      target: 'Proxy #4421',
      time: '5 minutes ago',
    },
    {
      id: '3',
      event: 'System Check',
      status: 'failed',
      target: 'Main Gateway',
      time: '1 hour ago',
    }
  ];

  const rowMarkup = logs.map(
    ({ id, event, status, target, time }, index) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <Text as="span" fontWeight="bold">
            {event}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={status === 'completed' ? 'success' : status === 'failed' ? 'critical' : 'attention'}>
            {status.toUpperCase()}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>{target}</IndexTable.Cell>
        <IndexTable.Cell>{time}</IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page fullWidth title="System Analytics">
      <BlockStack gap="400">
        <Card padding="0">
          <IndexTable
            resourceName={resourceName}
            itemCount={logs.length}
            headings={[
              { title: 'Event' },
              { title: 'Status' },
              { title: 'Target' },
              { title: 'Time' },
            ]}
            selectable={false}
          >
            {rowMarkup}
          </IndexTable>
        </Card>
      </BlockStack>
    </Page>
  );
}
