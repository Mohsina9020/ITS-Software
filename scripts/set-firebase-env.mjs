import fs from "fs";

const saPath =
  process.argv[2] ||
  String.raw`C:\Users\IT SOLUTIONS\Downloads\its-software-992ad-firebase-adminsdk-fbsvc-fc61d241e6.json`;
const envPath = ".env.local";

const sa = JSON.parse(fs.readFileSync(saPath, "utf8"));
let env = fs.readFileSync(envPath, "utf8");

const privateKeyEscaped = sa.private_key.replace(/\n/g, "\\n");

const upsert = (key, value) => {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(env)) {
    env = env.replace(re, line);
  } else {
    env += `\n${line}\n`;
  }
};

upsert("FIREBASE_PROJECT_ID", sa.project_id);
upsert("FIREBASE_CLIENT_EMAIL", sa.client_email);
upsert("FIREBASE_PRIVATE_KEY", `"${privateKeyEscaped}"`);

fs.writeFileSync(envPath, env);
console.log("FIREBASE_PROJECT_ID set:", sa.project_id);
console.log("FIREBASE_CLIENT_EMAIL set:", sa.client_email);
console.log("FIREBASE_PRIVATE_KEY set: yes (", sa.private_key.length, "chars )");
