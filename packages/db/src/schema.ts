import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  primaryKey,
  unique,
  index,
} from 'drizzle-orm/pg-core';

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan').notNull().default('free'),
  ownerId: text('owner_id'),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Workspace API Keys ───────────────────────────────────────────────────────

export const workspaceApiKeys = pgTable('workspace_api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});

// ─── Policies ────────────────────────────────────────────────────────────────

export const policies = pgTable(
  'policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    displayName: text('display_name').notNull(),
    currentVersion: text('current_version').notNull().default('v1.0'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    workspaceSlugIdx: unique('policies_workspace_slug').on(
      table.workspaceId,
      table.slug
    ),
  })
);

// ─── Acceptances ─────────────────────────────────────────────────────────────

export const acceptances = pgTable(
  'acceptances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    policyId: uuid('policy_id')
      .notNull()
      .references(() => policies.id, { onDelete: 'cascade' }),
    version: text('version').notNull(),
    externalUserId: text('external_user_id').notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    method: text('method').notNull().default('api'),
    acceptedAt: timestamp('accepted_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueAcceptance: unique().on(
      table.workspaceId,
      table.policyId,
      table.version,
      table.externalUserId
    ),
    policyUserIdx: index('acceptances_policy_user_idx').on(
      table.policyId,
      table.externalUserId
    ),
    workspaceIdx: index('acceptances_workspace_idx').on(table.workspaceId),
  })
);

// ─── Reacceptance Campaigns ───────────────────────────────────────────────────

export const reacceptanceCampaigns = pgTable('reacceptance_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  policyId: uuid('policy_id')
    .notNull()
    .references(() => policies.id, { onDelete: 'cascade' }),
  targetVersion: text('target_version').notNull(),
  status: text('status').notNull().default('active'),
  notifyByEmail: boolean('notify_by_email').notNull().default(false),
  totalUsers: integer('total_users').notNull().default(0),
  completedCount: integer('completed_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripePriceId: text('stripe_price_id'),
  plan: text('plan').notNull().default('free'),
  status: text('status').notNull(),
});

// ─── NextAuth Tables ──────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').notNull().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);
