// Records the two silent, captioned demo walkthroughs (WebM, 1280x720) into ./videos
// Usage: start the server (npm start) in another terminal, then: node record.mjs
// Optional env: BASE_URL (default http://localhost:8787), CHROME_PATH (use an existing Chromium)
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:8787";
const OUT = path.resolve("videos");
fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Caption bar overlay, injected into the page
async function caption(page, text, ms = 3500) {
  await page.evaluate((t) => {
    let el = document.getElementById("__cap");
    if (!el) {
      el = document.createElement("div"); el.id = "__cap";
      el.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);max-width:880px;z-index:99999;" +
        "background:rgba(15,25,35,.88);color:#fff;font:600 22px/1.4 system-ui,'Segoe UI',sans-serif;padding:12px 22px;border-radius:10px;" +
        "text-align:center;box-shadow:0 6px 24px #0005;transition:opacity .3s;pointer-events:none";
      document.body.appendChild(el);
    }
    el.innerHTML = t; el.style.opacity = t ? "1" : "0";
  }, text);
  if (ms) await wait(ms);
}
// Full-screen title card
async function card(page, html, ms = 4000) {
  await page.evaluate((h) => {
    const el = document.createElement("div"); el.id = "__card";
    el.style.cssText = "position:fixed;inset:0;z-index:100000;background:#0f1923;color:#fff;display:flex;flex-direction:column;" +
      "align-items:center;justify-content:center;text-align:center;font:600 34px/1.35 system-ui,'Segoe UI',sans-serif;padding:60px";
    el.innerHTML = h; document.body.appendChild(el);
  }, html);
  await wait(ms);
  await page.evaluate(() => document.getElementById("__card")?.remove());
}
const SUB = (s) => `<div style="font-weight:400;font-size:22px;opacity:.8;margin-top:18px">${s}</div>`;
const NOTE = "Demo-Modus mit vorbereiteten Antworten. Im Kundenprojekt beantwortet ein KI-Modell die Anfragen aus Ihren eigenen Infos.";
const OUTRO = `Für Ihren Betrieb: Fixpreis CHF 1'500–3'500, in 1–2 Wochen live.${SUB("Grech Consultancy · AI Automation Quick-Win · Kostenlose 30-Min-Analyse: Link unter dem Video")}`;

async function record(name, fn) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: "de-CH",
    recordVideo: { dir: OUT, size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  await fn(page);
  const video = page.video();
  await ctx.close(); await browser.close();
  const dest = path.join(OUT, `${name}.webm`);
  fs.rmSync(dest, { force: true });
  fs.renameSync(await video.path(), dest);
  console.log("saved", dest);
}

// ---------- Video 1: website AI assistant (fictional Treuhand office) ----------
await record("demo1-ki-assistent-treuhand", async (page) => {
  await page.goto(`${BASE}/demo/chat.html`);
  await card(page, `KI-Assistent für Ihre Website${SUB("Beispiel: fiktives Treuhandbüro in Uster · Demo von Grech Consultancy")}`, 4000);
  await card(page, `<div style="font-size:26px;font-weight:400;max-width:900px">${NOTE}</div>`, 4500);
  await caption(page, "Die Website eines Treuhandbüros. Unten rechts: der digitale Assistent.", 3000);
  await page.click("#fab"); await wait(1200);
  await caption(page, "Die Frage, die im Frühling täglich am Telefon landet …", 2000);
  await page.click("text=Bis wann muss ich die Steuererklärung abgeben?"); await wait(1500);
  await caption(page, "… sofort beantwortet, aus den Infos des Büros.", 3500);
  const typeAsk = async (q) => { await page.click("#q"); await page.keyboard.type(q, { delay: 55 }); await wait(300); await page.keyboard.press("Enter"); };
  await typeAsk("Welche Unterlagen brauchen Sie von mir?"); await wait(1500);
  await caption(page, "Die komplette Checkliste, inkl. Hinweis aufs sichere Upload-Portal.", 5000);
  await typeAsk("Was kostet eine Steuererklärung?"); await wait(1500);
  await caption(page, "Richtpreise direkt aus Ihrer Preisliste.", 3500);
  await caption(page, "Englischsprachige Kunden? Der Assistent antwortet in ihrer Sprache.", 1500);
  await typeAsk("Can I deduct my home office?"); await wait(1500);
  await caption(page, "Wichtig: keine individuelle Steuerberatung, sondern ein Termin fürs Erstgespräch.", 5000);
  await typeAsk("Arbeiten Sie mit Bexio?"); await wait(1500);
  await caption(page, "Software, Bürozeiten, Firmengründung: alles beantwortet.", 3500);
  await caption(page, "Und wenn er etwas nicht weiss?", 1200);
  await typeAsk("Machen Sie auch Immobilienbewertungen?"); await wait(1500);
  await caption(page, "Er sagt es ehrlich und verweist ans Telefon. Er erfindet nichts.", 4500);
  await caption(page, "", 0);
  await card(page, OUTRO, 5000);
});

// ---------- Video 2: enquiry -> list -> auto-reply (fictional property agency) ----------
await record("demo2-anfragen-immobilien", async (page) => {
  await page.request.post(`${BASE}/api/leads/reset`);
  await page.goto(`${BASE}/demo/anfrage.html`);
  await card(page, `Anfragen-Autopilot für Immobilienagenturen${SUB("Beispiel: fiktive Immobilien Weber AG in Winterthur · Demo von Grech Consultancy")}`, 4000);
  await card(page, `<div style="font-size:26px;font-weight:400;max-width:900px">${NOTE}</div>`, 4500);
  await caption(page, "Links: Kontaktformular bzw. E-Mail-Eingang. Rechts: die Anfragen-Liste (Excel, Google Sheet oder CRM).", 4500);
  await page.click("text=Beispiel: Besichtigung"); await wait(800);
  await caption(page, "Eine Interessentin möchte eine inserierte Wohnung besichtigen …", 3000);
  await page.click("text=Anfrage senden"); await wait(1500);
  await caption(page, "In Sekunden: Kategorie, Dringlichkeit, Ort, Zusammenfassung und nächster Schritt fürs Team.", 5000);
  await page.evaluate(() => document.getElementById("reply").scrollIntoView({ behavior: "smooth", block: "center" })); await wait(800);
  await caption(page, "Und sie erhält sofort eine Antwort mit den Besichtigungszeiten.", 5000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" })); await wait(800);
  await page.click("text=Beispiel: Heizung defekt"); await wait(800);
  await caption(page, "Ein Mieter meldet: Heizung ausgefallen …", 2000);
  await page.click("text=Anfrage senden"); await wait(1500);
  await caption(page, "… automatisch als dringend markiert. Die Antwort enthält die Notfall-Nummer.", 5000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" })); await wait(800);
  await page.click("text=Example: Sell my flat"); await wait(800);
  await caption(page, "Ein Eigentümer schreibt auf Englisch, er möchte verkaufen …", 2000);
  await page.click("text=Anfrage senden"); await wait(1500);
  await caption(page, "… erhält eine englische Antwort. Für Sie: ein neuer Verkaufs-Lead, auf Deutsch zusammengefasst.", 5000);
  await caption(page, "Wir verbinden das mit Ihrem Postfach und Ihrer Liste oder Ihrem CRM.", 4000);
  await caption(page, "", 0);
  await card(page, OUTRO, 5000);
  await page.request.post(`${BASE}/api/leads/reset`);
});
