"use client";

import { Icon } from '@iconify/react';
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { getUserHeaderInfoAction } from "@/modules/auth/actions/balance.action";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { AuthUser } from "@/types";

import { 
  Avatar, 
  Button, 
  Dropdown, 
  DropdownTrigger, 
  Tooltip,
  Chip 
} from "@heroui/react";

interface DashboardLayoutHeroUIProps {
  children: React.ReactNode;
}

export function DashboardLayoutHeroUI({ children }: DashboardLayoutHeroUIProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ["user-header-info"],
    queryFn: () => getUserHeaderInfoAction(),
    enabled: !!session?.user?.id,
    refetchInterval: 60000,
  });

  // Close sidebar on path change (deferred with setTimeout to avoid synchronous setState inside render effect)
  useEffect(() => {
    const timer = setTimeout(() => setIsMobileSidebarOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const userRole = (session?.user as AuthUser | undefined)?.role || "USER";
  const isAdmin = userRole === "ADMIN";
  const isModerator = userRole === "MODERATOR";

  const navigationItems = [
    {
      label: "Bảng điều khiển",
      icon: "lucide:home",
      url: "/dashboard",
      active: pathname === "/dashboard",
    },
    ...(isAdmin ? [
      {
        label: "Máy chủ",
        icon: "lucide:server",
        url: "/dashboard/servers",
        active: pathname.startsWith("/dashboard/servers"),
      },
      {
        label: "Vị trí",
        icon: "lucide:map-pin",
        url: "/dashboard/locations",
        active: pathname.startsWith("/dashboard/locations"),
      },
    ] : []),
    ...(isAdmin || isModerator ? [
      {
        label: "Proxy",
        icon: "lucide:shield-check",
        url: "/dashboard/proxies",
        active: pathname.startsWith("/dashboard/proxies"),
      },
    ] : []),
    ...(isAdmin ? [
      {
        label: "Người dùng",
        icon: "lucide:users",
        url: "/dashboard/users",
        active: pathname.startsWith("/dashboard/users"),
      },
      {
        label: "Giao dịch",
        icon: "lucide:receipt",
        url: "/dashboard/transactions",
        active: pathname.startsWith("/dashboard/transactions"),
      },
    ] : []),
    ...(isAdmin || isModerator ? [
      {
        label: "Nhật ký hệ thống",
        icon: "lucide:history",
        url: "/dashboard/logs",
        active: pathname.startsWith("/dashboard/logs"),
      },
    ] : []),
    ...(isAdmin ? [
      {
        label: "Cài đặt",
        icon: "lucide:settings",
        url: "/dashboard/settings",
        active: pathname.startsWith("/dashboard/settings"),
      },
    ] : []),
  ];

  const displayName = userData?.displayName || session?.user?.name || session?.user?.email || "Quản trị viên";
  const initials = displayName.charAt(0).toUpperCase();

  const getPageTitle = () => {
    const activeItem = navigationItems.find(item => item.active);
    if (activeItem) return activeItem.label;
    if (pathname.includes("/profile")) return "Hồ sơ cá nhân";
    return "Quản trị";
  };

  const handleNavigation = (url: string) => {
    router.push(url);
  };

  return (
    <RealtimeProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-slate-200 bg-white sticky top-0 h-screen shrink-0 z-30">
          {/* User profile header card */}
          <div className="p-4 pb-2 flex items-center gap-3">
            <Avatar className="w-10 h-10 text-white font-bold bg-gradient-to-tr from-blue-500 to-sky-400 cursor-pointer shadow-sm ring-2 ring-blue-500/10 flex items-center justify-center text-sm rounded-full">
              <Avatar.Fallback>{initials}</Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-900 truncate">
                {displayName}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {userRole === "ADMIN" ? "Quản trị viên" : "Điều phối viên"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
            {navigationItems.map((item, idx) => {
              
              return (
                <button
                  key={idx}
                  onClick={() => handleNavigation(item.url)}
                  className={`w-full flex items-center gap-3 px-2 py-1.5 text-sm font-semibold rounded-xl transition-all duration-200 group cursor-pointer ${
                    item.active
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-900"
                  }`}
                >
                  <Icon icon={item.icon} className={`w-4 h-4 shrink-0 transition-colors ${
                    item.active ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                  }`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 space-y-1">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
            >
              <Icon icon="lucide:log-out" className="w-4 h-4 text-red-400"  />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* MOBILE SIDEBAR DRAWERS */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            {/* Sidebar content */}
            <aside className="relative flex flex-col w-60 max-w-xs bg-white border-r border-slate-200 h-full shadow-xl transition-transform duration-300 transform translate-x-0">
              <div className="p-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 text-white font-bold bg-gradient-to-tr from-blue-500 to-sky-400 flex items-center justify-center text-xs rounded-full">
                    <Avatar.Fallback>{initials}</Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-955 truncate">{displayName}</span>
                    <span className="text-xs text-slate-500 font-medium">{userRole === "ADMIN" ? "Quản trị viên" : "Điều phối viên"}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <Icon icon="lucide:x" className="w-4 h-4"  />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
                {navigationItems.map((item, idx) => {
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleNavigation(item.url)}
                      className={`w-full flex items-center gap-3 px-2 py-1.5 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                        item.active
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-900"
                      }`}
                    >
                      <Icon icon={item.icon} className={`w-4 h-4 shrink-0 transition-colors ${
                        item.active ? "text-slate-900" : "text-slate-400"
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar Footer */}
              <div className="p-3 border-t border-slate-100 space-y-1">
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
                >
                  <Icon icon="lucide:log-out" className="w-4 h-4 text-red-400"  />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* HEADER */}
          <header className="h-14 border-b border-slate-200/60 bg-white sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6">
            {/* Left title and Mobile Toggle */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              >
                <Icon icon="lucide:menu" className="w-5 h-5"  />
              </button>
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                {getPageTitle()}
              </h1>
            </div>

            {/* Right section widgets */}
            <div className="flex items-center gap-2.5">
              {/* User role Chip */}
              <Chip 
                size="sm" 
                variant="soft" 
                color={userRole === "ADMIN" ? "accent" : "default"}
                className="text-xs h-6 font-medium capitalize hidden sm:inline-flex"
              >
                {userRole === "ADMIN" ? "Quản trị" : "Điều phối viên"}
              </Chip>

              {/* Notification Bell */}
              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className="text-slate-500 hover:text-slate-800 border-none hover:bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    <div className="relative">
                      <Icon icon="lucide:bell" className="w-4 h-4"  />
                      <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full" />
                    </div>
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content className="px-2 py-1 text-xs text-white bg-slate-900 rounded shadow-sm z-50">
                  Thông báo
                </Tooltip.Content>
              </Tooltip>

              {/* Quick Action Invite/Plus */}
              {isAdmin && (
                <Tooltip>
                  <Tooltip.Trigger>
                    <Button
                      size="sm"
                      variant="primary"
                      className="font-medium h-9 text-xs gap-1 shadow-sm hidden md:flex rounded-md"
                      onClick={() => router.push("/dashboard/servers?add=true")}
                    >
                      <Icon icon="lucide:plus" className="w-3.5 h-3.5"  />
                      <span>Thêm Server</span>
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="px-2 py-1 text-xs text-white bg-slate-900 rounded shadow-sm z-50">
                    Thêm máy chủ mới
                  </Tooltip.Content>
                </Tooltip>
              )}

              {/* Separator line */}
              <div className="w-px h-5 bg-slate-200 hidden sm:block mx-1" />

              {/* Profile Dropdown */}
              <Dropdown>
                <DropdownTrigger>
                  <div className="flex items-center gap-1 p-0.5 rounded-full hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none">
                    <Avatar className="text-white font-bold bg-gradient-to-tr from-blue-500 to-sky-400 cursor-pointer w-7 h-7 flex items-center justify-center text-xs rounded-full">
                      <Avatar.Fallback>{initials}</Avatar.Fallback>
                    </Avatar>
                    <Icon icon="lucide:chevron-down" className="w-3.5 h-3.5 text-slate-400 hidden sm:block"  />
                  </div>
                </DropdownTrigger>
                <Dropdown.Popover placement="bottom end" className="p-1 bg-white border border-slate-200 rounded-lg shadow-sm outline-none">
                  <Dropdown.Menu 
                    aria-label="User Profile Actions" 
                    className="outline-none min-w-44"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 mb-1 pointer-events-none">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Đăng nhập với email</p>
                      <p className="font-semibold text-slate-800 text-xs truncate mt-0.5">{session?.user?.email}</p>
                    </div>
                    <Dropdown.Item 
                      key="profile" 
                      className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer outline-none block"
                      onClick={() => router.push("/user/profile")}
                    >
                      Hồ sơ cá nhân
                    </Dropdown.Item>
                    <Dropdown.Item 
                      key="portal" 
                      className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer outline-none block"
                      onClick={() => router.push("/")}
                    >
                      Về Trang Portal Thành viên
                    </Dropdown.Item>
                    <hr className="border-slate-100 my-1" />
                    <Dropdown.Item 
                      key="logout" 
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md cursor-pointer outline-none block"
                      onClick={() => signOut()}
                    >
                      Đăng xuất
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
          </header>

          {/* MAIN SCREEN CONTENT */}
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
