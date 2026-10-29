// Export the page's subtitle timeline (window.SUBS, the same one painted into the picture) → out/cues.json
// Usage: node subs.mjs   (run with LIB set to the library folder)
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const { openDemo, closeServer } = await import(pathToFileURL(path.join(process.env.LIB, 'core/render/page.mjs')).href);
const { browser, page } = await openDemo(dir, { w: 1080, h: 1920 });
const subs = await page.evaluate(() => window.SUBS);
fs.mkdirSync(path.join(dir, 'out'), { recursive: true });
fs.writeFileSync(path.join(dir, 'out/cues.json'), JSON.stringify(subs.map(s => ({ t0: s.t0, t1: s.t1, text: s.text })), null, 1));
console.log('cues', subs.length); await browser.close(); closeServer();
