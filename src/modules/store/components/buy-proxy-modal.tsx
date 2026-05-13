'use client';

import { useState, useMemo } from 'react';
import { 
  Modal, 
  Box, 
  TextField, 
  Select, 
  BlockStack, 
  InlineStack, 
  Text, 
  Banner, 
  Divider,
  Button,
  ButtonGroup,
  Label
} from '@shopify/polaris';
import { toast } from 'sonner';
import { purchaseProxyAction } from '../actions/purchase.action';
import { useRouter } from 'next/navigation';

interface BuyProxyModalProps { open: boolean; onClose: () => void; }

type ProxyType = 'ipv6' | 'ipv4' | 'ipv4_shared';
const BASE_PRICES: Record<ProxyType, number> = { ipv6: 5000, ipv4: 50000, ipv4_shared: 15000 };
const COUNTRIES = [ { value: 'VN', label: 'Việt Nam' }, { value: 'US', label: 'Hoa Kỳ' }, { value: 'UK', label: 'Vương Quốc Anh' }, { value: 'RU', label: 'Nga' } ];
const PERIODS = [ { value: '3', label: '3 ngày' }, { value: '7', label: '1 tuần' }, { value: '30', label: '1 tháng' } ];

export function BuyProxyModal({ open, onClose }: BuyProxyModalProps) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<ProxyType>('ipv6');
  const [country, setCountry] = useState('VN');
  const [count, setCount] = useState('1');
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(false);

  const totalPrice = useMemo(() => {
    const base = BASE_PRICES[activeType];
    const days = parseInt(period);
    const countNum = parseInt(count) || 1;
    const multiplier = days === 3 ? 0.2 : days === 7 ? 0.4 : 1;
    return Math.round(base * countNum * multiplier);
  }, [activeType, count, period]);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const result = await purchaseProxyAction({ type: activeType, country, count: parseInt(count), days: parseInt(period), totalAmount: totalPrice });
      if (result.success) { toast.success(result.message); onClose(); router.refresh(); } 
      else if (result.errorType === 'INSUFFICIENT_BALANCE') { toast.error('Số dư không đủ. Vui lòng nạp thêm tiền.'); router.push('/user/balance'); } 
      else { toast.error(result.message); }
    } catch (error) { toast.error('Có lỗi xảy ra khi thanh toán.'); } finally { setLoading(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mua Proxy mới"
      primaryAction={{ content: `Thanh toán ${totalPrice.toLocaleString()}đ`, onAction: handlePurchase, loading: loading }}
      secondaryActions={[{ content: 'Hủy bỏ', onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <div className="space-y-1">
            <Label id="proxy-type-label">Loại Proxy</Label>
            <ButtonGroup variant="segmented" fullWidth>
              <Button pressed={activeType === 'ipv6'} onClick={() => setActiveType('ipv6')}>IPv6</Button>
              <Button pressed={activeType === 'ipv4'} onClick={() => setActiveType('ipv4')}>IPv4 Private</Button>
              <Button pressed={activeType === 'ipv4_shared'} onClick={() => setActiveType('ipv4_shared')}>IPv4 Shared</Button>
            </ButtonGroup>
          </div>

          <InlineStack gap="400">
            <div className="flex-1">
              <Select label="Quốc gia" options={COUNTRIES} value={country} onChange={setCountry} />
            </div>
            <div className="flex-1">
              <Select label="Thời hạn" options={PERIODS} value={period} onChange={setPeriod} />
            </div>
          </InlineStack>

          <TextField label="Số lượng" type="number" value={count} onChange={setCount} autoComplete="off" min={1} />

          <Divider />

          <Box padding="300" background="bg-surface-secondary" borderRadius="200">
            <InlineStack align="space-between">
              <Text variant="bodyMd" fontWeight="bold" as="span">Tổng cộng:</Text>
              <Text variant="headingLg" as="span" tone="brand">{totalPrice.toLocaleString()}đ</Text>
            </InlineStack>
          </Box>

          <Banner tone="info">
             <Text variant="bodyXs" as="p">Hệ thống cấp phát tự động ngay sau khi thanh toán.</Text>
          </Banner>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
