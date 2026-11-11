const test = require('node:test');
const assert = require('node:assert/strict');
const { textbookSource, initTextbookReaders } = require('./assets/site.js');
const source = 'https://artint.info/3e/html/ArtInt3e.Ch1.S1.html';

test('textbook readers accept only the assigned official HTTPS book locations', () => {
  assert.equal(textbookSource(source), source);
  const openstax = 'https://openstax.org/books/introductory-statistics-2e/pages/1-1-definitions-of-statistics-probability-and-key-terms';
  assert.equal(textbookSource(openstax), openstax);
  const business='https://openstax.org/books/entrepreneurship/pages/5-2-researching-potential-business-opportunities';
  assert.equal(textbookSource(business), business);
  for (const url of ['javascript:alert(1)', 'http://artint.info/3e/html/book.html', 'https://user@artint.info/3e/html/book.html', 'https://artint.info/3e/html/../../../other.html', 'https://artint.info/other/book.html', 'https://openstax.org/other-book', 'https://other.example/book', source+'?unverified=1', '/3e/html/ArtInt3e.Ch1.S1.html']) {
    assert.equal(textbookSource(url), null, url);
  }
});

function fixture(url=source) {
  let handler, loads=0, src=null;
  const frame = { dataset: { textbookSrc: url }, getAttribute(name) { return name === 'src' ? src : null; }, setAttribute(name,value) { assert.equal(name,'src'); src=value; loads++; } };
  const details = { open: false, addEventListener(name,callback) { assert.equal(name,'toggle'); handler=callback; }, querySelector(selector) { assert.equal(selector,'iframe[data-textbook-src]'); return frame; } };
  initTextbookReaders({ querySelectorAll(selector) { assert.equal(selector,'.textbook-reader'); return [details]; } });
  return {details, toggle() {handler();}, get loads() {return loads;}, get src() {return src;} };
}

test('no source is fetched on initialization or closing; opening loads once', () => {
  const app=fixture();
  assert.equal(app.loads,0); assert.equal(app.src,null);
  app.toggle(); assert.equal(app.loads,0);
  app.details.open=true; app.toggle(); assert.equal(app.loads,1); assert.equal(app.src,source);
  app.details.open=false; app.toggle(); app.details.open=true; app.toggle(); assert.equal(app.loads,1);
});

test('an unverified textbook origin is never loaded even when its disclosure opens', () => {
  const app=fixture('https://other.example/book'); app.details.open=true; app.toggle();
  assert.equal(app.loads,0); assert.equal(app.src,null);
});
