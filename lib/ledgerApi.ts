import type { LedgerEntry } from "@/lib/ledgerStore";

/**
 * Authenticated client helpers for the persistent server ledger
 * (Firestore or local `.data` file).
 */

async function parseJson<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Ledger API failed (${res.status})`);
    }
    return res.json() as Promise<T>;
}

export async function apiReadPartyLedger(
    partyName: string
): Promise<LedgerEntry[]> {
    const res = await fetch(
        `/api/ledger?party=${encodeURIComponent(partyName)}`,
        { cache: "no-store" }
    );
    const data = await parseJson<{ entries: LedgerEntry[] }>(res);
    return data.entries || [];
}

export async function apiGetPreviousBalance(
    partyName: string,
    excludeInvoiceNumber?: string
): Promise<number> {
    const params = new URLSearchParams({
        party: partyName,
        previous: "1",
    });
    if (excludeInvoiceNumber) params.set("exclude", excludeInvoiceNumber);
    const res = await fetch(`/api/ledger?${params}`, { cache: "no-store" });
    const data = await parseJson<{ previousBalance: number }>(res);
    return Number(data.previousBalance) || 0;
}

export async function apiAddLedgerEntry(input: {
    partyName: string;
    direction: "in" | "out";
    amount: number;
    currency: string;
    date?: string;
    note?: string;
    invoiceNumber?: string;
    kind: "invoice" | "payment" | "adjustment";
}): Promise<LedgerEntry[]> {
    const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", ...input }),
    });
    const data = await parseJson<{ entries: LedgerEntry[] }>(res);
    return data.entries || [];
}

export async function apiDeleteLedgerEntry(
    id: string,
    partyName?: string
): Promise<LedgerEntry[]> {
    const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id, partyName }),
    });
    const data = await parseJson<{ entries: LedgerEntry[] }>(res);
    return data.entries || [];
}

export async function apiSyncInvoiceToLedger(input: {
    partyName: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    currency: string;
}): Promise<{
    previousBalance: number;
    remainingBalance: number;
    entries: LedgerEntry[];
}> {
    const res = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syncInvoice", ...input }),
    });
    return parseJson(res);
}
