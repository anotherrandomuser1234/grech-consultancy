// Builds the Netlify Drop folder: deploy/ = landing page + videos only (no server-backed demo pages).
// Usage: node make-deploy.mjs   (reads site.config.json)  or override: --email you@example.ch --name "Vorname Nachname" --address "Strasse 1, 8000 Zürich" [--booking https://cal.com/...]
// Without --booking, the booking buttons become mailto links (owner decision 2026-11-05).
import { mkdirSync, rmSync, cpSync, readFileSync, writeFileSync } from "node:fs";

// Defaults come from site.config.json (used by the GitHub Actions deploy); CLI flags override.
import { existsSync } from "node:fs";
const cfg = existsSync("site.config.json") ? JSON.parse(readFileSync("site.config.json", "utf8")) : {};
const cli = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), [])
);
const args = Object.fromEntries(Object.entries({ ...cfg, ...cli }).filter(([, v]) => v));
const missing = ["email", "name", "address"].filter((k) => !args[k]);
if (missing.length) {
  console.error(`Missing: ${missing.map((m) => "--" + m).join(", ")}`);
  process.exit(1);
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

let html = readFileSync("public/index.html", "utf8");
html = html.replace(/<!--\s*CONFIG[\s\S]*?-->\n?/, "");
if (args.booking) {
  html = html.replaceAll("__BOOKING_URL__", esc(args.booking));
} else {
  const subject = encodeURIComponent("Kostenlose 30-Min-Analyse / Free 30-min analysis");
  html = html.replaceAll(
    'href="__BOOKING_URL__" target="_blank" rel="noopener"',
    `href="mailto:${esc(args.email)}?subject=${subject}"`
  );
  html = html
    .replace("Beim Klick auf «Gespräch buchen» gelten die Datenschutzbestimmungen des Buchungsanbieters.", "Anfragen per E-Mail verwenden wir nur zur Beantwortung.")
    .replace('When you click "Book a call", the booking provider\'s privacy policy applies.', "We use email enquiries only to reply to you.");
}
html = html
  .replaceAll("__EMAIL__", esc(args.email))
  .replaceAll("__OWNER_NAME__", esc(args.name))
  .replaceAll("__OWNER_ADDRESS__", esc(args.address));

const left = html.match(/__[A-Z_]+__/g);
if (left) {
  console.error("Unfilled placeholders:", [...new Set(left)]);
  process.exit(1);
}
rmSync("deploy", { recursive: true, force: true });
mkdirSync("deploy");
cpSync("public/media", "deploy/media", { recursive: true });
writeFileSync("deploy/index.html", html);
console.log("deploy/ ready (published automatically by .github/workflows/deploy.yml on push to main)");
