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
  Checkbox,
  Badge
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [siteName, setSiteName] = useState("Proxy Manager v2");
  
  // SMTP Settings state
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          if (data.data.SITE_NAME) setSiteName(data.data.SITE_NAME);
          if (data.data.SMTP_HOST) setSmtpHost(data.data.SMTP_HOST);
          if (data.data.SMTP_PORT) setSmtpPort(data.data.SMTP_PORT);
          if (data.data.SMTP_USER) setSmtpUser(data.data.SMTP_USER);
          if (data.data.SMTP_PASS) setSmtpPass(data.data.SMTP_PASS);
          if (data.data.SMTP_FROM) setSmtpFrom(data.data.SMTP_FROM);
          if (data.data.REQUIRE_EMAIL_VERIFICATION) setRequireEmailVerification(data.data.REQUIRE_EMAIL_VERIFICATION === 'true');
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SITE_NAME: siteName,
          SMTP_HOST: smtpHost,
          SMTP_PORT: smtpPort,
          SMTP_USER: smtpUser,
          SMTP_PASS: smtpPass,
          SMTP_FROM: smtpFrom,
          REQUIRE_EMAIL_VERIFICATION: requireEmailVerification ? 'true' : 'false'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã lưu cài đặt hệ thống thành công");
      } else {
        toast.error(data.message || "Lỗi lưu cài đặt");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setIsSaving(false);
    }
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
                  disabled={isLoading}
                />
                <Button variant="primary" onClick={handleSave} loading={isSaving}>Lưu thay đổi</Button>
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
          id="smtpSettings"
          title="Cấu hình Email (SMTP)"
          description="Thiết lập máy chủ gửi email để gửi thông báo và mã xác nhận."
        >
          <Card>
            <Box padding="400">
              <FormLayout>
                <Checkbox
                  label="Bắt buộc xác thực Email khi đăng ký tài khoản"
                  checked={requireEmailVerification}
                  onChange={setRequireEmailVerification}
                  helpText="Người dùng không thể mua hàng nếu chưa xác nhận Email bằng mã OTP."
                  disabled={isLoading}
                />
                <Divider />
                <FormLayout.Group>
                  <TextField
                    label="SMTP Host"
                    value={smtpHost}
                    onChange={setSmtpHost}
                    autoComplete="off"
                    placeholder="smtp.gmail.com"
                    disabled={isLoading}
                  />
                  <TextField
                    label="SMTP Port"
                    value={smtpPort}
                    onChange={setSmtpPort}
                    autoComplete="off"
                    placeholder="465"
                    disabled={isLoading}
                  />
                </FormLayout.Group>
                <TextField
                  label="Tài khoản Email (Username)"
                  value={smtpUser}
                  onChange={setSmtpUser}
                  autoComplete="off"
                  disabled={isLoading}
                />
                <TextField
                  label="Mật khẩu (App Password)"
                  type="password"
                  value={smtpPass}
                  onChange={setSmtpPass}
                  autoComplete="off"
                  disabled={isLoading}
                />
                <TextField
                  label="Email gửi đi (From)"
                  value={smtpFrom}
                  onChange={setSmtpFrom}
                  autoComplete="off"
                  placeholder="noreply@domain.com"
                  disabled={isLoading}
                />
                <Button variant="primary" onClick={handleSave} loading={isSaving}>Lưu cấu hình SMTP</Button>
              </FormLayout>
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
