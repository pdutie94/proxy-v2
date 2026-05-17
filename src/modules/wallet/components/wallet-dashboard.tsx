'use client';

import { useState } from 'react';
import { toast } from '@heroui/react';

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'PAYMENT' | 'REFUND';
  amount: number;
  status: string;
  createdAt: string;
  notes?: string;
}

export function WalletDashboard({ balance, transactions }: { balance: number, transactions: Transaction[] }) {
  const [loading, setLoading] = useState(false);

  const handleSimulateDeposit = async () => {
    setLoading(true);
    // In a real app, this would call an API to create a deposit request
    // Here we just show a toast for simulation
    setTimeout(() => {
      setLoading(false);
      toast.success('Yêu cầu nạp tiền đã được gửi. Vui lòng chuyển khoản theo nội dung hướng dẫn.');
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Balance Card */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-2">Số dư khả dụng</p>
          <p className="text-4xl font-extrabold text-slate-900 mb-6">{balance.toLocaleString()}đ</p>
          <button 
            onClick={handleSimulateDeposit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
            Nạp thêm tiền
          </button>
        </div>

        {/* Deposit Instructions */}
        <div className="bg-blue-600 p-8 rounded-2xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-4">Hướng dẫn nạp tiền</h3>
            <ul className="space-y-3 text-blue-50 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Chuyển khoản tới: <b>MB Bank - 123456789</b></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Nội dung: <b>NAP [Email_Của_Bạn]</b></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Số tiền sẽ được cập nhật trong vòng 5-10 phút.</span>
              </li>
            </ul>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Lịch sử giao dịch</h3>
          <button className="text-sm text-blue-600 font-medium hover:underline">Tải báo cáo</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Mã GD</th>
                <th className="px-6 py-4">Loại</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Chưa có giao dịch nào</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">#{tx.id.slice(-8)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        tx.type === 'DEPOSIT' ? 'bg-green-50 text-green-700' : 
                        tx.type === 'PAYMENT' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {tx.type === 'DEPOSIT' ? 'NẠP TIỀN' : tx.type === 'PAYMENT' ? 'THANH TOÁN' : 'HOÀN TIỀN'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-slate-900'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toLocaleString()}đ
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600">{tx.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
