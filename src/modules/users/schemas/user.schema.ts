import { z } from 'zod';
import { Role } from '@prisma/client';

export const userSchema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: z.nativeEnum(Role),
});

export type UserSchema = z.infer<typeof userSchema>;
