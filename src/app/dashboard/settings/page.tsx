"use client";

import { Icon } from '@iconify/react';
import { Card, Button, Chip, Input, Checkbox, TextField, Label } from "@heroui/react";
import { useState, useEffect } from "react";
import { toast } from "@heroui/react";


export default function SettingsPage() {
  const [siteName, setSiteName] = useState("Proxy Manager v2");
  
  // SMTP Settings state
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          if (data.data.SITE_NAME) setSiteName(data.data.SITE_NAME);
          if (data.data.SMTP_HOST) setSmtpHost(data.data.SMTP_HOST);
          if (data.data.SMTP_PORT) setSmtpPort(data.data.SMTP_PORT);
          if (data.data.SMTP_USER) setSmtpUser(data.data.SMTP_USER);
          if (data.data.SMTP_PASS) setSmtpPass(data.data.SMTP_PASS);
          if (data.data.SMTP_FROM) setSmtpFrom(data.data.SMTP_FROM);
          if (data.data.REQUIRE_EMAIL_VERIFICATION) setRequireEmailVerification(data.data.REQUIRE_EMAIL_VERIFICATION === 'true');
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SITE_NAME: siteName,
          SMTP_HOST: smtpHost,
          SMTP_PORT: smtpPort,
          SMTP_USER: smtpUser,
          SMTP_PASS: smtpPass,
          SMTP_FROM: smtpFrom,
          REQUIRE_EMAIL_VERIFICATION: requireEmailVerification ? 'true' : 'false'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã lưu cài đặt hệ thống thành công");
      } else {
        toast.danger(data.message || "Lỗi lưu cài đặt");
      }
    } catch {
      toast.danger("Lỗi kết nối");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Cài đặt hệ thống</h1>
        <p className="text-xs text-slate-400">Quản lý cấu hình toàn cục, dịch vụ SMTP và thông số bảo mật</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column (2/3 width) - Config areas */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* General settings */}
          <Card className="border border-slate-200 bg-white p-4 shadow-sm space-y-4 shadow-none rounded-md">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Icon icon="lucide:settings" className="w-4 h-4 text-slate-500"  />
              Thông tin chung
            </h2>
            <div className="space-y-4 max-w-md">
              <TextField>
                <Label>Tên Website</Label>
                <Input
                  type="text"
                  value={siteName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteName(e.target.value)}
                  disabled={isLoading}
                />
              </TextField>
              <Button
                size="sm"
                onPress={handleSave}
                isDisabled={isSaving || isLoading}
                className="cursor-pointer font-medium text-sm h-9 px-4 rounded-lg flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-none"
              >
                {isSaving && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Lưu thay đổi
              </Button>
            </div>
          </Card>

          {/* SMTP Settings */}
          <Card className="border border-slate-200 bg-white p-4 shadow-sm space-y-4 shadow-none rounded-md">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Icon icon="lucide:mail" className="w-4 h-4 text-slate-500"  />
              Cấu hình Email (SMTP)
            </h2>

            <div className="space-y-4">
              {/* Checkbox requirement */}
              <div className="space-y-1.5">
                <Checkbox
                  isSelected={requireEmailVerification}
                  onChange={setRequireEmailVerification}
                  isDisabled={isLoading}
                  className="text-sm font-medium text-slate-700 select-none cursor-pointer"
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <div className="flex flex-col gap-0.5 ml-1">
                    <span className="text-sm font-medium text-slate-700">Bắt buộc xác thực Email khi đăng ký tài khoản</span>
                    <span className="text-xs text-slate-400 font-medium">Người dùng không thể mua hàng nếu chưa xác nhận Email bằng mã OTP.</span>
                  </div>
                </Checkbox>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
                <div className="sm:col-span-2">
                  <TextField>
                    <Label>SMTP Host</Label>
                    <Input
                      type="text"
                      value={smtpHost}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      disabled={isLoading}
                    />
                  </TextField>
                </div>
                <div>
                  <TextField>
                    <Label>SMTP Port</Label>
                    <Input
                      type="text"
                      value={smtpPort}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmtpPort(e.target.value)}
                      placeholder="465"
                      disabled={isLoading}
                    />
                  </TextField>
                </div>
              </div>

              <div className="space-y-4 max-w-xl">
                <TextField>
                  <Label>Tài khoản Email (Username)</Label>
                  <Input
                    type="text"
                    value={smtpUser}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmtpUser(e.target.value)}
                    disabled={isLoading}
                  />
                </TextField>

                <TextField>
                  <Label>Mật khẩu (App Password)</Label>
                  <Input
                    type="password"
                    value={smtpPass}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmtpPass(e.target.value)}
                    disabled={isLoading}
                  />
                </TextField>

                <TextField>
                  <Label>Email gửi đi (From)</Label>
                  <Input
                    type="text"
                    value={smtpFrom}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmtpFrom(e.target.value)}
                    placeholder="noreply@domain.com"
                    disabled={isLoading}
                  />
                </TextField>

                <Button
                  size="sm"
                  onPress={handleSave}
                  isDisabled={isSaving || isLoading}
                  className="cursor-pointer font-medium text-sm h-9 px-4 rounded-lg flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-none"
                >
                  {isSaving && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  )}
                  Lưu cấu hình SMTP
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column (1/3 width) - Status & Security */}
        <div className="space-y-4">
          {/* System Status card */}
          <Card className="border border-slate-200 bg-white p-4 shadow-sm space-y-4 shadow-none rounded-md">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Icon icon="lucide:server" className="w-4 h-4 text-slate-500"  />
              Trạng thái hạ tầng
            </h2>
            <div className="space-y-3.5 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>Cơ sở dữ liệu (MySQL 8)</span>
                <div className="flex-grow border-b border-dotted border-slate-200"></div>
                <Chip size="sm" variant="soft" color="success" className="font-medium text-[9px] uppercase">
                  Đang hoạt động
                </Chip>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>Hàng đợi (BullMQ / Redis)</span>
                <div className="flex-grow border-b border-dotted border-slate-200"></div>
                <Chip size="sm" variant="soft" color="success" className="font-medium text-[9px] uppercase">
                  Đang hoạt động
                </Chip>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>Dịch vụ SSH Worker</span>
                <div className="flex-grow border-b border-dotted border-slate-200"></div>
                <Chip size="sm" variant="soft" color="success" className="font-medium text-[9px] uppercase">
                  Sẵn sàng
                </Chip>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>Hệ thống Tự động hóa</span>
                <div className="flex-grow border-b border-dotted border-slate-200"></div>
                <Chip size="sm" variant="soft" color="success" className="font-medium text-[9px] uppercase">
                  Đang chạy (5p/lần)
                </Chip>
              </div>
            </div>
          </Card>

          {/* Security details card */}
          <Card className="border border-slate-200 bg-white p-4 shadow-sm space-y-4 shadow-none rounded-md">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Icon icon="lucide:shield-alert" className="w-4 h-4 text-slate-500"  />
              Cấu hình Bảo mật
            </h2>
            <div className="space-y-3 text-sm font-medium text-slate-600">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-500 mb-1.5">JWT / Auth Secret</label>
                <Input
                  type="password"
                  value="************************"
                  readOnly
                  disabled
                  className="w-full h-8 px-3 text-sm bg-slate-50 text-slate-400 border border-slate-200 rounded-lg outline-none cursor-not-allowed font-medium"
                />
                <span className="block text-xs text-slate-400 font-medium leading-relaxed mt-1">Đã cấu hình an toàn trong tệp .env</span>
              </div>
              <div className="space-y-1 pt-1.5">
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Node Environment</label>
                <Input
                  type="text"
                  value={process.env.NODE_ENV || 'development'}
                  readOnly
                  disabled
                  className="w-full h-8 px-3 text-sm bg-slate-50 text-slate-400 border border-slate-200 rounded-lg outline-none cursor-not-allowed font-medium"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
