'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Policy {
  id: string;
  name: string;
  slug: string;
  version: string;
  acceptanceRate: number;
}

const MOCK_POLICIES: Policy[] = [];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>(MOCK_POLICIES);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    version: '1.0',
    content: '',
  });
  const [loading, setLoading] = useState(false);

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  }

  async function handleCreate() {
    setLoading(true);
    try {
      await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const newPolicy: Policy = {
        id: Date.now().toString(),
        name: form.name,
        slug: form.slug,
        version: form.version,
        acceptanceRate: 0,
      };
      setPolicies((p) => [...p, newPolicy]);
      setOpen(false);
      setForm({ name: '', slug: '', version: '1.0', content: '' });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Policies</h1>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Policy
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {policies.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm mb-4">
              No policies yet. Create your first policy to get started.
            </p>
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create Policy
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Version</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                  Acceptance Rate
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id} className="border-b border-slate-800 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/policies/${policy.id}`}
                      className="text-white hover:text-emerald-400 font-medium transition-colors"
                    >
                      {policy.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-0.5 bg-slate-800 text-emerald-400 text-xs rounded font-mono">
                      {policy.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                      v{policy.version}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${policy.acceptanceRate}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{policy.acceptanceRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/policies/${policy.id}/edit`}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/dashboard/policies/${policy.id}`}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Policy Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Policy</DialogTitle>
            <DialogDescription>Add a new Terms of Service or Privacy Policy.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Policy Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Terms of Service"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="terms-of-service"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 text-sm font-mono placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Current Version</label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Policy Content (Markdown)</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={6}
                placeholder="# Terms of Service&#10;&#10;By using TermsKit, you agree to..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name || loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create Policy'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
