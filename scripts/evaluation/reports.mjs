// Offline by default. --live explicitly calls the configured provider with synthetic
// activity only. --review never calls a provider and verifies exact artifact hashes.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {generateAnalysis} from '../../vendor/cloudflare/ai.mjs';
import {PROMPT_VERSION} from '../../vendor/openrouter/prompts.mjs';
import {localAiConfig} from '../../vendor/openrouter/local-config.mjs';
import {basicNarrative} from '../../src/services/activityInsights.ts';
import {REPORT_CASES,REPORT_CASE_VERSION} from './report-cases.mjs';
import {hash,reviewTemplate,summarizeReportEvaluation} from './report-evaluation.mjs';

const args=process.argv.slice(2);
async function save(path,value){await writeFile(path,JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});}
try {
  if(args[0]==='--review'){
    if(args.length!==4)throw Error('usage');
    const bundle=JSON.parse(await readFile(args[1],'utf8'));
    const reviews=JSON.parse(await readFile(args[2],'utf8'));
    if(bundle.caseVersion!==REPORT_CASE_VERSION || bundle.caseHash!==hash(REPORT_CASES)
      || bundle.records.length!==REPORT_CASES.length || !REPORT_CASES.every(c=>bundle.records.some(r=>r.caseId===c.id)))throw Error('case-version-mismatch');
    await save(resolve(args[3]),{source:bundle.source,...summarizeReportEvaluation(bundle.records,reviews)});
  }else{
    const live=args[0]==='--live';
    const rest=live?args.slice(1):args;
    if(rest.length!==2 || rest[0]!=='--output')throw Error('usage');
    const directory=resolve(rest[1]);
    // Refuse existing output directories: never overwrite evidence or silently rerun.
    await mkdir(directory,{mode:0o700});
    const env=live?{...await localAiConfig(),APP_URL:'http://localhost:5173'}:
      {AI_ENABLED:'true',OPENROUTER_API_KEY:'offline-fixture',OPENROUTER_MODEL:'offline-fixture',APP_URL:'http://localhost:5173'};
    const records=[];
    for(const scenario of REPORT_CASES){
      let providerCalls=0,providerReply;
      const fetcher=async(url,options)=>{
        providerCalls++;
        if(live){
          const response=await fetch(url,options);
          const reader=response.clone().body?.getReader();
          if(reader){
            let size=0,text='';const decoder=new TextDecoder();
            try{
              while(true){const chunk=await reader.read();if(chunk.done)break;
                size+=chunk.value.byteLength;if(size>65536){void reader.cancel();break;}
                text+=decoder.decode(chunk.value,{stream:true});}
              if(size<=65536){const value=JSON.parse(text+decoder.decode());
                const choice=value.choices?.[0];
                if(choice)providerReply={finishReason:choice.finish_reason??null,content:typeof choice.message?.content==='string'?choice.message.content.slice(0,16000):null};}
            }catch{/* Preserve the production parser's own outcome. */}finally{reader.releaseLock();}
          }
          return response;
        }
        const body=JSON.parse(options.body);
        const insights=JSON.parse(body.messages[1].content.split('\n')[1]);
        return Response.json({model:'offline-fixture',choices:[{finish_reason:'stop',message:{content:JSON.stringify(basicNarrative(insights))}}]});
      };
      const db={runTransaction:async callback=>callback({get:async()=>null,set(){}}),
        readActivity:async()=>({history:scenario.history,levels:scenario.levels,partial:scenario.partial})};
      const started=performance.now();let analysis,status;
      try{
        analysis=await generateAnalysis('synthetic',{targetUid:'synthetic',mode:'report',consent:'activity-summary-v1',filters:scenario.filters},env,db,
          async()=>({active:true,kind:'trial'}),AbortSignal.timeout(40000),fetcher);
        status=200;
      }catch(error){status=Number.isInteger(error.status)?error.status:0;}
      const record={caseId:scenario.id,criteria:scenario.criteria,...(scenario.expectedStatus?{expectedStatus:scenario.expectedStatus}:{}),
        status,providerCalls,...(providerReply?{providerReply}:{}),generationMs:performance.now()-started,...(analysis?{analysis}:{})};
      records.push(record);
      // Checkpoint each completed case before another network request.
      await save(join(directory,`${scenario.id}.json`),record);
      console.log(`${scenario.id}: ${status}, ${Math.round(record.generationMs)} ms`);
    }
    const source=live?'synthetic-live-provider':'synthetic-offline-fixture';
    const bundle={version:1,source,caseVersion:REPORT_CASE_VERSION,caseHash:hash(REPORT_CASES),promptVersion:PROMPT_VERSION,records};
    await save(join(directory,'records.json'),bundle);
    await save(join(directory,'reviews.json'),records.filter(r=>r.analysis).map(reviewTemplate));
    const summary=summarizeReportEvaluation(records);
    await save(join(directory,'summary.json'),{source,...summary});
    if(summary.outcomes.some(row=>!row.schemaValid&&!row.expectedRejection))process.exitCode=1;
    console.log('Revisión humana pendiente. Los tiempos no incluyen PDF ni preparación profesional.');
  }
}catch(error){
  console.error(error.message==='usage'?'Uso: reports.mjs [--live] --output CARPETA_NUEVA | --review records.json reviews.json salida.json':
    `Evaluación interrumpida (${['EEXIST','ENOENT'].includes(error.code)?error.code:'invalid-input-or-configuration'}). No se ha sobrescrito evidencia.`);
  process.exitCode=1;
}
