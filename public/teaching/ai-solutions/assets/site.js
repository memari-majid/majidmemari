(function(){'use strict';
 // Opt-in delivery profile. It changes presentation and navigation, never a gradebook.
 const isCanvasDelivery=search=>new URLSearchParams(search).get('delivery')==='canvas';
 const canvasLesson=value=>/^unit-(?:0[1-9]|1[0-2])\.html$/.test(value||'')?value:'';
 function canvasLink(href,base,lesson=''){
  if(typeof href!=='string'||!href)return null;
  try{
   const current=new URL(base),url=new URL(href,current),folder=new URL('.',current).pathname;
   if(url.origin!==current.origin||url.username||url.password||!url.pathname.startsWith(folder))return null;
   const page=url.pathname.slice(folder.length),currentPage=current.pathname.slice(folder.length);
   const originLesson=canvasLesson(currentPage)||canvasLesson(lesson);
   if(page!==currentPage&&!['example.html','project.html','readings.html','resources.html'].includes(page)&&page!==originLesson)return null;
   if(!page||page.includes('/')||page==='index.html'||page==='finish.html'||page==='instructor.html'||page.startsWith('milestone-'))return null;
   url.searchParams.set('delivery','canvas');
   if(originLesson)url.searchParams.set('canvasLesson',originLesson);
   return url.pathname+url.search+url.hash;
  }catch{return null;}
 }
 if(typeof module==='object'&&module.exports){module.exports={isCanvasDelivery,canvasLesson,canvasLink};return;}
 const canvasMode=isCanvasDelivery(location.search);
 if(canvasMode){
  document.documentElement.dataset.delivery='canvas';
  const fromLesson=canvasLesson(location.pathname.split('/').pop())||canvasLesson(new URLSearchParams(location.search).get('canvasLesson'));
  document.querySelectorAll('a[href]').forEach(a=>{
   const href=canvasLink(a.getAttribute('href'),location.href,fromLesson);
   a.removeAttribute('target');
   if(href){a.setAttribute('href',href);}
   else{a.removeAttribute('href');a.removeAttribute('download');a.classList.add('canvas-source-label');}
  });
  const back=document.querySelector('[data-canvas-return]');
  if(back&&fromLesson&&!location.pathname.endsWith('/'+fromLesson)){back.href=canvasLink(fromLesson,location.href,fromLesson);back.hidden=false;}
  document.querySelectorAll('[data-note],[data-check],[data-import]').forEach(el=>el.disabled=true);
 }
 const W=window.CourseWorkbook,KEY='building-ai-solutions-v2';let state=W.normalize({}),storage=true,workbookWarning='';
 const notice=()=>{const e=document.querySelector('.storage-notice');if(e){e.hidden=storage&&!workbookWarning;e.textContent=workbookWarning||'Browser storage is unavailable. Keep this page open and export readable notes before leaving.';}};
 if(!canvasMode)try{const raw=localStorage.getItem(KEY);if(raw)state=W.normalize(JSON.parse(raw));}catch{storage=false;}
 const save=()=>{if(canvasMode)return;try{W.assertSavable(state);localStorage.setItem(KEY,JSON.stringify(state));storage=true;}catch(error){storage=false;if(error instanceof Error&&/workbook|note|preparation/i.test(error.message))workbookWarning=error.message;}notice();};
 const download=(name,text,type)=>{const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 function update(){document.querySelectorAll('[data-progress]').forEach(el=>el.textContent=state.completed.length+' of 12 units complete');document.querySelectorAll('[data-progress-bar]').forEach(el=>el.value=state.completed.length);document.querySelectorAll('[data-unit-link]').forEach(el=>{const done=state.completed.includes(Number(el.dataset.unitLink));el.querySelector('.unit-state').textContent=done?'✓':'→';el.querySelector('.unit-state').setAttribute('aria-label',done?'Marked complete':'Not yet marked complete');});const next=state.completed.length===12?0:(!state.completed.includes(state.lastUnit)?state.lastUnit:Array.from({length:12},(_,i)=>i+1).find(n=>!state.completed.includes(n)));document.querySelectorAll('[data-resume]').forEach(el=>{el.href=next?'unit-'+String(next).padStart(2,'0')+'.html':'finish.html';el.textContent=next?(state.completed.length||Object.keys(state.steps).length?'Continue with Unit '+next+' →':'Start with Unit 1 →'):'Review your final handoff →';});}
 function restore(){document.querySelectorAll('[data-note]').forEach(el=>el.value=state.notes[el.dataset.note]||'');document.querySelectorAll('[data-check]').forEach(el=>el.checked=!!state.checks[el.dataset.check]);}
 update();restore();notice();
 const readableState=()=>{const copy=W.normalize(state);document.querySelectorAll('[data-note]').forEach(el=>copy.notes[el.dataset.note]=el.value);return copy;};
 const reportWorkbookError=error=>{workbookWarning=error instanceof Error?error.message:'The workbook could not be changed. Your saved work has not changed.';notice();};
 document.querySelectorAll('[data-note]').forEach(el=>{el.maxLength=W.LIMITS.noteCharacters;el.addEventListener('input',()=>{const status=el.closest('.notes')?.querySelector('[data-saved]');try{const next=W.updateNote(state,el.dataset.note,el.value);state=next;workbookWarning='';save();if(status)status.textContent=storage?'Saved in this browser':'Not saved — export readable notes before leaving';}catch(error){reportWorkbookError(error);if(status)status.textContent='This edit is not saved. Export readable notes or shorten it before leaving.';}});});
 document.querySelectorAll('[data-check]').forEach(el=>el.addEventListener('change',()=>{state.checks[el.dataset.check]=el.checked;document.querySelectorAll('[data-check]').forEach(other=>{if(other.dataset.check===el.dataset.check)other.checked=el.checked;});save();}));
 document.querySelectorAll('[data-export]').forEach(el=>el.addEventListener('click',()=>download('ai-solutions-project.txt',W.markdown(readableState()),'text/plain')));
 document.querySelectorAll('[data-backup]').forEach(el=>el.addEventListener('click',()=>{try{const text=JSON.stringify(W.pack(readableState()),null,2);download('ai-solutions-workbook.json',text,'application/json');workbookWarning='';notice();}catch(error){reportWorkbookError(error);}}));
 const importStatus=document.querySelector('[data-import-status]');
 function mergeIncomingList(incoming){let candidate=state,added=0,conflicts=0;for(const item of incoming){const result=W.merge(candidate,item);candidate=result.state;added+=result.added;conflicts+=result.conflicts;}state=candidate;workbookWarning='';save();restore();update();if(importStatus)importStatus.textContent=`Preserved ${added} new notes; kept ${conflicts} differing notes separately. Export readable notes to review them. ${storage?'Saved in this browser.':'Export a backup before leaving.'}`;}
 document.querySelector('[data-import]')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>W.LIMITS.bytes)throw new Error('Choose a backup no larger than 2 MB. Your work has not changed.');mergeIncomingList([W.unpack(await f.text())]);}catch(error){if(importStatus)importStatus.textContent=error.message;reportWorkbookError(error);}e.target.value='';});
 document.querySelector('[data-import-legacy]')?.addEventListener('click',()=>{try{const incoming=[];for(const key of ['building-ai-solutions-v1','cs4720r-business-ai-v1']){const raw=localStorage.getItem(key);if(raw)incoming.push(W.legacy(JSON.parse(raw)));}if(incoming.length)mergeIncomingList(incoming);else if(importStatus)importStatus.textContent='No earlier-edition workbook was found in this browser. You can restore an exported backup instead.';}catch(error){if(importStatus)importStatus.textContent=error.message||'Earlier notes could not be read. Your current workbook is unchanged.';reportWorkbookError(error);}});
 document.querySelectorAll('.knowledge-check').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const value=new FormData(form).get(form.querySelector('input[type=radio]').name),feedback=form.querySelector('.feedback');feedback.hidden=false;if(value===null){feedback.textContent='Choose an answer first, then compare your reasoning.';return;}const correct=Number(value)===Number(form.dataset.answer);feedback.dataset.correct=String(correct);feedback.textContent=(correct?'Yes. ':'Reconsider this choice. ')+form.dataset.explanation;}));
 const unit=Number(document.body.dataset.unit),stages=[...document.querySelectorAll('[data-step]')],buttons=[...document.querySelectorAll('[data-step-button]')];let step=unit?state.steps[unit]??0:0;
 function showStep(index,focus=false){step=Math.max(0,Math.min(3,index));stages.forEach((el,i)=>el.hidden=i!==step);buttons.forEach((el,i)=>{if(i===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});const prev=document.querySelector('[data-course-prev]'),next=document.querySelector('[data-course-next]');if(prev)prev.hidden=step===0;if(next){next.hidden=canvasMode&&step===3;next.textContent=step===3?(unit===12?'Mark complete & finish →':'Mark complete & continue →'):'Continue to '+['Learn','Try','Build','Finish'][step+1]+' →';}if(unit&&!canvasMode){state.steps[unit]=step;state.lastUnit=unit;save();}if(focus){stages[step].querySelector('.stage-label')?.focus({preventScroll:true});document.querySelector('.step-nav').scrollIntoView({block:'start'});}}
 function revealHash(){if(!location.hash)return;let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=document.getElementById(id);if(!target)return;const stage=target.closest('[data-step]');if(stage)showStep(Number(stage.dataset.step));let ancestor=target.parentElement;while(ancestor){if(ancestor.tagName==='DETAILS')ancestor.open=true;ancestor=ancestor.parentElement;}requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
 if(stages.length){document.querySelector('.step-actions').hidden=false;showStep(step);buttons.forEach(b=>b.addEventListener('click',()=>showStep(Number(b.dataset.stepButton),true)));document.querySelector('[data-course-prev]').addEventListener('click',()=>showStep(step-1,true));document.querySelector('[data-course-next]').addEventListener('click',()=>{if(step<3)showStep(step+1,true);else{if(canvasMode)return;if(!state.completed.includes(unit))state.completed.push(unit);state.lastUnit=Math.min(12,unit+1);save();location.href=unit===12?'finish.html':'unit-'+String(unit+1).padStart(2,'0')+'.html';}});revealHash();window.addEventListener('hashchange',revealHash);}
 let printDetails=[];window.addEventListener('beforeprint',()=>{printDetails=[...document.querySelectorAll('details')].map(e=>[e,e.open]);printDetails.forEach(([e])=>e.open=true);});window.addEventListener('afterprint',()=>printDetails.forEach(([e,open])=>e.open=open));
 const panel=document.querySelector('.ta-panel'),shade=document.querySelector('.ta-shade'),frame=panel?.querySelector('iframe');let opener;
 const background=[document.querySelector('.site-header'),document.querySelector('main'),document.querySelector('.site-footer')];
 function closeTA(){if(!panel||panel.hidden)return;panel.hidden=true;shade.hidden=true;background.forEach(e=>e.inert=false);document.body.style.overflow='';opener?.focus();}
 document.querySelectorAll('[data-open-ta]').forEach(b=>b.addEventListener('click',()=>{opener=b;if(!frame.src){const url=new URL(frame.dataset.src,location.href);url.searchParams.set('lesson',location.pathname.split('/').pop()||'index.html');panel.querySelector('.ta-fallback a').href=url.href;url.searchParams.set('embed','1');if(canvasMode)url.searchParams.set('delivery','canvas');frame.src=url.href;}panel.hidden=false;shade.hidden=false;background.forEach(e=>e.inert=true);document.body.style.overflow='hidden';panel.querySelector('[data-close-ta]').focus();}));
 document.querySelectorAll('[data-close-ta]').forEach(b=>b.addEventListener('click',closeTA));document.addEventListener('keydown',e=>{if(!panel||panel.hidden)return;if(e.key==='Escape')closeTA();if(e.key==='Tab'){const first=panel.querySelector('button'),last=canvasMode?frame:panel.querySelector('.ta-fallback a');if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 window.addEventListener('message',e=>{if(frame?.src&&e.source===frame.contentWindow&&e.origin===new URL(frame.src).origin&&e.data?.type==='course-ta-close')closeTA();});
})();
