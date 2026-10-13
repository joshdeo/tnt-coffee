(function(){
'use strict';
var T=window.TNT;
var $=function(s){return document.querySelector(s)};
var esc=T.esc,money=T.money;
var set=function(sel,fn){var el=$(sel);if(el)fn(el)};

/* ---------- copy buttons ---------- */
function copyText(text){
  try{return navigator.clipboard.writeText(text).then(function(){return true},function(){return false})}
  catch(e){return Promise.resolve(false)}
}
T.copyText=copyText;
document.querySelectorAll('[data-copy]').forEach(function(btn){
  btn.addEventListener('click',function(){
    copyText(btn.getAttribute('data-copy')).then(function(ok){
      btn.textContent=ok?'Copied':'Select the text above';
      setTimeout(function(){btn.textContent=btn.getAttribute('data-idle')},1800);
    });
  });
});

/* hand a suggested drink to the builder page */
document.addEventListener('click',function(e){
  var a=e.target.closest('[data-build]');if(!a)return;
  try{localStorage.setItem('tnt.build',a.getAttribute('data-build'))}catch(x){}
});

/* ---------- time, status, fuse ---------- */
var OPEN=8*60,CLOSE=23*60;
var DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function torontoNow(){
  try{
    var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',hourCycle:'h23',weekday:'short',hour:'2-digit',minute:'2-digit'}).formatToParts(new Date());
    var g=function(t){return parts.filter(function(x){return x.type===t})[0].value};
    return {day:g('weekday').slice(0,3).toLowerCase(),h:parseInt(g('hour'),10)%24,m:parseInt(g('minute'),10)};
  }catch(e){
    var d=new Date();return {day:['sun','mon','tue','wed','thu','fri','sat'][d.getDay()],h:d.getHours(),m:d.getMinutes()};
  }
}
function dur(mins){
  var h=Math.floor(mins/60),m=mins%60;
  if(h<=0)return m+' min';
  return h+'h '+(m<10?'0':'')+m+'m';
}
function nowPick(min){
  if(min<11*60||min>=CLOSE)return {id:'coffee:5',temp:'Hot',size:'S',tag:min>=CLOSE?'Tomorrow morning':'Morning pick',line:'A flat white with something flaky from the pastry rotation.'};
  if(min<15*60)return {id:'lattes:4',temp:'Iced',size:'M',tag:'Midday reset',line:'Creamy, cold and sweet enough to feel like a break.'};
  if(min<20*60)return {id:'matcha:2',temp:'Iced',size:'M',tag:'Afternoon lift',line:'TNT Matcha over ice for the long stretch before dinner.'};
  return {id:'hotchoc:0',temp:'Hot',size:'M',tag:'Late night',line:'Dark hot chocolate, warm and simple, until 11PM.'};
}
var lastPick='';
function tick(){
  var t=torontoNow(),min=t.h*60+t.m;
  var open=min>=OPEN&&min<CLOSE,left=CLOSE-min;
  var pct=min<OPEN?0:min>=CLOSE?1:(min-OPEN)/(CLOSE-OPEN);
  var title,sub,pill,mid;
  if(open){
    title=left<=30?'Closing soon':'Open now';
    sub='Open until 11PM today, closing in '+dur(left);
    pill=left<=30?'Closing soon':'Open until 11PM';
    mid=dur(left)+' of fuse left';
  }else if(min<OPEN){
    title='Closed';sub='Opens at 8AM, in '+dur(OPEN-min);pill='Opens at 8AM';mid='Fuse is unlit';
  }else{
    title='Closed';sub='Opens tomorrow at 8AM';pill='Opens at 8AM';mid='Fuse has burned out';
  }
  set('#pillText',function(e){e.textContent=pill});
  set('#pillDot',function(e){e.className='dot'+(open?'':' off')});
  set('#bTitle',function(e){e.textContent=title});
  set('#bSub',function(e){e.textContent=sub});
  set('#dot',function(e){e.className='dot'+(open?'':' off')});
  set('#fuseMid',function(e){e.textContent=mid});
  set('#burnt',function(e){e.style.width=(pct*100)+'%'});
  set('#spark',function(e){e.style.left=(pct*100)+'%'});
  set('#todayLine',function(e){e.textContent=open?('Open now until 11PM'):(min<OPEN?'Opens at 8AM today':'Opens at 8AM tomorrow')});
  set('#now',function(el){
    var p=nowPick(min),key=p.id+p.temp+p.size+p.tag;
    if(key===lastPick)return;
    lastPick=key;
    var b=T.getBase(p.id),price=T.priceAt(b.it,p.temp,p.size==='S'?0:1);
    el.innerHTML='<p class="kicker">Right now: '+esc(p.tag)+'</p><p class="now-name">'+(b.it.hot?p.temp+' ':'')+esc(b.it.n)+'</p><p class="now-line">'+esc(p.line)+'</p><div class="now-row"><span class="now-price">'+money(price)+' <small>'+(p.size==='S'?'Small':'Medium')+'</small></span><a class="btn primary sm mag" href="build.html" data-build="'+p.id+'|'+p.temp+'|'+p.size+'">Build this</a></div>';
  });
  set('#hours',function(el){
    el.innerHTML=DAYS.map(function(d){
      var isToday=d.slice(0,3).toLowerCase()===t.day;
      return '<li'+(isToday?' class="today"':'')+'><span>'+d+(isToday?'<span class="tag">Today</span>':'')+'</span><span class="t">8AM to 11PM</span></li>';
    }).join('');
  });
}
tick();
setInterval(tick,30000);

/* ---------- signature cards on the home page ---------- */
set('#sigs',function(el){
  el.innerHTML=T.cat('signature').items.map(function(it,i){
    return '<a class="sig tilt spot" href="build.html#pour-signature-'+i+'" data-build="signature:'+i+'" aria-label="Pour the '+esc(it.n)+' in 3D">'+
      '<span class="eyebrow">Signature</span><h3>'+esc(it.n)+'</h3><span class="p">'+money(it.p[0])+'</span>'+
      '<span class="go">Pour it in 3D &rarr;</span></a>';
  }).join('');
});

/* ---------- pointer state and the shared frame loop ---------- */
var P=T.pointer={x:0,y:0,sx:0,sy:0};
T.hooks=[];
var root=document.documentElement;
if(!T.reduced){
  window.addEventListener('pointermove',function(e){
    P.x=(e.clientX/window.innerWidth)*2-1;
    P.y=(e.clientY/window.innerHeight)*2-1;
  },{passive:true});
  document.addEventListener('pointerleave',function(){P.x=0;P.y=0});
  var last=0,lx=-1,ly=-1;
  var loop=function(time){
    requestAnimationFrame(loop);
    if(document.hidden){last=time;return}
    var dt=Math.min(.05,(time-(last||time))/1000);last=time;
    var k=Math.min(1,dt*4.5);
    P.sx+=(P.x-P.sx)*k;P.sy+=(P.y-P.sy)*k;
    if(Math.abs(P.sx-lx)>.002||Math.abs(P.sy-ly)>.002){
      lx=P.sx;ly=P.sy;
      root.style.setProperty('--px',P.sx.toFixed(3));
      root.style.setProperty('--py',P.sy.toFixed(3));
    }
    for(var i=0;i<T.hooks.length;i++)T.hooks[i](time,dt);
  };
  requestAnimationFrame(loop);
}
})();
