/* Run: node test_lesson_figures.cjs. No browser or network is required. */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const F = require('./assets/lesson-figures.js');

const close = (a,b) => assert.ok(Math.abs(a-b)<1e-10, `${a} differs from ${b}`);

test('complete effort never mistakes the draft subtotal for the whole task', () => {
  assert.deepEqual([0,1,2,3].map(s => F.effortModel(s).shown),[2,5,7,8]);
  assert.deepEqual([0,1,2,3].map(s => F.effortModel(s).complete),[false,false,false,true]);
  const changed=F.effortModel(3,2); assert.equal(changed.full,7); close(changed.reduction,.125);
  assert.equal(F.effortModel(3).reduction,0);
  assert.equal(F.effortModel(NaN,99).shown,2);
});

test('repair reveals an untested boundary rather than hiding it in an old denominator', () => {
  assert.deepEqual([0,1,2,3,4].map(s => {const r=F.repairModel(s);return [r.passed,r.total]}),[[1,3],[2,3],[3,3],[3,4],[4,4]]);
  assert.equal(F.repairModel(3).cases[3].actual,'refund');
  assert.equal(F.repairModel(3).cases[3].expected,'90-day credit');
  assert.equal(F.repairModel(4).cases[3].actual,'credit');
  for(let s=1;s<5;s++) for(const prior of F.repairModel(s-1).cases.filter(x=>x.pass)) assert.ok(F.repairModel(s).cases.find(x=>x.label===prior.label).pass);
});

test('additional revision consumes valued resources and whole-release capacity while cash expense stays fixed', () => {
  const a=F.resourceModel(),b=F.resourceModel(true);
  assert.deepEqual([a.timeValue,a.remainingAllowance,a.cashExpense,a.releases,a.unusedHours],[108,60,12,3,1.5]);
  assert.deepEqual([b.timeValue,b.remainingAllowance,b.cashExpense,b.releases,b.unusedHours],[132,36,12,2,4]);
  for(const r of [a,b]) { assert.equal(r.cashExpense+r.timeValue+r.remainingAllowance,r.allowance);assert.ok(r.releases*r.hours<=r.capacityHours);assert.ok((r.releases+1)*r.hours>r.capacityHours); }
  assert.equal(a.allowance,b.allowance);
  assert.equal(b.timeValue-a.timeValue,a.remainingAllowance-b.remainingAllowance);
});

test('adoption rates preserve people across denominators and cost uses observed completed first tasks', () => {
  for(const completed of [3,5]) for(let stage=0;stage<4;stage++) {
    const a=F.funnelModel(stage,completed,'all'),b=F.funnelModel(stage,completed,'previous');
    assert.deepEqual(a.rows.map(x=>x.count),b.rows.map(x=>x.count));
    assert.equal(a.current.denominator,100);
    if(stage<3){assert.equal(a.costPerCompletion,null);assert.equal(b.costPerCompletion,null);}
    assert.equal(a.resourceValue,a.cashExpense+a.supportHours*24);
  }
  assert.deepEqual(F.funnelModel(3,3,'previous').rows.map(r=>r.rate),[1,.2,.25,.6]);
  assert.deepEqual(F.funnelModel(3,3,'all').rows.map(r=>r.rate),[1,.2,.05,.03]);
  assert.equal(F.funnelModel(3,3).costPerCompletion,90);
  assert.equal(F.funnelModel(3,5).costPerCompletion,54);
  assert.equal(F.funnelModel(3,5).resourceValue,F.funnelModel(3,3).resourceValue);
  assert.match(F.funnelModel(3).current.label,/Observed successful first tasks/);
});

test('queue conserves all requests and distinguishes deferred demand from an empty internal queue', () => {
  for(const policy of ['standard','capacity','intake']) for(let day=0;day<=5;day++) {
    const r=F.queueModel(day,policy);
    assert.equal(r.arriving,r.reviewed+r.queued+r.deferred);
    assert.equal(r.accepted,r.reviewed+r.queued);
    assert.equal(r.reviewed,r.rows.reduce((s,x)=>s+x.reviewed,0));
    assert.ok(r.rows.every(x=>x.reviewed<=r.capacity && x.queued>=0));
  }
  const a=F.queueModel(5),b=F.queueModel(5,'capacity'),c=F.queueModel(5,'intake');
  assert.deepEqual(a.rows.map(r=>r.queued),[6,12,18,24,30]);
  assert.deepEqual([a.arriving,a.reviewed,a.queued],[150,120,30]);
  assert.deepEqual([b.reviewed,b.queued,b.extraMinutes,b.extraTimeValue],[150,0,150,60]);
  assert.deepEqual([c.reviewed,c.queued,c.deferred],[120,0,30]);
});

test('axis truncation changes drawn ratios while preserving the actual data reduction', () => {
  const a=F.chartModel(0),b=F.chartModel(80);
  assert.equal(a.manual,b.manual);assert.equal(a.assisted,b.assisted);
  close(a.reduction,.125);close(b.reduction,.125);
  close(a.visibleReduction,.125);close(b.visibleReduction,.75);
  assert.deepEqual([b.visibleManual,b.visibleAssisted],[16,4]);
});

