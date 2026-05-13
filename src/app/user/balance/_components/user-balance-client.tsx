'use client';

import { Page, Layout, Card, Text, Button, TextField, InlineStack, Box, Divider, Banner, Icon } from '@shopify/polaris';
import { CashDollarIcon, CreditCardIcon, BankIcon, MobileIcon } from '@shopify/polaris-icons';

import { addTestBalanceAction } from '@/modules/auth/actions/test-balance.action';
import { toast } from 'sonner';
import { useState } from 'react';

interface UserBalanceClientProps {
  user: {
    id: string;
    email: string;
    balance: number | string;
  };
}

export function UserBalanceClient({ user }: UserBalanceClientProps) {
  const [loading, setLoading] = useState(false);

  const handleTestDeposit = async () => {
    setLoading(true);
    try {
      const res = await addTestBalanceAction();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Nạp tiền vào tài khoản" subtitle="Tăng số dư để mua thêm proxy hoặc gia hạn dịch vụ">
      <Layout>
        {/* ... existing balance card ... */}
        <Layout.Section variant="oneThird">
          <Card>
            <Box padding="400">
               <InlineStack align="space-between">
                  <Text variant="headingMd" as="h2">Số dư hiện tại</Text>
                  <Icon source={CashDollarIcon} tone="success" />
               </InlineStack>
               <div className="mt-4">
                  <Text variant="heading2xl" as="p" tone="success">
                    {Number(user.balance).toLocaleString('vi-VN')} VNĐ
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
               
               <div className="mt-6">
                 <Text variant="bodyMd" fontWeight="bold" as="p">Chế độ thử nghiệm</Text>
                 <div className="mt-2">
                    <Button 
                      variant="secondary" 
                      fullWidth 
                      loading={loading}
                      onClick={handleTestDeposit}
                    >
                      Nạp 100.000đ (Thử nghiệm)
                    </Button>
                 </div>
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
                     <Text variant="bodyMd" fontWeight="bold" as="span">Ngân hàng</Text>
                  </div>
                  <div className="border border-slate-200 p-6 rounded-2xl flex flex-col items-center gap-3 cursor-pointer hover:border-blue-500 transition-all">
                     <Icon source={MobileIcon} tone="info" />
                     <Text variant="bodyMd" fontWeight="bold" as="span">Ví điện tử</Text>
                  </div>
                  <div className="border border-slate-200 p-6 rounded-2xl flex flex-col items-center gap-3 cursor-pointer hover:border-blue-500 transition-all">
                     <Icon source={CreditCardIcon} tone="critical" />
                     <Text variant="bodyMd" fontWeight="bold" as="span">Thẻ cào</Text>
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
