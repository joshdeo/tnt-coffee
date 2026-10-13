/* Brew game: dial in a real espresso. Grind, dose, tamp, water, pull, taste, then a milk bonus.
   Targets follow common barista practice: 18 to 20 g in, about 1:2 out, 25 to 30 s, 90 to 96 C, about 9 bar,
   milk 55 to 65 C. Works with mouse, touch and keyboard. */
(function(){
'use strict';
var root=document.getElementById('game');
if(!root)return;
var X=window.TNT||{};
var reduced=!!X.reduced;
function $(s,el){return (el||document).querySelector(s)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function band(v,lo,hi,z0,z1){if(v>=lo&&v<=hi)return 1;if(v<lo)return clamp((v-z0)/(lo-z0),0,1);return clamp((z1-v)/(z1-hi),0,1)}
function f1(v){return (Math.round(v*10)/10).toFixed(1)}
function toF(c){return Math.round(c*9/5+32)}
function rng(s){return function(){s=(s*16807)%2147483647;return (s-1)/2147483646}}

var STEPS=[{k:'grind',n:'Grind'},{k:'dose',n:'Dose'},{k:'tamp',n:'Tamp'},{k:'temp',n:'Water'},{k:'pull',n:'Pull'},{k:'taste',n:'Taste'},{k:'milk',n:'Milk bonus'}];
function fresh(){return {step:0,grind:4,dose:0,tamp:0,tampLive:0,tamped:false,temp:88,
  shot:{t:0,w:0,run:false,done:false,bar:0,flow:0},milk:{temp:5,run:false,done:false,vol:0},res:null}}
var S=fresh();
var hold={grind:false,tamp:false,steam:false};
var best=0;try{best=+localStorage.getItem('tnt.brewBest')||0}catch(e){}

/* ---------- sound (only ever starts from a tap) ---------- */
var snd={on:true,ctx:null,nodes:{},nb:null};
function ac(){
  if(!snd.on)return null;
  try{
    if(!snd.ctx){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;snd.ctx=new C()}
    if(snd.ctx.state==='suspended')snd.ctx.resume();
    return snd.ctx;
  }catch(e){return null}
}
function noiseBuf(c){
  if(snd.nb)return snd.nb;
  var b=c.createBuffer(1,c.sampleRate,c.sampleRate),d=b.getChannelData(0);
  for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  return snd.nb=b;
}
function startLoop(name){
  var c=ac();if(!c||snd.nodes[name])return;
  var g=c.createGain();g.gain.value=0;g.connect(c.destination);
  var stops=[];
  function noise(type,freq,q,gain){
    var s=c.createBufferSource();s.buffer=noiseBuf(c);s.loop=true;
    var f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;
    var gg=c.createGain();gg.gain.value=gain;s.connect(f);f.connect(gg);gg.connect(g);s.start();stops.push(s);
  }
  function osc(type,freq,gain,lp){
    var o=c.createOscillator();o.type=type;o.frequency.value=freq;
    var gg=c.createGain();gg.gain.value=gain;
    if(lp){var f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;o.connect(f);f.connect(gg)}else o.connect(gg);
    gg.connect(g);o.start();stops.push(o);
  }
  var level=.05;
  if(name==='grind'){noise('bandpass',1100,.7,1);osc('sawtooth',96,.25,600);level=.07}
  else if(name==='pump'){osc('sawtooth',58,1,260);noise('lowpass',400,.5,.3);level=.06}
  else if(name==='steam'){noise('highpass',2600,.4,1);noise('bandpass',700,1.2,.25);level=.05}
  g.gain.setTargetAtTime(level,c.currentTime,.04);
  snd.nodes[name]={g:g,stops:stops};
}
function stopLoop(name){
  var n=snd.nodes[name];if(!n||!snd.ctx)return;
  n.g.gain.setTargetAtTime(0,snd.ctx.currentTime,.06);
  setTimeout(function(){n.stops.forEach(function(s){try{s.stop()}catch(e){}})},400);
  delete snd.nodes[name];
}
function blip(freq,dur){
  var c=ac();if(!c)return;
  var o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=freq||660;
  g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.08,c.currentTime+.01);
  g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+(dur||.18));
  o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+(dur||.18)+.05);
}

