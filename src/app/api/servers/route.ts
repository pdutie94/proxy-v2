import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { serverService } from '@/modules/servers/services/server.service';
import { serverSchema } from '@/modules/servers/schemas/server.schema';
import { AuthUser } from '@/types';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const servers = await serverService.getAllServers();
    return NextResponse.json({ success: true, data: servers });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as AuthUser).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = serverSchema.parse(body);
    const server = await serverService.createServer(validated);
    return NextResponse.json({ success: true, data: server });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }, { status: 400 });
  }
}
