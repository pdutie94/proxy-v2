import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { isActive: true }
    });

    if (user && user.isActive === false) {
      return NextResponse.json({ success: false, error: 'AccountLocked' });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'ServerError' }, { status: 500 });
  }
}
