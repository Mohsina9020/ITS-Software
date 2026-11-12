import { NextRequest } from "next/server";

import { requireApiSession } from "@/lib/requireAuth";
import { exportInvoiceService } from "@/services/invoice/server/exportInvoiceService";

export async function POST(req: NextRequest) {
    const { error } = await requireApiSession();
    if (error) return error;
    return exportInvoiceService(req);
}
