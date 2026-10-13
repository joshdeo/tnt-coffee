/* Background scene on every page: sculpted roasted beans with an oily clearcoat, glowing bolts and
   drifting embers at real depths. Scroll moves the camera through the scene, the pointer swings it,
   and a post chain adds depth of field, bloom, grade and grain. */
(function(){
'use strict';
var TH=window.THREE,X=window.TNT,FX=window.TNTFX;
if(!TH||!X||!FX)return;
var reduced=X.reduced;

var canvas=document.createElement('canvas');
canvas.id='bg3d';canvas.setAttribute('aria-hidden','true');
document.body.insertBefore(canvas,document.body.firstChild);
var renderer;
try{renderer=FX.renderer(canvas,{clear:0x0e0906,exposure:1.08})}catch(e){canvas.remove();return}
document.documentElement.classList.add('has-bg3d');
var PR=Math.min(window.devicePixelRatio||1,FX.tier===2?1.5:FX.tier===1?1.25:1);
renderer.setPixelRatio(PR);

var scene=new TH.Scene();
scene.background=new TH.Color(0x0e0906);
scene.fog=new TH.FogExp2(0x0e0906,.03);
var studio=FX.studio(renderer);
scene.environment=studio.env;
var camera=new TH.PerspectiveCamera(50,1,.1,140);
var CAM_Z=14,K=.012,TAN=Math.tan(25*Math.PI/180);

scene.add(new TH.HemisphereLight(0xffd9b0,0x1a0c05,.35));
var key=new TH.DirectionalLight(0xffe2bf,2.3);key.position.set(-6,8,10);scene.add(key);
var rim=new TH.DirectionalLight(0xff8a3a,1.8);rim.position.set(8,-3,-6);scene.add(rim);
var ember=new TH.PointLight(0xff7a1a,2.6,34,1.5);ember.position.set(0,0,6);scene.add(ember);

var rnd=FX.rng(11),narrow=window.innerWidth<700;

/* beans */
var NB=narrow?26:54;
var beanGeo=FX.beanGeometry(3);
var beans=new TH.InstancedMesh(beanGeo,FX.beanMaterial(),NB);
beans.instanceMatrix.setUsage(TH.DynamicDrawUsage);
var items=[],tint=new TH.Color();
for(var i=0;i<NB;i++){
  var z=-22+rnd()*27;
  items.push({u:rnd()*2-1,t:rnd(),z:z,s:(.42+rnd()*.42)*(1+(CAM_Z-z)/40),
    rot:new TH.Euler(rnd()*6.28,rnd()*6.28,rnd()*6.28),spin:new TH.Vector3((rnd()-.5)*.6,(rnd()-.5)*.6,(rnd()-.5)*.4),ph:rnd()*6.28,by:0,x:0});
  beans.setColorAt(i,tint.setScalar(.75+rnd()*.5));
}
scene.add(beans);

/* bolts */
var shape=new TH.Shape();
shape.moveTo(.3,1.2);shape.lineTo(-.55,-.1);shape.lineTo(-.08,-.1);shape.lineTo(-.35,-1.25);
shape.lineTo(.6,.2);shape.lineTo(.1,.2);shape.lineTo(.45,1.2);shape.lineTo(.3,1.2);
var boltGeo=new TH.ExtrudeGeometry(shape,{depth:.3,bevelEnabled:true,bevelThickness:.08,bevelSize:.06,bevelSegments:3});
boltGeo.center();
var boltMat=new TH.MeshStandardMaterial({color:0x3a1404,emissive:0xff5a10,emissiveIntensity:1.6,roughness:.3,metalness:.4,toneMapped:false});
var NBolt=narrow?3:6;
for(var b=0;b<NBolt;b++){
  var zb=-24+rnd()*18,m=new TH.Mesh(boltGeo,boltMat);
  m.rotation.set(rnd()*6.28,rnd()*6.28,rnd()*6.28);
  scene.add(m);
  items.push({mesh:m,u:rnd()*2-1,t:rnd(),z:zb,s:(.8+rnd()*.6)*(1+(CAM_Z-zb)/34),rot:m.rotation,spin:new TH.Vector3((rnd()-.5)*.4,(rnd()-.5)*.4,(rnd()-.5)*.3),ph:rnd()*6.28,by:0,x:0});
}

/* embers */
var PN=narrow?140:360;
var em=FX.embers(PN,{scale:70*PR,gain:2.4});
var parts=[];
for(var k=0;k<PN;k++)parts.push({u:rnd()*2-1,t:rnd(),z:-26+rnd()*36,v:.25+rnd()*.8,w:rnd()*6.28});
scene.add(em.points);

var post=FX.post(renderer,scene,camera,{
  bokeh:FX.tier>=1?{focus:13,aperture:.0016,maxblur:.0075}:null,
  bloom:{strength:.85,radius:.6,threshold:.72},vignette:.5,grain:.045,ca:.0011});

var yRange=0,aspect=1,drift=0;
var dummy=new TH.Object3D();
function layout(){
  var w=window.innerWidth,h=window.innerHeight;
  renderer.setSize(w,h,false);
  if(post)post.setSize(w,h,PR);
  aspect=w/h;camera.aspect=aspect;camera.updateProjectionMatrix();
  var d=document.documentElement;
  var scrollMax=Math.max(0,Math.max(d.scrollHeight,document.body.scrollHeight)-h);
  yRange=scrollMax*K;
  items.forEach(function(it){
    var depth=CAM_Z-it.z,halfH=depth*TAN,halfW=halfH*aspect;
    it.by=halfH-it.t*(yRange+2*halfH);
    it.x=it.u*halfW*1.05;
  });
  if(reduced)renderStatic();
}
function placeItems(time){
  var bi=0;
  for(var i=0;i<items.length;i++){
    var it=items[i],y=it.by+Math.sin(time*.0006+it.ph)*.28;
    if(it.mesh){
      it.mesh.position.set(it.x,y,it.z);it.mesh.scale.setScalar(it.s);
    }else{
      dummy.position.set(it.x,y,it.z);dummy.rotation.copy(it.rot);dummy.scale.setScalar(it.s);
      dummy.updateMatrix();beans.setMatrixAt(bi++,dummy.matrix);
    }
  }
  beans.instanceMatrix.needsUpdate=true;
}
function updateParticles(){
  var pos=em.pos;
  for(var i=0;i<PN;i++){
    var p=parts[i],depth=CAM_Z-p.z,halfH=depth*TAN,halfW=halfH*aspect,range=yRange+2*halfH;
    var off=((p.t*range-drift*p.v)%range+range)%range;
    pos[i*3]=p.u*halfW*1.05+Math.sin(drift*.6+p.w)*.3;
    pos[i*3+1]=halfH-off;
    pos[i*3+2]=p.z;
  }
  em.points.geometry.attributes.position.needsUpdate=true;
}
function draw(t,dt){
  if(post){post.render(t,dt)}else renderer.render(scene,camera);
}
var camY=0,flash=0,nextFlash=5;
function renderStatic(){
  camY=-(window.scrollY||0)*K;
  camera.position.set(0,camY,CAM_Z);camera.lookAt(0,camY,0);
  ember.position.set(0,camY+3,6);
  placeItems(0);updateParticles();
  draw(0,.016);
}
function frame(time,dt){
  if(X.introActive)return;
  var sy=window.scrollY||0;
  camY+=(-sy*K-camY)*Math.min(1,dt*6);
  var px=X.pointer.sx,py=X.pointer.sy,t=time/1000;
  var sway=Math.sin(t*.18)*.6;
  camera.position.set(px*1.9+sway,camY-py*1.0,CAM_Z);
  camera.lookAt(px*.3,camY,0);
  ember.position.set(px*11,camY-py*6+2,6);
  drift+=dt*1.1;
  for(var i=0;i<items.length;i++){
    var it=items[i];
    it.rot.x+=it.spin.x*dt;it.rot.y+=it.spin.y*dt;it.rot.z+=it.spin.z*dt;
  }
  placeItems(time);
  nextFlash-=dt;
  if(nextFlash<=0){flash=1;nextFlash=6+rnd()*9}
  flash*=Math.pow(.02,dt);
  ember.intensity=2.6+flash*5;
  boltMat.emissiveIntensity=1.6+flash*2.2;
  em.mat.uniforms.uTime.value=t;
  updateParticles();
  draw(t,dt);
}

layout();
var tmr;
function relayout(){clearTimeout(tmr);tmr=setTimeout(layout,120)}
window.addEventListener('resize',relayout);
window.addEventListener('load',relayout);
try{new ResizeObserver(relayout).observe(document.body)}catch(e){}
if(reduced){
  var ticking=false;
  window.addEventListener('scroll',function(){
    if(ticking)return;ticking=true;
    requestAnimationFrame(function(){ticking=false;renderStatic()});
  },{passive:true});
  renderStatic();
}else{
  X.hooks.push(frame);
}
X.bg={render:function(){renderStatic()}};
})();
