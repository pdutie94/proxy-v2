'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { UserProxyTable } from '@/modules/proxies/components/user-proxy-table';
import { 
  Wallet, 
  Shield, 
  ShoppingBag, 
  History, 
  User, 
  LogOut, 
  Mail, 
  AlertCircle,
  PlusCircle,
  Download,
  ExternalLink,
  Lock,
  CreditCard,
  Banknote,
  Smartphone,
  Bitcoin
} from 'lucide-react';

type Tab = 'balance' | 'proxies' | 'orders' | 'payments' | 'profile';

import { ProxyWithServer } from '@/types';

interface AccountLayoutProps {
  user: {
    id: string;
    email: string;
    balance: number | string;
    emailVerified?: Date | null;
  };
  proxies: ProxyWithServer[];
  orders: {
    id: string;
    totalAmount: number | string;
    status: string;
    createdAt: Date | string;
  }[];
  transactions: {
    id: string;
    amount: number | string;
    type: string;
    status: string;
    createdAt: Date | string;
  }[];
}

export default function AccountLayout({ 
  user, 
  proxies, 
  orders, 
  transactions 
}: AccountLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('proxies');

  const menuItems = [
    { id: 'balance', label: 'Số dư', icon: Wallet, extra: `${Number(user.balance).toLocaleString()}đ` },
    { id: 'proxies', label: 'Proxy', icon: Shield },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag, badge: orders.length > 0 ? orders.length : undefined },
    { id: 'payments', label: 'Giao dịch', icon: History },
    { id: 'profile', label: 'Hồ sơ', icon: User },
  ];

  const tabTitles: Record<Tab, string> = {
    balance: 'Số dư tài khoản',
    proxies: 'Quản lý Proxy',
    orders: 'Lịch sử đơn hàng',
    payments: 'Lịch sử giao dịch',
    profile: 'Thông tin cá nhân',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 flex flex-col">
      {/* Top Banner - Minimal */}
      {!user.emailVerified && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-center">
          <p className="text-xs text-amber-800 font-medium flex items-center justify-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Bạn cần xác nhận địa chỉ email để bảo mật tài khoản.
            <button className="text-amber-600 underline font-bold hover:no-underline ml-1">Gửi lại link</button>
          </p>
        </div>
      )}

      <div className="flex-1 max-w-6xl w-full mx-auto flex gap-8 py-8 px-4">
        {/* Sidebar - Compact */}
        <aside className="w-48 flex-shrink-0 space-y-0.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-bold transition-all rounded-md ${
                activeTab === item.id 
                  ? 'bg-[#c0392b] text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.extra && <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === item.id ? 'bg-black/20' : 'bg-slate-200 text-slate-600'}`}>{item.extra}</span>}
              {item.badge && <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === item.id ? 'bg-black/20' : 'bg-slate-200 text-slate-600'}`}>{item.badge}</span>}
            </button>
          ))}
          <div className="pt-2">
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-bold text-red-600 hover:bg-red-50 transition-all rounded-md"
            >
              <LogOut className="w-4 h-4" />
              Thoát
            </button>
          </div>
        </aside>

        {/* Main Content Area - Flat & Professional */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {tabTitles[activeTab]}
            </h1>
            <div className="text-[11px] text-slate-400 font-medium">ID: {user.id.slice(0, 8).toUpperCase()}</div>
          </div>

          {/* Tab Content: Proxies */}
          {activeTab === 'proxies' && (
            <div className="space-y-4">
               <div className="flex justify-end gap-2 mb-4">
                  <button onClick={() => setActiveTab('balance')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2">
                    <PlusCircle className="w-3.5 h-3.5" />
                    Nạp tiền
                  </button>
                  <Link href="/" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Mua Proxy
                  </Link>
               </div>
               
               <div className="flex flex-wrap gap-1.5 mb-6">
                  {[
                    { label: 'Gia hạn', count: 0 },
                    { label: 'Tự động gia hạn', count: 0 },
                    { label: 'Đổi loại', count: 0 },
                    { label: 'IP Auth', count: 0 },
                    { label: 'Xuất file', icon: Download }
                  ].map(btn => (
                    <button key={btn.label} className="bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded text-[10px] font-bold text-slate-500 transition-all flex items-center gap-1.5">
                      {btn.icon && <btn.icon className="w-3 h-3" />}
                      {btn.label}
                    </button>
                  ))}
               </div>

               <UserProxyTable proxies={proxies} />
            </div>
          )}

          {/* Tab Content: Balance */}
          {activeTab === 'balance' && (
            <div className="max-w-2xl space-y-8">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-between shadow-sm">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số dư hiện tại</p>
                    <h3 className="text-3xl font-bold text-slate-900">{Number(user.balance).toLocaleString()}đ</h3>
                 </div>
                 <div className="p-3 bg-blue-50 rounded-lg">
                    <Wallet className="w-8 h-8 text-blue-600" />
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div className="flex items-center gap-2.5 text-[11px] text-slate-500 bg-slate-100/50 p-3 rounded-lg border border-slate-200/50">
                    <input type="checkbox" id="terms" className="w-3.5 h-3.5 accent-blue-600 rounded" defaultChecked />
                    <label htmlFor="terms" className="font-medium">
                      Tôi đồng ý với <span className="text-blue-600 underline cursor-pointer">điều khoản sử dụng</span> và chính sách của hệ thống.
                    </label>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Phương thức nạp tiền:</label>
                    <div className="grid grid-cols-4 gap-3">
                       {[
                         { id: 'bank', label: 'Ngân hàng', icon: CreditCard },
                         { id: 'momo', label: 'Ví Momo', icon: Smartphone },
                         { id: 'crypto', label: 'Crypto', icon: Bitcoin },
                         { id: 'card', label: 'Thẻ cào', icon: Banknote },
                       ].map(method => (
                         <div key={method.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50/10 cursor-pointer transition-all group">
                            <method.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                            <span className="text-[9px] font-bold uppercase text-slate-400 group-hover:text-slate-900">{method.label}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Số tiền cần nạp (VNĐ):</label>
                    <div className="flex gap-3">
                       <input type="number" className="flex-1 h-11 bg-white border border-slate-200 rounded-lg px-4 font-bold text-sm outline-none focus:border-blue-600 transition-all" placeholder="Ví dụ: 50,000" />
                       <button className="bg-blue-600 text-white px-8 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm">Tiếp tục</button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* Tab Content: Payments */}
          {activeTab === 'payments' && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                    <th className="px-5 py-3">Mã GD</th>
                    <th className="px-5 py-3">Phương thức</th>
                    <th className="px-5 py-3">Số tiền</th>
                    <th className="px-5 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-xs italic">Không có dữ liệu</td></tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.id} className="text-xs hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-mono text-slate-400">#{tx.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-5 py-3"><span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">PAYMENT</span></td>
                        <td className="px-5 py-3 font-bold text-slate-900">{Number(tx.amount).toLocaleString()}đ</td>
                        <td className="px-5 py-3 text-slate-400">{format(new Date(tx.createdAt), 'dd/MM/yy, HH:mm')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab Content: Orders */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Dịch vụ</th>
                    <th className="px-5 py-3">Tổng tiền</th>
                    <th className="px-5 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-xs italic">Không có dữ liệu</td></tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className="text-xs hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-bold text-blue-600">#{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-5 py-3">
                           <div className="font-bold">Mua Proxy lẻ</div>
                           <div className="text-[10px] text-slate-400">{format(new Date(order.createdAt), 'dd.MM.yy, HH:mm')}</div>
                        </td>
                        <td className="px-5 py-3 font-bold">{Number(order.totalAmount).toLocaleString()}đ</td>
                        <td className="px-5 py-3">
                           <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase">Đã trả</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab Content: Profile */}
          {activeTab === 'profile' && (
            <div className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Email</label>
                    <div className="flex items-center gap-2 h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-500">
                       <Mail className="w-4 h-4" />
                       {user.email}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Đổi mật khẩu</label>
                    <div className="flex items-center gap-2 h-11 px-4 border border-slate-200 rounded-lg text-sm focus-within:border-blue-500 transition-all">
                       <Lock className="w-4 h-4 text-slate-400" />
                       <input type="password" className="flex-1 outline-none" placeholder="Nhập mật khẩu mới" />
                    </div>
                  </div>
                  <button className="w-full bg-slate-900 text-white h-11 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-black transition-all">Cập nhật hồ sơ</button>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
