(()=>{
  'use strict';
  const key='building-ai-solutions-v1',legacyKey='cs4720r-business-ai-v1',W=window.CourseWorkbook;
  let state=W.normalize({}),storageAvailable=true;
  try{
    const current=localStorage.getItem(key),legacy=current===null?localStorage.getItem(legacyKey):null;
    state=W.normalize(JSON.parse(current||legacy||'{}'));
    if(current===null&&legacy!==null)localStorage.setItem(key,JSON.stringify(state));
  }catch{storageAvailable=false}
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storageNotice=()=>document.querySelectorAll('[data-storage-warning]').forEach(el=>{el.hidden=storageAvailable});
  function save(){try{localStorage.setItem(key,JSON.stringify(state));storageAvailable=true}catch{storageAvailable=false}storageNotice();return storageAvailable}
  function update(){
    const count=state.completed.filter(n=>n<16).length;
    document.querySelectorAll('[data-progress-label]').forEach(el=>el.textContent=`${count} of 16 core modules completed`);
    document.querySelectorAll('[data-progress-fill]').forEach(el=>el.style.width=`${count/16*100}%`);
    document.querySelectorAll('[data-progress-meter]').forEach(el=>el.setAttribute('aria-valuenow',String(count)));
    document.querySelectorAll('[data-module]').forEach(el=>{const done=state.completed.includes(Number(el.dataset.module));el.classList.toggle('is-complete',done);const dot=el.querySelector('.completed-dot');if(dot){dot.textContent=done?'✓':'';dot.setAttribute('aria-label',done?'Completed':'Not completed')}});
    document.querySelectorAll('[data-complete]').forEach(el=>{const done=state.completed.includes(Number(el.dataset.complete));el.setAttribute('aria-pressed',String(done));el.textContent=done?'✓ Module completed · mark incomplete':'Mark module complete'});
    document.querySelectorAll('[data-resume]').forEach(el=>{const next=Array.from({length:16},(_,i)=>i).find(n=>!state.completed.includes(n));el.href=next===undefined?'module-16.html':`module-${String(next).padStart(2,'0')}.html`;el.textContent=next===undefined?'Continue to the optional reflection →':count?`Continue with module ${String(next).padStart(2,'0')} →`:'Start with module 00 →'});
  }
  function restoreFields(){document.querySelectorAll('[data-note]').forEach(el=>{el.value=state.notes[el.dataset.note]||''});document.querySelectorAll('[data-check]').forEach(el=>{el.checked=!!state.checks[el.dataset.check]})}
  update();restoreFields();storageNotice();
  document.querySelectorAll('[data-complete]').forEach(btn=>btn.addEventListener('click',()=>{const n=Number(btn.dataset.complete);state.completed=state.completed.includes(n)?state.completed.filter(x=>x!==n):[...state.completed,n];save();update()}));
  document.querySelectorAll('[data-print]').forEach(btn=>btn.addEventListener('click',()=>window.print()));
  let printDisclosures=null;
  window.addEventListener('beforeprint',()=>{if(printDisclosures!==null)return;printDisclosures=[...document.querySelectorAll('.worked-answer:not([open]),.template-preview:not([open]),.business-lenses:not([open]),#venture-model-notes:not([open])')];printDisclosures.forEach(d=>d.open=true)});
  window.addEventListener('afterprint',()=>{printDisclosures?.forEach(d=>d.open=false);printDisclosures=null});
  function download(name,text,type='text/plain'){
    const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  document.querySelectorAll('[data-note]').forEach(el=>el.addEventListener('input',()=>{
    state.notes[el.dataset.note]=el.value;const ok=save();const status=el.closest('.notes').querySelector('.save-status');if(status)status.textContent=ok?'Saved on this device':'Storage unavailable. Export or save a backup before leaving.';
  }));
  document.querySelectorAll('[data-export-notes]').forEach(btn=>btn.addEventListener('click',()=>download('building-ai-solutions-my-workbook.md',W.markdown(state,window.COURSE_LABELS||{}),'text/markdown')));
  document.querySelectorAll('[data-backup]').forEach(btn=>btn.addEventListener('click',()=>download('building-ai-solutions-workbook-backup.json',JSON.stringify(W.pack(state),null,2),'application/json')));
  document.querySelectorAll('[data-import]').forEach(input=>input.addEventListener('change',async()=>{
    const status=input.closest('[data-import-panel]').querySelector('[data-import-status]');
    try{
      const file=input.files?.[0];if(!file)return;if(file.size>2_000_000)throw new Error('Choose a course workbook backup smaller than 2 MB.');
      const imported=W.unpack(await file.text()),merged=W.merge(state,imported);state=merged.state;const saved=save();update();restoreFields();
      status.textContent=`Restored ${merged.added} new note${merged.added===1?'':'s'} and merged completion markers and checklists. ${merged.conflicts?`${merged.conflicts} differing note${merged.conflicts===1?' was':'s were'} appended below your existing text for review. `:''}${saved?'Your existing notes were preserved.':'Browser storage is unavailable; save a backup before leaving.'}`;
    }catch(err){status.textContent=err.message+' Your current notes remain unchanged.'}
    finally{input.value=''}
  }));
  document.querySelectorAll('[data-check]').forEach(el=>el.addEventListener('change',()=>{state.checks[el.dataset.check]=el.checked;save()}));
  document.querySelectorAll('[data-quiz]').forEach(form=>form.addEventListener('submit',e=>{
    e.preventDefault();const input=form.querySelector('input:checked'),fb=form.querySelector('.feedback');fb.hidden=false;
    if(!input){fb.innerHTML='<strong>Choose an answer first.</strong> Then compare your reasoning with the explanation.';form.querySelector('input')?.focus();return}
    const ok=input.value===form.dataset.answer;fb.innerHTML=`<strong>${ok?'That is the strongest choice.':'Reconsider the evidence.'}</strong> ${escape(form.dataset.explanation)}`;
  }));
  const search=document.querySelector('[data-search]');
  if(search){const out=document.querySelector('[data-search-results]');let timer;
    search.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{
      const q=search.value.trim().toLowerCase();if(!q){out.innerHTML='';return}
      const terms=q.split(/\s+/),all=(window.COURSE_SEARCH||[]).map(x=>({x,score:terms.reduce((a,t)=>a+(x.title.toLowerCase().includes(t)?3:0),0)})).filter(({x})=>terms.every(t=>(x.title+' '+x.text).toLowerCase().includes(t))).sort((a,b)=>b.score-a.score),hits=all.slice(0,25);
      out.innerHTML=hits.length?`<p class="help">${all.length>25?'Showing the first 25 of '+all.length:all.length} matching lessons and resources</p>`+hits.map(({x})=>`<a class="search-result" href="${escape(x.url)}"><strong>${escape(x.title)}</strong><small>${escape(x.summary)}</small></a>`).join(''):'<p class="empty">No matching lessons. Try “customer”, “risk”, “value”, or “product”.</p>';
    },140)});
  }
  document.querySelectorAll('[data-reset-progress]').forEach(btn=>btn.addEventListener('click',()=>{if(window.confirm('Reset completed-module markers? Your written notes and assessment checklists will remain.')){state.completed=[];save();update()}}));
  document.querySelectorAll('[data-copy-template]').forEach(btn=>btn.addEventListener('click',async()=>{
    const content=document.getElementById(btn.dataset.copyTemplate),status=btn.parentElement.querySelector('[data-copy-status]');
    try{await navigator.clipboard.writeText(content.textContent);status.textContent='Template copied. Paste into your document.'}
    catch{status.textContent='Use the text download, or select and copy the template below.';const details=content.closest('details');if(details)details.open=true;content.focus()}
  }));
  document.querySelectorAll('.lesson-sidebar details').forEach(d=>{if(window.innerWidth<=760)d.open=false});
  window.addEventListener('storage',e=>{if(e.key===key&&e.newValue){try{const next=W.normalize(JSON.parse(e.newValue));document.querySelectorAll('[data-note]').forEach(el=>{if(el!==document.activeElement)el.value=next.notes[el.dataset.note]||''});state=next;update();document.querySelectorAll('[data-check]').forEach(el=>{el.checked=!!state.checks[el.dataset.check]})}catch{}}});
})();
