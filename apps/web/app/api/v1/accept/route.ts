import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceFromApiKey, corsHeaders } from '@/lib/api-key';
import { getDb, acceptances, policies, reacceptanceCampaigns } from '@termskit/db';
import { eq, and, countDistinct, sql } from 'drizzle-orm';
import { PLAN_LIMITS } from '@/lib/stripe';
import { z } from 'zod';

const schema = z.object({
  policySlug: z.string().min(1),
  userId: z.string().min(1),
  version: z.string().min(1),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
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

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400, headers });
  }

  const { policySlug, userId, version, ip, userAgent } = parsed.data;
  const db = getDb();

  const policy = await db
    .select()
    .from(policies)
    .where(and(eq(policies.workspaceId, workspace.id), eq(policies.slug, policySlug)))
    .limit(1);

  if (!policy.length) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404, headers });
  }

  const plan = workspace.plan as 'free' | 'indie' | 'pro';
  const limit = PLAN_LIMITS[plan].users;

  if (limit < 999999) {
    const countResult = await db
      .select({ count: countDistinct(acceptances.externalUserId) })
      .from(acceptances)
      .where(eq(acceptances.workspaceId, workspace.id));
    const currentCount = Number(countResult[0]?.count ?? 0);

    if (currentCount >= limit) {
      return NextResponse.json(
        { error: 'Plan limit exceeded', upgradeUrl: 'https://termskit.threestack.io/billing' },
        { status: 403, headers }
      );
    }
  }

  await db
    .insert(acceptances)
    .values({
      workspaceId: workspace.id,
      policyId: policy[0]!.id,
      version,
      externalUserId: userId,
      ip: ip ?? req.headers.get('x-forwarded-for') ?? null,
      userAgent: userAgent ?? req.headers.get('user-agent') ?? null,
      method: 'api',
    })
    .onConflictDoNothing();

  // Auto-increment campaign completedCount for active campaigns targeting this version
  const campaigns = await db
    .select()
    .from(reacceptanceCampaigns)
    .where(
      and(
        eq(reacceptanceCampaigns.policyId, policy[0]!.id),
        eq(reacceptanceCampaigns.status, 'active'),
        eq(reacceptanceCampaigns.targetVersion, version)
      )
    );

  for (const campaign of campaigns) {
    const allAcceptances = await db
      .select()
      .from(acceptances)
      .where(
        and(
          eq(acceptances.policyId, policy[0]!.id),
          eq(acceptances.externalUserId, userId)
        )
      )
      .limit(10);

    const hadOlderVersion = allAcceptances.some((a) => a.version !== version);
    if (hadOlderVersion) {
      await db
        .update(reacceptanceCampaigns)
        .set({
          completedCount: sql`${reacceptanceCampaigns.completedCount} + 1`,
        })
        .where(eq(reacceptanceCampaigns.id, campaign.id));
    }
  }

  return NextResponse.json({ success: true }, { headers });
}
