import { Client } from 'ssh2';
import { Server } from '@prisma/client';
import { decrypt } from '../../utils/crypto';

export interface SSHCommandResponse {
  stdout: string;
  stderr: string;
  code: number | null;
}

export class SSHService {
  private clients: Map<string, Client> = new Map();

  async connect(server: Server): Promise<Client> {
    // Check if we already have a connected client for this server
    if (this.clients.has(server.id)) {
      const existingClient = this.clients.get(server.id)!;
      // Note: In a real scenario, we might want to check if the connection is still alive
      // ssh2 clients don't have a simple .isConnected property, but we can rely on error/end listeners
      return existingClient;
    }

    let password = undefined;
    
    if (server.passwordEncrypted) {
      try {
        password = decrypt(server.passwordEncrypted);
      } catch {
        throw new Error('Không thể giải mã mật khẩu server. Kiểm tra ENCRYPTION_KEY.');
      }
    }

    const client = new Client();
    
    await new Promise<void>((resolve, reject) => {
      client
        .on('ready', () => {
          this.clients.set(server.id, client);
          resolve();
        })
        .on('error', (err) => {
          this.clients.delete(server.id);
          reject(err);
        })
        .on('end', () => {
          this.clients.delete(server.id);
        })
        .on('close', () => {
          this.clients.delete(server.id);
        })
        .connect({
          host: server.host,
          port: server.port,
          username: server.username,
          password: password,
          readyTimeout: 30000,
          keepaliveInterval: 10000,
          keepaliveCountMax: 3,
        });
    });

    return client;
  }

  async execute(server: Server, command: string): Promise<SSHCommandResponse> {
    const client = await this.connect(server);

    return new Promise((resolve, reject) => {
      client.exec(command, (err, stream) => {
        if (err) return reject(err);

        let stdout = '';
        let stderr = '';

        stream
          .on('close', (code: number | null) => {
            resolve({ stdout, stderr, code });
          })
          .on('data', (data: Buffer) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
          });
      });
    });
  }

  async disconnect(serverId: string): Promise<void> {
    if (this.clients.has(serverId)) {
      this.clients.get(serverId)?.end();
      this.clients.delete(serverId);
    }
  }

  async disconnectAll(): Promise<void> {
    this.clients.forEach(client => client.end());
    this.clients.clear();
  }
}

export const sshService = new SSHService();
