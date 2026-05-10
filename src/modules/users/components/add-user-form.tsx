"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserSchema } from '../schemas/user.schema';
import { useUsers } from '@/hooks/use-users';
import { Role } from '@prisma/client';
import { Loader2, X } from 'lucide-react';

interface AddUserFormProps {
  onClose: () => void;
}

export function AddUserForm({ onClose }: AddUserFormProps) {
  const { createMutation } = useUsers();
  const { register, handleSubmit, formState: { errors } } = useForm<UserSchema>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: Role.USER,
    }
  });

  const onSubmit = (data: UserSchema) => {
    createMutation.mutate(data, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-semibold text-slate-900">Add New User</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Email Address</label>
            <input 
              {...register('email')}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="user@example.com"
            />
            {errors.email && <p className="text-[10px] text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Password</label>
            <input 
              type="password"
              {...register('password')}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-[10px] text-red-500">{errors.password.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Role</label>
          <select 
            {...register('role')}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={Role.USER}>User</option>
            <option value={Role.ADMIN}>Admin</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button 
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={createMutation.isPending}
            className="h-9 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save User"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
