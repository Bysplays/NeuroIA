import {validScheduleChoices,validScheduleRevision,scheduleDay,nextScheduleDay} from '../../src/services/practiceSchedule.ts';
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
export async function practiceScheduleStatus(uid,env,db,now=Date.now()) {
  const current=await db.runTransaction(tx=>tx.get(`users/${uid}/practiceSchedule/current`));
  if(current&&!validScheduleRevision(current))fail(503,'No hemos podido comprobar el calendario.');
  return {enabled:env.PROPOSAL_SCHEDULE_ENABLED==='true',serverNow:now,current};
}
export async function updatePracticeSchedule(uid,input,env,db,confirmedAccess,now=Date.now()) {
  if(env.PROPOSAL_SCHEDULE_ENABLED!=='true')fail(503,'El calendario de práctica no está activado.');
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==5
    ||!['operationId','baseRevision','timeZone','daysMask','dailyExercises'].every(key=>Object.hasOwn(input,key))
    ||typeof input.operationId!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(input.operationId)
    ||!Number.isSafeInteger(input.baseRevision)||input.baseRevision<0||!validScheduleChoices(input))fail(400,'Revisa los días y los ejercicios del calendario.');
  if(!(await confirmedAccess(uid,db)).active)fail(403,'Necesitas acceso activo para cambiar el calendario.');
  return db.runTransaction(async tx=>{
    const receipt=await tx.get(`users/${uid}/scheduleOperations/${input.operationId}`);
    const current=await tx.get(`users/${uid}/practiceSchedule/current`);
    if(receipt){
      if(receipt.baseRevision!==input.baseRevision||receipt.timeZone!==input.timeZone||receipt.daysMask!==input.daysMask||receipt.dailyExercises!==input.dailyExercises)fail(409,'Ese cambio ya se usó con otros datos.');
      return {revision:receipt.revision,replayed:true};
    }
    if(current&&!validScheduleRevision(current))fail(503,'No hemos podido comprobar el calendario.');
    if((current?.revision??0)!==input.baseRevision)fail(409,'El calendario ha cambiado. Actualízalo antes de guardar.');
    if(current&&current.timeZone!==input.timeZone)fail(409,'La zona horaria del calendario debe mantenerse para conservar las fechas.');
    if(current&&now<current.createdAt)fail(503,'Vuelve a intentarlo en unos instantes.');
    const revision={version:1,revision:input.baseRevision+1,timeZone:input.timeZone,effectiveFrom:nextScheduleDay(scheduleDay(now,input.timeZone)),createdAt:now,daysMask:input.daysMask,dailyExercises:input.dailyExercises};
    const path=`users/${uid}/scheduleRevisions/${String(revision.revision).padStart(10,'0')}`;
    if(await tx.get(path))fail(409,'No hemos podido confirmar la versión del calendario.');
    tx.set(path,revision,false);tx.set(`users/${uid}/practiceSchedule/current`,revision,false);
    tx.set(`users/${uid}/scheduleOperations/${input.operationId}`,{baseRevision:input.baseRevision,revision:revision.revision,timeZone:input.timeZone,daysMask:input.daysMask,dailyExercises:input.dailyExercises},false);
    return {revision:revision.revision,replayed:false};
  });
}
