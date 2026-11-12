import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/requireAuth";
import {
    ledgerBackend,
    serverAddEntry,
    serverDeleteEntry,
    serverGetPreviousBalance,
    serverReadLedger,
    serverSyncInvoice,
} from "@/lib/serverLedger";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const { error } = await requireApiSession();
    if (error) return error;

    const partyName = req.nextUrl.searchParams.get("party") || undefined;
    const previousOnly = req.nextUrl.searchParams.get("previous") === "1";
    const exclude = req.nextUrl.searchParams.get("exclude") || undefined;

    if (previousOnly && partyName) {
        const previousBalance = await serverGetPreviousBalance(
            partyName,
            exclude || undefined
        );
        return NextResponse.json({
            previousBalance,
            backend: ledgerBackend(),
        });
    }

    const entries = await serverReadLedger(partyName);
    return NextResponse.json({
        entries,
        backend: ledgerBackend(),
    });
}

export async function POST(req: NextRequest) {
    const { error } = await requireApiSession();
    if (error) return error;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    if (body.action === "syncInvoice") {
        const result = await serverSyncInvoice({
            partyName: String(body.partyName || ""),
            invoiceNumber: String(body.invoiceNumber || ""),
            totalAmount: Number(body.totalAmount) || 0,
            paidAmount: Number(body.paidAmount) || 0,
            currency: String(body.currency || "PKR"),
            date: body.date ? String(body.date) : undefined,
        });
        return NextResponse.json({ ...result, backend: ledgerBackend() });
    }

    if (body.action === "add") {
        const entries = await serverAddEntry({
            partyName: String(body.partyName || ""),
            direction: body.direction === "in" ? "in" : "out",
            amount: Number(body.amount) || 0,
            currency: String(body.currency || "PKR"),
            date: body.date ? String(body.date) : undefined,
            note: body.note ? String(body.note) : undefined,
            invoiceNumber: body.invoiceNumber
                ? String(body.invoiceNumber)
                : undefined,
            kind:
                body.kind === "payment" || body.kind === "adjustment"
                    ? body.kind
                    : "invoice",
        });
        return NextResponse.json({ entries, backend: ledgerBackend() });
    }

    if (body.action === "delete") {
        const entries = await serverDeleteEntry(
            String(body.id || ""),
            body.partyName ? String(body.partyName) : undefined
        );
        return NextResponse.json({ entries, backend: ledgerBackend() });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
