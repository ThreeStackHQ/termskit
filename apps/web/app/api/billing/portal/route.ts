import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { getDb, workspaces, subscriptions } from '@termskit/db';
import { eq } from 'drizzle-orm';

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

  if (!ws.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, ws[0]!.id))
    .limit(1);

  if (!sub.length) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ?? 'https://termskit.threestack.io';

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: sub[0]!.stripeCustomerId,
    return_url: `${baseUrl}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
