import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

/**
 * Single-admin credentials auth for Ishaq Technical Solution.
 *
 * Set ADMIN_EMAIL + ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) in the environment.
 * NEXTAUTH_SECRET is required in production.
 */
function adminEmail(): string {
    return (
        process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
        "admin@ishaqtechnical.com"
    );
}

async function verifyPassword(password: string): Promise<boolean> {
    const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
    if (hash) {
        return bcrypt.compare(password, hash);
    }
    const plain = process.env.ADMIN_PASSWORD;
    if (plain) {
        return password === plain;
    }
    // Dev-only fallback so the app is usable before env is configured.
    if (process.env.NODE_ENV !== "production") {
        return password === "ITS@Admin2026";
    }
    return false;
}

export const authOptions: NextAuthOptions = {
    session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
    pages: {
        signIn: "/en/login",
    },
    providers: [
        CredentialsProvider({
            name: "Admin Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email?.trim().toLowerCase();
                const password = credentials?.password ?? "";
                if (!email || !password) return null;
                if (email !== adminEmail()) return null;
                if (!(await verifyPassword(password))) return null;

                return {
                    id: "its-admin",
                    email: adminEmail(),
                    name: "Ishaq Technical Solution",
                };
            },
        }),
    ],
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
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};
