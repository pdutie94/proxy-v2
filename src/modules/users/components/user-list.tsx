"use client";

import { useUsers } from '@/hooks/use-users';
import { Trash2, User as UserIcon, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function UserList() {
  const { users, isLoading, deleteMutation } = useUsers();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
          <tr>
            <th className="py-2 px-4">User Email</th>
            <th className="py-2 px-4">Role</th>
            <th className="py-2 px-4">Created At</th>
            <th className="py-2 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-2 px-4">
                <div className="flex items-center gap-2 font-medium text-slate-900">
                  <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                  {user.email}
                </div>
              </td>
              <td className="py-2 px-4">
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                )}>
                  {user.role === 'ADMIN' && <Shield className="h-2.5 w-2.5" />}
                  {user.role}
                </span>
              </td>
              <td className="py-2 px-4 text-slate-500 text-[12px]">
                {format(new Date(user.createdAt), 'MMM dd, yyyy')}
              </td>
              <td className="py-2 px-4 text-right">
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this user?')) {
                      deleteMutation.mutate(user.id);
                    }
                  }}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
