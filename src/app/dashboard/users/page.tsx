"use client";

import { useState } from 'react';
import { UserList } from '@/modules/users/components/user-list';
import { AddUserForm } from '@/modules/users/components/add-user-form';
import { Page, Modal, BlockStack } from "@shopify/polaris";

export default function UsersPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <Page
      fullWidth
      title="Users"
      primaryAction={{
        content: "Add User",
        onAction: () => setShowAddForm(true),
      }}
    >
      <BlockStack gap="400">
        <UserList />
      </BlockStack>

      <Modal
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add new user"
        primaryAction={{
          content: 'Save User',
          onAction: () => {
            document.getElementById('add-user-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
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
          <AddUserForm onClose={() => setShowAddForm(false)} />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
