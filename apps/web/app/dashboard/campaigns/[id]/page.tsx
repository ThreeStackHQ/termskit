import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// Mock data
const MOCK_CAMPAIGN = {
  id: '1',
  policyName: 'Terms of Service',
  fromVersion: '1.5',
  toVersion: '2.0',
  completed: 23,
  total: 100,
  status: 'active' as const,
  startedAt: '2026-02-28',
  users: [
    { userId: 'usr_a1b2c3', emailSentAt: '2026-02-28 09:00', acceptedAt: '2026-02-28 14:32', status: 'done' as const },
    { userId: 'usr_b2c3d4', emailSentAt: '2026-02-28 09:00', acceptedAt: null, status: 'pending' as const },
    { userId: 'usr_c3d4e5', emailSentAt: '2026-02-28 09:00', acceptedAt: '2026-03-01 08:15', status: 'done' as const },
    { userId: 'usr_d4e5f6', emailSentAt: '2026-02-28 09:00', acceptedAt: null, status: 'pending' as const },
  ],
};

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = MOCK_CAMPAIGN;
  const pct = campaign.total > 0 ? campaign.completed / campaign.total : 0;
  const deg = pct * 360;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/dashboard/campaigns" className="hover:text-white transition-colors">
          Campaigns
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-white">{campaign.policyName}</span>
      </nav>

      {/* Large progress ring */}
      <div className="flex flex-col items-center py-8">
        <div
          className="rounded-full relative"
          style={{
            width: 160,
            height: 160,
            background: `conic-gradient(#10b981 ${deg}deg, #1e293b 0deg)`,
          }}
        >
          <div
            className="absolute rounded-full bg-slate-950"
            style={{ width: 100, height: 100, top: 30, left: 30 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {Math.round(pct * 100)}%
            </span>
          </div>
        </div>
        <p className="text-slate-300 mt-4 text-sm">
          <span className="text-white font-semibold">{campaign.completed}</span> /{' '}
          <span className="text-white font-semibold">{campaign.total}</span> users re-accepted
        </p>
        <div className="mt-3">
          {campaign.status === 'active' ? (
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full font-medium border border-emerald-500/20">
              Active
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-700 text-slate-400 text-xs rounded-full font-medium">
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Campaign details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Policy</div>
          <div className="text-sm font-medium text-white">{campaign.policyName}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">From Version</div>
          <div className="text-sm font-medium text-white">v{campaign.fromVersion}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">To Version</div>
          <div className="text-sm font-medium text-emerald-400">v{campaign.toVersion}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Started</div>
          <div className="text-sm font-medium text-white">{campaign.startedAt}</div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Users</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">User ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Email Sent</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Accepted At</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {campaign.users.map((u, i) => (
              <tr key={i} className="border-b border-slate-800 last:border-0">
                <td className="px-4 py-3">
                  <code className="text-xs text-slate-300 font-mono">{u.userId}</code>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{u.emailSentAt}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{u.acceptedAt ?? '—'}</td>
                <td className="px-4 py-3">
                  {u.status === 'done' ? (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
                      Done
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded-full">
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
