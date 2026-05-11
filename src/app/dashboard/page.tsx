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
  InlineStack,
  Button,
  Modal,
  Scrollable
} from "@shopify/polaris";
import { 
  OrderIcon, 
  ShieldCheckMarkIcon, 
  PersonIcon,
  ViewIcon
} from "@shopify/polaris-icons";
import { useServers } from "@/hooks/use-servers";
import { useProxies } from "@/hooks/use-proxies";
import { useUsers } from "@/hooks/use-users";
import { useLogs } from "@/hooks/use-logs";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useState } from "react";

export default function DashboardPage() {
  const { servers } = useServers();
  const { proxies } = useProxies();
  const { users } = useUsers();
  const { logs } = useLogs(10);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const stats = [
    {
      title: "Tổng Máy chủ",
      value: servers.length.toString(),
      icon: OrderIcon,
      tone: "info" as const,
      subtitle: `${servers.filter(s => s.status === 'ONLINE').length} Đang trực tuyến`
    },
    {
      title: "Tổng Proxy",
      value: proxies.length.toString(),
      icon: ShieldCheckMarkIcon,
      tone: "success" as const,
      subtitle: `${proxies.filter(p => p.status === 'ACTIVE').length} Đang hoạt động`
    },
    {
      title: "Người dùng",
      value: users.length.toString(),
      icon: PersonIcon,
      tone: "attention" as const,
      subtitle: "Tài khoản hệ thống"
    }
  ];

  const getJobTitle = (job: any) => {
    switch (job.type) {
      case 'SETUP_SERVER': return `Thiết lập server ${job.server?.name}`;
      case 'PROVISION_PROXY': return `Tạo Proxy cổng ${job.proxy?.port}`;
      case 'BULK_PROVISION_PROXY': return `Tạo hàng loạt Proxy (${job.server?.name})`;
      case 'ROTATE_PROXY': return `Xoay IP cổng ${job.proxy?.port}`;
      case 'DELETE_PROXY': return `Xóa Proxy cổng ${job.proxy?.port}`;
      case 'RESET_SERVER': return `Reset server ${job.server?.name}`;
      case 'AUTOMATION': return 'Chạy chu kỳ tự động hóa';
      default: return job.type;
    }
  };

  const getJobBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge tone="success">Thành công</Badge>;
      case 'FAILED': return <Badge tone="critical">Thất bại</Badge>;
      case 'ACTIVE': return <Badge tone="attention">Đang chạy</Badge>;
      default: return <Badge tone="info">Đang chờ</Badge>;
    }
  };

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
                itemCount={logs.length}
                headings={[
                  { title: 'Thời gian' },
                  { title: 'Sự kiện' },
                  { title: 'Trạng thái' },
                  { title: 'Chi tiết', alignment: 'end' },
                ]}
                selectable={false}
              >
                {logs.map((job: any, index: number) => (
                  <IndexTable.Row id={job.id} key={job.id} position={index}>
                    <IndexTable.Cell>
                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: vi })}
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Text as="span" fontWeight="medium">{getJobTitle(job)}</Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      {getJobBadge(job.status)}
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <InlineStack align="end">
                        <Button 
                          icon={ViewIcon} 
                          variant="tertiary" 
                          onClick={() => setSelectedLog(job)}
                        />
                      </InlineStack>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>
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
                      <Badge tone="success">Ổn định</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="p">Redis Queue</Text>
                      <Badge tone="success">Đang chạy</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="p">SSH Worker</Text>
                      <Badge tone="success">Đang chờ việc</Badge>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Box>
            </Card>
          </Grid.Cell>
        </Grid>
      </BlockStack>

      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Chi tiết: ${selectedLog ? getJobTitle(selectedLog) : ''}`}
        large
      >
        <Modal.Section>
          <Box background="bg-surface-secondary" padding="400" borderRadius="200">
            <Scrollable style={{ maxHeight: '400px' }}>
              <pre style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                {selectedLog?.logs || 'Không có nhật ký chi tiết.'}
              </pre>
            </Scrollable>
          </Box>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
