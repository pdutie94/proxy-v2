import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { proxyService } from '@/modules/proxies/services/proxy.service';
import { proxySchema } from '@/modules/proxies/schemas/proxy.schema';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const proxies = await proxyService.getAllProxies();
    return NextResponse.json({ success: true, data: proxies });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const validated = proxySchema.parse(body);
    const result = await proxyService.createProxy(validated);
    return NextResponse.json({ 
      success: true, 
      data: { proxy: result.proxy, jobId: result.jobId } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
