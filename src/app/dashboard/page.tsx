"use client";

import { 
  Page, 
  Grid, 
  Card, 
  Text, 
  BlockStack, 
  Box,
  Badge,
  IndexTable,
  Divider,
  InlineStack
} from "@shopify/polaris";
import { 
  OrderIcon, 
  ShieldCheckMarkIcon, 
  PersonIcon
} from "@shopify/polaris-icons";
import { useServers } from "@/hooks/use-servers";
import { useProxies } from "@/hooks/use-proxies";
import { useUsers } from "@/hooks/use-users";

export default function DashboardPage() {
  const { servers } = useServers();
  const { proxies } = useProxies();
  const { users } = useUsers();

  const stats = [
    {
      title: "Tổng Máy chủ",
      value: servers.length.toString(),
      icon: OrderIcon,
      tone: "info" as const,
      subtitle: "Máy chủ đang quản lý"
    },
    {
      title: "Tổng Proxy",
      value: proxies.length.toString(),
      icon: ShieldCheckMarkIcon,
      tone: "success" as const,
      subtitle: "Proxy đang hoạt động"
    },
    {
      title: "Người dùng",
      value: users.length.toString(),
      icon: PersonIcon,
      tone: "attention" as const,
      subtitle: "Tài khoản hệ thống"
    }
  ];

  return (
    <Page title="Bảng điều khiển">
      <BlockStack gap="500">
        <Grid>
          {stats.map((stat, index) => (
            <Grid.Cell key={index} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 4 }}>
              <Card>
                <Box padding="400">
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="h2" variant="headingSm" tone="subdued">
                        {stat.title}
                      </Text>
                      <Box borderInlineStartWidth="0">
                        <stat.icon width="20" />
                      </Box>
                    </InlineStack>
                    <Text as="p" variant="headingLg">
                      {stat.value}
                    </Text>
                    <Text as="p" variant="bodyXs" tone="subdued">
                      {stat.subtitle}
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            </Grid.Cell>
          ))}
        </Grid>

        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 8, xl: 8 }}>
            <Card padding="0">
              <Box padding="400">
                <Text as="h2" variant="headingMd">Hoạt động gần đây</Text>
              </Box>
              <Divider />
              <IndexTable
                resourceName={{ singular: 'hoạt động', plural: 'hoạt động' }}
                itemCount={0}
                headings={[
                  { title: 'Thời gian' },
                  { title: 'Sự kiện' },
                  { title: 'Trạng thái' },
                ]}
                selectable={false}
              >
                <IndexTable.Row id="1" position={0}>
                  <IndexTable.Cell>Vừa xong</IndexTable.Cell>
                  <IndexTable.Cell>Hệ thống đã sẵn sàng</IndexTable.Cell>
                  <IndexTable.Cell>
                    <Badge tone="success">HOÀN THÀNH</Badge>
                  </IndexTable.Cell>
                </IndexTable.Row>
              </IndexTable>
              <Box padding="400">
                <InlineStack align="center">
                  <Text as="p" tone="subdued">Xem tất cả nhật ký</Text>
                </InlineStack>
              </Box>
            </Card>
          </Grid.Cell>

          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Trạng thái Hệ thống</Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="p">Cơ sở dữ liệu</Text>
                      <Badge tone="success">ỔN ĐỊNH</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="p">Hàng đợi (Redis)</Text>
                      <Badge tone="attention">GIAI ĐOẠN 2</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="p">SSH Worker</Text>
                      <Badge tone="attention">GIAI ĐOẠN 3</Badge>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Box>
            </Card>
          </Grid.Cell>
        </Grid>
      </BlockStack>
    </Page>
  );
}
