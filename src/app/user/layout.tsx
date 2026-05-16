'use client';

import React, { useCallback, useState, useEffect } from "react";
import { 
  Frame, 
  TopBar, 
  Navigation, 
  Banner, 
  Card, 
  Box, 
  BlockStack, 
  InlineStack, 
  Text, 
  Button 
} from "@shopify/polaris";
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
import { toast } from "sonner";
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
    refetchInterval: 10000,
  });

  // Close mobile navigation when pathname changes
  useEffect(() => {
    const timer = setTimeout(() => setIsMobileOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Handle inactive user
  useEffect(() => {
    if (userData && userData.isActive === false) {
      toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
      signOut({ callbackUrl: '/login' });
    }
  }, [userData]);

  const toggleMobileOpen = useCallback(
    () => setIsMobileOpen((open) => !open),
    []
  );

  const logo = {
    width: 32,
    topBarSource: "/logo.png",
    source: "/logo.png",
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
      initials={(userData?.displayName || session?.user?.name || session?.user?.email || "T").charAt(0).toUpperCase()}
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

  const userRole = session?.user?.role || "USER";
  const isAdmin = userRole === "ADMIN";

  const navigationMarkup = (
    <Navigation location={pathname}>
      <Box padding="300">
        <Card>
          <BlockStack gap="200">
            <InlineStack align="space-between">
              <Text as="span" variant="bodySm" tone="subdued">Số dư</Text>
              <Text as="span" variant="bodyMd" fontWeight="bold">
                {(userData?.balance || 0).toLocaleString('vi-VN')} đ
              </Text>
            </InlineStack>
            <Button 
              url="/user/balance" 
              icon={WalletIcon} 
              fullWidth
              variant="primary"
            >
              Nạp tiền ngay
            </Button>
          </BlockStack>
        </Card>
      </Box>
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
    <Frame
      logo={logo}
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={isMobileOpen}
      onNavigationDismiss={toggleMobileOpen}
    >
      <RealtimeProvider>
        {userData !== undefined && userData !== null && !userData.emailVerified && (
          <div style={{ padding: '16px 16px 0 16px' }}>
            <Banner
              title="Vui lòng xác thực tài khoản Email"
              tone="warning"
              action={{
                content: 'Xác thực ngay',
                onAction: () => router.push('/verify-email')
              }}
            >
              <p>Bạn chưa xác thực địa chỉ email. Vui lòng xác thực để có thể sử dụng đầy đủ các tính năng như nạp tiền và mua Proxy.</p>
            </Banner>
          </div>
        )}
        {children}
      </RealtimeProvider>
    </Frame>
  );
}
