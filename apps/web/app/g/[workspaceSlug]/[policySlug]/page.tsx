import { notFound } from 'next/navigation';
import crypto from 'crypto';
import { getDb, policies, workspaces } from '@termskit/db';
import { eq, and } from 'drizzle-orm';
import { GateClient } from './gate-client';

interface Props {
  params: { workspaceSlug: string; policySlug: string };
  searchParams: { uid?: string; userId?: string; return?: string };
}

export default async function GatePage({ params, searchParams }: Props) {
  const { workspaceSlug, policySlug } = params;
  const { uid, userId, return: returnUrl } = searchParams;

  if (!uid || !userId || !returnUrl) return notFound();

  // SEC-002 / SEC-010: Validate HMAC-SHA256 signed uid param
  try {
    const secret =
      process.env.TERMSKIT_HMAC_SECRET ?? 'default-build-secret-32-chars-xx';

    // Verify HMAC includes expiry: uid = hex(hmac) + '.' + expiryTimestamp
    const parts = uid.split('.');
    if (parts.length !== 2) return notFound();

    const [hmacHex, expiryStr] = parts;
    if (!hmacHex || !expiryStr) return notFound();

    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || Date.now() > expiry) return notFound(); // 15-min expiry enforced

    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(`${userId}.${expiryStr}`)
      .digest('hex');

    const uidBuf = Buffer.from(hmacHex, 'hex');
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
    <GateClient
      workspaceSlug={workspaceSlug}
      policySlug={policySlug}
      policyName={p.displayName}
      policyContent={p.content}
      policyVersion={p.currentVersion}
      userId={userId}
      returnUrl={returnUrl}
    />
  );
}
