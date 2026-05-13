import { userRepository } from '../repositories/user.repository';
import { UserSchema } from '../schemas/user.schema';
import bcrypt from 'bcryptjs';

import { Prisma } from '@prisma/client';
 
export class UserService {
  async getAllUsers() {
    return userRepository.findAll();
  }

  async createUser(data: UserSchema) {
    const { password, ...rest } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return userRepository.create({
      ...rest,
      password: hashedPassword,
    });
  }

  async deleteUser(id: string) {
    return userRepository.delete(id);
  }

  async updateUser(id: string, data: Partial<UserSchema>) {
    const { password, ...rest } = data;
    const updateData: Prisma.UserUpdateInput = { ...rest };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    return userRepository.update(id, updateData);
  }
}

export const userService = new UserService();
