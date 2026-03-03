import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb, policies, workspaces, acceptances } from '@termskit/db';
import { eq, and, lt, desc } from 'drizzle-orm';

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

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');

  const whereClause = cursor
    ? and(
        eq(acceptances.policyId, params.id),
        lt(acceptances.acceptedAt, new Date(cursor))
      )
    : eq(acceptances.policyId, params.id);

  const rows = await db
    .select()
    .from(acceptances)
    .where(whereClause)
    .orderBy(desc(acceptances.acceptedAt))
    .limit(51);

  const hasMore = rows.length > 50;
  const items = rows.slice(0, 50);

  return NextResponse.json({
    items,
    nextCursor:
      hasMore && items.length > 0
        ? items[items.length - 1]!.acceptedAt.toISOString()
        : null,
  });
}
