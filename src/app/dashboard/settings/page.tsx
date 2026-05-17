"use client";

import { Icon } from '@iconify/react';
import { Card, Button, Chip } from "@heroui/react";
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
          <Card className="border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Icon icon="lucide:settings" className="w-4 h-4 text-slate-500"  />
              Thông tin chung
            </h2>
            <div className="space-y-3.5 max-w-md">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500">Tên Website</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-medium text-slate-700 disabled:bg-slate-50"
                />
              </div>
              <Button
                size="sm"
                variant="primary"
                onPress={handleSave}
                isDisabled={isSaving || isLoading}
                className="cursor-pointer font-bold text-xs h-8 px-4 rounded-lg flex items-center gap-1.5"
              >
                {isSaving && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Lưu thay đổi
              </Button>
            </div>
          </Card>

          {/* SMTP Settings */}
          <Card className="border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Icon icon="lucide:mail" className="w-4 h-4 text-slate-500"  />
              Cấu hình Email (SMTP)
            </h2>

            <div className="space-y-4">
              {/* Checkbox requirement */}
              <div className="space-y-1.5">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={requireEmailVerification}
                    onChange={(e) => setRequireEmailVerification(e.target.checked)}
                    disabled={isLoading}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500/50 cursor-pointer"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-slate-700">Bắt buộc xác thực Email khi đăng ký tài khoản</span>
                    <span className="text-[10px] text-slate-400 font-medium">Người dùng không thể mua hàng nếu chưa xác nhận Email bằng mã OTP.</span>
                  </div>
                </label>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500">SMTP Host</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    disabled={isLoading}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-medium text-slate-700 disabled:bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500">SMTP Port</label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="465"
                    disabled={isLoading}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-medium text-slate-700 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-3.5 max-w-xl">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500">Tài khoản Email (Username)</label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-medium text-slate-700 disabled:bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500">Mật khẩu (App Password)</label>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-medium text-slate-700 disabled:bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500">Email gửi đi (From)</label>
                  <input
                    type="text"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    placeholder="noreply@domain.com"
                    disabled={isLoading}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-lg outline-none transition-all duration-150 font-medium text-slate-700 disabled:bg-slate-50"
                  />
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onPress={handleSave}
                  isDisabled={isSaving || isLoading}
                  className="cursor-pointer font-bold text-xs h-8 px-4 rounded-lg flex items-center gap-1.5"
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
          <Card className="border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Icon icon="lucide:server" className="w-4 h-4 text-slate-500"  />
              Trạng thái hạ tầng
            </h2>
            <div className="space-y-3.5 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>Cơ sở dữ liệu (MySQL 8)</span>
                <div className="flex-grow border-b border-dotted border-slate-200"></div>
                <Chip size="sm" variant="soft" color="success" className="font-bold text-[9px] uppercase">
                  Đang hoạt động
                </Chip>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>Hàng đợi (BullMQ / Redis)</span>
                <div className="flex-grow border-b border-dotted border-slate-200"></div>
                <Chip size="sm" variant="soft" color="success" className="font-bold text-[9px] uppercase">
                  Đang hoạt động
                </Chip>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>Dịch vụ SSH Worker</span>
                <div className="flex-grow border-b border-dotted border-slate-200"></div>
                <Chip size="sm" variant="soft" color="success" className="font-bold text-[9px] uppercase">
                  Sẵn sàng
                </Chip>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>Hệ thống Tự động hóa</span>
                <div className="flex-grow border-b border-dotted border-slate-200"></div>
                <Chip size="sm" variant="soft" color="success" className="font-bold text-[9px] uppercase">
                  Đang chạy (5p/lần)
                </Chip>
              </div>
            </div>
          </Card>

          {/* Security details card */}
          <Card className="border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Icon icon="lucide:shield-alert" className="w-4 h-4 text-slate-500"  />
              Cấu hình Bảo mật
            </h2>
            <div className="space-y-3 text-xs font-semibold text-slate-600">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500">JWT / Auth Secret</label>
                <input
                  type="password"
                  value="************************"
                  disabled
                  className="w-full h-8 px-2.5 text-xs bg-slate-50 text-slate-400 border border-slate-200 rounded-lg outline-none cursor-not-allowed font-medium"
                />
                <span className="block text-[10px] text-slate-400 font-medium leading-relaxed">Đã cấu hình an toàn trong tệp .env</span>
              </div>
              <div className="space-y-1 pt-1.5">
                <label className="block text-[11px] font-semibold text-slate-500">Node Environment</label>
                <input
                  type="text"
                  value={process.env.NODE_ENV || 'development'}
                  disabled
                  className="w-full h-8 px-2.5 text-xs bg-slate-50 text-slate-400 border border-slate-200 rounded-lg outline-none cursor-not-allowed font-medium"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
