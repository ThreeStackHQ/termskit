import crypto from 'crypto';
import { getDb, workspaceApiKeys, workspaces } from '@termskit/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

// In-memory rate limiter: 200 req/min per API key
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit = 200): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// SEC-004: Per-IP rate limit for POST /api/v1/accept — 20 req/min
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export type WorkspaceRow = typeof workspaces.$inferSelect;

export async function getWorkspaceFromApiKey(
  req: NextRequest
): Promise<WorkspaceRow | { error: 'rate_limit' } | null> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer tkl_')) return null;
  const rawKey = auth.slice(7); // remove 'Bearer '

  if (!checkRateLimit(rawKey)) {
    return { error: 'rate_limit' } as const;
  }

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const db = getDb();

  const rows = await db
    .select({ key: workspaceApiKeys, workspace: workspaces })
    .from(workspaceApiKeys)
    .innerJoin(workspaces, eq(workspaceApiKeys.workspaceId, workspaces.id))
    .where(eq(workspaceApiKeys.keyHash, keyHash))
    .limit(1);

  if (!rows.length) return null;

  // Update lastUsedAt asynchronously
  db.update(workspaceApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(workspaceApiKeys.id, rows[0]!.key.id))
    .catch(() => {});

  return rows[0]!.workspace;
}

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
