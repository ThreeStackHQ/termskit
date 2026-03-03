import { NextRequest, NextResponse } from 'next/server';
import { getDb, reacceptanceCampaigns, policies, acceptances } from '@termskit/db';
import { eq, and, ne } from 'drizzle-orm';
import { Resend } from 'resend';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function GET(req: NextRequest) {
  const secret =
    req.headers.get('x-cron-secret') ??
    req.nextUrl.searchParams.get('secret');

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const resend = new Resend(process.env.RESEND_API_KEY!);

  const activeCampaigns = await db
    .select()
    .from(reacceptanceCampaigns)
    .where(
      and(
        eq(reacceptanceCampaigns.status, 'active'),
        eq(reacceptanceCampaigns.notifyByEmail, true)
      )
    );

  let emailsSent = 0;

  for (const campaign of activeCampaigns) {
    const policyRows = await db
      .select()
      .from(policies)
      .where(eq(policies.id, campaign.policyId))
      .limit(1);

    if (!policyRows.length) continue;

    const oldVersionAcceptances = await db
      .select({ externalUserId: acceptances.externalUserId })
      .from(acceptances)
      .where(
        and(
          eq(acceptances.policyId, campaign.policyId),
          ne(acceptances.version, campaign.targetVersion)
        )
      );

    const newVersionAcceptances = await db
      .select({ externalUserId: acceptances.externalUserId })
      .from(acceptances)
      .where(
        and(
          eq(acceptances.policyId, campaign.policyId),
          eq(acceptances.version, campaign.targetVersion)
        )
      );

    const newVersionUserIds = new Set(
      newVersionAcceptances.map((a) => a.externalUserId)
    );

    const usersNeedingReacceptance = [
      ...new Set(
        oldVersionAcceptances
          .filter((a) => !newVersionUserIds.has(a.externalUserId))
          .map((a) => a.externalUserId)
      ),
    ];

    const policyName = escapeHtml(policyRows[0]!.displayName);
    const targetVersion = escapeHtml(campaign.targetVersion);

    for (const userId of usersNeedingReacceptance.slice(0, 100)) {
      // Only email if userId looks like an email address
      if (!userId.includes('@')) continue;

      const safeUserId = escapeHtml(userId);
      try {
        await resend.emails.send({
          from: 'noreply@termskit.threestack.io',
          to: userId,
          subject: `Action Required: Please accept the updated ${policyName}`,
          html: `
            <h2>Policy Update Required</h2>
            <p>The <strong>${policyName}</strong> has been updated to version <strong>${targetVersion}</strong>.</p>
            <p>Please review and accept the updated policy to continue using the service.</p>
            <p>User ID: ${safeUserId}</p>
          `,
        });
        emailsSent++;
      } catch {
        // Ignore individual email failures
      }
    }
  }

  return NextResponse.json({
    emailsSent,
    campaigns: activeCampaigns.length,
  });
}