/* ---------- the illustrated machine ---------- */
function beans(){
  var r=rng(9),out='';
  for(var i=0;i<30;i++){
    var y=34+r()*70,half=60-(y-22)*.36,x=200+(r()*2-1)*(half-10),a=r()*180;
    out+='<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+a.toFixed(0)+')"><ellipse rx="7" ry="4.6" fill="#5a321a"/><path d="M-5 0 Q0 -1.6 5 0" stroke="#2a1408" stroke-width="1.2" fill="none"/></g>';
  }
  return out;
}
function ticks(cx,cy,r1,r2,n,a0,a1,col){
  var s='';for(var i=0;i<=n;i++){var a=(a0+(a1-a0)*i/n)*Math.PI/180;
    s+='<line x1="'+(cx+Math.sin(a)*r1).toFixed(1)+'" y1="'+(cy-Math.cos(a)*r1).toFixed(1)+'" x2="'+(cx+Math.sin(a)*r2).toFixed(1)+'" y2="'+(cy-Math.cos(a)*r2).toFixed(1)+'" stroke="'+col+'" stroke-width="1.6"/>'}
  return s;
}
var SVG=[
'<svg id="gSvg" viewBox="0 0 400 340" role="img" aria-labelledby="gSvgT"><title id="gSvgT">Espresso bar: grinder, tamping station and machine</title>',
'<defs>',
'<linearGradient id="bgChrome" x1="0" x2="1"><stop offset="0" stop-color="#3d3029"/><stop offset=".45" stop-color="#191210"/><stop offset=".56" stop-color="#241a15"/><stop offset="1" stop-color="#4d3d33"/></linearGradient>',
'<linearGradient id="bgSteel" x1="0" x2="1"><stop offset="0" stop-color="#77716c"/><stop offset=".35" stop-color="#ece6df"/><stop offset=".62" stop-color="#a49d97"/><stop offset="1" stop-color="#55504b"/></linearGradient>',
'<linearGradient id="bgGlass" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity=".15"/></linearGradient>',
'<linearGradient id="bgEsp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9783c"/><stop offset=".22" stop-color="#6b3815"/><stop offset="1" stop-color="#2a1207"/></linearGradient>',
'<linearGradient id="bgWood" x1="0" x2="1"><stop offset="0" stop-color="#5a2e14"/><stop offset=".5" stop-color="#9a5a2c"/><stop offset="1" stop-color="#4a2410"/></linearGradient>',
'<radialGradient id="bgGlow"><stop offset="0" stop-color="#ff7a1a" stop-opacity=".5"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>',
'<radialGradient id="bgCrema" cx=".45" cy=".42" r=".6"><stop offset="0" stop-color="#d9a066"/><stop offset=".55" stop-color="#a5622c"/><stop offset="1" stop-color="#4a220c"/></radialGradient>',
'<clipPath id="bcCup"><path d="M168 236 H232 L226 290 Q200 297 174 290 Z"/></clipPath>',
'<clipPath id="bcBasket"><path d="M124 254 H276 L264 314 H136 Z"/></clipPath>',
'<clipPath id="bcPitcher"><path d="M20 232 H78 L73 310 H25 Z"/></clipPath>',
'</defs>',
'<circle cx="200" cy="170" r="190" fill="url(#bgGlow)" opacity=".5"/>',

/* grinder */
'<g id="sGrinder" class="scene">',
'<ellipse cx="200" cy="334" rx="120" ry="7" fill="#000" opacity=".4"/>',
'<path d="M140 22 H260 L228 112 H172 Z" fill="url(#bgGlass)" stroke="rgba(255,225,190,.4)" stroke-width="1.5"/>',
'<g id="gBeans">'+beans()+'</g>',
'<path d="M140 22 H260 L228 112 H172 Z" fill="none" stroke="rgba(255,240,220,.25)" stroke-width="1"/>',
'<rect x="166" y="110" width="68" height="12" rx="3" fill="url(#bgSteel)"/>',
'<path d="M156 122 H244 V238 H156 Z" fill="url(#bgChrome)"/>',
'<rect x="156" y="122" width="88" height="5" fill="#ff7a1a" opacity=".8"/>',
'<g transform="translate(200 178)"><circle r="35" fill="#120c09" stroke="url(#bgSteel)" stroke-width="5"/>',
ticks(0,0,26,31,9,-120,120,'#b9a084'),
'<text x="-30" y="26" font-size="10" fill="#b9a084" font-family="Barlow Condensed, sans-serif" font-weight="700">C</text>',
'<text x="24" y="26" font-size="10" fill="#b9a084" font-family="Barlow Condensed, sans-serif" font-weight="700">F</text>',
'<g id="gDial"><line y1="-5" y2="-25" stroke="#ff7a1a" stroke-width="4" stroke-linecap="round"/><circle r="7" fill="url(#bgSteel)"/></g></g>',
'<rect x="190" y="238" width="20" height="18" fill="url(#bgSteel)"/>',
'<path d="M160 262 H240 L233 292 H167 Z" fill="url(#bgSteel)"/>',
'<path id="gMound" d="M162 262 Q200 262 238 262 Z" fill="#3e1f0c"/>',
'<rect x="238" y="268" width="92" height="13" rx="6.5" fill="#1a1310"/>',
'<g id="gFall"></g>',
'<rect x="120" y="294" width="160" height="38" rx="8" fill="url(#bgChrome)"/>',
'<rect x="166" y="304" width="68" height="20" rx="4" fill="#0b0706"/>',
'<text id="gScaleTxt" x="200" y="318" text-anchor="middle" font-size="13" fill="#ffb640" font-family="ui-monospace, Menlo, monospace">0.0 g</text>',
'</g>',

/* tamping station */
'<g id="sTamp" class="scene">',
'<ellipse cx="200" cy="332" rx="140" ry="8" fill="#000" opacity=".4"/>',
'<path d="M114 250 H286 L270 320 H130 Z" fill="url(#bgSteel)"/>',
'<rect id="tBed" x="120" y="266" width="160" height="60" fill="#3e1f0c" clip-path="url(#bcBasket)"/>',
'<path d="M114 250 H286" stroke="#f3ede6" stroke-width="3"/>',
'<rect x="284" y="272" width="100" height="20" rx="10" fill="#1a1310"/>',
'<g id="tTamper">',
'<rect x="166" y="96" width="68" height="78" rx="30" fill="url(#bgWood)"/>',
'<rect x="190" y="170" width="20" height="16" fill="url(#bgSteel)"/>',
'<rect x="126" y="184" width="148" height="16" rx="4" fill="url(#bgSteel)"/>',
'</g>',
'<rect x="344" y="80" width="20" height="220" rx="10" fill="#0b0706" stroke="rgba(255,220,180,.25)"/>',
'<rect x="344" y="'+(300-20/35*220).toFixed(1)+'" width="20" height="'+(8/35*220).toFixed(1)+'" fill="#74d58f" opacity=".28"/>',
'<rect id="tFill" x="348" y="300" width="12" height="0" rx="6" fill="#ff7a1a"/>',
'<text id="tKg" x="354" y="70" text-anchor="middle" font-size="15" fill="#ffe0a0" font-family="Barlow Condensed, sans-serif" font-weight="700">0 kg</text>',
'</g>',

/* machine */
'<g id="sMachine" class="scene">',
'<ellipse cx="200" cy="334" rx="170" ry="8" fill="#000" opacity=".45"/>',
'<rect x="82" y="28" width="236" height="8" rx="4" fill="url(#bgSteel)"/>',
'<rect x="70" y="36" width="260" height="146" rx="16" fill="url(#bgChrome)"/>',
'<rect x="70" y="176" width="260" height="6" fill="#ff7a1a"/>',
'<rect x="70" y="182" width="22" height="140" fill="url(#bgChrome)"/><rect x="308" y="182" width="22" height="140" fill="url(#bgChrome)"/>',
'<text x="200" y="66" text-anchor="middle" font-size="20" fill="#ffb640" font-family="Anton, Impact, sans-serif" letter-spacing="1">TNT</text>',
'<g transform="translate(120 100)"><circle r="33" fill="#f3ead9" stroke="url(#bgSteel)" stroke-width="5"/>',
ticks(0,0,22,28,12,-135,135,'#3a2a1f'),
'<path d="M'+(Math.sin(56.25*Math.PI/180)*25).toFixed(1)+' '+(-Math.cos(56.25*Math.PI/180)*25).toFixed(1)+' A25 25 0 0 1 '+(Math.sin(90*Math.PI/180)*25).toFixed(1)+' '+(-Math.cos(90*Math.PI/180)*25).toFixed(1)+'" stroke="#3aa35a" stroke-width="4" fill="none"/>',
'<text y="17" text-anchor="middle" font-size="8" fill="#3a2a1f" font-family="Barlow Condensed, sans-serif" font-weight="700">BAR</text>',
'<g id="mNeedle" transform="rotate(-135)"><line y1="4" y2="-25" stroke="#c0301a" stroke-width="2.6" stroke-linecap="round"/></g><circle r="4" fill="#222"/></g>',
'<rect x="236" y="76" width="72" height="42" rx="6" fill="#0b0706" stroke="rgba(255,220,180,.25)"/>',
'<text id="mTemp" x="272" y="105" text-anchor="middle" font-size="21" fill="#ffb640" font-family="ui-monospace, Menlo, monospace">88&#176;</text>',
'<text x="272" y="132" text-anchor="middle" font-size="8.5" fill="#b9a084" font-family="Barlow Condensed, sans-serif" font-weight="700" letter-spacing="1">WATER &#176;C</text>',
'<rect x="170" y="118" width="60" height="30" rx="4" fill="url(#bgSteel)"/>',
'<g id="mPF"><path d="M166 148 H234 L227 166 H173 Z" fill="url(#bgSteel)"/><rect x="230" y="150" width="86" height="12" rx="6" fill="#1a1310"/>',
'<rect x="187" y="166" width="7" height="8" fill="#9a948e"/><rect x="206" y="166" width="7" height="8" fill="#9a948e"/></g>',
'<g id="mStream" opacity="0"><line id="mS1" x1="190.5" y1="174" x2="190.5" y2="282" stroke="#3a1a0a" stroke-width="3" stroke-linecap="round" stroke-dasharray="9 5"/>',
'<line id="mS2" x1="209.5" y1="174" x2="209.5" y2="282" stroke="#3a1a0a" stroke-width="3" stroke-linecap="round" stroke-dasharray="9 5"/></g>',
'<path d="M164 232 H236 L229 291 Q200 302 171 291 Z" fill="#f3ead9"/>',
'<path d="M234 246 Q256 248 252 264 Q248 278 230 276" stroke="#f3ead9" stroke-width="6" fill="none"/>',
'<rect id="mLiquid" x="160" y="292" width="80" height="0" fill="url(#bgEsp)" clip-path="url(#bcCup)"/>',
'<rect id="mCrema" x="160" y="292" width="80" height="0" fill="#c98d50" clip-path="url(#bcCup)"/>',
'<rect x="96" y="300" width="208" height="22" rx="4" fill="url(#bgSteel)"/>',
'<path d="M110 306 H290 M110 311 H290 M110 316 H290" stroke="#5d5853" stroke-width="1.2"/>',
'<path d="M92 170 C 90 205 66 214 52 262" stroke="url(#bgSteel)" stroke-width="7" fill="none" stroke-linecap="round"/>',
'<rect x="86" y="150" width="12" height="22" rx="3" fill="url(#bgSteel)"/>',
'<g id="mPitcher" opacity="0"><path d="M16 228 H82 L76 316 H22 Z" fill="url(#bgSteel)"/><path d="M16 228 L4 220 L18 240 Z" fill="url(#bgSteel)"/>',
'<rect id="mMilk" x="18" y="300" width="64" height="10" fill="#f6eee0" clip-path="url(#bcPitcher)"/>',
'<path d="M82 240 Q98 248 94 268 Q90 290 78 292" stroke="url(#bgSteel)" stroke-width="5" fill="none"/></g>',
'<g id="mSteam"></g>',
'</g>',

/* tasting: cup from above */
'<g id="sTaste" class="scene">',
'<ellipse cx="200" cy="180" rx="150" ry="120" fill="#f1e6d4"/>',
'<ellipse cx="200" cy="180" rx="128" ry="102" fill="#e2d4bd"/>',
'<path d="M298 160 Q352 150 350 186 Q348 218 296 206" stroke="#f3ead9" stroke-width="16" fill="none"/>',
'<circle cx="200" cy="176" r="96" fill="#f3ead9"/>',
'<circle id="tCup" cx="200" cy="176" r="84" fill="url(#bgCrema)"/>',
'<g id="tTiger" opacity=".35"></g>',
'<path id="tHeart" opacity="0" d="M200 236 C 140 200 132 140 170 132 C 188 128 198 142 200 152 C 202 142 212 128 230 132 C 268 140 260 200 200 236 Z" fill="#f8efe1"/>',
'<path id="tPull" opacity="0" d="M200 120 L200 240" stroke="#f8efe1" stroke-width="5" stroke-linecap="round"/>',
'</g>',
'</svg>'].join('');

