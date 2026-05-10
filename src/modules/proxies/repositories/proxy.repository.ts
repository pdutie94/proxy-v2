import prisma from '@/lib/prisma';
import { Proxy, Prisma } from '@prisma/client';

export class ProxyRepository {
  async findAll(): Promise<Proxy[]> {
    return prisma.proxy.findMany({
      include: { server: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Proxy | null> {
    return prisma.proxy.findUnique({
      where: { id },
      include: { server: true },
    });
  }

  async create(data: Prisma.ProxyCreateInput): Promise<Proxy> {
    return prisma.proxy.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ProxyUpdateInput): Promise<Proxy> {
    return prisma.proxy.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Proxy> {
    return prisma.proxy.delete({
      where: { id },
    });
  }
}

export const proxyRepository = new ProxyRepository();
