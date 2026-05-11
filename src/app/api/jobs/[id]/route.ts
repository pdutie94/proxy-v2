import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.serverJob.findUnique({
      where: { id },
      include: {
        server: {
          select: {
            name: true,
            host: true,
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: job
    });
  } catch (error: any) {
    console.error('Get job error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