/* ---------- layout ---------- */
root.innerHTML=
'<div class="g-stage spot">'+
  '<div class="g-top"><span class="g-best" id="gBest"></span><button class="g-sound" id="gSound" type="button" aria-pressed="true">Sound on</button></div>'+
  SVG+
  '<div class="g-hud" id="gHud"></div>'+
'</div>'+
'<div class="g-panel spot">'+
  '<ol class="g-steps" id="gSteps" aria-label="Steps"></ol>'+
  '<div class="g-body" id="gBody"></div>'+
'</div>';

var el={dial:$('#gDial'),mound:$('#gMound'),fall:$('#gFall'),beans:$('#gBeans'),scale:$('#gScaleTxt'),
  bed:$('#tBed'),tamper:$('#tTamper'),tFill:$('#tFill'),tKg:$('#tKg'),
  needle:$('#mNeedle'),mTemp:$('#mTemp'),stream:$('#mStream'),s1:$('#mS1'),s2:$('#mS2'),liquid:$('#mLiquid'),crema:$('#mCrema'),
  pitcher:$('#mPitcher'),milk:$('#mMilk'),steam:$('#mSteam'),tHeart:$('#tHeart'),tPull:$('#tPull'),tCup:$('#tCup'),tTiger:$('#tTiger'),
  hud:$('#gHud'),steps:$('#gSteps'),body:$('#gBody'),best:$('#gBest'),sound:$('#gSound')};
