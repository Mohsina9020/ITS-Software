export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest } from "next/server";

// Auth
import { requireApiSession } from "@/lib/requireAuth";

// Services
import { generatePdfService } from "@/services/invoice/server/generatePdfService";

export async function POST(req: NextRequest) {
    const { error } = await requireApiSession();
    if (error) return error;
    return generatePdfService(req);
}
