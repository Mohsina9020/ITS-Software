import TemplateFrame, {
    templateCtx,
    type TemplateProps,
} from "../TemplateFrame";
import {
    BalanceRows,
    ItemsTable,
    NotesBlock,
    PaymentBlock,
    SignatureBlock,
} from "../parts";
import { formatDate } from "@/lib/helpers";
import { ITS_BRAND } from "@/lib/itsBrand";
import { ITS_LOGO_DATA_URL } from "@/lib/itsLogoDataUrl";

/**
 * Classic / ITS Quotation — matches Ishaq Technical Solution quotation layout:
 * navy header with logo, FROM/BILL TO cards, filled items table, gold total,
 * and navy footer bar.
 */
export default function Classic(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale, locale } = ctx;
    const { colors } = ITS_BRAND;
    const navy = theme.accentColor || colors.navy;
    const logoSrc = data.details.invoiceLogo || ITS_LOGO_DATA_URL;
    const companyName = data.sender.name || ITS_BRAND.name;

    return (
        <TemplateFrame ctx={ctx} bare>
            {/* Header */}
            <header
                className="relative overflow-hidden px-6 pb-5 pt-5 sm:px-10"
                style={{ backgroundColor: navy, color: "#ffffff" }}
            >
                <div
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{ backgroundColor: colors.teal }}
                />

                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3.5">
                        {/*
                         * Fixed circular brand mark. `contain` keeps the full
                         * seal visible; white plate + ring so it stays crisp on
                         * the navy header the way the printed QT PDFs do.
                         */}
                        <img
                            src={logoSrc}
                            alt={labels.logoAlt.replace("{name}", companyName)}
                            width={ITS_BRAND.logo.pdfPx}
                            height={ITS_BRAND.logo.pdfPx}
                            style={{
                                width: ITS_BRAND.logo.pdfPx,
                                height: ITS_BRAND.logo.pdfPx,
                                borderRadius: "9999px",
                                objectFit: "contain",
                                flexShrink: 0,
                                backgroundColor: "#ffffff",
                                padding: 2,
                                boxSizing: "border-box",
                                border: `2px solid ${colors.teal}`,
                            }}
                        />
                        <div className="min-w-0">
                            <p
                                className="truncate text-base font-bold leading-tight sm:text-lg"
                                data-edit-field="sender.name"
                            >
                                {companyName}
                            </p>
                            <p
                                className="mt-0.5 text-sm font-semibold tracking-wide"
                                style={{ color: colors.teal }}
                            >
                                {ITS_BRAND.shortName}
                            </p>
                        </div>
                    </div>

                    <div className="shrink-0 text-end">
                        <p
                            className="text-xl font-bold uppercase tracking-[0.12em] sm:text-2xl"
                            style={{ color: colors.gold }}
                        >
                            {(
                                labels.invoiceNumber.replace(/\s*#\s*$/, "") ||
                                "Invoice"
                            ).toUpperCase()}
                        </p>
                        <p
                            className={`${scale.body} mt-1 tabular-nums text-white/90`}
                            data-edit-field="details.invoiceNumber"
                        >
                            {data.details.invoiceNumber}
                        </p>
                        <p
                            className={`${scale.body} tabular-nums text-white/75`}
                            data-edit-field="details.invoiceDate"
                        >
                            {formatDate(data.details.invoiceDate, locale)}
                        </p>
                    </div>
                </div>

                <div
                    className="mt-4 border-t pt-2"
                    style={{ borderColor: "rgba(255,255,255,0.18)" }}
                >
                    <p
                        className="text-[9px] uppercase tracking-[0.14em] text-white/70 sm:text-[10px]"
                        style={{ letterSpacing: "0.08em" }}
                    >
                        {ITS_BRAND.tagline}
                    </p>
                </div>
            </header>

            <div className={`flex flex-1 flex-col ${scale.page}`}>
                {/* FROM / BILL TO cards */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <PartyCard
                        heading={labels.from}
                        name={data.sender.name || ITS_BRAND.shortName}
                        lines={[
                            [data.sender.phone, data.sender.email]
                                .filter(Boolean)
                                .join(" · "),
                            [data.sender.address, data.sender.city, data.sender.country]
                                .filter(Boolean)
                                .join(", "),
                            ...(data.sender.customInputs?.map(
                                (i) => `${i.key}: ${i.value}`
                            ) ?? []),
                        ]}
                        field="sender"
                        teal={colors.teal}
                        card={colors.card}
                        scale={scale}
                    />
                    <PartyCard
                        heading={labels.billTo}
                        name={data.receiver.name}
                        lines={[
                            data.receiver.phone,
                            data.receiver.email,
                            [data.receiver.address, data.receiver.city, data.receiver.country]
                                .filter(Boolean)
                                .join(", "),
                            ...(data.receiver.customInputs?.map(
                                (i) => `${i.key}: ${i.value}`
                            ) ?? []),
                        ]}
                        field="receiver"
                        teal={colors.teal}
                        card={colors.card}
                        scale={scale}
                    />
                </div>

                {/* Meta strip */}
                <div
                    className={`${scale.sectionGap} ${scale.body} flex flex-wrap gap-x-6 gap-y-1 text-gray-600`}
                >
                    <p data-edit-field="details.dueDate">
                        <span className="font-semibold text-gray-800">
                            {labels.dueDate}:
                        </span>{" "}
                        {formatDate(data.details.dueDate, locale)}
                    </p>
                    <p data-edit-field="details.invoiceNumber">
                        <span className="font-semibold text-gray-800">
                            Document:
                        </span>{" "}
                        {data.details.invoiceNumber}
                    </p>
                </div>

                {/* Items */}
                <div className={scale.sectionGap}>
                    <ItemsTable ctx={{ ...ctx, theme: { ...theme, accentColor: navy } }} variant="filled" />
                </div>

                {/* Totals — navy box + gold amount */}
                <div className={`${scale.sectionGap} flex justify-end`}>
                    <div className="w-full sm:w-[55%]">
                        <TotalsIts
                            ctx={ctx}
                            navy={navy}
                            gold={colors.gold}
                        />
                    </div>
                </div>

                {/* Notes */}
                {(data.details.additionalNotes || data.details.paymentTerms) && (
                    <div
                        className={`${scale.sectionGap} rounded-lg border px-3 py-3`}
                        style={{
                            backgroundColor: colors.card,
                            borderColor: colors.line,
                        }}
                    >
                        <NotesBlock ctx={ctx} />
                    </div>
                )}

                <div className={`${scale.sectionGap}`}>
                    <PaymentBlock ctx={ctx} />
                </div>

                {/* Signatures */}
                <div
                    className={`${scale.sectionGap} mt-auto grid gap-8 pt-4 sm:grid-cols-2`}
                >
                    <div>
                        <div
                            className="mb-2 h-12 border-b"
                            style={{ borderColor: "#9CA3AF" }}
                        />
                        <p className={`${scale.label} text-gray-500`}>
                            Client signature
                        </p>
                    </div>
                    <div className="text-end">
                        {data.details.signature?.data ? (
                            <div className="mb-1 flex justify-end">
                                <SignatureBlock ctx={ctx} />
                            </div>
                        ) : (
                            <div
                                className="mb-2 h-12 border-b"
                                style={{ borderColor: "#9CA3AF" }}
                            />
                        )}
                        <p className={`${scale.label} text-gray-500`}>
                            For {companyName}
                        </p>
                        <p className={`${scale.body} font-medium text-gray-800`}>
                            Authorized
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer bar */}
            <footer
                className="mt-auto px-4 py-3 text-center"
                style={{ backgroundColor: navy, color: "#ffffff" }}
            >
                <p className="text-[9px] leading-relaxed text-white/85 sm:text-[10px]">
                    {ITS_BRAND.footer}
                </p>
            </footer>
        </TemplateFrame>
    );
}

