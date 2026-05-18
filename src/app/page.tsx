import { auth } from '@/auth';
import Link from 'next/link';
import { BuyProxyWidget } from '@/modules/store/components/buy-proxy-widget';
import prisma from '@/lib/prisma';

export default async function LandingPage() {
  const session = await auth();
  
  let userBalance = 0;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true }
    });
    userBalance = Number(user?.balance || 0);
  }

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-white selection:bg-blue-500/30 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">P</div>
            <span className="text-xl font-black tracking-tighter uppercase">Proxy<span className="text-blue-500">V2</span></span>
          </div>

          <nav className="flex items-center gap-6">
            {session ? (
              <>
                <div className="flex flex-col items-end mr-2">
                   <span className="text-xs font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Số dư hiện tại</span>
                   <span className="text-xs font-black text-white leading-none">{userBalance.toLocaleString('vi-VN')}đ</span>
                </div>
                <Link href={session.user?.role === 'ADMIN' ? '/dashboard' : '/user/proxies'} className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">
                  {session.user?.role === 'ADMIN' ? 'Dashboard' : 'Tài khoản'}
                </Link>
              </>
            ) : (
              <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">
                Đăng nhập
              </Link>
            )}
            <Link href={session ? "/api/auth/signout" : "/register"} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest px-6 py-2 rounded-lg transition-all">
              {session ? 'Đăng xuất' : 'Đăng ký ngay'}
            </Link>
          </nav>
        </div>
      </header>
      
      {/* ... rest of main content ... */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-4">
        {/* Title Block - Compact */}
        <div className="text-center mb-10 max-w-2xl flex-shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-4">
            <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
            Hạ tầng Thế hệ mới
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-tight">
            Mua Proxy <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Siêu Tốc</span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed max-w-lg mx-auto">
            Hệ thống Proxy riêng biệt, tốc độ 1Gbps, khởi tạo tự động. <br />
            Phục vụ hoàn hảo cho MMO, Tự động hóa và Xử lý dữ liệu.
          </p>
        </div>

        {/* Widget Container - Compact */}
        <div className="w-full max-w-2xl flex-shrink-0">
           <BuyProxyWidget />
        </div>

        {/* Compact Trust Stats */}
        <div className="mt-12 flex items-center justify-center gap-10 opacity-30 flex-shrink-0">
           <div className="flex items-center gap-3">
              <span className="text-lg font-black tracking-tight">2s</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 leading-none">Khởi tạo<br/>Tức thì</span>
           </div>
           <div className="w-px h-6 bg-white/10"></div>
           <div className="flex items-center gap-3">
              <span className="text-lg font-black tracking-tight">99.9%</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 leading-none">Độ ổn định<br/>Cao</span>
           </div>
           <div className="w-px h-6 bg-white/10"></div>
           <div className="flex items-center gap-3">
              <span className="text-lg font-black tracking-tight">HTTP/S5</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 leading-none">Hỗ trợ<br/>Toàn cầu</span>
           </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 py-6 text-center border-t border-white/5 bg-black/10 flex-shrink-0">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} ProxyV2 Toàn cầu • Giải pháp Doanh nghiệp
          </p>
          {session?.user?.role === 'ADMIN' && (
            <Link href="/dashboard" className="text-xs font-black text-blue-500/60 hover:text-blue-500 transition-colors uppercase tracking-[0.2em]">
              Quản trị viên
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
