import { NextRequest, NextResponse } from 'next/server';
import { getDb, policies, workspaces, acceptances } from '@termskit/db';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const workspaceSlug = formData.get('workspaceSlug') as string | null;
  const policySlug = formData.get('policySlug') as string | null;
  const userId = formData.get('userId') as string | null;
  const version = formData.get('version') as string | null;
  const returnUrl = formData.get('returnUrl') as string | null;

  if (!workspaceSlug || !policySlug || !userId || !version || !returnUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Prevent open redirect — only allow absolute https URLs
  try {
    const parsed = new URL(returnUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return NextResponse.json({ error: 'Invalid returnUrl' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid returnUrl' }, { status: 400 });
  }

  const db = getDb();
  const ws = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, workspaceSlug))
    .limit(1);

  if (!ws.length) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const policy = await db
    .select()
    .from(policies)
    .where(and(eq(policies.workspaceId, ws[0]!.id), eq(policies.slug, policySlug)))
    .limit(1);

  if (!policy.length) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
  }

  await db
    .insert(acceptances)
    .values({
      workspaceId: ws[0]!.id,
      policyId: policy[0]!.id,
      version,
      externalUserId: userId,
      ip: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      method: 'gate',
    })
    .onConflictDoNothing();

  return NextResponse.redirect(returnUrl, 302);
}
