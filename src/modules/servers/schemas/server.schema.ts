import { z } from 'zod';

export const serverSchema = z.object({
  name: z.string().min(1, 'Tên server là bắt buộc'),
  host: z.string().min(1, 'Địa chỉ host là bắt buộc'),
  port: z.number({ message: 'Cổng SSH là bắt buộc' }),
  username: z.string().min(1, 'Tài khoản SSH là bắt buộc'),
  password: z.string().optional(),
  ipv6: z.string().min(1, 'IPv6 Prefix là bắt buộc (Ví dụ: 2001:19f0:4401:903)'),
  maxProxies: z.number({ message: 'Số lượng Proxy tối đa là bắt buộc' }),
  startPort: z.number({ message: 'Cổng bắt đầu là bắt buộc' }),
  autoRotate: z.boolean(),
  rotationInterval: z.number({ message: 'Chu kỳ xoay phải là số' }),
  provider: z.string().optional(),
  locationId: z.string().optional(),
  notes: z.string().optional(),
});

export type ServerSchema = z.infer<typeof serverSchema>;
