/* Home hero centrepiece: the TNT logo cup made real. A glossy red ceramic cup on a saucer,
   a latte art heart, rising steam and roasted beans orbiting it. Leans toward the pointer. */
(function(){
'use strict';
var TH=window.THREE,X=window.TNT,FX=window.TNTFX;
var stageEl=document.getElementById('heroStage');
if(!stageEl||!TH||!X||!FX)return;
var canvas=document.createElement('canvas');
canvas.setAttribute('role','img');
canvas.setAttribute('aria-label','A red TNT cup with a latte art heart, steam rising, beans orbiting');
stageEl.appendChild(canvas);
var renderer;
try{renderer=FX.renderer(canvas,{alpha:true,exposure:1.1})}catch(e){stageEl.classList.add('no3d');return}
stageEl.classList.add('is3d');
var PR=Math.min(window.devicePixelRatio||1,FX.tier===0?1.5:2);
renderer.setPixelRatio(PR);

var scene=new TH.Scene();
var studio=FX.studio(renderer);
scene.environment=studio.env;
var camera=new TH.PerspectiveCamera(30,1,.1,60);
scene.add(new TH.HemisphereLight(0xffe2c4,0x22120a,.45));
var key=new TH.DirectionalLight(0xfff0dc,2.4);key.position.set(-4,6,5);scene.add(key);
var rim=new TH.DirectionalLight(0xff7a1a,2.6);rim.position.set(5,2,-5);scene.add(rim);
var under=new TH.PointLight(0xff8a3a,1.4,8,2);under.position.set(0,.3,2.5);scene.add(under);

var rig=new TH.Group();scene.add(rig);
var cup=new TH.Group();rig.add(cup);

/* profile of a round bellied cup, like the one in the logo */
function rOut(y){var t=Math.min(1,Math.max(0,(y-.06)/1.15));return .57+.49*Math.pow(Math.sin(t*Math.PI/2),.8)}
var outer=[new TH.Vector2(0,0),new TH.Vector2(.47,0),new TH.Vector2(.55,.02),new TH.Vector2(.57,.06)];
for(var i=1;i<=24;i++){var y=.06+i/24*1.15;outer.push(new TH.Vector2(rOut(y),y))}
outer.push(new TH.Vector2(1.062,1.235),new TH.Vector2(1.05,1.258),new TH.Vector2(1.025,1.266),new TH.Vector2(1.0,1.25));
var inner=[new TH.Vector2(1.0,1.25)];
for(var j=24;j>=0;j--){var yy=.24+j/24*(1.21-.24);inner.push(new TH.Vector2(rOut(yy)-.068,yy))}
inner.push(new TH.Vector2(0,.22));
var glaze=new TH.MeshPhysicalMaterial({color:0x6e1a0c,roughness:.24,metalness:0,clearcoat:1,clearcoatRoughness:.06,sheen:.3,sheenColor:new TH.Color(0xff6a3a)});
var cream=new TH.MeshPhysicalMaterial({color:0xf1e6d4,roughness:.22,clearcoat:1,clearcoatRoughness:.05});
cup.add(new TH.Mesh(new TH.LatheGeometry(outer,96),glaze));
cup.add(new TH.Mesh(new TH.LatheGeometry(inner,96),cream));
var hc=new TH.CatmullRomCurve3([new TH.Vector3(.96,1.04,0),new TH.Vector3(1.32,1.1,0),new TH.Vector3(1.56,.88,0),new TH.Vector3(1.5,.54,0),new TH.Vector3(1.22,.36,0),new TH.Vector3(.8,.4,0)]);
cup.add(new TH.Mesh(new TH.TubeGeometry(hc,80,.085,20,false),glaze));

/* logo decal following the belly */
var dec=[];for(var k=0;k<=16;k++){var dy=.36+k/16*.66;dec.push(new TH.Vector2(rOut(dy)*1.004,dy))}
var logoTex=FX.canvasTex(1024,512,function(c,w,h){FX.drawLogo(c,w/2,h*.62,1.7,{icon:false})});
var decal=new TH.Mesh(new TH.LatheGeometry(dec,64,-.8,1.6),new TH.MeshPhysicalMaterial({map:logoTex,transparent:true,roughness:.3,clearcoat:1,clearcoatRoughness:.06,polygonOffset:true,polygonOffsetFactor:-2}));
cup.add(decal);

/* coffee with latte art */
var art=FX.latteArt({base:0x9c5b26,milk:0xf7ecd9,edge:0x3e1d0e});
var coffee=new TH.Mesh(new TH.CircleGeometry(rOut(1.08)-.07,72),art);
coffee.rotation.x=-Math.PI/2;coffee.rotation.z=-Math.PI/2;coffee.position.y=1.08;cup.add(coffee);

/* saucer */
var sp=[new TH.Vector2(0,0),new TH.Vector2(.9,0),new TH.Vector2(1.0,.02),new TH.Vector2(1.5,.08),new TH.Vector2(1.74,.17),new TH.Vector2(1.78,.21),new TH.Vector2(1.72,.22),new TH.Vector2(1.48,.14),new TH.Vector2(.95,.09),new TH.Vector2(.62,.09),new TH.Vector2(0,.085)];
var saucer=new TH.Mesh(new TH.LatheGeometry(sp,96),cream);rig.add(saucer);
cup.position.y=.085;

/* contact shadow */
var shTex=FX.canvasTex(256,256,function(c,w,h){var g=c.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'rgba(0,0,0,.75)');g.addColorStop(.55,'rgba(0,0,0,.3)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h)});
var shadow=new TH.Mesh(new TH.PlaneGeometry(4.6,4.6),new TH.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false}));
shadow.rotation.x=-Math.PI/2;shadow.position.y=-.01;rig.add(shadow);

/* steam */
var steam=FX.Steam({count:3,width:1.05,height:2.5,strength:.8,wind:3});
steam.group.position.y=1.12;rig.add(steam.group);

/* orbiting beans */
var beanGeo=FX.beanGeometry(5,32,44),beanMat=FX.beanMaterial();
var orbit=new TH.Group();orbit.position.y=.9;orbit.rotation.set(.32,0,-.18);rig.add(orbit);
var beans=[],rnd=FX.rng(21);
for(var b=0;b<11;b++){
  var m=new TH.Mesh(beanGeo,beanMat);m.scale.setScalar(.15+rnd()*.07);
  m.rotation.set(rnd()*6,rnd()*6,rnd()*6);orbit.add(m);
  beans.push({m:m,a:b/11*Math.PI*2+rnd()*.3,r:1.7+rnd()*.45,y:(rnd()-.5)*.5,s:new TH.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).multiplyScalar(1.4)});
}

var visible=true,tiltX=0,tiltY=0;
function resize(){
  var w=canvas.clientWidth||stageEl.clientWidth,h=canvas.clientHeight||stageEl.clientHeight;if(!w||!h)return;
  renderer.setSize(w,h,false);camera.aspect=w/h;
  var d=Math.max(7.6,4.9/(2*Math.tan(15*Math.PI/180)*camera.aspect));
  camera.position.set(0,1.2+d*Math.sin(.28),d*Math.cos(.28));camera.lookAt(0,1.25,0);
  camera.updateProjectionMatrix();
  if(X.reduced)draw(0,0);
}
function draw(t,dt){
  var sy=window.scrollY||0,k=Math.min(1,sy/700);
  var px=X.pointer?X.pointer.sx:0,py=X.pointer?X.pointer.sy:0;
  tiltX+=((py*.18+k*.25)-tiltX)*Math.min(1,dt*4);tiltY+=((px*.35)-tiltY)*Math.min(1,dt*4);
  rig.rotation.set(tiltX,tiltY,0);
  cup.rotation.y=Math.sin(t*.35)*.55-.15+k*1.2;
  rig.position.y=Math.sin(t*.9)*.05+k*.6;
  orbit.rotation.y=t*.22;
  for(var i=0;i<beans.length;i++){
    var o=beans[i],a=o.a;
    o.m.position.set(Math.cos(a)*o.r,o.y+Math.sin(t*.8+a*2)*.12,Math.sin(a)*o.r);
    o.m.rotation.x+=o.s.x*dt;o.m.rotation.y+=o.s.y*dt;
  }
  steam.update(t);art.uniforms.uTime.value=t;
  renderer.render(scene,camera);
}
try{new ResizeObserver(resize).observe(stageEl)}catch(e){window.addEventListener('resize',resize)}
try{new IntersectionObserver(function(en){visible=en[0].isIntersecting}).observe(stageEl)}catch(e){}
resize();
if(X.reduced){draw(2,1)}
else{
  X.hooks.push(function(time,dt){
    if(!visible||X.introActive)return;
    draw(time/1000,dt);
  });
}
})();
