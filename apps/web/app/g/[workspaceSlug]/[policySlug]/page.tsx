import { notFound } from 'next/navigation';
import crypto from 'crypto';
import { getDb, policies, workspaces } from '@termskit/db';
import { eq, and } from 'drizzle-orm';

interface Props {
  params: { workspaceSlug: string; policySlug: string };
  searchParams: { uid?: string; userId?: string; return?: string };
}

export default async function GatePage({ params, searchParams }: Props) {
  const { workspaceSlug, policySlug } = params;
  const { uid, userId, return: returnUrl } = searchParams;

  if (!uid || !userId || !returnUrl) return notFound();

  // Validate HMAC to prevent IDOR
  try {
    const secret =
      process.env.TERMSKIT_HMAC_SECRET ?? 'default-build-secret-32-chars-xx';
    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(userId)
      .digest('hex');

    const uidBuf = Buffer.from(uid, 'hex');
    const expectedBuf = Buffer.from(expectedHmac, 'hex');

    if (
      uidBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(uidBuf, expectedBuf)
    ) {
      return notFound();
    }
  } catch {
    return notFound();
  }

  const db = getDb();
  const ws = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, workspaceSlug))
    .limit(1);

  if (!ws.length) return notFound();

  const policyRows = await db
    .select()
    .from(policies)
    .where(and(eq(policies.workspaceId, ws[0]!.id), eq(policies.slug, policySlug)))
    .limit(1);

  if (!policyRows.length) return notFound();

  const p = policyRows[0]!;

  return (
    <main
      style={{
        maxWidth: 700,
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1
        style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}
      >
        {p.displayName}
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Version: {p.currentVersion}
      </p>
      <div
        style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: '1.5rem',
          marginBottom: '2rem',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6,
        }}
      >
        {p.content}
      </div>
      <form action="/api/v1/gate-accept" method="POST">
        <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
        <input type="hidden" name="policySlug" value={policySlug} />
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="version" value={p.currentVersion} />
        <input type="hidden" name="returnUrl" value={returnUrl} />
        <button
          type="submit"
          style={{
            background: '#2563eb',
            color: '#fff',
            padding: '0.75rem 2rem',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          I Accept this Policy
        </button>
      </form>
    </main>
  );
}
