"""Check the generated independent core, internal links, and instructional alignment."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re,zipfile
from course_content import UNITS,MILESTONES
ROOT=Path(__file__).resolve().parent/'dist'
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.ids=[];self.links=[];self.stages=[];self.titles=0;self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag in ['a','link','script','iframe']:
   x=a.get('href') or a.get('src')
   if x:self.links.append(x)
  if 'data-step' in a:self.stages.append(a['data-step'])
  if tag=='h1':self.titles+=1
errors=[];pages={p:Page(p.read_text()) for p in ROOT.rglob('*.html')}
for p,dom in pages.items():
 if len(dom.ids)!=len(set(dom.ids)):errors.append(f'Duplicate IDs: {p.name}')
 for link in dom.links:
  u=urlsplit(link)
  if u.scheme or u.netloc or link.startswith('/'):continue
  target=(p.parent/unquote(u.path)).resolve() if u.path else p
  if not target.exists():errors.append(f'{p.name} missing {link}')
  elif u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:errors.append(f'{p.name} missing anchor {link}')
 if p.name.startswith('unit-'):
  if dom.stages!=['0','1','2','3']:errors.append(f'{p.name}: four ordered steps missing')
  if dom.titles!=1:errors.append(f'{p.name}: expected one h1')
 text=p.read_text()
 if re.search(r'\b(?:UVU|Ruggles|BEI|CS.?4720|EdTech)\b|mailto:',text,re.I):errors.append(f'Public branding/contact regression: {p.name}')
assert len(UNITS)==12 and len(MILESTONES)==5
assert [m['unit'] for m in MILESTONES]==[3,5,7,10,12]
assert sum(m['weight'] for m in MILESTONES)==100
for m in MILESTONES:
 if sum(r['weight'] for r in m['rubric'])!=100:errors.append(f'Milestone {m["number"]} rubric not100%')
for u in UNITS:
 if not 0<=u['finish_check']['answer']<len(u['finish_check']['choices']):errors.append(f'Invalid answer {u["number"]}')
 if len(re.sub('<[^>]+>',' ',u['learn_html']+u['try_html']+u.get('try_worked_html','')+u['build_html']).split())<400:errors.append(f'Unit {u["number"]} too thin')
 if u['number'] in (2,4,6,7,8):
  n=u['number'];text=(ROOT/f'unit-{n:02d}.html').read_text()
  practice_at=text.find('<div data-practice=')
  worked_at=text.find(f'<details class="practice-worked" id="practice-worked-{n}">')
  build_at=text.find('id="step-2"')
  if not 0<=practice_at<worked_at<build_at:errors.append(f'Unit {n}: inline practice must precede its worked explanation inside Try')
  if not u.get('try_worked_html') or '<table>' not in u['try_worked_html']:errors.append(f'Unit {n}: static worked comparison is missing')
  if '<noscript><p>Interactive controls require JavaScript.' not in text:errors.append(f'Unit {n}: reading fallback is missing')
  if 'Carry forward:' not in u['try_worked_html']:errors.append(f'Unit {n}: worked comparison has no project transfer')
with zipfile.ZipFile(ROOT/'downloads/course-site.zip') as z:
 assert z.testzip() is None
 assert 'unit-12.html' in z.namelist() and 'assets/practice.js' in z.namelist()
 assert not any(n.endswith('.json') or n.startswith('.') for n in z.namelist())
if errors:raise SystemExit('\n'.join(errors))
print(f'PASS: {len(pages)} HTML pages; 12 units, 5 rubrics, 5 inline practice/worked comparisons, links/anchors, branding, portable archive.')
