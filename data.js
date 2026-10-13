(function(){
'use strict';
var S2=function(n,s,m,sub){return {n:n,sub:sub,p:[s,m]}};
var ONE=function(n,p,sub){return {n:n,sub:sub,p:[p]}};
var TH=function(n,h,i,sub,opts){return {n:n,sub:sub,opts:opts,hot:h,iced:i}};
var NM=function(n){return {n:n}};
var LATTE_FL=['Vanilla','Sugar Free Vanilla','Spiced Brown Sugar','Sweetener','Hazelnut'];
var MATCHA_FL=['Strawberry','Mango','Lavender','Passionfruit','Watermelon'];
var MENU=[
 {id:'coffee',group:'coffee',title:'Coffee & Espresso',cols:['S','M'],items:[S2('Espresso',3.25,null),S2('Americano',3.75,4),S2('Cappuccino',4.5,4.75),S2('Macchiato',3.5,null),S2('Cortado',3.75,null),S2('Flat White',4.25,null),S2('Caramel Macchiato',5.25,6),S2('Regular Coffee',2.75,3.25)]},
 {id:'lattes',group:'lattes',title:'Latte Creations',temp:true,cols:['S','M'],flavour:{label:'Latte flavour',price:1,opts:LATTE_FL},items:[TH('Latte',[4.5,5],[5.75,6.25]),TH('French Vanilla Latte',[6.25,6.75],[7.5,8]),TH('Mocha Latte',[6.25,6.75],[7.5,8]),TH('Salted Caramel Latte',[5.75,6.25],[7,7.5]),TH('Spanish Latte',[6.75,7.25],[8,8.5])]},
 {id:'matcha',group:'matcha',title:'Matcha Creations',temp:true,cols:['S','M'],items:[TH('Classic Matcha',[5.75,6.25],[7,7.5],'Unsweetened'),TH('Flavoured Matcha',[7.25,7.75],[8.5,9],MATCHA_FL.join(', '),MATCHA_FL),TH('TNT Matcha',[8.5,9.25],[9.75,10.5])]},
 {id:'signature',group:'signature',title:'Signature',cols:[''],single:true,items:[ONE('TNT Latte',7.75),ONE('Pistachio Dream',9.75),ONE('Golden Lotus',9.75),ONE('TNT Hazelnut Latte',8.25)]},
 {id:'hotchoc',group:'hot',title:'Hot Chocolate',cols:['S','M'],items:[S2('Dark Chocolate',4.75,5.75),S2('White Chocolate',5,6)]},
 {id:'teas',group:'hot',title:'Teas',cols:['M'],items:[ONE('Tea',3.75,'English Breakfast, Chamomile, Peppermint, Green Tea'),ONE('Moroccan Tea',4.5),ONE('Karak Tea (Chai)',4.5),ONE('Ginger Lemon Honey',4.5)]},
 {id:'smoothies',group:'cold',title:'Smoothies',flat:8.5,tag:'Freshly blended daily',items:[NM('Raspberry'),NM('Mango'),NM('Strawberry'),NM('Blueberry')]},
 {id:'mojitos',group:'cold',title:'Sparkling Mojitos',cols:['S','M'],items:[S2('Strawberry Mojito',5.75,6.75),S2('Passionfruit Mojito',5.75,6.75),S2('Mango Mojito',5.75,6.75),S2('TNT Mojito',7.5,8.25),S2('Classic Mojito',5.75,6.75)]},
 {id:'refresh',group:'cold',title:'Refreshing Drinks',flat:6.5,items:[NM('Blue Shock'),NM('Passion Rush'),NM('Lush Ice'),NM('Dynamite Berry')]},
 {id:'slushes',group:'cold',title:'Chill Slushes',cols:['M'],items:[ONE('TNT Slush',8.5),ONE('Mix Slush',8.5),ONE('Rainbow Slush',8.5),ONE('Mango Slush',7.5),ONE('Passionfruit Slush',7.5),ONE('Bluerazz Slush',7.5),ONE('Red Raspberry Slush',7.5)]},
 {id:'milkshakes',group:'shakes',title:'Milkshakes',cols:['S','M'],note:'Extra ice cream scoop $1.50',items:[S2('Chocolate Milkshake',9.8,12.3),S2('Vanilla Milkshake',9.8,12.3),S2('Cherry Milkshake',9.8,12.3)]},
 {id:'frappe',group:'shakes',title:'Frappe',cols:['S','M'],items:[S2('Caramel Frappe',7.5,8.25),S2('Mocha Frappe',7.5,8.25)]},
 {id:'addons',group:'addons',title:'Add-ons',addons:true}
];
var ADDONS=[
 {id:'shot',n:'Extra shot',p:1.5},
 {id:'syrup',n:'Flavor syrup',p:0.75,opts:['Vanilla','Caramel','Hazelnut','French Vanilla','Brown Sugar'],word:'syrup'},
 {id:'milk',n:'Alternative milk',p:1.5,opts:['Oat','Almond','Soy','Coconut'],word:'milk'},
 {id:'whip',n:'Whipped cream',p:0.25},
 {id:'sauce',n:'Extra sauce / drizzle',p:0.5}
];
var GROUPS=[['all','All'],['coffee','Coffee'],['lattes','Lattes'],['matcha','Matcha'],['signature','Signature'],['hot','Hot chocolate and tea'],['cold','Cold drinks'],['shakes','Shakes and frappe'],['addons','Add-ons']];
var BUILD_CATS=['coffee','lattes','matcha','signature','hotchoc','frappe'];

var T=window.TNT=window.TNT||{};
T.introActive=!!window.TNT_INTRO;
T.MENU=MENU;T.ADDONS=ADDONS;T.GROUPS=GROUPS;T.BUILD_CATS=BUILD_CATS;
T.esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
T.money=function(n){return '$'+n.toFixed(2)};
T.cat=function(id){return MENU.filter(function(c){return c.id===id})[0]};
T.getBase=function(id){var p=id.split(':');var c=T.cat(p[0]);return {c:c,it:c.items[+p[1]]}};
T.arrOf=function(it,temp){return it.hot?it[temp.toLowerCase()]:it.p};
T.priceAt=function(it,temp,idx){return T.arrOf(it,temp)[idx]};
T.reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
})();
