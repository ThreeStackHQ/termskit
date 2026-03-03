import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getDb, workspaces, subscriptions } from '@termskit/db';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? ''
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = getDb();

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const workspaceId = checkoutSession.metadata?.workspaceId;
    if (!workspaceId) return NextResponse.json({ received: true });

    const stripeSubscription = await getStripe().subscriptions.retrieve(
      checkoutSession.subscription as string
    );
    const firstItem = stripeSubscription.items.data[0];
    const priceId = firstItem?.price.id;
    // In Stripe v20, current_period_end moved to SubscriptionItem level
    const periodEnd = (firstItem as unknown as { current_period_end?: number })?.current_period_end;
    const plan: 'indie' | 'pro' =
      priceId === process.env.STRIPE_PRICE_PRO ? 'pro' : 'indie';

    await db.update(workspaces).set({ plan }).where(eq(workspaces.id, workspaceId));

    const existingSub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.workspaceId, workspaceId))
      .limit(1);

    if (existingSub.length) {
      await db
        .update(subscriptions)
        .set({
          stripeCustomerId: checkoutSession.customer as string,
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: priceId ?? null,
          status: stripeSubscription.status,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.workspaceId, workspaceId));
    } else {
      await db.insert(subscriptions).values({
        workspaceId,
        stripeCustomerId: checkoutSession.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId ?? null,
        status: stripeSubscription.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      });
    }
  }

  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const firstItem = subscription.items.data[0];
    const priceId = firstItem?.price.id;
    const periodEnd = (firstItem as unknown as { current_period_end?: number })?.current_period_end;
    const plan: 'free' | 'indie' | 'pro' =
      event.type === 'customer.subscription.deleted'
        ? 'free'
        : priceId === process.env.STRIPE_PRICE_PRO
        ? 'pro'
        : 'indie';

    const existingSub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
      .limit(1);

    if (existingSub.length) {
      await db
        .update(workspaces)
        .set({ plan })
        .where(eq(workspaces.id, existingSub[0]!.workspaceId));

      await db
        .update(subscriptions)
        .set({
          status: subscription.status,
          stripePriceId: priceId ?? null,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
    }
  }

  return NextResponse.json({ received: true });
}
