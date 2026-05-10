import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="pl-[230px]">
        <Header />
        <main className="p-4 max-w-[1000px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
