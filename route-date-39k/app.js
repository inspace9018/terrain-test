(() => {
'use strict';
const c=window.TERRAIN_SURVEY,p=new URLSearchParams(location.search),namespace=c.testId;
const isInternal=p.get('internal')==='1'||['localhost','127.0.0.1',''].includes(location.hostname);
const channel=(p.get('channel')||p.get('utm_source')||'direct').toLowerCase().slice(0,100);
const isOwned=p.get('owned')==='1'||channel==='owned'||channel==='instagram_owned';
const flags=[...(isInternal?['internal']:[]),...(isOwned?['owned']:[]),...(/bot|spider|crawler|headless/i.test(navigator.userAgent)?['bot_suspect']:[])];
const now=()=>new Date().toISOString(),inPeriod=()=>Date.now()>=Date.parse(c.startAt)&&Date.now()<Date.parse(c.endAt);
let uid;try{const saved=JSON.parse(localStorage.getItem(namespace)||'null');uid=saved&&saved.expires>Date.now()&&typeof saved.id==='string'?saved.id:null;if(!uid){uid=crypto.randomUUID();localStorage.setItem(namespace,JSON.stringify({id:uid,expires:Date.parse(c.endAt)}));}}catch{uid=crypto.randomUUID();}
const ids={event:'entry.1552777282',variant:'entry.261377218',price:'entry.1068740664',channel:'entry.1632524148',vid:'entry.1929676720',flags:'entry.818086726',t:'entry.117099233'};
function record(event,extra={}){return {[ids.event]:event,[ids.variant]:namespace,[ids.price]:String(c.price),[ids.channel]:channel,[ids.vid]:uid,[ids.flags]:JSON.stringify({flags,sku:c.sku,...extra}),[ids.t]:now()};}
function hidden(form,name,value){let input=form.querySelector('input[type=hidden][name="'+name+'"]');if(!input){input=document.createElement('input');input.type='hidden';input.name=name;form.appendChild(input);}input.value=String(value);}
function fill(form,data){for(const [key,value]of Object.entries(data))hidden(form,key,value);hidden(form,'fvv','1');hidden(form,'pageHistory','0');}
function event(eventName,extra={}){if(!inPeriod())return;fetch(c.eventAction,{method:'POST',mode:'no-cors',body:new URLSearchParams(record(eventName,extra)),keepalive:true}).catch(()=>{});/* Only delivered Google Forms rows count. Resolved no-cors requests do not prove receipt. */}
function markOnce(key,fn){try{const k=namespace+':'+key;if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1');}catch{}fn();}
function refreshPeriod(){if(inPeriod())return;const notice=document.getElementById('period-status');notice.hidden=false;notice.textContent='현재 응답을 받는 기간이 아닙니다.';document.querySelectorAll('button[type=submit]').forEach(b=>b.disabled=true);}
refreshPeriod();setInterval(refreshPeriod,30000);
markOnce('page_view',()=>event('page_view'));
const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.5)){markOnce('price_view',()=>event('price_view'));observer.disconnect();}},{threshold:[.5]});observer.observe(document.getElementById('price'));
const survey=document.getElementById('survey-form'),signup=document.getElementById('signup-form');survey.action=c.eventAction;signup.action=c.signupAction;
const selected=()=>survey.querySelector('input[name="intent-choice"]:checked')?.value||'';
survey.addEventListener('submit',e=>{if(!inPeriod()||!survey.reportValidity()){e.preventDefault();return;}if(document.getElementById('website').value){e.preventDefault();return;}const payload={intent:selected(),reason:document.getElementById('reason').value.trim(),past:document.getElementById('past').value,pastDetail:document.getElementById('past-detail').value.trim(),use:document.getElementById('use').value.trim(),future:document.getElementById('future').value.trim(),privacyConsent:true};fill(survey,record('survey_response',payload));document.getElementById('survey-message').textContent='새 탭에서 구글 폼의 접수 결과를 확인해주세요.';});
signup.addEventListener('submit',e=>{if(!inPeriod()||!signup.reportValidity()){e.preventDefault();return;}fill(signup,{'entry.1810554774':'','entry.897202580':'관악산','entry.814175522':namespace,'entry.2109856230':String(c.price),'entry.1771884264':selected(),'entry.906824033':flags.length?channel+'|'+flags.join(','):channel,'entry.675332606':uid,'entry.1392542546':'privacyConsent=true;launchNotificationConsent=true;'+now()});document.getElementById('signup-message').textContent='새 탭에서 구글 폼의 접수 결과를 확인해주세요.';});
window.TERRAIN_DIAGNOSTICS=()=>({testId:namespace,price:c.price,channel,flags:[...flags],uid,withinPeriod:inPeriod(),deliveryStatus:'not_verified_by_browser'});
})();
