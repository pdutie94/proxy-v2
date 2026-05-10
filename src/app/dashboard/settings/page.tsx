"use client";

import { Page, Layout, Card, BlockStack, Text, TextField, Button, Box, InlineStack, Banner } from "@shopify/polaris";
import { useState } from "react";

export default function SettingsPage() {
  const [systemName, setSystemName] = useState("ProxyV2");
  const [apiEndpoint, setApiEndpoint] = useState("https://api.proxyv2.io");

  return (
    <Page
      fullWidth
      title="Settings"
      primaryAction={{
        content: "Save changes",
        onAction: () => console.log("Saving settings"),
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">General Settings</Text>
                <FormLayout>
                  <TextField
                    label="System Name"
                    value={systemName}
                    onChange={setSystemName}
                    autoComplete="off"
                  />
                  <TextField
                    label="API Gateway Endpoint"
                    value={apiEndpoint}
                    onChange={setApiEndpoint}
                    autoComplete="off"
                    helpText="The primary endpoint for worker communications."
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Infrastructure</Text>
                <Banner tone="info">
                  <p>Settings related to remote SSH connections and port allocations.</p>
                </Banner>
                <FormLayout>
                  <TextField
                    label="Default SSH User"
                    placeholder="root"
                    autoComplete="off"
                  />
                  <TextField
                    label="Port Range Start"
                    type="number"
                    placeholder="10000"
                    autoComplete="off"
                  />
                </FormLayout>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">System Info</Text>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" tone="subdued">Version</Text>
                  <Text as="p" fontWeight="bold">1.0.0-mvp</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" tone="subdued">Environment</Text>
                  <Text as="p" fontWeight="bold">Production</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="p" tone="subdued">Database</Text>
                  <Text as="p" fontWeight="bold" tone="success">Connected</Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function FormLayout({ children }: { children: React.ReactNode }) {
  return <BlockStack gap="400">{children}</BlockStack>;
}
