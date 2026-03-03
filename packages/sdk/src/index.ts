export interface RecordMeta {
  ip?: string;
  userAgent?: string;
}

export class TermsKit {
  constructor(
    private apiKey: string,
    private baseUrl = 'https://api.termskit.threestack.io'
  ) {}

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Check whether a user has accepted a specific policy (current version).
   */
  async hasAccepted(
    userId: string,
    slug: string
  ): Promise<{ accepted: boolean; version: string }> {
    const res = await fetch(
      `${this.baseUrl}/api/v1/status?policySlug=${encodeURIComponent(slug)}&userId=${encodeURIComponent(userId)}`,
      { headers: this.headers }
    );
    if (!res.ok) throw new Error(`TermsKit: hasAccepted failed (${res.status})`);
    return res.json() as Promise<{ accepted: boolean; version: string }>;
  }

  /**
   * Record a user's acceptance of a policy version.
   */
  async record(
    userId: string,
    slug: string,
    version: string,
    meta?: RecordMeta
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/accept`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ policySlug: slug, userId, version, ...meta }),
    });
    if (!res.ok) throw new Error(`TermsKit: record failed (${res.status})`);
  }

  /**
   * Trigger a re-acceptance campaign for a policy.
   */
  async requireReAcceptance(slug: string, version: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/require`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ policySlug: slug, targetVersion: version }),
    });
    if (!res.ok)
      throw new Error(`TermsKit: requireReAcceptance failed (${res.status})`);
  }

  /**
   * Generate a hosted gate URL for a user to accept a policy.
   * The uid parameter must be computed server-side using HMAC-SHA256.
   * uid = crypto.createHmac('sha256', TERMSKIT_HMAC_SECRET).update(userId).digest('hex')
   */
  gateUrl(
    userId: string,
    slug: string,
    returnUrl: string,
    options?: { workspaceSlug?: string; uid?: string }
  ): string {
    const workspaceSlug = options?.workspaceSlug ?? 'default';
    const params = new URLSearchParams({ userId, return: returnUrl });
    if (options?.uid) params.set('uid', options.uid);
    return `${this.baseUrl}/g/${workspaceSlug}/${slug}?${params.toString()}`;
  }
}
