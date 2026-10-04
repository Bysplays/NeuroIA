import model from './adaptivePolicyModel.json' with {type:'json'};

export const ADAPTIVE_MODEL_ID=model.id;
export type AdaptationDecision={version:1;model:string;trainingData:'synthetic';fromLevel:number;nextLevel:number;action:-1|0|1;
  reason:'policy'|'insufficient-evidence'|'professional'|'non-normal'|'manual-level';application:'pending'|'applied'|'stale'|'blocked';observation:number[];logits:number[];inferenceMs:number};
export function policyLogits(observation:number[]) {
  if(observation.length!==model.featureNames.length || observation.some(n=>!Number.isFinite(n)||n< -1||n>1)) throw Error('invalid-policy-observation');
  let values=observation.map(Math.fround);
  for(const layer of model.layers) {
    values=layer.weights.map((row,i)=>{
      const value=Math.fround(row.reduce((sum,weight,j)=>sum+weight*values[j],layer.bias[i]));
      return layer.activation==='tanh' ? Math.fround(Math.tanh(value)) : value;
    });
  }
  return values;
}
export function decideAdaptation(input:{vector:number[];level:number;eligible:boolean},context:{locked:boolean;mode:string;baseLevel:number},now=()=>performance.now()):AdaptationDecision {
  if(!Number.isInteger(input.level)||input.level<1||input.level>10) throw Error('invalid-policy-level');
  const started=now();
  const logits=policyLogits(input.vector);
  const reason=context.locked ? 'professional' : context.mode!=='normal' ? 'non-normal' : context.baseLevel!==input.level ? 'manual-level' : !input.eligible ? 'insufficient-evidence' : 'policy';
  const action=(reason==='policy' ? logits.indexOf(Math.max(...logits))-1 : 0) as -1|0|1;
  return {version:1,model:model.id,trainingData:'synthetic',fromLevel:input.level,nextLevel:Math.max(1,Math.min(10,input.level+action)),action,
    reason,application:'pending',observation:[...input.vector],logits,inferenceMs:Math.max(0,now()-started)};
}
/** Model output is self-reported evidence, not a permission to modify another
 * account or an executable LLM instruction. Recompute inference before applying.
 */
export function readAdaptationDecision(encoded?:string):AdaptationDecision|null {
  if(typeof encoded!=='string'||encoded.length>12000) return null;
  try {
    const d:AdaptationDecision=JSON.parse(encoded);
    if(!d||Object.keys(d).sort().join()!==['version','model','trainingData','fromLevel','nextLevel','action','reason','application','observation','logits','inferenceMs'].sort().join()
      ||d.version!==1||d.model!==model.id||d.trainingData!=='synthetic'||!Number.isInteger(d.fromLevel)||d.fromLevel<1||d.fromLevel>10
      ||![-1,0,1].includes(d.action)||d.nextLevel!==Math.max(1,Math.min(10,d.fromLevel+d.action))
      ||!['policy','insufficient-evidence','professional','non-normal','manual-level'].includes(d.reason)
      ||!['pending','applied','stale','blocked'].includes(d.application)
      ||!Number.isFinite(d.inferenceMs)||d.inferenceMs<0||d.inferenceMs>60000
      ||!Array.isArray(d.observation)||!Array.isArray(d.logits)||d.logits.length!==3) return null;
    const logits=policyLogits(d.observation);
    if(d.logits.some((n,i)=>!Number.isFinite(n)||Math.abs(n-logits[i])>1e-4)
      ||Math.abs(d.observation[8]-(d.fromLevel-1)/9)>1e-6
      ||(d.reason==='policy' && (d.action!==logits.indexOf(Math.max(...logits))-1 || !(d.observation[13]===1||d.observation[15]===1)))
      ||(d.reason!=='policy' && d.action!==0)) return null;
    return d;
  } catch {return null;}
}
export function decisionMatchesExercise(decision:AdaptationDecision,exerciseId:string) {
  const index=model.games.indexOf(exerciseId);
  return index>=0 && decision.observation.slice(0,8).every((n,i)=>n===Number(i===index));
}
