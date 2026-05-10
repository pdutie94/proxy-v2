"use client";

import { useState } from 'react';
import { ServerList } from '@/modules/servers/components/server-list';
import { AddServerForm } from '@/modules/servers/components/add-server-form';
import { Page, Modal, BlockStack } from "@shopify/polaris";

export default function ServersPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <Page
      fullWidth
      title="Servers"
      primaryAction={{
        content: "Add Server",
        onAction: () => setShowAddForm(true),
      }}
    >
      <BlockStack gap="400">
        <ServerList />
      </BlockStack>

      <Modal
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add new server"
        primaryAction={{
          content: 'Save Server',
          onAction: () => {
            document.getElementById('add-server-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          },
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowAddForm(false),
          },
        ]}
      >
        <Modal.Section>
          <AddServerForm onClose={() => setShowAddForm(false)} />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
