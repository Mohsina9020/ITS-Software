"use client";

import { usePathname } from "next/navigation";

// Direct imports — avoid the app/components barrel so the login route does
// not pull invoice form modules (calendar/date-fns) into the first paint.
import BaseFooter from "@/app/components/layout/BaseFooter";
import BaseNavbar from "@/app/components/layout/BaseNavbar";

/**
 * Hides the main chrome on the login screen so unauthenticated visitors only
 * see the admin sign-in form.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || "";
    const isLogin = /\/login\/?$/.test(pathname);

    if (isLogin) {
        return <div className="min-h-dvh">{children}</div>;
    }

    return (
        <>
            <BaseNavbar />
            <div className="flex flex-col">{children}</div>
            <BaseFooter />
        </>
    );
}
