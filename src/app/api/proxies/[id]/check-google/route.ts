import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { proxyService } from '@/modules/proxies/services/proxy.service';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    await proxyService.checkGoogle(id);
    return NextResponse.json({ success: true, message: 'Đã bắt đầu kiểm tra Google' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
