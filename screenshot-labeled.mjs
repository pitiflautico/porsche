import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);

// Scroll through to trigger all animations
const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
for (let i = 0; i <= 40; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), (scrollHeight / 40) * i);
  await page.waitForTimeout(150);
}

const positions = await page.evaluate(() => {
  const get = (sel) => {
    const el = document.querySelector(sel);
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  };
  return {
    hero: 0,
    intro: get('.section--intro'),
    mf1: get('.section--manifiesto'),
    mf2: get('.mf-block--is'),
    mf3: get('.mf-block--no'),
    mfSub: get('.mf-block--substitute'),
    cinematic: get('.section--cinematic'),
    presents: get('.section--presents'),
    ooh: get('.section--ooh') + 400,
    community: get('.section--comunidad'),
    footer: get('.footer'),
  };
});

const sections = [
  { name: '01-hero', scroll: positions.hero, label: '01 HERO' },
  { name: '02-intro', scroll: positions.intro - 100, label: '02 INTRO' },
  { name: '03-there', scroll: positions.mf1 + 200, label: '03 THERE' },
  { name: '04-is', scroll: positions.mf2 - 100, label: '04 IS' },
  { name: '05-no', scroll: positions.mf3 - 200, label: '05 NO' },
  { name: '06-substitute', scroll: positions.mfSub - 100, label: '06 SUBSTITUTE' },
  { name: '07-cinematic', scroll: positions.cinematic - 100, label: '07 CINEMATIC' },
  { name: '08-presents', scroll: positions.presents - 200, label: '08 PRESENTS' },
  { name: '09-ooh', scroll: positions.ooh, label: '09 OOH' },
  { name: '10-community', scroll: positions.community - 50, label: '10 COMMUNITY' },
  { name: '11-footer', scroll: positions.footer - 400, label: '11 FOOTER' },
];

for (const s of sections) {
  await page.evaluate((y) => window.scrollTo(0, y), s.scroll);
  await page.waitForTimeout(400);

  // Inject label dot
  await page.evaluate((label) => {
    let el = document.getElementById('__slide-label');
    if (!el) {
      el = document.createElement('div');
      el.id = '__slide-label';
      el.style.cssText = 'position:fixed;top:8px;left:8px;z-index:99999;background:red;color:white;font:bold 13px monospace;padding:4px 10px;border-radius:3px;pointer-events:none;';
      document.body.appendChild(el);
    }
    el.textContent = label;
  }, s.label);

  await page.screenshot({ path: `ai-export/slide-${s.name}.png` });
}

console.log('Done — 11 slides');
await browser.close();
