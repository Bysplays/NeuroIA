import {billingRequest} from './accessService';
import type {PracticeScheduleRevision} from './practiceSchedule';
export const practiceScheduleService={
  status(signal:AbortSignal){return billingRequest<{enabled:boolean;serverNow:number;current:PracticeScheduleRevision|null}>('/practice/schedule/status',undefined,signal);},
  update(input:{operationId:string;baseRevision:number;timeZone:string;daysMask:number;dailyExercises:number},signal:AbortSignal){return billingRequest<{revision:number;replayed:boolean}>('/practice/schedule',input,signal);},
};
