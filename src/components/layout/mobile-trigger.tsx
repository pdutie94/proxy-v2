"use client";

import { Menu } from 'lucide-react';
import { useSidebarStore } from '@/hooks/use-sidebar-store';

export function MobileTrigger() {
  const { toggleMobile } = useSidebarStore();

  return (
    <button 
      onClick={toggleMobile}
      className="mr-3 flex h-8 w-8 items-center justify-center rounded-md border bg-white hover:bg-slate-50 text-slate-500 md:hidden"
    >
      <Menu className="h-4 w-4" />
    </button>
  );
}
