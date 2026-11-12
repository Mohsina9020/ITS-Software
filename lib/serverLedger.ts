import { promises as fs } from "fs";
import path from "path";

import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebaseAdmin";
import {
    balanceFromEntries,
    partyKeyFromName,
    type LedgerEntry,
} from "@/lib/ledgerStore";

/**
 * Server-side persistent ledger.
 *
 * Prefer Firebase Firestore when configured; otherwise a local JSON file under
 * `.data/` (gitignored) so installments survive restarts on a single machine.
 */

const FILE_PATH = path.join(process.cwd(), ".data", "its-ledger.json");

type ClientSummary = {
    partyKey: string;
    partyName: string;
    totalInvoiced: number;
    totalPaid: number;
    runningBalance: number;
    currency: string;
    updatedAt: string;
};

type LedgerFile = {
    entries: LedgerEntry[];
    clients: Record<string, ClientSummary>;
};

function emptyFile(): LedgerFile {
    return { entries: [], clients: {} };
}

async function readFileStore(): Promise<LedgerFile> {
    try {
        const raw = await fs.readFile(FILE_PATH, "utf8");
        const parsed = JSON.parse(raw) as LedgerFile;
        return {
            entries: Array.isArray(parsed.entries) ? parsed.entries : [],
            clients:
                parsed.clients && typeof parsed.clients === "object"
                    ? parsed.clients
                    : {},
        };
    } catch {
        return emptyFile();
    }
}

async function writeFileStore(data: LedgerFile): Promise<void> {
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf8");
}

function summarise(
    partyKey: string,
    partyName: string,
    entries: LedgerEntry[]
): ClientSummary {
    const mine = entries.filter((e) => e.partyKey === partyKey);
    const totalInvoiced = mine
        .filter((e) => e.direction === "out")
        .reduce((s, e) => s + e.amount, 0);
    const totalPaid = mine
        .filter((e) => e.direction === "in")
        .reduce((s, e) => s + e.amount, 0);
    return {
        partyKey,
        partyName,
        totalInvoiced,
        totalPaid,
        runningBalance: balanceFromEntries(mine),
        currency: mine[0]?.currency || "PKR",
        updatedAt: new Date().toISOString(),
    };
}

export async function serverReadLedger(
    partyName?: string
): Promise<LedgerEntry[]> {
    const key = partyName ? partyKeyFromName(partyName) : "";
    const db = getFirestoreDb();

    if (db) {
        const snap = key
            ? await db.collection("ledger").where("partyKey", "==", key).get()
            : await db.collection("ledger").get();
        return snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }) as LedgerEntry)
            .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    }

    const file = await readFileStore();
    if (!key) return file.entries;
    return file.entries.filter((e) => e.partyKey === key);
}

export async function serverGetPreviousBalance(
    partyName: string,
    excludeInvoiceNumber?: string
): Promise<number> {
    const entries = await serverReadLedger(partyName);
    const filtered = excludeInvoiceNumber?.trim()
        ? entries.filter((e) => e.invoiceNumber !== excludeInvoiceNumber.trim())
        : entries;
    return balanceFromEntries(filtered);
}

export async function serverGetClientSummary(
    partyName: string
): Promise<ClientSummary | null> {
    const key = partyKeyFromName(partyName);
    if (!key) return null;

    const db = getFirestoreDb();
    if (db) {
        const doc = await db.collection("clients").doc(key).get();
        if (doc.exists) return doc.data() as ClientSummary;
        const entries = await serverReadLedger(partyName);
        return summarise(key, partyName.trim(), entries);
    }

    const file = await readFileStore();
    if (file.clients[key]) return file.clients[key];
    return summarise(
        key,
        partyName.trim(),
        file.entries.filter((e) => e.partyKey === key)
    );
}

export async function serverAddEntry(
    entry: Omit<LedgerEntry, "id" | "partyKey"> & { id?: string }
): Promise<LedgerEntry[]> {
    const partyKey = partyKeyFromName(entry.partyName);
    const full: LedgerEntry = {
        id: entry.id || crypto.randomUUID(),
        partyKey,
        partyName: entry.partyName.trim(),
        direction: entry.direction,
        amount: entry.amount,
        currency: entry.currency || "PKR",
        date: entry.date || new Date().toISOString().slice(0, 10),
        note: entry.note,
        invoiceNumber: entry.invoiceNumber,
        kind: entry.kind,
    };

    const db = getFirestoreDb();
    if (db) {
        await db.collection("ledger").doc(full.id).set(full);
        const all = await serverReadLedger(full.partyName);
        const summary = summarise(partyKey, full.partyName, all);
        await db.collection("clients").doc(partyKey).set(summary, { merge: true });
        return all;
    }

    const file = await readFileStore();
    file.entries.push(full);
    file.clients[partyKey] = summarise(
        partyKey,
        full.partyName,
        file.entries.filter((e) => e.partyKey === partyKey)
    );
    await writeFileStore(file);
    return file.entries.filter((e) => e.partyKey === partyKey);
}

