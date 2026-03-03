import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getDb,
  policies,
  workspaces,
  reacceptanceCampaigns,
  acceptances,
} from '@termskit/db';
import { eq, and, countDistinct } from 'drizzle-orm';
import { z } from 'zod';

const bodySchema = z.object({
  version: z.string().min(1),
  notifyByEmail: z.boolean().optional(),
});

export async function PATCH(
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

  const body = await req.json();
  const { version, notifyByEmail } = bodySchema.parse(body);

  const policy = await db
    .select()
    .from(policies)
    .where(and(eq(policies.id, params.id), eq(policies.workspaceId, ws[0]!.id)))
    .limit(1);

  if (!policy.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db
    .update(policies)
    .set({ currentVersion: version, updatedAt: new Date() })
    .where(and(eq(policies.id, params.id), eq(policies.workspaceId, ws[0]!.id)));

  // Auto-create re-acceptance campaign for paid plans
  if (ws[0]!.plan !== 'free') {
    const totalUsersResult = await db
      .select({ count: countDistinct(acceptances.externalUserId) })
      .from(acceptances)
      .where(eq(acceptances.policyId, params.id));

    const totalUsers = Number(totalUsersResult[0]?.count ?? 0);

    await db.insert(reacceptanceCampaigns).values({
      policyId: params.id,
      targetVersion: version,
      status: 'active',
      notifyByEmail: notifyByEmail ?? false,
      totalUsers,
      completedCount: 0,
    });
  }

  return NextResponse.json({ success: true, version });
}
