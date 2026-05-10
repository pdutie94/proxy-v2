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
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { useSidebarStore } from '@/hooks/use-sidebar-store';

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
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebarStore();

  const sidebarClasses = cn(
    "fixed left-0 top-0 z-50 h-screen border-r bg-white transition-all duration-300",
    isCollapsed ? "w-[70px]" : "w-[240px]",
    "hidden md:block" // Desktop only here
  );

  const mobileSidebarClasses = cn(
    "fixed inset-0 z-50 md:hidden bg-black/50 transition-opacity duration-300",
    isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
  );

  const renderContent = () => (
    <div className="flex h-full flex-col px-3 py-4">
      <div className={cn("mb-8 flex items-center px-1", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <div className="flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-blue-600" />
            <span className="text-base font-bold tracking-tight text-slate-900">ProxyV2</span>
          </div>
        )}
        {isCollapsed && <ShieldCheck className="h-6 w-6 text-blue-600" />}
        
        <button 
          onClick={toggleCollapse}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded-md border bg-white hover:bg-slate-50 text-slate-500 shadow-sm transition-all"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => closeMobile()}
              className={cn(
                "group flex items-center rounded-md px-2.5 py-2 text-sm transition-all duration-200",
                isActive 
                  ? "bg-blue-50 text-blue-600 font-semibold" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-900",
                !isCollapsed && "mr-3"
              )} />
              {!isCollapsed && <span>{item.label}</span>}
              {isActive && !isCollapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-100">
        <button
          onClick={() => signOut()}
          className={cn(
            "flex w-full items-center rounded-md px-2.5 py-2 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={sidebarClasses}>
        {renderContent()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div className={mobileSidebarClasses} onClick={closeMobile}>
        <div 
          className={cn(
            "h-full w-[240px] bg-white transition-transform duration-300",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {renderContent()}
        </div>
      </div>
    </>
  );
}
