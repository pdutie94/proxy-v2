'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Modal } from '@/components/ui/modal';
import { LoginForm } from '@/modules/auth/components/login-form-tw';
import { RegisterForm } from '@/modules/auth/components/register-form';
import { toast } from 'sonner';
import { purchaseProxyAction } from '../actions/purchase.action';
import { useRouter } from 'next/navigation';
import { CustomSelect } from '@/components/ui/custom-select';

type ProxyType = 'ipv6' | 'ipv4' | 'ipv4_shared';

const COUNTRIES = [
  { value: 'VN', label: 'Vietnam', icon: '🇻🇳' },
  { value: 'US', label: 'United States', icon: '🇺🇸' },
  { value: 'UK', label: 'United Kingdom', icon: '🇬🇧' },
  { value: 'RU', label: 'Russia', icon: '🇷🇺' },
];

const PERIODS = [
  { value: 3, label: '3 ngày' },
  { value: 7, label: '1 tuần' },
  { value: 30, label: '1 tháng' },
];

const BASE_PRICES: Record<ProxyType, number> = {
  ipv6: 5000,
  ipv4: 50000,
  ipv4_shared: 15000,
};

export function BuyProxyWidget() {
  const router = useRouter();
  const { data: session } = useSession();
  const [type, setType] = useState<ProxyType>('ipv6');
  const [country, setCountry] = useState('VN');
  const [count, setCount] = useState(1);
  const [period, setPeriod] = useState(30);
  
  const [modal, setModal] = useState<'login' | 'register' | 'checkout' | 'deposit' | null>(null);
  const [loading, setLoading] = useState(false);

  const totalPrice = useMemo(() => {
    const base = BASE_PRICES[type];
    const multiplier = period === 3 ? 0.2 : period === 7 ? 0.4 : 1;
    return Math.round(base * count * multiplier);
  }, [type, count, period]);

  const handleBuyClick = () => {
    if (!session) {
      setModal('login');
      return;
    }
    setModal('checkout');
  };

  const handleConfirmPurchase = async () => {
    setLoading(true);
    try {
      const result = await purchaseProxyAction({
        type,
        country,
        count,
        days: period,
        totalAmount: totalPrice
      });

      if (result.success) {
        toast.success(result.message);
        setModal(null);
        router.push('/portal/proxies');
      } else if (result.errorType === 'INSUFFICIENT_BALANCE') {
        setModal('deposit');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Tab Switcher */}
      <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
        {(['ipv6', 'ipv4', 'ipv4_shared'] as ProxyType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
              type === t ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            {t === 'ipv6' ? 'IPv6' : t === 'ipv4' ? 'IPv4 Private' : 'IPv4 Shared'}
          </button>
        ))}
      </div>

      {/* Main Form Card */}
      <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="p-8 lg:p-12 space-y-10">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CustomSelect 
              label="Quốc gia"
              options={COUNTRIES}
              value={country}
              onChange={setCountry}
            />
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Số lượng</label>
                <input 
                  type="number"
                  min="1"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-12 px-5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-600 transition-all text-white font-bold text-sm hover:bg-white/10"
                />
              </div>
              <CustomSelect 
                label="Thời hạn"
                options={PERIODS}
                value={period}
                onChange={setPeriod}
              />
            </div>
          </div>

          {/* Pricing & Submit */}
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Tổng thanh toán</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{totalPrice.toLocaleString()}</span>
                <span className="text-sm font-black text-blue-500 uppercase tracking-widest">VNĐ</span>
              </div>
            </div>
            
            <button 
              onClick={handleBuyClick}
              className="w-full md:w-auto px-16 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-2xl shadow-blue-600/20 active:scale-95 hover:-translate-y-1"
            >
              Mua Ngay
            </button>
          </div>
        </div>
      </div>

      <div className="text-center pt-2">
         <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">
            Hạ tầng Proxy sạch • Cấp phát tức thì • Hỗ trợ 24/7
         </p>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={modal === 'login' || modal === 'register'} 
        onClose={() => setModal(null)} 
        title={modal === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}
      >
        <div className="text-slate-900">
          {modal === 'login' ? (
            <div>
              <LoginForm />
              <p className="mt-6 text-center text-xs text-slate-500 font-medium">
                Chưa có tài khoản?{' '}
                <button onClick={() => setModal('register')} className="text-blue-600 font-bold hover:underline">Đăng ký ngay</button>
              </p>
            </div>
          ) : (
            <div>
              <RegisterForm />
              <p className="mt-6 text-center text-xs text-slate-500 font-medium">
                Đã có tài khoản?{' '}
                <button onClick={() => setModal('login')} className="text-blue-600 font-bold hover:underline">Đăng nhập ngay</button>
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Checkout Modal */}
      <Modal 
        isOpen={modal === 'checkout'} 
        onClose={() => setModal(null)} 
        title="Xác nhận thanh toán"
      >
        <div className="space-y-8 text-slate-900">
          <div className="bg-slate-50 p-8 rounded-[32px] space-y-4 border border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-black uppercase tracking-widest">Dịch vụ:</span>
              <span className="font-black text-slate-900 text-sm">{type.toUpperCase()} Proxy</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-black uppercase tracking-widest">Số lượng:</span>
              <span className="font-black text-slate-900 text-sm">{count} cổng</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-black uppercase tracking-widest">Thời hạn:</span>
              <span className="font-black text-slate-900 text-sm">{period} ngày</span>
            </div>
            <div className="border-t border-slate-200 pt-8 flex justify-between items-baseline">
              <span className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Thành tiền:</span>
              <span className="font-black text-3xl text-blue-600">{totalPrice.toLocaleString()}đ</span>
            </div>
          </div>
          <button 
            onClick={handleConfirmPurchase}
            disabled={loading}
            className="w-full py-5 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
            Xác nhận & Thanh toán
          </button>
        </div>
      </Modal>

      {/* Deposit Modal */}
      <Modal 
        isOpen={modal === 'deposit'} 
        onClose={() => setModal(null)} 
        title="Nạp tiền tài khoản"
      >
        <div className="space-y-8 text-slate-900">
          <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex gap-5 items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 flex-shrink-0 text-2xl font-black shadow-inner">!</div>
            <p className="text-sm text-red-800 font-bold leading-tight">Số dư không đủ. Vui lòng nạp thêm tiền để tiếp tục.</p>
          </div>
          <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl">
            <h4 className="font-black uppercase tracking-widest text-[10px] opacity-40 mb-6">Chuyển khoản tới:</h4>
            <div className="space-y-1 mb-8">
              <p className="text-2xl font-black tracking-tight">MB Bank: 123456789</p>
              <p className="text-sm font-bold opacity-70">Chủ TK: NGUYEN VAN A</p>
            </div>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-inner">
              <p className="text-[10px] uppercase tracking-widest opacity-40 mb-3 font-black">Nội dung nạp:</p>
              <p className="text-xl font-mono font-black text-blue-400 uppercase tracking-widest">NAP {session?.user?.email?.split('@')[0]}</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-[0.3em]">Hệ thống cộng tiền tự động</p>
        </div>
      </Modal>
    </div>
  );
}
