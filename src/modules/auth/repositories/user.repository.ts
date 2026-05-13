import prisma from '@/lib/prisma';
import { User } from '@prisma/client';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: any): Promise<User> {
    return prisma.user.create({
      data,
    });
  }
}

export const userRepository = new UserRepository();
