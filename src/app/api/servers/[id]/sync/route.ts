import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { serverService } from '@/modules/servers/services/server.service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    console.log(`[API] Triggering sync for server: ${id}`);
    const job = await serverService.syncServerPort(id);
    return NextResponse.json({ 
      success: true, 
      message: 'Đã bắt đầu đồng bộ cổng từ máy chủ',
      data: { jobId: job.id }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';
    console.error(`[API] Sync error: ${message}`);
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
