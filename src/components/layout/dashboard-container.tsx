"use client";

import { Frame, TopBar, Navigation } from "@shopify/polaris";
import { 
  HomeIcon, 
  OrderIcon, 
  ShieldCheckMarkIcon, 
  PersonIcon, 
  SettingsIcon, 
  NoteIcon, 
  ExitIcon, 
  CashDollarIcon, 
  GlobeIcon 
} from "@shopify/polaris-icons";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { AuthUser } from '@/types';
import { useQuery } from "@tanstack/react-query";
import { getUserHeaderInfoAction } from "@/modules/auth/actions/balance.action";
import { RealtimeProvider } from "@/components/providers/realtime-provider";

interface DashboardContainerProps {
  children: React.ReactNode;
}

export function DashboardContainer({ children }: DashboardContainerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ['user-header-info'],
    queryFn: () => getUserHeaderInfoAction(),
    enabled: !!session?.user?.id,
    refetchInterval: 60000,
  });

  // Close mobile navigation when pathname changes
  useEffect(() => {
    setTimeout(() => setIsMobileOpen(false), 0);
  }, [pathname]);

  const toggleMobileOpen = useCallback(
    () => setIsMobileOpen((open) => !open),
    []
  );

  const logo = {
    width: 32,
    topBarSource: "/logo.png",
    source: "/logo.png",
    url: "/dashboard",
    accessibilityLabel: "ProxyV2 Logo",
  };

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);

  const toggleUserMenuOpen = useCallback(
    () => setIsUserMenuOpen((open) => !open),
    [],
  );

  const handleMouseEnter = () => {
    if (isMobileOpen) return;
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setIsUserMenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (isMobileOpen) return;
    closeTimer.current = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const userMenuMarkup = (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="custom-user-menu-wrapper"
    >
      <TopBar.UserMenu
        actions={[
          {
            items: [
              { 
                content: "Hồ sơ cá nhân", 
                onAction: () => router.push('/user/profile'), 
                icon: PersonIcon 
              },
              { 
                content: "Đăng xuất", 
                onAction: () => signOut(), 
                icon: ExitIcon 
              }
            ],
          },
        ]}
        name={userData?.displayName || session?.user?.name || session?.user?.email || "Quản trị viên"}
        avatar="data:image/svg+xml,%3Csvg viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='white' d='M10 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"
        initials={(userData?.displayName || session?.user?.name || session?.user?.email || "A").charAt(0).toUpperCase()}
        open={isUserMenuOpen}
        onToggle={toggleUserMenuOpen}
      />
    </div>
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      userMenu={userMenuMarkup}
      onNavigationToggle={toggleMobileOpen}
    />
  );

  const userRole = (session?.user as AuthUser | undefined)?.role || "USER";
  const isAdmin = userRole === "ADMIN";

  const navigationMarkup = (
    <Navigation location={pathname}>
      <Navigation.Section
        items={[
          {
            label: "Bảng điều khiển",
            icon: HomeIcon,
            url: "/dashboard",
            selected: pathname === "/dashboard",
          },
          ...(isAdmin ? [
            {
              label: "Máy chủ",
              icon: OrderIcon,
              url: "/dashboard/servers",
              selected: pathname.startsWith("/dashboard/servers"),
            },
            {
              label: "Vị trí",
              icon: GlobeIcon,
              url: "/dashboard/locations",
              selected: pathname.startsWith("/dashboard/locations"),
            },
          ] : []),
          ...(isAdmin || userRole === "MODERATOR" ? [
            {
              label: "Proxy",
              icon: ShieldCheckMarkIcon,
              url: "/dashboard/proxies",
              selected: pathname.startsWith("/dashboard/proxies"),
            },
          ] : []),
          ...(isAdmin ? [
            {
              label: "Người dùng",
              icon: PersonIcon,
              url: "/dashboard/users",
              selected: pathname.startsWith("/dashboard/users"),
            },
            {
              label: "Giao dịch",
              icon: CashDollarIcon,
              url: "/dashboard/transactions",
              selected: pathname.startsWith("/dashboard/transactions"),
            },
          ] : []),
          ...(isAdmin || userRole === "MODERATOR" ? [
            {
              label: "Nhật ký hệ thống",
              icon: NoteIcon,
              url: "/dashboard/logs",
              selected: pathname.startsWith("/dashboard/logs"),
            },
          ] : []),
          ...(isAdmin ? [
            {
              label: "Cài đặt",
              icon: SettingsIcon,
              url: "/dashboard/settings",
              selected: pathname.startsWith("/dashboard/settings"),
            },
          ] : []),
          {
            label: "Đăng xuất",
            icon: ExitIcon,
            onClick: () => signOut(),
          },
        ]}
      />
    </Navigation>
  );

  return (
    <div className="polaris-admin-theme-wrapper">
      <style jsx global>{`
        .polaris-admin-theme-wrapper .Polaris-Button--variantPrimary {
          background: #005bd3 !important;
          border-color: #005bd3 !important;
          box-shadow: 0 4px 12px rgba(0, 91, 211, 0.25) !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .polaris-admin-theme-wrapper .Polaris-Button--variantPrimary:hover {
          background: #004bb1 !important;
          box-shadow: 0 6px 16px rgba(0, 91, 211, 0.35) !important;
          transform: translateY(-1px);
        }
        .polaris-admin-theme-wrapper .Polaris-Button--variantPrimary:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 91, 211, 0.2) !important;
        }
        .polaris-admin-theme-wrapper .Polaris-TopBar {
          background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
        }
        .polaris-admin-theme-wrapper .Polaris-TopBar-UserMenu__Activator {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 6px 16px;
          margin-right: 8px;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .polaris-admin-theme-wrapper .Polaris-TopBar-UserMenu__Activator:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }
        .polaris-admin-theme-wrapper .Polaris-TopBar__UserMenuName {
          color: #f8fafc !important;
          font-weight: 700 !important;
          font-size: 13px !important;
        }
        .polaris-admin-theme-wrapper .Polaris-Avatar {
          background: transparent !important;
        }
        .polaris-admin-theme-wrapper .Polaris-Avatar__Image {
          object-fit: contain !important;
          padding: 6px;
        }
      `}</style>
      <Frame
        logo={logo}
        topBar={topBarMarkup}
        navigation={navigationMarkup}
        showMobileNavigation={isMobileOpen}
        onNavigationDismiss={toggleMobileOpen}
      >
        <RealtimeProvider>
          {children}
        </RealtimeProvider>
      </Frame>
    </div>
  );
}
