import test from 'node:test';import assert from 'node:assert/strict';
import {TOKENS,SOL,USDT,bestPair,quote,appendHistory,fetchPairs,pumpEstimate} from '../market.js';
const mint=TOKENS[0].mint;
const pair=(usd,liquidity=100)=>({chainId:'solana',baseToken:{address:mint},quoteToken:{address:SOL},pairAddress:TOKENS[1].mint,priceUsd:String(usd),liquidity:{usd:liquidity},priceChange:{h24:-3}});
test('select exact mint and highest eligible liquidity; reject inverted and spoofed pools',()=>{
 assert.equal(bestPair([pair(2,100),pair(3,200),{...pair(99,900),baseToken:{address:'wrong'}},{...pair(99,900),chainId:'ethereum'},{...pair(99,900),quoteToken:{address:'unknown'}}],mint).priceUsd,'3');
 assert.equal(bestPair([{...pair(9),priceUsd:'NaN'},{...pair(9),pairAddress:'javascript:alert(1)'}],mint),null);
});
test('convert USD to real USDT price and SOL; no one-dollar assumption',()=>{
 const q=quote(TOKENS[0],[pair(2)],{priceUsd:'100'},{priceUsd:'0.98'},1);assert.equal(q.sol,.02);assert.equal(q.usdt,2/.98);
 assert.equal(quote(TOKENS[0],[],null,null).error,'no-market');assert.equal(quote(TOKENS[0],[pair(2)],null,null).sol,null);
});
test('bounded history ignores failed quotes and duplicate source timestamps',()=>{
 let h=[];for(let i=0;i<150;i++)h=appendHistory(h,{time:i+1,usd:2});assert.equal(h.length,120);assert.equal(appendHistory(h,{usd:null}),h);assert.equal(appendHistory(h,{time:150,usd:2}),h);
});
test('pump estimate uses explicit decimals, matched mint and source timestamp; no completed-curve price',()=>{
 const d={mint,base_decimals:6,total_supply_str:'1000000000',usd_market_cap:10,last_trade_timestamp:1000,complete:true,virtual_sol_reserves:999};
 const q=pumpEstimate(TOKENS[0],d,{priceUsd:100},{priceUsd:1},2000);assert.equal(q.usd,.01);assert.equal(q.source,'pump-estimate');assert.equal(q.time,1000);
 for(const bad of [{...d,mint:'other'},{...d,base_decimals:undefined},{...d,total_supply_str:'0'},{...d,last_trade_timestamp:999999}])assert.throws(()=>pumpEstimate(TOKENS[0],bad,null,null,2000));
});
test('fetch HTTP errors and oversized/invalid responses do not produce prices',async()=>{
 await assert.rejects(fetchPairs(mint,async()=>new Response('{}',{status:429})),/http-429/);
 await assert.rejects(fetchPairs(mint,async()=>new Response('{}')),/invalid-response/);
 await assert.rejects(fetchPairs(mint,async()=>new Response('x'.repeat(2*1024*1024+1))),/response-too-large/);
 await assert.rejects(fetchPairs('invalid'),/invalid-mint/);
});
import {geckoQuote,ROBOT_POOL} from '../market.js';
test('Gecko pool binds exact RobotCYB/SOL and takes direct SOL pool price',()=>{
 const data={data:{attributes:{address:ROBOT_POOL,base_token_price_usd:'2',base_token_price_quote_token:'.03',reserve_in_usd:'500'},relationships:{base_token:{data:{id:'solana_'+mint}},quote_token:{data:{id:'solana_'+SOL}}}}};
 const result=geckoQuote(TOKENS[0],data,{priceUsd:.98},1);assert.equal(result.sol,.03);assert.equal(result.usdt,2/.98);assert.equal(result.source,'geckoterminal');
 data.data.relationships.base_token.data.id='solana_wrong';assert.throws(()=>geckoQuote(TOKENS[0],data,{priceUsd:1}));
});
