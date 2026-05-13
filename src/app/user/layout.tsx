'use client';

import { Frame, TopBar, Navigation } from "@shopify/polaris";
import { 
  HomeIcon, 
  ShieldCheckMarkIcon, 
  WalletIcon,
  OrderIcon,
  CashDollarIcon,
  PersonIcon,
  ExitIcon
} from "@shopify/polaris-icons";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile navigation when pathname changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleMobileOpen = useCallback(
    () => setIsMobileOpen((open) => !open),
    []
  );

  const logo = {
    width: 32,
    topBarSource: "/logo.png",
    url: "/",
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
          items: [{ content: "Đăng xuất", onAction: () => signOut(), icon: ExitIcon }],
        },
      ]}
      name={session?.user?.email?.split("@")[0] || "Khách"}
      detail="Thành viên"
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

  const navigationMarkup = (
    <Navigation location={pathname}>
      <Navigation.Section
        items={[
          {
            label: "Trang chủ",
            icon: HomeIcon,
            url: "/",
            selected: pathname === "/",
          },
        ]}
      />
      <Navigation.Section
        title="Dịch vụ của tôi"
        items={[
          {
            label: "Proxy của tôi",
            icon: ShieldCheckMarkIcon,
            url: "/user/proxies",
            selected: pathname === "/user/proxies",
          },
          {
            label: "Nạp tiền",
            icon: WalletIcon,
            url: "/user/balance",
            selected: pathname === "/user/balance",
          },
        ]}
      />
      <Navigation.Section
        title="Lịch sử"
        items={[
          {
            label: "Đơn hàng",
            icon: OrderIcon,
            url: "/user/orders",
            selected: pathname === "/user/orders",
          },
          {
            label: "Giao dịch",
            icon: CashDollarIcon,
            url: "/user/payments",
            selected: pathname === "/user/payments",
          },
        ]}
      />
      <Navigation.Section
        title="Tài khoản"
        items={[
          {
            label: "Hồ sơ cá nhân",
            icon: PersonIcon,
            url: "/user/profile",
            selected: pathname === "/user/profile",
          },
          {
            label: "Đăng xuất",
            icon: ExitIcon,
            onClick: () => signOut(),
          },
        ]}
      />
    </Navigation>
  );

  // Apply theme class to body to reach portals (Modals)
  useEffect(() => {
    document.body.classList.add('polaris-user-theme');
    return () => document.body.classList.remove('polaris-user-theme');
  }, []);

  return (
    <div className="polaris-user-theme-wrapper">
      <style jsx global>{`
        /* Tùy chỉnh màu nút Primary sang Xanh Dương (Áp dụng cả cho Modal qua body class) */
        body.polaris-user-theme .Polaris-Button--variantPrimary {
          background: #005bd3 !important;
          border-color: #005bd3 !important;
          box-shadow: 0 2px 4px rgba(0, 91, 211, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
        }
        body.polaris-user-theme .Polaris-Button--variantPrimary:hover {
          background: #004bb0 !important;
          border-color: #004bb0 !important;
          box-shadow: 0 4px 8px rgba(0, 91, 211, 0.3) !important;
        }
        body.polaris-user-theme .Polaris-Button--variantPrimary:active {
          background: #003e91 !important;
          border-color: #003e91 !important;
          box-shadow: none !important;
          transform: translateY(1px);
        }
        /* TopBar Gradient tương tự Admin nhưng tone xanh Slate */
        .polaris-user-theme-wrapper .Polaris-TopBar {
          background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
        }
        .polaris-user-theme-wrapper .Polaris-TopBar__UserMenuName,
        .polaris-user-theme-wrapper .Polaris-TopBar__SecondaryMenu {
           color: white;
        }
      `}</style>
      <Frame
        logo={logo}
        topBar={topBarMarkup}
        navigation={navigationMarkup}
        showMobileNavigation={isMobileOpen}
        onNavigationDismiss={toggleMobileOpen}
      >
        {children}
      </Frame>
    </div>
  );
}
