import { Shield, Users, Clock, PieChart } from 'lucide-react';

const kpiCards = [
  {
    label: 'Total Policies',
    value: '0',
    icon: Shield,
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
  },
  {
    label: 'Users Accepted',
    value: '0',
    icon: Users,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
  },
  {
    label: 'Pending Re-acceptance',
    value: '0',
    icon: Clock,
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
  },
  {
    label: 'Compliance Rate',
    value: '100%',
    icon: PieChart,
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
  },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5"
            >
              <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
                <Icon className={`h-5 w-5 ${card.text}`} />
              </div>
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <div className="text-sm text-slate-400 mt-1">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Policies table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Policies</h2>
          <div className="w-full">
            <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span>Name</span>
              <span>Version</span>
              <span>Acceptance Rate</span>
            </div>
            <div className="py-8 text-center text-sm text-slate-500">
              No policies yet. Create your first policy.
            </div>
          </div>
        </div>

        {/* Recent Acceptances */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Acceptances</h2>
          <div className="py-8 text-center text-sm text-slate-500">
            No acceptances recorded yet.
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="mt-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Campaigns</h2>
          <div className="py-8 text-center text-sm text-slate-500">
            No campaigns yet. Launch one after updating your policy version.
          </div>
        </div>
      </div>
    </div>
  );
}
