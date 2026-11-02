/* POPIÓŁ I DZWON / ASH & BELL — original browser action RPG vertical slice.
 * Deterministic world recipe, real-time physics/AI, no network/dependencies.
 * Runtime loop: input -> authoritative simulation -> Canvas feedback.
 */
(function(){
'use strict';
const A=window.Art,canvas=document.getElementById('game'),g=canvas.getContext('2d',{alpha:false});
g.imageSmoothingEnabled=false;
const W=1088,H=800,VW=640,VH=360,bell={x:894,y:224};
const ui={hp:document.getElementById('hp'),souls:document.getElementById('souls'),potion:document.getElementById('potion'),ability:document.getElementById('ability'),quest:document.getElementById('quest'),message:document.getElementById('message'),overlay:document.getElementById('overlay'),title:document.getElementById('overlay-title'),text:document.getElementById('overlay-text'),start:document.getElementById('start'),roll:document.getElementById('roll')};
const props=[
  {kind:'tree',x:96,y:344,r:15},{kind:'tree',x:192,y:274,r:16,variant:1},
  {kind:'tree',x:334,y:248,r:16,variant:2},{kind:'tree',x:461,y:195,r:15},
  {kind:'tree',x:592,y:137,r:16,variant:2},{kind:'tree',x:750,y:112,r:16,variant:1},
  {kind:'tree',x:1024,y:342,r:16},{kind:'tree',x:966,y:586,r:16,variant:2},
  {kind:'tree',x:796,y:708,r:16,variant:1},{kind:'tree',x:520,y:726,r:16},
  {kind:'pillar',x:752,y:319,r:13},{kind:'pillar',x:977,y:299,r:13,broken:1},
  {kind:'pillar',x:804,y:73,r:13,broken:1},{kind:'pillar',x:984,y:73,r:13},
  {kind:'grave',x:306,y:668,r:11},{kind:'grave',x:402,y:634,r:11},
  {kind:'grave',x:477,y:569,r:11},{kind:'grave',x:615,y:527,r:11},
  {kind:'grave',x:696,y:427,r:11},{kind:'grave',x:801,y:409,r:11},
  {kind:'grave',x:166,y:455,r:11},{kind:'grave',x:524,y:307,r:11},
  {kind:'cart',x:356,y:368,r:20},
  {kind:'brazier',x:822,y:192,r:9},{kind:'brazier',x:969,y:192,r:9},
  {kind:'brazier',x:201,y:635,r:9},
  {kind:'bell',x:bell.x,y:bell.y,r:35}
];
const floor=A.ground(W,H,1701),keys=Object.create(null);
let state='intro',last=0,clock=0,cam={x:0,y:0},mouse={x:0,y:0,active:false,down:false};
let hero,enemies,drops,particles,floaters,souls,kills,flash,messageTimer,screenShake;
let seed=1;
function initial(){hero={x:137,y:654,r:10,hp:100,maxHp:100,speed:112,walk:0,moving:false,facing:-.7,swing:0,attackCd:0,roll:0,rollCd:0,rollX:0,rollY:0,hurt:0,inv:0,potions:1};
  enemies=[
    [278,556,11],[397,485,12],[541,423,13],[672,350,14],[769,252,15],[925,418,16]
  ].map(([x,y,sd],i)=>({id:i,x,y,r:11,seed:sd,hp:64,maxHp:64,dead:false,speed:35+(i%3)*5,state:'idle',timer:0,flash:0,attackDone:false,dir:0,homeX:x,homeY:y,stagger:0}));
  drops=[];particles=[];floaters=[];souls=0;kills=0;flash=0;screenShake=0;messageTimer=0;clock=0;seed=45321;cam.x=0;cam.y=0;announce('Cztery iskry obudzą dzwon.');
}
function rng(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
function showOverlay(title,text,button){ui.title.textContent=title;ui.text.textContent=text;ui.start.textContent=button;ui.overlay.classList.add('visible')}
function start(){initial();state='playing';ui.overlay.classList.remove('visible');canvas.focus();updateHud()}
function finish(won){if(state!=='playing')return;state=won?'victory':'dead';
  showOverlay(won?'Dzwon przemówił':'Cisza po ostatnim oddechu',won?'Uwolnione iskry rozpaliły brąz dzwonu. Przeklęta dolina znów pamięta światło.':`Walka dobiegła końca. Zdobyte iskry: ${souls} / 4. Śmierć jest tylko kolejną drogą przez popiół.`,won?'ZAGRAJ PONOWNIE':'POWSTAŃ Z POPIOŁU');updateHud()}
ui.start.addEventListener('click',start);
function announce(s){ui.message.textContent=s;messageTimer=3.3}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function norm(x,y){const l=Math.hypot(x,y)||1;return [x/l,y/l]}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
// Collider centers are foot anchors. Props and world border are solid.
function collisionAt(x,y,r,ignore){if(x<38+r||y<38+r||x>W-38-r||y>H-38-r)return true;
 for(const o of props){if(o===ignore)continue;if(Math.hypot(x-o.x,y-o.y)<r+o.r)return true}
 return false}
function slideMove(entity,dx,dy){let moved=false;
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));dx/=steps;dy/=steps;
 for(let i=0;i<steps;i++){
  if(!collisionAt(entity.x+dx,entity.y,entity.r)){entity.x+=dx;moved=true}
  if(!collisionAt(entity.x,entity.y+dy,entity.r)){entity.y+=dy;moved=true}
 }
 return moved
}
function spawnParticles(x,y,color,n=7,power=1){for(let i=0;i<n;i++){const a=rng()*Math.PI*2,s=(22+rng()*65)*power;
 particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-24,life:.25+rng()*.42,max:.68,c:color,size:1+rng()*2})}}
