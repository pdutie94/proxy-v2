"use client";

import { useState } from 'react';
import { ProxyList } from '@/modules/proxies/components/proxy-list';
import { AddProxyForm } from '@/modules/proxies/components/add-proxy-form';
import { Page, Modal, BlockStack } from "@shopify/polaris";

export default function ProxiesPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <Page
      fullWidth
      title="Proxies"
      primaryAction={{
        content: "Create Proxy",
        onAction: () => setShowAddForm(true),
      }}
    >
      <BlockStack gap="400">
        <ProxyList />
      </BlockStack>

      <Modal
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Create new proxy"
        primaryAction={{
          content: 'Create Proxy',
          onAction: () => {
            document.getElementById('add-proxy-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
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
          <AddProxyForm onClose={() => setShowAddForm(false)} />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
