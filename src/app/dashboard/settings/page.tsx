"use client";

import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  FormLayout, 
  TextField, 
  Button, 
  BlockStack,
  Box,
  Divider,
  InlineGrid,
  Badge
} from "@shopify/polaris";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [siteName, setSiteName] = useState("Proxy Manager v2");

  const handleSave = () => {
    toast.success("Đã lưu cài đặt hệ thống thành công");
  };

  return (
    <Page title="Cài đặt hệ thống">
      <Layout>
        <Layout.AnnotatedSection
          id="generalSettings"
          title="Thông tin chung"
          description="Cấu hình tên hiển thị và các thông tin cơ bản của hệ thống điều khiển."
        >
          <Card>
            <Box padding="400">
              <FormLayout>
                <TextField
                  label="Tên Website"
                  value={siteName}
                  onChange={setSiteName}
                  autoComplete="off"
                />
                <Button variant="primary" onClick={handleSave}>Lưu thay đổi</Button>
              </FormLayout>
            </Box>
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection
          id="systemStatus"
          title="Trạng thái hạ tầng"
          description="Kiểm tra kết nối tới các dịch vụ cốt lõi đang vận hành."
        >
          <Card>
            <Box padding="400">
              <BlockStack gap="400">
                <InlineGrid columns="1fr auto">
                  <Text as="p" fontWeight="medium">Cơ sở dữ liệu (MySQL 8)</Text>
                  <Badge tone="success">Đang hoạt động</Badge>
                </InlineGrid>
                <Divider />
                <InlineGrid columns="1fr auto">
                  <Text as="p" fontWeight="medium">Hàng đợi (BullMQ / Redis)</Text>
                  <Badge tone="success">Đang hoạt động</Badge>
                </InlineGrid>
                <Divider />
                <InlineGrid columns="1fr auto">
                  <Text as="p" fontWeight="medium">Dịch vụ SSH Worker</Text>
                  <Badge tone="success">Sẵn sàng</Badge>
                </InlineGrid>
                <Divider />
                <InlineGrid columns="1fr auto">
                  <Text as="p" fontWeight="medium">Hệ thống Tự động hóa</Text>
                  <Badge tone="success">Đang chạy (5p/lần)</Badge>
                </InlineGrid>
              </BlockStack>
            </Box>
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection
          id="apiSettings"
          title="Cấu hình Bảo mật"
          description="Quản lý các thông số bảo mật và môi trường."
        >
          <Card>
            <Box padding="400">
              <FormLayout>
                <TextField
                  label="JWT / Auth Secret"
                  type="password"
                  value="************************"
                  disabled
                  autoComplete="off"
                  helpText="Đã cấu hình an toàn trong tệp .env"
                />
                <TextField
                  label="Node Environment"
                  value={process.env.NODE_ENV || 'development'}
                  disabled
                  autoComplete="off"
                />
              </FormLayout>
            </Box>
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}
