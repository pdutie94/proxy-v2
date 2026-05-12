import { z } from 'zod';

export const bulkProxySchema = z.object({
  userId: z.string().optional().nullable(),
  serverId: z.string().min(1, 'Máy chủ là bắt buộc'),
  startPort: z.number().int().min(1024, 'Port tối thiểu là 1024').max(65535, 'Port tối đa là 65535'),
  count: z.number().int().min(1, 'Số lượng tối thiểu là 1').max(1000, 'Số lượng tối đa 1 lần là 1000'),
  username: z.string().min(1, 'Tài khoản là bắt buộc'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  ipType: z.enum(['IPv4', 'IPv6']).default('IPv6'),
  proxyType: z.enum(['HTTP', 'SOCKS5']).default('SOCKS5'),
  expiresAt: z.string().optional().nullable(),
  autoRenew: z.boolean().default(false),
  renewalDuration: z.string().default('1m'),
  comment: z.string().optional().nullable(),
});

export type BulkProxySchema = z.infer<typeof bulkProxySchema>;
