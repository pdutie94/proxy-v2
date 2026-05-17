'use client';

import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Button } from '@heroui/react';

import { UserProxyIndexTable } from './user-proxy-index-table';
import { BuyProxyModal } from '@/modules/store/components/buy-proxy-modal';
import Link from 'next/link';
import { ProxyWithServer } from '@/types';

interface UserProxiesClientProps {
  proxies: ProxyWithServer[];
}

export function UserProxiesClient({ proxies }: UserProxiesClientProps) {
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Proxy của tôi</h1>
          <p className="text-xs text-slate-400">Bạn đang có {proxies.length} proxy đang hoạt động</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/user/balance"
            className="cursor-pointer font-bold text-xs h-9 px-3 flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-lg transition-all"
          >
            <Icon icon="lucide:wallet" className="w-3.5 h-3.5 shrink-0"  />
            Nạp tiền
          </Link>
          <Button
            variant="primary"
            size="sm"
            onPress={() => setIsBuyModalOpen(true)}
            className="cursor-pointer font-bold text-xs h-9 px-3 flex items-center gap-1.5 rounded-lg"
          >
            <Icon icon="lucide:plus-circle" className="w-3.5 h-3.5 shrink-0"  />
            Mua Proxy
          </Button>
        </div>
      </div>

      <UserProxyIndexTable proxies={proxies} />

      <BuyProxyModal 
        open={isBuyModalOpen} 
        onClose={() => setIsBuyModalOpen(false)} 
      />
    </div>
  );
}
