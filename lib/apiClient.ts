import { appConfig } from './config'
import { ApiResponse, DataSourceError } from '@/types/api'

type TokenProvider=()=>string|null|Promise<string|null>
type UnauthorizedHandler=()=>void|Promise<void>
let tokenProvider:TokenProvider=()=>null
let unauthorizedHandler:UnauthorizedHandler=()=>undefined
export const configureApiClient=(options:{getAccessToken?:TokenProvider;onUnauthorized?:UnauthorizedHandler})=>{if(options.getAccessToken)tokenProvider=options.getAccessToken;if(options.onUnauthorized)unauthorizedHandler=options.onUnauthorized}
export function requireEndpoint(endpoint:string|undefined,resource:string){if(!endpoint)throw new DataSourceError(`Falta configurar el endpoint real para ${resource}.`);return endpoint}
export interface ApiRequestOptions extends RequestInit{timeoutMs?:number;retries?:number;retryDelayMs?:number}

export async function apiRequest<T>(endpoint:string,options:ApiRequestOptions={}):Promise<ApiResponse<T>>{
 if(!appConfig.apiUrl)throw new DataSourceError('NEXT_PUBLIC_API_URL no está configurada.')
 const{timeoutMs=appConfig.apiTimeoutMs,retries=appConfig.apiRetries,retryDelayMs=400,...init}=options
 for(let attempt=0;attempt<=retries;attempt++){
  const timeoutController=new AbortController(),timeout=setTimeout(()=>timeoutController.abort('timeout'),timeoutMs),signal=combineSignals(init.signal,timeoutController.signal)
  try{
   const token=await tokenProvider(),response=await fetch(`${appConfig.apiUrl}${endpoint}`,{...init,signal,headers:{Accept:'application/json','Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...init.headers}})
   if(response.status===401){await unauthorizedHandler();throw new DataSourceError('Tu sesión venció. Volvé a iniciar sesión.',401)}
   if(!response.ok){const payload=await safeJson(response);const message=typeof payload==='object'&&payload&&'message'in payload?String(payload.message):`La API respondió con estado ${response.status}.`;throw new DataSourceError(message,response.status,payload)}
   return normalizeResponse<T>(await safeJson(response))
  }catch(error){const normalized=normalizeError(error);if(attempt<retries&&isRetryable(normalized)){await delay(retryDelayMs*2**attempt);continue}throw normalized}finally{clearTimeout(timeout)}
 }
 throw new DataSourceError('No se pudo completar la solicitud.')
}
function normalizeResponse<T>(payload:unknown):ApiResponse<T>{if(payload&&typeof payload==='object'&&'data'in payload){const response=payload as ApiResponse<T>;return{data:response.data,meta:response.meta??{requestId:'api-unknown',timestamp:new Date().toISOString()}}}return{data:payload as T,meta:{requestId:'api-raw',timestamp:new Date().toISOString()}}}
async function safeJson(response:Response){const text=await response.text();if(!text)return null;try{return JSON.parse(text) as unknown}catch{return{text}}}
function normalizeError(error:unknown){if(error instanceof DataSourceError)return error;if(error instanceof DOMException&&error.name==='AbortError')return new DataSourceError('La solicitud tardó demasiado o fue cancelada.',408,error);return new DataSourceError('No se pudo conectar con el backoffice.',undefined,error)}
function isRetryable(error:DataSourceError){return error.status===408||error.status===429||error.status===undefined||(error.status>=500)}
function delay(ms:number){return new Promise(resolve=>setTimeout(resolve,ms))}
function combineSignals(first:AbortSignal|null|undefined,second:AbortSignal){if(!first)return second;const controller=new AbortController(),abort=()=>controller.abort();first.addEventListener('abort',abort,{once:true});second.addEventListener('abort',abort,{once:true});return controller.signal}
