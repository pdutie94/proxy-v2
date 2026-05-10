"use client";

import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';

interface DashboardContainerProps {
  header: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardContainer({ header, children }: DashboardContainerProps) {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div 
        className={cn(
          "transition-all duration-300",
          "md:pl-[240px]",
          isCollapsed ? "md:pl-[70px]" : "md:pl-[240px]"
        )}
      >
        {header}
        <main className="p-4 max-w-[1000px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
