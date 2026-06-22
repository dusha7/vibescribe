import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
    EmailProvider({ server: process.env.EMAIL_SERVER!, from: process.env.EMAIL_FROM! }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
    async signIn({ user }) {
      if (!user.id) return true;
      const existing = await db.wallet.findUnique({ where: { userId: user.id } });
      if (!existing) {
        await db.wallet.create({ data: { userId: user.id, balanceSparks: 50 } });
        await db.ledgerEntry.create({ data: {
          walletId: (await db.wallet.findUnique({ where: { userId: user.id } }))!.id,
          type: "CREDIT_PROMO", status: "CONFIRMED", amountSparks: 50,
          description: "Welcome bonus", idempotencyKey: `welcome:${user.id}`
        }});
        await db.subscription.create({ data: { userId: user.id, tier: "FREE", status: "ACTIVE" } });
      }
      return true;
    }
  },
  pages: { signIn: "/auth/signin" },
};
declare module "next-auth" {
  interface Session { user: { id: string; name?: string | null; email?: string | null; image?: string | null; } }
}