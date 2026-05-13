'use client';

import { Page, Layout, Button } from '@shopify/polaris';
import { WalletIcon, PlusCircleIcon } from '@shopify/polaris-icons';
import { UserProxyIndexTable } from './user-proxy-index-table';
import { useState } from 'react';
import { BuyProxyModal } from '@/modules/store/components/buy-proxy-modal';

interface UserProxiesClientProps {
  proxies: any[];
}

export function UserProxiesClient({ proxies }: UserProxiesClientProps) {
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  return (
    <Page 
      title="Proxy của tôi" 
      subtitle={`Bạn đang có ${proxies.length} proxy đang hoạt động`}
      primaryAction={
        <Button 
          variant="primary" 
          icon={PlusCircleIcon} 
          onClick={() => setIsBuyModalOpen(true)}
        >
          Mua Proxy mới
        </Button>
      }
      secondaryActions={[
        {
          content: 'Nạp tiền',
          icon: WalletIcon,
          url: '/user/balance'
        }
      ]}
    >
      <Layout>
        <Layout.Section>
           <UserProxyIndexTable proxies={proxies} />
        </Layout.Section>
      </Layout>

      <BuyProxyModal 
        open={isBuyModalOpen} 
        onClose={() => setIsBuyModalOpen(false)} 
      />
    </Page>
  );
}
