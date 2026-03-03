import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { getDb, workspaces } from '@termskit/db';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(getDb()) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY ?? '',
        },
      },
      from: 'noreply@termskit.threestack.io',
    }),
  ],
  session: { strategy: 'database' },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        (session.user as { id?: string }).id = user.id;
        const db = getDb();
        const ws = await db
          .select()
          .from(workspaces)
          .where(eq(workspaces.ownerId, user.id))
          .limit(1);
        (session.user as { workspaceId?: string | null }).workspaceId =
          ws[0]?.id ?? null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const db = getDb();
      const name =
        user.name ?? user.email?.split('@')[0] ?? 'user';
      const base = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const slug = (base || 'workspace') + '-' + nanoid(4);

      await db
        .insert(workspaces)
        .values({
          name: user.name ?? name,
          slug,
          ownerId: user.id,
          plan: 'free',
        })
        .onConflictDoNothing();
    },
  },
  pages: {
    signIn: '/login',
  },
};