var scenes={grinder:$('#sGrinder'),tamp:$('#sTamp'),machine:$('#sMachine'),taste:$('#sTaste')};
(function(){var r=rng(4),s='';for(var i=0;i<26;i++){var a=r()*6.28,d=r()*70;s+='<ellipse cx="'+(200+Math.cos(a)*d).toFixed(1)+'" cy="'+(176+Math.sin(a)*d).toFixed(1)+'" rx="'+(3+r()*6).toFixed(1)+'" ry="'+(1+r()*2).toFixed(1)+'" transform="rotate('+(a*57).toFixed(0)+' '+(200+Math.cos(a)*d).toFixed(1)+' '+(176+Math.sin(a)*d).toFixed(1)+')" fill="#3a1a08"/>'}el.tTiger.innerHTML=s})();

function setScene(name){for(var k in scenes)scenes[k].classList.toggle('on',k===name)}
function sceneFor(k){return k==='grind'||k==='dose'?'grinder':k==='tamp'?'tamp':k==='taste'?'taste':'machine'}

/* ---------- readouts ---------- */
function grindWord(g){
  if(g<2.5)return 'Coarse like sea salt';
  if(g<4.5)return 'Medium like sand';
  if(g<5.5)return 'Medium fine';
  if(g<=7.5)return 'Fine like table salt';
  if(g<9)return 'Very fine';
  return 'Powder like flour';
}
function grindDesc(g){
  if(g<2.5)return 'Coarse like sea salt. Water will rush straight through.';
  if(g<4.5)return 'Medium like sand. Right for filter coffee, too coarse for espresso.';
  if(g<5.5)return 'Medium fine. Getting close.';
  if(g<=7.5)return 'Fine like table salt. The espresso sweet spot.';
  if(g<9)return 'Very fine. The shot will crawl.';
  return 'Powder like flour. Water can barely get through.';
}
function chip(label,val,ok){return '<span class="g-chip'+(ok==null?'':ok?' ok':' off')+'"><b>'+label+'</b>'+val+'</span>'}
function hud(){
  var sh=S.shot,r=S.dose>0?sh.w/S.dose:0;
  el.hud.innerHTML=
    chip('Grind',grindWord(S.grind),S.step>0?S.grind>=5.5&&S.grind<=7.5:null)+
    chip('Dose',f1(S.dose)+' g',S.step>1?S.dose>=17.5&&S.dose<=20.5:null)+
    chip('Tamp',S.tamped?Math.round(S.tamp)+' kg':'Not yet',S.tamped?S.tamp>=12&&S.tamp<=22:null)+
    chip('Water',S.temp+' °C',S.step>3?S.temp>=90&&S.temp<=96:null)+
    chip('Shot',sh.t>0?f1(sh.w)+' g in '+f1(sh.t)+' s':'Not yet',sh.done?(sh.t>=25&&sh.t<=30&&r>=1.8&&r<=2.2):null);
}
function steps(){
  el.steps.innerHTML=STEPS.map(function(s,i){
    var cls=i<S.step?'done':i===S.step?'now':'';
    return '<li class="'+cls+'"'+(i===S.step?' aria-current="step"':'')+'><span>'+(i<6?(i+1):'+')+'</span>'+s.n+'</li>';
  }).join('');
}
function showBest(){el.best.textContent=best?'Your best: '+best:''}

