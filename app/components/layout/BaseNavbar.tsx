"use client";

import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";

// Next
import Link from "next/link";
import Image from "next/image";

// Brand
import { ITS_BRAND } from "@/lib/itsBrand";

// ShadCn
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

// Components
import {
    BaseButton,
    DevDebug,
    LanguageSelector,
    ThemeSwitcher,
} from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { LogOut, Settings2 } from "lucide-react";

const BaseNavbar = () => {
    const devEnv = useMemo(() => {
        return process.env.NODE_ENV === "development";
    }, []);

    const [menuOpen, setMenuOpen] = useState(false);

    const { _t } = useTranslationContext();
    const logoSize = ITS_BRAND.logo.navbarPx;

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <nav className="container flex h-16 items-center justify-between gap-4">
                <Link
                    href="/"
                    className="flex shrink-0 items-center gap-2.5"
                    aria-label="ITS (Ishaq Technical Solution)"
                >
                    <Image
                        src={ITS_BRAND.logoPath}
                        alt="Ishaq Technical Solution logo"
                        width={logoSize}
                        height={logoSize}
                        priority
                        className="rounded-full object-contain shadow-sm ring-1 ring-border"
                        style={{ width: logoSize, height: logoSize }}
                    />
                    <span className="flex min-w-0 flex-col leading-tight">
                        <span className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                            {ITS_BRAND.shortName}
                        </span>
                        <span className="hidden truncate text-[10px] text-muted-foreground sm:block">
                            {ITS_BRAND.name}
                        </span>
                    </span>
                </Link>

                {/* ? DEV Only */}
                {devEnv && (
                    <div className="hidden lg:block">
                        <DevDebug />
                    </div>
                )}

                {/* Desktop controls */}
                <div className="hidden items-center gap-2 sm:flex">
                    <LanguageSelector />
                    <ThemeSwitcher />
                    <BaseButton
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => void signOut({ callbackUrl: "/en/login" })}
                        tooltipLabel="Sign out"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden md:inline">Sign out</span>
                    </BaseButton>
                </div>

                {/*
                 * Below sm the language select alone is wider than the space
                 * left beside the logo, so both controls move into a sheet.
                 */}
                <div className="flex items-center gap-1 sm:hidden">
                    <ThemeSwitcher />
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger asChild>
                            <BaseButton
                                variant="ghost"
                                size="icon"
                                aria-label={_t("navbar.openSettings")}
                            >
                                <Settings2 className="h-5 w-5" />
                            </BaseButton>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[85vw] max-w-sm">
                            <SheetHeader className="mb-6">
                                <SheetTitle>
                                    {_t("navbar.settings")}
                                </SheetTitle>
                            </SheetHeader>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {_t("navbar.language")}
                                    </span>
                                    <LanguageSelector variant="block" />
                                </div>

                                {devEnv && <DevDebug />}

                                <BaseButton
                                    variant="outline"
                                    onClick={() =>
                                        void signOut({
                                            callbackUrl: "/en/login",
                                        })
                                    }
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign out
                                </BaseButton>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>
        </header>
    );
};

export default BaseNavbar;
