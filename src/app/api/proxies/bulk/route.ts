import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { proxyService } from '@/modules/proxies/services/proxy.service';
import { bulkProxySchema } from '@/modules/proxies/schemas/bulk-proxy.schema';

import { AuthUser } from '@/types';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = bulkProxySchema.parse(body);
    
    // Determine the owner: if admin provides userId, use it, else use current user
    const targetUserId = ((session.user as AuthUser).role === 'ADMIN' && validatedData.userId) 
      ? validatedData.userId 
      : (session.user as AuthUser).id;

    const result = await proxyService.bulkCreateProxies({
      ...validatedData,
      userId: targetUserId
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Đã bắt đầu khởi tạo ${result.proxies.length} proxy hàng loạt.`,
      data: { jobId: result.jobId, count: result.proxies.length }
    });
  } catch (error) {
    console.error('[API Bulk Proxies] Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }, { status: 400 });
  }
}