function floatText(x,y,text,color='#f3dab7'){floaters.push({x,y,text,life:.8,color})}
function hurtHero(n,source){if(hero.inv>0||hero.roll>0||state!=='playing')return false;
 hero.hp=Math.max(0,hero.hp-n);hero.inv=.62;hero.hurt=.36;flash=.23;screenShake=7;
 spawnParticles(hero.x,hero.y-20,'#d46e65',12);floatText(hero.x,hero.y-34,'−'+n,'#f1a89d');announce('Cień rozrywa pancerz!');
 if(hero.hp<=0)finish(false);return true}
function hitEnemy(e,n){if(e.dead)return;
 e.hp=Math.max(0,e.hp-n);e.flash=.23;e.stagger=.22;e.state='stagger';e.timer=.22;
 const [nx,ny]=norm(e.x-hero.x,e.y-hero.y);slideMove(e,nx*11,ny*11);
 spawnParticles(e.x,e.y-22,'#9cd4b8',10);floatText(e.x,e.y-35,String(n),'#f7dfb9');
 if(e.hp===0){e.dead=true;kills++;spawnParticles(e.x,e.y-20,'#bbdcad',27,1.1);drops.push({x:e.x,y:e.y,kind:'ember',phase:rng()*6});
   if(kills%3===0)drops.push({x:e.x+15,y:e.y+6,kind:'flask',phase:rng()*6});announce('Strażnik pyłu rozsypał się w popiół.')}
}
function attack(){if(state!=='playing'||hero.attackCd>0||hero.roll>0)return false;
 hero.swing=1;hero.attackCd=.39;const reach=51;
 spawnParticles(hero.x+Math.cos(hero.facing)*23,hero.y-16+Math.sin(hero.facing)*9,'#cfb07c',5,.6);
 for(const e of enemies){if(e.dead)continue;const dx=e.x-hero.x,dy=e.y-hero.y,d=Math.hypot(dx,dy);
  const diff=Math.atan2(Math.sin(Math.atan2(dy,dx)-hero.facing),Math.cos(Math.atan2(dy,dx)-hero.facing));
  if(d<reach+e.r&&Math.abs(diff)<1.02)hitEnemy(e,28)}
 return true}
