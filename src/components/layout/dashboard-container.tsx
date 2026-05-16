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
import { useCallback, useState, useEffect } from "react";
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

  const toggleUserMenuOpen = useCallback(
    () => setIsUserMenuOpen((open) => !open),
    [],
  );


  const userMenuMarkup = (
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
      initials={(userData?.displayName || session?.user?.name || session?.user?.email || "A").charAt(0).toUpperCase()}
      open={isUserMenuOpen}
      onToggle={toggleUserMenuOpen}
    />
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
  );
}