/* ---------- step screens ---------- */
function nav(back,next,label,disabled){
  return '<div class="g-nav">'+(back?'<button class="btn" type="button" id="gBack">Back</button>':'')+
    '<button class="btn primary" type="button" id="gNext"'+(disabled?' disabled':'')+'>'+label+'</button></div>';
}
function tip(t){return '<div class="g-tip"><strong>Barista target</strong><p>'+t+'</p></div>'}
var screens={
  grind:function(){
    return '<p class="g-kicker">Step 1 of 5</p><h2>Set the grind</h2>'+
      '<p>Grind size is the main dial a barista turns. Finer grounds slow the water and pull out more flavour. Coarser grounds let it rush through.</p>'+
      '<label class="g-range" for="gGrind"><span>Coarse</span><input type="range" id="gGrind" min="1" max="10" step="0.5" value="'+S.grind+'" aria-describedby="gGrindDesc"><span>Fine</span></label>'+
      '<p class="g-live" id="gGrindDesc">'+grindDesc(S.grind)+'</p>'+
      tip('Fine, about like table salt. Baristas change the grind to change the shot time, and keep the dose and yield the same.')+
      nav(false,true,'Next: dose the basket');
  },
  dose:function(){
    return '<p class="g-kicker">Step 2 of 5</p><h2>Dose the basket</h2>'+
      '<p>Hold the button to grind straight into the basket. Watch the scale and let go on your number.</p>'+
      '<div class="g-big"><span id="gDoseBig">'+f1(S.dose)+'</span><small>grams in the basket</small></div>'+
      '<div class="g-row"><button class="g-hold" type="button" id="gHold">Hold to grind</button><button class="g-link" type="button" id="gEmpty">Empty the basket</button></div>'+
      tip('18 to 20 g of ground coffee for a double shot, weighed to a tenth of a gram.')+
      nav(true,true,'Next: tamp',S.dose<6);
  },
  tamp:function(){
    return '<p class="g-kicker">Step 3 of 5</p><h2>Tamp it level</h2>'+
      '<p>Hold to press the coffee down into a firm, flat puck. Let go when the meter sits in the green.</p>'+
      '<div class="g-big"><span id="gKgBig">'+Math.round(S.tamped?S.tamp:0)+'</span><small>kg of pressure</small></div>'+
      '<div class="g-row"><button class="g-hold" type="button" id="gHold">Hold to tamp</button></div>'+
      tip('About 15 kg, roughly 30 lb. A level, even tamp matters more than raw force, because water finds any weak spot.')+
      nav(true,true,'Next: water temperature',!S.tamped);
  },
  temp:function(){
    return '<p class="g-kicker">Step 4 of 5</p><h2>Set the water</h2>'+
      '<p>Hotter water pulls flavour out faster. Too cool tastes sour, too hot tastes bitter.</p>'+
      '<label class="g-range" for="gTemp"><span>85 °C</span><input type="range" id="gTemp" min="85" max="100" step="1" value="'+S.temp+'"><span>100 °C</span></label>'+
      '<div class="g-big"><span id="gTempBig">'+S.temp+'</span><small>°C, <span id="gTempF">'+toF(S.temp)+'</span> °F</small></div>'+
      tip('90 to 96 °C (195 to 205 °F), pushed through at about 9 bar of pressure.')+
      nav(true,true,'Next: pull the shot');
  },
  pull:function(){
    var sh=S.shot;
    return '<p class="g-kicker">Step 5 of 5</p><h2>Pull the shot</h2>'+
      '<p>Press start, watch the scale and the clock, and stop the shot yourself.</p>'+
      '<div class="g-reads"><div><span id="gW">'+f1(sh.w)+'</span><small>grams in cup</small></div><div><span id="gT">'+f1(sh.t)+'</span><small>seconds</small></div><div><span id="gR">1:'+f1(S.dose?sh.w/S.dose:0)+'</span><small>ratio</small></div></div>'+
      '<button class="g-go'+(sh.run?' stop':'')+'" type="button" id="gGo">'+(sh.run?'Stop shot':'Start shot')+'</button>'+
      tip('About twice your dose in the cup, so 36 g from 18 g, in 25 to 30 seconds. The stream goes dark, then caramel, then pale blonde. Pale means stop soon.')+
      (sh.run?'':'<div class="g-nav"><button class="btn" type="button" id="gBack">Back</button></div>');
  },
  taste:function(){
    var R=S.res;
    var ring=326.7,off=ring*(1-R.total/100);
    return '<p class="g-kicker">Your shot</p>'+
      '<div class="g-score"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" stroke="rgba(255,220,180,.12)" stroke-width="10" fill="none"/>'+
      '<circle cx="60" cy="60" r="52" stroke="url(#gsGrad)" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="'+ring+'" stroke-dashoffset="'+(reduced?off:ring)+'" transform="rotate(-90 60 60)" class="g-arc" data-off="'+off.toFixed(1)+'"/>'+
      '<defs><linearGradient id="gsGrad"><stop offset="0" stop-color="#ffb640"/><stop offset="1" stop-color="#ff7a1a"/></linearGradient></defs></svg>'+
      '<div><span class="g-num">'+R.total+'</span><small>out of 100</small></div></div>'+
      '<h2>'+R.rank+'</h2>'+
      '<p class="g-taste"><strong>'+R.taste.t+'.</strong> '+R.taste.d+'</p>'+
      '<ul class="g-bars">'+R.parts.map(function(p){
        return '<li><span class="g-bk">'+p.k+'</span><span class="g-bar"><i style="width:'+Math.round(p.v*100)+'%"></i></span><span class="g-pts">'+Math.round(p.v*p.max)+'/'+p.max+'</span>'+
          '<span class="g-you">You: '+p.you+'</span><span class="g-tg">Target: '+p.target+'</span></li>';
      }).join('')+'</ul>'+
      (R.fixes.length?'<div class="g-tip"><strong>Next time</strong><ul>'+R.fixes.map(function(f){return '<li>'+f+'</li>'}).join('')+'</ul></div>':'<div class="g-tip"><strong>Dialled in</strong><p>Every number landed in range. That is a cafe quality shot.</p></div>')+
      '<div class="g-nav"><button class="btn" type="button" id="gAgain">Pull another shot</button><button class="btn primary" type="button" id="gMilkGo">Bonus: steam milk for a latte</button></div>';
  },
  milk:function(){
    var m=S.milk;
    return '<p class="g-kicker">Bonus round</p><h2>Steam the milk</h2>'+
      '<p>Hold to steam. The milk heats fast. Let go when it is hot enough to taste sweet, before it scalds.</p>'+
      '<div class="g-big"><span id="gMilkBig">'+Math.round(m.temp)+'</span><small>°C, <span id="gMilkF">'+toF(m.temp)+'</span> °F</small></div>'+
      (m.done?'<p class="g-taste" id="gMilkRes">'+milkResult().html+'</p>':
        '<div class="g-row"><button class="g-hold" type="button" id="gHold">Hold to steam</button></div>')+
      tip('55 to 65 °C (131 to 149 °F) for silky, sweet microfoam. Past about 70 °C the milk starts to taste burnt.')+
      '<div class="g-nav"><button class="btn" type="button" id="gAgain">Play again</button>'+(m.done?'<button class="btn primary" type="button" id="gBackRes">Back to my score</button>':'')+'</div>';
  }
};

