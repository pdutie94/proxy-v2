"use client";

import { useState } from 'react';
import { UserList } from '@/modules/users/components/user-list';
import { AddUserForm } from '@/modules/users/components/add-user-form';
import { UserPlus } from 'lucide-react';

export default function UsersPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">User Management</h1>
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="h-8 px-3 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add User
          </button>
        )}
      </div>

      {showAddForm && (
        <AddUserForm onClose={() => setShowAddForm(false)} />
      )}

      <UserList />
    </div>
  );
}
