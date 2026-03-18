'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type Member = {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'Active' | 'Invited';
};

const MEMBERS: Member[] = [
  {
    id: 'alex-thompson',
    name: 'Alex Thompson',
    role: 'President',
    email: 'alex@techsoc.edu',
    status: 'Active',
  },
  {
    id: 'sarah-chen',
    name: 'Sarah Chen',
    role: 'Event Lead',
    email: 'sarah@techsoc.edu',
    status: 'Active',
  },
  {
    id: 'marcus-rodriguez',
    name: 'Marcus Rodriguez',
    role: 'Treasurer',
    email: 'marcus@techsoc.edu',
    status: 'Invited',
  },
];

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-green-50 text-green-700',
  Invited: 'bg-amber-50 text-amber-700',
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Member | null>(null);

  const startEditing = (member: Member) => {
    setEditingId(member.id);
    setDraft({ ...member });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEditing = () => {
    if (!draft || !editingId) return;

    setMembers((prev) =>
      prev.map((member) => (member.id === editingId ? { ...member, ...draft } : member))
    );
    setEditingId(null);
    setDraft(null);
  };

  const updateDraft = <K extends keyof Member>(key: K, value: Member[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      <main className="relative z-10 container mx-auto px-6 pt-28 pb-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Members</h1>
            <p className="text-gray-400">View who has access to your society dashboard.</p>
          </div>
          <button className="text-sm bg-orange-50 text-orange-600 font-medium px-4 py-2 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
            + Invite Member
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Member</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => {
                const isEditing = editingId === member.id;

                return (
                <tr key={member.id}>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="w-full text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                          value={draft?.name ?? ''}
                          onChange={(event) => updateDraft('name', event.target.value)}
                        />
                        <input
                          type="email"
                          className="w-full text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                          value={draft?.email ?? ''}
                          onChange={(event) => updateDraft('email', event.target.value)}
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                        value={draft?.role ?? ''}
                        onChange={(event) => updateDraft('role', event.target.value)}
                      />
                    ) : (
                      member.role
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <select
                        className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                        value={draft?.status ?? 'Active'}
                        onChange={(event) => updateDraft('status', event.target.value as Member['status'])}
                      >
                        <option value="Active">Active</option>
                        <option value="Invited">Invited</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[member.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {member.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          className="text-xs font-medium text-gray-500 hover:text-gray-900"
                          onClick={cancelEditing}
                          type="button"
                        >
                          Cancel
                        </button>
                        <button
                          className="text-xs font-medium text-orange-600 hover:text-orange-700"
                          onClick={saveEditing}
                          type="button"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        className="text-xs font-medium text-orange-600 hover:text-orange-700"
                        onClick={() => startEditing(member)}
                        type="button"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
