'use client';

import { Icon } from '@iconify/react';
import { Button, Card, Input, Checkbox, TextField, Label } from '@heroui/react';

import { useState, useCallback } from 'react';
import { toast } from '@heroui/react';
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
      toast.danger('Mật khẩu mới không khớp!');
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
        toast.danger(result.message);
      }
    } catch {
      toast.danger('Có lỗi xảy ra khi cập nhật hồ sơ.');
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
          <Card className="border border-slate-200 rounded-md bg-white p-4 space-y-4 shadow-none">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Icon icon="lucide:user" className="w-4 h-4 text-slate-500"  />
              Thông tin cơ bản
            </h2>
            
            <div className="space-y-4 max-w-md">
              <TextField>
                <Label>Địa chỉ Email</Label>
                <Input
                  type="email"
                  value={user.email}
                  readOnly
                  disabled
                />
              </TextField>

              <TextField>
                <Label>Họ và tên</Label>
                <Input
                  type="text"
                  value={name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                />
              </TextField>

              <div className="pt-1">
                <Checkbox
                  isSelected={notifications}
                  onChange={setNotifications}
                  className="text-sm font-medium text-slate-600 select-none cursor-pointer"
                >
                  Nhận thông báo qua Email
                </Checkbox>
              </div>
            </div>
          </Card>

          {/* Change Password Card */}
          <Card className="border border-slate-200 rounded-md bg-white p-4 space-y-4 shadow-none">
            <div>
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
                <Icon icon="lucide:lock" className="w-4 h-4 text-slate-500"  />
                Đổi mật khẩu
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Để trống nếu bạn không muốn thay đổi mật khẩu.
              </p>
            </div>
            
            <div className="space-y-4 max-w-md">
              <TextField>
                <Label>Mật khẩu hiện tại</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </TextField>

              <hr className="border-slate-100 my-1" />

              <TextField>
                <Label>Mật khẩu mới</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                />
              </TextField>

              <TextField>
                <Label>Xác nhận mật khẩu mới</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới"
                />
              </TextField>
            </div>
          </Card>

          <div className="flex justify-end">
             <Button 
              variant="primary" 
              size="sm" 
              isDisabled={loading}
              onPress={handleSave}
              className="cursor-pointer font-semibold"
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
          <Card className="border border-slate-200 rounded-md bg-white p-4 space-y-3 shadow-none">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Icon icon="lucide:shield-check" className="w-4 h-4 text-slate-500"  />
              Bảo mật tài khoản
            </h2>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Đảm bảo mật khẩu của bạn có ít nhất 8 ký tự, bao gồm cả chữ cái và chữ số để an toàn nhất.
            </p>
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 font-medium flex items-center gap-1.5">
              <Icon icon="lucide:info" className="w-3.5 h-3.5 shrink-0 text-blue-500"  />
              <span>Lần cập nhật cuối: {new Date(user.updatedAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
