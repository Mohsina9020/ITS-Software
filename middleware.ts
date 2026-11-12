import { getToken } from "next-auth/jwt";
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

function localeFromPath(pathname: string): string {
    const segment = pathname.split("/").filter(Boolean)[0];
    if (segment && routing.locales.includes(segment as never)) {
        return segment;
    }
    return routing.defaultLocale;
}

function pathWithoutLocale(pathname: string): string {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length && routing.locales.includes(parts[0] as never)) {
        const rest = parts.slice(1).join("/");
        return rest ? `/${rest}` : "/";
    }
    return pathname || "/";
}

export default async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // next-auth routes handle themselves
    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    });

    const bare = pathWithoutLocale(pathname);
    const isLogin = bare === "/login" || bare.startsWith("/login/");
    const locale = localeFromPath(pathname);

    if (!token && !isLogin) {
        const loginUrl = new URL(`/${locale}/login`, req.url);
        loginUrl.searchParams.set(
            "callbackUrl",
            `${pathname}${req.nextUrl.search}`
        );
        return NextResponse.redirect(loginUrl);
    }

    if (token && isLogin) {
        return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }

    return intlMiddleware(req);
}

export const config = {
    // Protect pages; API invoice/ledger auth is enforced in route handlers.
    // Skip next-auth API, static assets, and Next internals.
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
