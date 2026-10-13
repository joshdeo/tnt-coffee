(function(){
'use strict';
var T=window.TNT,esc=T.esc,money=T.money,ADDONS=T.ADDONS,getBase=T.getBase,priceAt=T.priceAt;
var $=function(s){return document.querySelector(s)};
var B={drink:'lattes:3',temp:'Iced',size:'M',flavour:'None',ao:{shot:true,syrup:false,milk:true,whip:false,sauce:false},opt:{syrup:'Vanilla',milk:'Oat'}};
var flKey='',arrived=false;

/* keep the sticky cup just under the header */
function setHdr(){
  var h=document.querySelector('.top');
  if(h)document.documentElement.style.setProperty('--hdr',h.offsetHeight+'px');
}
setHdr();window.addEventListener('resize',setHdr);window.addEventListener('load',setHdr);

/* a drink suggested on another page */
try{
  var raw=localStorage.getItem('tnt.build');
  if(raw){
    localStorage.removeItem('tnt.build');
    var p=raw.split('|');
    if(p[0]&&/^[a-z]+:\d+$/.test(p[0])&&T.cat(p[0].split(':')[0])){
      B.drink=p[0];if(p[1])B.temp=p[1];if(p[2])B.size=p[2];B.flavour='';
      B.ao={shot:false,syrup:false,milk:false,whip:false,sauce:false};
      arrived=true;
    }
  }
}catch(e){}
/* the same handoff through the link itself, in case storage is blocked */
try{
  var hm=/^#pour-([a-z]+)-(\d+)$/.exec(location.hash||'');
  if(hm&&T.cat(hm[1])&&T.cat(hm[1]).items[+hm[2]]&&T.BUILD_CATS.indexOf(hm[1])>-1){
    var id=hm[1]+':'+hm[2];
    if(B.drink!==id){B.drink=id;B.flavour='';B.ao={shot:false,syrup:false,milk:false,whip:false,sauce:false}}
    arrived=true;
  }
}catch(e){}

function flavourDef(){
  var b=getBase(B.drink);
  if(b.it.opts)return {label:'Flavour',opts:b.it.opts,price:0,optional:false};
  if(b.c.flavour)return {label:'Latte flavour, +$1.00',opts:b.c.flavour.opts,price:b.c.flavour.price,optional:true};
  return null;
}
function normalize(){
  var b=getBase(B.drink);
  if(!b.c.single&&priceAt(b.it,B.temp,1)==null)B.size='S';
  if(b.c.single)B.size='S';
  var fl=flavourDef();
  if(!fl){B.flavour=''}
  else{
    var ok=fl.opts.indexOf(B.flavour)>-1||(fl.optional&&B.flavour==='None');
    if(!ok)B.flavour=fl.optional?'None':fl.opts[0];
  }
}
function calc(){
  var b=getBase(B.drink),c=b.c,it=b.it,lines=[],total=0;
  var idx=c.single?0:(B.size==='S'?0:1);
  var bp=priceAt(it,B.temp,idx);
  lines.push({l:(it.hot?B.temp+' ':'')+it.n+(c.single?'':(B.size==='S'?', small':', medium')),p:bp});total+=bp;
  var fl=flavourDef();
  if(fl&&B.flavour&&B.flavour!=='None'){lines.push({l:B.flavour+(fl.price?' flavour':''),p:fl.price});total+=fl.price}
  ADDONS.forEach(function(a){
    if(!B.ao[a.id])return;
    lines.push({l:a.opts?(B.opt[a.id]+' '+a.word):a.n,p:a.p});total+=a.p;
  });
  var name=($('#tkName')&&$('#tkName').value.trim())||'';
  var text='TNT Cup Coffee order'+(name?' for '+name:'')+'\n'+lines.map(function(x){return x.l}).join(', ')+'\nEstimated total '+money(total)+' before tax';
  return {lines:lines,total:total,text:text};
}

var sel=$('#bDrink');
sel.innerHTML=T.BUILD_CATS.map(function(id){
  var c=T.cat(id);
  return '<optgroup label="'+esc(c.title)+'">'+c.items.map(function(it,i){return '<option value="'+id+':'+i+'">'+esc(it.n)+'</option>'}).join('')+'</optgroup>';
}).join('');
$('#aoList').innerHTML=ADDONS.map(function(a){
  return '<div class="ao'+(a.opts?'':' solo')+'"><label class="ao-main" for="ao-'+a.id+'"><input type="checkbox" id="ao-'+a.id+'" data-ao="'+a.id+'"><span class="ao-name">'+esc(a.n)+'</span><span class="ao-price">+'+money(a.p)+'</span></label>'+
    (a.opts?'<select id="op-'+a.id+'" data-opt="'+a.id+'" aria-label="'+esc(a.n)+' choice">'+a.opts.map(function(o){return '<option>'+o+'</option>'}).join('')+'</select>':'')+'</div>';
}).join('');

function render(){
  normalize();
  var b=getBase(B.drink),c=b.c,it=b.it;
  sel.value=B.drink;
  $('#tempWrap').hidden=!it.hot;
  document.querySelectorAll('input[name=bTemp]').forEach(function(r){r.checked=r.value===B.temp});
  $('#sizeWrap').hidden=!!c.single;
  $('#oneSize').hidden=!c.single;
  if(!c.single){
    ['S','M'].forEach(function(s,i){
      var v=priceAt(it,B.temp,i),r=document.querySelector('input[name=bSize][value='+s+']');
      r.disabled=v==null;r.checked=B.size===s;
      $(i?'#pM':'#pS').textContent=v==null?'n/a':money(v);
    });
  }
  var fl=flavourDef();
  $('#flWrap').hidden=!fl;
  if(fl){
    if(flKey!==B.drink){
      flKey=B.drink;
      $('#flLbl').textContent=fl.label;
      var opts=(fl.optional?['None']:[]).concat(fl.opts);
      $('#flList').innerHTML=opts.map(function(o){return '<label><input type="radio" name="bFl" value="'+o+'"><span>'+o+'</span></label>'}).join('');
    }
    document.querySelectorAll('input[name=bFl]').forEach(function(r){r.checked=r.value===B.flavour});
  }
  ADDONS.forEach(function(a){
    $('#ao-'+a.id).checked=!!B.ao[a.id];
    if(a.opts){var s=$('#op-'+a.id);s.value=B.opt[a.id];s.disabled=!B.ao[a.id]}
  });
  var r=calc();
  $('#lines').innerHTML=r.lines.map(function(x){return '<li><span>'+esc(x.l)+'</span>'+(x.p?'<span class="p">'+money(x.p)+'</span>':'<span class="p inc">Included</span>')+'</li>'}).join('');
  $('#total').textContent=money(r.total);
  $('#stageTag').textContent=r.lines[0].l;
  $('#stagePrice').textContent=money(r.total);

  var rec=T.makeRecipe(B);
  $('#legend').innerHTML=rec.legend.map(function(l){return '<li><i style="background:'+T.css(l.c)+'"></i>'+esc(l.l)+'</li>'}).join('');
  if(T.cup)T.cup.update(rec);
  renderTicket(r);
}
sel.addEventListener('change',function(e){B.drink=e.target.value;B.flavour='';render()});
document.querySelectorAll('input[name=bTemp]').forEach(function(r){r.addEventListener('change',function(){B.temp=r.value;render()})});
document.querySelectorAll('input[name=bSize]').forEach(function(r){r.addEventListener('change',function(){B.size=r.value;render()})});
$('#flList').addEventListener('change',function(e){if(e.target.name==='bFl'){B.flavour=e.target.value;render()}});
$('#aoList').addEventListener('change',function(e){
  var t=e.target;
  if(t.hasAttribute('data-ao'))B.ao[t.getAttribute('data-ao')]=t.checked;
  if(t.hasAttribute('data-opt'))B.opt[t.getAttribute('data-opt')]=t.value;
  render();
});


/* barista ticket: the cup moves into a full screen view */
var tk=$('#ticket'),tkStage=$('#tkStage'),home=$('#cupwrap'),stage=$('#stage'),opener=null;
function renderTicket(r){
  r=r||calc();
  var name=$('#tkName').value.trim();
  $('#tkTitle').textContent=name?'Order for '+name:'Your order';
  $('#tkLines').innerHTML=r.lines.map(function(x){return '<li>'+esc(x.l)+'</li>'}).join('');
  $('#tkTotal').textContent=money(r.total);
}
function openTicket(){
  opener=document.activeElement;
  tkStage.appendChild(stage);
  tk.hidden=false;document.body.style.overflow='hidden';
  renderTicket();
  $('#tkClose').focus();
  if(T.cup)T.cup.resize();
}
function closeTicket(){
  tk.hidden=true;document.body.style.overflow='';
  home.appendChild(stage);
  if(T.cup)T.cup.resize();
  if(opener&&opener.focus)opener.focus();
}
$('#showBarista').addEventListener('click',openTicket);
$('#showCounter').addEventListener('click',openTicket);
$('#tkClose').addEventListener('click',closeTicket);
$('#tkName').addEventListener('input',function(){renderTicket()});
document.addEventListener('keydown',function(e){
  if(tk.hidden)return;
  if(e.key==='Escape'){closeTicket();return}
  if(e.key==='Tab'){
    var f=[$('#tkName'),$('#tkGame'),$('#tkClose')],i=f.indexOf(document.activeElement);
    if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus()}
    else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus()}
  }
});

render();

/* arriving from a house drink: say what is pouring and draw the eye to the cup */
if(arrived){
  var lede=document.querySelector('.phead .lede');
  if(lede)lede.textContent='Pouring your '+getBase(B.drink).it.n+'. Change the size, flavour or add-ons below and the cup updates as you go.';
  var st=$('#stage');
  if(st)st.classList.add('arrive');
  if(window.innerWidth<=860){
    setTimeout(function(){
      var b=document.querySelector('.build'),h=document.querySelector('.top');
      if(b)window.scrollTo({top:b.getBoundingClientRect().top+(window.scrollY||0)-(h?h.offsetHeight:0)-8,behavior:T.reduced?'auto':'smooth'});
    },450);
  }
}
})();
