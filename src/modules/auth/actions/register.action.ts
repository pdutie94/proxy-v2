'use server';

import { authService } from '../services/auth.service';
import { registerSchema, RegisterInput } from '../types';

export async function registerAction(data: RegisterInput) {
  try {
    const validatedData = registerSchema.parse(data);
    const user = await authService.register(validatedData);
    
    return { 
      success: true, 
      message: 'Đăng ký tài khoản thành công.',
      data: { id: user.id, email: user.email }
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: error.message || 'Có lỗi xảy ra trong quá trình đăng ký.' 
    };
  }
}
