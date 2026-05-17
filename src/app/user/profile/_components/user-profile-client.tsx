'use client';

import { Button, Card } from '@heroui/react';
import { User as UserIcon, Lock, ShieldCheck, Info } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { updateProfileAction } from '@/modules/auth/actions/profile.action';

interface User {
  id: string;
  email: string;
  name: string | null;
  notificationsEnabled: boolean;
  updatedAt: Date | string;
  balance: number;
}

interface UserProfileClientProps {
  user: User;
}

export function UserProfileClient({ user }: UserProfileClientProps) {
  const [name, setName] = useState(user.name || '');
  const [notifications, setNotifications] = useState(user.notificationsEnabled);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfileAction({
        name,
        notificationsEnabled: notifications,
        currentPassword,
        newPassword
      });

      if (result.success) {
        toast.success(result.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, [name, notifications, currentPassword, newPassword, confirmPassword]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Hồ sơ cá nhân</h1>
        <p className="text-xs text-slate-400">Quản lý thông tin tài khoản và bảo mật</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info Card */}
          <Card className="border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <UserIcon className="w-4 h-4 text-slate-500" />
              Thông tin cơ bản
            </h2>
            
            <div className="space-y-3 max-w-md">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500">Địa chỉ Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full h-9 px-2.5 text-xs bg-slate-50 text-slate-400 border border-slate-200 rounded-lg outline-none cursor-not-allowed font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500">Họ và tên</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-medium text-slate-700"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500/50 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600">Nhận thông báo qua Email</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Change Password Card */}
          <Card className="border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-500" />
                Đổi mật khẩu
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Để trống nếu bạn không muốn thay đổi mật khẩu.
              </p>
            </div>
            
            <div className="space-y-3.5 max-w-md">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-medium text-slate-700"
                />
              </div>

              <hr className="border-slate-100 my-1" />

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-medium text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới"
                  className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-medium text-slate-700"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
             <Button 
              variant="primary" 
              size="sm" 
              isDisabled={loading}
              onPress={handleSave}
              className="cursor-pointer font-bold text-xs h-9 px-4 rounded-lg flex items-center gap-1.5"
             >
               {loading && (
                 <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
               )}
               Lưu thay đổi
             </Button>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-4">
          <Card className="border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              Bảo mật tài khoản
            </h2>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Đảm bảo mật khẩu của bạn có ít nhất 8 ký tự, bao gồm cả chữ cái và chữ số để an toàn nhất.
            </p>
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-[10px] text-blue-700 font-semibold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 text-blue-500" />
              <span>Lần cập nhật cuối: {new Date(user.updatedAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
