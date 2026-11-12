/**
 * Re-export Auth.js helpers so existing `@/lib/auth` imports keep working.
 * Source of truth: `/auth.ts` (Auth.js v5 / Next.js 15).
 */
export { auth, handlers, signIn, signOut } from "@/auth";
