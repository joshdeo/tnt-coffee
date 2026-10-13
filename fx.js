/* Shared 3D toolkit for every page:
   renderer setup, a warm studio lighting environment, sculpted coffee bean geometry,
   tileable noise, realistic steam, the post chain (depth of field, bloom, grade, grain)
   and the TNT logo drawn for textures. */
(function(){
'use strict';
var TH=window.THREE;
if(!TH)return;
if(TH.ColorManagement)TH.ColorManagement.legacyMode=false;
var FX=window.TNTFX={};

FX.reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
FX.tier=(function(){
  var w=Math.min(window.innerWidth||1200,(window.screen&&screen.width)||1200);
  var coarse=window.matchMedia&&window.matchMedia('(pointer: coarse)').matches;
  var cores=navigator.hardwareConcurrency||4;
  if(coarse||w<760)return 0;
  if(cores<=4)return 1;
  return 2;
})();
FX.floatOK=function(r){try{return r.capabilities.isWebGL2&&(r.extensions.has('EXT_color_buffer_float')||r.extensions.has('EXT_color_buffer_half_float'))}catch(e){return false}};
FX.hasPost=function(){return !!(TH.EffectComposer&&TH.RenderPass&&TH.ShaderPass&&TH.UnrealBloomPass&&TH.CopyShader)};

FX.renderer=function(canvas,o){
  o=o||{};
  var r=new TH.WebGLRenderer({canvas:canvas,antialias:o.antialias!==false,alpha:!!o.alpha,powerPreference:'high-performance'});
  r.outputEncoding=TH.sRGBEncoding;
  r.toneMapping=TH.ACESFilmicToneMapping;
  r.toneMappingExposure=o.exposure||1;
  if(o.alpha)r.setClearColor(0x000000,0);else r.setClearColor(o.clear!=null?o.clear:0x0e0906,1);
  return r;
};

/* ---------- warm studio environment (HDR) ---------- */
FX.studio=function(renderer){
  var s=new TH.Scene();
  s.add(new TH.Mesh(new TH.BoxGeometry(24,24,24),new TH.MeshBasicMaterial({color:new TH.Color(0x2a1a10).multiplyScalar(.7),side:TH.BackSide})));
  function panel(w,h,color,k,p){
    var m=new TH.Mesh(new TH.PlaneGeometry(w,h),new TH.MeshBasicMaterial({color:new TH.Color(color).multiplyScalar(k),side:TH.DoubleSide}));
    m.position.set(p[0],p[1],p[2]);m.lookAt(0,0,0);s.add(m);
  }
  panel(6,8,0xfff0dc,7,[-7,3,6]);
  panel(2.4,10,0xe6efff,4,[8,2,-2]);
  panel(14,1.4,0xff7a1a,5,[0,-2.5,-9]);
  panel(9,9,0xffe2c0,2.4,[0,10,0]);
  panel(3,3,0xffb640,3,[6,6,7]);
  var pm=new TH.PMREMGenerator(renderer);
  var env=pm.fromScene(s,.02).texture;
  pm.dispose();
  var crt=new TH.WebGLCubeRenderTarget(128,{type:FX.floatOK(renderer)?TH.HalfFloatType:TH.UnsignedByteType});
  var cc=new TH.CubeCamera(.1,60,crt);s.add(cc);
  var tm=renderer.toneMapping;renderer.toneMapping=TH.NoToneMapping;
  cc.update(renderer,s);
  renderer.toneMapping=tm;
  return {env:env,cube:crt.texture};
};

/* ---------- small math helpers ---------- */
function fract(x){return x-Math.floor(x)}
function hash3(x,y,z){return fract(Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453)}
function vnoise(x,y,z){
  var xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi;
  var u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf);
  function L(a,b,t){return a+(b-a)*t}
  return L(L(L(hash3(xi,yi,zi),hash3(xi+1,yi,zi),u),L(hash3(xi,yi+1,zi),hash3(xi+1,yi+1,zi),u),v),
           L(L(hash3(xi,yi,zi+1),hash3(xi+1,yi,zi+1),u),L(hash3(xi,yi+1,zi+1),hash3(xi+1,yi+1,zi+1),u),v),w);
}
function sstep(a,b,x){var t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}
FX.vnoise=vnoise;FX.sstep=sstep;
FX.rng=function(seed){var s=seed||1;return function(){s=(s*16807)%2147483647;return (s-1)/2147483646}};

/* ---------- sculpted coffee bean ---------- */
FX.beanGeometry=function(seed,lat,lon){
  seed=seed||1;lat=lat||40;lon=lon||56;
  var pos=[],col=[],idx=[];
  var dark=new TH.Color(0x2c160a),mid=new TH.Color(0x5a321a),warm=new TH.Color(0x7b4824),chaff=new TH.Color(0xc9a46e),tmp=new TH.Color();
  function vert(ux,uy,uz){
    var front=sstep(-.15,.35,uz);
    var x=ux*.74,y=uy;
    var z=uz*(.62*(1-front)+.34*front);
    var c=.1*Math.sin(uy*2.6)*.74;
    var d=(x-c)/.07,g=Math.exp(-d*d);
    var ends=1-sstep(.7,.97,Math.abs(uy));
    z-=g*.17*front*ends;
    var lipD=(Math.abs(x-c)-.13)/.07;
    z+=Math.exp(-lipD*lipD)*.028*front*ends;
    var n=vnoise(ux*3.1+seed*7.3,uy*3.1,uz*3.1);
    var k=1+(n-.5)*.05;
    x*=k;z*=k;
    x+=.035*(1-uy*uy)*(seed%2?1:-1);
    pos.push(x,y,z);
    var n2=vnoise(ux*6+seed,uy*6+3,uz*6+5);
    tmp.copy(dark).lerp(mid,.35+n*.5).lerp(warm,Math.max(0,n2-.55)*1.2);
    tmp.lerp(dark,sstep(.75,1,Math.abs(uy))*.6);
    var crease=g*front*ends;
    tmp.lerp(dark,sstep(.15,.5,crease)*.5);
    tmp.lerp(chaff,sstep(.72,.97,crease)*.75);
    col.push(tmp.r,tmp.g,tmp.b);
  }
  vert(0,1,0);
  for(var i=1;i<lat;i++){
    var th=i/lat*Math.PI;
    for(var j=0;j<lon;j++){
      var ph=j/lon*Math.PI*2;
      vert(Math.sin(th)*Math.cos(ph),Math.cos(th),Math.sin(th)*Math.sin(ph));
    }
  }
  vert(0,-1,0);
  var last=1+(lat-1)*lon;
  for(var a=0;a<lon;a++){idx.push(0,1+(a+1)%lon,1+a)}
  for(var r=0;r<lat-2;r++){
    for(var b=0;b<lon;b++){
      var p0=1+r*lon+b,p1=1+r*lon+(b+1)%lon,p2=1+(r+1)*lon+b,p3=1+(r+1)*lon+(b+1)%lon;
      idx.push(p0,p3,p2,p0,p1,p3);
    }
  }
  var base=1+(lat-2)*lon;
  for(var e=0;e<lon;e++){idx.push(base+e,base+(e+1)%lon,last)}
  var geo=new TH.BufferGeometry();
  geo.setAttribute('position',new TH.Float32BufferAttribute(pos,3));
  geo.setAttribute('color',new TH.Float32BufferAttribute(col,3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};
FX.beanMaterial=function(env){
  return new TH.MeshPhysicalMaterial({vertexColors:true,roughness:.4,metalness:0,clearcoat:.6,clearcoatRoughness:.3,envMap:env||null,envMapIntensity:1});
};

/* ---------- tileable noise (three independent channels) ---------- */
var noiseTex=null;
FX.noise=function(){
  if(noiseTex)return noiseTex;
  var N=256,data=new Uint8Array(N*N*4),rnd=FX.rng(1337);
  function fade(t){return t*t*t*(t*(t*6-15)+10)}
  for(var ch=0;ch<3;ch++){
    var vals=new Float32Array(N*N);
    var octs=[[4,1],[8,.5],[16,.25],[32,.125],[64,.0625]];
    for(var o=0;o<octs.length;o++){
      var P=octs[o][0],amp=octs[o][1],g=new Float32Array(P*P*2);
      for(var k=0;k<P*P;k++){var an=rnd()*6.2832;g[k*2]=Math.cos(an);g[k*2+1]=Math.sin(an)}
      for(var y=0;y<N;y++){
        var fy=y/N*P,y0=Math.floor(fy),ty=fy-y0,y1=(y0+1)%P,v=fade(ty);
        for(var x=0;x<N;x++){
          var fx=x/N*P,x0=Math.floor(fx),tx=fx-x0,x1=(x0+1)%P,u=fade(tx);
          var i00=(y0*P+x0)*2,i10=(y0*P+x1)*2,i01=(y1*P+x0)*2,i11=(y1*P+x1)*2;
          var n00=g[i00]*tx+g[i00+1]*ty,n10=g[i10]*(tx-1)+g[i10+1]*ty;
          var n01=g[i01]*tx+g[i01+1]*(ty-1),n11=g[i11]*(tx-1)+g[i11+1]*(ty-1);
          var nx0=n00+(n10-n00)*u,nx1=n01+(n11-n01)*u;
          vals[y*N+x]+=amp*(nx0+(nx1-nx0)*v);
        }
      }
    }
    var mn=1e9,mx=-1e9;
    for(var q=0;q<N*N;q++){if(vals[q]<mn)mn=vals[q];if(vals[q]>mx)mx=vals[q]}
    for(var z=0;z<N*N;z++)data[z*4+ch]=Math.round((vals[z]-mn)/(mx-mn)*255);
  }
  for(var w=0;w<N*N;w++)data[w*4+3]=255;
  noiseTex=new TH.DataTexture(data,N,N,TH.RGBAFormat);
  noiseTex.wrapS=noiseTex.wrapT=TH.RepeatWrapping;
  noiseTex.magFilter=noiseTex.minFilter=TH.LinearFilter;
  noiseTex.needsUpdate=true;
  return noiseTex;
};

/* ---------- steam: twisted ribbons with scrolling wisps ---------- */
var STEAM_V=[
'uniform float uTime;uniform sampler2D uNoise;uniform float uSeed;uniform float uWind;',
'varying vec2 vUv;',
'vec2 rot(vec2 v,float a){float s=sin(a),c=cos(a);return mat2(c,s,-s,c)*v;}',
'void main(){',
' vec3 p=position;',
' float tw=texture2D(uNoise,vec2(.5+uSeed,uv.y*.2-uTime*.005)).r;',
' p.xz=rot(p.xz,tw*10.);',
' vec2 wind=vec2(texture2D(uNoise,vec2(.25+uSeed,uTime*.01)).g-.5,texture2D(uNoise,vec2(.75+uSeed,uTime*.01)).b-.5);',
' p.xz+=wind*pow(uv.y,2.)*uWind;',
' vUv=uv;',
' gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);',
'}'].join('\n');
var STEAM_F=[
'uniform float uTime;uniform sampler2D uNoise;uniform float uStrength;uniform vec3 uColor;uniform float uSeed;',
'varying vec2 vUv;',
'void main(){',
' vec2 s=vUv;s.x=s.x*.5+uSeed;s.y=s.y*.3-uTime*.03;',
' float m=texture2D(uNoise,s).r;',
' m=smoothstep(.42,1.,m);',
' float d=texture2D(uNoise,vec2(vUv.x*.8+uSeed*1.7,vUv.y*.55-uTime*.055)).g;',
' m*=mix(.55,1.35,d);',
' m*=smoothstep(0.,.18,vUv.x)*smoothstep(1.,.82,vUv.x);',
' m*=smoothstep(0.,.1,vUv.y)*smoothstep(1.,.4,vUv.y);',
' gl_FragColor=linearToOutputTexel(vec4(uColor,clamp(m*uStrength,0.,1.)));',
'}'].join('\n');
FX.Steam=function(o){
  o=o||{};
  var noise=FX.noise(),group=new TH.Group(),mats=[];
  var geo=new TH.PlaneGeometry(1,1,16,64);geo.translate(0,.5,0);
  var n=o.count||2;
  for(var i=0;i<n;i++){
    var mat=new TH.ShaderMaterial({
      uniforms:{uTime:{value:0},uNoise:{value:noise},uStrength:{value:o.strength!=null?o.strength:.6},uColor:{value:new TH.Color(o.color||0xfff4e8)},uSeed:{value:i*.37+(o.seed||0)},uWind:{value:o.wind||4}},
      vertexShader:STEAM_V,fragmentShader:STEAM_F,transparent:true,depthWrite:false,side:TH.DoubleSide});
    var m=new TH.Mesh(geo,mat);m.rotation.y=i*Math.PI/n;m.frustumCulled=false;m.renderOrder=o.renderOrder||10;
    group.add(m);mats.push(mat);
  }
  group.scale.set(o.width||1,o.height||3,o.width||1);
  var base=o.strength!=null?o.strength:.6;
  return {group:group,
    update:function(t){for(var i=0;i<mats.length;i++)mats[i].uniforms.uTime.value=t+i*13.7},
    strength:function(s){for(var i=0;i<mats.length;i++)mats[i].uniforms.uStrength.value=base*s}};
};

/* ---------- glowing ember points ---------- */
FX.embers=function(count,o){
  o=o||{};
  var geo=new TH.BufferGeometry(),pos=new Float32Array(count*3),seed=new Float32Array(count),size=new Float32Array(count);
  var rnd=FX.rng(o.seed||77);
  for(var i=0;i<count;i++){seed[i]=rnd()*100;size[i]=.4+rnd()*rnd()*2.2}
  geo.setAttribute('position',new TH.BufferAttribute(pos,3));
  geo.setAttribute('aSeed',new TH.BufferAttribute(seed,1));
  geo.setAttribute('aSize',new TH.BufferAttribute(size,1));
  var mat=new TH.ShaderMaterial({
    uniforms:{uTime:{value:0},uScale:{value:o.scale||60},uA:{value:new TH.Color(0xff6a10)},uB:{value:new TH.Color(0xffd27a)},uGain:{value:o.gain||2.2}},
    vertexShader:'attribute float aSeed;attribute float aSize;uniform float uTime;uniform float uScale;varying float vF;varying float vS;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float fl=.55+.45*sin(uTime*(2.+fract(aSeed)*5.)+aSeed*6.28);vF=fl;vS=fract(aSeed*1.37);gl_PointSize=aSize*uScale*fl/max(1.,-mv.z);}',
    fragmentShader:'uniform vec3 uA;uniform vec3 uB;uniform float uGain;varying float vF;varying float vS;void main(){vec2 d=gl_PointCoord-.5;float r=length(d);float a=smoothstep(.5,0.,r);a=a*a;vec3 c=mix(uA,uB,vS)*uGain*vF;gl_FragColor=linearToOutputTexel(vec4(c*a,a));}',
    transparent:true,depthWrite:false,blending:TH.AdditiveBlending});
  var pts=new TH.Points(geo,mat);pts.frustumCulled=false;
  return {points:pts,pos:pos,mat:mat};
};

/* ---------- post chain ---------- */
var FINAL={
  uniforms:{tDiffuse:{value:null},uTime:{value:0},uVignette:{value:.35},uGrain:{value:.035},uCA:{value:0},uRes:{value:new TH.Vector2(1,1)},uFlash:{value:0},uFlashCol:{value:new TH.Color(1,.82,.55)},uFade:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:[
  'uniform sampler2D tDiffuse;uniform float uTime;uniform float uVignette;uniform float uGrain;uniform float uCA;uniform float uFlash;uniform float uFade;uniform vec2 uRes;uniform vec3 uFlashCol;varying vec2 vUv;',
  'float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
  'void main(){vec2 d=vUv-.5;float k=uCA*(.6+dot(d,d)*4.);',
  ' vec3 c;c.r=texture2D(tDiffuse,vUv-d*k).r;c.g=texture2D(tDiffuse,vUv).g;c.b=texture2D(tDiffuse,vUv+d*k).b;',
  ' float v=smoothstep(.95,.22,length(d*vec2(1.,.9)));c*=mix(1.-uVignette,1.,v);',
  ' c=mix(c,uFlashCol*2.5,uFlash);c*=1.-uFade;',
  ' vec4 o=linearToOutputTexel(vec4(c,1.));',
  ' o.rgb+=(h(vUv*uRes+fract(uTime*7.)*91.7)-.5)*uGrain;',
  ' gl_FragColor=vec4(o.rgb,1.);}'].join('\n')
};
FX.post=function(renderer,scene,camera,o){
  if(!FX.hasPost())return null;
  o=o||{};
  var msaa=0;
  try{if(renderer.capabilities.isWebGL2&&renderer.extensions.has('EXT_color_buffer_float'))msaa=o.samples!=null?o.samples:(FX.tier>=1?4:0)}catch(e){}
  /* stencil forces a 24 bit depth buffer, so distant ground planes do not fight */
  var rt=new TH.WebGLRenderTarget(4,4,{type:FX.floatOK(renderer)?TH.HalfFloatType:TH.UnsignedByteType,stencilBuffer:true,samples:msaa});
  var comp=new TH.EffectComposer(renderer,rt);
  comp.addPass(new TH.RenderPass(scene,camera));
  var bokeh=null,bloom=null;
  if(o.bokeh&&TH.BokehPass&&TH.BokehShader){
    bokeh=new TH.BokehPass(scene,camera,{focus:o.bokeh.focus||10,aperture:o.bokeh.aperture||.001,maxblur:o.bokeh.maxblur||.008,width:4,height:4});
    comp.addPass(bokeh);
  }
  if(o.bloom){
    bloom=new TH.UnrealBloomPass(new TH.Vector2(256,256),o.bloom.strength,o.bloom.radius,o.bloom.threshold);
    comp.addPass(bloom);
  }
  var fin=new TH.ShaderPass(FINAL);
  fin.uniforms.uVignette.value=o.vignette!=null?o.vignette:.35;
  fin.uniforms.uGrain.value=o.grain!=null?o.grain:.03;
  fin.uniforms.uCA.value=o.ca||0;
  comp.addPass(fin);
  return {composer:comp,bokeh:bokeh,bloom:bloom,final:fin,
    setSize:function(w,h,pr){
      comp.setPixelRatio(pr);comp.setSize(w,h);
      fin.uniforms.uRes.value.set(w*pr,h*pr);
      if(bokeh)bokeh.uniforms.aspect.value=w/h;
    },
    render:function(t,dt){fin.uniforms.uTime.value=t;comp.render(dt)}};
};

/* ---------- drink surface: crema, microfoam, latte art, dusting ---------- */
FX.latteArt=function(o){
  o=o||{};
  return new TH.ShaderMaterial({
    uniforms:{uBase:{value:new TH.Color(o.base||0x9a5a28)},uMilk:{value:new TH.Color(o.milk||0xf6ead6)},uEdge:{value:new TH.Color(o.edge||0x4a2412)},
      uArt:{value:o.art!=null?o.art:1},uSpeck:{value:o.speck||0},uSpeckCol:{value:new TH.Color(o.speckCol||0x3a1a0c)},uFoam:{value:o.foam!=null?o.foam:1},uTime:{value:0},uEdgeK:{value:o.edgeK!=null?o.edgeK:1}},
    vertexShader:'varying vec2 vUv;varying vec3 vWP;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vWP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:[
    'uniform vec3 uBase;uniform vec3 uMilk;uniform vec3 uEdge;uniform vec3 uSpeckCol;uniform float uArt;uniform float uSpeck;uniform float uFoam;uniform float uTime;uniform float uEdgeK;',
    'varying vec2 vUv;varying vec3 vWP;',
    'float dot2(vec2 v){return dot(v,v);}',
    'float sdHeart(vec2 p){p.x=abs(p.x);if(p.y+p.x>1.)return sqrt(dot2(p-vec2(.25,.75)))-sqrt(2.)/4.;return sqrt(min(dot2(p-vec2(0.,1.)),dot2(p-.5*max(p.x+p.y,0.))))*sign(p.x-p.y);}',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'void main(){',
    ' vec2 p=(vUv-.5)*2.;float r=length(p);',
    ' vec3 c=mix(uBase,uEdge,smoothstep(.45,1.,r)*uEdgeK);',
    ' float sw=sin(atan(p.y,p.x)*3.+r*10.+uTime*.15)*.5+.5;',
    ' c=mix(c,c*1.18,sw*.18*(1.-r));',
    ' vec2 q=vec2(p.x,-p.y)*1.3+vec2(0.,.55);',
    ' float d=sdHeart(q);',
    ' float milk=1.-smoothstep(-.015,.025,d);',
    ' float bands=smoothstep(.28,.48,abs(fract(q.y*3.6+q.x*q.x*1.6)-.5));',
    ' float upper=smoothstep(.15,.45,q.y);',
    ' float art=milk*(1.-bands*upper*.7);',
    ' float pull=(1.-smoothstep(.0,.035,abs(q.x)))*smoothstep(-.35,-.05,q.y)*(1.-smoothstep(.6,.95,q.y));',
    ' art=max(art,pull*.9);',
    ' c=mix(c,uMilk,clamp(art,0.,1.)*uArt);',
    ' float b=hash(floor(p*70.));c*=1.+(b-.5)*.06*uFoam;',
    ' float bub=step(.993,hash(floor(p*38.)+7.))*(1.-r);c=mix(c,c*1.25,bub*uFoam);',
    ' float s=step(.975,hash(floor(p*95.)+3.))*smoothstep(.95,.3,r);c=mix(c,uSpeckCol,s*uSpeck);',
    ' vec3 V=normalize(cameraPosition-vWP);vec3 L=normalize(vec3(-.45,1.,.35));vec3 H=normalize(L+V);',
    ' float sp=pow(max(H.y,0.),160.)*.9+pow(max(H.y,0.),18.)*.06;',
    ' c+=sp;',
    ' #ifdef TONE_MAPPING\n c=toneMapping(c);\n #endif',
    ' gl_FragColor=linearToOutputTexel(vec4(c,1.));',
    '}'].join('\n')});
};

/* ---------- the TNT logo for canvas textures ---------- */
FX.fontsReady=function(){
  try{
    if(!document.fonts||!document.fonts.load)return Promise.resolve();
    var p=Promise.all([document.fonts.load('400 100px Anton'),document.fonts.load('italic 700 80px "Barlow Condensed"')]);
    return Promise.race([p,new Promise(function(r){setTimeout(r,1500)})]).catch(function(){});
  }catch(e){return Promise.resolve()}
};
FX.drawLogo=function(ctx,cx,cy,s,o){
  o=o||{};
  ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
  if(o.icon!==false){
    /* steam */
    ctx.lineCap='round';ctx.strokeStyle='#a8361b';ctx.lineWidth=7;
    ctx.beginPath();ctx.moveTo(-12,-150);ctx.bezierCurveTo(-30,-170,6,-185,-10,-205);ctx.stroke();
    ctx.beginPath();ctx.moveTo(14,-152);ctx.bezierCurveTo(-2,-168,30,-180,14,-198);ctx.stroke();
    /* mug */
    var g=ctx.createLinearGradient(-60,-140,60,-60);
    g.addColorStop(0,'#f07a46');g.addColorStop(.5,'#c2391b');g.addColorStop(1,'#6e1a0b');
    ctx.fillStyle=g;ctx.strokeStyle='#2a0f06';ctx.lineWidth=6;
    ctx.beginPath();ctx.moveTo(-62,-138);ctx.lineTo(62,-138);ctx.bezierCurveTo(60,-90,44,-62,0,-60);ctx.bezierCurveTo(-44,-62,-60,-90,-62,-138);ctx.closePath();
    ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.lineWidth=12;ctx.strokeStyle='#2a0f06';ctx.arc(66,-112,20,-1.4,1.6);ctx.stroke();
    ctx.beginPath();ctx.lineWidth=7;ctx.strokeStyle='#c2391b';ctx.arc(66,-112,20,-1.4,1.6);ctx.stroke();
    ctx.fillStyle='#3a160a';ctx.beginPath();ctx.ellipse(0,-138,60,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(-36,-110,6,16,-.3,0,Math.PI*2);ctx.fill();
  }
  /* TNT */
  ctx.font='400 128px Anton, Impact, sans-serif';ctx.textBaseline='alphabetic';
  var tw=ctx.measureText('TNT').width;
  ctx.font='italic 700 96px "Barlow Condensed", "Arial Narrow", sans-serif';
  var cw=ctx.measureText('cup').width;
  var total=tw+cw-6,x0=-total/2;
  ctx.font='400 128px Anton, Impact, sans-serif';
  ctx.lineJoin='round';
  ctx.fillStyle='#2a0f06';for(var e=1;e<=8;e++)ctx.fillText('TNT',x0+e*.6,10+e);
  ctx.lineWidth=12;ctx.strokeStyle='#2a0f06';ctx.strokeText('TNT',x0,10);
  var tg=ctx.createLinearGradient(0,-90,0,10);tg.addColorStop(0,'#ffe08a');tg.addColorStop(.45,'#ffb640');tg.addColorStop(1,'#e8601c');
  ctx.fillStyle=tg;ctx.fillText('TNT',x0,10);
  ctx.font='italic 700 96px "Barlow Condensed", "Arial Narrow", sans-serif';
  var cx2=x0+tw-6;
  ctx.lineWidth=10;ctx.strokeStyle='#2a0f06';ctx.strokeText('cup',cx2,-4);
  var cg=ctx.createLinearGradient(0,-70,0,0);cg.addColorStop(0,'#ff9a3c');cg.addColorStop(1,'#d23c16');
  ctx.fillStyle=cg;ctx.fillText('cup',cx2,-4);
  ctx.font='italic 700 46px "Barlow Condensed", "Arial Narrow", sans-serif';
  ctx.lineWidth=7;ctx.strokeStyle='#2a0f06';ctx.strokeText('coffee',cx2+18,40);
  ctx.fillStyle='#ffb640';ctx.fillText('coffee',cx2+18,40);
  ctx.restore();
};
FX.canvasTex=function(w,h,draw,o){
  var c=document.createElement('canvas');c.width=w;c.height=h;
  var ctx=c.getContext('2d');draw(ctx,w,h);
  var t=new TH.CanvasTexture(c);
  if(!o||o.color!==false)t.encoding=TH.sRGBEncoding;
  t.anisotropy=4;
  return t;
};
})();
