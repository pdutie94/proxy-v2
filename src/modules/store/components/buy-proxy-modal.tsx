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
import { createPendingOrderAction, payOrderAction } from '../actions/purchase.action';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

import { useLocations } from '@/modules/locations/hooks/use-locations';

interface BuyProxyModalProps { open: boolean; onClose: () => void; }

type ProxyType = 'ipv6' | 'ipv4' | 'ipv4_shared';
const BASE_PRICES: Record<ProxyType, number> = { ipv6: 5000, ipv4: 50000, ipv4_shared: 15000 };
const PERIODS = [ { value: '3', label: '3 ngày' }, { value: '7', label: '1 tuần' }, { value: '30', label: '1 tháng' } ];

export function BuyProxyModal({ open, onClose }: BuyProxyModalProps) {
  const router = useRouter();
  const { data: locationsData } = useLocations();
  const [step, setStep] = useState(0); // 0: Selection, 1: Confirmation
  const [orderId, setOrderId] = useState<string | null>(null);

  const countriesOptions = useMemo(() => {
    if (!locationsData || locationsData.length === 0) {
      return [{ value: 'VN', label: 'Việt Nam' }];
    }
    return locationsData.map(loc => ({
      value: loc.countryCode,
      label: loc.name
    }));
  }, [locationsData]);

  const [activeType, setActiveType] = useState<ProxyType>('ipv6');
  const [country, setCountry] = useState('VN');
  
  const [prevOptions, setPrevOptions] = useState(countriesOptions);
  if (countriesOptions !== prevOptions) {
    setPrevOptions(countriesOptions);
    if (countriesOptions.length > 0 && !countriesOptions.find(c => c.value === country)) {
      setCountry(countriesOptions[0].value);
    }
  }
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
      if (step === 0) {
        const result = await createPendingOrderAction({ 
          type: activeType, 
          country, 
          count: parseInt(count), 
          days: parseInt(period), 
          totalAmount: totalPrice 
        });
        
        if (result.success && result.orderId) {
          setOrderId(result.orderId);
          setStep(1);
        } else {
          toast.error(result.message || 'Lỗi khi tạo đơn hàng');
        }
        return;
      }

      if (!orderId) throw new Error('Không tìm thấy mã đơn hàng.');

      const result = await payOrderAction(orderId);
      
      if (result.success) { 
        toast.success(result.message); 
        onClose(); 
        setStep(0);
        setOrderId(null);
        router.push('/user/proxies'); 
        router.refresh(); 
      } 
      else { 
        toast.error(result.message); 
        if (result.message?.includes('Số dư')) {
           onClose();
           setStep(0);
           setOrderId(null);
           router.push('/user/orders');
        }
      }
    } catch { 
      toast.error('Có lỗi xảy ra khi thanh toán.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const orderDateStr = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setStep(0); setOrderId(null); }}
      title={step === 0 ? "Mua Proxy mới" : "Xác nhận đơn hàng"}
      primaryAction={{ 
        content: step === 0 ? "Tiến hành thanh toán" : `Thanh toán ${totalPrice.toLocaleString()}đ`, 
        onAction: handlePurchase, 
        loading: loading 
      }}
      secondaryActions={
        step === 0 
          ? [{ content: 'Hủy bỏ', onAction: onClose }]
          : [{ content: 'Quay lại', onAction: () => setStep(0) }]
      }
    >
      <Modal.Section>
        {step === 0 ? (
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
                <Select label="Quốc gia" options={countriesOptions} value={country} onChange={setCountry} />
              </div>
              <div className="flex-1">
                <Select label="Thời hạn" options={PERIODS} value={period} onChange={setPeriod} />
              </div>
            </InlineStack>

            <TextField label="Số lượng" type="number" value={count} onChange={setCount} autoComplete="off" min={1} />

            <Divider />

            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
              <InlineStack align="space-between">
                <Text variant="bodyMd" fontWeight="bold" as="span">Tạm tính:</Text>
                <Text variant="headingLg" as="span">{totalPrice.toLocaleString()}đ</Text>
              </InlineStack>
            </Box>
          </BlockStack>
        ) : (
          <BlockStack gap="400">
            <Box padding="400" background="bg-surface" borderRadius="200" borderStyle="solid" borderWidth="025" borderColor="border-secondary">
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text variant="bodyMd" fontWeight="bold" as="span">Mã đơn hàng:</Text>
                  <Text variant="bodyMd" fontWeight="bold" as="span">ORD-{orderId?.slice(0, 8).toUpperCase()}</Text>
                </InlineStack>
                <Divider />
                <InlineStack align="space-between">
                  <Text variant="bodyMd" fontWeight="bold" as="span">Ngày tạo:</Text>
                  <Text variant="bodyMd" as="span">{orderDateStr}</Text>
                </InlineStack>
                <Divider />
                <InlineStack align="space-between">
                  <Text variant="bodyMd" fontWeight="bold" as="span">Loại đơn:</Text>
                  <Text variant="bodyMd" as="span">Mua hàng</Text>
                </InlineStack>
                <Divider />
                <InlineStack align="space-between">
                  <Text variant="bodyMd" fontWeight="bold" as="span">Số lượng IP:</Text>
                  <Text variant="bodyMd" as="span">{count}</Text>
                </InlineStack>
                <Divider />
                <InlineStack align="space-between">
                  <Text variant="bodyMd" fontWeight="bold" as="span">Số ngày:</Text>
                  <Text variant="bodyMd" as="span">{period}</Text>
                </InlineStack>
                <Divider />
                <InlineStack align="space-between">
                  <Text variant="bodyMd" fontWeight="bold" as="span">Tổng thanh toán:</Text>
                  <Text variant="bodyMd" fontWeight="bold" as="span">{totalPrice.toLocaleString()}đ</Text>
                </InlineStack>
              </BlockStack>
            </Box>
            
            <Banner tone="info">
              <Text variant="bodyXs" as="p">Vui lòng kiểm tra kỹ thông tin đơn hàng trước khi xác nhận thanh toán.</Text>
            </Banner>
          </BlockStack>
        )}
      </Modal.Section>
    </Modal>
  );
}
