import fs from "fs";

const buf = fs.readFileSync("public/assets/img/its-logo.png");
fs.writeFileSync(
  "lib/itsLogoDataUrl.ts",
  [
    "/** Default ITS circular logo, inlined so PDF generation needs no network fetch. */",
    "export const ITS_LOGO_DATA_URL =",
    `  "data:image/png;base64,${buf.toString("base64")}";`,
    "",
  ].join("\n")
);
console.log("refreshed ITS logo data URL,", buf.length, "bytes");
