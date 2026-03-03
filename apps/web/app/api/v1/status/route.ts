import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceFromApiKey, corsHeaders } from '@/lib/api-key';
import { getDb, acceptances, policies } from '@termskit/db';
import { eq, and, desc } from 'drizzle-orm';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  const headers = corsHeaders();
  const workspace = await getWorkspaceFromApiKey(req);

  if (!workspace) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }
  if ('error' in workspace) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers });
  }

  const { searchParams } = new URL(req.url);
  const policySlug = searchParams.get('policySlug');
  const userId = searchParams.get('userId');

  if (!policySlug || !userId) {
    return NextResponse.json(
      { error: 'Missing policySlug or userId' },
      { status: 400, headers }
    );
  }

  const db = getDb();
  const policy = await db
    .select()
    .from(policies)
    .where(and(eq(policies.workspaceId, workspace.id), eq(policies.slug, policySlug)))
    .limit(1);

  if (!policy.length) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404, headers });
  }

  const acceptance = await db
    .select()
    .from(acceptances)
    .where(
      and(
        eq(acceptances.policyId, policy[0]!.id),
        eq(acceptances.externalUserId, userId),
        eq(acceptances.version, policy[0]!.currentVersion)
      )
    )
    .orderBy(desc(acceptances.acceptedAt))
    .limit(1);

  if (acceptance.length) {
    return NextResponse.json(
      {
        accepted: true,
        version: acceptance[0]!.version,
        acceptedAt: acceptance[0]!.acceptedAt.toISOString(),
      },
      { headers }
    );
  }

  return NextResponse.json(
    { accepted: false, version: policy[0]!.currentVersion, acceptedAt: null },
    { headers }
  );
}
