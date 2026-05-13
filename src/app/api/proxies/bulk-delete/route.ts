import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { proxyService } from '@/modules/proxies/services/proxy.service';

import { AuthUser } from '@/types';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Không có quyền truy cập' }, { status: 401 });

  const userRole = (session?.user as AuthUser)?.role || "USER";
  if (userRole !== "ADMIN") {
    return NextResponse.json({ success: false, message: 'Chỉ Quản trị viên mới có quyền xóa hàng loạt' }, { status: 403 });
  }

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: 'Danh sách ID không hợp lệ' }, { status: 400 });
    }

    await proxyService.bulkDelete(ids);
    return NextResponse.json({
      success: true,
      message: `Đã xóa ${ids.length} proxy thành công`
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }, { status: 400 });
  }
}
