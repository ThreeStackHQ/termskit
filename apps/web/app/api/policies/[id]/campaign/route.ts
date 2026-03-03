import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb, policies, workspaces, reacceptanceCampaigns } from '@termskit/db';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const ws = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId))
    .limit(1);

  if (!ws.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const policy = await db
    .select()
    .from(policies)
    .where(and(eq(policies.id, params.id), eq(policies.workspaceId, ws[0]!.id)))
    .limit(1);

  if (!policy.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const campaign = await db
    .select()
    .from(reacceptanceCampaigns)
    .where(eq(reacceptanceCampaigns.policyId, params.id))
    .orderBy(desc(reacceptanceCampaigns.createdAt))
    .limit(1);

  if (!campaign.length) {
    return NextResponse.json({ error: 'No campaign found' }, { status: 404 });
  }

  const c = campaign[0]!;
  return NextResponse.json({
    totalUsers: c.totalUsers,
    completedCount: c.completedCount,
    percentage:
      c.totalUsers > 0 ? Math.round((c.completedCount / c.totalUsers) * 100) : 0,
    status: c.status,
    targetVersion: c.targetVersion,
  });
}
