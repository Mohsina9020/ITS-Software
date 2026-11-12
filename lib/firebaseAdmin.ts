import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";

/**
 * Firebase Admin (server-only). Returns null when credentials are missing so
 * the local file-backed ledger can still run in development.
 */
let cachedApp: App | null | undefined;
let cachedDb: Firestore | null | undefined;

export function isFirebaseConfigured(): boolean {
    return Boolean(
        process.env.FIREBASE_PROJECT_ID &&
            process.env.FIREBASE_CLIENT_EMAIL &&
            process.env.FIREBASE_PRIVATE_KEY
    );
}

export function getFirebaseApp(): App | null {
    if (cachedApp !== undefined) return cachedApp;
    if (!isFirebaseConfigured()) {
        cachedApp = null;
        return null;
    }

    const existing = getApps()[0];
    if (existing) {
        cachedApp = existing;
        return existing;
    }

    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(
        /\\n/g,
        "\n"
    );

    cachedApp = initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
        }),
    });
    return cachedApp;
}

export function getFirestoreDb(): Firestore | null {
    if (cachedDb !== undefined) return cachedDb;
    const app = getFirebaseApp();
    if (!app) {
        cachedDb = null;
        return null;
    }
    cachedDb = getFirestore(app);
    return cachedDb;
}
