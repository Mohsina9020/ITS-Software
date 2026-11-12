"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";

import { BaseButton } from "@/app/components";
import { ITS_BRAND } from "@/lib/itsBrand";

function LoginForm() {
    const locale = useLocale();
    const searchParams = useSearchParams();
    const callbackUrl = useMemo(
        () => searchParams.get("callbackUrl") || `/${locale}`,
        [searchParams, locale]
    );

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(event: FormEvent) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl,
        });

        setLoading(false);

        if (result?.error) {
            setError("Invalid email or password.");
            return;
        }

        window.location.href = result?.url || callbackUrl;
    }

    return (
        <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,_#0B1D35_0%,_#06101c_55%,_#03070d_100%)] px-4 py-10">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur">
                <div className="mb-8 flex flex-col items-center text-center">
                    <Image
                        src={ITS_BRAND.logoPath}
                        alt={ITS_BRAND.name}
                        width={72}
                        height={72}
                        className="rounded-full object-contain ring-2 ring-[#2EB7B8]/40"
                        priority
                    />
                    <h1 className="mt-4 text-xl font-semibold text-slate-900">
                        {ITS_BRAND.name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Admin login — authorized access only
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="username"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-[#2EB7B8] focus:ring-2"
                            placeholder="admin@ishaqtechnical.com"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-[#2EB7B8] focus:ring-2"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    <BaseButton
                        type="submit"
                        disabled={loading}
                        className="h-11 w-full"
                    >
                        {loading ? "Signing in…" : "Sign in"}
                    </BaseButton>
                </form>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-dvh items-center justify-center bg-[#0B1D35] text-white">
                    Loading…
                </main>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
