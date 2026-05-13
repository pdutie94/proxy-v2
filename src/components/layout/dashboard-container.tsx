"use client";

import { Frame, TopBar, Navigation } from "@shopify/polaris";
import { 
  HomeIcon, 
  OrderIcon,
  ShieldCheckMarkIcon,
  PersonIcon,
  SettingsIcon,
  NoteIcon,
  ExitIcon
} from "@shopify/polaris-icons";
import { usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { AuthUser } from '@/types';

interface DashboardContainerProps {
  children: React.ReactNode;
}

export function DashboardContainer({ children }: DashboardContainerProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
          items: [{ content: "Log out", onAction: () => signOut(), icon: ExitIcon }],
        },
      ]}
      name={session?.user?.email?.split("@")[0] || "Admin"}
      detail={(session?.user as AuthUser | undefined)?.role || "ADMIN"}
      initials={session?.user?.email?.slice(0, 2).toUpperCase()}
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
          ] : []),
          ...(isAdmin || userRole === "MODERATOR" ? [
            {
              label: "Nhật ký hệ thống",
              icon: NoteIcon,
              url: "/dashboard/logs",
              selected: pathname.startsWith("/dashboard/logs"),
            },
          ] : []),
        ]}
      />
      <Navigation.Section
        separator
        items={[
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
      {children}
    </Frame>
  );
}
