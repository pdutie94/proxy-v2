import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code } = await req.json();
    
    if (!code || code.length !== 6) {
      return NextResponse.json({ success: false, message: 'Mã xác nhận không hợp lệ' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: false, message: 'Email đã được xác nhận trước đó' }, { status: 400 });
    }

    if (user.verificationToken !== code) {
      return NextResponse.json({ success: false, message: 'Mã xác nhận không đúng' }, { status: 400 });
    }

    // Xác nhận thành công
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
      }
    });

    return NextResponse.json({ success: true, message: 'Xác nhận Email thành công' });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }, { status: 500 });
  }
}
