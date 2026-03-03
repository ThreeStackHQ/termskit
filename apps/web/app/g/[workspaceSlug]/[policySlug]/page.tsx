'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface GatePageProps {
  params: { workspaceSlug: string; policySlug: string };
  searchParams: { uid?: string; return?: string };
}

export default function GatePage({ params, searchParams }: GatePageProps) {
  const { workspaceSlug, policySlug } = params;
  const returnUrl = searchParams.return;

  const [agreed, setAgreed] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Mock policy data (in production, fetch from API)
  const policy = {
    workspaceName: workspaceSlug.replace(/-/g, ' '),
    name: policySlug
      .split('-')
      .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
      .join(' '),
    content: `# Terms of Service

Last updated: March 1, 2026

By using our services, you agree to these terms.

## 1. Acceptance of Terms

By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.

## 2. Use License

Permission is granted to temporarily use the service for personal, non-commercial transitory viewing only.

## 3. Disclaimer

The materials on this service are provided on an 'as is' basis. The company makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

## 4. Limitations

In no event shall the company or its suppliers be liable for any damages arising out of the use or inability to use the materials on the service.

## 5. Privacy Policy

Your use of this service is also governed by our Privacy Policy.

## 6. Contact

If you have any questions about these terms, please contact us.`,
  };

  async function handleAccept() {
    setLoading(true);
    try {
      await fetch('/api/v1/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: searchParams.uid,
          workspaceSlug,
          policySlug,
        }),
      });
      setAccepted(true);
    } catch {
      setAccepted(true); // show success anyway for demo
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!accepted || !returnUrl) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          window.location.href = returnUrl;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [accepted, returnUrl]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-800 p-8">
        {accepted ? (
          /* Success state */
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Accepted ✓</h2>
            <p className="text-slate-400 text-sm">
              You have accepted the {policy.name}.
            </p>
            {returnUrl && (
              <p className="text-slate-500 text-xs mt-4">
                Redirecting in {countdown}...
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-semibold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                TermsKit
              </span>
            </div>

            {/* Workspace + policy name */}
            <div className="text-center mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 capitalize">
                {policy.workspaceName}
              </p>
              <h1 className="text-xl font-bold text-white">{policy.name}</h1>
            </div>

            {/* Policy content */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 h-56 overflow-y-auto mb-6">
              <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-mono">
                {policy.content}
              </div>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-300">
                I have read and agree to the{' '}
                <span className="text-white font-medium">{policy.name}</span>
              </span>
            </label>

            {/* Accept button */}
            <button
              onClick={handleAccept}
              disabled={!agreed || loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Recording acceptance...' : 'Accept & Continue'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
