import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core';

export const planEnum = pgEnum('plan', ['free', 'indie', 'pro']);
export const methodEnum = pgEnum('method', ['api', 'gate']);
export const campaignStatusEnum = pgEnum('campaign_status', ['active', 'completed']);

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
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
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

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  plan: planEnum('plan').notNull().default('free'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  status: text('status').notNull(),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workspaceApiKeys = pgTable('workspace_api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  prefix: text('prefix').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  name: text('name').notNull().default('Default'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});

export const policies = pgTable('policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  displayName: text('display_name').notNull(),
  currentVersion: text('current_version').notNull().default('v1.0'),
  content: text('content').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

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
    method: methodEnum('method').notNull().default('api'),
    acceptedAt: timestamp('accepted_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueAcceptance: unique('unique_acceptance').on(
      table.workspaceId,
      table.policyId,
      table.version,
      table.externalUserId
    ),
  })
);

export const reacceptanceCampaigns = pgTable('reacceptance_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  policyId: uuid('policy_id')
    .notNull()
    .references(() => policies.id, { onDelete: 'cascade' }),
  targetVersion: text('target_version').notNull(),
  status: campaignStatusEnum('status').notNull().default('active'),
  notifyByEmail: boolean('notify_by_email').notNull().default(false),
  totalUsers: integer('total_users').notNull().default(0),
  completedCount: integer('completed_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
