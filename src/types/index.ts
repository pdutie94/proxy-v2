import { Proxy, Server, Role, ServerJob, Transaction, Prisma, Location } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  emailVerified?: Date | null;
}

export interface ProxyWithServer extends Proxy {
  server: Server & { location?: Location | null };
  user?: { email: string } | null;
}

export interface ServerWithJobs extends Server {
  jobs: ServerJob[];
}

export interface JobWithDetails extends ServerJob {
  server?: { name: string } | null;
  proxy?: { port: number } | null;
}

export interface TransactionWithUser extends Omit<Transaction, 'amount' | 'createdAt'> {
  amount: number | string | Prisma.Decimal;
  createdAt: Date | string;
  user?: {
    email: string;
    balance: number | string | Prisma.Decimal;
  } | null;
}
