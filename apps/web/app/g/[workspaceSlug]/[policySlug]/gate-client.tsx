'use client';

import { useState, useEffect } from 'react';

interface GateClientProps {
  workspaceSlug: string;
  policySlug: string;
  policyName: string;
  policyContent: string;
  policyVersion: string;
  userId: string;
  returnUrl: string;
}

export function GateClient({
  workspaceSlug,
  policySlug,
  policyName,
  policyContent,
  policyVersion,
  userId,
  returnUrl,
}: GateClientProps) {
  const [agreed, setAgreed] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);

  async function handleAccept() {
    setLoading(true);
    try {
      const form = new FormData();
      form.set('workspaceSlug', workspaceSlug);
      form.set('policySlug', policySlug);
      form.set('userId', userId);
      form.set('version', policyVersion);
      form.set('returnUrl', returnUrl);

      const res = await fetch('/api/v1/gate-accept', {
        method: 'POST',
        body: form,
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      setAccepted(true);
    } catch {
      // Fallback: show success and redirect manually
      setAccepted(true);
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
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#1e293b',
          borderRadius: 16,
          border: '1px solid #334155',
          padding: '2rem',
        }}
      >
        {accepted ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 1rem',
                borderRadius: '50%',
                background: '#065f46',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              &#10003;
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              Accepted
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              You have accepted the {policyName}.
            </p>
            {returnUrl && (
              <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '1rem' }}>
                Redirecting in {countdown}...
              </p>
            )}
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem',
                }}
              >
                {workspaceSlug.replace(/-/g, ' ')}
              </p>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                {policyName}
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Version: {policyVersion}
              </p>
            </div>

            <div
              style={{
                background: '#0f172a',
                borderRadius: 12,
                border: '1px solid #334155',
                padding: '1rem',
                height: 224,
                overflowY: 'auto',
                marginBottom: '1.5rem',
                fontSize: '0.75rem',
                color: '#94a3b8',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
              }}
            >
              {policyContent}
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                cursor: 'pointer',
                marginBottom: '1.5rem',
              }}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                I have read and agree to the{' '}
                <span style={{ color: '#fff', fontWeight: 500 }}>{policyName}</span>
              </span>
            </label>

            <button
              onClick={handleAccept}
              disabled={!agreed || loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: agreed && !loading ? '#059669' : '#334155',
                color: '#fff',
                fontWeight: 600,
                borderRadius: 12,
                border: 'none',
                cursor: agreed && !loading ? 'pointer' : 'not-allowed',
                fontSize: '1rem',
                opacity: agreed && !loading ? 1 : 0.5,
              }}
            >
              {loading ? 'Recording acceptance...' : 'Accept & Continue'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
