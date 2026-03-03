import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb, policies, workspaces, acceptances } from '@termskit/db';
import { eq, and, countDistinct } from 'drizzle-orm';
import { PLAN_LIMITS } from '@/lib/stripe';
import { z } from 'zod';

const createSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with hyphens'),
  displayName: z.string().min(1).max(100),
  content: z.string().optional(),
  currentVersion: z.string().optional(),
});

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

  const plan = ws[0]!.plan as 'free' | 'indie' | 'pro';
  const limit = PLAN_LIMITS[plan].policies;

  if (limit < 999999) {
    const count = await db
      .select({ count: countDistinct(policies.id) })
      .from(policies)
      .where(eq(policies.workspaceId, ws[0]!.id));
    if (Number(count[0]?.count ?? 0) >= limit) {
      return NextResponse.json(
        { error: 'Policy limit exceeded for your plan', upgradeUrl: '/billing' },
        { status: 403 }
      );
    }
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { slug, displayName, content, currentVersion } = parsed.data;

  const existing = await db
    .select()
    .from(policies)
    .where(and(eq(policies.workspaceId, ws[0]!.id), eq(policies.slug, slug)))
    .limit(1);

  if (existing.length) {
    return NextResponse.json({ error: 'Slug already exists in this workspace' }, { status: 409 });
  }

  const [policy] = await db
    .insert(policies)
    .values({
      workspaceId: ws[0]!.id,
      slug,
      displayName,
      content: content ?? '',
      currentVersion: currentVersion ?? 'v1.0',
    })
    .returning();

  return NextResponse.json(policy, { status: 201 });
}

export async function GET() {
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

  if (!ws.length) return NextResponse.json({ policies: [] });

  const policiesList = await db
    .select()
    .from(policies)
    .where(eq(policies.workspaceId, ws[0]!.id));

  const result = await Promise.all(
    policiesList.map(async (p) => {
      const totalUsersRes = await db
        .select({ count: countDistinct(acceptances.externalUserId) })
        .from(acceptances)
        .where(eq(acceptances.policyId, p.id));

      const acceptedCurrentRes = await db
        .select({ count: countDistinct(acceptances.externalUserId) })
        .from(acceptances)
        .where(and(eq(acceptances.policyId, p.id), eq(acceptances.version, p.currentVersion)));

      const total = Number(totalUsersRes[0]?.count ?? 0);
      const accepted = Number(acceptedCurrentRes[0]?.count ?? 0);

      return {
        ...p,
        stats: {
          totalUniqueUsers: total,
          acceptedCurrentVersion: accepted,
          percentageAccepted: total > 0 ? Math.round((accepted / total) * 100) : 0,
        },
      };
    })
  );

  return NextResponse.json({ policies: result });
}
