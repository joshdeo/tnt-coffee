/* Opening fly-in: a golden hour model of TNT Cup Coffee at 25 Dundas St W, built from the storefront photo.
   Wood band, cream pill sign, green ribbed siding, warm windows, striped umbrellas, planters, string lights.
   The camera drops from a drone view to the street, pushes through the door and flashes into the site. */
(function(){
'use strict';
var root=document.getElementById('intro');
var X=window.TNT=window.TNT||{};
X.replayIntro=function(){try{sessionStorage.removeItem('tnt.intro')}catch(e){}location.reload()};
if(!root)return;
var TH=window.THREE,FX=window.TNTFX;
function announceDone(){
  X.introActive=false;
  document.documentElement.classList.remove('intro-on');
  try{window.dispatchEvent(new Event('tnt:introdone'))}catch(e){}
}
if(root.hidden||!TH||!FX){if(root.parentNode)root.parentNode.removeChild(root);announceDone();return}
X.introActive=true;X.introStarted=true;

var canvas=document.getElementById('introCanvas');
var renderer;
try{renderer=FX.renderer(canvas,{clear:0x000000,exposure:1.0})}catch(e){root.parentNode.removeChild(root);announceDone();return}
var PR=Math.min(window.devicePixelRatio||1,FX.tier===2?1.5:FX.tier===1?1.2:1);
renderer.setPixelRatio(PR);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=TH.PCFSoftShadowMap;

var scene=new TH.Scene();
var camera=new TH.PerspectiveCamera(42,1,.25,420);
var rnd=FX.rng(5);
var post=null,anim=[];

/* ---------- textures ---------- */
function noisy(w,h,base,amt,seed,extra){
  return FX.canvasTex(w,h,function(c){
    c.fillStyle=base;c.fillRect(0,0,w,h);
    var id=c.getImageData(0,0,w,h),d=id.data,r=FX.rng(seed);
    for(var i=0;i<d.length;i+=4){var n=(r()-.5)*amt;d[i]+=n;d[i+1]+=n;d[i+2]+=n}
    c.putImageData(id,0,0);
    if(extra)extra(c,w,h,r);
  });
}
function rep(t,x,y){t.wrapS=t.wrapT=TH.RepeatWrapping;t.repeat.set(x,y);return t}
function woodTex(){
  return FX.canvasTex(512,512,function(c,w,h){
    var r=FX.rng(9),ph=32;
    for(var y=0;y<h;y+=ph){
      var tone=r();
      c.fillStyle='hsl('+(20+tone*7)+',48%,'+(25+tone*9)+'%)';c.fillRect(0,y,w,ph);
      for(var k=0;k<12;k++){
        c.strokeStyle='rgba(38,16,5,'+(.12+r()*.25)+')';c.lineWidth=.6+r()*1.3;
        c.beginPath();var yy=y+r()*ph;c.moveTo(0,yy);
        for(var x=0;x<=w;x+=32)c.lineTo(x,yy+Math.sin(x*.02+k)*1.4+(r()-.5));
        c.stroke();
      }
      c.fillStyle='rgba(18,7,2,.75)';c.fillRect(0,y+ph-2,w,2);
      c.fillRect(Math.floor(r()*w),y,2,ph);
    }
  });
}
function sidingTex(bump){
  return FX.canvasTex(256,64,function(c,w,h){
    for(var x=0;x<w;x+=16){
      var g=c.createLinearGradient(x,0,x+16,0);
      if(bump){g.addColorStop(0,'#000');g.addColorStop(.25,'#fff');g.addColorStop(.55,'#fff');g.addColorStop(.8,'#222');g.addColorStop(1,'#000')}
      else{g.addColorStop(0,'#123321');g.addColorStop(.3,'#2c6a49');g.addColorStop(.6,'#22573b');g.addColorStop(1,'#10291b')}
      c.fillStyle=g;c.fillRect(x,0,16,h);
    }
  },{color:!bump});
}
function interiorTex(seed){
  return FX.canvasTex(1024,512,function(c,w,h){
    var r=FX.rng(seed||3);
    var g=c.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#ffd9a2');g.addColorStop(.45,'#e39a58');g.addColorStop(1,'#5a2a12');
    c.fillStyle=g;c.fillRect(0,0,w,h);
    c.fillStyle='rgba(60,28,10,.55)';
    for(var s=0;s<3;s++){c.fillRect(40,150+s*55,w-80,8)}
    for(var q=0;q<40;q++){c.fillStyle='hsla('+(15+r()*30)+',60%,'+(25+r()*40)+'%,.9)';c.fillRect(50+r()*(w-100),118+Math.floor(r()*3)*55+20,10+r()*16,16+r()*14)}
    c.fillStyle='#3a1a0b';c.fillRect(0,330,w*.62,120);
    c.fillStyle='#c8c3bc';c.fillRect(120,280,120,52);c.fillStyle='#8a857f';c.fillRect(130,290,100,10);
    for(var p=0;p<7;p++){
      var x=70+p*150,yb=70;
      c.strokeStyle='rgba(30,12,4,.8)';c.lineWidth=2;c.beginPath();c.moveTo(x,0);c.lineTo(x,yb-12);c.stroke();
      var gl=c.createRadialGradient(x,yb,0,x,yb,70);gl.addColorStop(0,'rgba(255,250,230,1)');gl.addColorStop(.25,'rgba(255,214,150,.75)');gl.addColorStop(1,'rgba(255,190,110,0)');
      c.fillStyle=gl;c.beginPath();c.arc(x,yb,70,0,7);c.fill();
      c.fillStyle='#2a1208';c.beginPath();c.moveTo(x-18,yb-8);c.lineTo(x+18,yb-8);c.lineTo(x+10,yb-20);c.lineTo(x-10,yb-20);c.fill();
    }
    c.fillStyle='rgba(25,10,4,.85)';
    [[700,360],[780,350],[880,365],[560,372]].forEach(function(o){c.beginPath();c.arc(o[0],o[1],20,0,7);c.fill();c.beginPath();c.ellipse(o[0],o[1]+70,38,55,0,0,7);c.fill()});
    c.fillStyle='#2f5a2a';[[30,300],[990,300]].forEach(function(o){c.beginPath();c.arc(o[0],o[1],46,0,7);c.fill()});
  });
}
function umbrellaTex(){
  return FX.canvasTex(512,32,function(c,w,h){
    for(var i=0;i<8;i++){c.fillStyle=i%2?'#f1e8d4':'#1d5a3a';c.fillRect(i*w/8,0,w/8+1,h)}
  });
}
function signTex(text,bg){
  return FX.canvasTex(512,128,function(c,w,h){
    c.fillStyle=bg;c.fillRect(0,0,w,h);
    c.strokeStyle='#fff';c.lineWidth=6;c.strokeRect(8,8,w-16,h-16);
    c.fillStyle='#fff';c.font='700 74px "Barlow Condensed", "Arial Narrow", sans-serif';c.textAlign='center';c.textBaseline='middle';
    c.fillText(text,w/2,h/2+4);
  });
}
function badgeTex(){
  return FX.canvasTex(256,256,function(c,w,h){
    c.fillStyle='#2a160c';c.beginPath();c.arc(128,128,128,0,7);c.fill();
    c.strokeStyle='#d9a441';c.lineWidth=12;c.beginPath();c.arc(128,128,112,0,7);c.stroke();
    c.save();c.translate(128,128);c.rotate(-.6);
    c.fillStyle='#e0b25a';c.beginPath();c.ellipse(0,0,40,62,0,0,7);c.fill();
    c.strokeStyle='#2a160c';c.lineWidth=8;c.beginPath();c.moveTo(0,-56);c.bezierCurveTo(-18,-20,18,20,0,56);c.stroke();
    c.restore();
  });
}

/* ---------- materials ---------- */
var M={};
function buildMaterials(){
  M.wood=new TH.MeshStandardMaterial({map:rep(woodTex(),5,.5),roughness:.75});
  M.woodSmall=new TH.MeshStandardMaterial({map:rep(woodTex(),1,.25),roughness:.8});
  M.siding=new TH.MeshStandardMaterial({map:rep(sidingTex(false),3.5,1),bumpMap:rep(sidingTex(true),3.5,1),bumpScale:.03,roughness:.55,metalness:.25});
  M.cream=new TH.MeshStandardMaterial({color:0xe8d4aa,roughness:.5});
  M.trim=new TH.MeshStandardMaterial({color:0x2a160c,roughness:.6});
  M.roof=new TH.MeshStandardMaterial({map:rep(noisy(256,256,'#8f8d88',22,4),6,4),roughness:.95});
  M.concrete=new TH.MeshStandardMaterial({map:rep(noisy(512,512,'#b7afa2',26,6,function(c,w,h){c.fillStyle='rgba(70,60,50,.35)';for(var x=0;x<w;x+=128)c.fillRect(x,0,2,h);c.fillRect(0,h/2,w,2)}),30,2),roughness:.92});
  M.asphalt=new TH.MeshStandardMaterial({map:rep(noisy(512,512,'#2c2b2a',30,7),24,2),roughness:.9});
  M.lot=new TH.MeshStandardMaterial({map:rep(noisy(512,512,'#3a3836',28,8),3,3),roughness:.9});
  M.turf=new TH.MeshStandardMaterial({map:rep(noisy(256,256,'#3f6e2a',50,9),8,3),roughness:1});
  M.grass=new TH.MeshStandardMaterial({map:rep(noisy(512,512,'#4d6a26',40,10,function(c,w,h,r){for(var i=0;i<60;i++){c.fillStyle='rgba('+(r()>.5?'30,52,16':'96,118,48')+','+(.08+r()*.12)+')';c.beginPath();c.arc(r()*w,r()*h,20+r()*70,0,7);c.fill()}}),40,40),roughness:1});
  M.brick=new TH.MeshStandardMaterial({map:rep(noisy(512,512,'#e9e4da',14,11,function(c,w,h){c.fillStyle='rgba(150,140,128,.45)';for(var y=0;y<h;y+=16){c.fillRect(0,y,w,2);for(var x=(y/16)%2?0:24;x<w;x+=48)c.fillRect(x,y,2,16)}}),4,3),roughness:.85});
  M.glassDark=new TH.MeshStandardMaterial({color:0x1a2632,roughness:.06,metalness:.4});
  M.frameWhite=new TH.MeshStandardMaterial({color:0xf2f0ea,roughness:.5});
  M.metal=new TH.MeshStandardMaterial({color:0x8d918f,roughness:.4,metalness:.7});
  M.poleWood=new TH.MeshStandardMaterial({color:0x4a3a2c,roughness:.9});
  M.leaf=new TH.MeshStandardMaterial({color:0x3e5c22,roughness:.85});
  M.leafDark=new TH.MeshStandardMaterial({color:0x2c4a1e,roughness:.9});
  M.trunk=new TH.MeshStandardMaterial({color:0x4b3626,roughness:.95});
  M.umbrella=new TH.MeshStandardMaterial({map:umbrellaTex(),roughness:.85,side:TH.DoubleSide});
  M.black=new TH.MeshStandardMaterial({color:0x111111,roughness:.5});
  M.yellow=new TH.MeshBasicMaterial({color:0xd9a520});
  M.white=new TH.MeshBasicMaterial({color:0xd8d6d0});
  M.car=new TH.MeshPhysicalMaterial({color:0x1b2436,roughness:.25,metalness:.6,clearcoat:1,clearcoatRoughness:.05});
  M.window=new TH.MeshStandardMaterial({color:0x0c0a08,roughness:.08,metalness:.1,emissive:0xffffff,emissiveMap:interiorTex(3),emissiveIntensity:1.5});
  M.doorGlass=new TH.MeshStandardMaterial({color:0x0c0a08,roughness:.08,metalness:.1,emissive:0xffffff,emissiveMap:interiorTex(8),emissiveIntensity:1.3});
  [M.concrete,M.asphalt,M.grass,M.lot,M.turf].forEach(function(m){m.map.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy())});
}

/* ---------- helpers ---------- */
function add(geo,mat,x,y,z,o){
  var m=new TH.Mesh(geo,mat);m.position.set(x,y,z);
  o=o||{};m.castShadow=o.cast!==false;m.receiveShadow=o.receive!==false;
  (o.parent||scene).add(m);return m;
}
function box(w,h,d,mat,x,y,z,o){return add(new TH.BoxGeometry(w,h,d),mat,x,y,z,o)}
function plane(w,h,mat,x,y,z,rx,o){var m=add(new TH.PlaneGeometry(w,h),mat,x,y,z,o);if(rx)m.rotation.x=rx;return m}
function stadium(w,h,depth){
  var r=h/2,s=new TH.Shape();
  s.moveTo(r,0);s.lineTo(w-r,0);s.absarc(w-r,r,r,-Math.PI/2,Math.PI/2,false);s.lineTo(r,h);s.absarc(r,r,r,Math.PI/2,Math.PI*1.5,false);
  return new TH.ExtrudeGeometry(s,{depth:depth,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:2,curveSegments:24});
}
function blobGeo(r,seed){
  var g=new TH.IcosahedronGeometry(r,3),p=g.attributes.position,v=new TH.Vector3();
  for(var i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);
    var n=FX.vnoise(v.x*1.6+seed,v.y*1.6,v.z*1.6)*.35+FX.vnoise(v.x*4+seed,v.y*4,v.z*4)*.12;
    v.multiplyScalar(1+n-.2);p.setXYZ(i,v.x,v.y,v.z);
  }
  smooth(g);return g;
}
function smooth(g){
  g.computeVertexNormals();
  var p=g.attributes.position,n=g.attributes.normal,map={},keys=[],i,k,a;
  for(i=0;i<p.count;i++){
    k=Math.round(p.getX(i)*1e4)+'_'+Math.round(p.getY(i)*1e4)+'_'+Math.round(p.getZ(i)*1e4);keys.push(k);
    a=map[k]||(map[k]=[0,0,0]);a[0]+=n.getX(i);a[1]+=n.getY(i);a[2]+=n.getZ(i);
  }
  for(i=0;i<p.count;i++){a=map[keys[i]];var l=Math.hypot(a[0],a[1],a[2])||1;n.setXYZ(i,a[0]/l,a[1]/l,a[2]/l)}
  n.needsUpdate=true;
}

