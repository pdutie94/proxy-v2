import { z } from 'zod';
import { Role } from '@prisma/client';

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role).default(Role.USER),
});

export type UserSchema = z.infer<typeof userSchema>;
