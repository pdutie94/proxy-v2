"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getUserHeaderInfoAction } from "@/modules/auth/actions/balance.action";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { 
  Home, 
  ShieldCheck, 
  Wallet, 
  ShoppingCart, 
  Receipt, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Settings,
  ChevronDown,
  AlertTriangle
} from "lucide-react";
import { 
  Avatar, 
  Button, 
  Dropdown, 
  DropdownTrigger, 
  Tooltip
} from "@heroui/react";

interface UserLayoutHeroUIProps {
  children: React.ReactNode;
}

export function UserLayoutHeroUI({ children }: UserLayoutHeroUIProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ["user-header-info"],
    queryFn: () => getUserHeaderInfoAction(),
    enabled: !!session?.user?.id,
    refetchInterval: 10000,
  });

  // Close sidebar on path change (deferred with setTimeout to avoid synchronous setState inside render effect)
  useEffect(() => {
    const timer = setTimeout(() => setIsMobileSidebarOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Handle inactive user
  useEffect(() => {
    if (userData && userData.isActive === false) {
      toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
      signOut({ callbackUrl: "/login" });
    }
  }, [userData]);

  const userRole = session?.user?.role || "USER";
  const isAdmin = userRole === "ADMIN";

  const mainNavItems = [
    {
      label: "Trang chủ",
      icon: Home,
      url: "/",
      active: pathname === "/",
    },
    ...(isAdmin ? [
      {
        label: "Quản trị viên",
        icon: Settings,
        url: "/dashboard",
        active: pathname.startsWith("/dashboard"),
      }
    ] : []),
  ];

  const serviceNavItems = [
    {
      label: "Proxy của tôi",
      icon: ShieldCheck,
      url: "/user/proxies",
      active: pathname === "/user/proxies",
    },
    {
      label: "Nạp tiền",
      icon: Wallet,
      url: "/user/balance",
      active: pathname === "/user/balance",
    },
  ];

  const historyNavItems = [
    {
      label: "Đơn hàng",
      icon: ShoppingCart,
      url: "/user/orders",
      active: pathname === "/user/orders",
    },
    {
      label: "Lịch sử giao dịch",
      icon: Receipt,
      url: "/user/payments",
      active: pathname === "/user/payments",
    },
  ];

  const accountNavItems = [
    {
      label: "Hồ sơ cá nhân",
      icon: User,
      url: "/user/profile",
      active: pathname === "/user/profile",
    },
  ];

  const displayName = userData?.displayName || session?.user?.name || session?.user?.email || "Thành viên";
  const initials = displayName.charAt(0).toUpperCase();

  const getPageTitle = () => {
    const allItems = [...mainNavItems, ...serviceNavItems, ...historyNavItems, ...accountNavItems];
    const activeItem = allItems.find(item => item.active);
    if (activeItem) return activeItem.label;
    if (pathname === "/") return "Mua Proxy";
    return "Thành viên";
  };

  const handleNavigation = (url: string) => {
    router.push(url);
  };

  return (
    <RealtimeProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-slate-200 bg-white sticky top-0 h-screen shrink-0 z-30">
          {/* User profile header card */}
          <div className="p-4 pb-2 flex items-center gap-3">
            <Avatar className="w-10 h-10 text-white font-bold bg-gradient-to-tr from-blue-500 to-indigo-500 cursor-pointer shadow-sm ring-2 ring-blue-500/10 flex items-center justify-center text-sm rounded-full">
              <Avatar.Fallback>{initials}</Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-900 truncate">
                {displayName}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Thành viên chính thức
              </span>
            </div>
          </div>

          {/* Balance Widget inside Sidebar */}
          <div className="px-3 pb-2">
            <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-2.5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Số dư khả dụng</span>
                <span className="text-sm font-bold text-slate-900">
                  {(userData?.balance || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="w-full text-xs font-semibold h-8 gap-1.5 rounded-md"
                onClick={() => handleNavigation("/user/balance")}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Nạp tiền ngay</span>
              </Button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-1 space-y-4 overflow-y-auto">
            {/* Core Section */}
            <div className="space-y-1">
              {mainNavItems.map((item, idx) => {
                const Icon = item.icon;
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
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      item.active ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Services Section */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Dịch vụ của tôi
              </span>
              {serviceNavItems.map((item, idx) => {
                const Icon = item.icon;
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
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      item.active ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* History Section */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Lịch sử
              </span>
              {historyNavItems.map((item, idx) => {
                const Icon = item.icon;
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
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      item.active ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Account Section */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Tài khoản
              </span>
              {accountNavItems.map((item, idx) => {
                const Icon = item.icon;
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
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      item.active ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 space-y-1">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
            >
              <LogOut className="w-4 h-4 text-red-400" />
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
                  <Avatar className="w-8 h-8 text-white font-bold bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-xs rounded-full">
                    <Avatar.Fallback>{initials}</Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-955 truncate">{displayName}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Thành viên</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Balance card */}
              <div className="px-3 pb-2">
                <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Số dư khả dụng</span>
                    <span className="text-sm font-bold text-slate-900">
                      {(userData?.balance || 0).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full text-xs font-semibold h-8 bg-blue-600 text-white border-none hover:bg-blue-700 rounded-md"
                    onClick={() => handleNavigation("/user/balance")}
                  >
                    Nạp tiền ngay
                  </Button>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-3 py-1 space-y-3 overflow-y-auto">
                <div className="space-y-1">
                  {mainNavItems.map((item, idx) => {
                    const Icon = item.icon;
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
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                          item.active ? "text-slate-900" : "text-slate-400"
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Dịch vụ</span>
                  {serviceNavItems.map((item, idx) => {
                    const Icon = item.icon;
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
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                          item.active ? "text-slate-900" : "text-slate-400"
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Lịch sử</span>
                  {historyNavItems.map((item, idx) => {
                    const Icon = item.icon;
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
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                          item.active ? "text-slate-900" : "text-slate-400"
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Tài khoản</span>
                  {accountNavItems.map((item, idx) => {
                    const Icon = item.icon;
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
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                          item.active ? "text-slate-900" : "text-slate-400"
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Sidebar Footer */}
              <div className="p-3 border-t border-slate-100 space-y-1">
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
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
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                {getPageTitle()}
              </h1>
            </div>

            {/* Right section widgets */}
            <div className="flex items-center gap-2.5">
              {/* Desktop Quick Balance display */}
              <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-full text-xs font-semibold text-slate-850 gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>Số dư: {(userData?.balance || 0).toLocaleString("vi-VN")} đ</span>
              </div>

              {/* Notification Bell */}
              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className="text-slate-500 hover:text-slate-850 border-none hover:bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    <div className="relative">
                      <Bell className="w-4 h-4" />
                      <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full" />
                    </div>
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content className="px-2 py-1 text-xs text-white bg-slate-900 rounded shadow-sm z-50">
                  Thông báo
                </Tooltip.Content>
              </Tooltip>

              {/* Quick Action "Mua Proxy" */}
              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    size="sm"
                    variant="primary"
                    className="font-medium h-9 text-xs gap-1.5 shadow-sm rounded-md"
                    onClick={() => router.push("/")}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mua Proxy</span>
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content className="px-2 py-1 text-xs text-white bg-slate-900 rounded shadow-sm z-50">
                  Mua Proxy mới
                </Tooltip.Content>
              </Tooltip>

              {/* Separator line */}
              <div className="w-px h-5 bg-slate-200 hidden sm:block mx-1" />

              {/* Profile Dropdown */}
              <Dropdown>
                <DropdownTrigger>
                  <button className="flex items-center gap-1 p-0.5 rounded-full hover:bg-slate-50 transition-colors focus:outline-none">
                    <Avatar className="text-white font-bold bg-gradient-to-tr from-blue-500 to-indigo-500 cursor-pointer w-7 h-7 flex items-center justify-center text-[10px] rounded-full">
                      <Avatar.Fallback>{initials}</Avatar.Fallback>
                    </Avatar>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>
                </DropdownTrigger>
                <Dropdown.Popover placement="bottom end" className="p-1 bg-white border border-slate-200 rounded-lg shadow-sm outline-none">
                  <Dropdown.Menu 
                    aria-label="User Profile Actions" 
                    className="outline-none min-w-44"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 mb-1 pointer-events-none">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Đăng nhập với email</p>
                      <p className="font-semibold text-slate-800 text-xs truncate mt-0.5">{session?.user?.email}</p>
                    </div>
                    <Dropdown.Item 
                      key="profile" 
                      className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer outline-none block"
                      onClick={() => router.push("/user/profile")}
                    >
                      Hồ sơ cá nhân
                    </Dropdown.Item>
                    {isAdmin && (
                      <Dropdown.Item 
                        key="admin-dashboard" 
                        className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer outline-none block"
                        onClick={() => router.push("/dashboard")}
                      >
                        Bảng Quản trị viên
                      </Dropdown.Item>
                    )}
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

          {/* EMAIL VERIFICATION WARNING BANNER */}
          {userData !== undefined && userData !== null && !userData.emailVerified && (
            <div className="px-4 lg:px-6 pt-4 lg:pt-6 max-w-7xl w-full mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-250/70 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-amber-900">Vui lòng xác thực tài khoản Email</h3>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Bạn chưa xác thực địa chỉ email. Vui lòng xác thực email để có thể mở khóa các tính năng thanh toán, nạp tiền và mua/gia hạn Proxy.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs font-semibold shrink-0 bg-amber-100 text-amber-900 border-none hover:bg-amber-200 rounded-md"
                  onClick={() => router.push("/verify-email")}
                >
                  Xác thực ngay
                </Button>
              </div>
            </div>
          )}

          {/* MAIN SCREEN CONTENT */}
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
