(function(){
'use strict';
var T=window.TNT,esc=T.esc,money=T.money,MENU=T.MENU,ADDONS=T.ADDONS,GROUPS=T.GROUPS;
var M={group:'all',q:'',temps:{lattes:'Hot',matcha:'Hot'}};
var chipsEl=document.getElementById('chips'),menuEl=document.getElementById('menuGrid');

function renderChips(){
  chipsEl.innerHTML=GROUPS.map(function(g){return '<button class="chip" type="button" data-group="'+g[0]+'" aria-pressed="'+(M.group===g[0])+'">'+g[1]+'</button>'}).join('');
}
function tempToggle(id,t){
  return '<div class="tt" role="group" aria-label="Hot or iced">'+['Hot','Iced'].map(function(x){return '<button type="button" data-temp="'+id+'" data-t="'+x+'" aria-pressed="'+(t===x)+'">'+x+'</button>'}).join('')+'</div>';
}
function panel(c,q){
  var titleHit=q&&c.title.toLowerCase().indexOf(q)>-1;
  if(c.addons){
    var hit=ADDONS.some(function(a){return (a.n+' '+(a.opts||[]).join(' ')).toLowerCase().indexOf(q)>-1});
    if(q&&!titleHit&&!hit)return '';
    return '<section class="panel" aria-labelledby="h-addons"><header class="ph"><h3 id="h-addons">Add-ons</h3></header>'+ADDONS.map(function(a){return '<div class="row" style="--n:1"><div class="nm">'+esc(a.n)+(a.opts?'<small>'+a.opts.join(', ')+'</small>':'')+'</div><span class="pr">'+money(a.p)+'</span></div>'}).join('')+'</section>';
  }
  var items=c.items.filter(function(it){return !q||titleHit||(it.n+' '+(it.sub||'')).toLowerCase().indexOf(q)>-1});
  if(!items.length)return '';
  var temp=c.temp?M.temps[c.id]:null;
  var h='<section class="panel'+(temp==='Iced'?' is-iced':'')+'" aria-labelledby="h-'+c.id+'"><header class="ph"><h3 id="h-'+c.id+'">'+esc(c.title)+'</h3>';
  if(c.temp)h+=tempToggle(c.id,temp);
  if(c.flat)h+='<span class="flat-badge">'+money(c.flat)+' each</span>';
  h+='</header>';
  if(c.tag)h+='<p class="ptag">'+esc(c.tag)+'</p>';
  if(c.flat){
    h+='<ul class="flat">'+items.map(function(it){return '<li>'+esc(it.n)+'</li>'}).join('')+'</ul>';
  }else{
    var n=c.cols.length;
    if(!c.single)h+='<div class="row head" style="--n:'+n+'"><span></span>'+c.cols.map(function(x){return '<span>'+x+'</span>'}).join('')+'</div>';
    h+=items.map(function(it){
      var cells=T.arrOf(it,temp||'Hot').map(function(v){return v==null?'<span class="pr na">n/a</span>':'<span class="pr">'+money(v)+'</span>'}).join('');
      return '<div class="row" style="--n:'+n+'"><div class="nm">'+esc(it.n)+(it.sub?'<small>'+esc(it.sub)+'</small>':'')+'</div>'+cells+'</div>';
    }).join('');
  }
  if(c.flavour)h+='<div class="fl"><p>Latte flavours +$1</p><ul>'+c.flavour.opts.map(function(o){return '<li>'+o+'</li>'}).join('')+'</ul></div>';
  if(c.note)h+='<div class="fl"><p>'+esc(c.note)+'</p></div>';
  return h+'</section>';
}
function renderMenu(){
  var q=M.q.trim().toLowerCase();
  var html=MENU.filter(function(c){return M.group==='all'||c.group===M.group}).map(function(c){return panel(c,q)}).join('');
  menuEl.innerHTML=html||'<p class="empty">No drinks match "'+esc(M.q.trim())+'". Try a flavour like mango or a drink like latte.</p>';
}
chipsEl.addEventListener('click',function(e){
  var b=e.target.closest('[data-group]');if(!b)return;
  M.group=b.getAttribute('data-group');renderChips();renderMenu();
});
menuEl.addEventListener('click',function(e){
  var b=e.target.closest('[data-temp]');if(!b)return;
  M.temps[b.getAttribute('data-temp')]=b.getAttribute('data-t');renderMenu();
});
document.getElementById('q').addEventListener('input',function(e){
  M.q=e.target.value;
  if(M.q.trim()&&M.group!=='all'){M.group='all';renderChips()}
  renderMenu();
});
renderChips();renderMenu();
})();
