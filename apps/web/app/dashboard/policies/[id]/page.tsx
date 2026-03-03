'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Mock data
const MOCK_POLICY = {
  id: '1',
  name: 'Terms of Service',
  slug: 'terms-of-service',
  version: '2.0',
  createdAt: '2026-01-01',
  totalAcceptances: 234,
  versionStats: [
    { version: '2.0', count: 134 },
    { version: '1.5', count: 67 },
    { version: '1.0', count: 33 },
  ],
  acceptedUsers: [
    { userId: 'usr_a1b2c3d4e5f6', version: '2.0', acceptedAt: '2026-03-01 14:32' },
    { userId: 'usr_b2c3d4e5f6a7', version: '2.0', acceptedAt: '2026-03-01 10:15' },
    { userId: 'usr_c3d4e5f6a7b8', version: '1.5', acceptedAt: '2026-02-28 09:00' },
  ],
};

export default function PolicyDetailPage({ params }: { params: { id: string } }) {
  const policy = MOCK_POLICY;
  const maxCount = Math.max(...policy.versionStats.map((v) => v.count), 1);

  const [updateOpen, setUpdateOpen] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (!newVersion) return;
    setLoading(true);
    try {
      await fetch(`/api/policies/${params.id}/version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: newVersion, releaseNotes, notifyUsers }),
      });
      setUpdateOpen(false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/dashboard/policies" className="hover:text-white transition-colors">
          Policies
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-white">{policy.name}</span>
      </nav>

      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{policy.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <code className="px-2 py-0.5 bg-slate-800 text-emerald-400 text-xs rounded font-mono">
                {policy.slug}
              </code>
              <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                v{policy.version}
              </span>
            </div>
          </div>
          <button
            onClick={() => setUpdateOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg border border-slate-700 transition-colors"
          >
            Update Version
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-2xl font-bold text-white">{policy.totalAcceptances}</div>
          <div className="text-sm text-slate-400 mt-1">Total Acceptances</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-2xl font-bold text-white">v{policy.version}</div>
          <div className="text-sm text-slate-400 mt-1">Current Version</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-2xl font-bold text-white">{policy.createdAt}</div>
          <div className="text-sm text-slate-400 mt-1">Created</div>
        </div>
      </div>

      {/* Acceptance by Version */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Acceptance by Version</h2>
        <div className="space-y-3">
          {policy.versionStats.map((v) => (
            <div key={v.version} className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded font-mono w-14 text-center flex-shrink-0">
                v{v.version}
              </span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(v.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-8 text-right">{v.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Accepted Users table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Accepted Users</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">User ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Version</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Accepted At</th>
            </tr>
          </thead>
          <tbody>
            {policy.acceptedUsers.map((u, i) => (
              <tr key={i} className="border-b border-slate-800 last:border-0">
                <td className="px-4 py-3">
                  <code className="text-xs text-slate-300 font-mono">
                    {u.userId.slice(0, 16)}...
                  </code>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                    v{u.version}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{u.acceptedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Update Version Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Version</DialogTitle>
            <DialogDescription>
              Bump the version to trigger re-acceptance from users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">New Version</label>
              <input
                type="text"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="e.g. 2.1"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Release Notes (optional)</label>
              <textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                rows={3}
                placeholder="What changed in this version..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyUsers}
                onChange={(e) => setNotifyUsers(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500"
              />
              <span className="text-sm text-slate-300">Notify users via email</span>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setUpdateOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={!newVersion || loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? 'Updating...' : 'Update Version'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
