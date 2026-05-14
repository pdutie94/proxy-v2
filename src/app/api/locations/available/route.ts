import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Không cache route này

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: {
        servers: {
          some: { status: 'ONLINE' },
        },
      },
      select: {
        id: true,
        name: true,
        countryCode: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Lỗi' },
      { status: 500 }
    );
  }
}
