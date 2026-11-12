/**
 * ITS (Ishaq Technical Solution) brand tokens for PDF / invoice templates.
 * Colours match the live quotation / payment-voucher documents.
 */
export const ITS_BRAND = {
  name: "Ishaq Technical Solution",
  shortName: "ITS",
  /** Public path for the UI (Next.js /img serving). */
  logoPath: "/assets/img/its-logo.png",
  tagline:
    "On-Grid · Hybrid · Battery Bank · Electrical · CCTV · Networking · Consultancy",
  servicesShort: "Solar · Electrical · Battery · CCTV · Networking",
  footer:
    "Power Your Future with ITS · DHA Phase 5 Badian Road Jammou Stop Lahore · WhatsApp 03212258756",
  thankYou:
    "Thank you for choosing Ishaq Technical Solution · All over Pakistan services available",
  colors: {
    navy: "#0B1D35",
    teal: "#2EB7B8",
    gold: "#E6B422",
    card: "#F1F3F6",
    muted: "#6B7280",
    line: "#E5E7EB",
    orange: "#F39C12",
  },
  /**
   * Display sizes — circular mark stays sharp on screen and on A4 PDF.
   * PDF uses the inlined data URL (see lib/itsLogoDataUrl.ts) because the
   * Puppeteer HTML document has no access to /public paths.
   */
  logo: {
    navbarPx: 44,
    pdfPx: 96,
    previewPx: 80,
  },
} as const;
