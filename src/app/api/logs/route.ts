import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { AuthUser } from '@/types';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const serverId = searchParams.get('serverId');

  try {
    const jobs = await prisma.serverJob.findMany({
      where: serverId ? { serverId } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        server: {
          select: { name: true }
        },
        proxy: {
          select: { port: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Internal Server Error' 
    }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user || (session.user as AuthUser).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.serverJob.deleteMany({});
    return NextResponse.json({ success: true, message: 'Đã dọn dẹp toàn bộ nhật ký' });
  } catch (error) {
    console.error('Clear logs error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Internal Server Error' 
    }, { status: 500 });
  }
}
