import { Client } from 'ssh2';
import { Server } from '@prisma/client';
import { decrypt } from '../../utils/crypto';

export interface SSHCommandResponse {
  stdout: string;
  stderr: string;
  code: number | null;
}

export class SSHService {
  private client: Client;

  constructor() {
    this.client = new Client();
  }

  async connect(server: Server): Promise<void> {
    const keyHint = (process.env.ENCRYPTION_KEY || 'default').substring(0, 3);
    console.log(`[SSH] Đang kết nối tới ${server.host}. KeyHint: ${keyHint}`);

    let password = undefined;
    if (server.passwordEncrypted) {
      try {
        password = decrypt(server.passwordEncrypted);
        console.log(`[SSH] Giải mã mật khẩu thành công. Độ dài: ${password.length}`);
      } catch (err: any) {
        console.error(`[SSH] LỖI giải mã mật khẩu: ${err.message}`);
        throw new Error('Không thể giải mã mật khẩu server. Kiểm tra ENCRYPTION_KEY.');
      }
    }

    return new Promise((resolve, reject) => {
      this.client
        .on('ready', () => resolve())
        .on('error', (err) => reject(err))
        .connect({
          host: server.host,
          port: server.port,
          username: server.username,
          password: password,
          readyTimeout: 20000,
        });
    });
  }

  async execute(command: string): Promise<SSHCommandResponse> {
    return new Promise((resolve, reject) => {
      this.client.exec(command, (err, stream) => {
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

  async disconnect(): Promise<void> {
    this.client.end();
  }
}

export const sshService = new SSHService();
