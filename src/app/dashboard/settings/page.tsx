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
  const [siteName, setSiteName] = useState("Proxy Manager");

  const handleSave = () => {
    toast.success("Đã lưu cài đặt hệ thống");
  };

  return (
    <Page title="Cài đặt hệ thống">
      <Layout>
        <Layout.AnnotatedSection
          id="generalSettings"
          title="Thông tin chung"
          description="Cấu hình tên hiển thị và các thông tin cơ bản của hệ thống."
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
          description="Kiểm tra kết nối tới các thành phần cốt lõi của hệ thống."
        >
          <Card>
            <Box padding="400">
              <BlockStack gap="400">
                <InlineGrid columns="1fr auto">
                  <Text as="p" fontWeight="medium">Cơ sở dữ liệu (MySQL)</Text>
                  <Badge tone="success">Đang kết nối</Badge>
                </InlineGrid>
                <Divider />
                <InlineGrid columns="1fr auto">
                  <Text as="p" fontWeight="medium">Hàng đợi (Redis)</Text>
                  <Badge tone="attention">Chưa kết nối (Phase 2)</Badge>
                </InlineGrid>
                <Divider />
                <InlineGrid columns="1fr auto">
                  <Text as="p" fontWeight="medium">SSH Service</Text>
                  <Badge tone="attention">Chờ khởi tạo (Phase 3)</Badge>
                </InlineGrid>
              </BlockStack>
            </Box>
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection
          id="apiSettings"
          title="Cấu hình API & Bảo mật"
          description="Quản lý các tham số bảo mật và kết nối API."
        >
          <Card>
            <Box padding="400">
              <FormLayout>
                <TextField
                  label="JWT Secret"
                  type="password"
                  value="************************"
                  disabled
                  autoComplete="off"
                  helpText="Được cấu hình trong tệp .env"
                />
                <TextField
                  label="Auth URL"
                  value="http://localhost:3000"
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
