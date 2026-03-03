export interface RecordMeta {
  ip?: string;
  userAgent?: string;
}

export class TermsKit {
  constructor(
    private apiKey: string,
    private baseUrl = 'https://termskit.threestack.io'
  ) {}

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Check whether a user has accepted a specific policy (any version).
   */
  async hasAccepted(userId: string, policySlug: string): Promise<boolean> {
    const res = await fetch(
      `${this.baseUrl}/api/v1/policies/${policySlug}/check?userId=${encodeURIComponent(userId)}`,
      { headers: this.headers }
    );
    if (!res.ok) throw new Error(`TermsKit: hasAccepted failed (${res.status})`);
    const data = (await res.json()) as { accepted: boolean };
    return data.accepted;
  }

  /**
   * Record a user's acceptance of a policy version.
   */
  async record(
    userId: string,
    policySlug: string,
    version: string,
    meta?: RecordMeta
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/policies/${policySlug}/accept`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ userId, version, ...meta }),
    });
    if (!res.ok) throw new Error(`TermsKit: record failed (${res.status})`);
  }

  /**
   * Trigger a re-acceptance campaign for a policy.
   */
  async requireReAcceptance(policySlug: string, targetVersion: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/policies/${policySlug}/campaigns`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ targetVersion }),
    });
    if (!res.ok)
      throw new Error(`TermsKit: requireReAcceptance failed (${res.status})`);
  }

  /**
   * Generate a hosted gate URL for a user to accept a policy.
   */
  gateUrl(userId: string, policySlug: string, returnUrl: string): string {
    const params = new URLSearchParams({
      userId,
      returnUrl,
    });
    return `${this.baseUrl}/g/${policySlug}?${params.toString()}`;
  }
}
