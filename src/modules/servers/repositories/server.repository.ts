import prisma from '@/lib/prisma';
import { Server, Prisma } from '@prisma/client';

export class ServerRepository {
  async findAll(): Promise<Server[]> {
    return prisma.server.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Server | null> {
    return prisma.server.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.ServerCreateInput): Promise<Server> {
    return prisma.server.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ServerUpdateInput): Promise<Server> {
    return prisma.server.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Server> {
    return prisma.server.delete({
      where: { id },
    });
  }
}

export const serverRepository = new ServerRepository();
