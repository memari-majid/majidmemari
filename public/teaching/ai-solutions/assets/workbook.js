/* Local workbook serialization. No network or DOM access. */
(function(root){
  'use strict';
  const APP='building-ai-solutions-workbook';
  const supportedFormats=new Set([APP,'cs4720r-business-ai-workbook']);
  const reserved=new Set(['__proto__','prototype','constructor']);
  const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const safeKey=k=>typeof k==='string'&&k.length>0&&k.length<=240&&!reserved.has(k);
  function normalize(input){
    const source=record(input)?input:{};
    const completed=[...new Set(Array.isArray(source.completed)?source.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<=16):[])].sort((a,b)=>a-b);
    const notes=Object.create(null),checks=Object.create(null);
    if(record(source.notes))for(const [k,v]of Object.entries(source.notes).slice(0,200))if(safeKey(k)&&typeof v==='string')notes[k]=v.slice(0,150000);
    if(record(source.checks))for(const [k,v]of Object.entries(source.checks).slice(0,1000))if(safeKey(k)&&typeof v==='boolean')checks[k]=v;
    return {completed,notes,checks};
  }
  function pack(state){return {format:APP,version:1,exportedAt:new Date().toISOString(),state:normalize(state)}}
  function unpack(text){
    if(typeof text!=='string'||text.length>2_000_000)throw new Error('Choose a course workbook backup smaller than 2 MB.');
    let data;try{data=JSON.parse(text)}catch{throw new Error('This file is not valid JSON. Choose the .json workbook backup exported by this course.')}
    if(!record(data)||!supportedFormats.has(data.format)||data.version!==1||!record(data.state))throw new Error('This is not a supported course workbook backup. Choose the .json file exported with “Save backup”.');
    if(!Array.isArray(data.state.completed)||!record(data.state.notes)||!record(data.state.checks))throw new Error('The backup is incomplete. Your current workbook has not been changed.');
    return normalize(data.state);
  }
  function merge(current,incoming){
    const result=normalize(current),other=normalize(incoming);let added=0,conflicts=0;
    result.completed=[...new Set([...result.completed,...other.completed])].sort((a,b)=>a-b);
    for(const[k,v]of Object.entries(other.notes)){
      if(!v.trim())continue;
      if(!result.notes[k]||!result.notes[k].trim()){result.notes[k]=v;added++}
      else if(result.notes[k]!==v&&!result.notes[k].includes(v)){result.notes[k]+='\n\n--- Imported note — review before merging ---\n\n'+v;conflicts++}
    }
    for(const[k,v]of Object.entries(other.checks))result.checks[k]=Boolean(result.checks[k]||v);
    return {state:result,added,conflicts};
  }
  function markdown(state,labels={}){
    const s=normalize(state);let text='# Building AI Solutions — My Workbook\n\nCourse by Majid Memari.\n\n';
    text+='Personal study notes. These are not submitted work or official grades.\n\n';
    text+='## Learning progress\n\n'+(s.completed.length?s.completed.map(n=>'- '+(labels.modules?.[n]||`Module ${String(n).padStart(2,'0')}`)).join('\n'):'No modules marked complete yet.')+'\n\n';
    const filled=Object.entries(s.notes).filter(([,v])=>v.trim());
    text+='## Working notes\n\n';
    text+=filled.length?filled.map(([k,v])=>`### ${k}\n\n${v}\n`).join('\n'):'No written notes yet.\n';
    const done=Object.keys(s.checks).filter(k=>s.checks[k]);
    if(done.length)text+='\n## Assessment preparation checklist\n\n'+done.map(k=>'- [x] '+(labels.checks?.[k]||k)).join('\n')+'\n';
    return text;
  }
  const api={normalize,pack,unpack,merge,markdown};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CourseWorkbook=api;
})(typeof window!=='undefined'?window:globalThis);
