import { Server, ShieldCheck, ListOrdered, Activity } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { label: 'Total Servers', value: '0', icon: Server, color: 'text-blue-600' },
    { label: 'Active Proxies', value: '0', icon: ShieldCheck, color: 'text-green-600' },
    { label: 'Active Jobs', value: '0', icon: ListOrdered, color: 'text-amber-600' },
    { label: 'System Health', value: 'Stable', icon: Activity, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{stat.label}</span>
              <stat.icon className={stat.color + " h-4 w-4"} />
            </div>
            <p className="mt-1 text-lg font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>
      
      <div className="bg-white border border-slate-200 rounded-md p-4">
        <h2 className="text-base font-semibold text-slate-900">Welcome to ProxyV2</h2>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
          Your MVP Proxy Management Dashboard is ready. This is a compact, functional interface designed for high-efficiency infrastructure management.
        </p>
        <div className="mt-4 flex gap-2">
          <button className="h-8 px-3 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Quick Add Server
          </button>
          <button className="h-8 px-3 text-xs bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors">
            View Logs
          </button>
        </div>
      </div>
    </div>
  );
}
