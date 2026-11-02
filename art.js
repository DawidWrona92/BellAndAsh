/* Popiół i Dzwon — original pixel-art recipes. No third-party imagery.
 * A material ramp, stable foot anchors and foreground occlusion follow
 * retro-rts-sprites / modern-pixel-character-animation design principles.
 */
(function (root) {
  'use strict';
  const C = {
    abyss:'#11161a', mortar:'#24292d', stone:'#343a3b', lightStone:'#505251', pale:'#76756b',
    moss:'#354536', grass:'#253a32', leaf:'#354638', leafLit:'#596547',
    gold:'#d9bb83', goldDark:'#94734e', red:'#a54e4a', bone:'#b8aea0',
    cloak:'#39444c', cloakLight:'#5e6262', rust:'#6c5144', glow:'#f6bd66'
  };
  function rand(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296)}
  function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)}
  function poly(g,points,c){g.fillStyle=c;g.beginPath();points.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill()}
  function circle(g,x,y,r,c){g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill()}
  function glow(g,x,y,r,color,a=.34){g.save();g.globalCompositeOperation='screen';const grad=g.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,color);grad.addColorStop(1,'transparent');g.globalAlpha=a;g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);g.restore()}
  function ground(w,h,seed=1701){
    const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
    const rng=rand(seed);g.fillStyle='#222d2c';g.fillRect(0,0,w,h);
    // Deliberately constrained ramps + clustered chips: native-resolution pixel texture.
    for(let y=0;y<h;y+=16)for(let x=0;x<w;x+=16){
      const m=rng(),tone=m>.78?'#35413c':m>.4?'#2b3735':'#252f32';rect(g,x,y,16,16,tone);
      if(rng()>.28)rect(g,x+Math.floor(rng()*12),y+Math.floor(rng()*12),4,2,rng()>.5?'#475347':'#1b292b');
      if(rng()>.68)rect(g,x+2,y+10,2,1,'#77806a');
      if(rng()>.81){rect(g,x+7,y+4,1,5,'#192a28');rect(g,x+8,y+8,3,1,'#192a28')}
    }
    const path=[[125,674],[224,589],[334,542],[449,466],[574,403],[653,334],[784,255],[888,150]];
    g.lineCap='round';g.lineJoin='round';
    for(const [width,color] of [[104,'#171f24'],[90,'#3b3c3a'],[73,'#504d47'],[57,'#494943']]){
      g.beginPath();path.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.lineWidth=width;g.strokeStyle=color;g.stroke();
    }
    const distSegment=(px,py,ax,ay,bx,by)=>{const vx=bx-ax,vy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy)));return Math.hypot(px-(ax+t*vx),py-(ay+t*vy))};
    for(let i=0;i<1300;i++){
      const x=rng()*w,y=rng()*h;let on=false;for(let j=1;j<path.length;j++)if(distSegment(x,y,...path[j-1],...path[j])<48){on=true;break}
      if(!on)continue;const s=2+Math.floor(rng()*5);rect(g,x,y,s,s*(rng()>.7?2:1),rng()>.77?'#777062':rng()>.4?'#55544b':'#353b3b');
      if(rng()>.85)rect(g,x+1,y+1,2,1,'#898372');
    }
    // Ruined flagstones near the bell: authored geometric clusters.
    for(let y=82;y<285;y+=24)for(let x=795;x<998;x+=30){
      const j=(rng()-.5)*5,k=(rng()-.5)*5;rect(g,x+j,y+k,27,19,rng()>.5?'#4a4b48':'#53514b');
      rect(g,x+j+1,y+k+1,20,1,'#70695f');rect(g,x+j+3,y+k+16,23,2,'#2c3533');
      if(rng()>.55)rect(g,x+j+12,y+k+9,2,6,'#303d37');
    }
    // Small noncolliding flowers, thistles and coiled roots; edge clumps.
    for(let i=0;i<490;i++){
      const x=rng()*w,y=rng()*h;let nearPath=path.some(([px,py])=>Math.hypot(x-px,y-py)<42);
      if(nearPath||x>790&&x<1000&&y<290)continue;
      const p=rng();if(p<.48){rect(g,x,y,1,6,'#52604a');rect(g,x-2,y+3,2,1,'#3c563b');rect(g,x+1,y+1,2,1,'#697653')}
      else if(p<.79){rect(g,x,y,3,3,'#3b4945');rect(g,x+1,y,1,1,'#6c7867')}
      else{rect(g,x,y,2,2,p>.95?'#b2a68a':'#6c6b65');rect(g,x+1,y+2,1,1,'#454641')}
    }
    // Bas-relief border and unmistakable inner playable boundary.
    g.strokeStyle='#11181d';g.lineWidth=22;g.strokeRect(10,10,w-20,h-20);
    g.strokeStyle='#62615b';g.lineWidth=3;g.strokeRect(23,23,w-46,h-46);
    for(let x=27;x<w-20;x+=32){rect(g,x,12,2,11,'#464d4b');rect(g,x,h-22,2,10,'#464d4b')}
    for(let y=26;y<h-20;y+=32){rect(g,12,y,11,2,'#464d4b');rect(g,w-22,y,11,2,'#464d4b')}
    return c;
  }
  function drawShadow(g,x,y,rx,ry,alpha=.35){g.save();g.globalAlpha=alpha;g.fillStyle='#05090d';g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();g.restore()}
  function gravestone(g,o,t){const {x,y}=o;drawShadow(g,x+3,y+2,14,5);
    rect(g,x-9,y-20,19,20,'#1b2529');rect(g,x-10,y-23,18,17,'#585c5b');
    rect(g,x-8,y-27,14,6,'#6c6c63');rect(g,x-6,y-30,10,5,'#76766c');
    rect(g,x-8,y-19,2,15,'#969385');rect(g,x-1,y-24,2,13,'#393d3c');rect(g,x-5,y-17,11,2,'#383b3a');
    rect(g,x+5,y-21,2,4,'#242f30');rect(g,x-3,y-9,8,2,'#4b514c');rect(g,x-12,y-5,23,3,'#293335');
    rect(g,x-11,y-7,5,2,'#54664a');rect(g,x+6,y-4,6,2,'#3f5842');}
  function tree(g,o,t){let {x,y}=o;const v=o.variant||0;drawShadow(g,x+10,y+5,37,13,.47);
    // Twisted silhouette carries depth: roots -> trunk -> foliage masses.
    poly(g,[[x-16,y+3],[x-9,y-8],[x-7,y-55],[x-19,y-77],[x-13,y-80],[x+1,y-57],[x+7,y-83],[x+13,y-82],[x+8,y-47],[x+8,y-13],[x+20,y+2],[x+9,y],[x+1,y-8],[x-6,y],[x-16,y+4]],'#171d20');
    rect(g,x-5,y-52,6,41,'#55443d');rect(g,x-4,y-49,2,29,'#806149');rect(g,x+3,y-36,3,24,'#3b3635');
    const patches=[[-22,-72,18],[-4,-90,23],[18,-76,19],[-29,-58,14],[24,-55,18],[-3,-64,21]];
    patches.forEach(([dx,dy,r],i)=>{
      const col=['#25332f','#34443a','#40513e','#2e4036','#465745','#364638'][(i+v)%6];
      circle(g,x+dx,y+dy,r,col);circle(g,x+dx-5,y+dy-4,r*.57,i%2?'#4b5c45':'#38463a');
      for(let k=0;k<5;k++){const a=k*2.4+i;rect(g,x+dx+Math.cos(a)*r*.65,y+dy+Math.sin(a)*r*.52,4,2,k%2?'#647055':'#233831')}
    });
    for(let k=0;k<6;k++)rect(g,x-27+k*9,y-76+(k%3)*8,4,2,'#667353');
  }
  function column(g,o){let{x,y}=o;drawShadow(g,x+8,y+4,23,8,.42);
    rect(g,x-10,y-54,21,50,'#242b2e');rect(g,x-7,y-53,17,47,'#62605c');rect(g,x-7,y-53,4,45,'#817b6e');
    for(let i=0;i<6;i++){const yy=y-51+i*8;rect(g,x-8,yy,19,1,'#373d3e');rect(g,x+6,yy+2,2,4,'#434747')}
    rect(g,x-13,y-57,28,7,'#3a4141');rect(g,x-11,y-59,24,4,'#7e796f');rect(g,x-12,y-11,27,5,'#44484a');rect(g,x-15,y-6,31,7,'#777067');rect(g,x-10,y-4,20,2,'#92877a');
    if(o.broken){rect(g,x-7,y-58,11,3,'#1e2529');rect(g,x+2,y-60,5,2,'#343b3c')}
  }
  function brazier(g,o,t){let{x,y}=o;drawShadow(g,x+4,y+3,18,6);
    rect(g,x-3,y-18,6,19,'#3a3431');rect(g,x-10,y-24,21,8,'#1b2024');rect(g,x-9,y-25,18,5,'#77675b');rect(g,x-7,y-27,14,3,'#b07b50');
    const flick=Math.sin(t*10+o.x)*2;poly(g,[[x-6,y-25],[x-4,y-36+flick],[x,y-32],[x+3,y-44-flick],[x+6,y-28],[x+1,y-23]],'#ee9a42');
    poly(g,[[x-2,y-24],[x-1,y-34+flick],[x+2,y-29],[x+2,y-24]],'#fff0a4');glow(g,x,y-30,43,'#ff963c',.28)}
  function bell(g,o,t,active=false){let{x,y}=o;drawShadow(g,x,y,51,18,.6);
    // Layered cathedral stone, ruined Gothic arch and hanging bell.
    rect(g,x-53,y-8,106,9,'#25282a');rect(g,x-48,y-12,97,6,'#64615b');
    for(const s of [-1,1]){
      const k=s*36;rect(g,x+k-10,y-94,20,85,'#1c2227');rect(g,x+k-8,y-95,17,83,'#625f59');rect(g,x+k-8,y-96,4,80,'#888077');
      rect(g,x+k-13,y-100,27,9,'#87786c');rect(g,x+k-13,y-103,27,4,'#3b3a3b');
      for(let i=0;i<8;i++)rect(g,x+k-9,y-87+i*10,18,1,'#353b3b');
    }
    poly(g,[[x-42,y-96],[x-29,y-115],[x-5,y-128],[x+5,y-128],[x+29,y-115],[x+42,y-96],[x+27,y-98],[x,y-118],[x-27,y-98]],'#272b2d');
    poly(g,[[x-42,y-97],[x-28,y-118],[x,y-132],[x+28,y-118],[x+42,y-97],[x+29,y-103],[x,y-124],[x-29,y-103]],'#777168');
    for(let i=0;i<4;i++){rect(g,x-26+i*16,y-120-Math.abs(1.5-i)*6,10,2,'#989080')}
    rect(g,x-3,y-117,6,21,'#b2a18c');poly(g,[[x-18,y-86],[x-14,y-104],[x+14,y-104],[x+18,y-86],[x+11,y-77],[x-11,y-77]],active?'#e3ad5c':'#8b7352');
    rect(g,x-12,y-101,3,18,'#e2bf7f');rect(g,x-15,y-85,30,5,'#433c36');rect(g,x-3,y-78,6,9,'#d7b079');
    if(active)glow(g,x,y-91,90,'#ffcc78',.48);else glow(g,x,y-91,46,'#f5a759',.12);
    // Steps are spatially registered to interaction collider.
    for(let i=0;i<3;i++){rect(g,x-49-i*4,y-2+i*4,98+i*8,4,'#706b62');rect(g,x-44-i*4,y-2+i*4,88+i*8,1,'#a69a86')}
  }
  function brokenCart(g,o){let{x,y}=o;drawShadow(g,x+5,y+2,31,10);
    poly(g,[[x-29,y-18],[x-9,y-31],[x+24,y-20],[x+11,y-3]],'#292b2d');
    poly(g,[[x-30,y-23],[x-12,y-34],[x+22,y-23],[x+7,y-12]],'#77604b');
    for(let i=0;i<5;i++)poly(g,[[x-26+i*9,y-23-i*2],[x-23+i*9,y-25-i*2],[x-7+i*9,y-18-i*2],[x-10+i*9,y-16-i*2]],i%2?'#a08361':'#554333');
    circle(g,x-17,y-3,9,'#201f21');circle(g,x-17,y-3,6,'#7d6550');circle(g,x-17,y-3,2,'#b59d74');
    circle(g,x+22,y-9,8,'#201f21');circle(g,x+22,y-9,5,'#786048');rect(g,x+18,y-8,8,2,'#a38660')}
  function drawProp(g,o,t,active){switch(o.kind){case 'grave':return gravestone(g,o,t);case 'tree':return tree(g,o,t);case 'pillar':return column(g,o);case 'brazier':return brazier(g,o,t);case 'bell':return bell(g,o,t,active);case 'cart':return brokenCart(g,o)}}
  function character(g,x,y,kind,dir,step,attack,hit,t){
    const phase=Math.sin(step*10),bob=step>0?Math.abs(phase)*1.3:Math.sin(t*2)*.3;
    const faceR=Math.cos(dir)>=0,front=Math.sin(dir)>=-.2;
    drawShadow(g,x+1,y+1,12,4,.56);g.save();g.translate(Math.round(x),Math.round(y-bob));
    if(hit>0&&Math.floor(t*24)%2)g.globalAlpha=.57;
    // Cloak tail and boots: same foot anchor in all poses.
    poly(g,[[-9,-16],[-11,-3],[-6,0],[0,-4],[6,0],[12,-4],[8,-20]],kind==='hero'?'#242e36':'#262b35');
    rect(g,-7+phase*2,-8,5,8,kind==='hero'?'#726455':'#4a4646');rect(g,3-phase*2,-8,5,8,'#343b40');
    rect(g,-8+phase*2,-3,6,4,'#1a1f27');rect(g,4-phase*2,-3,6,4,'#1d232a');
    // Tunic, pauldrons, heraldic chest detail.
    poly(g,[[-8,-26],[8,-26],[10,-11],[4,-7],[-5,-8],[-10,-13]],kind==='hero'?'#4d5860':'#3c4147');
    rect(g,-8,-24,4,13,kind==='hero'?'#71818a':'#66706e');rect(g,5,-24,4,13,'#242d34');
    rect(g,-4,-24,7,11,kind==='hero'?'#796350':'#5c4c45');rect(g,-1,-22,2,8,kind==='hero'?'#ceb88d':'#8d6b59');
    rect(g,-7,-13,15,3,'#20262c');rect(g,2,-13,4,2,'#b99b65');
    rect(g,-12,-27,7,7,kind==='hero'?'#87908b':'#454e5b');rect(g,6,-27,7,7,kind==='hero'?'#63777f':'#676967');
    // hood, face and eyes: dark silhouette + one-pixel light control.
    poly(g,[[-9,-29],[-7,-37],[-3,-41],[6,-39],[10,-32],[8,-25],[-8,-25]],kind==='hero'?'#333e4a':'#303740');
    rect(g,-6,-33,12,7,kind==='hero'?'#ad8c73':'#617071');rect(g,-7,-36,13,4,'#222a32');
    if(front){rect(g,faceR?1:-4,-31,2,1,kind==='hero'?'#d5bc8d':'#b4d6ce');rect(g,faceR?-4:1,-31,2,1,kind==='hero'?'#bd9670':'#65baae')}
    else{rect(g,faceR?5:-7,-32,3,2,'#c0ae92')}
    // Weapons always attached to same body origin, attack is stateful.
    if(kind==='hero'){
      let swordX=faceR?12:-12;
      rect(g,swordX-2,-22,4,12,'#574533');rect(g,swordX-5,-21,10,2,'#c5a777');
      if(attack>0){g.save();g.translate(swordX,-17);g.rotate((1-attack)*1.75*(faceR?1:-1));rect(g,-2,-24,5,24,'#d0d4c4');rect(g,-1,-26,2,16,'#f0e6ca');rect(g,-3,-3,7,3,'#b79b65');g.restore()}
      else{rect(g,swordX-1,-42,4,22,'#9ba7a9');rect(g,swordX,-43,2,16,'#e2dbcb');rect(g,swordX-3,-22,9,3,'#bba174')}
    }else{
      rect(g,faceR?10:-14,-19,6,4,'#69675f');rect(g,faceR?13:-15,-19,5,8,'#a49a83');
    }
    g.restore();
  }
  function drawHero(g,p,t){character(g,p.x,p.y,'hero',p.facing,p.moving?p.walk:0,p.swing,p.hurt,t)}
  function drawEnemy(g,e,t){
    if(e.dead)return;
    const sway=Math.sin(t*2+e.seed)*2;
    drawShadow(g,e.x,e.y,14,5,.42);g.save();g.translate(Math.round(e.x),Math.round(e.y+sway));
    if(e.flash>0&&Math.floor(t*22)%2)g.globalAlpha=.5;
    poly(g,[[-12,-3],[-15,-13],[-10,-26],[-8,-34],[0,-39],[9,-34],[13,-21],[15,-3],[6,-8],[0,-1],[-7,-8]],'#151e29');
    poly(g,[[-11,-12],[-8,-28],[-3,-35],[7,-34],[10,-25],[10,-13],[4,-6],[-5,-8]],'#4b5560');
    poly(g,[[-8,-27],[-6,-39],[0,-43],[8,-38],[10,-27],[5,-22],[-5,-22]],'#28333e');
    rect(g,-5,-30,11,6,'#65736e');rect(g,-3,-29,3,2,'#8de1c7');rect(g,3,-29,3,2,'#a9f2dc');
    rect(g,-13,-17,6,5,'#68716a');rect(g,9,-19,7,5,'#7c877e');rect(g,-7,-11,5,7,'#343d47');
    rect(g,0,-19,2,10,'#a6b6a7');rect(g,-2,-17,6,2,'#4e655e');
    if(e.state==='windup'){circle(g,0,-21,23,'#9c665522');rect(g,-14,-15,5,5,'#c38874')}
    g.restore();
    if(e.state==='windup'){g.save();g.strokeStyle='#df815f';g.lineWidth=2;g.beginPath();g.arc(e.x,e.y,22,Math.PI*.2,Math.PI*1.8);g.stroke();g.restore()}
  }
  function slash(g,p){if(p.swing<=0)return;g.save();g.translate(p.x,p.y-17);g.rotate(p.facing);
    g.globalAlpha=Math.min(.85,p.swing*1.65);g.strokeStyle='#f9dfb1';g.lineWidth=4;g.beginPath();g.arc(0,0,37,-.88,.72);g.stroke();
    g.strokeStyle='#b9915b';g.lineWidth=2;g.beginPath();g.arc(0,0,42,-.9,.55);g.stroke();g.restore()}
  function ember(g,d,t){let yy=d.y+Math.sin(t*3+d.phase)*3;glow(g,d.x,yy-11,21,'#ffc879',.42);circle(g,d.x,yy-10,5,'#a76542');circle(g,d.x,yy-12,3,'#ffe4a3');rect(g,d.x-1,yy-16,2,3,'#fff7c7')}
  function flask(g,d,t){let yy=d.y+Math.sin(t*2.7+d.phase)*2;drawShadow(g,d.x,d.y+4,7,2);rect(g,d.x-3,yy-14,7,4,'#d3c499');rect(g,d.x-5,yy-10,11,11,'#33443f');rect(g,d.x-4,yy-9,9,8,'#a44345');rect(g,d.x-2,yy-9,2,5,'#ee8b7b')}
  root.Art={C,rand,rect,circle,poly,glow,ground,drawProp,drawHero,drawEnemy,slash,ember,flask};
})(window);