function render(){
  var k=STEPS[S.step].k;
  setScene(sceneFor(k));
  el.pitcher.setAttribute('opacity',k==='milk'?'1':'0');
  el.body.innerHTML=screens[k]();
  steps();hud();showBest();
  bind(k);
  if(k==='milk'&&S.milk.done){setScene('taste');drawCup()}
  if(k==='taste'){
    var arc=el.body.querySelector('.g-arc');
    if(arc&&!reduced)requestAnimationFrame(function(){requestAnimationFrame(function(){arc.style.strokeDashoffset=arc.getAttribute('data-off')})});
    drawCup();
  }
}
function go(n){
  stopAll();S.step=n;render();
  if(window.innerWidth<=880){
    var top=document.querySelector('.top'),r=root.getBoundingClientRect();
    if(r.top<0||r.top>window.innerHeight*.4)window.scrollTo({top:r.top+(window.scrollY||0)-(top?top.offsetHeight:0)-8,behavior:reduced?'auto':'smooth'});
  }
}
function bind(k){
  var next=$('#gNext',el.body),back=$('#gBack',el.body);
  if(next)next.addEventListener('click',function(){blip(720,.12);go(S.step+1)});
  if(back)back.addEventListener('click',function(){go(S.step-1)});
  if(k==='grind'){
    var r=$('#gGrind',el.body);
    r.addEventListener('input',function(){S.grind=+r.value;$('#gGrindDesc').textContent=grindDesc(S.grind);drawGrinder();hud()});
  }
  if(k==='dose'){
    holdBtn($('#gHold',el.body),'grind');
    $('#gEmpty',el.body).addEventListener('click',function(){S.dose=0;S.tamped=false;S.tamp=0;drawGrinder();updDose()});
  }
  if(k==='tamp')holdBtn($('#gHold',el.body),'tamp');
  if(k==='temp'){
    var t=$('#gTemp',el.body);
    t.addEventListener('input',function(){S.temp=+t.value;$('#gTempBig').textContent=S.temp;$('#gTempF').textContent=toF(S.temp);drawMachine();hud()});
  }
  if(k==='pull')$('#gGo',el.body).addEventListener('click',function(){S.shot.run?stopShot():startShot()});
  if(k==='taste'){
    $('#gAgain',el.body).addEventListener('click',again);
    $('#gMilkGo',el.body).addEventListener('click',function(){S.milk={temp:5,run:false,done:false,vol:0};go(6)});
  }
  if(k==='milk'){
    var h=$('#gHold',el.body);if(h)holdBtn(h,'steam');
    $('#gAgain',el.body).addEventListener('click',again);
    var br=$('#gBackRes',el.body);if(br)br.addEventListener('click',function(){go(5)});
  }
}
function again(){
  var keepGrind=S.grind,keepTemp=S.temp;
  S=fresh();S.grind=keepGrind;S.temp=keepTemp;
  clearFall();drawAll();go(0);
}

/* press and hold, for mouse, touch and keyboard */
function holdBtn(b,what){
  if(!b)return;
  function on(e){
    if(e&&e.type==='pointerdown'){try{b.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault()}
    if(hold[what])return;
    hold[what]=true;b.classList.add('on');
    if(what==='tamp'){S.tampLive=0}
    if(what==='grind')startLoop('grind');
    if(what==='steam'){startLoop('steam');S.milk.run=true}
  }
  function off(){
    if(!hold[what])return;
    hold[what]=false;b.classList.remove('on');
    if(what==='grind')stopLoop('grind');
    if(what==='tamp'){S.tamp=S.tampLive;S.tamped=S.tamp>1;blip(S.tamp>=12&&S.tamp<=22?880:330,.16);
      var nx=$('#gNext',el.body);if(nx)nx.disabled=!S.tamped;hud();
      setTimeout(function(){if(!hold.tamp)liftTamper=true},250)}
    if(what==='steam'){stopLoop('steam');S.milk.run=false;S.milk.done=true;blip(milkResult().good?880:330,.2);render()}
  }
  b.addEventListener('pointerdown',on);
  b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);
  b.addEventListener('contextmenu',function(e){e.preventDefault()});
  b.addEventListener('keydown',function(e){if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();on()}});
  b.addEventListener('keyup',function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();off()}});
}
function stopAll(){
  for(var k in hold)hold[k]=false;
  stopLoop('grind');stopLoop('steam');
  if(S.shot.run)stopShot(true);
}

/* ---------- the shot ---------- */
function startShot(){
  var sh=S.shot;sh.t=0;sh.w=0;sh.run=true;sh.done=false;sh.bar=0;
  startLoop('pump');blip(520,.1);render();
}
function stopShot(silent){
  var sh=S.shot;if(!sh.run)return;
  sh.run=false;sh.done=true;stopLoop('pump');
  if(silent)return;
  S.res=score();
  if(S.res.total>best){best=S.res.total;try{localStorage.setItem('tnt.brewBest',String(best))}catch(e){}}
  blip(S.res.total>=75?990:440,.25);
  var gb=$('#gGo',el.body);if(gb){gb.textContent='Tasting your shot';gb.disabled=true;gb.classList.remove('stop')}
  var bk=$('#gBack',el.body);if(bk)bk.disabled=true;
  setTimeout(function(){go(5)},reduced?0:900);
}
function shotModel(){
  var g=S.grind,d=Math.max(S.dose,6),k=S.tamp;
  var tampF=k<8?1+(8-k)*.07:k>22?Math.max(.6,1-(k-22)*.02):1;
  var t0=clamp(4+(g-6.5)*.9-(k<8?(8-k)*.15:0),1.5,10);
  var F=1.55*Math.pow(1.38,6.5-g)*Math.pow(18/d,1.4)*tampF;
  return {t0:t0,F:F};
}

