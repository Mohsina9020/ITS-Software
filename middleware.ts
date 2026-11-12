import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
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

export default auth((req) => {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    const bare = pathWithoutLocale(pathname);
    const isLogin = bare === "/login" || bare.startsWith("/login/");
    const locale = localeFromPath(pathname);
    const isLoggedIn = !!req.auth;

    if (!isLoggedIn && !isLogin) {
        const loginUrl = new URL(`/${locale}/login`, req.nextUrl.origin);
        loginUrl.searchParams.set(
            "callbackUrl",
            `${pathname}${req.nextUrl.search}`
        );
        return NextResponse.redirect(loginUrl);
    }

    if (isLoggedIn && isLogin) {
        return NextResponse.redirect(
            new URL(`/${locale}`, req.nextUrl.origin)
        );
    }

    return intlMiddleware(req);
});

export const config = {
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
