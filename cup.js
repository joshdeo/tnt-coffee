/* The drink cup. Part one turns the builder state into a recipe of coloured layers.
   Part two shoots it like a product render: a studio backdrop, real glass reflections with condensation,
   transmissive ice, latte art, piped whipped cream, glossy drizzle, rising steam and a pour stream. */
(function(){
'use strict';
var X=window.TNT,TH=window.THREE,FX=window.TNTFX;
if(!X)return;

/* ---------- colours ---------- */
var C={espresso:0x3a1c0b,crema:0x7a4a26,coffee:0x3d2210,water:0x68412a,milk:0xf3e4cb,
  choc:0x3d1e11,cocoafoam:0x8a5a3c,whitechoc:0xf0e1bd,matcha:0x7f9f3f,pistachio:0x9fbd6b,pistachiocream:0xcadba2,
  lotus:0xd49a45,caramel:0xc47a2a,condensed:0xefd7a0,vanilla:0xf0dc9c,frenchvanilla:0xeed08a,sfvanilla:0xeadfb4,
  sweetener:0xece6d2,brownsugar:0x8c5328,spiced:0x94512a,hazelnut:0xa9733b,frappeCaramel:0xc9a06a,frappeMocha:0x80563b};
var FRUIT={Strawberry:0xe4607e,Mango:0xf4a62a,Lavender:0xb89bdb,Passionfruit:0xf0b533,Watermelon:0xf0586d};
var FLAV={'Vanilla':C.vanilla,'Sugar Free Vanilla':C.sfvanilla,'Spiced Brown Sugar':C.spiced,'Sweetener':C.sweetener,'Hazelnut':C.hazelnut};
var SYR={'Vanilla':C.vanilla,'Caramel':C.caramel,'Hazelnut':C.hazelnut,'French Vanilla':C.frenchvanilla,'Brown Sugar':C.brownsugar};
var ALT={Oat:0xe8d3a6,Almond:0xebdcc2,Soy:0xefe3c0,Coconut:0xf6f1e3};

function mixHex(a,b,t){
  var ar=a>>16&255,ag=a>>8&255,ab=a&255,br=b>>16&255,bg=b>>8&255,bb=b&255;
  return (Math.round(ar+(br-ar)*t)<<16)|(Math.round(ag+(bg-ag)*t)<<8)|Math.round(ab+(bb-ab)*t);
}
X.css=function(n){return '#'+('000000'+n.toString(16)).slice(-6)};

/* ---------- recipe: builder state in, coloured layers out (bottom to top) ---------- */
X.makeRecipe=function(B){
  var b=X.getBase(B.drink),c=b.c,it=b.it,id=c.id,name=it.n;
  var kind=it.hot?(B.temp==='Iced'?'iced':'hot'):((id==='signature'||id==='frappe')?'iced':'hot');
  var iced=kind==='iced';
  var milkCol=C.milk,milkName='Milk';
  if(B.ao.milk&&ALT[B.opt.milk]){milkCol=ALT[B.opt.milk];milkName=B.opt.milk+' milk'}
  var foamCol=mixHex(milkCol,0xffffff,.45);
  var L=[],fill=.86,scale=0,drizzle=0,blend=false;
  function add(k,l,col,a){L.push({k:k,l:l,c:col,a:a})}
  function pre(k,l,col,a){L.unshift({k:k,l:l,c:col,a:a})}
  function latteStack(milkA,espA,foamA){
    if(iced){add('milk',milkName,milkCol,milkA+foamA);add('espresso','Espresso',C.espresso,espA)}
    else{add('espresso','Espresso',C.espresso,espA);add('milk',milkName,milkCol,milkA);if(foamA)add('foam','Milk foam',foamCol,foamA)}
  }

  if(id==='coffee'){
    if(name==='Espresso'){add('espresso','Espresso',C.espresso,.84);add('crema','Crema',C.crema,.16);fill=.36;scale=.6}
    else if(name==='Americano'){add('espresso','Espresso',C.espresso,.3);add('water','Hot water',C.water,.7)}
    else if(name==='Cappuccino'){add('espresso','Espresso',C.espresso,.24);add('milk',milkName,milkCol,.34);add('foam','Milk foam',foamCol,.42)}
    else if(name==='Macchiato'){add('espresso','Espresso',C.espresso,.76);add('foam','Milk foam',foamCol,.24);fill=.44;scale=.68}
    else if(name==='Cortado'){add('espresso','Espresso',C.espresso,.5);add('milk',milkName,milkCol,.5);fill=.58;scale=.76}
    else if(name==='Flat White'){add('espresso','Espresso',C.espresso,.3);add('milk',milkName,milkCol,.64);add('foam','Milk foam',foamCol,.06)}
    else if(name==='Caramel Macchiato'){add('vanilla','Vanilla syrup',C.vanilla,.12);add('milk',milkName,milkCol,.5);add('foam','Milk foam',foamCol,.13);add('espresso','Espresso',C.espresso,.25);drizzle=C.caramel}
    else{add('coffee','Brewed coffee',C.coffee,1)}
  }else if(id==='lattes'){
    if(iced)latteStack(.7,.3,0);else latteStack(.62,.22,.16);
    if(name==='French Vanilla Latte')pre('frenchvanilla','French vanilla',C.frenchvanilla,.12);
    else if(name==='Mocha Latte')pre('choc','Chocolate sauce',C.choc,.16);
    else if(name==='Salted Caramel Latte')pre('caramel','Salted caramel',C.caramel,.13);
    else if(name==='Spanish Latte')pre('condensed','Condensed milk',C.condensed,.16);
    if(B.flavour&&B.flavour!=='None'&&FLAV[B.flavour])pre('flav',B.flavour+' flavour',FLAV[B.flavour],.1);
  }else if(id==='matcha'){
    var tnt=name==='TNT Matcha';
    if(iced){add('milk',milkName,milkCol,tnt?.62:.72);add('matcha','Matcha',C.matcha,tnt?.24:.28);if(tnt)add('foam','Cream top',foamCol,.14)}
    else{add('matcha','Matcha',C.matcha,.24);add('milk',milkName,milkCol,tnt?.56:.64);add('foam','Milk foam',foamCol,tnt?.2:.12)}
    if(name==='Flavoured Matcha'&&FRUIT[B.flavour])pre('fruit',B.flavour,FRUIT[B.flavour],.14);
  }else if(id==='signature'){
    if(name==='TNT Latte'){add('milk',milkName,milkCol,.68);add('espresso','Espresso',C.espresso,.32)}
    else if(name==='Pistachio Dream'){add('pistachio','Pistachio',C.pistachio,.16);add('milk',milkName,milkCol,.6);add('pcream','Pistachio cream',C.pistachiocream,.24)}
    else if(name==='Golden Lotus'){add('lotus','Lotus',C.lotus,.16);add('milk',milkName,milkCol,.54);add('espresso','Espresso',C.espresso,.3)}
    else{add('hazelnut','Hazelnut',C.hazelnut,.13);add('milk',milkName,milkCol,.6);add('espresso','Espresso',C.espresso,.27)}
  }else if(id==='hotchoc'){
    if(name==='Dark Chocolate'){add('choc','Dark chocolate',C.choc,.86);add('cfoam','Cocoa foam',C.cocoafoam,.14)}
    else{add('wchoc','White chocolate',C.whitechoc,.86);add('foam','Milk foam',foamCol,.14)}
  }else if(id==='frappe'){
    var car=name==='Caramel Frappe';
    add(car?'caramel':'choc',car?'Caramel':'Mocha sauce',car?C.caramel:C.choc,.1);
    add('frappe','Blended frappe',car?C.frappeCaramel:C.frappeMocha,.9);
    blend=true;fill=.88;
  }

  if(B.ao.syrup&&SYR[B.opt.syrup])pre('syrup',B.opt.syrup+' syrup',SYR[B.opt.syrup],.09);
  if(B.ao.shot){
    var e=L.filter(function(l){return l.k==='espresso'})[0];
    if(e){e.a+=.12;e.l='Espresso, extra shot'}
    else{var s={k:'shot',l:'Extra shot',c:C.espresso,a:.13};if(iced)L.push(s);else L.unshift(s)}
  }
  var total=0;L.forEach(function(l){total+=l.a});
  L.forEach(function(l){l.a=l.a/total});
  var legendLayers=L.slice(),swirl=0;
  if(iced&&!blend){
    var es=L.filter(function(l){return l.k==='espresso'||l.k==='shot'});
    if(es.length&&L.length>es.length){
      es.forEach(function(l){swirl+=l.a});
      L=L.filter(function(l){return es.indexOf(l)<0});
      var t2=0;L.forEach(function(l){t2+=l.a});L.forEach(function(l){l.a=l.a/t2});
      L.forEach(function(l){if(l.k==='milk')l.c=mixHex(l.c,C.espresso,.1)});
    }
  }

  var ice=iced&&!blend,whip=!!B.ao.whip;
  if(B.ao.sauce){
    var chocy=L.some(function(l){return l.k==='choc'||l.k==='cfoam'});
    drizzle=chocy?0x4a2414:C.caramel;
  }
  if(ice)fill=Math.min(fill,.8);
  if(whip)fill=Math.min(fill,.8);
  if(!scale)scale=(B.size==='S'&&!c.single)?.9:1;

  /* latte art and dusting on hot milk drinks */
  var art=0,artBase=0x9c5b26,speck=0;
  if(!iced){
    if(id==='lattes'||id==='matcha'||name==='Cappuccino'||name==='Flat White'||name==='Cortado')art=1;
    if(id==='matcha')artBase=mixHex(C.matcha,milkCol,.25);
    else if(name==='Mocha Latte')artBase=mixHex(0x5a2e16,milkCol,.1);
    else artBase=mixHex(0x9c5b26,milkCol,.1);
    if(name==='Cappuccino')speck=.7;
    if(name==='Dark Chocolate')speck=.5;
  }

  var legend=[];
  if(whip)legend.push({l:'Whipped cream',c:0xfff3df});
  if(drizzle)legend.push({l:B.ao.sauce?'Sauce drizzle':'Caramel drizzle',c:drizzle});
  for(var i=legendLayers.length-1;i>=0;i--)legend.push({l:legendLayers[i].l,c:legendLayers[i].c});
  if(ice)legend.push({l:'Ice',c:0xcfeffc});

  return {sig:B.drink+'|'+kind,kind:kind,scale:scale,fill:fill,soft:blend?.2:(iced?.1:.17),
    layers:L,ice:ice,whip:whip,drizzle:drizzle,legend:legend,art:art,artBase:artBase,artMilk:foamCol,speck:speck,swirl:swirl};
};

/* ---------- stage ---------- */
var stage=document.getElementById('stage'),canvas=document.getElementById('cup');
if(!stage||!canvas)return;
function fallback(){
  canvas.style.display='none';
  var hint=stage.querySelector('.stage-hint');if(hint)hint.hidden=true;
  var fb=document.createElement('div');fb.className='cupfb';fb.innerHTML='<div class="cup"></div>';
  stage.appendChild(fb);
  var cupEl=fb.firstChild;
  X.cup={update:function(r){
    cupEl.innerHTML=r.layers.map(function(l){return '<div style="height:'+(l.a*r.fill*100).toFixed(1)+'%;background:'+X.css(l.c)+'"></div>'}).join('');
  },resize:function(){}};
}
if(!TH||!FX){fallback();return}
var renderer;
try{renderer=FX.renderer(canvas,{clear:0x0f0905,exposure:1.05})}catch(err){fallback();return}

var scene=new TH.Scene();
var studio=FX.studio(renderer);
scene.environment=studio.env;
scene.fog=new TH.Fog(0x0c0704,7,16);
var camera=new TH.PerspectiveCamera(32,1,.1,80);
scene.add(new TH.HemisphereLight(0xffe2c4,0x1a0c06,.5));
var keyL=new TH.DirectionalLight(0xfff0dc,2.2);keyL.position.set(-3,6,4);scene.add(keyL);
var rimL=new TH.DirectionalLight(0xff7a1a,2.2);rimL.position.set(3.5,2.5,-4);scene.add(rimL);
var LIGHT_DIR=new TH.Vector3(-3,6,4).normalize();

/* studio backdrop and floor */
scene.add(new TH.Mesh(new TH.SphereGeometry(40,48,24),new TH.ShaderMaterial({
  uniforms:{uTop:{value:new TH.Color(0x170e08)},uBot:{value:new TH.Color(0x0c0704)},uGlow:{value:new TH.Color(0xff6a14)}},
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 uTop,uBot,uGlow;varying vec3 vD;void main(){vec3 d=normalize(vD);vec3 c=mix(uBot,uTop,smoothstep(-.1,.5,d.y));float g=pow(max(dot(d,normalize(vec3(0.,.35,-1.))),0.),5.)*smoothstep(.02,.3,d.y);c+=uGlow*g*.11;gl_FragColor=linearToOutputTexel(vec4(c,1.));}',
  side:TH.BackSide,depthWrite:false,fog:false})));
var floor=new TH.Mesh(new TH.CircleGeometry(16,64),new TH.MeshPhysicalMaterial({color:0x140c07,roughness:.38,clearcoat:.6,clearcoatRoughness:.3}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.075;scene.add(floor);

var rig=new TH.Group();scene.add(rig);
var shTex=FX.canvasTex(256,256,function(c,w,h){var g=c.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'rgba(0,0,0,.85)');g.addColorStop(.5,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h)});
var contact=new TH.Mesh(new TH.PlaneGeometry(4.2,4.2),new TH.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false}));
contact.rotation.x=-Math.PI/2;contact.position.y=-.06;rig.add(contact);
var coaster=new TH.Mesh(new TH.CylinderGeometry(1.5,1.54,.07,72),new TH.MeshPhysicalMaterial({color:0x1b1613,roughness:.55,clearcoat:.4,clearcoatRoughness:.4}));
coaster.position.y=-.036;rig.add(coaster);
var ring=new TH.Mesh(new TH.TorusGeometry(1.5,.016,10,96),new TH.MeshBasicMaterial({color:new TH.Color(0xff7a1a).multiplyScalar(3.2),toneMapped:false}));
ring.rotation.x=Math.PI/2;ring.position.y=.0;rig.add(ring);

/* ---------- shaders ---------- */
var glassV='varying vec3 vWP;varying vec3 vN;varying vec3 vL;void main(){vL=position;vec4 w=modelMatrix*vec4(position,1.);vWP=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}';
var glassF=[
'uniform samplerCube uEnv;uniform float uFrost;uniform float uK;uniform vec3 uTint;',
'varying vec3 vWP;varying vec3 vN;varying vec3 vL;',
'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
'void main(){',
' vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;',
' vec3 V=normalize(cameraPosition-vWP);',
' float drop=0.;vec3 Np=N;',
' if(uFrost>0.){',
'  vec2 cu=vec2(atan(vL.x,vL.z)*2.4,vL.y*2.6)*6.;',
'  vec2 cell=floor(cu);vec2 f=fract(cu)-.5;',
'  float h=hash(cell);vec2 off=vec2(hash(cell+1.7),hash(cell+3.1))-.5;',
'  float rr=.14+.26*h;vec2 dv=f-off*.45;float dd=length(dv)/rr;',
'  float m=step(.66,h)*(1.-smoothstep(.8,1.,dd))*smoothstep(.15,.6,vL.y)*(1.-smoothstep(2.1,2.5,vL.y));',
'  vec2 cu2=cu*2.7+3.;vec2 c2=floor(cu2);vec2 f2=fract(cu2)-.5;float h2=hash(c2);float m2=step(.86,h2)*(1.-smoothstep(.6,1.,length(f2)/(.18+.15*h2)));',
'  drop=max(m,m2*.7)*uFrost;',
'  vec3 T=normalize(cross(vec3(0.,1.,0.),N));vec3 Bt=vec3(0.,1.,0.);',
'  vec2 dn=m>m2*.7?dv/rr:f2/(.18+.15*h2);',
'  Np=normalize(N-(T*dn.x+Bt*dn.y)*drop*.9);',
' }',
' vec3 R=reflect(-V,Np);',
' vec3 env=textureCube(uEnv,R).rgb;',
' float ndv=clamp(abs(dot(Np,V)),0.,1.);',
' float F=.04+.7*pow(1.-ndv,4.);',
' vec3 col=env*F*uK;',
' col+=env*drop*.18+pow(max(dot(R,normalize(vec3(-.5,.6,.6))),0.),60.)*drop*.6;',
' col+=uTint*(.015+uFrost*.025);',
'#ifdef TONE_MAPPING',' col=toneMapping(col);','#endif',
' gl_FragColor=linearToOutputTexel(vec4(col,1.));',
'}'].join('\n');
var liqV='varying vec3 vP;varying vec3 vWP;varying vec3 vN;void main(){vP=position;vec4 w=modelMatrix*vec4(position,1.);vWP=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}';
var liqF=[
'uniform vec3 uCol[8];uniform float uB[8];uniform float uSoft;uniform float uLevel;uniform float uBottom;uniform samplerCube uEnv;uniform vec3 uL;uniform float uSwirl;uniform vec3 uSwirlCol;uniform float uTime;',
'varying vec3 vP;varying vec3 vWP;varying vec3 vN;',
'float h31(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
'float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h31(i),h31(i+vec3(1.,0.,0.)),f.x),mix(h31(i+vec3(0.,1.,0.)),h31(i+vec3(1.,1.,0.)),f.x),f.y),mix(mix(h31(i+vec3(0.,0.,1.)),h31(i+vec3(1.,0.,1.)),f.x),mix(h31(i+vec3(0.,1.,1.)),h31(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}',
'float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}',
'void main(){',
' if(vP.y>uLevel)discard;',
' float h=clamp((vP.y-uBottom)/max(uLevel-uBottom,.001),0.,1.);',
' vec3 c=uCol[0];',
' for(int i=0;i<7;i++){float m=smoothstep(uB[i]-uSoft,uB[i]+uSoft,h);c=mix(c,uCol[i+1],m);}',
' if(uSwirl>.001){',
'  vec3 q=vec3(vP.x*1.9,vP.y*1.5-uTime*.035,vP.z*1.9);',
'  float w=fbm(q*1.3+vec3(0.,uTime*.02,0.));',
'  float n=fbm(q+vec3(w*1.7,w*.9,w*1.3));',
'  float top=smoothstep(.0,1.,h);float amt=clamp(uSwirl*2.6,0.,1.);',
'  c=mix(c,uSwirlCol,amt*.3*(.3+.7*top));',
'  float st=smoothstep(.46,.6,n+.16*top-.1);',
'  c=mix(c,uSwirlCol,st*amt*(.2+.6*top));',
' }',
' vec3 N=normalize(vN);vec3 V=normalize(cameraPosition-vWP);',
' float ndv=max(dot(N,V),0.);',
' float diff=.55+.4*max(dot(N,uL),0.);',
' float lum=dot(c,vec3(.3,.6,.1));',
' vec3 col=c*diff*(.82+.18*ndv)+c*(1.-ndv)*(.12+lum*.18);',
' vec3 env=textureCube(uEnv,reflect(-V,N)).rgb;',
' col+=env*(.02+.5*pow(1.-ndv,5.));',
' col*=.8+.2*h;',
'#ifdef TONE_MAPPING',' col=toneMapping(col);','#endif',
' gl_FragColor=linearToOutputTexel(vec4(col,1.));',
'}'].join('\n');

/* animated colour state shared by both cups */
var cols=[],tC=[],bArr=[],tB=[];
for(var q=0;q<8;q++){cols.push(new TH.Color(0x2b1509));tC.push(new TH.Color(0x2b1509));bArr.push(2);tB.push(2)}

var hasRB=!!TH.RoundedBoxGeometry,rnd=FX.rng(7),swirlCol=new TH.Color(C.espresso);
var iceMat=new TH.MeshPhysicalMaterial({color:0xf4fbff,transmission:.55,thickness:.25,roughness:.16,ior:1.31,clearcoat:1,clearcoatRoughness:.05,specularIntensity:1,envMapIntensity:1.6,sheen:.4,sheenColor:new TH.Color(0xe8f6ff)});
var strawTex=FX.canvasTex(64,64,function(c,w,h){c.fillStyle='#ff7a1a';c.fillRect(0,0,w,h);c.fillStyle='#f6ead6';for(var k=-2;k<4;k++){c.beginPath();c.moveTo(k*32,0);c.lineTo(k*32+16,0);c.lineTo(k*32+48,h);c.lineTo(k*32+32,h);c.fill()}});
strawTex.wrapS=strawTex.wrapT=TH.RepeatWrapping;strawTex.repeat.set(1,9);
var stickerTex=FX.canvasTex(512,512,function(c,w,h){
  c.fillStyle='#fbf7ef';c.beginPath();c.arc(256,256,240,0,7);c.fill();
  c.strokeStyle='rgba(0,0,0,.08)';c.lineWidth=4;c.stroke();
  FX.drawLogo(c,256,330,.95);
});

function buildCup(kind){
  var g=new TH.Group(),outer,inner;
  if(kind==='iced'){
    outer=[[0,0],[.62,0],[.66,.06],[.99,2.6],[.93,2.6],[.6,.14],[.57,.1],[0,.1]];
    inner=[[0,.1],[.57,.1],[.6,.14],[.93,2.6]];
  }else{
    outer=[[0,0],[.82,0],[.88,.05],[.94,.4],[.98,1.6],[1,2.25],[.93,2.25],[.91,1.6],[.87,.4],[.8,.16],[0,.16]];
    inner=[[0,.16],[.8,.16],[.87,.4],[.91,1.6],[.93,2.25]];
  }
  var yb=inner[0][1],yt=inner[inner.length-1][1];
  function rAt(y){
    for(var i=1;i<inner.length;i++){
      if(y<=inner[i][1]||i===inner.length-1){
        var a=inner[i-1],b=inner[i],t=b[1]===a[1]?0:(y-a[1])/(b[1]-a[1]);
        t=Math.max(0,Math.min(1,t));return a[0]+(b[0]-a[0])*t;
      }
    }
    return 0;
  }
  function glassMat(frost,k){
    return new TH.ShaderMaterial({uniforms:{uEnv:{value:studio.cube},uFrost:{value:frost},uK:{value:k},uTint:{value:new TH.Color(0xffe8d0)}},
      vertexShader:glassV,fragmentShader:glassF,transparent:true,depthWrite:false,side:TH.DoubleSide,blending:TH.AdditiveBlending});
  }
  var glass=new TH.Mesh(new TH.LatheGeometry(outer.map(function(p){return new TH.Vector2(p[0],p[1])}),96),glassMat(kind==='iced'?1:0,1.05));
  glass.renderOrder=8;g.add(glass);
  if(kind==='hot'){
    var handle=new TH.Mesh(new TH.TorusGeometry(.5,.085,20,48,Math.PI),glassMat(0,1.2));
    handle.rotation.z=-Math.PI/2;handle.position.set(.97,1.15,0);handle.scale.set(1,1.1,1);handle.renderOrder=8;g.add(handle);
  }
  var mat=new TH.ShaderMaterial({
    uniforms:{uCol:{value:cols},uB:{value:bArr},uSoft:{value:.09},uLevel:{value:yb},uBottom:{value:yb},uEnv:{value:studio.cube},uL:{value:LIGHT_DIR},uSwirl:{value:0},uSwirlCol:{value:swirlCol},uTime:{value:0}},
    vertexShader:liqV,fragmentShader:liqF});
  var liquid=new TH.Mesh(new TH.LatheGeometry(inner.map(function(p){return new TH.Vector2(p[0]*.985,p[1])}),96),mat);
  g.add(liquid);
  var art=FX.latteArt({art:0,foam:1});
  var capGeo=new TH.CircleGeometry(1,72);capGeo.rotateX(-Math.PI/2);
  var cap=new TH.Mesh(capGeo,art);g.add(cap);
  var o={g:g,yb:yb,yt:yt,r:rAt,mat:mat,cap:cap,art:art};

  var stream=new TH.Mesh(new TH.CylinderGeometry(1,1,1,16,1,true),new TH.MeshPhysicalMaterial({color:0xffffff,roughness:.12,clearcoat:1}));
  stream.visible=false;g.add(stream);o.stream=stream;

  if(kind==='iced'){
    var straw=new TH.Mesh(new TH.CylinderGeometry(.058,.058,3.1,20,1,true),new TH.MeshPhysicalMaterial({map:strawTex,roughness:.35,clearcoat:.8,clearcoatRoughness:.1,side:TH.DoubleSide}));
    straw.position.set(.05,1.7,0);straw.rotation.z=-.13;g.add(straw);
    /* round sticker on the front, like the cups in the shop */
    var sy0=.85,sy1=1.75,seg=[];
    for(var k=0;k<=12;k++){var yy=sy0+k/12*(sy1-sy0);seg.push(new TH.Vector2(rAt(yy)+.075,yy))}
    var sticker=new TH.Mesh(new TH.LatheGeometry(seg,48,-.5,1.0),new TH.MeshPhysicalMaterial({map:stickerTex,transparent:true,alphaTest:.5,roughness:.45,clearcoat:.6}));
    sticker.renderOrder=9;g.add(sticker);
    var cubeGeo=hasRB?new TH.RoundedBoxGeometry(.42,.42,.42,4,.07):new TH.BoxGeometry(.42,.42,.42);
    o.cubes=[];
    for(var i=0;i<7;i++){
      var m=new TH.Mesh(cubeGeo,iceMat);
      m.rotation.set(rnd()*3,rnd()*3,rnd()*3);g.add(m);
      o.cubes.push({m:m,a:rnd()*6.28,f:.1+rnd()*.6,dy:-.32+rnd()*.38,ph:rnd()*6.28,sp:(rnd()-.5)*.4});
    }
  }else{
    var st=FX.Steam({count:3,width:.95,height:2.6,strength:.7,wind:3.2,seed:.11});
    g.add(st.group);o.steam=st;
  }
  return o;
}
var iced=buildCup('iced'),hot=buildCup('hot');
rig.add(iced.g);rig.add(hot.g);

/* piped whipped cream: star tip ridges twisting up three tiers */
function whipGeo(){
  var H=56,S=72,pos=[],idx=[];
  function env(t){return (1-Math.pow(t,1.5))*(1+.12*Math.sin(t*Math.PI*3.2))}
  for(var i=0;i<=H;i++){
    var t=i/H;
    for(var j=0;j<S;j++){
      var th=j/S*Math.PI*2,r=env(t)*(1+.13*Math.cos(8*(th+t*2.2)));
      pos.push(r*Math.cos(th),t,r*Math.sin(th));
    }
  }
  var apex=pos.length/3;pos.push(0,1.03,0);
  var bottom=pos.length/3;pos.push(0,0,0);
  for(var a=0;a<H;a++)for(var b2=0;b2<S;b2++){
    var p0=a*S+b2,p1=a*S+(b2+1)%S,p2=(a+1)*S+b2,p3=(a+1)*S+(b2+1)%S;
    idx.push(p0,p2,p3,p0,p3,p1);
  }
  for(var c2=0;c2<S;c2++){idx.push(H*S+c2,apex,H*S+(c2+1)%S);idx.push(bottom,c2,(c2+1)%S)}
  var g=new TH.BufferGeometry();g.setAttribute('position',new TH.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  return {geo:g,env:env};
}
var W=whipGeo();
var whip=new TH.Mesh(W.geo,new TH.MeshPhysicalMaterial({color:0xfff5e6,roughness:.62,sheen:.8,sheenRoughness:.5,sheenColor:new TH.Color(0xffffff),clearcoat:.15}));
rig.add(whip);
var spiral=[];
for(var s=0;s<=120;s++){
  var tt=.04+s/120*.9,ang=tt*Math.PI*2*3.4,rr=W.env(tt)*(1+.13*Math.cos(8*(ang+tt*2.2)))+.035;
  spiral.push(new TH.Vector3(Math.cos(ang)*rr,tt+.01,Math.sin(ang)*rr));
}
var drizMat=new TH.MeshPhysicalMaterial({color:C.caramel,roughness:.16,clearcoat:1,clearcoatRoughness:.04});
var driz=new TH.Mesh(new TH.TubeGeometry(new TH.CatmullRomCurve3(spiral),240,.035,10,false),drizMat);
rig.add(driz);

/* ---------- post ---------- */
var post=FX.post(renderer,scene,camera,{bloom:{strength:.42,radius:.45,threshold:.88},vignette:.42,grain:.028});

/* ---------- animated state ---------- */
var S={soft:.09,level:0,scale:1,ice:0,whip:0,driz:0,art:0,speck:0,swirl:0};
var tSoft=.09,tFill=.86,tScale=1,tIce=0,tWhip=0,tDriz=0,tArt=0,tSpeck=0,tSwirl=0,drizTarget=new TH.Color(C.caramel);
var artBaseT=new TH.Color(0x9c5b26),artMilkT=new TH.Color(0xf6ead6);
var kind='iced',cur=null,visible=true,clock=0;
var pour={t:0,d:1,color:new TH.Color(0xffffff)};
var drag=0,dragging=false,lastX=0,idle=0;
var tmp=new TH.Color(),edgeTmp=new TH.Color();

function sstep(a,b,x){var t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}

function update(r){
  var prev=cur;cur=r;
  var n=r.layers.length,cum=0;
  for(var i=0;i<8;i++){
    if(i<n){cum+=r.layers[i].a;tC[i].set(r.layers[i].c);tB[i]=i<n-1?cum:2}
    else{tC[i].set(r.layers[n-1].c);tB[i]=2}
  }
  tSoft=r.soft;tFill=r.fill;tScale=r.scale;tIce=r.ice?1:0;tWhip=r.whip?1:0;tDriz=r.drizzle?1:0;
  tArt=r.art;tSpeck=r.speck;tSwirl=r.swirl||0;artBaseT.set(r.artBase);artMilkT.set(r.artMilk);
  if(r.drizzle)drizTarget.set(r.drizzle);
  var dom=r.layers.reduce(function(a,l){return l.a>a.a?l:a},r.layers[0]);
  if(!prev||prev.sig!==r.sig){
    if(prev&&prev.kind!==r.kind)S.scale=r.scale*.82;
    kind=r.kind;
    for(var k=0;k<8;k++){cols[k].copy(tC[k]);bArr[k]=tB[k]}
    S.level=prev?.04:.03;S.art=0;S.swirl=0;
    startPour(dom.c,1.4);
  }else{
    var had={};prev.layers.forEach(function(l){had[l.k]=1});
    var added=r.layers.filter(function(l){return !had[l.k]});
    if(added.length)startPour(added[added.length-1].c,.9);
    else if(r.whip&&!prev.whip)startPour(0xfff3df,.7);
    else if((r.swirl||0)>(prev.swirl||0)+.01)startPour(C.espresso,.9);
  }
  if(X.reduced)redraw();
}
function startPour(c,d){pour.color.set(c);pour.t=d;pour.d=d}

function step(dt,t){
  var k=1-Math.exp(-dt*5),kl=1-Math.exp(-dt*3),ks=1-Math.exp(-dt*4);
  for(var i=0;i<8;i++){cols[i].lerp(tC[i],k);bArr[i]+=(tB[i]-bArr[i])*k}
  S.soft+=(tSoft-S.soft)*k;
  S.level+=(tFill-S.level)*kl;
  S.scale+=(tScale-S.scale)*(1-Math.exp(-dt*6));
  S.ice+=(tIce-S.ice)*ks;S.whip+=(tWhip-S.whip)*ks;S.driz+=(tDriz-S.driz)*ks;
  var artReady=S.level>tFill-.08?tArt:0;
  S.art+=(artReady-S.art)*(1-Math.exp(-dt*2.5));S.speck+=(tSpeck-S.speck)*ks;
  S.swirl+=(tSwirl*Math.min(1,S.level/Math.max(.1,tFill))-S.swirl)*(1-Math.exp(-dt*2));
  drizMat.color.lerp(drizTarget,k);

  var isIced=kind==='iced',act=isIced?iced:hot;
  iced.g.visible=isIced;hot.g.visible=!isIced;
  act.g.scale.setScalar(S.scale);
  var ly=act.yb+S.level*(act.yt-act.yb);
  act.mat.uniforms.uLevel.value=ly;act.mat.uniforms.uBottom.value=act.yb;act.mat.uniforms.uSoft.value=S.soft;
  act.mat.uniforms.uSwirl.value=S.swirl;act.mat.uniforms.uTime.value=t;

  /* surface: top band colour, or crema with art once the cup is full */
  tmp.copy(cols[0]);
  for(var j=0;j<7;j++)tmp.lerp(cols[j+1],sstep(bArr[j]-S.soft,bArr[j]+S.soft,1));
  var au=act.art.uniforms;
  au.uBase.value.copy(tmp).lerp(artBaseT,S.art);
  if(S.swirl>.001)au.uBase.value.lerp(swirlCol,Math.min(1,S.swirl*2.6)*.5);
  au.uMilk.value.copy(artMilkT);
  edgeTmp.copy(au.uBase.value).multiplyScalar(.62);au.uEdge.value.copy(edgeTmp);
  au.uArt.value=S.art;au.uSpeck.value=S.speck;au.uTime.value=t;au.uEdgeK.value=.35+S.art*.65;
  var rr=act.r(ly);
  act.cap.position.y=ly;act.cap.scale.set(rr*.985,1,rr*.985);

  var rw=rr*.82*S.scale;
  whip.visible=S.whip>.02;
  whip.position.y=ly*S.scale-.02;
  whip.scale.set(rw*S.whip,.8*S.whip*S.scale,rw*S.whip);
  driz.visible=S.driz>.02;
  driz.position.y=ly*S.scale+.01;
  driz.scale.set(rw*S.driz,(.8*S.whip+.02)*S.driz*S.scale,rw*S.driz);

  if(act.cubes){
    var show=S.ice>.02&&S.level>.25;
    for(var c=0;c<act.cubes.length;c++){
      var cb=act.cubes[c],m=cb.m;
      m.visible=show;if(!show)continue;
      var y=ly+cb.dy+Math.sin(t*.9+cb.ph)*.035;
      var r2=Math.max(0,act.r(Math.min(Math.max(y,act.yb),act.yt))-.32)*cb.f/.7;
      m.position.set(Math.cos(cb.a)*r2,y,Math.sin(cb.a)*r2);
      m.scale.setScalar(S.ice);
      m.rotation.y+=cb.sp*dt;
    }
  }
  if(act.steam){
    var power=Math.max(0,Math.min(1,(S.level-.3)/.4));
    act.steam.group.position.y=ly+(S.whip>.3?.62:.02);
    act.steam.update(t);act.steam.strength(power);
  }

  var sm=act.stream;
  if(pour.t>0){
    pour.t-=dt;
    var pr=Math.min(1,1-pour.t/pour.d),topY=act.yt+1.1;
    sm.visible=pr<1;
    if(sm.visible){
      var w=(.05+.018*Math.sin(pr*Math.PI))*Math.min(1,pr*10,(1-pr)*10);
      sm.material.color.copy(pour.color);
      sm.scale.set(Math.max(.002,w),topY-ly,Math.max(.002,w));
      sm.position.set(Math.sin(t*9)*.006,(topY+ly)/2,0);
    }
  }else{sm.visible=false}

  if(!dragging){idle+=dt;if(idle>2.5)drag*=Math.exp(-dt*1.4)}
  var sway=X.reduced?0:Math.sin(t*.45)*.42;
  rig.rotation.y=(isIced?.15:-.25)+drag+sway;
  rig.position.y=X.reduced?0:Math.sin(t*1.1)*.025;
}
function draw(t,dt){if(post)post.render(t,dt);else renderer.render(scene,camera)}
function redraw(){step(10,clock);draw(clock,.016)}

function resize(){
  var w=stage.clientWidth,h=stage.clientHeight;
  if(!w||!h)return;
  var pr=Math.min(window.devicePixelRatio||1,FX.tier===0?1.5:2);
  renderer.setPixelRatio(pr);
  renderer.setSize(w,h,false);
  if(post)post.setSize(w,h,pr);
  camera.aspect=w/h;camera.updateProjectionMatrix();
  var d=Math.max(7.9,3.8/(2*Math.tan(16*Math.PI/180)*camera.aspect));
  var el=21*Math.PI/180;
  camera.position.set(0,1.42+d*Math.sin(el),d*Math.cos(el));
  camera.lookAt(0,1.38,0);
  if(X.reduced||!visible)redraw();
}

canvas.addEventListener('pointerdown',function(e){
  dragging=true;lastX=e.clientX;idle=0;
  try{canvas.setPointerCapture(e.pointerId)}catch(x){}
});
canvas.addEventListener('pointermove',function(e){
  if(!dragging)return;
  drag+=(e.clientX-lastX)*.012;lastX=e.clientX;idle=0;
  if(X.reduced)redraw();
});
['pointerup','pointercancel','lostpointercapture'].forEach(function(n){
  canvas.addEventListener(n,function(){dragging=false});
});

try{new ResizeObserver(resize).observe(stage)}catch(e1){window.addEventListener('resize',resize)}
try{
  new IntersectionObserver(function(en){visible=en[0].isIntersecting;if(visible&&X.reduced)redraw()}).observe(stage);
}catch(e2){}

if(!X.reduced){
  X.hooks.push(function(time,dt){
    if(!visible)return;
    clock=time/1000;
    step(dt,clock);draw(clock,dt);
  });
}
X.cup={update:update,resize:resize,settle:function(){pour.t=0;S.level=tFill;S.art=tArt;S.swirl=tSwirl;step(10,clock);draw(clock,.016)}};
resize();
})();
