import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/requireAuth";
import {
    SendPdfRequestError,
    sendPdfToEmailService,
} from "@/services/invoice/server/sendPdfToEmailService";

export async function POST(req: NextRequest) {
    const { error } = await requireApiSession();
    if (error) return error;

    try {
        const emailSent = await sendPdfToEmailService(req);

        if (emailSent) {
            return NextResponse.json(
                { message: "Email sent successfully" },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 502 }
        );
    } catch (err) {
        // Validation and rate-limit failures carry their own status and a
        // message that is safe to show the user.
        if (err instanceof SendPdfRequestError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.status }
            );
        }

        console.error("Email service error:", err);
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 }
        );
    }
}