/* ---------- the scene ---------- */
function build(){
  buildMaterials();

  /* sky */
  var sunDir=new TH.Vector3(-28,14,20).normalize();
  var sky=new TH.Mesh(new TH.SphereGeometry(200,48,24),new TH.ShaderMaterial({
    uniforms:{uSun:{value:sunDir},uTop:{value:new TH.Color(0x34457a)},uMid:{value:new TH.Color(0xe2906e)},uHor:{value:new TH.Color(0xffc489)},uGround:{value:new TH.Color(0x3a2a20)},uSunCol:{value:new TH.Color(0xffd29a)}},
    vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 uSun,uTop,uMid,uHor,uGround,uSunCol;varying vec3 vDir;void main(){vec3 d=normalize(vDir);float h=d.y;vec3 c=mix(uHor,uMid,smoothstep(.0,.18,h));c=mix(c,uTop,smoothstep(.15,.7,h));c=mix(c,uGround,smoothstep(0.,-.12,h));float s=max(dot(d,uSun),0.);c+=uSunCol*(pow(s,900.)*30.+pow(s,14.)*.55+pow(s,3.)*.12);gl_FragColor=linearToOutputTexel(vec4(c,1.));}',
    side:TH.BackSide,depthWrite:false,fog:false}));
  scene.add(sky);
  var envScene=new TH.Scene();envScene.add(sky.clone());
  var pm=new TH.PMREMGenerator(renderer);
  scene.environment=pm.fromScene(envScene,.04,.1,400).texture;pm.dispose();
  scene.fog=new TH.FogExp2(0xd8a27a,.0042);

  /* light */
  var sun=new TH.DirectionalLight(0xffc690,3.1);
  sun.position.copy(sunDir).multiplyScalar(60);sun.target.position.set(0,0,0);
  sun.castShadow=true;
  var sm=FX.tier===0?1024:2048;sun.shadow.mapSize.set(sm,sm);
  var sc=sun.shadow.camera;sc.left=-30;sc.right=30;sc.top=30;sc.bottom=-30;sc.near=1;sc.far=140;
  sun.shadow.bias=-.0005;sun.shadow.normalBias=.05;
  scene.add(sun);scene.add(sun.target);
  scene.add(new TH.HemisphereLight(0xa9bcff,0x6b4a2a,.55));

  /* ground, lot, sidewalks, road */
  plane(400,400,M.grass,0,-.06,0,-Math.PI/2,{cast:false});
  plane(14,16,M.lot,-14.2,-.02,-6,-Math.PI/2,{cast:false});
  for(var pl=0;pl<5;pl++)plane(.1,4.2,M.white,-19.5+pl*2.8,.0,-10.5,-Math.PI/2,{cast:false});
  box(160,.12,8,M.concrete,0,.06,4,{cast:false});
  plane(160,10,M.asphalt,0,.0,13,-Math.PI/2,{cast:false});
  plane(160,.1,M.yellow,0,.03,12.88,-Math.PI/2,{cast:false});
  plane(160,.1,M.yellow,0,.03,13.12,-Math.PI/2,{cast:false});
  for(var dx=-78;dx<80;dx+=6){plane(2.6,.12,M.white,dx,.03,10.5,-Math.PI/2,{cast:false});plane(2.6,.12,M.white,dx+3,.03,15.5,-Math.PI/2,{cast:false})}
  box(160,.12,3,M.concrete,0,.06,19.5,{cast:false});

  /* cafe body */
  var cafe=new TH.Group();scene.add(cafe);
  box(14,3.0,10,M.siding,0,1.5,-5,{parent:cafe});
  box(14.3,1.75,10.3,M.wood,0,3.875,-5,{parent:cafe});
  plane(13.9,9.9,M.roof,0,4.757,-5,-Math.PI/2,{parent:cafe,cast:false});
  box(14.4,.16,.18,M.trim,0,4.83,.08,{parent:cafe});box(14.4,.16,.18,M.trim,0,4.83,-10.08,{parent:cafe});
  box(.18,.16,10.3,M.trim,-7.1,4.83,-5,{parent:cafe});box(.18,.16,10.3,M.trim,7.1,4.83,-5,{parent:cafe});
  box(5.6,1.0,.9,M.trim,1.6,5.25,-.7,{parent:cafe});
  var ac=box(1.1,.8,.8,M.metal,-4.6,5.15,-4,{parent:cafe});
  add(new TH.CylinderGeometry(.32,.32,.04,24),M.black,-4.6,5.57,-4,{parent:cafe});
  add(new TH.CylinderGeometry(.05,.05,4.7,10),M.metal,7.12,2.35,.1,{parent:cafe});

  /* cream pill sign, logo, badge */
  var pill=add(stadium(9.8,1.22,.1),M.cream,-3.3,3.3,.16,{parent:cafe});
  var logoTex=FX.canvasTex(1024,512,function(c,w,h){FX.drawLogo(c,w/2,h*.72,1.45)});
  var logo=new TH.Mesh(new TH.PlaneGeometry(3.7,1.85),new TH.MeshStandardMaterial({map:logoTex,transparent:true,alphaTest:.04,emissive:0xffffff,emissiveMap:logoTex,emissiveIntensity:.38,roughness:.35}));
  logo.position.set(.3,3.25,.34);cafe.add(logo);
  var bt=badgeTex();
  var badge=add(new TH.CylinderGeometry(.56,.56,.1,48),[M.trim,new TH.MeshStandardMaterial({map:bt,roughness:.4,emissive:0xffffff,emissiveMap:bt,emissiveIntensity:.15}),M.trim],5.85,3.91,.36,{parent:cafe});
  badge.rotation.x=Math.PI/2;badge.rotation.y=Math.PI;

  /* storefront: door and windows */
  box(1.3,2.55,.14,M.trim,-2.6,1.275,.03,{parent:cafe});
  plane(1.04,2.3,M.doorGlass,-2.6,1.19,.11,0,{parent:cafe,cast:false});
  box(.06,.7,.06,M.metal,-2.25,1.15,.18,{parent:cafe});
  var tntDoor=FX.canvasTex(256,128,function(c,w,h){c.fillStyle='#f3ead9';c.beginPath();c.ellipse(128,64,118,56,0,0,7);c.fill();c.strokeStyle='#1d5a3a';c.lineWidth=8;c.stroke();c.fillStyle='#1d5a3a';c.font='400 64px Anton, Impact, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('TNT',128,68)});
  plane(.5,.25,new TH.MeshStandardMaterial({map:tntDoor,roughness:.4}),-2.6,2.05,.125,0,{parent:cafe,cast:false});
  plane(7.9,2.3,M.window,2.55,1.65,.04,0,{parent:cafe,cast:false});
  box(8.1,.14,.16,M.trim,2.55,2.86,.08,{parent:cafe});box(8.1,.18,.22,M.trim,2.55,.46,.1,{parent:cafe});
  for(var mu=0;mu<5;mu++)box(.1,2.3,.14,M.trim,-1.4+mu*1.975,1.65,.1,{parent:cafe});
  box(8.1,.06,.1,M.trim,2.55,2.35,.1,{parent:cafe});
  plane(2.6,1.6,M.window,-5.2,1.7,.04,0,{parent:cafe,cast:false});
  box(2.8,.12,.16,M.trim,-5.2,2.56,.08,{parent:cafe});box(2.8,.14,.2,M.trim,-5.2,.86,.1,{parent:cafe});
  box(.1,1.6,.14,M.trim,-5.2,1.7,.1,{parent:cafe});

  /* wall lamps */
  var bulbMat=new TH.MeshBasicMaterial({color:new TH.Color(0xffd7a0).multiplyScalar(5),toneMapped:false});
  [-4.6,4.4].forEach(function(x){
    box(.06,.06,.4,M.trim,x,3.08,.2,{parent:cafe});
    var shade=add(new TH.ConeGeometry(.16,.18,20,1,true),M.trim,x,3.0,.42,{parent:cafe});
    add(new TH.SphereGeometry(.07,12,8),bulbMat,x,2.92,.42,{parent:cafe,cast:false});
    shade.material=new TH.MeshStandardMaterial({color:0x2a160c,side:TH.DoubleSide});
  });

  /* patio */
  plane(13,4.1,M.turf,.7,.135,2.2,-Math.PI/2,{cast:false});
  var paver=new TH.MeshStandardMaterial({color:0x4a4744,roughness:.9});
  for(var pv=0;pv<4;pv++)plane(.9,.45,paver,-2.6,.15,.7+pv*.95,-Math.PI/2,{cast:false});
  var ballGeo=blobGeo(.3,2),ballGeo2=blobGeo(.3,7);
  function planter(x,z,rotY){
    var g=new TH.Group();g.position.set(x,.12,z);g.rotation.y=rotY||0;scene.add(g);
    box(1.1,.55,.5,M.woodSmall,0,.275,0,{parent:g});
    box(1.0,.04,.4,M.black,0,.54,0,{parent:g,cast:false});
    add(rnd()>.5?ballGeo:ballGeo2,M.leafDark,0,.82,0,{parent:g});
  }
  [-5.4,-4.2,-1.0,.8,2.6,4.4,6.2].forEach(function(x){planter(x,3.95)});
  [1.4,2.7].forEach(function(z){planter(7.0,z,Math.PI/2)});
  var posts=[-6.0,-3.6,-1.6,-.1,1.7,3.5,5.3,7.1];
  posts.forEach(function(x){box(.1,1.0,.1,M.woodSmall,x,.62,4.25)});
  box(2.4,.06,.08,M.woodSmall,-4.8,1.1,4.25);box(8.7,.06,.08,M.woodSmall,2.75,1.1,4.25);

  /* umbrellas, tables, chairs */
  var canopyGeo=new TH.ConeGeometry(1.85,.62,8,1,true);
  function umbrella(x,z){
    var g=new TH.Group();g.position.set(x,.12,z);scene.add(g);
    add(new TH.CylinderGeometry(.03,.03,2.7,8),M.metal,0,1.35,0,{parent:g});
    var c=add(canopyGeo,M.umbrella,0,2.62,0,{parent:g});
    add(new TH.SphereGeometry(.06,10,8),M.trim,0,2.96,0,{parent:g});
    anim.push(function(t){c.rotation.z=Math.sin(t*1.1+x)*.012;c.rotation.x=Math.cos(t*.9+x)*.01});
  }
  function table(x,z){
    var g=new TH.Group();g.position.set(x,.12,z);scene.add(g);
    add(new TH.CylinderGeometry(.42,.42,.05,28),M.woodSmall,0,.74,0,{parent:g});
    add(new TH.CylinderGeometry(.04,.06,.72,10),M.trim,0,.36,0,{parent:g});
    for(var i=0;i<3;i++){
      var a=i/3*Math.PI*2+.4,cg=new TH.Group();cg.position.set(Math.cos(a)*.75,0,Math.sin(a)*.75);cg.rotation.y=-a+Math.PI/2;g.add(cg);
      box(.42,.05,.42,M.woodSmall,0,.45,0,{parent:cg});box(.42,.45,.05,M.woodSmall,0,.7,-.2,{parent:cg});
      [[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]].forEach(function(l){box(.04,.45,.04,M.trim,l[0],.22,l[1],{parent:cg})});
    }
  }
  umbrella(-1.1,2.1);table(-1.1,2.1);
  umbrella(4.7,2.2);table(4.7,2.2);
  table(1.8,1.3);table(-4.6,1.6);

  /* string lights */
  var bulbGeo=new TH.SphereGeometry(.05,10,8),strands=[[-4.6,-5.2],[-.6,-1.0],[2.6,3.0],[5.9,6.4]],NBULB=13;
  var bulbs=new TH.InstancedMesh(bulbGeo,new TH.MeshBasicMaterial({color:0xffffff,toneMapped:false}),strands.length*NBULB);
  var bc=new TH.Color(),bm=new TH.Object3D(),bi=0,cableMat=new TH.MeshStandardMaterial({color:0x111111,roughness:.6});
  strands.forEach(function(s){
    box(.08,2.5,.08,M.trim,s[1],1.37,4.25);
    var a=new TH.Vector3(s[0],3.15,.3),b=new TH.Vector3(s[1],2.6,4.25),pts=[];
    for(var i=0;i<=20;i++){var t=i/20,p=a.clone().lerp(b,t);p.y-=Math.sin(t*Math.PI)*.38;pts.push(p)}
    var curve=new TH.CatmullRomCurve3(pts);
    add(new TH.TubeGeometry(curve,40,.009,5,false),cableMat,0,0,0,{cast:false});
    for(var k=1;k<=NBULB;k++){
      var q=curve.getPointAt(k/(NBULB+1));bm.position.copy(q);bm.position.y-=.06;bm.updateMatrix();
      bulbs.setMatrixAt(bi,bm.matrix);bulbs.setColorAt(bi,bc.setRGB(5.5,3.6,1.6));bi++;
    }
  });
  scene.add(bulbs);
  anim.push(function(t){
    for(var i=0;i<bi;i++){var f=.85+.15*Math.sin(t*7+i*2.3)*Math.sin(t*3.1+i);bulbs.setColorAt(i,bc.setRGB(5.5*f,3.6*f,1.6*f))}
    bulbs.instanceColor.needsUpdate=true;
  });

  /* neighbours: white painted brick */
  box(12,7.6,10,M.brick,11,3.8,-11);
  box(26,8.6,8,M.brick,2,4.3,-20);
  function windowAt(x,y,z,ry,parent){
    var g=new TH.Group();g.position.set(x,y,z);g.rotation.y=ry||0;(parent||scene).add(g);
    box(1.15,1.55,.08,M.frameWhite,0,0,0,{parent:g,cast:false});
    plane(.95,1.35,M.glassDark,0,0,.05,0,{parent:g,cast:false});
    box(.05,1.35,.04,M.frameWhite,0,0,.07,{parent:g,cast:false});box(.95,.05,.04,M.frameWhite,0,0,.07,{parent:g,cast:false});
  }
  for(var wx=0;wx<4;wx++){windowAt(7.2+wx*2.6,5.9,-5.96);windowAt(7.2+wx*2.6,2.4,-5.96)}
  for(var wz=0;wz<3;wz++)windowAt(4.96,5.9,-8+wz*-2.6,-Math.PI/2);
  for(var wb=0;wb<8;wb++){windowAt(-9+wb*2.8,6.6,-15.96);if(wb<2||wb>5)windowAt(-9+wb*2.8,3.0,-15.96)}

  /* trees */
  var blobs=[blobGeo(1.4,1),blobGeo(1.4,4),blobGeo(1.4,9)];
  function tree(x,z,s){
    var g=new TH.Group();g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);
    add(new TH.CylinderGeometry(.14,.22,3.2,8),M.trunk,0,1.6,0,{parent:g});
    var crown=new TH.Group();crown.position.y=3.6;g.add(crown);
    for(var i=0;i<4;i++){var b=add(blobs[i%3],i%2?M.leaf:M.leafDark,(rnd()-.5)*1.6,(rnd()-.2)*1.2,(rnd()-.5)*1.6,{parent:crown});b.scale.setScalar(.7+rnd()*.4)}
    var ph=rnd()*6;anim.push(function(t){crown.rotation.z=Math.sin(t*.7+ph)*.02});
  }
  [[-15,-8,1.1],[-19,-1,1.3],[-23,-12,1.2],[-12,-18,1.0],[20,-4,1.2],[-20,25,1.3],[-7,25.5,1.1],[7,24.5,1.25],[19,25,1.15],[31,24,1.3],[-33,23,1.2],[26,-14,1.3]].forEach(function(t){tree(t[0],t[1],t[2])});

  /* street furniture */
  add(new TH.CylinderGeometry(.14,.17,10.5,10),M.poleWood,8.4,5.25,7.4);
  box(2.6,.14,.14,M.poleWood,8.4,9.6,7.4);
  var wireMat=new TH.LineBasicMaterial({color:0x1a1410});
  [[-.9,9.66],[.9,9.66],[0,9.0]].forEach(function(w){
    var pts=[];for(var i=0;i<=40;i++){var x=-90+i*4.5,t=(x-8.4);pts.push(new TH.Vector3(x,w[1]-Math.abs(Math.sin(t/60*Math.PI))*1.2,7.4+w[0]*.3))}
    scene.add(new TH.Line(new TH.BufferGeometry().setFromPoints(pts),wireMat));
  });
  add(new TH.CylinderGeometry(.045,.045,3.4,10),M.metal,-7.9,1.7,7.3);
  var stt=signTex('DUNDAS ST W','#17643c'),signM=new TH.MeshStandardMaterial({map:stt,roughness:.4});
  var blade=box(1.9,.42,.035,[M.metal,M.metal,M.metal,M.metal,signM,signM],-7.9,3.25,7.3);
  blade.rotation.y=.25;

  /* parked car */
  var car=new TH.Group();car.position.set(-11.2,0,-2.6);car.rotation.y=.12;scene.add(car);
  box(2.0,.72,4.6,M.car,0,.66,0,{parent:car});
  box(1.8,.62,2.7,M.glassDark,0,1.32,-.25,{parent:car});
  box(1.82,.08,2.5,M.car,0,1.66,-.25,{parent:car});
  [[-.95,1.4],[.95,1.4],[-.95,-1.45],[.95,-1.45]].forEach(function(w){var wh=add(new TH.CylinderGeometry(.37,.37,.26,18),M.black,w[0],.37,w[1],{parent:car});wh.rotation.z=Math.PI/2});

  /* dust in the sun */
  var dust=FX.embers(FX.tier===0?60:140,{scale:34*PR,gain:1.1,seed:4});
  dust.mat.uniforms.uA.value.set(0xffb070);dust.mat.uniforms.uB.value.set(0xfff0d0);
  var dd=[];for(var i=0;i<dust.pos.length/3;i++)dd.push([(rnd()-.5)*18,rnd()*5,rnd()*9-1,rnd()*6]);
  scene.add(dust.points);
  anim.push(function(t){
    for(var i=0;i<dd.length;i++){var d=dd[i];dust.pos[i*3]=d[0]+Math.sin(t*.3+d[3])*.6;dust.pos[i*3+1]=(d[1]+t*.08)%5+.3;dust.pos[i*3+2]=d[2]+Math.cos(t*.25+d[3])*.4}
    dust.points.geometry.attributes.position.needsUpdate=true;dust.mat.uniforms.uTime.value=t;
  });

  post=FX.post(renderer,scene,camera,{
    bokeh:FX.tier>=1?{focus:30,aperture:.0011,maxblur:.011}:null,
    bloom:{strength:.85,radius:.6,threshold:.8},vignette:.55,grain:.04,ca:.0028});
}

/* ---------- camera path ---------- */
var camPath=new TH.CatmullRomCurve3([
  new TH.Vector3(-27,29,42),new TH.Vector3(-15,18,33),new TH.Vector3(-5,11,26),
  new TH.Vector3(1.4,4.4,16.5),new TH.Vector3(.2,2.7,9.2),new TH.Vector3(-1.9,1.8,3.4),new TH.Vector3(-2.6,1.45,.25)],false,'centripetal');
var tgtPath=new TH.CatmullRomCurve3([
  new TH.Vector3(0,1.2,-1),new TH.Vector3(0,1.8,-1),new TH.Vector3(.6,2.4,-.5),
  new TH.Vector3(.7,2.7,0),new TH.Vector3(-.4,2.3,0),new TH.Vector3(-2.3,1.6,-1),new TH.Vector3(-2.6,1.4,-4)],false,'centripetal');
var T_END=7.0,tgt=new TH.Vector3();
function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
function uAt(t){
  if(t<5.0)return ease(Math.min(1,t/5.0))*.72;
  var k=Math.min(1,(t-5.0)/1.9);return .72+.28*k*k*k;
}
function sstep(a,b,x){return FX.sstep(a,b,x)}
var stage='';
function setStage(s){if(stage===s)return;stage=s;root.setAttribute('data-stage',s)}
function setTime(t){
  var u=Math.min(1,uAt(t));
  camPath.getPointAt(u,camera.position);tgtPath.getPointAt(u,tgt);camera.lookAt(tgt);
  if(post){
    if(post.bokeh){
      post.bokeh.uniforms.focus.value=camera.position.distanceTo(tgt);
      post.bokeh.uniforms.aperture.value=.0011*(1-u)+.00025;
    }
    post.final.uniforms.uFade.value=1-sstep(0,.7,t);
    var f=sstep(6.0,6.85,t);post.final.uniforms.uFlash.value=f*f;
  }
  for(var i=0;i<anim.length;i++)anim[i](t);
  if(t>3.9)setStage('out');else if(t>1.0)setStage('title');else if(t>.3)setStage('eyebrow');
}
function render(t){if(post)post.render(t,.016);else renderer.render(scene,camera)}
function resize(){
  var w=window.innerWidth,h=window.innerHeight;
  renderer.setSize(w,h,false);if(post)post.setSize(w,h,PR);
  camera.aspect=w/h;camera.fov=w/h<1?58:42;camera.updateProjectionMatrix();
}

/* ---------- run ---------- */
var t=0,last=0,running=false,ended=false,raf=0;
function finish(){
  if(ended)return;ended=true;running=false;cancelAnimationFrame(raf);
  try{sessionStorage.setItem('tnt.intro','1')}catch(e){}
  root.classList.add('out');
  announceDone();
  setTimeout(function(){
    try{renderer.dispose();renderer.forceContextLoss()}catch(e){}
    if(root.parentNode)root.parentNode.removeChild(root);
  },900);
}
function loop(now){
  if(!running)return;
  raf=requestAnimationFrame(loop);
  var dt=last?Math.min(.1,(now-last)/1000):.016;last=now;
  t+=dt;
  setTime(t);render(t);
  if(t>=T_END)finish();
}
function skip(){if(ended)return;if(!running){finish();return}if(t<6.0)t=6.0}
document.getElementById('introSkip').addEventListener('click',skip);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!ended)skip()});

X.introSeek=function(tt){running=false;cancelAnimationFrame(raf);t=tt;setTime(t);render(t)};

FX.fontsReady().then(function(){
  try{build()}catch(err){finish();return}
  resize();window.addEventListener('resize',resize);
  setTime(0);
  try{renderer.compile(scene,camera)}catch(e){}
  root.classList.add('ready');
  running=true;last=0;raf=requestAnimationFrame(loop);
});
})();
