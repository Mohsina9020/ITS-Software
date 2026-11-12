import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible Auth.js config (no Node-only imports like bcrypt).
 * Used by middleware. Full providers live in `auth.ts`.
 */
export const authConfig = {
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/en/login",
    },
    session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
    providers: [],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = "admin";
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { role?: string }).role =
                    (token.role as string) || "admin";
            }
            return session;
        },
        authorized() {
            // Route protection is handled explicitly in middleware.ts
            return true;
        },
    },
} satisfies NextAuthConfig;