function PartyCard({
    heading,
    name,
    lines,
    field,
    teal,
    card,
    scale,
}: {
    heading: string;
    name: string;
    lines: (string | undefined)[];
    field: "sender" | "receiver";
    teal: string;
    card: string;
    scale: { label: string; name: string; body: string };
}) {
    return (
        <div
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: card }}
            data-edit-field={`${field}.name`}
        >
            <p
                className={`${scale.label} font-bold uppercase tracking-[0.16em]`}
                style={{ color: teal }}
            >
                {heading}
            </p>
            <p className={`${scale.name} mt-1 font-semibold text-gray-900`}>
                {name}
            </p>
            <div className={`${scale.body} mt-1 space-y-0.5 text-gray-600`}>
                {lines.filter(Boolean).map((line, i) => (
                    <p key={i}>{line}</p>
                ))}
            </div>
        </div>
    );
}

function TotalsIts({
    ctx,
    navy,
    gold,
}: {
    ctx: ReturnType<typeof templateCtx>;
    navy: string;
    gold: string;
}) {
    const { data, labels, scale, locale } = ctx;
    const { details } = data;

    const money = (value: unknown) => {
        const amount = Number(value ?? 0);
        try {
            return new Intl.NumberFormat(locale, {
                style: "currency",
                currency: details.currency || "PKR",
                currencyDisplay: "code",
            }).format(amount);
        } catch {
            return `${amount} ${details.currency}`;
        }
    };

    const rows: [string, string][] = [
        [labels.subtotal, money(details.subTotal)],
    ];
    if (details.discountDetails?.amount) {
        rows.push([
            labels.discount,
            details.discountDetails.amountType === "amount"
                ? `- ${money(details.discountDetails.amount)}`
                : `- ${details.discountDetails.amount}%`,
        ]);
    }
    if (details.taxDetails?.amount) {
        rows.push([
            labels.tax,
            details.taxDetails.amountType === "amount"
                ? `+ ${money(details.taxDetails.amount)}`
                : `+ ${details.taxDetails.amount}%`,
        ]);
    }
    if (details.shippingDetails?.cost) {
        rows.push([
            labels.shipping,
            details.shippingDetails.costType === "amount"
                ? `+ ${money(details.shippingDetails.cost)}`
                : `+ ${details.shippingDetails.cost}%`,
        ]);
    }

    return (
        <div className="w-full">
            {rows.map(([label, value]) => (
                <div
                    key={label}
                    className={`${scale.body} flex justify-between gap-6 py-1 text-gray-600`}
                >
                    <span>{label}</span>
                    <span className="tabular-nums">{value}</span>
                </div>
            ))}

            <div
                className="mt-2 flex items-center justify-between gap-4 rounded-lg px-4 py-3"
                style={{ backgroundColor: navy }}
            >
                <span className={`${scale.body} font-semibold uppercase tracking-wide text-white`}>
                    {labels.total} {details.currency}
                </span>
                <span
                    className={`${scale.total} font-bold tabular-nums`}
                    style={{ color: gold }}
                >
                    {money(details.totalAmount)}
                </span>
            </div>

            <BalanceRows ctx={ctx} total={Number(details.totalAmount ?? 0)} navy={navy} gold={gold} />

            {details.totalAmountInWords && (
                <p className={`${scale.label} mt-2 italic text-gray-500`}>
                    {labels.totalInWords}: {details.totalAmountInWords}{" "}
                    {details.currency}
                </p>
            )}
        </div>
    );
}