test('rendered states keep the calculation, uncertainty, and same-record table together', () => {
  const resources=F.renderFigure(9,{extra:true});assert.match(resources,/\$36/);assert.match(resources,/5\.5/);assert.match(resources,/2; 4 hours unused/);
  assert.match(resources,/neither cash remaining nor profit/);
  assert.doesNotMatch(resources,/Contribution|proposed price|willingness-to-pay/);
  const adoption=F.renderFigure(10,{stage:3});assert.match(adoption,/\$90 resource cost per observed successful first task/);
  assert.match(adoption,/First use does not establish continued use/);
  assert.doesNotMatch(adoption,/paying|customer|acquisition|profit/);
  assert.match(F.renderFigure(10,{stage:3,completed:5}),/\$54 resource cost per hypothetical/);
  assert.match(F.renderFigure(10,{stage:3,completed:5}),/hypothetical comparison, not observed outcomes/);
  assert.match(F.renderFigure(10,{stage:3,completed:5}),/Hypothetical successful first tasks/);
  assert.doesNotMatch(F.renderFigure(10,{stage:3,completed:5}),/are supplied fictional observations/);
  assert.match(F.renderFigure(10,{stage:3,completed:5}),/assumes the same \$270 resources/);
  const repaired=F.renderFigure(5,{stage:3});assert.match(repaired,/3\/4/);assert.match(repaired,/exactly 24 hours/);assert.match(repaired,/tabindex="0" role="region"/);
  const queue=F.renderFigure(11,{day:5,policy:'intake'});assert.match(queue,/30 deferred/);assert.match(queue,/empty internal queue does not mean/);
  const capacity=F.renderFigure(11,{day:5,policy:'capacity'});assert.match(capacity,/cash expense only if additional time is paid/);
  assert.equal((F.renderFigure(10,{stage:3}).match(/lesson-figure-dot /g)||[]).length,100);
  assert.equal(F.renderFigure(99), '');
  assert.match(F.renderFigure(12,{claim:1}),/lesson-figure-insight lf-caution/);
  assert.match(F.renderFigure(12,{claim:1}),/Unsupported\. 75%/);
  assert.doesNotMatch(F.renderFigure(12,{claim:0}),/lesson-figure-insight lf-caution/);
  assert.match(F.renderFigure(12),/reviewed AI 84 minutes/);
});

test('text readability normalization preserves numeric thousands and does not touch markup', () => {
  assert.equal(F.readableText('1,200 replies and$24/hour;12 cases'),'1,200 replies and $24/hour; 12 cases');
  assert.equal(F.readableText('24hours /5days'),'24 hours /5 days');
  const source=fs.readFileSync(path.join(__dirname,'assets/lesson-figures.js'),'utf8');
  assert.match(source,/createTreeWalker/); assert.match(source,/node\.nodeValue = readableText/);
  assert.doesNotMatch(source,/enhanced\.innerHTML\s*=/);
  assert.match(source,/enhanced\.append\(content,liveStatus\)/);
});

test('static fallbacks and all dynamic states have balanced accessible HTML', () => {
  const snapshots=[];
  for(let s=0;s<=3;s++)snapshots.push(F.renderFigure(3,{stage:s}));
  snapshots.push(F.renderFigure(3,{stage:3,checking:2}));
  for(let s=0;s<=4;s++)snapshots.push(F.renderFigure(5,{stage:s}));
  for(const extra of [false,true])snapshots.push(F.renderFigure(9,{extra}));
  for(let s=0;s<=3;s++)for(const basis of ['all','previous'])for(const completed of [3,5])snapshots.push(F.renderFigure(10,{stage:s,basis,completed}));
  for(let day=0;day<=5;day++)for(const policy of ['standard','capacity','intake'])snapshots.push(F.renderFigure(11,{day,policy}));
  for(const axis of [0,80])for(const claim of [null,0,1,2])snapshots.push(F.renderFigure(12,{axis,claim}));
  const code=String.raw`
import json,sys,re
from html.parser import HTMLParser
from visual_lessons import LESSON_FIGURE_UNITS,FIGURE_EVIDENCE,render_lesson_figure
class Check(HTMLParser):
 def __init__(self):super().__init__();self.stack=[];self.tags={};self.ids=[]
 def handle_starttag(self,tag,attrs):
  assert tag!='h','Malformed split heading'
  a=dict(attrs);self.tags[tag]=self.tags.get(tag,0)+1
  assert not any(k.startswith('on') for k in a),'Inline event handler'
  if tag=='th':assert a.get('scope') in ['row','col']
  if tag=='svg':assert a.get('role')=='img' and a.get('aria-labelledby')
  if 'id' in a:assert a['id'] not in self.ids;self.ids.append(a['id'])
  if tag not in ['input','br','hr','img']:self.stack.append(tag)
 def handle_endtag(self,tag):
  assert self.stack and self.stack[-1]==tag,(tag,self.stack)
  self.stack.pop()
 def check(self,value):
  assert not re.search(r'</?h\s+[1-6]',value)
  self.feed(value);self.close();assert not self.stack
  assert self.tags.get('table',0)==self.tags.get('caption',0)
  assert self.tags.get('figure',0)==self.tags.get('figcaption',0)
static=[render_lesson_figure(u) for u in LESSON_FIGURE_UNITS]
assert len(static)==6 and render_lesson_figure(1)==''
assert 'cash expense only if additional time is paid' in FIGURE_EVIDENCE[11]
assert 'cash expense only if additional time is paid' in static[4]
assert 'not a cash balance, price or profit' in FIGURE_EVIDENCE[9]
assert 'observed successful first-task completions' in FIGURE_EVIDENCE[10]
assert 'not your own user-test evidence' in static[3]
for s in static+json.load(sys.stdin):Check().check(s)
print('All static and enhanced fragments passed HTML structure checks.')
`;
  const result=spawnSync('python3',['-c',code],{cwd:__dirname,input:JSON.stringify(snapshots),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/passed HTML structure/);
});
