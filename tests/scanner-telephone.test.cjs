/* Réf. 4538ad4bfb95 : « Je ne vois pas le scanner en vue téléphone ».
   Le hero recadrait l'image sur toute la hauteur de l'écran : le scanner, dans la moitié basse, passait sous le voile crème et le texte.
   Ce test ouvre la vraie page en format téléphone et vérifie que le capot brun du scanner se voit, et que le texte ne recouvre jamais l'image.
   Lancer : node --test tests/scanner-telephone.test.cjs   (Playwright + Chromium) */
const test = require('node:test'), assert = require('node:assert'), http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const RACINE = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg' };

function servir() {
  return new Promise(function (ok) {
    const s = http.createServer(function (q, r) {
      let f = path.normalize(decodeURIComponent(q.url.split('?')[0])); if (f.endsWith(path.sep) || f === '/') f += 'index.html';
      const p = path.join(RACINE, f);
      if (!p.startsWith(RACINE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
    }).listen(0, '127.0.0.1', function () { ok(s); });
  });
}
// nombre de points « brun du capot du scanner » dans une image PNG, comptés dans le navigateur
async function brun(page, png) {
  return page.evaluate(async function (src) {
    const im = new Image(); im.src = src; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2]; if (r > 70 && r < 135 && g > 35 && g < 85 && b > 20 && b < 70 && r - b > 35) n++; }
    return n / (c.width * c.height);
  }, 'data:image/png;base64,' + png.toString('base64'));
}

test('téléphone : le scanner se voit et le texte ne recouvre pas l’image', async function () {
  const srv = await servir(), nav = await chromium.launch();
  try {
    for (const t of [[360, 640], [411, 801], [412, 915]]) {
      const ctx = await nav.newContext({ viewport: { width: t[0], height: t[1] }, deviceScaleFactor: 1 });
      await ctx.route(/fonts\.(googleapis|gstatic)\.com/, function (r) { r.abort(); });
      const page = await ctx.newPage(), outil = await ctx.newPage();
      await page.goto('http://127.0.0.1:' + srv.address().port + '/index.html');
      await page.waitForSelector('#stage.has-seq');
      const hero = await page.evaluate(function () { const h = document.querySelector('#top'), s = document.querySelector('#stage'); return { top: h.offsetTop, h: h.offsetHeight - s.offsetHeight }; });
      for (const p of [0, .25, .5, .75, 1]) {
        await page.evaluate(function (y) { window.scrollTo(0, y); }, hero.top + hero.h * p);
        await page.waitForTimeout(900);
        const g = await page.evaluate(function () {
          const r = function (e) { const b = e.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right }; };
          return { image: r(document.querySelector('#seq')), texte: r(document.querySelector('.ph.on')), large: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        });
        const ou = t.join('×') + ' à ' + p;
        assert.ok(g.large <= 0, ou + ' : la page déborde en largeur');
        assert.ok(g.texte.top >= g.image.bottom - 1, ou + ' : le texte (' + Math.round(g.texte.top) + ') recouvre l’image (' + Math.round(g.image.bottom) + ')');
        if (p <= .5) { // le scanner est au premier plan sur les trois premiers temps
          const png = await page.screenshot({ clip: { x: 0, y: g.image.top, width: t[0], height: g.image.bottom - g.image.top } });
          const part = await brun(outil, png);
          assert.ok(part > .02, ou + ' : le capot du scanner ne se voit pas (' + (part * 100).toFixed(2) + ' % de l’image)');
        }
      }
      await ctx.close();
    }
  } finally { await nav.close(); srv.close(); }
});
