import { z } from 'zod';

export const serverSchema = z.object({
  name: z.string().min(1, 'Tên server là bắt buộc'),
  host: z.string().min(1, 'Địa chỉ host là bắt buộc'),
  port: z.number().default(22),
  username: z.string().min(1, 'Tài khoản SSH là bắt buộc'),
  password: z.string().optional(),
  ipv6: z.string().optional(),
  maxProxies: z.number().default(100),
  provider: z.string().optional(),
  notes: z.string().optional(),
});

export type ServerSchema = z.infer<typeof serverSchema>;
