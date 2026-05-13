import { userRepository } from '../repositories/user.repository';
import { hash } from 'bcryptjs';
import { RegisterInput } from '../types';

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('Email đã tồn tại trong hệ thống.');
    }

    const hashedPassword = await hash(input.password, 12);
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const user = await userRepository.create({
      email: input.email,
      password: hashedPassword,
      role: 'USER',
      balance: 0,
      verificationToken,
    });

    // TODO: Send real email here
    console.log(`[AuthService] Đã đăng ký User ${user.email}. Verification Token: ${verificationToken}`);
    
    return user;
  }
}

export const authService = new AuthService();
