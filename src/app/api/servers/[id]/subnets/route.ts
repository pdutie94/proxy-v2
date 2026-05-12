import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { subnetService } from '@/modules/servers/services/subnet.service';
import { subnetSchema } from '@/modules/servers/schemas/subnet.schema';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;

  try {
    const subnets = await subnetService.getSubnetsByServerId(resolvedParams.id);
    return NextResponse.json({ success: true, data: subnets });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;

  try {
    const body = await req.json();
    const validatedData = subnetSchema.parse(body);
    const subnet = await subnetService.addSubnet(resolvedParams.id, validatedData);
    return NextResponse.json({ success: true, data: subnet });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
