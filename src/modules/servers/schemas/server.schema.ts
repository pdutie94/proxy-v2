import { z } from 'zod';
import { ServerAuthType } from '@prisma/client';

export const serverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  host: z.string().min(1, 'Host/IP is required'),
  port: z.number().int().default(22),
  username: z.string().min(1, 'Username is required'),
  authType: z.nativeEnum(ServerAuthType).default(ServerAuthType.PASSWORD),
  password: z.string().optional(),
  privateKey: z.string().optional(),
  maxProxies: z.number().int().min(1).default(100),
  provider: z.string().optional(),
  notes: z.string().optional(),
});

export type ServerSchema = z.infer<typeof serverSchema>;
