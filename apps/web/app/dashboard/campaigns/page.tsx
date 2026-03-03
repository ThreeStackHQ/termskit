'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { LaunchCampaignModal } from '@/components/LaunchCampaignModal';

interface Campaign {
  id: string;
  policyName: string;
  fromVersion: string;
  toVersion: string;
  completed: number;
  total: number;
  status: 'active' | 'completed';
  startDate: string;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    policyName: 'Terms of Service',
    fromVersion: '1.5',
    toVersion: '2.0',
    completed: 134,
    total: 234,
    status: 'active',
    startDate: '2026-02-28',
  },
  {
    id: '2',
    policyName: 'Privacy Policy',
    fromVersion: '1.0',
    toVersion: '1.5',
    completed: 189,
    total: 189,
    status: 'completed',
    startDate: '2026-02-01',
  },
];

function CircularProgress({
  completed,
  total,
  size = 64,
}: {
  completed: number;
  total: number;
  size?: number;
}) {
  const pct = total > 0 ? completed / total : 0;
  const deg = pct * 360;
  const inner = size * 0.6;
  const offset = (size - inner) / 2;

  return (
    <div
      className="rounded-full flex-shrink-0 relative"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(#10b981 ${deg}deg, #1e293b 0deg)`,
      }}
    >
      <div
        className="absolute rounded-full bg-slate-900"
        style={{ width: inner, height: inner, top: offset, left: offset }}
      />
      <div
        className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white"
        style={{ fontSize: size * 0.16 }}
      >
        {total > 0 ? Math.round(pct * 100) : 0}%
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Re-acceptance Campaigns</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Launch Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center">
          <p className="text-slate-400 text-sm mb-4">
            No campaigns yet. Launch one after updating your policy version.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Launch Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/dashboard/campaigns/${campaign.id}`}>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors cursor-pointer flex items-center gap-5">
                {/* Progress ring */}
                <CircularProgress completed={campaign.completed} total={campaign.total} />

                {/* Center info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">{campaign.policyName}</div>
                  <div className="text-sm text-slate-400 mt-0.5">
                    v{campaign.fromVersion} → v{campaign.toVersion}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {campaign.completed} / {campaign.total} users
                  </div>
                </div>

                {/* Right: status + date */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {campaign.status === 'active' ? (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded-full font-medium">
                      Completed
                    </span>
                  )}
                  <span className="text-xs text-slate-500">{campaign.startDate}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <LaunchCampaignModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onLaunched={() => setCampaigns((c) => c)}
      />
    </div>
  );
}
