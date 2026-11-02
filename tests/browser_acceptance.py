"""Actual Chromium Canvas interaction tests. We inject local files into an about:blank
page because this sandbox's browser policy blocks navigation (localhost and file://).
Input is dispatched through the same browser keyboard/pointer listeners as player input.
Run: python tests/browser_acceptance.py
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/'screenshots';SHOTS.mkdir(exist_ok=True)
results={}

def load(browser):
    page=browser.new_page(viewport={'width':1280,'height':800},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content((ROOT/'index.html').read_text(encoding='utf8').replace('<link rel="stylesheet" href="style.css">','<style>'+ (ROOT/'style.css').read_text(encoding='utf8') + '</style>').replace('<script src="art.js"></script>','').replace('<script src="game.js"></script>',''))
    page.add_script_tag(content=(ROOT/'art.js').read_text(encoding='utf8'))
    page.add_script_tag(content=(ROOT/'game.js').read_text(encoding='utf8'))
    return page,errors

def check(label,ok,notes=''):
    results[label]={'status':'PASS' if ok else 'FAIL','detail':notes};print(label,results[label]);

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--no-proxy-server'])
    page,err=load(browser)
    check('intro',page.locator('#overlay').is_visible() and 'DZWON' in page.title())
    page.locator('#start').click();page.wait_for_timeout(350)
    s=page.evaluate('AshenQA.snapshot()')
    check('runtime',s['state']=='playing' and len(s['enemies'])==6 and s['hero']['hp']==100)
    check('colliders',page.evaluate('AshenQA.collisionAt(306,668,10) && AshenQA.collisionAt(0,0,10) && !AshenQA.collisionAt(137,654,10)'))
    page.screenshot(path=str(SHOTS/'01-first-run.png'),full_page=True)
    x0=s['hero']['x'];page.keyboard.down('d');page.wait_for_timeout(400);page.keyboard.up('d')
    s=page.evaluate('AshenQA.snapshot()')
    check('movement',s['hero']['x']>x0+25,f"{x0:.1f} -> {s['hero']['x']:.1f}")
    page.keyboard.press('Shift');page.wait_for_timeout(100)
    s=page.evaluate('AshenQA.snapshot()');check('dodge',s['hero']['rollCd']>0)
    # AI aggro and distance to player
    e0=s['enemies'][0];p0=s['hero'];dist0=((e0['x']-p0['x'])**2+(e0['y']-p0['y'])**2)**.5
    page.wait_for_timeout(1200);s=page.evaluate('AshenQA.snapshot()');e1=s['enemies'][0];p1=s['hero'];dist1=((e1['x']-p1['x'])**2+(e1['y']-p1['y'])**2)**.5
    check('enemy_ai',dist1<dist0-10,f'distance {dist0:.1f} -> {dist1:.1f}, state={e1["state"]}')
    check('no_js_errors',not err,repr(err))
    page.screenshot(path=str(SHOTS/'02-movement.png'),full_page=True)
    # Action based on actual input events, moving toward enemy with browser's live frame loop.
    run=page.evaluate('''async () => {
      const sleep=ms=>new Promise(r=>setTimeout(r,ms));
      const hold=(k,on)=>window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code:k,bubbles:true}));
      const cv=document.getElementById('game'),buttons={KeyW:false,KeyA:false,KeyS:false,KeyD:false};
      let attacked=false,damaged=false,dead=false,gotLoot=false;
      const end=Date.now()+28000;
      while(Date.now()<end){
        const s=AshenQA.snapshot();if(s.state!=='playing')break;
        if(s.hero.hp<100)damaged=true;
        if(s.kills>0)dead=true;
        if(s.souls>0)gotLoot=true;
        if(s.hero.hp<58&&s.hero.potions)hold('KeyE',true),hold('KeyE',false);
        let target=s.enemies.find(e=>!e.dead);
        if(!target){break}
        let dx=target.x-s.hero.x,dy=target.y-s.hero.y,d=Math.hypot(dx,dy);
        for(const k of Object.keys(buttons)){
          let want=d>30 && (k==='KeyD'?dx>8:k==='KeyA'?dx<-8:k==='KeyS'?dy>8:dy<-8);
          if(want!==buttons[k]){hold(k,want);buttons[k]=want}
        }
        // move the pointer to the target in the viewport, so aim is authoritative.
        const camX=Math.max(0,Math.min(s.hero.x-640*.45,1088-640));
        const camY=Math.max(0,Math.min(s.hero.y-360*.54,800-360));
        const b=cv.getBoundingClientRect(),mx=b.left+(target.x-camX)/640*b.width,my=b.top+(target.y-camY)/360*b.height;
        cv.dispatchEvent(new PointerEvent('pointermove',{clientX:mx,clientY:my,bubbles:true}));
        if(d<56){hold('Space',true);hold('Space',false);attacked=true}
        await sleep(50);
      }
      for(const k of Object.keys(buttons))hold(k,false);
      return {attacked,damaged,dead,gotLoot,snapshot:AshenQA.snapshot()};
    }''')
    s=run['snapshot'];print('action walkthrough',json.dumps(run,ensure_ascii=False)[:3000]);
    check('melee_damage',run['attacked'] and (run['dead'] or any(e['hp']<64 for e in s['enemies'])),f'kills={s["kills"]}')
    check('enemy_damage',run['damaged'] or s['hero']['hp']<100,f'hp={s["hero"]["hp"]}')
    check('death_of_enemy',run['dead'],f'kills={s["kills"]}')
    check('loot',run['gotLoot'] or s['souls']>0,f'souls={s["souls"]}')
    page.screenshot(path=str(SHOTS/'03-combat.png'),full_page=True)
    before=page.evaluate('AshenQA.snapshot().hero')
    if before['hp']<100 and before['potions']>0:
        page.keyboard.press('e');page.wait_for_timeout(90)
        after=page.evaluate('AshenQA.snapshot().hero')
        check('healing_potion',after['hp']>before['hp'] and after['potions']==before['potions']-1,f"HP {before['hp']}->{after['hp']}")
    else:
        results['healing_potion']={'status':'NOT_RUN','detail':'No damage to heal or no potion'}
    # A* on the read-only collider map drives legitimate keyboard input to loot.
    story=page.evaluate('''async () => {
      const sleep=ms=>new Promise(r=>setTimeout(r,ms));
      const hold=(k,on)=>window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code:k,bubbles:true}));
      let buttons={KeyW:false,KeyA:false,KeyS:false,KeyD:false};
      function move(dx,dy){for(const k of Object.keys(buttons)){
        const want=k==='KeyD'?dx>7:k==='KeyA'?dx< -7:k==='KeyS'?dy>7:dy< -7;
        if(want!==buttons[k]){hold(k,want);buttons[k]=want}
      }}
      const STEP=17, nx=Math.floor(1088/STEP), ny=Math.floor(800/STEP);
      const key=(x,y)=>y*nx+x;
      function astar(a,b){
        const sx=Math.round(a.x/STEP),sy=Math.round(a.y/STEP);
        const valid=(x,y)=>x>2&&y>2&&x<nx-2&&y<ny-2&&!AshenQA.collisionAt(x*STEP,y*STEP,12);
        const open=[{x:sx,y:sy,g:0,h:0}],map=new Map([[key(sx,sy),open[0]]]),seen=new Set();
        let closest=null,iter=0;
        while(open.length&&iter++<5000){
          open.sort((v,w)=>(v.g+v.h)-(w.g+w.h));const n=open.shift(),idx=key(n.x,n.y);
          if(seen.has(idx))continue;seen.add(idx);
          if(Math.hypot(n.x*STEP-b.x,n.y*STEP-b.y)<20){closest=n;break}
          for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
            const x=n.x+dx,y=n.y+dy,k=key(x,y);if(seen.has(k)||!valid(x,y))continue;
            const cost=n.g+1,old=map.get(k);if(old&&old.g<=cost)continue;
            const o={x,y,g:cost,h:Math.hypot(x*STEP-b.x,y*STEP-b.y)/STEP,prev:n};map.set(k,o);open.push(o);
          }
        }
        const route=[];while(closest&&closest.prev){route.push({x:closest.x*STEP,y:closest.y*STEP});closest=closest.prev}
        return route.reverse();
      }
      async function go(point){
        let current=AshenQA.snapshot().hero;const route=astar(current,point);
        for(const node of [...route,point]){
          for(let j=0;j<65;j++){
            current=AshenQA.snapshot().hero;let dx=node.x-current.x,dy=node.y-current.y;
            if(Math.hypot(dx,dy)<10)break;
            move(dx,dy);await sleep(43);
          }
        }
        move(0,0);
        return {route:route.length,pos:AshenQA.snapshot().hero};
      }
      const travels=[];
      for(let i=0;i<8&&AshenQA.snapshot().souls<4;i++){
        const s=AshenQA.snapshot(),ds=s.drops.filter(d=>d.kind==='ember').sort((a,b)=>Math.hypot(a.x-s.hero.x,a.y-s.hero.y)-Math.hypot(b.x-s.hero.x,b.y-s.hero.y));
        if(!ds.length)break;travels.push(await go(ds[0]));
      }
      if(AshenQA.snapshot().souls>=4){travels.push(await go({x:854,y:255}));hold('KeyF',true);hold('KeyF',false)}
      move(0,0);return {travels,snapshot:AshenQA.snapshot()};
    }''')
    print('story',json.dumps(story,ensure_ascii=False)[:2200])
    check('four_embers',story['snapshot']['souls']>=4,f"souls={story['snapshot']['souls']}")
    check('win_via_bell',story['snapshot']['state']=='victory',f"state={story['snapshot']['state']}")
    page.wait_for_timeout(280)
    page.screenshot(path=str(SHOTS/'04-victory.png'),full_page=True)
    # R resets the authoritative game state.
    page.keyboard.press('r');page.wait_for_timeout(150);s=page.evaluate('AshenQA.snapshot()');
    check('restart',s['state']=='playing' and s['hero']['hp']==100 and s['kills']==0 and s['souls']==0)
    check('no_js_errors_after_combat',not err,repr(err))
    # Independent real enemy assault, with no artificial state mutation.
    death_page,death_errors=load(browser)
    death_page.locator('#start').click()
    death_page.keyboard.down('d');death_page.keyboard.down('w')
    death_page.wait_for_timeout(650)
    death_page.keyboard.up('d');death_page.keyboard.up('w')
    death_page.wait_for_timeout(17600)
    ds=death_page.evaluate('AshenQA.snapshot()')
    check('player_death',ds['state']=='dead' and ds['hero']['hp']==0,f"state={ds['state']} HP={ds['hero']['hp']}")
    death_page.wait_for_timeout(280)
    death_page.screenshot(path=str(SHOTS/'05-death.png'),full_page=True)
    death_page.keyboard.press('r');death_page.wait_for_timeout(100)
    rs=death_page.evaluate('AshenQA.snapshot()')
    check('restart_after_death',rs['state']=='playing' and rs['hero']['hp']==100)
    check('no_js_errors_death',not death_errors,repr(death_errors))
    death_page.close()
    browser.close()
Path(ROOT/'tests'/'browser-results.json').write_text(json.dumps(results,indent=2,ensure_ascii=False),encoding='utf8')
print('TOTAL',sum(v['status']=='PASS' for v in results.values()),'PASS,',sum(v['status']=='FAIL' for v in results.values()),'FAIL')
