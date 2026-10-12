export const TOKENS = Object.freeze([
 {id:'robotcyb',name:'RobotCYB',mint:'8WZiguAp8NyFnwm8Z97k6sCbSRCWaW1YYXKeCTpupump'},
 {id:'cicadafarm',name:'CicadaFarm',mint:'9QLCEL7Xo9VTwgBeAYU1PWX7JJ8joKxQCYw3msjUpump'}
]);
export const SOL='So11111111111111111111111111111111111111112';
export const USDT='Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const USDC='EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const address = s => typeof s==='string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
const number = v => (typeof v==='number'||typeof v==='string'&&v.trim()!=='')&&Number.isFinite(Number(v))?Number(v):null;
export function bestPair(pairs,mint){
 if(!Array.isArray(pairs)) throw new Error('invalid-response');
 return pairs.filter(p=>p?.chainId==='solana' && p.baseToken?.address===mint && [SOL,USDT,USDC].includes(p.quoteToken?.address) && address(p.pairAddress) && number(p.priceUsd)>0 && number(p.liquidity?.usd)>0).sort((a,b)=>Number(b.liquidity.usd)-Number(a.liquidity.usd))[0]??null;
}
export function quote(token,pairs,solPair,usdtPair,time=Date.now()){
 const p=bestPair(pairs,token.mint);if(!p)return {id:token.id,time,error:'no-market'};
 const usd=Number(p.priceUsd),solUsd=number(solPair?.priceUsd),usdtUsd=number(usdtPair?.priceUsd);
 const sol=p.quoteToken.address===SOL&&number(p.priceNative)>0?Number(p.priceNative):solUsd>0?usd/solUsd:null;
 return {id:token.id,time,usd,sol,usdt:usdtUsd>0?usd/usdtUsd:null,
  change:number(p.priceChange?.h24),liquidity:Number(p.liquidity.usd),pair:p.pairAddress,dex:String(p.dexId??''),error:sol>0&&usdtUsd>0?null:'conversion-unavailable'};
}
export function appendHistory(history,entry){
 if(history?.at(-1)?.time===entry.time&&history.at(-1).usd===entry.usd)return history;
 if(!(entry.usd>0))return history??[];
 return [...(history??[]),{time:entry.time,usd:entry.usd}].filter(p=>p.time>=entry.time-24*60*60*1000).slice(-120);
}
export async function fetchJson(url,fetcher=fetch){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{
  const r=await fetcher(url,{signal:controller.signal,cache:'no-store',credentials:'omit',redirect:'error'});
  if(!r.ok)throw new Error(`http-${r.status}`);
  if(!r.body)throw new Error('invalid-response');
  const reader=r.body.getReader(),parts=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2*1024*1024){await reader.cancel();throw new Error('response-too-large');}parts.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
 }finally{clearTimeout(timer);}
}

export async function fetchPairs(mint,fetcher=fetch){
 if(!address(mint))throw new Error('invalid-mint');
 const data=await fetchJson(`https://api.dexscreener.com/token-pairs/v1/solana/${mint}`,fetcher);
 if(!Array.isArray(data))throw new Error('invalid-response');return data;
}
export async function fetchPump(mint,fetcher=fetch){
 if(!address(mint))throw new Error('invalid-mint');
 return fetchJson(`https://frontend-api-v3.pump.fun/coins-v2/${mint}`,fetcher);
}
export function pumpEstimate(token,data,solPair,usdtPair,now=Date.now()){
 const decimals=number(data?.base_decimals),rawSupply=number(data?.total_supply_str??data?.total_supply),cap=number(data?.usd_market_cap);
 if(data?.mint!==token.mint||!Number.isInteger(decimals)||decimals<0||decimals>12||!Number.isSafeInteger(rawSupply)||rawSupply<=0||!(cap>0))throw new Error('invalid-pump-data');
 const supply=rawSupply/10**decimals,usd=cap/supply;
 const timestamp=number(data.last_trade_timestamp)??number(data.updated_at)*1000;
 if(!(usd>0)||!Number.isFinite(usd)||!(timestamp>0)||timestamp>now+60000)throw new Error('invalid-pump-data');
 const solUsd=number(solPair?.priceUsd),usdtUsd=number(usdtPair?.priceUsd);
 return {id:token.id,time:timestamp,fetchedAt:now,usd,sol:solUsd>0?usd/solUsd:null,usdt:usdtUsd>0?usd/usdtUsd:null,source:'pump-estimate',change:null,error:solUsd>0&&usdtUsd>0?null:'conversion-unavailable'};
}
export const ROBOT_POOL='6pQd4VkSN35X4MGNPHjPbA6KgF8zxGj9K7cUkfNCjKHP';
export async function fetchGecko(fetcher=fetch){return fetchJson(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${ROBOT_POOL}?include=base_token,quote_token`,fetcher);}
export function geckoQuote(token,data,usdtPair,time=Date.now()){
 const p=data?.data,a=p?.attributes,r=p?.relationships;
 if(token.id!=='robotcyb'||a?.address!==ROBOT_POOL||r?.base_token?.data?.id!==`solana_${token.mint}`||r?.quote_token?.data?.id!==`solana_${SOL}`||!(number(a.base_token_price_usd)>0)||!(number(a.base_token_price_quote_token)>0)||!(number(a.reserve_in_usd)>0))throw new Error('invalid-gecko-pool');
 const usd=Number(a.base_token_price_usd),rate=number(usdtPair?.priceUsd);
 return {id:token.id,time,usd,sol:Number(a.base_token_price_quote_token),usdt:rate>0?usd/rate:null,source:'geckoterminal',pair:ROBOT_POOL,change:number(a.price_change_percentage?.h24),liquidity:Number(a.reserve_in_usd),error:rate>0?null:'conversion-unavailable'};
}