function heal(){if(state!=='playing'||!hero.potions||hero.hp>=hero.maxHp)return false;
 hero.potions--;hero.hp=Math.min(hero.maxHp,hero.hp+45);spawnParticles(hero.x,hero.y-16,'#e97770',18);floatText(hero.x,hero.y-40,'+45','#f8b7a0');announce('Wypito miksturę żarzącego węgla.');updateHud();return true}
function roll(){if(state!=='playing'||hero.rollCd>0)return false;let x=0,y=0;
 if(keys.KeyA||keys.ArrowLeft)x--;if(keys.KeyD||keys.ArrowRight)x++;
 if(keys.KeyW||keys.ArrowUp)y--;if(keys.KeyS||keys.ArrowDown)y++;
 if(!x&&!y){x=Math.cos(hero.facing);y=Math.sin(hero.facing)}
 [hero.rollX,hero.rollY]=norm(x,y);hero.roll=.24;hero.rollCd=1.7;spawnParticles(hero.x,hero.y,'#98a69a',10,.45);return true}
function interact(){if(state!=='playing')return false;
 if(Math.hypot(hero.x-bell.x,hero.y-bell.y)<96){if(souls>=4){finish(true);return true}announce(`Dzwon potrzebuje ${4-souls} kolejnych iskier.`);return false}
 announce('Przy dzwonie można złożyć iskry.');return false}
function updateHero(dt){
 hero.attackCd=Math.max(0,hero.attackCd-dt);hero.swing=Math.max(0,hero.swing-dt*4.5);
 hero.rollCd=Math.max(0,hero.rollCd-dt);hero.inv=Math.max(0,hero.inv-dt);hero.hurt=Math.max(0,hero.hurt-dt);
 let x=+(!!keys.KeyD||!!keys.ArrowRight)-+(!!keys.KeyA||!!keys.ArrowLeft);
 let y=+(!!keys.KeyS||!!keys.ArrowDown)-+(!!keys.KeyW||!!keys.ArrowUp);
 if(mouse.active){const targetX=mouse.x+cam.x,targetY=mouse.y+cam.y;const aim=Math.atan2(targetY-hero.y,targetX-hero.x);if(Math.hypot(targetX-hero.x,targetY-hero.y)>7)hero.facing=aim}
 if(hero.roll>0){hero.roll=Math.max(0,hero.roll-dt);slideMove(hero,hero.rollX*260*dt,hero.rollY*260*dt);hero.moving=true}
 else if(x||y){[x,y]=norm(x,y);if(!mouse.active)hero.facing=Math.atan2(y,x);hero.moving=slideMove(hero,x*hero.speed*dt,y*hero.speed*dt)}
 else hero.moving=false;
 if(hero.moving)hero.walk+=dt*1.4;
 if(mouse.down)attack();
}
function tickEnemy(e,dt){if(e.dead)return;e.flash=Math.max(0,e.flash-dt);e.timer=Math.max(0,e.timer-dt);
 const d=distance(e,hero),dx=hero.x-e.x,dy=hero.y-e.y,[ux,uy]=norm(dx,dy);
 if(e.state==='stagger'){if(e.timer<=0)e.state='chase';return}
 if(e.state==='idle'&&d<222)e.state='chase';
 if(e.state==='idle'){
   // idle patrol is a real state: short deterministic orbit around spawn.
   if(d>260){const phase=clock*.55+e.seed,tx=e.homeX+Math.cos(phase)*15,ty=e.homeY+Math.sin(phase)*13,[vx,vy]=norm(tx-e.x,ty-e.y);
    if(Math.hypot(tx-e.x,ty-e.y)>2)slideMove(e,vx*e.speed*.22*dt,vy*e.speed*.22*dt)}return;
 }
 if(e.state==='chase'){
   if(d>345){e.state='idle';return}
   if(d<34){e.state='windup';e.timer=.48;e.dir=Math.atan2(dy,dx);return}
   const oldX=e.x,oldY=e.y;slideMove(e,ux*e.speed*dt,uy*e.speed*dt);
   // Local obstacle detour: steering tangent around a blocked foot circle.
   if(Math.hypot(e.x-oldX,e.y-oldY)<.06){const turn=e.id%2?1:-1;slideMove(e,-uy*turn*e.speed*.8*dt,ux*turn*e.speed*.8*dt)}
   return;
 }
 if(e.state==='windup'&&e.timer<=0){e.state='lunge';e.timer=.26;e.attackDone=false;return}
 if(e.state==='lunge'){
   slideMove(e,Math.cos(e.dir)*126*dt,Math.sin(e.dir)*126*dt);
   if(!e.attackDone&&distance(e,hero)<28){hurtHero(14,e);e.attackDone=true}
   if(e.timer<=0){e.state='recover';e.timer=.82}return;
 }
 if(e.state==='recover'&&e.timer<=0){e.state='chase'}
}
function collectDrops(){for(let i=drops.length-1;i>=0;i--){const d=drops[i];if(distance(d,hero)<22){drops.splice(i,1);
 if(d.kind==='ember'){souls=Math.min(4,souls+1);announce(souls>=4?'Cztery iskry. Rozpal dzwon (F).':`Iskra ${souls}/4 — odzyskano pamięć popiołów.`);spawnParticles(d.x,d.y-12,'#ffda88',13)}
 else{hero.potions++;announce('Zdobyto miksturę z popiołu.');spawnParticles(d.x,d.y-11,'#e98e83',9)}
 }}}
