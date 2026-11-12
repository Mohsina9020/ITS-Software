import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

/** Returns the session or a 401 JSON response for API routes. */
export async function requireApiSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return {
            session: null as null,
            error: NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            ),
        };
    }
    return { session, error: null as null };
}
