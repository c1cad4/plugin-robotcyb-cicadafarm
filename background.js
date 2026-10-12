import {TOKENS,SOL,USDT,bestPair,quote,appendHistory,fetchPairs,fetchPump,pumpEstimate,fetchGecko,geckoQuote} from './market.js';
let running;
async function update(){
 const {snapshot={entries:{},history:{}}}=await chrome.storage.local.get('snapshot');
 if(Date.now()-(snapshot.attempted??0)<30000)return snapshot;
 const attempted=Date.now();const results=await Promise.allSettled([fetchGecko(),fetchPairs(TOKENS[1].mint),fetchPairs(SOL),fetchPairs(USDT)]);
 const sol=results[2].status==='fulfilled'?bestPair(results[2].value,SOL):null;
 const usdt=results[3].status==='fulfilled'?bestPair(results[3].value,USDT):null;
 const entries={},history={...snapshot.history};
 for(let i=0;i<TOKENS.length;i++){
  const token=TOKENS[i],r=results[i];
  try{
   let entry;
   if(i===0){
    try{if(r.status!=='fulfilled')throw new Error('gecko-unavailable');entry=geckoQuote(token,r.value,usdt);}
    catch{entry=quote(token,await fetchPairs(token.mint),sol,usdt);}
   }else{if(r.status!=='fulfilled')throw new Error('source-unavailable');entry=quote(token,r.value,sol,usdt);}
   if(entry.error==='no-market'){
    try{entry=pumpEstimate(token,await fetchPump(token.mint),sol,usdt);}catch{entry.error='no-market';}
   }
   entries[token.id]=entry;history[token.id]=appendHistory(history[token.id],entry);
  }catch{entries[token.id]={...snapshot.entries?.[token.id],id:token.id,error:'network-error',failedAt:Date.now()};}
 }
 const next={attempted,entries,history};await chrome.storage.local.set({snapshot:next});
 const problem=TOKENS.some(t=>entries[t.id]?.error||Date.now()-(entries[t.id]?.time??0)>120000);
 await chrome.action.setBadgeText({text:problem?'!':'CYB'});await chrome.action.setBadgeBackgroundColor({color:problem?'#936515':'#116a4a'});return next;
}
function refresh(){if(!running)running=update().finally(()=>{running=null});return running;}
async function schedule(){await chrome.alarms.create('market-refresh',{periodInMinutes:1});}
chrome.runtime.onInstalled.addListener(()=>{schedule();refresh().catch(()=>{});});
chrome.runtime.onStartup.addListener(()=>{schedule();refresh().catch(()=>{});});
chrome.alarms.onAlarm.addListener(a=>{if(a.name==='market-refresh')refresh().catch(()=>{});});
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 if(s.id!==chrome.runtime.id||m?.type!=='refresh')return false;
 refresh().then(snapshot=>reply({snapshot}),()=>reply({error:'network-error'}));return true;
});
