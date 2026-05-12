import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { addJob } from '@/worker/queue/job.queue';
import { JobType } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const server = await prisma.server.findUnique({ where: { id } });
    
    if (!server) {
      return NextResponse.json({ success: false, message: 'Server not found' }, { status: 404 });
    }

    // Update server status to SETTING_UP
    await prisma.server.update({
      where: { id: server.id },
      data: { status: 'SETTING_UP' }
    });

    // Create a job record in DB
    const job = await prisma.serverJob.create({
      data: {
        type: JobType.SETUP_SERVER,
        serverId: server.id,
        status: 'WAITING',
      },
    });

    // Dispatch setup job
    await addJob(JobType.SETUP_SERVER, {
      serverId: server.id,
      jobId: job.id,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Setup job enqueued',
      data: { jobId: job.id }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