/* ---------- scoring ---------- */
function score(){
  var d=S.dose,g=S.grind,k=S.tamp,T=S.temp,t=S.shot.t,w=S.shot.w,r=w/Math.max(d,1);
  var parts=[
    {k:'Grind',max:10,v:band(g,5.5,7.5,3.5,9.5),you:grindWord(g).toLowerCase(),target:'fine, like table salt'},
    {k:'Dose',max:15,v:band(d,17.5,20.5,15,23),you:f1(d)+' g',target:'18 to 20 g'},
    {k:'Tamp',max:10,v:band(k,12,22,6,30),you:Math.round(k)+' kg',target:'about 15 kg (30 lb)'},
    {k:'Water',max:15,v:band(T,90,96,87,99),you:T+' °C',target:'90 to 96 °C'},
    {k:'Time',max:25,v:band(t,25,30,20,35),you:f1(t)+' s',target:'25 to 30 s'},
    {k:'Ratio',max:25,v:band(r,1.8,2.2,1.4,2.8),you:'1:'+f1(r)+', '+f1(w)+' g',target:'1:2, 36 g from 18 g'}
  ];
  var total=0;parts.forEach(function(p){total+=Math.round(p.v*p.max)});
  var x=.6*clamp((t-27.5)/6,-2,2)+.7*clamp((r-2)/.5,-2,2)+.5*clamp((T-93)/3,-2,2);
  var taste=x<-1.1?{t:'Sour and thin',d:'Under-extracted. The water did not pull enough sweetness out of the coffee.'}:
    x<-.4?{t:'Bright and a little sour',d:'Slightly under. A touch finer, or a slightly longer shot, will sweeten it.'}:
    x<=.4?{t:'Sweet and balanced',d:'Syrupy body, caramel sweetness and a clean finish. This is the target.'}:
    x<=1.1?{t:'Heavy and a little bitter',d:'Slightly over. Grind a touch coarser or stop a little sooner.'}:
    {t:'Bitter and drying',d:'Over-extracted. Harsh flavours came out after the sweet ones were gone.'};
  var fixes=[];
  function lost(name){var p=parts.filter(function(q){return q.k===name})[0];return (1-p.v)*p.max}
  if(t<25)fixes.push({w:lost('Time'),s:'Your shot ran fast at '+f1(t)+' s. Grind finer to slow the water down.'});
  if(t>30)fixes.push({w:lost('Time'),s:'Your shot ran slow at '+f1(t)+' s. Grind coarser so the water flows more freely.'});
  if(r<1.8)fixes.push({w:lost('Ratio'),s:'Let it run longer. Aim for about twice your dose in the cup.'});
  if(r>2.2)fixes.push({w:lost('Ratio'),s:'Stop sooner. Past about 1:2.2 the shot thins out and turns bitter.'});
  if(T<90)fixes.push({w:lost('Water'),s:'Raise the water to 90 to 96 °C. Cool water leaves it sour.'});
  if(T>96)fixes.push({w:lost('Water'),s:'Bring the water down to 96 °C or below. Hotter water pulls out harsh bitterness.'});
  if(k<12)fixes.push({w:lost('Tamp'),s:'Tamp firmer and level. A loose puck lets water channel through weak spots.'});
  if(k>22)fixes.push({w:lost('Tamp'),s:'Ease off the tamp. Even and level beats brute force.'});
  if(d<17.5||d>20.5)fixes.push({w:lost('Dose'),s:'Weigh 18 to 20 g into the basket.'});
  if(g<5.5||g>7.5)fixes.push({w:lost('Grind'),s:g<5.5?'Your grind was coarser than espresso needs.':'Your grind was finer than it needs to be.'});
  fixes.sort(function(a,b){return b.w-a.w});
  var rank=total>=92?'Dynamite barista':total>=78?'Lit fuse':total>=60?'Spark':'Fresh grounds';
  return {total:total,parts:parts,taste:taste,fixes:fixes.slice(0,3).map(function(f){return f.s}),rank:rank};
}
function milkResult(){
  var c=S.milk.temp;
  if(c>70)return {good:false,html:'<strong>Scalded at '+Math.round(c)+' °C.</strong> The milk sugars started to cook and it will taste flat and burnt.'};
  if(c>65)return {good:true,html:'<strong>Hot, '+Math.round(c)+' °C.</strong> Drinkable, but the sweetness is starting to fade. Let go a little sooner.'};
  if(c>=55)return {good:true,html:'<strong>Perfect, '+Math.round(c)+' °C.</strong> Silky, sweet microfoam. Your latte is poured.'};
  if(c>=45)return {good:true,html:'<strong>A bit cool, '+Math.round(c)+' °C.</strong> Hold a few seconds longer for full sweetness.'};
  return {good:false,html:'<strong>Too cool, '+Math.round(c)+' °C.</strong> Keep steaming until the pitcher feels hot.'};
}

/* ---------- drawing ---------- */
var pool=[],liftTamper=true,tamperY=0,needle=-135,dash=0,steamP=[];
function drawGrinder(){
  el.dial.setAttribute('transform','rotate('+(-120+(S.grind-1)/9*240).toFixed(1)+')');
  var hM=clamp(S.dose*1.15,0,30);
  el.mound.setAttribute('d','M162 262 Q200 '+(262-hM*1.7).toFixed(1)+' 238 262 Z');
  el.beans.setAttribute('transform','translate(0 '+clamp(S.dose*.7,0,24).toFixed(1)+')');
  el.scale.textContent=f1(S.dose)+' g';
}
function updDose(){var b=$('#gDoseBig',el.body);if(b)b.textContent=f1(S.dose);var nx=$('#gNext',el.body);if(nx&&STEPS[S.step].k==='dose')nx.disabled=S.dose<6;el.scale.textContent=f1(S.dose)+' g';hud()}
function drawMachine(){
  el.mTemp.textContent=S.temp+'°';
}
function clearFall(){pool.forEach(function(p){p.on=false;p.el.setAttribute('opacity','0')})}
function particle(){
  for(var i=0;i<pool.length;i++)if(!pool[i].on)return pool[i];
  if(pool.length>60)return null;
  var c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('fill','#4a2611');el.fall.appendChild(c);
  var p={el:c,on:false};pool.push(p);return p;
}
function drawCup(){
  var milkGood=S.milk.done&&S.milk.temp>=45&&S.milk.temp<=70;
  el.tHeart.setAttribute('opacity',milkGood?'1':'0');
  el.tPull.setAttribute('opacity',milkGood?'1':'0');
  var r=S.res;
  var light=r?(r.taste.t.indexOf('Sour')===0||r.taste.t.indexOf('Bright')===0):false;
  el.tCup.setAttribute('opacity',S.shot.done?'1':'.4');
  el.tTiger.setAttribute('opacity',light?'.12':'.35');
}
function drawAll(){drawGrinder();drawMachine();el.tFill.setAttribute('height','0');el.tFill.setAttribute('y','300');el.tKg.textContent='0 kg';
  el.liquid.setAttribute('height','0');el.crema.setAttribute('height','0');el.stream.setAttribute('opacity','0')}

