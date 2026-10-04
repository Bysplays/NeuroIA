// Server-owned operational evidence, separate from report content and human review.
// Disabled until explicitly enabled. No names, target IDs, prompts or drafts are saved.
export async function withReportEvidence(actor, mode, env, db, signal, generate, clientAttemptId) {
  const context={stage:'source'};
  if(env.PROPOSAL_REPORT_EVIDENCE!=='true' || mode!=='report')return generate(context);
  const id=crypto.randomUUID();
  const path=`users/${actor}/reportAttempts/${id}`;
  const startedAt=Date.now(),monotonic=performance.now();
  const start={version:1,status:'started',startedAt,model:env.OPENROUTER_MODEL.trim().slice(0,200),...(clientAttemptId?{clientAttemptId}:{})};
  try{
    await db.runTransaction(async tx=>{
      if(await tx.get(`accountDeletions/${actor}`))throw Object.assign(Error('La cuenta se está eliminando.'),{status:409});
      if(await tx.get(path))throw Error('report-attempt-collision');
      tx.set(path,start,false);
    });
  }catch(error){
    if(error.status===409)throw error;
    throw Object.assign(Error('No hemos podido registrar el intento de informe. Vuelve a intentarlo.'),{status:503});
  }
  let result,failure;
  try {result=await generate(context);}catch(error){failure=error;}
  const status=signal?.aborted?'cancelled':failure?'failed':'generated';
  const terminal={...start,status,finishedAt:Date.now(),durationMs:Math.max(0,Math.round(performance.now()-monotonic)),stage:context.stage,
    httpStatus:failure && Number.isInteger(failure.status)?failure.status:failure?503:200,
    ...(result?{promptVersion:result.provenance.promptVersion,snapshotHash:result.provenance.snapshotHash}:{}),
  };
  try{
    await db.runTransaction(async tx=>{
      // Never recreate an account subtree while recursive deletion is in progress.
      if(await tx.get(`accountDeletions/${actor}`))throw Object.assign(Error('La cuenta se está eliminando.'),{status:409});
      const current=await tx.get(path);
      if(!current || current.status!=='started')throw Error('report-attempt-state');
      tx.set(path,terminal,false);
    });
  }catch(error){
    if(error.status===409)throw error;
    // A started record remains explicitly unknown if final persistence fails.
    throw Object.assign(Error('No hemos podido confirmar el registro del informe. Vuelve a intentarlo.'),{status:503});
  }
  if(failure)throw failure;
  signal?.throwIfAborted();
  return result;
}

/** Own operational records only: no target selector, drafts or participant identity.
 * Each page rechecks the account deletion lock; callers must consume all pages.
 */
export async function readReportEvidence(actor,input,db,signal) {
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(actor) || !input || typeof input!=='object' || Array.isArray(input)
    || Object.keys(input).some(key=>key!=='cursor') || (input.cursor!==undefined && (typeof input.cursor!=='string' || !input.cursor.length || input.cursor.length>2048))) {
    throw Object.assign(Error('Solicitud no válida.'),{status:400});
  }
  const check=async()=>{
    signal?.throwIfAborted();
    if(await db.runTransaction(tx=>tx.get(`accountDeletions/${actor}`),4,true))throw Object.assign(Error('La cuenta se está eliminando.'),{status:409});
  };
  await check();
  const page=await db.list(`users/${actor}/reportAttempts`,input.cursor);
  await check();
  const records=(page.documents||[]).map(row=>{
    const attemptId=typeof row.path==='string' && row.path.startsWith(`users/${actor}/reportAttempts/`)?row.path.split('/').at(-1):'';
    const valid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(attemptId) && row.version===1 && ['started','generated','failed','cancelled'].includes(row.status)
      && Number.isFinite(row.startedAt) && typeof row.model==='string' && row.model.length<=200;
    const terminal=row.status!=='started';
    const validClientId=row.clientAttemptId===undefined || typeof row.clientAttemptId==='string' && /^[a-zA-Z0-9_-]{1,128}$/.test(row.clientAttemptId);
    if(!valid || !validClientId || terminal && (!Number.isFinite(row.finishedAt) || !Number.isSafeInteger(row.durationMs) || row.durationMs<0
      || !Number.isInteger(row.httpStatus) || !['source','quota','provider','validation','authorization','complete'].includes(row.stage)))return {invalid:true};
    return {version:1,attemptId,...(row.clientAttemptId?{clientAttemptId:row.clientAttemptId}:{}),status:row.status,startedAt:row.startedAt,model:row.model,
      ...(terminal?{finishedAt:row.finishedAt,durationMs:row.durationMs,httpStatus:row.httpStatus,stage:row.stage}:{}),
      ...(typeof row.promptVersion==='string' && row.promptVersion.length<=100?{promptVersion:row.promptVersion}:{}),
    };
  });
  return {version:1,records,nextCursor:page.nextPageToken||null,
    limitations:['Generado significa borrador validado en el servidor, no PDF descargado ni informe revisado.',
      'Un intento iniciado sin resultado final tiene desenlace desconocido.',
      'Solo incluye solicitudes de informe de esta cuenta con instrumentación activada; no solicitudes rechazadas antes de autorizarse.',
      'Completa todas las páginas. La lectura no es una instantánea atómica.']};
}
