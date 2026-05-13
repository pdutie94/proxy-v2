import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=InvalidToken', request.url));
  }

  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=UserNotFound', request.url));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null, // Clear token after success
      },
    });

    return NextResponse.redirect(new URL('/login?success=EmailVerified', request.url));
  } catch (error) {
    console.error(' Verification Error:', error);
    return NextResponse.redirect(new URL('/login?error=ServerError', request.url));
  }
}
