import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { proxyService } from '@/modules/proxies/services/proxy.service';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { ids, duration } = await req.json();
    if (!ids || !Array.isArray(ids) || !duration) {
      return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    await proxyService.bulkRenew(ids, duration);
    return NextResponse.json({ success: true, message: `Đã gia hạn thành công ${ids.length} proxy` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
