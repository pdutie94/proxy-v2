'use client';

import { 
  Page, 
  Layout, 
  Card, 
  FormLayout, 
  TextField, 
  Checkbox, 
  Button, 
  BlockStack, 
  Text, 
  Divider,
  Banner
} from '@shopify/polaris';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { updateProfileAction } from '@/modules/auth/actions/profile.action';

interface User {
  id: string;
  email: string;
  name: string | null;
  notificationsEnabled: boolean;
  updatedAt: Date | string;
  balance: number;
}

interface UserProfileClientProps {
  user: User;
}

export function UserProfileClient({ user }: UserProfileClientProps) {
  const [name, setName] = useState(user.name || '');
  const [notifications, setNotifications] = useState(user.notificationsEnabled);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfileAction({
        name,
        notificationsEnabled: notifications,
        currentPassword,
        newPassword
      });

      if (result.success) {
        toast.success(result.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, [name, notifications, currentPassword, newPassword, confirmPassword]);

  return (
    <Page title="Hồ sơ cá nhân" subtitle="Quản lý thông tin tài khoản và bảo mật">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Thông tin cơ bản</Text>
                <FormLayout>
                  <TextField
                    label="Địa chỉ Email"
                    value={user.email}
                    disabled
                    autoComplete="email"
                  />
                  <TextField
                    label="Họ và tên"
                    value={name}
                    onChange={setName}
                    autoComplete="name"
                    placeholder="Nhập tên của bạn"
                  />
                  <Checkbox
                    label="Nhận thông báo qua Email"
                    checked={notifications}
                    onChange={setNotifications}
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Đổi mật khẩu</Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  Để trống nếu bạn không muốn thay đổi mật khẩu.
                </Text>
                <FormLayout>
                  <TextField
                    label="Mật khẩu hiện tại"
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    autoComplete="current-password"
                  />
                  <Divider />
                  <TextField
                    label="Mật khẩu mới"
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    autoComplete="new-password"
                  />
                  <TextField
                    label="Xác nhận mật khẩu mới"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <div className="flex justify-end">
               <Button 
                variant="primary" 
                size="large" 
                loading={loading}
                onClick={handleSave}
               >
                 Lưu thay đổi
               </Button>
            </div>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
           <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">Bảo mật tài khoản</Text>
                <Text variant="bodySm" as="p">
                  Đảm bảo mật khẩu của bạn có ít nhất 8 ký tự, bao gồm cả chữ cái và chữ số để an toàn nhất.
                </Text>
                <Banner tone="info">
                   <Text variant="bodyXs" as="p">
                      Lần cập nhật cuối: {new Date(user.updatedAt).toLocaleDateString('vi-VN')}
                   </Text>
                </Banner>
              </BlockStack>
           </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
