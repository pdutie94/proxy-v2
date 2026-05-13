import { PackageList } from '@/modules/store/components/package-list';

export default function StorePage() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900">Thuê Proxy Mới</h1>
        <p className="text-slate-500 mt-2">
          Chọn gói cước phù hợp với nhu cầu của bạn. Proxy sẽ được kích hoạt tự động ngay sau khi thanh toán thành công.
        </p>
      </div>

      <PackageList />

      <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-amber-900">Lưu ý quan trọng</h4>
            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
              Thời gian khởi tạo proxy có thể mất từ 2-3 giây. Nếu sau 1 phút bạn vẫn chưa thấy proxy trong danh sách, vui lòng liên hệ đội ngũ hỗ trợ để được kiểm tra ngay lập tức.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
