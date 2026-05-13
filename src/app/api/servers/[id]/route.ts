import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { serverService } from '@/modules/servers/services/server.service';
import { AuthUser } from '@/types';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as AuthUser).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Bạn không có quyền thực hiện hành động này' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await serverService.deleteServer(id);
    return NextResponse.json({ success: true, message: 'Đã xóa máy chủ thành công' });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as AuthUser).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Bạn không có quyền thực hiện hành động này' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const server = await serverService.updateServer(id, body);
    return NextResponse.json({ success: true, data: server });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }, { status: 400 });
  }
}
