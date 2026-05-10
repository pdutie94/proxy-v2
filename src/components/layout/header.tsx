import { auth } from '@/auth';
import { User } from 'lucide-react';
import { MobileTrigger } from './mobile-trigger';

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b bg-white px-4">
      <div className="flex items-center">
        <MobileTrigger />
        <h1 className="text-sm font-semibold text-slate-900">
          Dashboard
        </h1>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end leading-none">
          <span className="text-[12px] font-medium text-slate-700">{session?.user?.email}</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
            {(session?.user as any)?.role || 'USER'}
          </span>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
          <User className="h-4 w-4 text-slate-600" />
        </div>
      </div>
    </header>
  );
}
