import { auth } from '@/auth';
import Link from 'next/link';

export default async function PortalPage() {
  const session = await auth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Chào mừng, {session?.user?.email?.split('@')[0]}</h1>
        <p className="text-slate-500 mt-1">Hôm nay bạn muốn thuê bao nhiêu Proxy?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Số dư ví</p>
          <p className="text-3xl font-bold text-slate-900">0đ</p>
          <Link href="/portal/wallet" className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline">Nạp tiền ngay →</Link>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Proxy đang chạy</p>
          <p className="text-3xl font-bold text-slate-900">0</p>
          <Link href="/portal/proxies" className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline">Quản lý proxy →</Link>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
          <Link href="/portal/store" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors">
            Thuê Proxy Mới
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Lịch sử đơn hàng gần đây</h3>
        </div>
        <div className="p-12 text-center">
          <p className="text-slate-400">Bạn chưa có đơn hàng nào.</p>
        </div>
      </div>
    </div>
  );
}
