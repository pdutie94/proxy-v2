'use client';

import { Icon } from '@iconify/react';
import { Button, Card, Input, TextField, Label } from '@heroui/react';

import { addTestBalanceAction } from '@/modules/auth/actions/test-balance.action';
import { toast } from '@heroui/react';
import { useState } from 'react';

interface UserBalanceClientProps {
  user: {
    id: string;
    email: string;
    balance: number | string;
  };
}

export function UserBalanceClient({ user }: UserBalanceClientProps) {
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('50000');

  const handleTestDeposit = async () => {
    setLoading(true);
    try {
      const res = await addTestBalanceAction();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.danger(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Nạp tiền vào tài khoản</h1>
        <p className="text-xs text-slate-400">Tăng số dư để mua thêm proxy hoặc gia hạn dịch vụ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Section: Payment Methods */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-slate-200 rounded-md bg-white p-4 shadow-none">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Phương thức nạp tiền</h2>
            
            {/* Payment Method Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-blue-500 bg-blue-50/20 p-3.5 rounded-md flex flex-col items-center gap-2 cursor-pointer transition-colors hover:bg-blue-50/30">
                <Icon icon="lucide:landmark" className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-slate-700">Ngân hàng</span>
              </div>
              <div className="border border-slate-200 p-3.5 rounded-md flex flex-col items-center gap-2 cursor-pointer transition-colors hover:bg-slate-50 bg-white">
                <Icon icon="lucide:smartphone" className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">Ví điện tử</span>
              </div>
              <div className="border border-slate-200 p-3.5 rounded-md flex flex-col items-center gap-2 cursor-pointer transition-colors hover:bg-slate-50 bg-white">
                <Icon icon="lucide:credit-card" className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">Thẻ cào</span>
              </div>
            </div>

            {/* Amount and Action */}
            <div className="mt-6 space-y-4 max-w-sm">
              <TextField className="w-full">
                <Label className="block text-xs font-medium text-slate-600 mb-1">Số tiền cần nạp (VNĐ)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={depositAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 select-none">VNĐ</span>
                </div>
              </TextField>
              <Button 
                variant="primary" 
                size="sm"
                className="w-full font-medium h-9 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white border-0 cursor-pointer transition-colors"
              >
                Tiếp tục nạp tiền
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar: Current Balance & Test Mode */}
        <div className="space-y-4">
          <Card className="border border-slate-200 rounded-md bg-white p-4 shadow-none">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Số dư hiện tại</h2>
              <Icon icon="lucide:circle-dollar-sign" className="w-5 h-5 text-emerald-500"  />
            </div>

            <div className="mb-4">
              <p className="text-2xl font-extrabold text-emerald-600">
                {Number(user.balance).toLocaleString('vi-VN')} VNĐ
              </p>
            </div>

            <hr className="border-slate-100 my-4" />

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 font-medium flex items-start gap-1.5 leading-relaxed mb-6">
              <Icon icon="lucide:info" className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5"  />
              <span>Số dư này được dùng để thanh toán các đơn hàng mới hoặc tự động gia hạn proxy.</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-700">Chế độ thử nghiệm</h3>
              <Button 
                variant="secondary" 
                size="sm"
                isDisabled={loading}
                onPress={handleTestDeposit}
                className="w-full font-semibold h-9 text-sm rounded-lg cursor-pointer border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                {loading && (
                  <span className="w-3 h-3 border-2 border-slate-600/30 border-t-slate-600 rounded-full animate-spin"></span>
                )}
                Nạp 100.000đ (Thử nghiệm)
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
