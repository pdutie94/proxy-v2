'use client';

import React, { useCallback, useState, useEffect, useRef } from "react";
import { Frame, TopBar, Navigation } from "@shopify/polaris";
import { 
  HomeIcon, 
  ShieldCheckMarkIcon, 
  WalletIcon,
  OrderIcon,
  CashDollarIcon,
  PersonIcon,
  ExitIcon,
  SettingsIcon
} from "@shopify/polaris-icons";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { getUserHeaderInfoAction } from "@/modules/auth/actions/balance.action";
import { RealtimeProvider } from "@/components/providers/realtime-provider";

export default function UserLayout({ children }: { children: React.ReactNode }) {
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
    const timer = setTimeout(() => setIsMobileOpen(false), 0);
    return () => clearTimeout(timer);
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
    }, 200); // Tăng lên 200ms để thoải mái hơn
  };

  // Cleanup timeout on unmount
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
        name={userData?.displayName || session?.user?.name || session?.user?.email || "Thành viên"}
        avatar="data:image/svg+xml,%3Csvg viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='white' d='M10 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"
        initials=""
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

  const userRole = session?.user?.role || "USER";
  const isAdmin = userRole === "ADMIN";

  const navigationMarkup = (
    <Navigation location={pathname}>
      <div style={{ padding: '12px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #005bd3 0%, #003e91 100%)', 
          padding: '16px', 
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0, 91, 211, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'baseline',
            marginBottom: '4px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '500', opacity: 0.8 }}>Số dư</span>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>
              {(userData?.balance || 0).toLocaleString('vi-VN')} <span style={{ fontSize: '14px', fontWeight: '500' }}>đ</span>
            </span>
          </div>
          
          <div style={{ marginTop: '10px' }}>
            <button 
              onClick={() => router.push('/user/balance')}
              style={{ 
                background: 'white', 
                color: '#005bd3', 
                border: 'none', 
                width: '100%',
                padding: '8px 12px', 
                borderRadius: '8px', 
                fontSize: '12px', 
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <WalletIcon style={{ width: '16px', height: '16px' }} />
              Nạp tiền ngay
            </button>
          </div>
        </div>
      </div>
      <Navigation.Section
        items={[
          {
            label: "Trang chủ",
            icon: HomeIcon,
            url: "/",
            selected: pathname === "/",
          },
          ...(isAdmin ? [
            {
              label: "Quản trị viên",
              icon: SettingsIcon,
              url: "/dashboard",
              selected: pathname.startsWith("/dashboard"),
            }
          ] : []),
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

  useEffect(() => {
    document.body.classList.add('polaris-user-theme');
    return () => document.body.classList.remove('polaris-user-theme');
  }, []);

  return (
    <div className="polaris-user-theme-wrapper">
      <style jsx global>{`
        body.polaris-user-theme .Polaris-Button--variantPrimary {
          background: #005bd3 !important;
          border-color: #005bd3 !important;
          box-shadow: 0 4px 12px rgba(0, 91, 211, 0.25) !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        body.polaris-user-theme .Polaris-Button--variantPrimary:hover {
          background: #004bb1 !important;
          box-shadow: 0 6px 16px rgba(0, 91, 211, 0.35) !important;
          transform: translateY(-1px);
        }
        body.polaris-user-theme .Polaris-Button--variantPrimary:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 91, 211, 0.2) !important;
        }
        .polaris-user-theme-wrapper .Polaris-TopBar {
          background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
        }
        .polaris-user-theme-wrapper .Polaris-TopBar-UserMenu__Activator {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 6px 16px;
          margin-right: 8px;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .polaris-user-theme-wrapper .Polaris-TopBar-UserMenu__Activator:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }
        .polaris-user-theme-wrapper .Polaris-TopBar__UserMenuName {
          color: #f8fafc !important;
          font-weight: 700 !important;
          font-size: 13px !important;
        }
        .polaris-user-theme-wrapper .Polaris-Avatar {
          background: transparent !important;
        }
        .polaris-user-theme-wrapper .Polaris-Avatar__Image {
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
