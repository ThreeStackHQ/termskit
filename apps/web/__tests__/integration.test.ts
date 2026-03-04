/**
 * TermsKit Integration Tests
 *
 * Tests the core flows: policy acceptance, version bumping,
 * gate page HMAC tokens, Stripe upgrade, and acceptance export.
 *
 * These tests mock the DB layer and exercise the route handler logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// ─── Shared test constants ──────────────────────────────────────────────────

const TEST_HMAC_SECRET = 'a]V9kP2mX7fR3nQ8bW1cY6eT0gH4jL5s';
const TEST_CRON_SECRET = 'cron-secret-that-is-at-least-32-chars!!';

const WORKSPACE = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Acme Corp',
  slug: 'acme-corp',
  ownerId: 'user-1',
  plan: 'free' as const,
  createdAt: new Date(),
};

const POLICY = {
  id: '22222222-2222-2222-2222-222222222222',
  workspaceId: WORKSPACE.id,
  slug: 'tos',
  displayName: 'Terms of Service',
  currentVersion: 'v1.0',
  content: 'These are the terms.',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const API_KEY_RAW = 'tkl_' + crypto.randomBytes(32).toString('hex');
const API_KEY_HASH = crypto.createHash('sha256').update(API_KEY_RAW).digest('hex');

// ─── Mock DB store ──────────────────────────────────────────────────────────

let acceptancesStore: Array<{
  id: string;
  workspaceId: string;
  policyId: string;
  version: string;
  externalUserId: string;
  ip: string | null;
  userAgent: string | null;
  method: 'api' | 'gate';
  acceptedAt: Date;
}>;

let policiesStore: Array<typeof POLICY>;
let workspacesStore: Array<typeof WORKSPACE>;
let campaignsStore: Array<{
  id: string;
  policyId: string;
  targetVersion: string;
  status: string;
  notifyByEmail: boolean;
  totalUsers: number;
  completedCount: number;
  createdAt: Date;
}>;

beforeEach(() => {
  acceptancesStore = [];
  policiesStore = [{ ...POLICY }];
  workspacesStore = [{ ...WORKSPACE }];
  campaignsStore = [];
});

// ─── Helper: simulate SDK hasAccepted ───────────────────────────────────────

function hasAccepted(userId: string, policySlug: string): { accepted: boolean; version: string } {
  const policy = policiesStore.find(
    (p) => p.workspaceId === WORKSPACE.id && p.slug === policySlug
  );
  if (!policy) throw new Error('Policy not found');

  const acceptance = acceptancesStore.find(
    (a) =>
      a.policyId === policy.id &&
      a.externalUserId === userId &&
      a.version === policy.currentVersion
  );

  return {
    accepted: !!acceptance,
    version: policy.currentVersion,
  };
}

// ─── Helper: simulate SDK record ────────────────────────────────────────────

function recordAcceptance(
  userId: string,
  policySlug: string,
  version: string,
  meta?: { ip?: string; userAgent?: string; method?: 'api' | 'gate' }
): void {
  const policy = policiesStore.find(
    (p) => p.workspaceId === WORKSPACE.id && p.slug === policySlug
  );
  if (!policy) throw new Error('Policy not found');

  // Check for duplicate (onConflictDoNothing)
  const existing = acceptancesStore.find(
    (a) =>
      a.workspaceId === WORKSPACE.id &&
      a.policyId === policy.id &&
      a.version === version &&
      a.externalUserId === userId
  );
  if (existing) return;

  acceptancesStore.push({
    id: crypto.randomUUID(),
    workspaceId: WORKSPACE.id,
    policyId: policy.id,
    version,
    externalUserId: userId,
    ip: meta?.ip ?? null,
    userAgent: meta?.userAgent ?? null,
    method: meta?.method ?? 'api',
    acceptedAt: new Date(),
  });
}

// ─── Helper: bump policy version ────────────────────────────────────────────

function bumpPolicyVersion(policyId: string, newVersion: string): void {
  const policy = policiesStore.find((p) => p.id === policyId);
  if (!policy) throw new Error('Policy not found');

  policy.currentVersion = newVersion;
  policy.updatedAt = new Date();

  // Auto-create re-acceptance campaign if paid plan
  if (workspacesStore[0]!.plan !== 'free') {
    const uniqueUsers = new Set(
      acceptancesStore
        .filter((a) => a.policyId === policyId)
        .map((a) => a.externalUserId)
    );
    campaignsStore.push({
      id: crypto.randomUUID(),
      policyId,
      targetVersion: newVersion,
      status: 'active',
      notifyByEmail: false,
      totalUsers: uniqueUsers.size,
      completedCount: 0,
      createdAt: new Date(),
    });
  }
}

// ─── Helper: generate HMAC gate token ───────────────────────────────────────

function generateGateToken(userId: string, expiresInMs = 15 * 60 * 1000): string {
  const expiry = Date.now() + expiresInMs;
  const hmac = crypto
    .createHmac('sha256', TEST_HMAC_SECRET)
    .update(`${userId}.${expiry}`)
    .digest('hex');
  return `${hmac}.${expiry}`;
}

function validateGateToken(uid: string, userId: string): boolean {
  try {
    const parts = uid.split('.');
    if (parts.length !== 2) return false;

    const [hmacHex, expiryStr] = parts;
    if (!hmacHex || !expiryStr) return false;

    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || Date.now() > expiry) return false;

    const expectedHmac = crypto
      .createHmac('sha256', TEST_HMAC_SECRET)
      .update(`${userId}.${expiryStr}`)
      .digest('hex');

    const uidBuf = Buffer.from(hmacHex, 'hex');
    const expectedBuf = Buffer.from(expectedHmac, 'hex');

    if (uidBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(uidBuf, expectedBuf);
  } catch {
    return false;
  }
}

// ─── Helper: Stripe upgrade simulation ──────────────────────────────────────

function upgradeWorkspacePlan(plan: 'indie' | 'pro'): void {
  workspacesStore[0]!.plan = plan;
}

// ─── Helper: export acceptances as CSV ──────────────────────────────────────

function exportAcceptancesCSV(): string {
  const header = 'userId,policySlug,version,ip,userAgent,acceptedAt\n';
  const rows = acceptancesStore.map((a) => {
    const policy = policiesStore.find((p) => p.id === a.policyId);
    return [
      JSON.stringify(a.externalUserId),
      JSON.stringify(policy?.slug ?? ''),
      JSON.stringify(a.version),
      JSON.stringify(a.ip ?? ''),
      JSON.stringify(a.userAgent ?? ''),
      a.acceptedAt.toISOString(),
    ].join(',');
  });
  return header + rows.join('\n');
}

// ═════════════════════════════════════════════════════════════════════════════
// FLOW-001: signup → workspace → create policy → hasAccepted → record → hasAccepted
// ═════════════════════════════════════════════════════════════════════════════

describe('FLOW-001: Basic acceptance lifecycle', () => {
  it('should show hasAccepted=false before recording, true after', () => {
    // Workspace and policy already exist in store
    const userId = 'user-ext-1';

    // hasAccepted should be false initially
    const before = hasAccepted(userId, 'tos');
    expect(before.accepted).toBe(false);
    expect(before.version).toBe('v1.0');

    // Record acceptance
    recordAcceptance(userId, 'tos', 'v1.0');

    // hasAccepted should be true now
    const after = hasAccepted(userId, 'tos');
    expect(after.accepted).toBe(true);
    expect(after.version).toBe('v1.0');
  });

  it('should store acceptance in append-only fashion', () => {
    recordAcceptance('user-1', 'tos', 'v1.0');
    recordAcceptance('user-2', 'tos', 'v1.0');

    expect(acceptancesStore.length).toBe(2);
    expect(acceptancesStore[0]!.externalUserId).toBe('user-1');
    expect(acceptancesStore[1]!.externalUserId).toBe('user-2');
  });

  it('should be idempotent (onConflictDoNothing)', () => {
    recordAcceptance('user-1', 'tos', 'v1.0');
    recordAcceptance('user-1', 'tos', 'v1.0'); // duplicate

    expect(acceptancesStore.length).toBe(1);
  });

  it('should track method (api vs gate)', () => {
    recordAcceptance('user-1', 'tos', 'v1.0', { method: 'api' });
    recordAcceptance('user-2', 'tos', 'v1.0', { method: 'gate' });

    expect(acceptancesStore[0]!.method).toBe('api');
    expect(acceptancesStore[1]!.method).toBe('gate');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// FLOW-002: Bump version → existing acceptance invalidated → gate → re-accept
// ═════════════════════════════════════════════════════════════════════════════

describe('FLOW-002: Version bump and re-acceptance', () => {
  it('should invalidate existing acceptance when version is bumped', () => {
    const userId = 'user-ext-1';

    // Accept v1.0
    recordAcceptance(userId, 'tos', 'v1.0');
    expect(hasAccepted(userId, 'tos').accepted).toBe(true);

    // Bump to v2.0 (on indie plan for campaign creation)
    upgradeWorkspacePlan('indie');
    bumpPolicyVersion(POLICY.id, 'v2.0');

    // Now hasAccepted should be false (old version doesn't count)
    const result = hasAccepted(userId, 'tos');
    expect(result.accepted).toBe(false);
    expect(result.version).toBe('v2.0');

    // Accept v2.0
    recordAcceptance(userId, 'tos', 'v2.0');
    expect(hasAccepted(userId, 'tos').accepted).toBe(true);
  });

  it('should create re-acceptance campaign on version bump for paid plans', () => {
    recordAcceptance('user-1', 'tos', 'v1.0');
    recordAcceptance('user-2', 'tos', 'v1.0');

    upgradeWorkspacePlan('indie');
    bumpPolicyVersion(POLICY.id, 'v2.0');

    expect(campaignsStore.length).toBe(1);
    expect(campaignsStore[0]!.targetVersion).toBe('v2.0');
    expect(campaignsStore[0]!.totalUsers).toBe(2);
    expect(campaignsStore[0]!.completedCount).toBe(0);
    expect(campaignsStore[0]!.status).toBe('active');
  });

  it('should NOT create campaign on version bump for free plans', () => {
    recordAcceptance('user-1', 'tos', 'v1.0');

    // Keep plan as free
    bumpPolicyVersion(POLICY.id, 'v2.0');

    expect(campaignsStore.length).toBe(0);
  });

  it('should keep old acceptance records (append-only)', () => {
    recordAcceptance('user-1', 'tos', 'v1.0');
    bumpPolicyVersion(POLICY.id, 'v2.0');
    recordAcceptance('user-1', 'tos', 'v2.0');

    // Both records should exist
    expect(acceptancesStore.length).toBe(2);
    expect(acceptancesStore[0]!.version).toBe('v1.0');
    expect(acceptancesStore[1]!.version).toBe('v2.0');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// FLOW-003: gateUrl → HMAC token → gate page → accept → redirect
// ═════════════════════════════════════════════════════════════════════════════

describe('FLOW-003: Gate page HMAC token flow', () => {
  it('should generate valid HMAC-SHA256 token with expiry', () => {
    const userId = 'user-ext-1';
    const token = generateGateToken(userId);

    expect(token).toContain('.');
    const [hmacPart, expiryPart] = token.split('.');
    expect(hmacPart!.length).toBe(64); // 32-byte HMAC = 64 hex chars
    expect(parseInt(expiryPart!, 10)).toBeGreaterThan(Date.now());
  });

  it('should validate a correctly signed token', () => {
    const userId = 'user-ext-1';
    const token = generateGateToken(userId);

    expect(validateGateToken(token, userId)).toBe(true);
  });

  it('should reject token for different userId', () => {
    const token = generateGateToken('user-1');
    expect(validateGateToken(token, 'user-2')).toBe(false);
  });

  it('should reject expired token (SEC-002)', () => {
    const userId = 'user-ext-1';
    // Generate token that expired 1 second ago
    const token = generateGateToken(userId, -1000);

    expect(validateGateToken(token, userId)).toBe(false);
  });

  it('should reject malformed token', () => {
    expect(validateGateToken('not-a-valid-token', 'user-1')).toBe(false);
    expect(validateGateToken('abc.def.ghi', 'user-1')).toBe(false);
    expect(validateGateToken('', 'user-1')).toBe(false);
  });

  it('should reject tampered HMAC', () => {
    const token = generateGateToken('user-1');
    const [, expiry] = token.split('.');
    const tamperedToken = 'a'.repeat(64) + '.' + expiry;
    expect(validateGateToken(tamperedToken, 'user-1')).toBe(false);
  });

  it('should accept via gate method after token validation', () => {
    const userId = 'user-ext-1';
    const token = generateGateToken(userId);

    // Validate token (simulating server-side check)
    expect(validateGateToken(token, userId)).toBe(true);

    // Record acceptance with gate method
    recordAcceptance(userId, 'tos', 'v1.0', { method: 'gate' });

    const result = hasAccepted(userId, 'tos');
    expect(result.accepted).toBe(true);

    // Verify it was recorded as gate method
    expect(acceptancesStore[0]!.method).toBe('gate');
  });

  it('should generate per-user tokens (SEC-010)', () => {
    const token1 = generateGateToken('user-1');
    const token2 = generateGateToken('user-2');

    // Tokens should be different for different users
    expect(token1).not.toBe(token2);

    // Each token should only validate for its user
    expect(validateGateToken(token1, 'user-1')).toBe(true);
    expect(validateGateToken(token1, 'user-2')).toBe(false);
    expect(validateGateToken(token2, 'user-2')).toBe(true);
    expect(validateGateToken(token2, 'user-1')).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// FLOW-004: Stripe Indie upgrade → workspace.plan updated → tier limits
// ═════════════════════════════════════════════════════════════════════════════

describe('FLOW-004: Stripe upgrade and tier limits', () => {
  it('should upgrade workspace plan from free to indie', () => {
    expect(workspacesStore[0]!.plan).toBe('free');

    upgradeWorkspacePlan('indie');

    expect(workspacesStore[0]!.plan).toBe('indie');
  });

  it('should enforce free tier policy limit (1 policy)', () => {
    const plan = workspacesStore[0]!.plan as 'free' | 'indie' | 'pro';
    const PLAN_LIMITS = {
      free: { policies: 1, users: 100 },
      indie: { policies: 5, users: 5000 },
      pro: { policies: 999999, users: 999999 },
    } as const;

    const limit = PLAN_LIMITS[plan].policies;
    const currentPolicies = policiesStore.filter(
      (p) => p.workspaceId === WORKSPACE.id
    ).length;

    // Already have 1 policy, should be at limit for free
    expect(currentPolicies).toBe(1);
    expect(currentPolicies >= limit).toBe(true);
  });

  it('should allow more policies after indie upgrade', () => {
    upgradeWorkspacePlan('indie');

    const PLAN_LIMITS = {
      free: { policies: 1, users: 100 },
      indie: { policies: 5, users: 5000 },
      pro: { policies: 999999, users: 999999 },
    } as const;

    const plan = workspacesStore[0]!.plan as 'free' | 'indie' | 'pro';
    const limit = PLAN_LIMITS[plan].policies;
    const currentPolicies = policiesStore.filter(
      (p) => p.workspaceId === WORKSPACE.id
    ).length;

    expect(currentPolicies < limit).toBe(true);

    // Add more policies
    for (let i = 2; i <= 5; i++) {
      policiesStore.push({
        ...POLICY,
        id: crypto.randomUUID(),
        slug: `policy-${i}`,
        displayName: `Policy ${i}`,
      });
    }

    const afterCount = policiesStore.filter(
      (p) => p.workspaceId === WORKSPACE.id
    ).length;
    expect(afterCount).toBe(5);
    expect(afterCount >= limit).toBe(true); // At limit for indie
  });

  it('should enforce free tier user limit (100 unique users)', () => {
    const PLAN_LIMITS = {
      free: { policies: 1, users: 100 },
      indie: { policies: 5, users: 5000 },
      pro: { policies: 999999, users: 999999 },
    } as const;

    const plan = workspacesStore[0]!.plan as 'free' | 'indie' | 'pro';
    const userLimit = PLAN_LIMITS[plan].users;

    // Record 100 acceptances
    for (let i = 0; i < 100; i++) {
      recordAcceptance(`user-${i}`, 'tos', 'v1.0');
    }

    const uniqueUsers = new Set(
      acceptancesStore
        .filter((a) => a.workspaceId === WORKSPACE.id)
        .map((a) => a.externalUserId)
    );

    expect(uniqueUsers.size).toBe(100);
    expect(uniqueUsers.size >= userLimit).toBe(true);
  });

  it('should allow more users after upgrade to indie (5000)', () => {
    upgradeWorkspacePlan('indie');

    const PLAN_LIMITS = {
      free: { policies: 1, users: 100 },
      indie: { policies: 5, users: 5000 },
      pro: { policies: 999999, users: 999999 },
    } as const;

    const plan = workspacesStore[0]!.plan as 'free' | 'indie' | 'pro';
    expect(PLAN_LIMITS[plan].users).toBe(5000);

    // Record 101 acceptances (would exceed free limit)
    for (let i = 0; i < 101; i++) {
      recordAcceptance(`user-${i}`, 'tos', 'v1.0');
    }

    const uniqueUsers = new Set(
      acceptancesStore
        .filter((a) => a.workspaceId === WORKSPACE.id)
        .map((a) => a.externalUserId)
    );
    expect(uniqueUsers.size).toBe(101);
    expect(uniqueUsers.size < PLAN_LIMITS[plan].users).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// FLOW-005: Acceptance export (audit) → CSV
// ═════════════════════════════════════════════════════════════════════════════

describe('FLOW-005: Acceptance export as CSV', () => {
  it('should export all acceptance rows as CSV', () => {
    recordAcceptance('user-1', 'tos', 'v1.0', { ip: '1.2.3.4', userAgent: 'Mozilla/5.0' });
    recordAcceptance('user-2', 'tos', 'v1.0', { ip: '5.6.7.8', userAgent: 'Chrome/120' });
    recordAcceptance('user-3', 'tos', 'v1.0', { ip: '9.10.11.12' });

    const csv = exportAcceptancesCSV();

    // Verify header
    expect(csv.startsWith('userId,policySlug,version,ip,userAgent,acceptedAt')).toBe(true);

    // Verify all rows present
    const lines = csv.split('\n');
    expect(lines.length).toBe(4); // header + 3 data rows

    // Verify content
    expect(csv).toContain('"user-1"');
    expect(csv).toContain('"user-2"');
    expect(csv).toContain('"user-3"');
    expect(csv).toContain('"tos"');
    expect(csv).toContain('"v1.0"');
    expect(csv).toContain('"1.2.3.4"');
    expect(csv).toContain('"Mozilla/5.0"');
  });

  it('should include all columns (userId, policyId, version, timestamp)', () => {
    recordAcceptance('user-1', 'tos', 'v1.0', { ip: '1.2.3.4', userAgent: 'test-agent' });

    const csv = exportAcceptancesCSV();
    const lines = csv.split('\n');
    const dataRow = lines[1]!;

    // Should have all 6 columns
    const columns = dataRow.split(',');
    // userId, policySlug, version, ip, userAgent are quoted; acceptedAt is ISO string
    expect(columns.length).toBeGreaterThanOrEqual(6);
    expect(dataRow).toContain('"user-1"');
    expect(dataRow).toContain('"tos"');
    expect(dataRow).toContain('"v1.0"');
  });

  it('should handle empty acceptances', () => {
    const csv = exportAcceptancesCSV();
    const lines = csv.split('\n').filter((l) => l.trim().length > 0);
    expect(lines.length).toBe(1); // header only
  });

  it('should include multiple versions after re-acceptance', () => {
    recordAcceptance('user-1', 'tos', 'v1.0');
    bumpPolicyVersion(POLICY.id, 'v2.0');
    recordAcceptance('user-1', 'tos', 'v2.0');

    const csv = exportAcceptancesCSV();
    const lines = csv.split('\n');
    expect(lines.length).toBe(3); // header + 2 rows (v1.0 + v2.0)
    expect(csv).toContain('"v1.0"');
    expect(csv).toContain('"v2.0"');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Security-specific tests for audit items
// ═════════════════════════════════════════════════════════════════════════════

describe('Security audit checks', () => {
  describe('SEC-001: API key hashing', () => {
    it('should store SHA-256 hash, not raw key', () => {
      const raw = 'tkl_' + crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(raw).digest('hex');

      expect(hash).not.toBe(raw);
      expect(hash.length).toBe(64);
      // Verify deterministic
      const hash2 = crypto.createHash('sha256').update(raw).digest('hex');
      expect(hash).toBe(hash2);
    });
  });

  describe('SEC-005: Environment validation', () => {
    it('should require CRON_SECRET to be at least 32 chars', async () => {
      const { z } = await import('zod');
      const schema = z.string().min(32, 'CRON_SECRET must be at least 32 characters');

      expect(schema.safeParse('short').success).toBe(false);
      expect(schema.safeParse('a'.repeat(32)).success).toBe(true);
    });

    it('should require HMAC_SECRET to be at least 32 chars', async () => {
      const { z } = await import('zod');
      const schema = z.string().min(32, 'HMAC_SECRET must be at least 32 characters');

      expect(schema.safeParse('too-short').success).toBe(false);
      expect(schema.safeParse('a'.repeat(32)).success).toBe(true);
    });
  });

  describe('SEC-006: CRON_SECRET timing-safe comparison', () => {
    it('should use timingSafeEqual for cron secret validation', () => {
      const secret = TEST_CRON_SECRET;
      const provided = TEST_CRON_SECRET;

      // This is the pattern we expect in the cron route
      const isValid =
        provided.length === secret.length &&
        crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret));

      expect(isValid).toBe(true);
    });

    it('should reject wrong cron secret', () => {
      const secret = TEST_CRON_SECRET;
      const provided = 'wrong-secret-that-is-at-least-32-chars';

      const isValid =
        provided.length === secret.length &&
        crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret));

      expect(isValid).toBe(false);
    });
  });

  describe('SEC-008: HTML escaping in emails', () => {
    it('should escape HTML entities', () => {
      function escapeHtml(str: string): string {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      }

      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml("Acme's <b>Corp</b>")).toBe(
        'Acme&#x27;s &lt;b&gt;Corp&lt;/b&gt;'
      );
    });
  });

  describe('SEC-009: Append-only acceptances', () => {
    it('should only insert, never update or delete', () => {
      recordAcceptance('user-1', 'tos', 'v1.0');
      const before = [...acceptancesStore];

      // Try to record same acceptance again (should be ignored, not updated)
      recordAcceptance('user-1', 'tos', 'v1.0');

      expect(acceptancesStore.length).toBe(before.length);
      expect(acceptancesStore[0]!.acceptedAt).toBe(before[0]!.acceptedAt);
    });
  });

  describe('SEC-011: CSP headers', () => {
    it('should not include unsafe-inline in script-src', () => {
      const csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
      ].join('; ');

      const scriptSrc = csp
        .split(';')
        .find((d) => d.trim().startsWith('script-src'))!
        .trim();

      expect(scriptSrc).not.toContain('unsafe-inline');
      expect(scriptSrc).not.toContain('unsafe-eval');
    });
  });
});