/* ---------- the loop ---------- */
var last=0;
function tick(dt,now){
  var k=STEPS[S.step].k;
  /* grinding into the basket */
  if(hold.grind&&k==='dose'){
    S.dose=Math.min(26,S.dose+2.2*dt);
    if(S.tamped){S.tamped=false;S.tamp=0}
    drawGrinder();updDose();
    var rad=2.6-(S.grind-1)/9*1.8;
    for(var n=0;n<3;n++){var p=particle();if(!p)break;p.on=true;p.x=196+Math.random()*8;p.y=256;p.vy=60+Math.random()*60;p.vx=(Math.random()-.5)*20;p.el.setAttribute('r',(rad*(.7+Math.random()*.6)).toFixed(2));p.el.setAttribute('opacity','1')}
  }
  pool.forEach(function(p){
    if(!p.on)return;
    p.vy+=400*dt;p.y+=p.vy*dt;p.x+=p.vx*dt;
    var top=262-clamp(S.dose*1.15,0,30)*.85;
    if(p.y>=top){p.on=false;p.el.setAttribute('opacity','0');return}
    p.el.setAttribute('cx',p.x.toFixed(1));p.el.setAttribute('cy',p.y.toFixed(1));
  });
  /* tamping */
  var loose=300-clamp(S.dose*1.9,8,48);
  var kgShown=hold.tamp?S.tampLive:(S.tamped?S.tamp:0);
  if(hold.tamp&&k==='tamp'){
    S.tampLive=Math.min(40,S.tampLive+(10+S.tampLive*.55)*dt);
    var kb=$('#gKgBig',el.body);if(kb)kb.textContent=Math.round(S.tampLive);
    liftTamper=false;
  }
  var bedTop=loose+12*Math.min(1,kgShown/15)+.18*Math.max(0,kgShown-15);
  el.bed.setAttribute('y',bedTop.toFixed(1));el.bed.setAttribute('height',(326-bedTop).toFixed(1));
  var targetY=(hold.tamp||!liftTamper)?bedTop-200:-30;
  tamperY+=(targetY-tamperY)*Math.min(1,dt*(hold.tamp?14:6));
  el.tamper.setAttribute('transform','translate(0 '+tamperY.toFixed(1)+')');
  var fh=clamp(kgShown/35,0,1)*220;
  el.tFill.setAttribute('y',(300-fh).toFixed(1));el.tFill.setAttribute('height',fh.toFixed(1));
  el.tFill.setAttribute('fill',kgShown>=12&&kgShown<=22?'#74d58f':'#ff7a1a');
  el.tKg.textContent=Math.round(kgShown)+' kg';

  /* the shot */
  var sh=S.shot,targetBar=0;
  if(sh.run){
    sh.t+=dt;
    var m=shotModel(),ramp=clamp((sh.t-m.t0)/2,0,1);
    sh.flow=m.F*ramp;sh.w+=sh.flow*dt;
    targetBar=sh.t<m.t0?3:Math.min(10.5,8.4+Math.max(0,1.55-m.F)*.9)+Math.sin(now*9)*.08;
    var gw=$('#gW',el.body),gt=$('#gT',el.body),gr=$('#gR',el.body);
    if(gw)gw.textContent=f1(sh.w);if(gt)gt.textContent=f1(sh.t);if(gr)gr.textContent='1:'+f1(sh.w/Math.max(S.dose,1));
    if(sh.t>=60||sh.w>=90)stopShot();
    hud();
  }
  needle+=((-135+targetBar/12*270)-needle)*Math.min(1,dt*5);
  el.needle.setAttribute('transform','rotate('+needle.toFixed(1)+')');
  var flowing=sh.run&&sh.flow>.05;
  el.stream.setAttribute('opacity',flowing?'1':'0');
  if(flowing){
    var pp=sh.w/(2*Math.max(S.dose,6));
    var col=pp<.35?'#3a1a0a':pp<.85?'#8a4c1e':pp<1.15?'#b77a3e':'#e0c08a';
    var wdt=(1.4+2.2*Math.sqrt(sh.flow/1.55)).toFixed(2);
    dash-=dt*120;
    [el.s1,el.s2].forEach(function(s){s.setAttribute('stroke',col);s.setAttribute('stroke-width',wdt);s.setAttribute('stroke-dashoffset',dash.toFixed(1))});
  }
  var lh=clamp(sh.w/48,0,1)*52;
  el.liquid.setAttribute('y',(292-lh).toFixed(1));el.liquid.setAttribute('height',lh.toFixed(1));
  var ch=lh>2?Math.min(5,lh*.18):0;
  el.crema.setAttribute('y',(292-lh).toFixed(1));el.crema.setAttribute('height',ch.toFixed(1));

  /* milk */
  var mk=S.milk;
  if(hold.steam&&k==='milk'){
    mk.temp=Math.min(85,mk.temp+(6+mk.temp*.02)*dt);mk.vol=Math.min(1,mk.vol+dt*.18);
    var mb=$('#gMilkBig',el.body),mf=$('#gMilkF',el.body);if(mb)mb.textContent=Math.round(mk.temp);if(mf)mf.textContent=toF(mk.temp);
    if(Math.random()<.6){var c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('r',(3+Math.random()*5).toFixed(1));c.setAttribute('fill','#fff');el.steam.appendChild(c);steamP.push({el:c,x:44+Math.random()*16,y:232,vx:(Math.random()-.5)*16,vy:-30-Math.random()*30,a:.5})}
  }
  var mh=12+mk.vol*44;
  el.milk.setAttribute('y',(312-mh).toFixed(1));el.milk.setAttribute('height',mh.toFixed(1));
  steamP=steamP.filter(function(s){s.a-=dt*.45;s.x+=s.vx*dt;s.y+=s.vy*dt;if(s.a<=0){s.el.remove();return false}s.el.setAttribute('cx',s.x.toFixed(1));s.el.setAttribute('cy',s.y.toFixed(1));s.el.setAttribute('opacity',(s.a*.6).toFixed(2));return true});
}
function loop(now){
  requestAnimationFrame(loop);
  var dt=last?Math.min(.1,(now-last)/1000):.016;last=now;
  if(document.hidden)return;
  tick(dt,now/1000);
}

el.sound.addEventListener('click',function(){
  snd.on=!snd.on;el.sound.setAttribute('aria-pressed',String(snd.on));el.sound.textContent=snd.on?'Sound on':'Sound off';
  if(!snd.on)for(var k in snd.nodes)stopLoop(k);
});
document.addEventListener('visibilitychange',function(){if(document.hidden)stopAll()});

drawAll();render();
requestAnimationFrame(loop);
})();
