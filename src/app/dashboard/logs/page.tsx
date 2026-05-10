"use client";

import { 
  Page, 
  Card, 
  IndexTable, 
  Text, 
  Badge, 
  Box,
  Divider,
  EmptyState
} from "@shopify/polaris";
import { format } from "date-fns";

export default function LogsPage() {
  // Mock data for logs
  const logs: any[] = [];

  return (
    <Page 
      title="Nhật ký hệ thống"
      subtitle="Theo dõi chi tiết các hoạt động và tiến trình xử lý trên máy chủ"
    >
      <Card padding="0">
        <IndexTable
          resourceName={{ singular: 'nhật ký', plural: 'nhật ký' }}
          itemCount={logs.length}
          headings={[
            { title: 'Thời gian' },
            { title: 'Loại công việc' },
            { title: 'Máy chủ' },
            { title: 'Trạng thái' },
            { title: 'Chi tiết' },
          ]}
          selectable={false}
        >
          {logs.length === 0 ? (
            <IndexTable.Row id="empty" position={0}>
              <IndexTable.Cell colSpan={5}>
                <Box padding="1000">
                  <EmptyState
                    heading="Chưa có nhật ký nào"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Các hoạt động thiết lập máy chủ và khởi tạo proxy sẽ được hiển thị tại đây.</p>
                  </EmptyState>
                </Box>
              </IndexTable.Cell>
            </IndexTable.Row>
          ) : (
            logs.map((log, index) => (
              <IndexTable.Row id={log.id} key={log.id} position={index}>
                <IndexTable.Cell>{format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}</IndexTable.Cell>
                <IndexTable.Cell>{log.type}</IndexTable.Cell>
                <IndexTable.Cell>{log.server?.name || '-'}</IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge tone={log.status === 'COMPLETED' ? 'success' : 'attention'}>
                    {log.status}
                  </Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span" tone="subdued" variant="bodySm">
                    {log.logs?.substring(0, 50)}...
                  </Text>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))
          )}
        </IndexTable>
      </Card>
    </Page>
  );
}
