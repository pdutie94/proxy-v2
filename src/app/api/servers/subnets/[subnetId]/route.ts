import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { subnetService } from '@/modules/servers/services/subnet.service';

export async function DELETE(
  req: Request,
  { params }: { params: { subnetId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;

  try {
    await subnetService.deleteSubnet(resolvedParams.subnetId);
    return NextResponse.json({ success: true, message: 'Đã xóa subnet thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { subnetId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;

  try {
    const { status } = await req.json();
    const subnet = await subnetService.updateSubnetStatus(resolvedParams.subnetId, status);
    return NextResponse.json({ success: true, data: subnet });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
