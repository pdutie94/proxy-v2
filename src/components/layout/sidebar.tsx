"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Server, 
  ShieldCheck, 
  Users, 
  Settings, 
  LogOut,
  ListOrdered
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Server, label: 'Servers', href: '/dashboard/servers' },
  { icon: ShieldCheck, label: 'Proxies', href: '/dashboard/proxies' },
  { icon: Users, label: 'Users', href: '/dashboard/users' },
  { icon: ListOrdered, label: 'Logs', href: '/dashboard/logs' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[230px] border-r bg-white">
      <div className="flex h-full flex-col px-2 py-4">
        <div className="mb-6 flex items-center px-2">
          <ShieldCheck className="mr-2 h-5 w-5 text-blue-600" />
          <span className="text-base font-bold tracking-tight text-slate-900">ProxyV2</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  isActive 
                    ? "bg-slate-100 text-blue-600 font-medium" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className="mr-2.5 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center rounded-md px-2.5 py-1.5 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="mr-2.5 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
