import { z } from 'zod';

export const proxySchema = z.object({
  serverId: z.string().min(1, 'Server is required'),
  port: z.number().int().min(1024).max(65535),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  ipv6: z.string().optional(),
  expiresAt: z.string().optional().transform((val) => val ? new Date(val) : null),
});

export type ProxySchema = z.infer<typeof proxySchema>;
