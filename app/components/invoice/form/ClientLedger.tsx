"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// Components
import { BaseButton, FormInput, Subheading } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// API
import {
    apiAddLedgerEntry,
    apiDeleteLedgerEntry,
    apiGetPreviousBalance,
    apiReadPartyLedger,
} from "@/lib/ledgerApi";
import { partyKeyFromName, type LedgerEntry } from "@/lib/ledgerStore";

// Helpers
import { formatNumberWithCommas } from "@/lib/helpers";

// Icons
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";

// Types
import type { InvoiceType } from "@/types";

/**
 * Partial payments + running balance for the current Bill To client.
 * Persists through `/api/ledger` (Firestore or local server file).
 */
const ClientLedger = () => {
    const { _t } = useTranslationContext();
    const { setValue, control } = useFormContext<InvoiceType>();

    const receiverName = useWatch({ name: "receiver.name", control }) ?? "";
    const currency = useWatch({ name: "details.currency", control }) ?? "PKR";
    const invoiceNumber =
        useWatch({ name: "details.invoiceNumber", control }) ?? "";

    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!receiverName.trim()) {
            setEntries([]);
            setValue("details.previousBalance", 0, { shouldDirty: false });
            return;
        }
        try {
            setBackendError(null);
            const rows = await apiReadPartyLedger(receiverName);
            setEntries(rows);
            const balance = await apiGetPreviousBalance(
                receiverName,
                invoiceNumber || undefined
            );
            setValue("details.previousBalance", Number(balance.toFixed(2)), {
                shouldDirty: true,
            });
        } catch (err) {
            console.error(err);
            setBackendError("Could not load ledger. Sign in again if needed.");
        }
    }, [receiverName, invoiceNumber, setValue]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const balance = useMemo(() => {
        return entries.reduce((sum, e) => {
            return e.direction === "out" ? sum + e.amount : sum - e.amount;
        }, 0);
    }, [entries]);

    const handleAdd = useCallback(
        async (direction: "in" | "out") => {
            const value = Number(amount);
            if (!receiverName.trim() || !Number.isFinite(value) || value <= 0) {
                return;
            }
            setBusy(true);
            try {
                await apiAddLedgerEntry({
                    partyName: receiverName,
                    direction,
                    amount: value,
                    currency,
                    date: new Date().toISOString().slice(0, 10),
                    note:
                        note.trim() ||
                        (direction === "in"
                            ? "Installment / payment received"
                            : "Additional charge"),
                    invoiceNumber: invoiceNumber || undefined,
                    kind: direction === "in" ? "payment" : "adjustment",
                });
                setAmount("");
                setNote("");
                await refresh();
            } catch (err) {
                console.error(err);
                setBackendError("Could not save ledger entry.");
            } finally {
                setBusy(false);
            }
        },
        [amount, currency, invoiceNumber, note, receiverName, refresh]
    );

    const handleDelete = useCallback(
        async (id: string) => {
            setBusy(true);
            try {
                await apiDeleteLedgerEntry(id, receiverName);
                await refresh();
            } catch (err) {
                console.error(err);
                setBackendError("Could not delete ledger entry.");
            } finally {
                setBusy(false);
            }
        },
        [receiverName, refresh]
    );

    if (!receiverName.trim()) {
        return (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                {_t("form.steps.summary.ledgerEmptyClient")}
            </div>
        );
    }

    return (
        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <Subheading>
                        {_t("form.steps.summary.ledgerHeading")}
                    </Subheading>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {_t("form.steps.summary.ledgerHint")}
                    </p>
                </div>
                <div className="text-end">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {_t("form.steps.summary.runningBalance")}
                    </p>
                    <p
                        className={`text-lg font-semibold tabular-nums ${
                            balance > 0
                                ? "text-destructive"
                                : balance < 0
                                  ? "text-emerald-600"
                                  : "text-foreground"
                        }`}
                    >
                        {formatNumberWithCommas(Number(balance.toFixed(2)))}{" "}
                        {currency}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        {partyKeyFromName(receiverName)}
                    </p>
                </div>
            </div>

            {backendError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {backendError}
                </p>
            )}

            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
                <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={_t("form.steps.summary.paymentAmount")}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={_t("form.steps.summary.paymentNote")}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
                <BaseButton
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => void handleAdd("in")}
                    tooltipLabel={_t("form.steps.summary.recordPayment")}
                >
                    <ArrowDownLeft className="h-4 w-4" />
                    {_t("form.steps.summary.recordPayment")}
                </BaseButton>
                <BaseButton
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void handleAdd("out")}
                    tooltipLabel={_t("form.steps.summary.recordCharge")}
                >
                    <ArrowUpRight className="h-4 w-4" />
                    {_t("form.steps.summary.recordCharge")}
                </BaseButton>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                {entries.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">
                        {_t("form.steps.summary.ledgerNoEntries")}
                    </p>
                ) : (
                    <ul className="divide-y divide-border">
                        {[...entries].reverse().map((entry) => (
                            <li
                                key={entry.id}
                                className="flex items-center gap-2 px-3 py-2 text-sm"
                            >
                                <span
                                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                        entry.direction === "in"
                                            ? "bg-emerald-500/15 text-emerald-700"
                                            : "bg-destructive/10 text-destructive"
                                    }`}
                                >
                                    {entry.direction === "in" ? "IN" : "OUT"}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium tabular-nums">
                                        {formatNumberWithCommas(entry.amount)}{" "}
                                        {entry.currency}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {[
                                            entry.date,
                                            entry.note,
                                            entry.invoiceNumber,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleDelete(entry.id)}
                                    className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    aria-label={_t("form.steps.summary.remove")}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <FormInput
                name="details.previousBalance"
                type="number"
                label={_t("form.steps.summary.previousBalance")}
                placeholder="0"
            />
        </section>
    );
};

export default ClientLedger;
