import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { userService } from '@/modules/users/services/user.service';
import { userSchema } from '@/modules/users/schemas/user.schema';
import { AuthUser } from '@/types';

export async function GET() {
  const session = await auth();
  if (!session || (session.user as AuthUser).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await userService.getAllUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as AuthUser).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = userSchema.parse(body);
    const user = await userService.createUser(validated);
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }, { status: 400 });
  }
}
