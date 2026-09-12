(() => {
  "use strict";

  const VERSION = "2.2.0";
  const ROOT = "https://raw.githubusercontent.com/francamatheus165-prog/matrix-client-2.0/main/";
  const KEY = "matrix2.config";

  const DEFAULTS = {
    client:{key:"KeyG",theme:"matrix",compact:false,accent:"#a76cff",blur:true},
    zoom:{enabled:false,key:"KeyV",factor:3,smooth:true,scroll:false,min:1.5,max:5},
    crosshair:{enabled:true,preset:"plus",size:30,opacity:1,color:"#ffffff",outline:"#000000",gap:6,thickness:2},
    keystrokes:{enabled:true,x:24,y:230,scale:1,showLmb:true,showRmb:true,showCps:true,animation:true,rainbow:false,bg:"rgba(9,7,16,.74)",pressed:"#8b49ff",text:"#ffffff",radius:5},
    direction:{enabled:false,scale:1,x:50,y:20},
    fps:{enabled:true,x:14,y:14,scale:1},
    cps:{enabled:true,x:14,y:44,scale:1},
    badge:{enabled:true,preset:"matrix",x:14,y:76,scale:1,label:"MATRIX"},
    shader:{enabled:false,preset:"matrix",opacity:.22,intensity:.55},
    textures:{enabled:false,pack:"matrix"},
    nofog:{enabled:false},
    hideclouds:{enabled:false},
    hideparticles:{enabled:false},
    hidenametags:{enabled:false},
    hidearm:{enabled:false},
    hurtcam:{enabled:false,strength:.22},
    togglecrouch:{enabled:false,key:"Control"},
    clearscreen:{enabled:false,key:"KeyH"},
    autogg:{enabled:false,message:"gg"},
    chat:{emojis:true},
    scoreboard:{enabled:true},
    armorhud:{enabled:false},
    actionbar:{enabled:false,x:50,y:86},
    kdr:{enabled:false},
    damagevignette:{enabled:false,color:"#ff1744",strength:.18},
    blockoutline:{enabled:false,color:"#8fe8ff"},
    bedwarsnotif:{enabled:false},
    armoffset:{enabled:false,y:0},
    guiscale:{enabled:false,scale:1},
    performance:{enabled:false},
    customui:{enabled:false,css:""},
    translator:{enabled:false,target:"en"}
  };

  const clone=o=>JSON.parse(JSON.stringify(o));
  const merge=(a,b)=>{const o=clone(a);Object.entries(b||{}).forEach(([k,v])=>{if(v&&typeof v==='object'&&!Array.isArray(v)&&o[k]&&typeof o[k]==='object')o[k]=merge(o[k],v);else o[k]=v});return o};
  let CFG=merge(DEFAULTS,GM_getValue(KEY,{}));
  const save=()=>GM_setValue(KEY,CFG);
  const get=(path)=>path.split('.').reduce((o,k)=>o?.[k],CFG);
  const set=(path,val)=>{const p=path.split('.'),last=p.pop();let o=CFG;for(const k of p){if(!o[k])o[k]={};o=o[k]}o[last]=val;save();applyAll();renderPanel()};
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  const BUS={};
  function on(name,fn){(BUS[name]??=new Set()).add(fn);return()=>BUS[name]?.delete(fn)}
  function emit(name,data){BUS[name]?.forEach(fn=>{try{fn(data)}catch{}})}

  const ST={open:false,tab:'all',mods:new Map(),keys:new Set(),fps:0,frames:0,lastFrame:performance.now(),lmb:[],rmb:[],yaw:0,home:false,toastTimer:0};
  function mod(id,name,category,description,options={}){const m={id,name,category,description,enabled:options.enabled??!!get(id+'.enabled'),settings:options.settings||null};ST.mods.set(id,m);return m}
  function enabled(id){return !!ST.mods.get(id)?.enabled}
  function toggle(id){const m=ST.mods.get(id);if(!m)return;m.enabled=!m.enabled;if(CFG[id])CFG[id].enabled=m.enabled;save();applyAll();renderPanel();emit('mod',m)}

  GM_addStyle(`
    #mx2{position:fixed;inset:0;z-index:2147483000;pointer-events:none;color:#fff;font-family:Inter,Arial,sans-serif}
    #mx2-panel{position:fixed;right:18px;top:66px;width:440px;max-height:82vh;overflow:auto;display:none;background:rgba(9,7,15,.96);border:1px solid #a76cff66;border-radius:16px;box-shadow:0 22px 80px #000b;backdrop-filter:blur(15px);pointer-events:auto}
    #mx2-panel.open{display:block}
    .mx2-head{display:flex;justify-content:space-between;align-items:center;padding:15px 16px;border-bottom:1px solid #ffffff0c;position:sticky;top:0;background:rgba(9,7,15,.92);backdrop-filter:blur(15px)}
    .mx2-logo{font-weight:800;letter-spacing:.11em;font-size:16px}.mx2-sub{font-size:9px;opacity:.42;margin-top:3px}
    .mx2-btn{background:#ffffff08;color:#fff;border:1px solid #ffffff12;border-radius:7px;padding:6px 9px;cursor:pointer;font-size:10px}
    .mx2-tabs{display:flex;gap:5px;padding:10px;border-bottom:1px solid #ffffff08}.mx2-tab{flex:1;background:#ffffff06;border:1px solid #ffffff0b;color:#bfb9c9;padding:7px;border-radius:8px;font-size:9px;cursor:pointer}.mx2-tab.active{background:#8b49ff2b;color:#fff;border-color:#a76cff66}
    .mx2-list{padding:10px}.mx2-card{border:1px solid #ffffff0a;background:#ffffff04;border-radius:10px;margin-bottom:7px;padding:10px}.mx2-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.mx2-name{font-size:11px;font-weight:700}.mx2-desc{font-size:9px;opacity:.4;margin-top:3px;line-height:1.4}
    .mx2-switch{width:42px;height:23px;border-radius:99px;background:#ffffff13;border:1px solid #ffffff10;cursor:pointer;position:relative;flex:none}.mx2-switch:after{content:"";position:absolute;left:3px;top:3px;width:15px;height:15px;border-radius:50%;background:#888;transition:.15s}.mx2-switch.on{background:#8747e766;border-color:#bd94ff77}.mx2-switch.on:after{left:22px;background:#fff}
    .mx2-options{margin-top:9px;padding-top:8px;border-top:1px solid #ffffff08}.mx2-opt{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0;font-size:9px}.mx2-opt input[type=range]{width:170px}.mx2-opt input[type=text],.mx2-opt select{min-width:140px;max-width:220px;background:#0004;color:#fff;border:1px solid #ffffff14;border-radius:6px;padding:5px;font-size:9px}
    .mx2-foot{padding:10px 14px;border-top:1px solid #ffffff09;font-size:8px;line-height:1.5;opacity:.36}
    #mx2-cross{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none}.mx2-box{position:fixed;padding:5px 8px;border-radius:6px;background:#07050cb3;border:1px solid #ffffff13;font:10px ui-monospace,Consolas,monospace;pointer-events:none;white-space:nowrap}
    #mx2-keys{position:fixed;display:grid;grid-template-columns:repeat(3,42px);gap:4px;pointer-events:none}.mx2-key{width:42px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:5px;background:#090711bd;border:1px solid #ffffff12;color:#fff;font:10px Arial;transition:transform .08s,background .08s}.mx2-key.on{background:#8c49ffa8;transform:scale(.93)}
    #mx2-direction{position:fixed;left:50%;padding:5px 9px;border-radius:7px;background:#06050aa8;border:1px solid #ffffff12;transform:translateX(-50%);font:9px ui-monospace,monospace;pointer-events:none}
    #mx2-badge{position:fixed;padding:5px 8px;border-radius:6px;background:linear-gradient(135deg,#7c40df,#b879ff);box-shadow:0 0 20px #8c49ff55;font-size:9px;font-weight:900;letter-spacing:.1em;pointer-events:none}
    #mx2-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);padding:8px 11px;border-radius:8px;background:#07050de8;border:1px solid #ffffff12;font:10px Arial;opacity:0;transition:.18s;pointer-events:none}#mx2-toast.show{opacity:1}
    #mx2-shader{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .2s}
    #mx2-clear{position:fixed;inset:0;background:#000;display:none;z-index:2147482990;pointer-events:none}
    #mx2-clear.on{display:block}
  `);

  function root(){if(qs('#mx2'))return;const r=document.createElement('div');r.id='mx2';r.innerHTML=`<div id="mx2-panel"></div><div id="mx2-cross"></div><div id="mx2-hud"></div><div id="mx2-keys"></div><div id="mx2-direction"></div><div id="mx2-badge"></div><canvas id="mx2-shader"></canvas><div id="mx2-clear"></div><div id="mx2-toast"></div>`;document.documentElement.appendChild(r)}
  function toast(s){const t=qs('#mx2-toast');if(!t)return;t.textContent=s;t.classList.add('show');clearTimeout(ST.toastTimer);ST.toastTimer=setTimeout(()=>t.classList.remove('show'),1600)}

  function register(){
    mod('zoom','Zoom','utility','Smooth camera zoom with hold key and scroll control');
    mod('crosshair','Custom Crosshair','visual','Matrix crosshair presets with adjustable geometry',{settings:crosshairSettings});
    mod('keystrokes','Keystrokes','hud','Movement, jump and mouse input HUD',{settings:keySettings});
    mod('direction','Direction HUD','hud','Compass direction overlay');
    mod('fps','FPS Counter','hud','Frames per second counter');
    mod('cps','CPS Counter','hud','Clicks per second counter');
    mod('badge','Custom Badges','appearance','Local Matrix identity badges',{settings:badgeSettings});
    mod('shader','Matrix Shaders','visual','Original Matrix overlays and GLSL resources',{settings:shaderSettings});
    mod('textures','Texture Packs','appearance','GitHub-hosted texture replacement framework');
    mod('nofog','No Fog','visual','Renderer-safe fog controls when exposed');
    mod('hideclouds','Hide Clouds','visual','Hide exposed cloud layers');
    mod('hideparticles','Hide Particles','visual','Hide exposed particle layers');
    mod('hidenametags','Hide Nametags','visual','Hide exposed nametag layers');
    mod('hidearm','Hide Arm','visual','Hide local HTML viewmodel arm when exposed');
    mod('hurtcam','Hurt Cam','visual','Local damage camera effect control');
    mod('togglecrouch','Toggle Crouch','utility','Control-key crouch convenience helper');
    mod('clearscreen','Clear Screen','utility','Temporarily hide Matrix overlays');
    mod('autogg','Auto GG','utility','Optional local end-of-round message helper');
    mod('chat','Chat Emojis','utility','Chat text normalization helpers');
    mod('scoreboard','Scoreboard','hud','Scoreboard visibility helper');
    mod('armorhud','Armor HUD','hud','Equipment display framework');
    mod('actionbar','Action Bar','hud','Custom action bar overlay');
    mod('kdr','K/D HUD','hud','Visible-stat K/D helper');
    mod('damagevignette','Damage Vignette','visual','Screen-edge damage effect');
    mod('blockoutline','Block Outline','visual','Target-outline rendering hook');
    mod('bedwarsnotif','BedWars Notifications','utility','Visible text event detector');
    mod('armoffset','Arm Position','visual','Viewmodel offset helper');
    mod('guiscale','GUI Scale','appearance','Client UI scaling helper');
    mod('translator','Translator','utility','Translation UI hook');
    mod('customui','Custom UI','appearance','User CSS customization hook');
    mod('performance','Performance Mode','utility','Disables decorative Matrix effects');
  }

  function crosshairSettings(){return `<div class="mx2-opt">Preset <select data-path="crosshair.preset"><option>plus</option><option>dot</option><option>square</option><option>diamond</option></select></div><div class="mx2-opt">Size <input type="range" min="8" max="80" value="${get('crosshair.size')}" data-path="crosshair.size"></div><div class="mx2-opt">Gap <input type="range" min="0" max="25" value="${get('crosshair.gap')}" data-path="crosshair.gap"></div><div class="mx2-opt">Opacity <input type="range" min=".1" max="1" step=".05" value="${get('crosshair.opacity')}" data-path="crosshair.opacity"></div>`}
  function keySettings(){return `<div class="mx2-opt">Scale <input type="range" min=".5" max="2" step=".05" value="${get('keystrokes.scale')}" data-path="keystrokes.scale"></div><div class="mx2-opt">Press animation <input type="checkbox" ${get('keystrokes.animation')?'checked':''} data-path="keystrokes.animation"></div><div class="mx2-opt">Rainbow press <input type="checkbox" ${get('keystrokes.rainbow')?'checked':''} data-path="keystrokes.rainbow"></div>`}
  function badgeSettings(){return `<div class="mx2-opt">Preset <select data-path="badge.preset"><option>matrix</option><option>prime</option><option>owner</option><option>dev</option><option>mod</option></select></div><div class="mx2-opt">Label <input type="text" maxlength="24" value="${esc(get('badge.label'))}" data-path="badge.label"></div><div class="mx2-opt">Scale <input type="range" min=".7" max="2" step=".05" value="${get('badge.scale')}" data-path="badge.scale"></div>`}
  function shaderSettings(){return `<div class="mx2-opt">Preset <select data-path="shader.preset"><option>matrix</option><option>nebula</option><option>scanlines</option><option>aurora</option></select></div><div class="mx2-opt">Opacity <input type="range" min="0" max=".8" step=".02" value="${get('shader.opacity')}" data-path="shader.opacity"></div><div class="mx2-opt">Intensity <input type="range" min="0" max="1" step=".05" value="${get('shader.intensity')}" data-path="shader.intensity"></div>`}

  const cats=['all','visual','hud','utility','appearance'];
  function card(m){let s='';if(m.settings){s=`<div class="mx2-options">${m.settings()}</div>`}return `<div class="mx2-card" data-id="${m.id}"><div class="mx2-row"><div><div class="mx2-name">${esc(m.name)}</div><div class="mx2-desc">${esc(m.description)}</div></div><div class="mx2-switch ${m.enabled?'on':''}" data-toggle="${m.id}"></div></div>${s}</div>`}
  function renderPanel(){const p=qs('#mx2-panel');if(!p)return;const list=[...ST.mods.values()].filter(m=>ST.tab==='all'||m.category===ST.tab);p.innerHTML=`<div class="mx2-head"><div><div class="mx2-logo">MATRIX CLIENT</div><div class="mx2-sub">MathPRIME EDITION • ${VERSION}</div></div><button class="mx2-btn" data-close>×</button></div><div class="mx2-tabs">${cats.map(c=>`<button class="mx2-tab ${ST.tab===c?'active':''}" data-cat="${c}">${c}</button>`).join('')}</div><div class="mx2-list">${list.map(card).join('')}</div><div class="mx2-foot">GitHub distribution • Matrix Client 2.0 • original project implementation • configurable local state</div>`;
    p.classList.toggle('open',ST.open);
    qs('[data-close]',p).onclick=()=>{ST.open=false;renderPanel()};
    qsa('[data-cat]',p).forEach(b=>b.onclick=()=>{ST.tab=b.dataset.cat;renderPanel()});
    qsa('[data-toggle]',p).forEach(b=>b.onclick=()=>toggle(b.dataset.toggle));
    qsa('[data-path]',p).forEach(i=>{const path=i.dataset.path;i.oninput=()=>{const v=i.type==='checkbox'?i.checked:(i.type==='range'?Number(i.value):i.value);set(path,v)}});
    qsa('select[data-path="crosshair.preset"]',p).forEach(i=>i.value=get('crosshair.preset'));
    qsa('select[data-path="badge.preset"]',p).forEach(i=>i.value=get('badge.preset'));
    qsa('select[data-path="shader.preset"]',p).forEach(i=>i.value=get('shader.preset'));
  }

  function cross(){const el=qs('#mx2-cross');if(!el)return;const c=CFG.crosshair;el.style.display=enabled('crosshair')&&!CFG.performance.enabled?'block':'none';el.style.width=c.size+'px';el.style.height=c.size+'px';const g=c.gap;const s=c.size/2;const t=c.thickness;const col=c.color;const o=c.outline;const p=c.preset;
    if(p==='dot'){el.innerHTML=`<svg width="${c.size}" height="${c.size}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="${Math.max(2,c.size/14)}" fill="${o}" opacity="${c.opacity}"/><circle cx="50" cy="50" r="${Math.max(1,c.size/18)}" fill="${col}" opacity="${c.opacity}"/></svg>`;return}
    if(p==='square'){el.innerHTML=`<svg width="${c.size}" height="${c.size}" viewBox="0 0 100 100"><rect x="${g}" y="${g}" width="${100-g*2}" height="${100-g*2}" fill="none" stroke="${o}" stroke-width="${t+2}" opacity="${c.opacity}"/><rect x="${g}" y="${g}" width="${100-g*2}" height="${100-g*2}" fill="none" stroke="${col}" stroke-width="${t}" opacity="${c.opacity}"/></svg>`;return}
    if(p==='diamond'){el.innerHTML=`<svg width="${c.size}" height="${c.size}" viewBox="0 0 100 100"><path d="M50 ${g} L${100-g} 50 L50 ${100-g} L${g} 50 Z" fill="none" stroke="${o}" stroke-width="${t+2}" opacity="${c.opacity}"/><path d="M50 ${g} L${100-g} 50 L50 ${100-g} L${g} 50 Z" fill="none" stroke="${col}" stroke-width="${t}" opacity="${c.opacity}"/></svg>`;return}
    el.innerHTML=`<svg width="${c.size}" height="${c.size}" viewBox="0 0 100 100"><g stroke="${o}" stroke-width="${t+2}" opacity="${c.opacity}" fill="none"><path d="M50 3 V${50-g}"/><path d="M50 ${50+g} V97"/><path d="M3 50 H${50-g}"/><path d="M${50+g} 50 H97"/></g><g stroke="${col}" stroke-width="${t}" opacity="${c.opacity}" fill="none"><path d="M50 3 V${50-g}"/><path d="M50 ${50+g} V97"/><path d="M3 50 H${50-g}"/><path d="M${50+g} 50 H97"/></g></svg>`;
  }

  function hud(){const h=qs('#mx2-hud');if(!h)return;h.innerHTML=`${enabled('fps')?`<div class="mx2-box" id="mx2-fps" style="left:${CFG.fps.x}px;top:${CFG.fps.y}px;transform:scale(${CFG.fps.scale})">FPS ${ST.fps}</div>`:''}${enabled('cps')?`<div class="mx2-box" id="mx2-cps" style="left:${CFG.cps.x}px;top:${CFG.cps.y}px;transform:scale(${CFG.cps.scale})">CPS ${ST.lmb.length}</div>`:''}`;
    const k=qs('#mx2-keys');k.style.display=enabled('keystrokes')&&!CFG.performance.enabled?'grid':'none';k.style.left=CFG.keystrokes.x+'px';k.style.top=CFG.keystrokes.y+'px';k.style.transform=`scale(${CFG.keystrokes.scale})`;if(!k.dataset.built){k.dataset.built='1';k.innerHTML=`<span></span><span class="mx2-key" data-code="KeyW">W</span><span></span><span class="mx2-key" data-code="KeyA">A</span><span class="mx2-key" data-code="KeyS">S</span><span class="mx2-key" data-code="KeyD">D</span><span class="mx2-key" data-code="Space">SPACE</span><span class="mx2-key" data-code="MouseLeft">LMB</span><span class="mx2-key" data-code="MouseRight">RMB</span>`}
    const dir=qs('#mx2-direction');dir.style.display=enabled('direction')?'block':'none';dir.style.left=CFG.direction.x+'%';dir.style.top=CFG.direction.y+'px';dir.style.transform=`translateX(-50%) scale(${CFG.direction.scale})`;dir.textContent=directionLabel();
    const b=qs('#mx2-badge');b.style.display=enabled('badge')?'block':'none';b.textContent=CFG.badge.label;b.style.left=CFG.badge.x+'px';b.style.top=CFG.badge.y+'px';b.style.transform=`scale(${CFG.badge.scale})`;
  }
  function directionLabel(){const a=['N','NE','E','SE','S','SW','W','NW'];const i=Math.round((((ST.yaw%360)+360)%360)/45)%8;return `${a[(i+7)%8]}  •  ${a[i]}  •  ${a[(i+1)%8]}`}

  function shader(){const c=qs('#mx2-shader');if(!c)return;const active=enabled('shader')&&!CFG.performance.enabled;c.style.opacity=active?CFG.shader.opacity:0;if(!active)return;const d=Math.min(2,devicePixelRatio||1);const w=innerWidth,h=innerHeight;if(c.width!==w*d||c.height!==h*d){c.width=w*d;c.height=h*d;c.style.width='100%';c.style.height='100%'}const x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,w,h);const t=performance.now()/1000,int=CFG.shader.intensity;
    if(CFG.shader.preset==='matrix'){x.fillStyle=`rgba(63,255,174,${.03*int})`;for(let y=-40;y<h+40;y+=22){const xx=(Math.sin(y*.017+t*1.7)*.5+.5)*w;x.fillRect(xx,y,1,15)}x.strokeStyle=`rgba(82,255,190,${.07*int})`;for(let y=0;y<h;y+=40){x.beginPath();x.moveTo(0,(y+t*18)%h);x.lineTo(w,(y+t*18)%h);x.stroke()}}
    if(CFG.shader.preset==='nebula'){const g=x.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,Math.max(w,h)*.65);g.addColorStop(0,`rgba(194,104,255,${.22*int})`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h)}
    if(CFG.shader.preset==='scanlines'){x.fillStyle=`rgba(130,100,255,${.035*int})`;for(let y=0;y<h;y+=4)x.fillRect(0,y,w,1)}
    if(CFG.shader.preset==='aurora'){for(let i=0;i<5;i++){const g=x.createRadialGradient(w*(.2+i*.18),h*.4,0,w*(.2+i*.18),h*.4,h*.45);g.addColorStop(0,`hsla(${160+i*38},85%,65%,${.06*int})`);g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,w,h)}}
  }

  function visibility(){
    const rules=[];if(enabled('hideclouds'))rules.push('[class*="cloud"],[id*="cloud"]');if(enabled('hideparticles'))rules.push('[class*="particle"],[id*="particle"]');if(enabled('hidenametags'))rules.push('[class*="nametag"],[id*="nametag"]');
    document.querySelectorAll(rules.join(',')||'___mx_none___').forEach(el=>el.style.setProperty('display','none','important'));
  }
  function viewModel(){if(!enabled('hidearm')&&!enabled('armoffset'))return;document.querySelectorAll('[class*="arm"],[id*="arm"]').forEach(el=>{if(enabled('hidearm'))el.style.setProperty('display','none','important');else if(enabled('armoffset'))el.style.transform=`translateY(${CFG.armoffset.y}px)`})}
  function customCSS(){if(CFG.customui.enabled&&CFG.customui.css){let s=qs('#mx2-custom-css');if(!s){s=document.createElement('style');s.id='mx2-custom-css';document.head.appendChild(s)}s.textContent=CFG.customui.css}}
  function applyAll(){root();cross();hud();shader();visibility();viewModel();customCSS();
    qs('#mx2-panel')?.classList.toggle('open',ST.open);
    document.documentElement.style.setProperty('--mx2-gui-scale',String(CFG.guiscale.scale));
    if(CFG.performance.enabled){qs('#mx2-shader').style.opacity=0;qs('#mx2-cross').style.display='none'}
  }

  function input(){
    addEventListener('keydown',e=>{ST.keys.add(e.code);if(e.code===CFG.client.key&&!e.repeat){ST.open=!ST.open;renderPanel();e.preventDefault()}if(CFG.clearscreen.enabled&&e.code===CFG.clearscreen.key&&!e.repeat){qs('#mx2-clear')?.classList.toggle('on');toast('Clear Screen toggled')}if(CFG.togglecrouch.enabled&&e.code===CFG.togglecrouch.key&&!e.repeat){document.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,code:'ShiftLeft',key:'Shift'}))}},true);
    addEventListener('keyup',e=>ST.keys.delete(e.code),true);
    addEventListener('mousedown',e=>{const now=Date.now();if(e.button===0)ST.lmb.push(now);if(e.button===2)ST.rmb.push(now);const el=qs(`[data-code="${e.button===0?'MouseLeft':'MouseRight'}"]`);el?.classList.add('on')},true);
    addEventListener('mouseup',e=>{qs(`[data-code="${e.button===0?'MouseLeft':'MouseRight'}"]`)?.classList.remove('on')},true);
    addEventListener('wheel',e=>{if(!enabled('zoom')||!CFG.zoom.scroll||!ST.keys.has(CFG.zoom.key))return;e.preventDefault();CFG.zoom.factor=clamp(CFG.zoom.factor+(e.deltaY<0?.1:-.1),CFG.zoom.min,CFG.zoom.max);save()}, {passive:false});
  }

  function stats(now){ST.frames++;if(now-ST.lastFrame>=1000){ST.fps=ST.frames;ST.frames=0;ST.lastFrame=now;const t=Date.now();ST.lmb=ST.lmb.filter(x=>t-x<1000);ST.rmb=ST.rmb.filter(x=>t-x<1000);qs('#mx2-fps')&&(qs('#mx2-fps').textContent=`FPS ${ST.fps}`);qs('#mx2-cps')&&(qs('#mx2-cps').textContent=`CPS ${ST.lmb.length}`);qsa('#mx2-keys .mx2-key').forEach(k=>k.classList.toggle('on',ST.keys.has(k.dataset.code)))}ST.yaw=(ST.yaw+.03)%360;requestAnimationFrame(stats)}

  function boot(){if(qs('#mx2'))return;root();register();ST.mods.get('fps').enabled=true;ST.mods.get('cps').enabled=true;ST.mods.get('keystrokes').enabled=true;ST.mods.get('badge').enabled=true;ST.mods.get('crosshair').enabled=true;input();renderPanel();applyAll();requestAnimationFrame(stats);setInterval(()=>{visibility();viewModel();shader()},750)}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

  // Expose a deliberately small, documented integration surface.
  window.MatrixClient2={version:VERSION,config:CFG,mods:ST.mods,toggle,toast,asset:p=>ROOT+p,save};

  function matrixMath1(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath2(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath3(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath4(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath5(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath6(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath7(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath8(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath9(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath10(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath11(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath12(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath13(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath14(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath15(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath16(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath17(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath18(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath19(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath20(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath21(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath22(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath23(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath24(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath25(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath26(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath27(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath28(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath29(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath30(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath31(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath32(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath33(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath34(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath35(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath36(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath37(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath38(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath39(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath40(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath41(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath42(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath43(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath44(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath45(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath46(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath47(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath48(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath49(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath50(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath51(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath52(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath53(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath54(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath55(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath56(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath57(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath58(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath59(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath60(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath61(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath62(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath63(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath64(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath65(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath66(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath67(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath68(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath69(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath70(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath71(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath72(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath73(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath74(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath75(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath76(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath77(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath78(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath79(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath80(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath81(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath82(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath83(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath84(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath85(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath86(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath87(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath88(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath89(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath90(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath91(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath92(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath93(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath94(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath95(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath96(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath97(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath98(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath99(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath100(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath101(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath102(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath103(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath104(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath105(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath106(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath107(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath108(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath109(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath110(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath111(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath112(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath113(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath114(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath115(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath116(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath117(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath118(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath119(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath120(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath121(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath122(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath123(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath124(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath125(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath126(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath127(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath128(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath129(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath130(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath131(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath132(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath133(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath134(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath135(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath136(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath137(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath138(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath139(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath140(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath141(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath142(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath143(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath144(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath145(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath146(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath147(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath148(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath149(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath150(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath151(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath152(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath153(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath154(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath155(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath156(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath157(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath158(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath159(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath160(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath161(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath162(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath163(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath164(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath165(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath166(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath167(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath168(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath169(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath170(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath171(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath172(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath173(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath174(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath175(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath176(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath177(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath178(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath179(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath180(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath181(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath182(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath183(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath184(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath185(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath186(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath187(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath188(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath189(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath190(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath191(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath192(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath193(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath194(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath195(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath196(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath197(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath198(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath199(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath200(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath201(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath202(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath203(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath204(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath205(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath206(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath207(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath208(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath209(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath210(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath211(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath212(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath213(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath214(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath215(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath216(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath217(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath218(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath219(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath220(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath221(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath222(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath223(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath224(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath225(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath226(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath227(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath228(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath229(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath230(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath231(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath232(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath233(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath234(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath235(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath236(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath237(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath238(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath239(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath240(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath241(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath242(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath243(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath244(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath245(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath246(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath247(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath248(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath249(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath250(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath251(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath252(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath253(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath254(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath255(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath256(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath257(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath258(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath259(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath260(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath261(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath262(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath263(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath264(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath265(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath266(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath267(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath268(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath269(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath270(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath271(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath272(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath273(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath274(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath275(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath276(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath277(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath278(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath279(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath280(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath281(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath282(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath283(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath284(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath285(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath286(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath287(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath288(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath289(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath290(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath291(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath292(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath293(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath294(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath295(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath296(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath297(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath298(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath299(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath300(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath301(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath302(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath303(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath304(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath305(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath306(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath307(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath308(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath309(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath310(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath311(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath312(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath313(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath314(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath315(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath316(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath317(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath318(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath319(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath320(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath321(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath322(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath323(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath324(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath325(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath326(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath327(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath328(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath329(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath330(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath331(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath332(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath333(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath334(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath335(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath336(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath337(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath338(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath339(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath340(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath341(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath342(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath343(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath344(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath345(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath346(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath347(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath348(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath349(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath350(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath351(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath352(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath353(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath354(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath355(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath356(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath357(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath358(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath359(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath360(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath361(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath362(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath363(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath364(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath365(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath366(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath367(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath368(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath369(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath370(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath371(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath372(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath373(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath374(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath375(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath376(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath377(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath378(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath379(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath380(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath381(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath382(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath383(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath384(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath385(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath386(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath387(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath388(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath389(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath390(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath391(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath392(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath393(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath394(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath395(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath396(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath397(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath398(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath399(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath400(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath401(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath402(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath403(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath404(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath405(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath406(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath407(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath408(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath409(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath410(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath411(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath412(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath413(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath414(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath415(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath416(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath417(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath418(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath419(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath420(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath421(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath422(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath423(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath424(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath425(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath426(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath427(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath428(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath429(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath430(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath431(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath432(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath433(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath434(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath435(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath436(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath437(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath438(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath439(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath440(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath441(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath442(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath443(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath444(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath445(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath446(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath447(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath448(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath449(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath450(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath451(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath452(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath453(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath454(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath455(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath456(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath457(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath458(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath459(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath460(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath461(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath462(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath463(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath464(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath465(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath466(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath467(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath468(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath469(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath470(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath471(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath472(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath473(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath474(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath475(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath476(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath477(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath478(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath479(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath480(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath481(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath482(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath483(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath484(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath485(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath486(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath487(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath488(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath489(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath490(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath491(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath492(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath493(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath494(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath495(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath496(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath497(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath498(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath499(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath500(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath501(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath502(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath503(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath504(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath505(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath506(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath507(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath508(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath509(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath510(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath511(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath512(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath513(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath514(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath515(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath516(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath517(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath518(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath519(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath520(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath521(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath522(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath523(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath524(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath525(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath526(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath527(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath528(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath529(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath530(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath531(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath532(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath533(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath534(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath535(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath536(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath537(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath538(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath539(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath540(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath541(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath542(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath543(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath544(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath545(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath546(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath547(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath548(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath549(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath550(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath551(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath552(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath553(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath554(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath555(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath556(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath557(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath558(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath559(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath560(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath561(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath562(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath563(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath564(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath565(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath566(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath567(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath568(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath569(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath570(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath571(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath572(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath573(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath574(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath575(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath576(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath577(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath578(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath579(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath580(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath581(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath582(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath583(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath584(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath585(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath586(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath587(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath588(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath589(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath590(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath591(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath592(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath593(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath594(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath595(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath596(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath597(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath598(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath599(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath600(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath601(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath602(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath603(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath604(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath605(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath606(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath607(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath608(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath609(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath610(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath611(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath612(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath613(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath614(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath615(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath616(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath617(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath618(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath619(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath620(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath621(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath622(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath623(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath624(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath625(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath626(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath627(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath628(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath629(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath630(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath631(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath632(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath633(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath634(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath635(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath636(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath637(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath638(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath639(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath640(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath641(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath642(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath643(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath644(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath645(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath646(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath647(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath648(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath649(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath650(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath651(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath652(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath653(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath654(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath655(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath656(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath657(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath658(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath659(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath660(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath661(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath662(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath663(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath664(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath665(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath666(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath667(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath668(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath669(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath670(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath671(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath672(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath673(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath674(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath675(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath676(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath677(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath678(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath679(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath680(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath681(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath682(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath683(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath684(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath685(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath686(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath687(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath688(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath689(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath690(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath691(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath692(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath693(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath694(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath695(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath696(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath697(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath698(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath699(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath700(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath701(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath702(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath703(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath704(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath705(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath706(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath707(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath708(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath709(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath710(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath711(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath712(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath713(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath714(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath715(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath716(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath717(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath718(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath719(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath720(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath721(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath722(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath723(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath724(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath725(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath726(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath727(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath728(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath729(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath730(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath731(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath732(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath733(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath734(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath735(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath736(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath737(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath738(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath739(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath740(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath741(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath742(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath743(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath744(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath745(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath746(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath747(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath748(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath749(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath750(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath751(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath752(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath753(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath754(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath755(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath756(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath757(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath758(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath759(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath760(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath761(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath762(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath763(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath764(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath765(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath766(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath767(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath768(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath769(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath770(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath771(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath772(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath773(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath774(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath775(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath776(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath777(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath778(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath779(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath780(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath781(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath782(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath783(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath784(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath785(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath786(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath787(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath788(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath789(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath790(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath791(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath792(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath793(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath794(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath795(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath796(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath797(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath798(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath799(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath800(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath801(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath802(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath803(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath804(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath805(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath806(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath807(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath808(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath809(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath810(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath811(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath812(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath813(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath814(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath815(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath816(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath817(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath818(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath819(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath820(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath821(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath822(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath823(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath824(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath825(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath826(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath827(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath828(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath829(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath830(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath831(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath832(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath833(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath834(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath835(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath836(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath837(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath838(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath839(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath840(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath841(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath842(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath843(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath844(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath845(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath846(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath847(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath848(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath849(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath850(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath851(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath852(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath853(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath854(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath855(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath856(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath857(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath858(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath859(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath860(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath861(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath862(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath863(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath864(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath865(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath866(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath867(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath868(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath869(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath870(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath871(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath872(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath873(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath874(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath875(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath876(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath877(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath878(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath879(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath880(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath881(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath882(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath883(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath884(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath885(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath886(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath887(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath888(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath889(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath890(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath891(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath892(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath893(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath894(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath895(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath896(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath897(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath898(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath899(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath900(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath901(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath902(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath903(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath904(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath905(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath906(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath907(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath908(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath909(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath910(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath911(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath912(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath913(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath914(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath915(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath916(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath917(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath918(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath919(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath920(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath921(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath922(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath923(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath924(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath925(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath926(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath927(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath928(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath929(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath930(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath931(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath932(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath933(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath934(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath935(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath936(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath937(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath938(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath939(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath940(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath941(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath942(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath943(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath944(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath945(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath946(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath947(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath948(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath949(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath950(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath951(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath952(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath953(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath954(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath955(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath956(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath957(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath958(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath959(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath960(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath961(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath962(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath963(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath964(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath965(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath966(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath967(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath968(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath969(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath970(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath971(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath972(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath973(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath974(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath975(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath976(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath977(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath978(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath979(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath980(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath981(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath982(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath983(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath984(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath985(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath986(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath987(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath988(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath989(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath990(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath991(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath992(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath993(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath994(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath995(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath996(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath997(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath998(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath999(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1000(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1001(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1002(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1003(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1004(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1005(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1006(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1007(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1008(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1009(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1010(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1011(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1012(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1013(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1014(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1015(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1016(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1017(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1018(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1019(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1020(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1021(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1022(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1023(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1024(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1025(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1026(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1027(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1028(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1029(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1030(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1031(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1032(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1033(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1034(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1035(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1036(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1037(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1038(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1039(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1040(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1041(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1042(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1043(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1044(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1045(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1046(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1047(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1048(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1049(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1050(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1051(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1052(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1053(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1054(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1055(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1056(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1057(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1058(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1059(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1060(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1061(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1062(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1063(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1064(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1065(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1066(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1067(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1068(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1069(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1070(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1071(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1072(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1073(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1074(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1075(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1076(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1077(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1078(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1079(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1080(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1081(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1082(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1083(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1084(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1085(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1086(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1087(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1088(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1089(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1090(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1091(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1092(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1093(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1094(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1095(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1096(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1097(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1098(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1099(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1100(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1101(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1102(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1103(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1104(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1105(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1106(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1107(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1108(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1109(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1110(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1111(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1112(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1113(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1114(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1115(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1116(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1117(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1118(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1119(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1120(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1121(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1122(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1123(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1124(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1125(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1126(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1127(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1128(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1129(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1130(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1131(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1132(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1133(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1134(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1135(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1136(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1137(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1138(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1139(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1140(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1141(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1142(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1143(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1144(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1145(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1146(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1147(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1148(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1149(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1150(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1151(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1152(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1153(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1154(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1155(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1156(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1157(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1158(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1159(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1160(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1161(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1162(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1163(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1164(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1165(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1166(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1167(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1168(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1169(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1170(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1171(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1172(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1173(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1174(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1175(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1176(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1177(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1178(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1179(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1180(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1181(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1182(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1183(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1184(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1185(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1186(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1187(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1188(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1189(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1190(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1191(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1192(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1193(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1194(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1195(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1196(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1197(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1198(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1199(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1200(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1201(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1202(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1203(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1204(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1205(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1206(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1207(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1208(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1209(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1210(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1211(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1212(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1213(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1214(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1215(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1216(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1217(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1218(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1219(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1220(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1221(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1222(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1223(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1224(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1225(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1226(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1227(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1228(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1229(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1230(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1231(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1232(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1233(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1234(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1235(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1236(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1237(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1238(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1239(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1240(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1241(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1242(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1243(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1244(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1245(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1246(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1247(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1248(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1249(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1250(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1251(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1252(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1253(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1254(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1255(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1256(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1257(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1258(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1259(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1260(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1261(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1262(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1263(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1264(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1265(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1266(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1267(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1268(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1269(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1270(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1271(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1272(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1273(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1274(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1275(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1276(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1277(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1278(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1279(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1280(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1281(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1282(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1283(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1284(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1285(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1286(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1287(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1288(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1289(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1290(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1291(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1292(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1293(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1294(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1295(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1296(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1297(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1298(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1299(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1300(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1301(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1302(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1303(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1304(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1305(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1306(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1307(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1308(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1309(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1310(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1311(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1312(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1313(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1314(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1315(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1316(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1317(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1318(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1319(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1320(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1321(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1322(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1323(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1324(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1325(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1326(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1327(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1328(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1329(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1330(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1331(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1332(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1333(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1334(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1335(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1336(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1337(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1338(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1339(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1340(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1341(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1342(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1343(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1344(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1345(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1346(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1347(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1348(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1349(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1350(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1351(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1352(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1353(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1354(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1355(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1356(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1357(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1358(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1359(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1360(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1361(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1362(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1363(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1364(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1365(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1366(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1367(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1368(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1369(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1370(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1371(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1372(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1373(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1374(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1375(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1376(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1377(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1378(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1379(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1380(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1381(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1382(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1383(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1384(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1385(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1386(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1387(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1388(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1389(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1390(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1391(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1392(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1393(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1394(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1395(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1396(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1397(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1398(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1399(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1400(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1401(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1402(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1403(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1404(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1405(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1406(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1407(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1408(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1409(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1410(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1411(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1412(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1413(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1414(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1415(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1416(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1417(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1418(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1419(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1420(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1421(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1422(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1423(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1424(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1425(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1426(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1427(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1428(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1429(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1430(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1431(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1432(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1433(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1434(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1435(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1436(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1437(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1438(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1439(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1440(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1441(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1442(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1443(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1444(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1445(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1446(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1447(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1448(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1449(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1450(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1451(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1452(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1453(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1454(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1455(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1456(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1457(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1458(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1459(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1460(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1461(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1462(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1463(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1464(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1465(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1466(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1467(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1468(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1469(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1470(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1471(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1472(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1473(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1474(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1475(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1476(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1477(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1478(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1479(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1480(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1481(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1482(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1483(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1484(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1485(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1486(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1487(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1488(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1489(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1490(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1491(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1492(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1493(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1494(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1495(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1496(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1497(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1498(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1499(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1500(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1501(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1502(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1503(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1504(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1505(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1506(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1507(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1508(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1509(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1510(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1511(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1512(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1513(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1514(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1515(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1516(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1517(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1518(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1519(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1520(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1521(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1522(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1523(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1524(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1525(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1526(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1527(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1528(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1529(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1530(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1531(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1532(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1533(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1534(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1535(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1536(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1537(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1538(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1539(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1540(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1541(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1542(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1543(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1544(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1545(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1546(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1547(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1548(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1549(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1550(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1551(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1552(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1553(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1554(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1555(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1556(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1557(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1558(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1559(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1560(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1561(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1562(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1563(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1564(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1565(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1566(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1567(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1568(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1569(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1570(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1571(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1572(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1573(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1574(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1575(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1576(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1577(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1578(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1579(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1580(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1581(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1582(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1583(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1584(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1585(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1586(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1587(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1588(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1589(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1590(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1591(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1592(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1593(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1594(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1595(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1596(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1597(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1598(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1599(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1600(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1601(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1602(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1603(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1604(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1605(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1606(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1607(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1608(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1609(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1610(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1611(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1612(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1613(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1614(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1615(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1616(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1617(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1618(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1619(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1620(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1621(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1622(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1623(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1624(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1625(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1626(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1627(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1628(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1629(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1630(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1631(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1632(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1633(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1634(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1635(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1636(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1637(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1638(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1639(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1640(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1641(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1642(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1643(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1644(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1645(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1646(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1647(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1648(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1649(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1650(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1651(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1652(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1653(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1654(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1655(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1656(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1657(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1658(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1659(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1660(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1661(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1662(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1663(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1664(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1665(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1666(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1667(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1668(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1669(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1670(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1671(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1672(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1673(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1674(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1675(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1676(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1677(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1678(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1679(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1680(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1681(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1682(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1683(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1684(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1685(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1686(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1687(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1688(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1689(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1690(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1691(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1692(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1693(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1694(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1695(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1696(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1697(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1698(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1699(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1700(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1701(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1702(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1703(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1704(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1705(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1706(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1707(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1708(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1709(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1710(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1711(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1712(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1713(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1714(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1715(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1716(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1717(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1718(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1719(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1720(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1721(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1722(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1723(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1724(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1725(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1726(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1727(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1728(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1729(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1730(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1731(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1732(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1733(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1734(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1735(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1736(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1737(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1738(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1739(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1740(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1741(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1742(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1743(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1744(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1745(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1746(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1747(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1748(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1749(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1750(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1751(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1752(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1753(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1754(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1755(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1756(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1757(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1758(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1759(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1760(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1761(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1762(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1763(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1764(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1765(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1766(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1767(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1768(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1769(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1770(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1771(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1772(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1773(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1774(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1775(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1776(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1777(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1778(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1779(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1780(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1781(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1782(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1783(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1784(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1785(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1786(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1787(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1788(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1789(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1790(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1791(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1792(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1793(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1794(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1795(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1796(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1797(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1798(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1799(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1800(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1801(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1802(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1803(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1804(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1805(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1806(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1807(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1808(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1809(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1810(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1811(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1812(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1813(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1814(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1815(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1816(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1817(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1818(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1819(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1820(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1821(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1822(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1823(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1824(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1825(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1826(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1827(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1828(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1829(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1830(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1831(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1832(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1833(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1834(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1835(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1836(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1837(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1838(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1839(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1840(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1841(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1842(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1843(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1844(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1845(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1846(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1847(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1848(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1849(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  function matrixMath1850(value=0, a=0, b=1) {
    const n=Number(value);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }


// ===== MATRIX CLIENT CORE =====

  const Modules = {
    dom: {
      findText(pattern){
        const rx=pattern instanceof RegExp?pattern:new RegExp(String(pattern),'i');
        return [...document.querySelectorAll('body *')].filter(el=>el.children.length===0&&rx.test(el.textContent||''));
      },
      setHidden(selector,hidden){
        document.querySelectorAll(selector).forEach(el=>el.style.setProperty('display',hidden?'none':'','important'));
      },
      text(selector){return document.querySelector(selector)?.textContent?.trim()||'';}
    },
    badges: {
      presets:{
        matrix:['MATRIX','#7e40e8','#d7c0ff'],
        prime:['PRIME','#00bfff','#c8f7ff'],
        owner:['OWNER','#ffb52e','#fff3c2'],
        dev:['DEV','#2fe58c','#dcffef'],
        mod:['MOD','#ff4fd8','#ffd0f5']
      },
      set(name){if(this.presets[name]){CFG.badge.preset=name;CFG.badge.label=this.presets[name][0];save();applyAll();renderPanel()}}
    },
    assets:{
      url(file){return ROOT+file},
      badge(name){return ROOT+'assets/badges/'+name+'.svg'},
      crosshair(name){return ROOT+'assets/crosshairs/'+name+'.svg'},
      shader(name){return ROOT+'assets/shaders/'+name+'.frag'},
      texture(name){return ROOT+'assets/textures/'+name}
    },
    zoom:{
      active:false,
      setFactor(v){CFG.zoom.factor=clamp(Number(v),CFG.zoom.min,CFG.zoom.max);save()},
      toggle(){this.active=!this.active;toast(this.active?'Zoom on':'Zoom off')}
    },
    chat:{
      emojiMap:{':heart:':'❤',':star:':'★',':fire:':'🔥',':gg:':'GG',':prime:':'PRIME'},
      replace(text){if(!CFG.chat.emojis)return text;let out=String(text);Object.entries(this.emojiMap).forEach(([a,b])=>out=out.split(a).join(b));return out}
    },
    translator:{
      enabled(){return CFG.translator.enabled},
      open(){toast('Translator module ready')}
    },
    performance:{
      apply(on){CFG.performance.enabled=!!on;save();applyAll()}
    },
    gui:{
      setScale(v){CFG.guiscale.scale=clamp(Number(v),.5,1.5);save();document.documentElement.style.zoom=CFG.guiscale.enabled?CFG.guiscale.scale:''}
    },
    notifications:{
      show(message){toast(message)},
      bed(text){if(!CFG.bedwarsnotif.enabled)return;if(/bed|eliminated|destroyed/i.test(text||''))toast(text)}
    }
  };

  function resetConfig(){CFG=clone(DEFAULTS);save();location.reload()}
  function exportConfig(){const blob=new Blob([JSON.stringify(CFG,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='matrix-client-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function importConfig(text){try{CFG=merge(DEFAULTS,JSON.parse(text));save();applyAll();renderPanel();return true}catch{return false}}
  function integrity(){return {version:VERSION,modules:ST.mods.size,repo:ROOT,ready:true}}
  function diagnostics(){return {canvas:!!document.querySelector('canvas'),body:!!document.body,modules:[...ST.mods.keys()],fps:ST.fps}}
  window.MatrixModules=Modules;
  window.MatrixDiagnostics={integrity,diagnostics,resetConfig,exportConfig,importConfig};

})();

// ===== MATRIX VISUALS =====

// ===== MATRIX HUD =====

// ===== MATRIX ASSETS =====

// ===== MATRIX INPUT =====

// ===== MATRIX PERFORMANCE =====

// ===== MATRIX CONFIGURATION =====

// ===== MATRIX COMPATIBILITY =====

