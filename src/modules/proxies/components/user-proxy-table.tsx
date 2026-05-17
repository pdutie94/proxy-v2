'use client';

import { Table, Chip } from '@heroui/react';
import { Clipboard, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ProxyWithServer } from '@/types';
import { copyToClipboard } from '@/utils/clipboard';
import { getCountdown } from '@/utils/date';
import Image from 'next/image';
import Link from 'next/link';

interface UserProxyTableProps {
  proxies: ProxyWithServer[];
}

export function UserProxyTable({ proxies }: UserProxyTableProps) {

  const handleCopy = (proxy: ProxyWithServer) => {
    const text = `${proxy.server.host}:${proxy.port}:${proxy.username}:${proxy.password}`;
    copyToClipboard(text).then(success => {
      if (success) toast.success('Đã sao chép Proxy!');
      else toast.error('Lỗi khi sao chép');
    });
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Chip size="sm" variant="soft" color="success" className="font-semibold text-[10px] uppercase">
            Hoạt động
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-semibold text-[10px] uppercase">
            Đang xử lý
          </Chip>
        );
    }
  };

  return (
    <div className="w-full border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <Table className="w-full text-left border-collapse">
        <Table.ScrollContainer>
          <Table.Content aria-label="Danh sách Proxy của tôi">
            <Table.Header className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50">
              <Table.Column isRowHeader className="py-2.5 px-3">Quốc gia</Table.Column>
              <Table.Column className="py-2.5 px-3">IP:Port</Table.Column>
              <Table.Column className="py-2.5 px-3">Thông tin đăng nhập</Table.Column>
              <Table.Column className="py-2.5 px-3">Hạn dùng</Table.Column>
              <Table.Column className="py-2.5 px-3">Trạng thái</Table.Column>
              <Table.Column className="py-2.5 px-3 text-right">Thao tác</Table.Column>
            </Table.Header>
            <Table.Body className="divide-y divide-slate-100 text-xs">
              {proxies.map((proxy) => (
                <Table.Row key={proxy.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                  <Table.Cell className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {proxy.server.location?.countryCode && (
                        <Image 
                          src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${proxy.server.location.countryCode.toUpperCase()}.svg`} 
                          width={20} 
                          height={14}
                          alt={proxy.server.location.countryCode}
                          style={{ borderRadius: '2px', border: '1px solid #E2E8F0', display: 'block' }}
                        />
                      )}
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800">
                          {proxy.server.location?.name || 'Việt Nam'}
                        </span>
                        <div className="flex items-center mt-0.5">
                          <Chip size="sm" variant="soft" color="accent" className="font-semibold text-[9px] uppercase px-1 py-0 h-4">
                            {proxy.ipType}
                          </Chip>
                        </div>
                      </div>
                    </div>
                  </Table.Cell>
                  
                  <Table.Cell className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                    {proxy.server.host}:{proxy.port}
                  </Table.Cell>

                  <Table.Cell className="py-2.5 px-3">
                    <div className="space-y-0.5">
                      <div className="font-mono text-slate-500 text-[11px]">
                        <span className="text-slate-400">User:</span> {proxy.username}
                      </div>
                      <div className="font-mono text-slate-500 text-[11px]">
                        <span className="text-slate-400">Pass:</span> {proxy.password}
                      </div>
                    </div>
                  </Table.Cell>

                  <Table.Cell className="py-2.5 px-3">
                    {(() => {
                      const isExpired = proxy.expiresAt ? new Date(proxy.expiresAt) <= new Date() : false;
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span className={`font-semibold ${isExpired ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {proxy.expiresAt ? format(new Date(proxy.expiresAt), 'dd/MM/yy HH:mm') : 'Vĩnh viễn'}
                          </span>
                          {proxy.expiresAt && (
                            <span className={`text-[10px] font-bold ${isExpired ? 'text-slate-400' : 'text-amber-600'}`}>
                              {isExpired ? 'Hết hạn' : `Còn ${getCountdown(proxy.expiresAt)}`}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </Table.Cell>

                  <Table.Cell className="py-2.5 px-3">
                    {getStatusChip(proxy.status)}
                  </Table.Cell>

                  <Table.Cell className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <button
                        onClick={() => handleCopy(proxy)}
                        className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        title="Sao chép"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                      </button>
                      {proxy.comment && (
                        <div className="group relative cursor-pointer text-slate-400 hover:text-slate-600 p-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block w-36 bg-slate-800 text-[10px] text-white p-2 rounded shadow-lg z-20 pointer-events-none leading-relaxed text-left">
                            {proxy.comment}
                          </div>
                        </div>
                      )}
                      <Link
                        href={`/user/proxies/${proxy.id}`}
                        className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
              {proxies.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={6} className="py-16 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <span>Bạn chưa có Proxy nào.</span>
                      <Link 
                        href="/"
                        className="text-xs text-blue-500 hover:underline font-bold"
                      >
                        Mua Proxy đầu tiên ngay
                      </Link>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
