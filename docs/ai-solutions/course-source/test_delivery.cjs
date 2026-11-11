const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const W = require('./assets/workbook.js');
const { isCanvasDelivery, canvasLink } = require('./assets/site.js');
const base = 'https://www.majidmemari.com/teaching/ai-solutions/unit-06.html?delivery=canvas';

test('Canvas delivery is explicitly opt-in', () => {
  assert.equal(isCanvasDelivery(''), false);
  assert.equal(isCanvasDelivery('?embed=1'), false);
  assert.equal(isCanvasDelivery('?delivery=other'), false);
  assert.equal(isCanvasDelivery('?delivery=canvas#step-1'), false);
  assert.equal(isCanvasDelivery('?delivery=canvas'), true);
});

test('supporting material and current-lesson anchors retain the Canvas frame mode', () => {
  assert.equal(canvasLink('#practice-worked-6', base), '/teaching/ai-solutions/unit-06.html?delivery=canvas&canvasLesson=unit-06.html#practice-worked-6');
  assert.equal(canvasLink('example.html#packet', base), '/teaching/ai-solutions/example.html?delivery=canvas&canvasLesson=unit-06.html#packet');
  assert.equal(canvasLink('unit-06.html', 'https://www.majidmemari.com/teaching/ai-solutions/example.html?delivery=canvas', 'unit-06.html'), '/teaching/ai-solutions/unit-06.html?delivery=canvas&canvasLesson=unit-06.html');
});

test('Canvas links do not open external pages or skip its unit sequence', () => {
  for (const href of ['https://other.example/', 'https://www.majidmemari.com/', '/?chat=open', 'unit-07.html', 'index.html', 'finish.html', 'milestone-3.html', 'instructor.html', 'javascript:alert(1)', 'downloads/course-site.zip', '../assistant', 'https://user@www.majidmemari.com/teaching/ai-solutions/example.html']) assert.equal(canvasLink(href, base), null, href);
  assert.equal(canvasLink('unit-07.html', base, 'unit-07.html'), null, 'a forged origin lesson cannot change the current unit');
});

function boot(search) {
  const listeners = new Map();
  const element = () => ({ hidden: false, dataset: {}, textContent: '', setAttribute() {}, removeAttribute() {}, focus() {}, scrollIntoView() {}, addEventListener(name, cb) { this[name] = cb; }, querySelector() { return element(); } });
  const stages = Array.from({ length: 4 }, element);
  const buttons = Array.from({ length: 4 }, (_, i) => Object.assign(element(), { dataset: { stepButton: String(i) } }));
  const next = element(), prev = element(), actions = element();
  const original = JSON.stringify({ version: 2, completed: [1], notes: { 'unit-06': 'Preserve my existing notes' }, checks: {}, steps: { 6: 2 }, lastUnit: 6 });
  let saved = original, reads = 0, writes = 0;
  const location = { href: base.split('?')[0] + search, pathname: '/teaching/ai-solutions/unit-06.html', search, hash: '' };
  const document = { documentElement: { dataset: {} }, body: { dataset: { unit: '6' }, style: {} },
    querySelectorAll(selector) { return selector === '[data-step]' ? stages : selector === '[data-step-button]' ? buttons : []; },
    querySelector(selector) { return ({ '.step-actions': actions, '[data-course-next]': next, '[data-course-prev]': prev, '.step-nav': element() })[selector] || null; },
    addEventListener(name, cb) { listeners.set(name, cb); }, getElementById() { return null; } };
  vm.runInNewContext(fs.readFileSync(require.resolve('./assets/site.js'), 'utf8'), {
    window: { CourseWorkbook: W, addEventListener(name, cb) { listeners.set(name, cb); } }, document, location, URL, URLSearchParams,
    localStorage: { getItem() { reads++; return saved; }, setItem(key, value) { writes++; saved = value; } },
  });
  return { document, buttons, next, prev, location, stages, counts: () => ({ reads, writes }), saved: () => saved, original };
}

test('Canvas stage navigation does not read, overwrite, or complete the standalone workbook', () => {
  const app = boot('?delivery=canvas');
  assert.equal(app.document.documentElement.dataset.delivery, 'canvas');
  assert.equal(app.stages[0].hidden, false, 'embedded lesson starts at Learn');
  app.buttons[3].click();
  assert.equal(app.stages[3].hidden, false);
  assert.equal(app.next.hidden, true, 'Finish returns control to Canvas Next');
  app.next.click();
  assert.equal(app.location.href, base, 'even a dispatched hidden button cannot advance the website path');
  assert.deepEqual(app.counts(), { reads: 0, writes: 0 });
  assert.equal(app.saved(), app.original);
});

test('standalone delivery still restores progress and continues to the next unit', () => {
  const app = boot('');
  assert.equal(app.stages[2].hidden, false, 'standalone stage is restored');
  app.buttons[3].click();
  assert.equal(app.next.hidden, false);
  app.next.click();
  assert.equal(app.location.href, 'unit-07.html');
  assert.equal(JSON.parse(app.saved()).notes['unit-06'], 'Preserve my existing notes');
  assert(JSON.parse(app.saved()).completed.includes(6));
  assert(app.counts().reads > 0 && app.counts().writes > 0);
});
