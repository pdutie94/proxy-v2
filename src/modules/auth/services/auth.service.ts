import { userRepository } from '../repositories/user.repository';
import { hash } from 'bcryptjs';
import { RegisterInput } from '../types';

import { settingsService } from '@/modules/settings/services/settings.service';
import { sendVerificationEmail } from '@/lib/email';

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('Email đã tồn tại trong hệ thống.');
    }

    const hashedPassword = await hash(input.password, 12);
    
    // Kiểm tra cấu hình có bắt buộc xác thực email không
    const requireVerification = await settingsService.getSetting('REQUIRE_EMAIL_VERIFICATION', 'false');
    
    let verificationToken = null;
    let emailVerified = null;

    if (requireVerification === 'true') {
      // Mã OTP 6 số ngẫu nhiên
      verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    } else {
      // Nếu không bắt buộc, tự động đánh dấu là đã xác thực
      emailVerified = new Date();
    }

    const user = await userRepository.create({
      email: input.email,
      password: hashedPassword,
      role: 'USER',
      balance: 0,
      verificationToken,
      emailVerified,
    });

    if (requireVerification === 'true' && verificationToken) {
      try {
        await sendVerificationEmail(user.email, verificationToken);
      } catch (e) {
        console.error("Lỗi gửi email xác nhận:", e);
      }
    }
    
    return user;
  }
}

export const authService = new AuthService();
