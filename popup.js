import {TOKENS} from './market.js';
const dictionary={ru:{refresh:'Обновить',wait:'Обновление…',done:'Готово',network:'Источник недоступен. Показана последняя цена.',missing:'Нет доступной котировки для этого mint.',convert:'Нет данных для пересчёта USDT или SOL.',history:'История наблюдений расширения · USD',empty:'История появится после двух обновлений',stale:'Устаревшие данные',time:'Получено',note:'USDT — пересчёт по USD; SOL — цена пула или пересчёт. Это не заявка на обмен. Источники: GeckoTerminal, DEX Screener; резерв — Pump.fun. Обновление примерно раз в минуту; браузер может задерживать фоновые обновления.'},en:{refresh:'Refresh',wait:'Updating…',done:'Ready',network:'Source unavailable. Showing the last quote.',missing:'No quote available for this mint.',convert:'USDT or SOL conversion unavailable.',history:'Extension observations · USD',empty:'History appears after two updates',stale:'Stale data',time:'Fetched',note:'USDT is a USD cross-rate; SOL is a pool price or cross-rate. These are not executable trade quotes. Sources: GeckoTerminal, DEX Screener; fallback: Pump.fun. Updates about every minute; browser background scheduling may delay them.'}};
let language=navigator.language.startsWith('ru')?'ru':'en',snapshot={};
const text=(v)=>Number.isFinite(v)?new Intl.NumberFormat(language,{maximumSignificantDigits:6}).format(v):'—';
function chart(canvas,points){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);if(points.length<2)return;
 const min=Math.min(...points.map(p=>p.usd)),max=Math.max(...points.map(p=>p.usd)),span=max-min||max*.01||1;
 c.strokeStyle='#7cffbb';c.lineWidth=2;c.beginPath();points.forEach((p,i)=>{const x=4+i/(points.length-1)*(canvas.width-8),y=canvas.height-7-(p.usd-min)/span*(canvas.height-14);if(i)c.lineTo(x,y);else c.moveTo(x,y)});c.stroke();}
function render(){const t=dictionary[language];document.documentElement.lang=language;document.querySelector('#language').value=language;document.querySelector('#refresh').textContent=t.refresh;document.querySelector('#expand').textContent=language==='ru'?'Развернуть ↗':'Expand ↗';document.querySelector('#note').textContent=t.note;
 const cards=document.querySelector('#cards');cards.replaceChildren();for(const token of TOKENS){const fragment=document.querySelector('#card').content.cloneNode(true),entry=snapshot.entries?.[token.id]??{};
 fragment.querySelector('h2').textContent=token.name;fragment.querySelector('.token-icon').src=token.icon;fragment.querySelector('.token-icon').alt=token.name+' logo';fragment.querySelector('.usdt').textContent=text(entry.usdt);fragment.querySelector('.sol').textContent=text(entry.sol);
 const change=fragment.querySelector('.change');if(Number.isFinite(entry.change)){change.textContent=`${entry.change>0?'+':''}${text(entry.change)}% / 24h`;change.classList.add(entry.change>=0?'positive':'negative');}
 const stale=entry.time&&Date.now()-entry.time>120000;fragment.querySelector('.message').textContent=entry.error==='no-market'?t.missing:entry.error==='network-error'?t.network:entry.error==='conversion-unavailable'?t.convert:stale?t.stale:'';
 if(entry.source==='pump-estimate'){
  const estimate=language==='ru'?'Оценка Pump.fun по капитализации':'Pump.fun market-cap estimate';
  fragment.querySelector('.message').textContent=`${estimate}${stale?' · '+t.stale:''}${entry.error==='conversion-unavailable'?' · '+t.convert:''}`;
 }
 fragment.querySelector('.time').textContent=entry.time?`${t.time}: ${new Date(entry.time).toLocaleString(language)}`:'';
 const points=(snapshot.history?.[token.id]??[]).filter(p=>Number.isFinite(p.usd)&&p.usd>0).slice(-120);chart(fragment.querySelector('canvas'),points);fragment.querySelector('.history').textContent=points.length>=2?t.history:t.empty;
 fragment.querySelector('.mint').href=`https://solscan.io/token/${token.mint}`;fragment.querySelector('code').textContent=token.mint;
 const market=fragment.querySelector('.market');if(entry.source==='pump-estimate'){market.textContent='Pump.fun ↗';market.href=`https://pump.fun/coin/${token.mint}`;}else if(entry.source==='geckoterminal'){market.textContent='GeckoTerminal ↗';market.href=`https://www.geckoterminal.com/solana/pools/${entry.pair}`;}else market.href=entry.pair?`https://dexscreener.com/solana/${entry.pair}`:`https://dexscreener.com/solana/${token.mint}`;
 cards.append(fragment);
 }}
async function refresh(){const button=document.querySelector('#refresh');button.disabled=true;document.querySelector('#status').textContent=dictionary[language].wait;
 try{const result=await chrome.runtime.sendMessage({type:'refresh'});if(result?.snapshot){snapshot=result.snapshot;document.querySelector('#status').textContent=dictionary[language].done;}else{document.querySelector('#status').textContent=dictionary[language].network;}}catch{document.querySelector('#status').textContent=dictionary[language].network;}finally{render();button.disabled=false;}}
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.snapshot){snapshot=changes.snapshot.newValue??{};render();}});
document.querySelector('#refresh').addEventListener('click',refresh);
document.querySelector('#language').addEventListener('change',async e=>{language=e.target.value==='ru'?'ru':'en';await chrome.storage.local.set({language});render();});
const saved=await chrome.storage.local.get(['language','snapshot']);if(dictionary[saved.language])language=saved.language;snapshot=saved.snapshot??{};render();refresh();setInterval(render,30000);
