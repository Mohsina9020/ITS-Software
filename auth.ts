import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";

/**
 * Auth.js v5 (next-auth@5) — Next.js 15 App Router compatible.
 *
 * Admin-only credentials for Ishaq Technical Solution.
 * Prefer AUTH_SECRET; NEXTAUTH_SECRET is accepted as a fallback.
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
    if (process.env.NODE_ENV !== "production") {
        return password === "ITS@Admin2026";
    }
    return false;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            id: "credentials",
            name: "Admin Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email =
                    typeof credentials?.email === "string"
                        ? credentials.email.trim().toLowerCase()
                        : "";
                const password =
                    typeof credentials?.password === "string"
                        ? credentials.password
                        : "";
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
});
