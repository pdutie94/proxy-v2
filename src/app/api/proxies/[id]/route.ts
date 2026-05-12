import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { proxyService } from '@/modules/proxies/services/proxy.service';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const userRole = (session?.user as any)?.role || "USER";
  if (userRole !== "ADMIN") {
    return NextResponse.json({ success: false, message: 'Bạn không có quyền xóa Proxy' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await proxyService.deleteProxy(id);
    return NextResponse.json({ success: true, message: 'Proxy deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    
    if (typeof body.isEnabled === 'boolean') {
      const proxy = await proxyService.toggleProxy(id, body.isEnabled);
      return NextResponse.json({ success: true, data: proxy });
    }
    
    return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
