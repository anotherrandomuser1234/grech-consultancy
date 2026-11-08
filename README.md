# Grech Consultancy — demo automations + landing page

Location: `projects/.../_default/grech-demos/`. One small Node app, one dependency (`@anthropic-ai/sdk`).

| What | URL (local) | Who it's for |
|---|---|---|
| Landing page DE/EN | http://localhost:8787/  (`?lang=en` for English) | Prospects |
| Demo 1: AI FAQ assistant on a Treuhand (fiduciary) office site | http://localhost:8787/demo/chat.html#open | Calls, video 1 |
| Demo 2: Enquiry autopilot (→ sheet → auto-reply) for a property agency | http://localhost:8787/demo/anfrage.html | Calls, video 2 |

Both demo businesses are **fictional** and all sample data is made up (`@example.com` addresses, `000` phone numbers). No real personal data anywhere.

## Run it

```bash
cd grech-demos
npm install
# live AI mode (recommended for videos):
set ANTHROPIC_API_KEY=sk-ant-...      # PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."
npm start                             # -> http://localhost:8787
```

Without a key it starts in **offline mode**: keyword matching to prepared answers (chat) and rule-based sorting (enquiries). That's good enough for the scripted demo questions. Anything off-script gets the honest "I don't know, please call" answer.

**Recording videos:** with the server running, `node record.mjs` writes two silent, captioned WebM walkthroughs to `./videos`. It uses Playwright; set `CHROME_PATH` to reuse an installed Chromium, and run `npx playwright install ffmpeg` once. In offline mode the videos must keep the "Demo-Modus mit vorbereiteten Antworten" note card.

Optional env vars:
- `DEMO_MODEL` — default `claude-opus-5-5`. `claude-haiku-5-5` is ~40× cheaper per token; fine for FAQ/sorting. Owner's call.
- `SHEET_WEBHOOK_URL` — Google Apps Script web-app URL; each new enquiry is also appended to a real Google Sheet (see below).
- `DEMO_OFFLINE=1` — force offline mode. `PORT` — default 8787.

## What each demo does

**Demo 1 – Website AI assistant** (`/api/chat`)
- Answers only from `data/treuhand-faq.md` (tax deadline, documents needed, prices, upload portal, software, hours).
- Replies in the visitor's language (DE/EN), Swiss spelling ("ss"), formal "Sie".
- Guardrails: no individual tax advice (redirects to the free first meeting), tells users not to enter personal/financial data, says "I don't know" outside its knowledge.
- To reuse for a client: replace `data/treuhand-faq.md` with their info, change colours/name in `public/demo/chat.html`. The widget is ~40 lines of JS and can be dropped into any site.

**Demo 2 – Enquiry → CRM/sheet → auto-reply** (`/api/enquiry`)
1. Website form submits an enquiry (3 sample enquiries built in: viewing request DE, heating failure DE (urgent, reply includes on-call number), English owner wanting a valuation).
2. AI returns structured JSON (schema-enforced): language, category, urgency, location, summary, next step, reply subject + body.
3. Row appended to `data/leads.csv` (opens in Excel; download link on the page) and optionally to Google Sheets.
4. Auto-reply in the customer's language is written to `data/outbox/*.eml` (demo: not actually sent).
- To reuse: replace `data/immo-business.md`, adjust the category list in `ENQUIRY_SCHEMA`, and swap the `.eml` writer for SMTP/Gmail/Outlook send (or an n8n/Make step).

## Google Sheet hook (optional, free)
In a Google Sheet: Extensions → Apps Script, paste:
```js
function doPost(e) {
  const row = JSON.parse(e.postData.contents);
  const sh = SpreadsheetApp.getActiveSheet();
  const cols = ["received_at","name","email","phone","language","category","urgency","location","summary","next_step","status","message"];
  if (sh.getLastRow() === 0) sh.appendRow(cols);
  sh.appendRow(cols.map(c => row[c] || ""));
  return ContentService.createTextOutput("ok");
}
```
Deploy → Web app → "Anyone" → copy the URL into `SHEET_WEBHOOK_URL`.

## Deploying the landing page
`public/index.html` is a single self-contained file (no build, no cookies, no tracking). Before publishing, replace the placeholders:
`__BOOKING_URL__` (free Cal.com/Calendly link), `__EMAIL__`, `__OWNER_NAME__`, `__OWNER_ADDRESS__` (Impressum is legally required), `__VIDEO_1__` / `__VIDEO_2__` (Loom/YouTube embed URLs).

Free hosting options (CHF 0): Cloudflare Pages or Netlify Drop (drag the `public/` folder in), or GitHub Pages. Custom domain: point DNS at the host once the domain is bought (GRE-4 / budget line ~CHF 60/yr).

The demos need the Node server (they call the AI). For calls, run them locally and share screen. A public hosted demo can go on a free tier (Render/Railway/Fly) later. Put a spending cap on the API key first.

## Running costs
- With `claude-opus-5-5`, one chat answer is roughly 2.5k input tokens plus 150 output tokens, about USD 0.013. One enquiry is about USD 0.02. Recording both videos and practising should cost **< CHF 2**.
- Hosting: CHF 0 (local / free tiers).

## Verification status
- Offline mode: all endpoints were tested locally (chat, enquiry → CSV → .eml, leads list, static pages, path traversal blocked).
- Live AI mode: **not yet tested**, because no API key was available in the build environment. First run with a key: send the 4 chat chips and the 3 sample enquiries, and check the answers before recording.

## Changelog
- 2026-11-04: Demos retargeted to the GRE-3 niches (Treuhand + real estate). The dental/painting versions are in `data/archive-v1/` and `videos/archive-v1/`. Landing page pricing aligned with the GRE-3 `pricing` doc. Videos re-recorded (silent + captions, offline mode).
