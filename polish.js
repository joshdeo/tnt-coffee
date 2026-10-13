/* Interface polish on every page: word by word headline reveals, scroll reveals, card spotlights,
   magnetic primary buttons, a trailing cursor ring, a scroll progress line, film grain and page wipes. */
(function(){
'use strict';
var X=window.TNT||{};
var reduced=!!X.reduced;
var root=document.documentElement;
var fine=window.matchMedia&&window.matchMedia('(pointer: fine)').matches;

/* header height for sticky panels on every page */
function setHdr(){var h=document.querySelector('.top');if(h)root.style.setProperty('--hdr',h.offsetHeight+'px')}
setHdr();window.addEventListener('resize',setHdr);window.addEventListener('load',setHdr);
/* on phones the nav scrolls sideways: keep the current page in view */
(function(){var nav=document.querySelector('.links'),cur=nav&&nav.querySelector('[aria-current=page]');if(nav&&cur&&nav.scrollWidth>nav.clientWidth){nav.scrollLeft=Math.max(0,cur.offsetLeft-nav.clientWidth/2+cur.offsetWidth/2)}})();

/* ---------- split headlines into words ---------- */
var idx=0;
function wrapWord(content,isNode){
  var w=document.createElement('span');w.className='w';
  var wi=document.createElement('span');wi.className='wi';wi.style.setProperty('--i',idx++);
  if(isNode)wi.appendChild(content);else wi.textContent=content;
  w.appendChild(wi);return w;
}
document.querySelectorAll('h1.split, h2.split').forEach(function(h){
  idx=0;
  var nodes=Array.prototype.slice.call(h.childNodes),frag=document.createDocumentFragment();
  nodes.forEach(function(n){
    if(n.nodeType===3){
      n.textContent.split(/(\s+)/).forEach(function(part){
        if(!part)return;
        if(/^\s+$/.test(part))frag.appendChild(document.createTextNode(' '));
        else frag.appendChild(wrapWord(part,false));
      });
    }else if(n.nodeType===1){frag.appendChild(wrapWord(n,true))}
  });
  h.innerHTML='';h.appendChild(frag);h.classList.add('split-ready');
  if(X.introActive)h.classList.add('hold');
});
window.addEventListener('tnt:introdone',function(){
  document.querySelectorAll('.split-ready.hold').forEach(function(h){h.classList.remove('hold')});
});

/* ---------- reveal on scroll (only for things below the first screen) ---------- */
if(!reduced&&'IntersectionObserver' in window){
  var io=new IntersectionObserver(function(en){
    en.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
  },{rootMargin:'0px 0px -8% 0px'});
  var vh=window.innerHeight;
  var pending=[];
  document.querySelectorAll('[data-reveal]').forEach(function(el,i){
    var r=el.getBoundingClientRect();
    if(r.top>vh*.92){el.classList.add('rv');el.style.setProperty('--rd',(i%4)*80+'ms');io.observe(el);pending.push(el)}
  });
  /* fallback so nothing can stay hidden if the observer is late */
  var ticking=false;
  function sweep(){
    ticking=false;var h=window.innerHeight;
    pending=pending.filter(function(el){
      if(el.classList.contains('in'))return false;
      if(el.getBoundingClientRect().top<h*.96){el.classList.add('in');return false}
      return true;
    });
  }
  window.addEventListener('scroll',function(){if(!ticking){ticking=true;setTimeout(sweep,60)}},{passive:true});
  window.addEventListener('resize',function(){setTimeout(sweep,60)});
}

/* ---------- spotlight on cards ---------- */
document.addEventListener('pointermove',function(e){
  var el=e.target.closest&&e.target.closest('.spot');
  if(!el)return;
  var r=el.getBoundingClientRect();
  el.style.setProperty('--mx',(e.clientX-r.left)+'px');
  el.style.setProperty('--my',(e.clientY-r.top)+'px');
},{passive:true});

/* ---------- magnetic primary buttons ---------- */
if(fine&&!reduced){
  document.addEventListener('pointermove',function(e){
    var el=e.target.closest&&e.target.closest('.mag');
    document.querySelectorAll('.mag.pull').forEach(function(m){if(m!==el){m.classList.remove('pull');m.style.transform=''}});
    if(!el)return;
    var r=el.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
    el.classList.add('pull');
    el.style.transform='translate('+(dx*.22).toFixed(1)+'px,'+(dy*.3).toFixed(1)+'px)';
  },{passive:true});
}

/* ---------- cursor ring ---------- */
if(fine&&!reduced&&X.hooks){
  var ring=document.createElement('div');ring.className='cursor';ring.setAttribute('aria-hidden','true');
  ring.innerHTML='<span></span>';document.body.appendChild(ring);
  var cx=-100,cy=-100,tx=-100,ty=-100,shown=false;
  window.addEventListener('pointermove',function(e){
    tx=e.clientX;ty=e.clientY;
    if(!shown){shown=true;cx=tx;cy=ty;ring.classList.add('on')}
    var t=e.target;
    var drag=t.closest&&t.closest('#cup, #heroStage canvas');
    var hot=t.closest&&t.closest('a, button, select, label, input, textarea, [data-build]');
    ring.classList.toggle('big',!!hot&&!drag);
    ring.classList.toggle('drag',!!drag);
    ring.firstChild.textContent=drag?'Drag':'';
  },{passive:true});
  document.addEventListener('pointerleave',function(){ring.classList.remove('on');shown=false});
  X.hooks.push(function(time,dt){
    var k=1-Math.exp(-dt*16);cx+=(tx-cx)*k;cy+=(ty-cy)*k;
    ring.style.transform='translate3d('+cx.toFixed(1)+'px,'+cy.toFixed(1)+'px,0)';
  });
}

/* ---------- scroll progress ---------- */
var bar=document.createElement('div');bar.className='progress';bar.setAttribute('aria-hidden','true');bar.innerHTML='<i></i>';
document.body.appendChild(bar);
var top=document.querySelector('.top');
function onScroll(){
  var d=document.documentElement,max=Math.max(1,d.scrollHeight-window.innerHeight);
  bar.firstChild.style.transform='scaleX('+Math.min(1,(window.scrollY||0)/max).toFixed(4)+')';
  if(top)top.classList.toggle('scrolled',(window.scrollY||0)>24);
}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();

/* ---------- film grain (desktop only, phones get it from the 3D pass) ---------- */
if(!reduced&&fine){
  try{
    var c=document.createElement('canvas');c.width=c.height=160;
    var ctx=c.getContext('2d'),id=ctx.createImageData(160,160);
    for(var i=0;i<id.data.length;i+=4){var v=Math.random()*255|0;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255}
    ctx.putImageData(id,0,0);
    var grain=document.createElement('div');grain.className='grain';grain.setAttribute('aria-hidden','true');
    grain.style.backgroundImage='url('+c.toDataURL('image/png')+')';
    document.body.appendChild(grain);
  }catch(e){}
}

/* ---------- page wipes between pages ---------- */
document.addEventListener('click',function(e){
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  var a=e.target.closest&&e.target.closest('a[href]');
  if(!a||a.target||a.hasAttribute('download'))return;
  var href=a.getAttribute('href');
  if(!/^[a-z0-9-]+\.html(#[\w-]+)?$/i.test(href))return;
  if(reduced)return;
  e.preventDefault();
  try{sessionStorage.setItem('tnt.curtain','1')}catch(x){}
  root.classList.add('leaving');
  setTimeout(function(){location.href=href},430);
});
window.addEventListener('pageshow',function(){root.classList.remove('leaving')});

/* ---------- replay intro ---------- */
var rp=document.getElementById('replayIntro');
if(rp)rp.addEventListener('click',function(){if(X.replayIntro)X.replayIntro()});
})();
