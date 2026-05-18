'use client';

import { Icon } from '@iconify/react';
import { useState, useMemo } from 'react';
import { Button, toast, Input, Select, ListBox } from '@heroui/react';


import { createPendingOrderAction, payOrderAction } from '../actions/purchase.action';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

import { useQuery } from '@tanstack/react-query';

interface BuyProxyModalProps { open: boolean; onClose: () => void; }

type ProxyType = 'ipv6' | 'ipv4' | 'ipv4_shared';
const BASE_PRICES: Record<ProxyType, number> = { ipv6: 5000, ipv4: 50000, ipv4_shared: 15000 };
const PERIODS = [ { value: '3', label: '3 ngày' }, { value: '7', label: '1 tuần' }, { value: '30', label: '1 tháng' } ];

export function BuyProxyModal({ open, onClose }: BuyProxyModalProps) {
  const router = useRouter();
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['available-locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations/available', { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as { id: string; name: string; countryCode: string }[];
    },
    staleTime: 0,
    gcTime: 0,
  });
  const [step, setStep] = useState(0); // 0: Selection, 1: Confirmation
  const [orderId, setOrderId] = useState<string | null>(null);

  const countriesOptions = useMemo(() => {
    if (!locationsData || locationsData.length === 0) return [];
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
          toast.danger(result.message || 'Lỗi khi tạo đơn hàng');
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
        toast.danger(result.message); 
        if (result.message?.includes('Số dư')) {
           onClose();
           setStep(0);
           setOrderId(null);
           router.push('/user/orders');
        }
      }
    } catch { 
      toast.danger('Có lỗi xảy ra khi thanh toán.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const orderDateStr = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-800">
            {step === 0 ? "Mua Proxy mới" : "Xác nhận đơn hàng"}
          </h3>
          <button 
            onClick={() => { onClose(); setStep(0); setOrderId(null); }}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Icon icon="lucide:x" className="w-4 h-4"  />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 text-xs bg-white">
          {step === 0 ? (
            <>
              {/* Proxy Type Segmented Buttons */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500">Loại Proxy</label>
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 border border-slate-200 rounded-lg h-9">
                  <button
                    type="button"
                    onClick={() => setActiveType('ipv6')}
                    className={`text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      activeType === 'ipv6'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    IPv6
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveType('ipv4')}
                    className={`text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      activeType === 'ipv4'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    IPv4 Private
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveType('ipv4_shared')}
                    className={`text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      activeType === 'ipv4_shared'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    IPv4 Shared
                  </button>
                </div>
              </div>

              {/* Country & Period columns */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Quốc gia</label>
                  <Select
                    selectedKey={country}
                    onSelectionChange={(key) => setCountry(key as string)}
                    isDisabled={locationsLoading || countriesOptions.length === 0}
                    className="w-full"
                  >
                    <Select.Trigger className="w-full text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg h-9 px-3 outline-none disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer flex items-center justify-between transition-all duration-150">
                      <span>
                        {locationsLoading
                          ? 'Đang tải...'
                          : countriesOptions.length === 0
                          ? 'Không khả dụng'
                          : countriesOptions.find(o => o.value === country)?.label || ''}
                      </span>
                      <Select.Indicator>
                        <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-slate-400" />
                      </Select.Indicator>
                    </Select.Trigger>
                    <Select.Popover className="w-[--trigger-width] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                      <ListBox className="p-1 outline-none">
                        {countriesOptions.map(opt => (
                          <ListBox.Item
                            key={opt.value}
                            id={opt.value}
                            textValue={opt.label}
                            className="flex items-center justify-between px-2 py-1 text-xs rounded text-slate-600 hover:bg-slate-50 cursor-pointer outline-none data-[focused]:bg-slate-100 data-[selected]:bg-slate-100 data-[selected]:text-blue-600 font-medium"
                          >
                            {({ isSelected }) => (
                              <>
                                <span>{opt.label}</span>
                                {isSelected && (
                                  <Icon icon="lucide:check" className="w-3.5 h-3.5 text-blue-600" />
                                )}
                              </>
                            )}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Thời hạn</label>
                  <Select
                    selectedKey={period}
                    onSelectionChange={(key) => setPeriod(key as string)}
                    className="w-full"
                  >
                    <Select.Trigger className="w-full text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg h-9 px-3 outline-none cursor-pointer flex items-center justify-between transition-all duration-150">
                      <span>
                        {PERIODS.find(p => p.value === period)?.label || ''}
                      </span>
                      <Select.Indicator>
                        <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-slate-400" />
                      </Select.Indicator>
                    </Select.Trigger>
                    <Select.Popover className="w-[--trigger-width] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                      <ListBox className="p-1 outline-none">
                        {PERIODS.map(p => (
                          <ListBox.Item
                            key={p.value}
                            id={p.value}
                            textValue={p.label}
                            className="flex items-center justify-between px-2 py-1 text-xs rounded text-slate-600 hover:bg-slate-50 cursor-pointer outline-none data-[focused]:bg-slate-100 data-[selected]:bg-slate-100 data-[selected]:text-blue-600 font-medium"
                          >
                            {({ isSelected }) => (
                              <>
                                <span>{p.label}</span>
                                {isSelected && (
                                  <Icon icon="lucide:check" className="w-3.5 h-3.5 text-blue-600" />
                                )}
                              </>
                            )}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Số lượng</label>
                <Input
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCount(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-semibold text-slate-600"
                />
              </div>

              {/* Tạm tính */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-500">Tạm tính:</span>
                <span className="font-extrabold text-slate-800 text-sm">{totalPrice.toLocaleString()}đ</span>
              </div>
            </>
          ) : (
            <>
              {/* Order Info Summary */}
              <div className="border border-slate-200 bg-white rounded-lg p-3.5 space-y-2">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-slate-400 font-medium">Mã đơn hàng:</span>
                  <div className="flex-grow border-b border-dotted border-slate-200"></div>
                  <span className="font-mono font-bold text-slate-800">ORD-{orderId?.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-slate-400 font-medium">Ngày tạo:</span>
                  <div className="flex-grow border-b border-dotted border-slate-200"></div>
                  <span className="font-semibold text-slate-700">{orderDateStr}</span>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-slate-400 font-medium">Loại đơn:</span>
                  <div className="flex-grow border-b border-dotted border-slate-200"></div>
                  <span className="font-semibold text-slate-700">Mua hàng</span>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-slate-400 font-medium">Số lượng IP:</span>
                  <div className="flex-grow border-b border-dotted border-slate-200"></div>
                  <span className="font-mono font-bold text-slate-800">{count}</span>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-slate-400 font-medium">Số ngày:</span>
                  <div className="flex-grow border-b border-dotted border-slate-200"></div>
                  <span className="font-mono font-bold text-slate-800">{period}</span>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap pt-1 border-t border-slate-100">
                  <span className="font-bold text-slate-500">Tổng thanh toán:</span>
                  <div className="flex-grow border-b border-dotted border-slate-200"></div>
                  <span className="font-extrabold text-blue-600 text-sm">{totalPrice.toLocaleString()}đ</span>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-[10px] text-blue-700 font-semibold flex items-start gap-1.5 leading-relaxed">
                <Icon icon="lucide:info" className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5"  />
                <span>Vui lòng kiểm tra kỹ thông tin đơn hàng trước khi xác nhận thanh toán.</span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <Button
            size="sm"
            onPress={() => {
              if (step === 0) {
                onClose();
              } else {
                setStep(0);
              }
            }}
            className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
          >
            {step === 0 ? 'Hủy bỏ' : 'Quay lại'}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onPress={handlePurchase}
            isDisabled={loading || (step === 0 && (locationsLoading || countriesOptions.length === 0 || !country))}
            className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
          >
            {loading && (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            )}
            {step === 0 ? "Tiến hành thanh toán" : `Thanh toán ${totalPrice.toLocaleString()}đ`}
          </Button>
        </div>
      </div>
    </div>
  );
}
