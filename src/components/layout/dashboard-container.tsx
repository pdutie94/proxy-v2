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
import { useCallback, useState } from "react";
import { signOut, useSession } from "next-auth/react";

interface DashboardContainerProps {
  children: React.ReactNode;
}

export function DashboardContainer({ children }: DashboardContainerProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  const userMenuMarkup = (
    <TopBar.UserMenu
      actions={[
        {
          items: [{ content: "Log out", onAction: () => signOut(), icon: ExitIcon }],
        },
      ]}
      name={session?.user?.email?.split("@")[0] || "Admin"}
      detail={(session?.user as any)?.role || "ADMIN"}
      initials={session?.user?.email?.slice(0, 2).toUpperCase()}
      open={false}
      onToggle={() => {}}
    />
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      userMenu={userMenuMarkup}
      onNavigationToggle={toggleMobileOpen}
    />
  );

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
          {
            label: "Máy chủ",
            icon: OrderIcon,
            url: "/dashboard/servers",
            selected: pathname.startsWith("/dashboard/servers"),
          },
          {
            label: "Proxy",
            icon: ShieldCheckMarkIcon,
            url: "/dashboard/proxies",
            selected: pathname.startsWith("/dashboard/proxies"),
          },
          {
            label: "Người dùng",
            icon: PersonIcon,
            url: "/dashboard/users",
            selected: pathname.startsWith("/dashboard/users"),
          },
          {
            label: "Nhật ký hệ thống",
            icon: NoteIcon,
            url: "/dashboard/logs",
            selected: pathname.startsWith("/dashboard/logs"),
          },
        ]}
      />
      <Navigation.Section
        separator
        items={[
          {
            label: "Cài đặt",
            icon: SettingsIcon,
            url: "/dashboard/settings",
            selected: pathname.startsWith("/dashboard/settings"),
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