function updateEffects(dt){for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*2.2;p.vy+=50*dt}particles=particles.filter(p=>p.life>0);
 for(const f of floaters){f.life-=dt;f.y-=20*dt}floaters=floaters.filter(f=>f.life>0);
 flash=Math.max(0,flash-dt);screenShake=Math.max(0,screenShake-dt*19);
 if(messageTimer>0){messageTimer-=dt;if(messageTimer<=0)ui.message.textContent='Słyszysz pękające kamienie pod stopami...'}
}
function update(dt){clock+=dt;if(state==='playing'){updateHero(dt);for(const e of enemies)tickEnemy(e,dt);collectDrops();}
 updateEffects(dt);
 cam.x=clamp(hero.x-VW*.45,0,W-VW);cam.y=clamp(hero.y-VH*.54,0,H-VH);updateHud()}
function updateHud(){if(!hero)return;ui.hp.textContent=Math.ceil(hero.hp);ui.souls.textContent=`✧ ${souls} / 4 ISKIER`;ui.potion.textContent=`✚ ${hero.potions} ${hero.potions===1?'MIKSTURA':'MIKSTURY'}`;
 ui.ability.textContent=hero.attackCd>0?'⚔ ODNOWA':'⚔ ATAK GOTOWY';ui.roll.textContent=hero.rollCd>0?'·':'↗';
 ui.quest.textContent=souls>=4?'Wróć do dzwonu i naciśnij F':`Zbierz cztery iskry umarłych (${souls}/4)`}
