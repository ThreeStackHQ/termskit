import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb, policies, workspaces } from '@termskit/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const patchSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  content: z.string().optional(),
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

  const policy = await db
    .select()
    .from(policies)
    .where(and(eq(policies.id, params.id), eq(policies.workspaceId, ws[0]!.id)))
    .limit(1);

  if (!policy.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(policies)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(policies.id, params.id), eq(policies.workspaceId, ws[0]!.id)))
    .returning();

  return NextResponse.json(updated);
}
