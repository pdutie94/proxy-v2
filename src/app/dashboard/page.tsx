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
  Scrollable,
  ProgressBar,
  Icon
} from "@shopify/polaris";
import { 
  OrderIcon, 
  ShieldCheckMarkIcon, 
  PersonIcon,
  ViewIcon,
  DesktopIcon,
  DatabaseIcon,
  CalendarTimeIcon
} from "@shopify/polaris-icons";
import { useServers } from "@/hooks/use-servers";
import { useProxies } from "@/hooks/use-proxies";
import { useUsers } from "@/hooks/use-users";
import { useLogs } from "@/hooks/use-logs";
import { useSystemHealth } from "@/hooks/use-system-health";
import { IncomingIcon } from "@shopify/polaris-icons";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useState, useMemo } from "react";

export default function DashboardPage() {
  const { servers } = useServers();
  const { proxies } = useProxies();
  const { users } = useUsers();
  const { logs } = useLogs(8);
  const { data: healthData, isLoading: isHealthLoading } = useSystemHealth();
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const activeProxies = useMemo(() => proxies.filter(p => p.status === 'ACTIVE').length, [proxies]);
  const onlineServers = useMemo(() => servers.filter(s => s.status === 'ONLINE').length, [servers]);

  const stats = [
    {
      title: "Máy chủ trực tuyến",
      value: `${onlineServers}/${servers.length}`,
      icon: OrderIcon,
      tone: "info" as const,
      bg: "#E0F2FE",
      iconColor: "#0369A1"
    },
    {
      title: "Proxy hoạt động",
      value: activeProxies.toString(),
      icon: ShieldCheckMarkIcon,
      tone: "success" as const,
      bg: "#DCFCE7",
      iconColor: "#15803D"
    },
    {
      title: "Tổng người dùng",
      value: users.length.toString(),
      icon: PersonIcon,
      tone: "attention" as const,
      bg: "#FEF9C3",
      iconColor: "#A16207"
    }
  ];

  const getJobTitle = (job: any) => {
    switch (job.type) {
      case 'SETUP_SERVER': return `Thiết lập server ${job.server?.name || 'Unknown'}`;
      case 'PROVISION_PROXY': return `Tạo Proxy cổng ${job.proxy?.port || ''}`;
      case 'BULK_PROVISION_PROXY': return `Tạo hàng loạt Proxy (${job.server?.name || ''})`;
      case 'ROTATE_PROXY': return `Xoay IP cổng ${job.proxy?.port || ''}`;
      case 'DELETE_PROXY': return `Xóa Proxy cổng ${job.proxy?.port || ''}`;
      case 'RESET_SERVER': return `Reset server ${job.server?.name || ''}`;
      case 'SYNC_SERVER_PORT': return `Đồng bộ cổng ${job.server?.name || ''}`;
      case 'AUTOMATION': return 'Tự động hóa hệ thống';
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
    <Page title="Tổng quan hệ thống">
      <Box paddingInline={{ xs: '400', sm: '0' }} paddingBlockEnd="400">
        <BlockStack gap="500">
          {/* KPI Cards */}
          <Grid>
            {stats.map((stat, index) => (
              <Grid.Cell key={index} columnSpan={{ xs: 6, lg: 4, xl: 4 }}>
                <Card>
                  <BlockStack gap="200">
                      <InlineStack gap="100" blockAlign="center">
                        <div style={{ color: stat.iconColor, display: 'flex', width: '20px', height: '20px' }}>
                          <Icon source={stat.icon} />
                        </div>
                        <Text as="h2" variant="bodySm" fontWeight="medium" tone="subdued">
                          {stat.title}
                        </Text>
                      </InlineStack>
                      <Text as="p" variant="headingXl" fontWeight="bold">
                        {stat.value}
                      </Text>
                    </BlockStack>
                </Card>
              </Grid.Cell>
            ))}
          </Grid>
        <Grid>
          {/* Recent Activity */}
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 8, xl: 8 }}>
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">Hoạt động gần đây</Text>
                <IndexTable
                  resourceName={{ singular: 'hoạt động', plural: 'hoạt động' }}
                  itemCount={logs.length}
                  headings={[
                    { title: 'Thời gian' },
                    { title: 'Sự kiện' },
                    { title: 'Trạng thái', alignment: 'center' },
                    { title: '', alignment: 'end' },
                  ]}
                  selectable={false}
                >
                  {logs.map((job: any, index: number) => (
                    <IndexTable.Row id={job.id} key={job.id} position={index}>
                      <IndexTable.Cell>
                        <Text as="span" variant="bodySm" tone="subdued">
                          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: vi })}
                        </Text>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <InlineStack gap="200" blockAlign="center">
                          <div style={{ width: '20px', height: '20px', color: '#637381' }}>
                            <Icon source={CalendarTimeIcon} />
                          </div>
                          <Text as="span" fontWeight="medium">{getJobTitle(job)}</Text>
                        </InlineStack>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <InlineStack align="center">
                          {getJobBadge(job.status)}
                        </InlineStack>
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
                    {logs.length === 0 && (
                      <IndexTable.Row id="empty" position={0} disabled>
                        <IndexTable.Cell colSpan={4}>
                          <Box padding="400">
                            <InlineStack align="center">
                              <Text as="p" tone="subdued">Chưa có hoạt động nào</Text>
                            </InlineStack>
                          </Box>
                        </IndexTable.Cell>
                      </IndexTable.Row>
                    )}
                  </IndexTable>
                <Divider />
                <InlineStack align="center">
                    <Button variant="tertiary" url="/dashboard/logs">Xem tất cả nhật ký</Button>
                  </InlineStack>
                </BlockStack>
            </Card>
          </Grid.Cell>

          {/* Server Resource Status */}
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">Tài nguyên Server</Text>
                    <BlockStack gap="400">
                      {servers.length === 0 && <Text as="p" tone="subdued">Chưa có máy chủ nào</Text>}
                      {servers.slice(0, 5).map((server) => {
                        const proxyCount = proxies.filter(p => p.serverId === server.id).length;
                        const percentage = Math.min(Math.round((proxyCount / server.maxProxies) * 100), 100);
                        let progressTone: "success" | "critical" | undefined = "success";
                        if (percentage > 85) progressTone = "critical";
                        else if (percentage > 60) progressTone = undefined;

                        return (
                          <BlockStack gap="100" key={server.id}>
                            <InlineStack align="space-between">
                              <Text as="p" variant="bodySm" fontWeight="medium">{server.name}</Text>
                              <Text as="p" variant="bodyXs" tone="subdued">{proxyCount}/{server.maxProxies}</Text>
                            </InlineStack>
                            <ProgressBar progress={percentage} tone={progressTone} size="small" />
                          </BlockStack>
                        );
                      })}
                      {servers.length > 5 && (
                        <Button variant="tertiary" url="/dashboard/servers">Xem thêm {`${servers.length - 5}`} máy chủ</Button>
                      )}
                    </BlockStack>
                  </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">Trạng thái dịch vụ</Text>
                    <BlockStack gap="300">
                      <InlineStack align="space-between">
                        <InlineStack gap="200" blockAlign="center">
                          <Icon source={DatabaseIcon} tone={healthData?.database === 'ONLINE' ? 'success' : 'critical'} />
                          <Text as="p">Cơ sở dữ liệu</Text>
                        </InlineStack>
                        {isHealthLoading ? (
                          <Badge tone="info">Đang kiểm tra...</Badge>
                        ) : (
                          <Badge tone={healthData?.database === 'ONLINE' ? 'success' : 'critical'}>
                            {healthData?.database === 'ONLINE' ? 'Sẵn sàng' : 'Ngoại tuyến'}
                          </Badge>
                        )}
                      </InlineStack>
                      <InlineStack align="space-between">
                        <InlineStack gap="200" blockAlign="center">
                          <Icon source={IncomingIcon} tone={healthData?.redis === 'ONLINE' ? 'success' : 'critical'} />
                          <Text as="p">Hàng chờ (Redis)</Text>
                        </InlineStack>
                        <Badge tone={healthData?.redis === 'ONLINE' ? 'success' : 'critical'}>
                          {healthData?.redis === 'ONLINE' ? 'Kết nối' : 'Mất kết nối'}
                        </Badge>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <InlineStack gap="200" blockAlign="center">
                          <Icon source={OrderIcon} tone={healthData?.worker === 'ONLINE' ? 'success' : 'critical'} />
                          <Text as="p">SSH Workers</Text>
                        </InlineStack>
                        <Badge tone={healthData?.worker === 'ONLINE' ? 'success' : 'critical'}>
                          {healthData?.worker === 'ONLINE' ? 'Hoạt động' : 'Dừng'}
                        </Badge>
                      </InlineStack>
                    </BlockStack>
                  </BlockStack>
              </Card>
            </BlockStack>
          </Grid.Cell>
        </Grid>
        </BlockStack>
      </Box>
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Chi tiết: ${selectedLog ? getJobTitle(selectedLog) : ''}`}
        size="large"
      >
        <Modal.Section>
          <Box background="bg-surface-secondary" padding="400" borderRadius="200">
            <Scrollable style={{ maxHeight: '500px' }}>
              <pre style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.6'
              }}>
                {selectedLog?.logs || 'Không có dữ liệu nhật ký chi tiết.'}
              </pre>
            </Scrollable>
          </Box>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