function render(){
 g.save();g.clearRect(0,0,VW,VH);g.fillStyle='#11171b';g.fillRect(0,0,VW,VH);
 const shake=screenShake>0?Math.round((rng()-.5)*screenShake):0;
 g.translate(Math.round(-cam.x+shake),Math.round(-cam.y));
 g.drawImage(floor,0,0);
 // Ground ambient lighting and fixed lantern pools are composited on world coordinates.
 for(const o of props){if(o.kind==='brazier')A.glow(g,o.x,o.y-20,79,'#e69c56',.25)}
 const objects=props.map(o=>({sort:o.y,draw:()=>A.drawProp(g,o,clock,souls>=4)}));
 for(const e of enemies)if(!e.dead)objects.push({sort:e.y,draw:()=>A.drawEnemy(g,e,clock)});
 objects.push({sort:hero.y,draw:()=>A.drawHero(g,hero,clock)});
 for(const d of drops)objects.push({sort:d.y,draw:()=>d.kind==='ember'?A.ember(g,d,clock):A.flask(g,d,clock)});
 objects.sort((a,b)=>a.sort-b.sort);for(const obj of objects)obj.draw();
 A.slash(g,hero);
 for(const p of particles){g.globalAlpha=Math.min(1,p.life/.3);A.rect(g,p.x,p.y,p.size,p.size,p.c)}g.globalAlpha=1;
 for(const f of floaters){g.globalAlpha=Math.min(1,f.life/.3);g.textAlign='center';g.font='bold 12px Georgia';g.fillStyle='#151a20';g.fillText(f.text,f.x+1,f.y+1);g.fillStyle=f.color;g.fillText(f.text,f.x,f.y)}g.globalAlpha=1;
 if(state==='playing'&&distance(hero,bell)<100){g.textAlign='center';g.font='bold 12px Georgia';g.fillStyle='#241d16';g.fillText(souls>=4?'F — ZAPAL DZWON':`POTRZEBNE ISKRY: ${souls}/4`,bell.x+1,bell.y-143);g.fillStyle='#f0ca88';g.fillText(souls>=4?'F — ZAPAL DZWON':`POTRZEBNE ISKRY: ${souls}/4`,bell.x,bell.y-144)}
 // Enemies' authoritative HP represented with short bar at exact sprite anchor.
 for(const e of enemies){if(e.dead||e.hp===e.maxHp)continue;A.rect(g,e.x-15,e.y-49,30,4,'#17171a');A.rect(g,e.x-14,e.y-48,28*(e.hp/e.maxHp),2,'#b7705e')}
 g.restore();
 // Screen-space atmosphere and vignette; world detail remains native crisp pixels.
 const v=g.createRadialGradient(320,148,63,320,180,390);v.addColorStop(0,'#03090e00');v.addColorStop(.68,'#080a1326');v.addColorStop(1,'#050711bc');g.fillStyle=v;g.fillRect(0,0,VW,VH);
 if(flash>0){g.fillStyle=`rgba(186,49,48,${flash*.65})`;g.fillRect(0,0,VW,VH)}
}
function frame(ts){if(!last)last=ts;const dt=clamp((ts-last)/1000,0,.05);last=ts;if(hero)update(dt);if(hero)render();requestAnimationFrame(frame)}
function screenMouse(ev){const b=canvas.getBoundingClientRect();mouse.x=(ev.clientX-b.left)/b.width*VW;mouse.y=(ev.clientY-b.top)/b.height*VH;mouse.active=true}
canvas.addEventListener('pointermove',screenMouse);canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;screenMouse(e);mouse.down=true;attack();e.preventDefault()});
window.addEventListener('pointerup',()=>mouse.down=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{
 if(/^(Arrow|Space|Shift)/.test(e.code))e.preventDefault();if(e.repeat&&['Space','KeyE','KeyF','ShiftLeft','ShiftRight'].includes(e.code))return;
 keys[e.code]=true;
 if(e.code==='Space')attack();if(e.code==='KeyE')heal();if(e.code==='KeyF')interact();if(e.code==='ShiftLeft'||e.code==='ShiftRight')roll();if(e.code==='KeyR')start();
 if(e.code==='Enter'&&state!=='playing')start();
});
window.addEventListener('keyup',e=>{keys[e.code]=false});window.addEventListener('blur',()=>{for(const key in keys)keys[key]=false;mouse.down=false});
// Read-only test seam. Actual gameplay tests must still use player input.
window.AshenQA=Object.freeze({snapshot:()=>({state,clock,hero:hero?{x:hero.x,y:hero.y,hp:hero.hp,potions:hero.potions,swing:hero.swing,rollCd:hero.rollCd}:null,souls,kills,enemies:enemies?enemies.map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp,state:e.state,dead:e.dead})):[],drops:drops?drops.map(d=>({x:d.x,y:d.y,kind:d.kind})):[]}),collisionAt:(x,y,r=10)=>collisionAt(x,y,r),world:()=>({w:W,h:H,props:props.map(o=>({kind:o.kind,x:o.x,y:o.y,r:o.r}))})});
initial();requestAnimationFrame(frame);
})();