export async function serverDeleteEntry(
    id: string,
    partyName?: string
): Promise<LedgerEntry[]> {
    const db = getFirestoreDb();
    if (db) {
        const ref = db.collection("ledger").doc(id);
        const snap = await ref.get();
        const data = snap.data() as LedgerEntry | undefined;
        await ref.delete();
        if (data?.partyKey) {
            const all = await serverReadLedger(data.partyName);
            await db
                .collection("clients")
                .doc(data.partyKey)
                .set(summarise(data.partyKey, data.partyName, all), {
                    merge: true,
                });
            return all;
        }
        return partyName ? serverReadLedger(partyName) : serverReadLedger();
    }

    const file = await readFileStore();
    const removed = file.entries.find((e) => e.id === id);
    file.entries = file.entries.filter((e) => e.id !== id);
    if (removed) {
        file.clients[removed.partyKey] = summarise(
            removed.partyKey,
            removed.partyName,
            file.entries.filter((e) => e.partyKey === removed.partyKey)
        );
    }
    await writeFileStore(file);
    return partyName
        ? file.entries.filter(
              (e) => e.partyKey === partyKeyFromName(partyName)
          )
        : file.entries;
}

export async function serverSyncInvoice(params: {
    partyName: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    currency: string;
    date?: string;
}): Promise<{ entries: LedgerEntry[]; previousBalance: number; remainingBalance: number }> {
    const {
        partyName,
        invoiceNumber,
        totalAmount,
        paidAmount,
        currency,
        date = new Date().toISOString().slice(0, 10),
    } = params;

    const key = partyKeyFromName(partyName);
    if (!key || !invoiceNumber.trim()) {
        return { entries: [], previousBalance: 0, remainingBalance: 0 };
    }

    const previousBalance = await serverGetPreviousBalance(
        partyName,
        invoiceNumber
    );

    const db = getFirestoreDb();
    if (db) {
        const existing = await db
            .collection("ledger")
            .where("partyKey", "==", key)
            .where("invoiceNumber", "==", invoiceNumber)
            .get();
        const batch = db.batch();
        existing.docs.forEach((doc) => batch.delete(doc.ref));

        if (totalAmount > 0) {
            const id = crypto.randomUUID();
            batch.set(db.collection("ledger").doc(id), {
                id,
                partyKey: key,
                partyName: partyName.trim(),
                direction: "out",
                amount: totalAmount,
                currency,
                date,
                invoiceNumber,
                note: `Invoice ${invoiceNumber}`,
                kind: "invoice",
            } satisfies LedgerEntry);
        }
        if (paidAmount > 0) {
            const id = crypto.randomUUID();
            batch.set(db.collection("ledger").doc(id), {
                id,
                partyKey: key,
                partyName: partyName.trim(),
                direction: "in",
                amount: paidAmount,
                currency,
                date,
                invoiceNumber,
                note: `Payment on ${invoiceNumber}`,
                kind: "payment",
            } satisfies LedgerEntry);
        }
        await batch.commit();

        const entries = await serverReadLedger(partyName);
        const summary = summarise(key, partyName.trim(), entries);
        await db.collection("clients").doc(key).set(summary, { merge: true });
        return {
            entries,
            previousBalance,
            remainingBalance: previousBalance + totalAmount - paidAmount,
        };
    }

    const file = await readFileStore();
    file.entries = file.entries.filter(
        (e) =>
            !(
                e.partyKey === key &&
                e.invoiceNumber === invoiceNumber &&
                (e.kind === "invoice" || e.kind === "payment")
            )
    );
    if (totalAmount > 0) {
        file.entries.push({
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
        file.entries.push({
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
    file.clients[key] = summarise(
        key,
        partyName.trim(),
        file.entries.filter((e) => e.partyKey === key)
    );
    await writeFileStore(file);

    return {
        entries: file.entries.filter((e) => e.partyKey === key),
        previousBalance,
        remainingBalance: previousBalance + totalAmount - paidAmount,
    };
}

export function ledgerBackend(): "firestore" | "local-file" {
    return isFirebaseConfigured() ? "firestore" : "local-file";
}
