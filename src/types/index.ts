import { Proxy, Server, Role, ServerJob } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface ProxyWithServer extends Proxy {
  server: Server;
}

export interface ServerWithJobs extends Server {
  jobs: ServerJob[];
}

export interface JobWithDetails extends ServerJob {
  server?: { name: string } | null;
  proxy?: { port: number } | null;
}
