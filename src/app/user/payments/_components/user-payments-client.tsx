'use client';

import { Table, Chip, Button } from '@heroui/react';
import { format } from 'date-fns';
import { useState } from 'react';

interface Transaction {
  id: string;
  amount: number | string;
  type: string;
  status: string;
  createdAt: Date | string;
  notes?: string | null;
}

interface UserPaymentsClientProps {
  transactions: Transaction[];
}

export function UserPaymentsClient({ transactions }: UserPaymentsClientProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  const getStatusChip = (status: string) => {
    return status === 'COMPLETED' ? (
      <Chip size="sm" variant="soft" color="success" className="font-medium text-[10px] uppercase">
        Thành công
      </Chip>
    ) : (
      <Chip size="sm" variant="soft" color="warning" className="font-medium text-[10px] uppercase">
        Chờ duyệt
      </Chip>
    );
  };

  const getTypeChip = (type: string) => {
    return type === 'DEPOSIT' ? (
      <Chip size="sm" variant="soft" color="success" className="font-medium text-[10px] uppercase">
        Nạp tiền
      </Chip>
    ) : (
      <Chip size="sm" variant="soft" color="accent" className="font-medium text-[10px] uppercase">
        Thanh toán
      </Chip>
    );
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Lịch sử giao dịch</h1>
        <p className="text-xs text-slate-400">Chi tiết các giao dịch nạp tiền và thanh toán của bạn</p>
      </div>

      {/* Transaction Table */}
      <div className="w-full border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <Table className="w-full text-left border-collapse">
          <Table.ScrollContainer>
            <Table.Content aria-label="Danh sách lịch sử giao dịch">
              <Table.Header className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50">
                <Table.Column isRowHeader className="py-2.5 px-3 w-40">Mã GD</Table.Column>
                <Table.Column className="py-2.5 px-3">Loại</Table.Column>
                <Table.Column className="py-2.5 px-3 w-36">Số tiền</Table.Column>
                <Table.Column className="py-2.5 px-3 w-32">Trạng thái</Table.Column>
                <Table.Column className="py-2.5 px-3 text-right">Thời gian</Table.Column>
              </Table.Header>
              <Table.Body className="divide-y divide-slate-100 text-xs">
                {paginatedTransactions.map((tx: Transaction) => (
                  <Table.Row key={tx.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                    <Table.Cell className="py-2.5 px-3 font-mono font-medium text-slate-400">
                      #{tx.id.slice(0, 10).toUpperCase()}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3">
                      {getTypeChip(tx.type)}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3">
                      <span className={`font-semibold text-sm ${tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'}{Number(tx.amount).toLocaleString()}đ
                      </span>
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3">
                      {getStatusChip(tx.status)}
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3 text-right text-slate-500 font-medium">
                      {format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm')}
                    </Table.Cell>
                  </Table.Row>
                ))}
                {paginatedTransactions.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                      Lịch sử nạp tiền và thanh toán hiện đang trống.
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
            <span className="text-slate-400 font-medium">Trang {page} / {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <Button
                isDisabled={page <= 1}
                onPress={() => setPage(page - 1)}
                className="px-2.5 py-1 text-sm border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-medium h-8 min-w-0 rounded-lg cursor-pointer transition-all"
              >
                Trước
              </Button>
              <Button
                isDisabled={page >= totalPages}
                onPress={() => setPage(page + 1)}
                className="px-2.5 py-1 text-sm border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-medium h-8 min-w-0 rounded-lg cursor-pointer transition-all"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
