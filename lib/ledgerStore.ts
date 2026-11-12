import { readSecure, writeSecure } from "@/lib/secureStore";

/**
 * Per-client In/Out ledger for partial payments and running balance.
 *
 * Stored encrypted in the browser (same secureStore as the address book).
 * `out` increases what the client owes (new invoice / charge);
 * `in` decreases it (cash / installment received).
 */

export type LedgerDirection = "in" | "out";

export type LedgerEntry = {
    id: string;
    /** Normalised party name used as the ledger key. */
    partyKey: string;
    partyName: string;
    direction: LedgerDirection;
    amount: number;
    currency: string;
    /** ISO date (yyyy-mm-dd) or locale display string. */
    date: string;
    note?: string;
    invoiceNumber?: string;
    kind: "invoice" | "payment" | "adjustment";
};

const STORAGE_KEY = "its:ledgers";

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

export function partyKeyFromName(name: string): string {
    return name.trim().toLowerCase();
}

function normalise(entry: unknown): LedgerEntry | null {
    if (!isRecord(entry)) return null;
    const partyName =
        typeof entry.partyName === "string" ? entry.partyName.trim() : "";
    if (!partyName) return null;

    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount < 0) return null;

    const direction = entry.direction === "in" ? "in" : "out";
    const kind =
        entry.kind === "payment" || entry.kind === "adjustment"
            ? entry.kind
            : "invoice";

    return {
        id:
            typeof entry.id === "string" && entry.id
                ? entry.id
                : crypto.randomUUID(),
        partyKey:
            typeof entry.partyKey === "string" && entry.partyKey
                ? entry.partyKey
                : partyKeyFromName(partyName),
        partyName,
        direction,
        amount,
        currency:
            typeof entry.currency === "string" && entry.currency
                ? entry.currency
                : "PKR",
        date:
            typeof entry.date === "string" && entry.date
                ? entry.date
                : new Date().toISOString().slice(0, 10),
        note: typeof entry.note === "string" ? entry.note : undefined,
        invoiceNumber:
            typeof entry.invoiceNumber === "string"
                ? entry.invoiceNumber
                : undefined,
        kind,
    };
}

export async function readLedger(): Promise<LedgerEntry[]> {
    const parsed = await readSecure<unknown>(STORAGE_KEY);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalise).filter((e): e is LedgerEntry => e !== null);
}

async function writeLedger(entries: LedgerEntry[]): Promise<LedgerEntry[]> {
    await writeSecure(STORAGE_KEY, entries);
    return entries;
}

export async function readPartyLedger(
    partyName: string
): Promise<LedgerEntry[]> {
    const key = partyKeyFromName(partyName);
    if (!key) return [];
    const all = await readLedger();
    return all
        .filter((e) => e.partyKey === key)
        .sort((a, b) => a.date.localeCompare(b.date));
}

/** Positive = client owes you; negative = you owe / overpaid. */
export function balanceFromEntries(entries: LedgerEntry[]): number {
    return entries.reduce((sum, e) => {
        return e.direction === "out" ? sum + e.amount : sum - e.amount;
    }, 0);
}

export async function getPartyBalance(partyName: string): Promise<number> {
    return balanceFromEntries(await readPartyLedger(partyName));
}

/**
 * Balance brought forward for a new voucher — excludes the current invoice's
 * own posted charge/payment so Remaining is not double-counted while editing.
 */
export async function getPreviousBalance(
    partyName: string,
    excludeInvoiceNumber?: string
): Promise<number> {
    const entries = await readPartyLedger(partyName);
    const filtered = excludeInvoiceNumber?.trim()
        ? entries.filter((e) => e.invoiceNumber !== excludeInvoiceNumber.trim())
        : entries;
    return balanceFromEntries(filtered);
}

export async function addLedgerEntry(
    input: Omit<LedgerEntry, "id" | "partyKey"> & { id?: string }
): Promise<LedgerEntry[]> {
    const entry = normalise({
        ...input,
        id: input.id ?? crypto.randomUUID(),
        partyKey: partyKeyFromName(input.partyName),
    });
    if (!entry || entry.amount <= 0) return readLedger();

    const all = await readLedger();
    return writeLedger([...all, entry]);
}

/**
 * Posts this invoice's charge and payment into the client ledger without
 * duplicating rows when the same invoice number is saved again.
 */
export async function syncInvoiceToLedger(params: {
    partyName: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    currency: string;
    date?: string;
}): Promise<LedgerEntry[]> {
    const {
        partyName,
        invoiceNumber,
        totalAmount,
        paidAmount,
        currency,
        date = new Date().toISOString().slice(0, 10),
    } = params;

    const key = partyKeyFromName(partyName);
    if (!key || !invoiceNumber.trim()) return readLedger();

    let all = await readLedger();
    const without = all.filter(
        (e) =>
            !(
                e.partyKey === key &&
                e.invoiceNumber === invoiceNumber &&
                (e.kind === "invoice" || e.kind === "payment")
            )
    );

    const next: LedgerEntry[] = [...without];

    if (totalAmount > 0) {
        next.push({
            id: crypto.randomUUID(),
            partyKey: key,
            partyName: partyName.trim(),
            direction: "out",
            amount: totalAmount,
            currency,
            date,
            invoiceNumber,
            note: `Invoice ${invoiceNumber}`,
            kind: "invoice",
        });
    }

    if (paidAmount > 0) {
        next.push({
            id: crypto.randomUUID(),
            partyKey: key,
            partyName: partyName.trim(),
            direction: "in",
            amount: paidAmount,
            currency,
            date,
            invoiceNumber,
            note: `Payment on ${invoiceNumber}`,
            kind: "payment",
        });
    }

    return writeLedger(next);
}

export async function deleteLedgerEntry(id: string): Promise<LedgerEntry[]> {
    const remaining = (await readLedger()).filter((e) => e.id !== id);
    return writeLedger(remaining);
}
