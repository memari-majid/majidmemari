/* Versioned, local-only workbook. Imports never replace or truncate existing notes. */
(function(root){'use strict';
 const APP='building-ai-solutions-workbook';
 const LIMITS=Object.freeze({bytes:2000000,notes:200,noteCharacters:150000,checks:1000,keyCharacters:240});
 const reserved=new Set(['__proto__','prototype','constructor']);
 const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const safe=k=>typeof k==='string'&&k.length>0&&!reserved.has(k);
 const bytes=text=>new TextEncoder().encode(text).byteLength;
 // Normalize structure, never shorten a learner's valid string. Oversized old
 // state remains readable/exportable; assertSavable blocks destructive commits.
 function normalize(input){
  const s=record(input)?input:{},notes=Object.create(null),checks=Object.create(null),steps=Object.create(null);
  if(record(s.notes))for(const[k,v]of Object.entries(s.notes))if(safe(k)&&typeof v==='string')notes[k]=v;
  if(record(s.checks))for(const[k,v]of Object.entries(s.checks))if(safe(k)&&typeof v==='boolean')checks[k]=v;
  if(record(s.steps))for(const[k,v]of Object.entries(s.steps))if(/^([1-9]|1[0-2])$/.test(k)&&Number.isInteger(v)&&v>=0&&v<=3)steps[k]=v;
  return{completed:[...new Set(Array.isArray(s.completed)?s.completed.filter(n=>Number.isInteger(n)&&n>=1&&n<=12):[])].sort((a,b)=>a-b),notes,checks,steps,lastUnit:Number.isInteger(s.lastUnit)&&s.lastUnit>=1&&s.lastUnit<=12?s.lastUnit:1};
 }
 const envelope=state=>({format:APP,version:2,exportedAt:new Date().toISOString(),state});
 function assertSavable(state){
  const s=normalize(state),entries=Object.entries(s.notes),checks=Object.keys(s.checks);
  if(entries.length>LIMITS.notes)throw new Error('The workbook would contain more than 200 notes. Export readable notes and combine or remove some notes before restoring. Your saved work has not changed.');
  if(entries.some(([k,v])=>k.length>LIMITS.keyCharacters||v.length>LIMITS.noteCharacters))throw new Error('A note is longer than 150,000 characters, or its name is too long. Export readable notes and shorten it before saving a backup. Your saved work has not changed.');
  if(checks.length>LIMITS.checks||checks.some(k=>k.length>LIMITS.keyCharacters))throw new Error('The workbook contains too many preparation items or an invalid item name. Your saved work has not changed.');
  // Use the exact pretty-printed export envelope, including escaped text and
  // UTF-8 bytes. Every backup this function permits can pass unpack's file limit.
  if(bytes(JSON.stringify(envelope(s),null,2))>LIMITS.bytes)throw new Error('The workbook would exceed 2 MB. Export readable notes and shorten or combine them before saving or restoring a backup. Your saved work has not changed.');
  return s;
 }
 function legacy(input){
  const old=normalize(input),notes=Object.create(null);
  for(const[k,v]of Object.entries(old.notes))notes['Earlier edition: '+k]=v;
  return assertSavable({notes});
 }
 function pack(state){return envelope(assertSavable(state));}
 function unpack(text){
  if(typeof text!=='string'||bytes(text)>LIMITS.bytes)throw new Error('Choose a course workbook no larger than 2 MB. Your work has not changed.');
  let d;try{d=JSON.parse(text);}catch{throw new Error('Choose a valid JSON workbook backup.');}
  if(!record(d)||![APP,'cs4720r-business-ai-workbook'].includes(d.format)||![1,2].includes(d.version)||!record(d.state)||!Array.isArray(d.state.completed)||!record(d.state.notes)||!record(d.state.checks))throw new Error('This is not a supported complete course backup. Your work has not changed.');
  return d.version===1?legacy(d.state):assertSavable(d.state);
 }
 function updateNote(current,key,value){
  if(!safe(key)||typeof value!=='string')throw new Error('This note cannot be saved. Your saved work has not changed.');
  const s=normalize(current);s.notes[key]=value;return assertSavable(s);
 }
 function merge(current,incoming){
  // Both inputs are copied. All limits are checked before a result is returned,
  // so a rejected merge cannot change either the live state or the backup.
  const s=normalize(current),other=normalize(incoming);let added=0,conflicts=0;
  s.completed=[...new Set([...s.completed,...other.completed])].sort((a,b)=>a-b);
  for(const[k,v]of Object.entries(other.notes)){
   if(!v.trim())continue;
   if(!s.notes[k]?.trim()){s.notes[k]=v;added++;continue;}
   if(s.notes[k]===v)continue;
   for(let number=1;;number++){
    const suffix=' [imported '+number+']';
    if(k.length+suffix.length>LIMITS.keyCharacters)throw new Error('A conflicting note name is too long to label a separate copy. Shorten the note name before restoring. Your saved work has not changed.');
    const key=k+suffix;
    if(s.notes[key]===v)break; // Re-importing the same conflicting note is harmless.
    if(!Object.prototype.hasOwnProperty.call(s.notes,key)){s.notes[key]=v;conflicts++;break;}
   }
  }
  for(const[k,v]of Object.entries(other.checks))s.checks[k]=Boolean(s.checks[k]||v);
  for(const[k,v]of Object.entries(other.steps))s.steps[k]=Math.max(s.steps[k]??0,v);
  return{state:assertSavable(s),added,conflicts};
 }
 function markdown(state){
  const s=normalize(state);
  return '# Building AI Solutions — project record\n\nCourse by Majid Memari. Personal study notes, not submitted work or grades.\n\n## Study progress\n\n'+(s.completed.map(n=>'Unit '+n).join(', ')||'No units marked complete.')+'\n\n'+Object.entries(s.notes).filter(([,v])=>v.trim()).map(([k,v])=>'## '+k+'\n\n'+v+'\n').join('\n')+'\n## Preparation checklist\n\n'+Object.entries(s.checks).filter(([,v])=>v).map(([k])=>'- [x] '+k).join('\n');
 }
 const api={LIMITS,normalize,assertSavable,legacy,pack,unpack,updateNote,merge,markdown};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CourseWorkbook=api;
})(typeof window!=='undefined'?window:globalThis);
