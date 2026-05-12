import { z } from 'zod';

export const subnetSchema = z.object({
  ipv6Range: z.string().regex(/^[0-9a-fA-F:]+\/[0-9]+$/, {
    message: "Dải IPv6 không hợp lệ (ví dụ: 2001:db8:a::/64)",
  }),
  status: z.enum(['ACTIVE', 'BLOCKED']).optional().default('ACTIVE'),
});

export type SubnetSchema = z.infer<typeof subnetSchema>;
