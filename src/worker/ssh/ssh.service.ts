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
    let password = undefined;
    
    if (server.passwordEncrypted) {
      try {
        password = decrypt(server.passwordEncrypted);
      } catch (err: any) {
        throw new Error('Không thể giải mã mật khẩu server. Kiểm tra ENCRYPTION_KEY.');
      }
    }

    const maxAttempts = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`[SSH] Thử lại kết nối lần ${attempt}/${maxAttempts} tới ${server.host}...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Chờ 2s trước khi thử lại
        } else {
          console.log(`[SSH] Đang kết nối tới ${server.host}. KeyHint: ${keyHint}`);
        }

        await new Promise<void>((resolve, reject) => {
          const conn = this.client;
          const onReady = () => {
            conn.removeListener('error', onError);
            resolve();
          };
          const onError = (err: any) => {
            conn.removeListener('ready', onReady);
            reject(err);
          };

          conn.once('ready', onReady);
          conn.once('error', onError);

          conn.connect({
            host: server.host,
            port: server.port,
            username: server.username,
            password: password,
            readyTimeout: 30000, // 30s mỗi lần thử
            keepaliveInterval: 10000,
            keepaliveCountMax: 3,
          });
        });
        
        return; // Kết nối thành công
      } catch (err: any) {
        lastError = err;
        this.client.end(); // Đảm bảo đóng socket trước khi thử lại
        this.client = new Client(); // Tạo client mới cho lần thử sau
        if (attempt === maxAttempts) break;
      }
    }

    throw new Error(`Không thể kết nối SSH sau ${maxAttempts} lần thử: ${lastError?.message}`);
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
