'use client';

import { Table, Chip, Button } from '@heroui/react';
import { format } from 'date-fns';
import { approveTransactionAction, rejectTransactionAction } from '@/modules/wallet/actions/admin-transaction.action';
import { toast } from 'sonner';
import { useState } from 'react';
import { Check, X } from 'lucide-react';

import { TransactionWithUser } from '@/types';

interface TransactionTableProps {
  transactions: TransactionWithUser[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      const result = await approveTransactionAction(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    try {
      const result = await rejectTransactionAction(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Chip size="sm" variant="soft" color="success" className="font-semibold text-[10px] uppercase">
            Thành công
          </Chip>
        );
      case 'PENDING':
        return (
          <Chip size="sm" variant="soft" color="warning" className="font-semibold text-[10px] uppercase">
            Chờ duyệt
          </Chip>
        );
      default:
        return (
          <Chip size="sm" variant="soft" color="danger" className="font-semibold text-[10px] uppercase">
            Đã từ chối
          </Chip>
        );
    }
  };

  const getTypeChip = (type: string) => {
    return type === 'DEPOSIT' ? (
      <Chip size="sm" variant="soft" color="success" className="font-semibold text-[10px] uppercase">
        Nạp tiền
      </Chip>
    ) : (
      <Chip size="sm" variant="soft" color="accent" className="font-semibold text-[10px] uppercase">
        Thanh toán
      </Chip>
    );
  };

  return (
    <div className="w-full border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <Table className="w-full text-left border-collapse">
        <Table.ScrollContainer>
          <Table.Content aria-label="Danh sách giao dịch hệ thống">
            <Table.Header className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50">
              <Table.Column isRowHeader className="py-2.5 px-3">Người dùng</Table.Column>
              <Table.Column className="py-2.5 px-3 w-36">Số tiền</Table.Column>
              <Table.Column className="py-2.5 px-3 w-28">Loại</Table.Column>
              <Table.Column className="py-2.5 px-3 w-28">Trạng thái</Table.Column>
              <Table.Column className="py-2.5 px-3 w-40">Thời gian</Table.Column>
              <Table.Column className="py-2.5 px-3 w-44 text-right">Thao tác</Table.Column>
            </Table.Header>
            <Table.Body className="divide-y divide-slate-100 text-xs">
              {paginatedTransactions.map((tx) => (
                <Table.Row key={tx.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                  <Table.Cell className="py-2.5 px-3 font-semibold text-slate-800">
                    {tx.user?.email}
                  </Table.Cell>
                  <Table.Cell className="py-2.5 px-3">
                    <span className={`font-bold text-xs ${tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{Number(tx.amount).toLocaleString()}đ
                    </span>
                  </Table.Cell>
                  <Table.Cell className="py-2.5 px-3">
                    {getTypeChip(tx.type)}
                  </Table.Cell>
                  <Table.Cell className="py-2.5 px-3">
                    {getStatusChip(tx.status)}
                  </Table.Cell>
                  <Table.Cell className="py-2.5 px-3 text-slate-500 font-medium">
                    {format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm')}
                  </Table.Cell>
                  <Table.Cell className="py-2.5 px-3 text-right">
                    {tx.status === 'PENDING' && tx.type === 'DEPOSIT' ? (
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="primary"
                          onPress={() => handleApprove(tx.id)}
                          isDisabled={loadingId !== null}
                          className="cursor-pointer font-bold h-7 text-[10px] px-2.5 rounded-lg inline-flex items-center gap-1 border-0"
                        >
                          {loadingId === tx.id ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          onPress={() => handleReject(tx.id)}
                          isDisabled={loadingId !== null}
                          className="cursor-pointer font-bold h-7 text-[10px] px-2.5 rounded-lg inline-flex items-center gap-1 border-0 bg-red-600 hover:bg-red-700 text-white"
                        >
                          {loadingId === tx.id ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          Từ chối
                        </Button>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-semibold italic text-[11px]">
                        {tx.notes || '-'}
                      </span>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
              {paginatedTransactions.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Danh sách giao dịch trống.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {/* Compact Flat Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-slate-100 text-xs bg-slate-50/50">
          <span className="text-slate-400 font-semibold">Trang {page} / {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <Button
              isDisabled={page <= 1}
              onPress={() => setPage(page - 1)}
              className="px-2.5 py-1 text-xs border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold h-7 min-w-0 rounded-lg cursor-pointer transition-all"
            >
              Trước
            </Button>
            <Button
              isDisabled={page >= totalPages}
              onPress={() => setPage(page + 1)}
              className="px-2.5 py-1 text-xs border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold h-7 min-w-0 rounded-lg cursor-pointer transition-all"
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
