"use client";

import { useState } from 'react';
import { ServerList } from '@/modules/servers/components/server-list';
import { AddServerForm } from '@/modules/servers/components/add-server-form';
import { Plus } from 'lucide-react';

export default function ServersPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Servers</h1>
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="h-8 px-3 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Server
          </button>
        )}
      </div>

      {showAddForm && (
        <AddServerForm onClose={() => setShowAddForm(false)} />
      )}

      <ServerList />
    </div>
  );
}
