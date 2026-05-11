import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { proxyService } from '@/modules/proxies/services/proxy.service';
import { bulkProxySchema } from '@/modules/proxies/schemas/bulk-proxy.schema';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = bulkProxySchema.parse(body);
    
    const proxies = await proxyService.bulkCreateProxies(validatedData);
    
    return NextResponse.json({ 
      success: true, 
      message: `Đã bắt đầu khởi tạo ${proxies.length} proxy hàng loạt.`,
      data: { count: proxies.length }
    });
  } catch (error: any) {
    console.error('[API Bulk Proxies] Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
