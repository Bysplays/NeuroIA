export async function mockProfessional(page) {
  await page.route('**/src/services/accessService.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `export const billingEnabled=true;export const accessService={};export const accessError=()=>'';export async function billingRequest(path){if(path==='/professional/status')return {serverNow:Date.now(),validForMs:60000};throw Error('No test purchases');}` }));
  await page.route('**/src/services/firestoreProfessional.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `export function firestoreProfessional(){return {subscribeSeats(next){next([{id:'fixture-seat',status:'active',expiresAt:Date.now()+86400000,createdAt:1,occupantUid:'fixture-player',patientName:'Ana',invitationCode:'NIA-TEST-AA'},{id:'unused',status:'active',expiresAt:Date.now()+86400000,createdAt:2,occupantUid:null,patientName:null,invitationCode:'NIA-TEST-BB'}]);return()=>{}},subscribeActivity(uid,next){next({name:'Ana',history:[]});return()=>{}}}}` }));
  await page.route('**/src/services/firestoreSessions.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
    const sessions=[{id:'proposal',professionalId:'fixture-owner',seatId:'fixture-seat',patientId:'fixture-player',professionalName:'Profesional de prueba',title:'Mi propuesta de coordinación',note:'Una propuesta preparada para ti.',steps:Array.from({length:6},()=>({exerciseId:'motor-target',level:1})),configVersion:1,status:'assigned',completedCount:0,resultIds:[],createdAt:Date.now(),updatedAt:Date.now()}];
    const results=[]; const listeners=new Set(); const emit=()=>listeners.forEach(fn=>fn());
    const watch=fn=>{listeners.add(fn);queueMicrotask(fn);return()=>listeners.delete(fn)};
    window.addEventListener('fixture-assigned-result',e=>{results.push(e.detail);emit()});
    export function firestoreSessions(){return {
      watch(next){return watch(()=>next(structuredClone(sessions)))},watchOne(id,next){return watch(()=>next(structuredClone(sessions.find(s=>s.id===id))))},watchResults(id,next){return watch(()=>next(structuredClone(results.filter(r=>r.assignmentId===id))))},
      async load(id){return structuredClone(sessions.find(s=>s.id===id))},async loadResults(s){return structuredClone(results.filter(r=>r.assignmentId===s.id))},
      async start(id){sessions.find(s=>s.id===id).status='in-progress';emit()},
      async advance(id){const s=sessions.find(s=>s.id===id);if(results.some(r=>r.id==='assigned-'+id+'-'+s.completedCount)){s.resultIds.push('assigned-'+id+'-'+s.completedCount);s.completedCount++;s.status=s.completedCount===s.steps.length?'completed':'in-progress';s.updatedAt=Date.now();emit()}return structuredClone(s)},
      async publish(id,draft){sessions.unshift({...sessions[0],...draft,id,completedCount:0,resultIds:[],status:'assigned'});emit()},async edit(s,draft){Object.assign(sessions.find(x=>x.id===s.id),draft);emit()},async cancel(id){sessions.find(s=>s.id===id).status='cancelled';emit()}
    }}
  ` }));
}
