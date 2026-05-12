import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { proxyService } from '@/modules/proxies/services/proxy.service';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { ids, autoRenew } = await req.json();
    if (!ids || !Array.isArray(ids) || typeof autoRenew !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    await proxyService.bulkUpdateAutoRenew(ids, autoRenew);
    return NextResponse.json({ success: true, message: `Đã cập nhật tự động gia hạn cho ${ids.length} proxy` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
