# ITS (Ishaq Technical Solution)

ITS (Ishaq Technical Solution) is a free, web-based invoice generator built with Next.js, TypeScript, React and the shadcn/ui library. Fill in a form, pick a template, and get a real PDF. No account, no subscription, and nothing about your customers stored on a server.

## Table of Contents

- [ITS (Ishaq Technical Solution)](#its-ishaq-technical-solution)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Your data stays in your browser](#your-data-stays-in-your-browser)
  - [Languages](#languages)
  - [Technologies](#technologies)
    - [Core Technologies](#core-technologies)
    - [Additional Dependencies](#additional-dependencies)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment variables](#environment-variables)
  - [Development](#development)
    - [Scripts](#scripts)
    - [Tests](#tests)
  - [License](#license)

## Features

- **13 invoice templates:** Classic, Modern, Sidebar, Bold Header, Minimal, Letterhead, Compact, Two-Tone, Bordered, Left Rail, Statement, Corner and Column.
- **Live preview:** edit the form and watch the invoice update as you type.
- **Real PDFs:** rendered with headless Chromium, not a screenshot of the page.
- **Email delivery:** send the finished PDF straight to your client.
- **Save and reload:** keep invoices in your browser and load them back later.
- **Address book:** save senders and clients once, reuse them on every invoice.
- **Export:** download the invoice data as JSON, CSV or XML.
- **Signatures, logos and custom line items,** including per-invoice tax, discount and shipping.
- **18 languages,** for both the interface and the generated PDF.
- **Responsive:** works on a phone as well as a desktop.

A walkthrough of what each part does lives on the guide page at `/en/guide`.

## Your data stays in your browser

ITS (Ishaq Technical Solution) has no accounts and no database. Everything you enter (the address book, the autosave draft and your saved invoices) is stored locally, and it is encrypted at rest with AES-GCM 256 under a key the browser generates as non-extractable, so the key cannot be copied out of the origin.

Two things worth being clear about:

- This protects you against someone **reading the browser profile off disk**: a shared or stolen machine, a filesystem backup, a synced profile, another OS account.
- It does **not** protect against a script injected into the page, which holds the same key handle the app does. Defending against that would need a passphrase the app never stores.

The only time invoice data leaves your machine is when you generate a PDF or send one by email, and it is not retained afterwards.

## Languages

Arabic, Azerbaijani, Catalan, Chinese (Simplified), English, French, German, Hebrew, Indonesian, Italian, Japanese, Norwegian (Bokmål), Norwegian (Nynorsk), Polish, Portuguese (Brazil), Serbian, Spanish and Turkish.

Right-to-left layouts are supported for Arabic and Hebrew. Some PDF translations are still incomplete and fall back to English.

## Technologies

### Core Technologies

- **Next.js 15:** React framework for SSR and client-side navigation.
- **TypeScript:** JavaScript superset with static typing.
- **Shadcn-UI:** UI library for enhanced visuals.
- **Tailwind:** Utility-first CSS framework.
- **React Hook Form:** Form management for React.
- **Zod:** TypeScript-first schema validation.
- **Puppeteer:** PDF generation with headless browsers.
- **next-intl:** Internationalized routing and messages.

### Additional Dependencies

- **Nodemailer:** Node.js module for sending emails.
- **Lucide Icons:** Collection of customizable SVG icons.
- **Playwright:** End-to-end tests.

## Getting Started

Follow these instructions to get ITS (Ishaq Technical Solution) up and running on your local machine.

### Prerequisites

- Node.js 20 or later, and npm.

### Installation

1. Clone or open the repository, then install dependencies:

   ```bash
   npm install
   ```
2. Create an `.env.local` file. See [Environment variables](#environment-variables) below. You can skip this if you do not need the "send PDF by email" feature.
3. Start development server

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment variables

Copy `.env.example` if present, or create `.env.local` with:

```bash
NODEMAILER_EMAIL=
NODEMAILER_PW=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Email sending only needs the Nodemailer values.

## Development

### Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm run start` — run the production server
- `npm run lint` — lint the project
- `npm run test:e2e` — Playwright end-to-end tests

### Tests

```bash
npm run test:e2e
```

## License

See [LICENSE](LICENSE). Developed by Mohsina Abbas.
