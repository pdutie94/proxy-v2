import { DashboardLayoutHeroUI } from '@/components/layout/dashboard-layout-heroui';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutHeroUI>
      {children}
    </DashboardLayoutHeroUI>
  );
}

