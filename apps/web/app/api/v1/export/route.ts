import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb, workspaces, acceptances, policies } from '@termskit/db';
import { eq } from 'drizzle-orm';

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

export async function GET(req: NextRequest) {
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

  if (!ws.length) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  if (ws[0]!.plan !== 'pro') {
    return NextResponse.json(
      { error: 'Export requires Pro plan', upgradeUrl: '/billing' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'json';

  const rows = await db
    .select({
      userId: acceptances.externalUserId,
      version: acceptances.version,
      ip: acceptances.ip,
      userAgent: acceptances.userAgent,
      acceptedAt: acceptances.acceptedAt,
      policySlug: policies.slug,
    })
    .from(acceptances)
    .innerJoin(policies, eq(acceptances.policyId, policies.id))
    .where(eq(acceptances.workspaceId, ws[0]!.id));

  if (format === 'csv') {
    const header = 'userId,policySlug,version,ip,userAgent,acceptedAt\n';
    const csvRows = rows.map((r) =>
      [
        JSON.stringify(r.userId ?? ''),
        JSON.stringify(r.policySlug ?? ''),
        JSON.stringify(r.version ?? ''),
        JSON.stringify(r.ip ?? ''),
        JSON.stringify(r.userAgent ?? ''),
        r.acceptedAt.toISOString(),
      ].join(',')
    );
    const csv = header + csvRows.join('\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=acceptances.csv',
      },
    });
  }

  return NextResponse.json({ acceptances: rows });
}
