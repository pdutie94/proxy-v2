"use client";

import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  BlockStack, 
  Box, 
  Grid,
  Banner,
  List,
  InlineStack,
  Link as PolarisLink
} from "@shopify/polaris";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <Page 
      fullWidth
      title="Overview"
      primaryAction={{
        content: "Add server",
        onAction: () => router.push("/dashboard/servers")
      }}
      secondaryActions={[
        {
          content: "Export data",
          onAction: () => console.log("Exporting"),
        }
      ]}
    >
      <BlockStack gap="400">
        {/* Stats Grid */}
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <Card>
              <BlockStack gap="200">
                <Box borderInlineStartWidth="400" borderColor="border-info" paddingInlineStart="200">
                  <Text as="h2" variant="bodySm" fontWeight="medium" tone="subdued">TOTAL SERVERS</Text>
                  <Box paddingBlockStart="100">
                    <Text as="p" variant="headingLg" fontWeight="bold">0</Text>
                  </Box>
                </Box>
              </BlockStack>
            </Card>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <Card>
              <BlockStack gap="200">
                <Box borderInlineStartWidth="400" borderColor="border-success" paddingInlineStart="200">
                  <Text as="h2" variant="bodySm" fontWeight="medium" tone="subdued">ACTIVE PROXIES</Text>
                  <Box paddingBlockStart="100">
                    <Text as="p" variant="headingLg" fontWeight="bold">0</Text>
                  </Box>
                </Box>
              </BlockStack>
            </Card>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <Card>
              <BlockStack gap="200">
                <Box borderInlineStartWidth="400" borderColor="border-warning" paddingInlineStart="200">
                  <Text as="h2" variant="bodySm" fontWeight="medium" tone="subdued">ACTIVE JOBS</Text>
                  <Box paddingBlockStart="100">
                    <Text as="p" variant="headingLg" fontWeight="bold">0</Text>
                  </Box>
                </Box>
              </BlockStack>
            </Card>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <Card>
              <BlockStack gap="200">
                <Box borderInlineStartWidth="400" borderColor="border-success" paddingInlineStart="200">
                  <Text as="h2" variant="bodySm" fontWeight="medium" tone="subdued">SYSTEM STATUS</Text>
                  <Box paddingBlockStart="100">
                    <Text as="p" variant="headingLg" fontWeight="bold" tone="success">STABLE</Text>
                  </Box>
                </Box>
              </BlockStack>
            </Card>
          </Grid.Cell>
        </Grid>

        <Layout>
          <Layout.Section>
            <Card roundedAbove="sm">
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Getting Started</Text>
                <Banner title="Configure your infrastructure" tone="info">
                  <p>Follow these steps to start provisioning high-performance proxies.</p>
                </Banner>
                <Box paddingBlockStart="200">
                  <List type="number">
                    <List.Item>
                      <Text as="span" fontWeight="bold">Connect your first server:</Text> Go to the {" "}
                      <PolarisLink url="/dashboard/servers">Servers</PolarisLink> page and add a remote VPS via SSH.
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="bold">Provision Proxies:</Text> Once the server is online, use the Proxies page to allocate IPv6 ports.
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="bold">Monitor Activity:</Text> Track deployment status and rotation logs in the Analytics section.
                    </List.Item>
                  </List>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">System Overview</Text>
                <Box borderBlockEndWidth="025" borderColor="border-subdued" paddingBlockEnd="200">
                  <Grid>
                    <Grid.Cell columnSpan={{ xs: 3, md: 3 }}>
                      <Text as="p" tone="subdued">Ports</Text>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 3, md: 3 }}>
                      <InlineStack align="end">
                        <Text as="p" fontWeight="bold">0 / 5000</Text>
                      </InlineStack>
                    </Grid.Cell>
                  </Grid>
                </Box>
                <Box borderBlockEndWidth="025" borderColor="border-subdued" paddingBlockEnd="200">
                  <Grid>
                    <Grid.Cell columnSpan={{ xs: 3, md: 3 }}>
                      <Text as="p" tone="subdued">Uptime</Text>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 3, md: 3 }}>
                      <InlineStack align="end">
                        <Text as="p" fontWeight="bold">99.9%</Text>
                      </InlineStack>
                    </Grid.Cell>
                  </Grid>
                </Box>
                <Box paddingBlockEnd="200">
                  <Grid>
                    <Grid.Cell columnSpan={{ xs: 3, md: 3 }}>
                      <Text as="p" tone="subdued">Worker</Text>
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 3, md: 3 }}>
                      <InlineStack align="end">
                        <Text as="p" fontWeight="bold" tone="success">Online</Text>
                      </InlineStack>
                    </Grid.Cell>
                  </Grid>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
