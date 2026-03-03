import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceFromApiKey, corsHeaders } from '@/lib/api-key';
import { getDb, policies, reacceptanceCampaigns, acceptances } from '@termskit/db';
import { eq, and, countDistinct } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({
  policySlug: z.string().min(1),
  targetVersion: z.string().min(1),
  notifyByEmail: z.boolean().optional(),
});

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders();
  const workspace = await getWorkspaceFromApiKey(req);

  if (!workspace) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }
  if ('error' in workspace) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers });
  }

  if (workspace.plan === 'free') {
    return NextResponse.json(
      {
        error: 'Re-acceptance campaigns require Indie plan or higher',
        upgradeUrl: 'https://termskit.threestack.io/billing',
      },
      { status: 403, headers }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400, headers });
  }

  const { policySlug, targetVersion, notifyByEmail } = parsed.data;
  const db = getDb();

  const policy = await db
    .select()
    .from(policies)
    .where(and(eq(policies.workspaceId, workspace.id), eq(policies.slug, policySlug)))
    .limit(1);

  if (!policy.length) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404, headers });
  }

  const totalUsersResult = await db
    .select({ count: countDistinct(acceptances.externalUserId) })
    .from(acceptances)
    .where(eq(acceptances.policyId, policy[0]!.id));

  const totalUsers = Number(totalUsersResult[0]?.count ?? 0);

  const [campaign] = await db
    .insert(reacceptanceCampaigns)
    .values({
      policyId: policy[0]!.id,
      targetVersion,
      status: 'active',
      notifyByEmail: notifyByEmail ?? false,
      totalUsers,
      completedCount: 0,
    })
    .returning();

  return NextResponse.json(campaign, { status: 201, headers });
}
