import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { settingsService } from '@/modules/settings/services/settings.service';
import { AuthUser } from '@/types';

export async function GET() {
  const session = await auth();
  if (!session || (session.user as AuthUser).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const settings = await settingsService.getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, message: 'Có lỗi xảy ra' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as AuthUser).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    await settingsService.updateSettings(body);
    return NextResponse.json({ success: true, message: 'Đã lưu cấu hình' });
  } catch {
    return NextResponse.json({ success: false, message: 'Có lỗi xảy ra' }, { status: 400 });
  }
}
