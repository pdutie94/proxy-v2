'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { purchaseProxyAction } from '../actions/purchase.action';

interface Package {
  id: string;
  name: string;
  price: number;
  proxies: number;
  duration: string;
  features: string[];
  recommended?: boolean;
}

const PACKAGES: Package[] = [
  {
    id: 'starter',
    name: 'Khởi đầu',
    price: 100000,
    proxies: 10,
    duration: '30 ngày',
    features: ['10 Proxy IPv6', 'Tự động xoay IP', 'Băng thông 1Gbps', 'Hỗ trợ ticket'],
  },
  {
    id: 'pro',
    name: 'Chuyên nghiệp',
    price: 500000,
    proxies: 60,
    duration: '30 ngày',
    features: ['60 Proxy IPv6', 'Tốc độ ưu tiên', 'API điều khiển', 'Hỗ trợ 24/7'],
    recommended: true,
  },
  {
    id: 'elite',
    name: 'Đẳng cấp',
    price: 1500000,
    proxies: 200,
    duration: '30 ngày',
    features: ['200 Proxy IPv6', 'Subnet riêng biệt', 'Uptime 99.99%', 'Account Manager riêng'],
  }
];

export function PackageList() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handlePurchase = async (pkg: Package) => {
    if (!confirm(`Bạn có chắc chắn muốn mua gói "${pkg.name}" với giá ${pkg.price.toLocaleString()}đ?`)) {
      return;
    }

    setLoadingId(pkg.id);
    try {
      const result = await purchaseProxyAction(pkg.id);
      if (result.success) {
        toast.success(result.message);
        // Maybe redirect to proxies or orders
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thanh toán.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {PACKAGES.map((pkg) => (
        <div 
          key={pkg.id} 
          className={`bg-white rounded-2xl border p-8 flex flex-col shadow-sm transition-all hover:shadow-md ${
            pkg.recommended ? 'border-blue-600 ring-4 ring-blue-50' : 'border-slate-200'
          }`}
        >
          {pkg.recommended && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest w-fit mb-4">
              Khuyên dùng
            </span>
          )}
          <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
          <div className="mt-4 mb-6">
            <span className="text-4xl font-extrabold text-slate-900">{pkg.price.toLocaleString()}đ</span>
            <span className="text-slate-500 text-sm font-medium">/{pkg.duration}</span>
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            {pkg.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handlePurchase(pkg)}
            disabled={!!loadingId}
            className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
              pkg.recommended 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100' 
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {loadingId === pkg.id ? (
               <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : null}
            {loadingId === pkg.id ? 'Đang xử lý...' : 'Mua gói ngay'}
          </button>
        </div>
      ))}
    </div>
  );
}
