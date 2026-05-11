import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { serverService } from '@/modules/servers/services/server.service';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    console.log(`[API] Triggering sync for server: ${id}`);
    await serverService.syncServerPort(id);
    return NextResponse.json({ success: true, message: 'Đã bắt đầu đồng bộ cổng từ máy chủ' });
  } catch (error: any) {
    console.error(`[API] Sync error: ${error.message}`);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
