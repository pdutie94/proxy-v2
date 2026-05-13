import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UserProxyTable } from '@/modules/proxies/components/user-proxy-table';

export default async function UserProxiesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const proxies = await prisma.proxy.findMany({
    where: { userId: session.user.id },
    include: { 
      server: {
        include: {
          location: true
        }
      } 
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Proxy của tôi</h1>
          <p className="text-slate-500 text-sm font-medium">Quản lý và gia hạn các kết nối của bạn</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Xuất file TXT
          </button>
        </div>
      </div>

      <UserProxyTable proxies={proxies} />
      
      {/* Tip Box */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-4 items-start">
         <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0 text-xl">💡</div>
         <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-900">Mẹo nhỏ:</h4>
            <p className="text-xs text-blue-700 leading-relaxed font-medium">
               Đối với Proxy IPv6, bạn có thể &quot;Xoay IP&quot; không giới hạn để làm mới địa chỉ IP của mình. 
               Hệ thống sẽ tự động cập nhật IP mới vào cổng hiện tại của bạn trong khoảng 2-3 giây.
            </p>
         </div>
      </div>
    </div>
  );
}
