import test from 'node:test';import assert from 'node:assert/strict';import {TOKENS,SOL,USDT,ROBOT_POOL} from '../market.js';
const listeners={},store={},alarm=[];let offline=false;
const event=name=>({addListener:fn=>{listeners[name]=fn}});
globalThis.chrome={runtime:{id:'test-extension',onInstalled:event('installed'),onStartup:event('startup'),onMessage:event('message')},alarms:{create:async(...args)=>alarm.push(args),onAlarm:event('alarm')},action:{setBadgeText:async()=>{},setBadgeBackgroundColor:async()=>{}},storage:{local:{get:async()=>({...store}),set:async value=>Object.assign(store,value)}}};
const pair=mint=>({chainId:'solana',baseToken:{address:mint},quoteToken:{address:SOL},pairAddress:ROBOT_POOL,liquidity:{usd:1000},priceUsd:mint===SOL?'100':mint===USDT?'.99':'.002'});
globalThis.fetch=async url=>{
 if(offline)throw new Error('offline');
 if(url.includes('geckoterminal'))return new Response(JSON.stringify({data:{attributes:{address:ROBOT_POOL,base_token_price_usd:'.003',base_token_price_quote_token:'.00003',reserve_in_usd:'500'},relationships:{base_token:{data:{id:'solana_'+TOKENS[0].mint}},quote_token:{data:{id:'solana_'+SOL}}}}}));
 return new Response(JSON.stringify([pair(url.split('/').at(-1))]));
};
await import('../background.js');
const refresh=()=>new Promise(resolve=>{assert.equal(listeners.message({type:'refresh'},{id:'test-extension'},resolve),true);});
test('worker refresh stores both tokens, converts USDT and handles cached offline data',async()=>{
 const first=await refresh();assert.equal(first.snapshot.entries.robotcyb.sol,.00003);assert.equal(first.snapshot.entries.cicadafarm.usdt,.002/.99);
 const timestamp=first.snapshot.entries.robotcyb.time;store.snapshot.attempted=0;offline=true;
 const second=await refresh();assert.equal(second.snapshot.entries.robotcyb.usd,.003);assert.equal(second.snapshot.entries.robotcyb.time,timestamp);assert.equal(second.snapshot.entries.robotcyb.error,'network-error');
 assert.equal(listeners.message({type:'refresh'},{id:'foreign'},()=>{}),false);
});
