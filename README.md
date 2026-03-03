# TermsKit

**TermsKit — ToS & Policy Acceptance Tracking API for indie SaaS**

Track when your users accept your Terms of Service, Privacy Policy, and any other policies. Get notified when you need re-acceptance. Simple REST API + embeddable JS SDK.

## Packages

| Package | Description |
|---------|-------------|
| `@termskit/db` | Drizzle ORM schema & migrations |
| `@termskit/js` | JavaScript SDK client |
| `@termskit/config` | Shared TypeScript, ESLint, Tailwind config |

## Apps

| App | Description |
|-----|-------------|
| `apps/web` | Next.js 14 dashboard & API |

## Getting Started

```bash
pnpm install
pnpm dev
```

## Stack

- **Framework:** Next.js 14.2
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** NextAuth.js
- **Payments:** Stripe
- **Email:** Resend
- **Deployment:** Coolify @ termskit.threestack.io
