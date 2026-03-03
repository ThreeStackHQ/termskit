import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb, workspaceApiKeys, workspaces } from '@termskit/db';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
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

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const name = typeof body.name === 'string' ? body.name : 'Default';

  const rawBytes = crypto.randomBytes(32);
  const rawKey = 'tkl_' + rawBytes.toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const prefix = rawKey.slice(0, 12);

  await db.insert(workspaceApiKeys).values({
    workspaceId: ws[0]!.id,
    prefix,
    keyHash,
    name,
  });

  return NextResponse.json({ key: rawKey, prefix, name });
}
