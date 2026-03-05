import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000); // preloader

// Scroll through to trigger all animations
const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
for (let i = 0; i <= 40; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), (scrollHeight / 40) * i);
  await page.waitForTimeout(150);
}

// Now capture sections at viewport positions
// Find actual section positions
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
  { name: 'hero', scroll: positions.hero },
  { name: 'intro', scroll: positions.intro - 100 },
  { name: 'manifiesto-1', scroll: positions.mf1 + 200 },
  { name: 'manifiesto-2', scroll: positions.mf2 - 100 },
  { name: 'manifiesto-3', scroll: positions.mf3 - 200 },
  { name: 'substitute', scroll: positions.mfSub - 100 },
  { name: 'cinematic', scroll: positions.cinematic - 100 },
  { name: 'presents', scroll: positions.presents - 200 },
  { name: 'ooh', scroll: positions.ooh },
  { name: 'community', scroll: positions.community - 50 },
  { name: 'footer', scroll: positions.footer - 400 },
];

for (const s of sections) {
  await page.evaluate((y) => window.scrollTo(0, y), s.scroll);
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `ai-export/vp-${s.name}.png`,
  });
}

// Also full-page
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: 'ai-export/screenshot-v3.png', fullPage: true });

console.log('Done');
await browser.close();
