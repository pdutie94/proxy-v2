import prisma from '@/lib/prisma';
import { SubnetSchema } from '../schemas/subnet.schema';

export class SubnetService {
  async getSubnetsByServerId(serverId: string) {
    return prisma.serverSubnet.findMany({
      where: { serverId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addSubnet(serverId: string, data: SubnetSchema) {
    return prisma.serverSubnet.create({
      data: {
        ...data,
        serverId,
      },
    });
  }

  async deleteSubnet(id: string) {
    return prisma.serverSubnet.delete({
      where: { id },
    });
  }

  async updateSubnetStatus(id: string, status: 'ACTIVE' | 'BLOCKED') {
    return prisma.serverSubnet.update({
      where: { id },
      data: { status },
    });
  }
}

export const subnetService = new SubnetService();
