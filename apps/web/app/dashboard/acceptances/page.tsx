'use client';

import { useState } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Acceptance {
  userId: string;
  policyName: string;
  version: string;
  acceptedAt: string;
  ip?: string;
}

const MOCK_DATA: Acceptance[] = [
  { userId: 'usr_a1b2c3d4e5f6', policyName: 'Terms of Service', version: '2.0', acceptedAt: '2026-03-01 14:32', ip: '192.168.1.1' },
  { userId: 'usr_b2c3d4e5f6a7', policyName: 'Privacy Policy', version: '1.5', acceptedAt: '2026-03-01 10:15', ip: '10.0.0.1' },
  { userId: 'usr_c3d4e5f6a7b8', policyName: 'Terms of Service', version: '1.0', acceptedAt: '2026-02-28 09:00' },
];

const PAGE_SIZE = 25;

export default function AcceptancesPage() {
  const [data] = useState<Acceptance[]>(MOCK_DATA);
  const [search, setSearch] = useState('');
  const [policyFilter, setPolicyFilter] = useState('all');
  const [versionFilter, setVersionFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = data.filter((a) => {
    if (search && !a.userId.toLowerCase().includes(search.toLowerCase())) return false;
    if (policyFilter !== 'all' && a.policyName !== policyFilter) return false;
    if (versionFilter !== 'all' && a.version !== versionFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const uniquePolicies = [...new Set(data.map((a) => a.policyName))];
  const uniqueVersions = [...new Set(data.map((a) => a.version))];

  function exportCSV() {
    const headers = ['userId', 'policyName', 'version', 'acceptedAt', 'ip'];
    const rows = filtered.map((a) =>
      [a.userId, a.policyName, a.version, a.acceptedAt, a.ip ?? ''].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'acceptance-log.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Acceptances</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg border border-slate-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user ID..."
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-64"
        />
        <Select value={policyFilter} onValueChange={setPolicyFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Policies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Policies</SelectItem>
            {uniquePolicies.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={versionFilter} onValueChange={setVersionFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Versions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Versions</SelectItem>
            {uniqueVersions.map((v) => (
              <SelectItem key={v} value={v}>
                v{v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">User ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Policy</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Version</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Accepted At</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">IP</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-slate-500">
                  No acceptances found.
                </td>
              </tr>
            ) : (
              paged.map((a, i) => (
                <tr key={i} className="border-b border-slate-800 last:border-0">
                  <td className="px-4 py-3">
                    <code className="text-xs text-slate-300 font-mono">{a.userId}</code>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{a.policyName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                      v{a.version}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{a.acceptedAt}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-mono">{a.ip ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-slate-400">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
