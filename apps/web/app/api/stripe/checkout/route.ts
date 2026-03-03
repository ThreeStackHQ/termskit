import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { getDb, workspaces, subscriptions } from '@termskit/db';
import { eq } from 'drizzle-orm';

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
  const priceId =
    typeof body.priceId === 'string'
      ? body.priceId
      : process.env.STRIPE_PRICE_INDIE ?? '';

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, ws[0]!.id))
    .limit(1);

  const stripe = getStripe();
  const baseUrl =
    process.env.NEXTAUTH_URL ?? 'https://termskit.threestack.io';

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?success=1`,
    cancel_url: `${baseUrl}/billing`,
    customer: sub[0]?.stripeCustomerId ?? undefined,
    metadata: { workspaceId: ws[0]!.id, userId },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
