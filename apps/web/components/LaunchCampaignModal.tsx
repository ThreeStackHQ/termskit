'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Policy {
  id: string;
  name: string;
  currentVersion: string;
  userCount: number;
}

const MOCK_POLICIES: Policy[] = [
  { id: '1', name: 'Terms of Service', currentVersion: '2.0', userCount: 234 },
  { id: '2', name: 'Privacy Policy', currentVersion: '1.5', userCount: 189 },
];

interface LaunchCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLaunched?: () => void;
}

export function LaunchCampaignModal({ open, onOpenChange, onLaunched }: LaunchCampaignModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [policyId, setPolicyId] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [emailNotify, setEmailNotify] = useState(true);
  const [loading, setLoading] = useState(false);

  const selectedPolicy = MOCK_POLICIES.find((p) => p.id === policyId);

  function handleNext() {
    if (!policyId || !newVersion) return;
    setStep(2);
  }

  async function handleLaunch() {
    setLoading(true);
    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId, newVersion, emailNotify }),
      });
      onLaunched?.();
      onOpenChange(false);
      setStep(1);
      setPolicyId('');
      setNewVersion('');
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function handleClose(val: boolean) {
    if (!val) {
      setStep(1);
      setPolicyId('');
      setNewVersion('');
    }
    onOpenChange(val);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Launch Re-acceptance Campaign</DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Select a policy and set the new version to require re-acceptance.'
              : 'Review and confirm the campaign details.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="flex gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span className="text-sm text-white font-medium">Select Policy</span>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Policy</label>
              <Select value={policyId} onValueChange={setPolicyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a policy..." />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_POLICIES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (v{p.currentVersion})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">New Version</label>
              <input
                type="text"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="e.g. 3.0"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                disabled={!policyId || !newVersion}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span className="text-sm text-white font-medium">Preview &amp; Confirm</span>
            </div>

            {/* Preview card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <p className="text-sm text-slate-300">
                Updating{' '}
                <span className="text-white font-semibold">{selectedPolicy?.name}</span> from{' '}
                <span className="text-slate-400">v{selectedPolicy?.currentVersion}</span> to{' '}
                <span className="text-emerald-400 font-semibold">v{newVersion}</span>.
              </p>
              <p className="text-sm text-slate-400 mt-2">
                ~<span className="text-white font-semibold">{selectedPolicy?.userCount}</span>{' '}
                users will need to re-accept.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotify}
                onChange={(e) => setEmailNotify(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500"
              />
              <span className="text-sm text-slate-300">Send email notification to users</span>
            </label>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleLaunch}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? 'Launching...' : '🚀 Launch Campaign'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
