'use client';

import { Page, Layout, Card, Text, Button, TextField, InlineStack, Box, Divider, Banner, Icon } from '@shopify/polaris';
import { CashDollarIcon, CreditCardIcon, BankIcon, MobileIcon } from '@shopify/polaris-icons';

interface UserBalanceClientProps {
  user: any;
}

export function UserBalanceClient({ user }: UserBalanceClientProps) {
  return (
    <Page title="Nạp tiền vào tài khoản" subtitle="Tăng số dư để mua thêm proxy hoặc gia hạn dịch vụ">
      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <Box padding="400">
               <InlineStack align="space-between">
                  <Text variant="headingMd" as="h2">Số dư hiện tại</Text>
                  <Icon source={CashDollarIcon} tone="success" />
               </InlineStack>
               <div className="mt-4">
                  <Text variant="heading2xl" as="p" tone="success">
                    {Number(user.balance).toLocaleString()} VNĐ
                  </Text>
               </div>
               <div className="mt-4">
                  <Divider />
               </div>
               <div className="mt-4">
                  <Banner tone="info">
                    <p className="text-xs">Số dư này được dùng để thanh toán các đơn hàng mới hoặc tự động gia hạn proxy.</p>
                  </Banner>
               </div>
            </Box>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Box padding="400">
               <Text variant="headingMd" as="h2">Phương thức nạp tiền</Text>
               <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border-2 border-blue-500 bg-blue-50/20 p-6 rounded-2xl flex flex-col items-center gap-3 cursor-pointer hover:scale-105 transition-all">
                     <Icon source={BankIcon} tone="primary" />
                     <Text variant="bodySm" fontWeight="bold">Ngân hàng</Text>
                  </div>
                  <div className="border border-slate-200 p-6 rounded-2xl flex flex-col items-center gap-3 cursor-pointer hover:border-blue-500 transition-all">
                     <Icon source={MobileIcon} tone="info" />
                     <Text variant="bodySm" fontWeight="bold">Ví điện tử</Text>
                  </div>
                  <div className="border border-slate-200 p-6 rounded-2xl flex flex-col items-center gap-3 cursor-pointer hover:border-blue-500 transition-all">
                     <Icon source={CreditCardIcon} tone="critical" />
                     <Text variant="bodySm" fontWeight="bold">Thẻ cào</Text>
                  </div>
               </div>

               <div className="mt-10 space-y-4 max-w-md">
                  <TextField
                    label="Số tiền cần nạp (VNĐ)"
                    type="number"
                    value="50000"
                    onChange={() => {}}
                    autoComplete="off"
                    suffix="VNĐ"
                  />
                  <Button variant="primary" size="large" fullWidth>Tiếp tục nạp tiền</Button>
               </div>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
