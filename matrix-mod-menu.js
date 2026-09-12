(() => {
"use strict";

const MX = {
  version: "2.3.0",
  repo: "https://github.com/francamatheus165-prog/matrix-client-2.0",
  raw: "https://raw.githubusercontent.com/francamatheus165-prog/matrix-client-2.0/main/",
  open: false,
  activeTab: "mods",
  selectedMod: null,
  search: "",
  bind: null,
  modules: new Map(),
  cfg: {},
  runtime: { fps:0, frames:0, last:performance.now(), lmb:[], rmb:[], keys:{} }
};

const DEFAULTS = {
  client: { keybind:"KeyG", autoFullscreen:false, site:"main", theme:"dark" },
  zoom: { enabled:false, level:.35, smoothness:false, scrollable:false, keybind:"KeyV" },
  crosshair: { enabled:false, url:"", size:32, opacity:1 },
  keystrokes: { enabled:true, showLeftCPS:false, showRightCPS:false, rainbow:false, pressAnimation:false, shadow:false, border:false, borderWidth:1, borderRadius:4, scale:1, keyColor:"#00000088", pressedColor:"#ffffff", textColor:"#ffffff", pressedTextColor:"#000000", borderColor:"#ffffff", x:20, y:200 },
  directionhud: { enabled:false, size:1 },
  autogg: { enabled:false },
  hidearm: { enabled:false },
  fps: { enabled:false, x:20, y:20, scale:1 },
  cps: { enabled:false, x:20, y:50, scale:1, showBothMouses:false },
  translator: { enabled:false, language:"en" },
  kdrindicator: { enabled:false },
  damagevignette: { enabled:false, color:"#ff0000" },
  clearscreen: { enabled:true, keybind:"KeyH" },
  armorhud: { enabled:true },
  blockoutline: { enabled:false, color:"#81e1ff" },
  nofog: { enabled:false },
  hidenametag: { enabled:false },
  hurtcam: { enabled:false },
  togglecrouch: { enabled:false, keybind:"Control" },
  hideparticles: { enabled:false, blood:false, smoke:false, blocks:false },
  hideclouds: { enabled:false },
  bedwarsnotif: { enabled:true, bedDestroy:true, teamEliminated:true },
  armoffset: { enabled:false, y:0 },
  scoreboard: { enabled:false },
  chatemojis: { enabled:true },
  guiscale: { enabled:true, hotbar:100, inventory:100 },
  actionbar: { enabled:false, x:50, y:80 },
  customui: { enabled:false, css:"", name:"" },
  textures: { enabled:false, pack:"matrix" },
  badges: { enabled:true, badge:"matrix", x:20, y:90, scale:1 },
  shaders: { enabled:false, preset:"matrix", opacity:.22, intensity:.6 },
  performance: { enabled:false }
};

function clone(v){ return JSON.parse(JSON.stringify(v)); }
function merge(a,b){
  const o=clone(a);
  for(const k of Object.keys(b||{})){
    if(b[k] && typeof b[k]==="object" && !Array.isArray(b[k]) && o[k] && typeof o[k]==="object") o[k]=merge(o[k],b[k]);
    else o[k]=b[k];
  }
  return o;
}
try{ MX.cfg=merge(DEFAULTS,GM_getValue("matrix-client-2-settings",{})); }catch{ MX.cfg=clone(DEFAULTS); }
function get(p,f){ const v=p.split(".").reduce((o,k)=>o?.[k],MX.cfg); return v===undefined?f:v; }
function set(p,v){ const a=p.split("."),k=a.pop(); let o=MX.cfg; for(const q of a){ if(!o[q])o[q]={}; o=o[q]; } o[k]=v; try{GM_setValue("matrix-client-2-settings",MX.cfg);}catch{} applyAll(); }
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function typing(t=document.activeElement){return !!t && (["INPUT","TEXTAREA","SELECT"].includes(t.tagName)||t.isContentEditable);}

function register(id,name,category,icon,configurable,options,description=""){
  const m={id,name,category,icon,configurable,options,description,enabled:!!get(id+".enabled",false)};
  MX.modules.set(id,m);
}

const moduleList=[
  ["zoom","Zoom","utilities","⌕",true],
  ["adblocker","Ad Blocker","utilities","◈",false],
  ["rpc","Discord RPC","utilities","◉",true],
  ["minecraft-textures","Texture Pack","visuals","▧",true],
  ["advanced-mods","Advanced Mods","utilities","◇",true],
  ["translation","Matrix Translation","utilities","文",true],
  ["clean-screen","Clear Screen","utilities","□",true],
  ["smooth-camera","Smooth Camera","visuals","◌",true],
  ["cinematic-fx","Cinematic FX","visuals","✦",true],
  ["mouse-trail","Mouse Trail","visuals","•",true],
  ["stopwatch","Stopwatch","utilities","◷",true],
  ["display-enhancer","Display Enhancer","visuals","◈",true],
  ["visual-keyboard","Visual Keyboard","hud","⌨",true],
  ["fps-counter","FPS Counter","hud","▦",true],
  ["hub","Matrix Hub","utilities","▤",true],
  ["keystrokes","Keystrokes","hud","⌨",true],
  ["visual-shader","Shaders","visuals","✦",true],
  ["visual-dark","Dark Mode","visuals","◐",true],
  ["visual-fullbright","Full Bright","visuals","☼",false],
  ["visual-galaxy","Galaxy Mode","visuals","✧",false],
  ["visual-weather","Weather FX","visuals","☁",true],
  ["visual-screen","Screen Effects","visuals","◍",false],
  ["visual-flashlight","Flashlight","visuals","◉",false],
  ["visual-crosshair","Crosshair","visuals","⊕",true],
  ["visual-hud","Game HUD","hud","▣",true],
  ["visual-fonts","Font Manager","visuals","A",true],

  // Matrix client family
  ["directionhud","Direction HUD","hud","N",true],
  ["autogg","Auto GG","utilities","♥",false],
  ["hidearm","Hide Arm","visuals","◐",false],
  ["cps","CPS","hud","⌁",true],
  ["kdrindicator","K/D Indicator","hud","K",false],
  ["damagevignette","Damage Vignette","visuals","◍",true],
  ["armorhud","Armor HUD","hud","◇",false],
  ["blockoutline","Block Outline","visuals","□",true],
  ["nofog","No Fog","visuals","◌",false],
  ["hidenametag","Hide Nametag","visuals","⌁",false],
  ["hurtcam","Hurt Cam","visuals","◉",true],
  ["togglecrouch","Toggle Crouch","utilities","⇩",true],
  ["hideparticles","Hide Particles","visuals","✦",true],
  ["hideclouds","Hide Clouds","visuals","☁",false],
  ["bedwarsnotif","BedWars Notifications","utilities","!",true],
  ["armoffset","Arm Position","visuals","↕",true],
  ["scoreboard","Scoreboard","hud","▤",false],
  ["chatemojis","Chat Emojis","utilities","☺",false],
  ["guiscale","GUI Scale","utilities","⊙",true],
  ["actionbar","Action Bar","hud","▰",true],
  ["customui","Custom UI","utilities","◫",true],
  ["badges","Custom Badges","visuals","◆",true],
  ["performance","Performance Mode","utilities","⚡",false]
];

function simpleOption(mod){
  const cfg=mod.id;
  switch(mod.id){
    case "zoom": return `
      ${range("zoom.level","Distance",2,5,.1,(v)=>(1/v).toFixed(2))}
      ${toggle("zoom.smoothness","Smoothness")}
      ${toggle("zoom.scrollable","Scrollable")}
      ${key("zoom.keybind","Keybind")}`;
    case "keystrokes": return `
      ${toggle("keystrokes.showLeftCPS","Show Left CPS")}
      ${toggle("keystrokes.showRightCPS","Show Right CPS")}
      ${toggle("keystrokes.rainbow","Rainbow")}
      ${toggle("keystrokes.pressAnimation","Press Animation")}
      ${toggle("keystrokes.shadow","Shadow")}
      ${toggle("keystrokes.border","Border")}
      ${range("keystrokes.scale","Scale",.5,2,.05,v=>Number(v).toFixed(2)+"x")}
      ${color("keystrokes.keyColor","Key Color")}
      ${color("keystrokes.pressedColor","Pressed Color")}`;
    case "visual-crosshair": return `
      ${text("crosshair.url","Image URL")}
      ${range("crosshair.size","Size",8,128,1,v=>v+"px")}
      ${range("crosshair.opacity","Opacity",.1,1,.05,v=>Math.round(v*100)+"%")}`;
    case "fps-counter": return `
      ${range("fps.scale","Scale",.5,2,.05,v=>Number(v).toFixed(2)+"x")}`;
    case "visual-shader": return `
      <div class="setting-row"><label>Preset</label><select class="text-box" data-option="shaders.preset"><option>matrix</option><option>nebula</option><option>scanlines</option></select></div>
      ${range("shaders.opacity","Opacity",0,.7,.01)}
      ${range("shaders.intensity","Intensity",0,1,.05)}`;
    case "badges": return `
      <div class="setting-row"><label>Badge</label><select class="text-box" data-option="badges.badge"><option>matrix</option><option>prime</option><option>owner</option><option>dev</option><option>mod</option></select></div>
      ${range("badges.scale","Scale",.6,1.6,.05,v=>Number(v).toFixed(2)+"x")}`;
    case "minecraft-textures": return `
      <div class="setting-row"><label>Pack</label><select class="text-box" data-option="textures.pack"><option>matrix</option><option>prime</option></select></div>
      ${toggle("textures.enabled","Enable texture overrides")}`;
    case "togglecrouch": return key("togglecrouch.keybind","Keybind");
    case "clean-screen": return key("clearscreen.keybind","Keybind");
    case "damagevignette": return color("damagevignette.color","Color");
    case "blockoutline": return color("blockoutline.color","Color");
    case "hurtcam": return range("hurtcam.strength","Strength",0,1,.05,v=>Number(v).toFixed(2));
    case "armoffset": return range("armoffset.y","Vertical Offset",-50,50,1,v=>v+"px");
    case "guiscale": return range("guiscale.hotbar","Hotbar",50,150,1,v=>v+"%");
    default: return `<div style="font-size:11px;color:var(--grey-2)">Options available for this Matrix module.</div>`;
  }
}
function range(path,label,min,max,step,fmt){const v=get(path,min);return `<div class="setting-row"><label>${label}</label><div class="setting-inline"><input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-option="${path}"><div class="range-val" data-output="${path}">${fmt?fmt(v):v}</div></div></div>`;}
function toggle(path,label){const v=!!get(path,false);return `<div class="setting-row"><label>${label}</label><div class="opt-toggle"><input type="checkbox" id="${path.replace(/\./g,"-")}" data-option="${path}" ${v?"checked":""}><label for="${path.replace(/\./g,"-")}"></label></div></div>`;}
function color(path,label){return `<div class="setting-row"><label>${label}</label><input class="color-input" type="color" value="${esc(get(path,"#ffffff"))}" data-option="${path}"></div>`;}
function text(path,label){return `<div class="setting-row"><label>${label}</label><input class="text-box" type="text" value="${esc(get(path,""))}" data-option="${path}"></div>`;}
function key(path,label){return `<div class="setting-row"><label>${label}</label><button class="keybind-box" data-keybind="${path}">${keyName(get(path,"KeyG"))}</button></div>`;}
function keyName(code){return ({KeyG:"G",KeyV:"V",KeyH:"H",Control:"CTRL"})[code]||code||"UNBOUND";}

function ensureRoot(){
  if(document.getElementById("__matrix_root")) return;
  const root=document.createElement("div");
  root.id="__matrix_root";
  root.innerHTML=`
  <div class="matrix-menu" id="matrix-menu" data-theme="dark">
    <div class="header">
      <div class="title"><span>Matrix Client</span></div>
      <div class="tabs">
        <button class="tab active" data-tab="mods">Mods</button>
        <button class="tab" data-tab="settings">Settings</button>
        <button class="tab" data-tab="mmmd">MMMD</button>
      </div>
      <button class="close" id="matrix-close" aria-label="Close">×</button>
    </div>

    <div class="toolbar">
      <div class="search">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="matrix-search" placeholder="Search...">
      </div>
    </div>

    <div class="mods" id="matrix-mods-panel"></div>
    <div id="matrix-settings-panel"></div>

    <div id="matrix-mmmd-panel" class="mmmd-panel" style="display:none">
      <div class="mmmd-hero"><div class="mmmd-title">MMMD</div><div class="mmmd-subtitle">Matrix Multi-Module Dashboard</div></div>
      <div class="mmmd-section-title">Client</div>
      <div class="mmmd-grid">
        <div class="mmmd-card"><div class="mmmd-name">Matrix Client</div><div class="mmmd-role">2.3</div><div class="mmmd-handle">GitHub hosted runtime</div></div>
        <div class="mmmd-card"><div class="mmmd-name">MineFun</div><div class="mmmd-role">ONLINE</div><div class="mmmd-handle">Client-side integration</div></div>
      </div>
      <div class="mmmd-section-title">Status</div>
      <div class="mmmd-stat-grid">
        <div class="mmmd-stat"><span>FPS</span><strong id="mmmd-fps">0</strong></div>
        <div class="mmmd-stat"><span>Modules</span><strong id="mmmd-mod-count">${MX.modules.size}</strong></div>
      </div>
    </div>

    <div class="options-panel" id="matrix-options-panel">
      <div class="options-header"><button class="options-back" id="matrix-options-back">﹤</button><span id="matrix-options-title">Options</span></div>
      <div class="options-body" id="matrix-options-body"></div>
    </div>
  </div>
  <div id="mx-overlay"></div>
  <div id="mx-cross"></div>
  <div id="mx-keys"></div>
  <div id="mx-badge"></div>
  <canvas id="mx-shader"></canvas>
  <div id="mx-hud"></div>`;
  document.documentElement.appendChild(root);
}

const CSS=`
#__matrix_root{position:fixed;inset:0;width:100vw;height:100vh;z-index:999999;pointer-events:none}
#__matrix_root *{box-sizing:border-box;font-family:sans-serif!important;margin:0;padding:0}
#__matrix_root .matrix-menu[data-theme="dark"]{--background-1:#181818;--background-2:#242424;--background-3:#282828;--background-4:#303030;--background-5:#393939;--border-1:#353535;--border-2:#424242;--primary-1:#517fe6;--white:#e6f1ff;--grey-1:#b6b6b6;--grey-2:#807f7f;--enabled:#23bd61;--enabled-hover:#2ca45c;--disabled:#a32444;--disabled-hover:#8f203b}
#__matrix_root .matrix-menu{pointer-events:all;position:absolute;top:50%!important;left:50%!important;transform:translate(-50%,-50%);width:43vw;height:55vh;background:var(--background-2);border:1px solid var(--border-1);border-radius:6px;overflow:hidden;color:white;box-shadow:0 0 1rem rgba(0,0,0,.5);display:none;flex-direction:column}
#__matrix_root .matrix-menu.open{display:flex}
#__matrix_root .header{height:6.5vh;display:flex;align-items:center;justify-content:space-between;padding:0 10px;border-bottom:1px solid var(--border-1);background:var(--background-1);flex-shrink:0}
#__matrix_root .title{display:flex;align-items:center;color:var(--white);gap:8px;font-size:16px;font-weight:600}
#__matrix_root .tabs{display:flex;gap:8px}
#__matrix_root .tab{border:solid 1.5px var(--border-1);border-radius:4px;background:transparent;color:var(--white);cursor:pointer;padding:4px 14px;font-size:13px;transition:background .15s}
#__matrix_root .tab.active{background:var(--background-3)}
#__matrix_root .tab:hover:not(.active){background:var(--background-2)}
#__matrix_root .close{width:28px;height:28px;border:solid 1.5px var(--border-1);background:var(--background-3);color:var(--white);border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center}
#__matrix_root .toolbar{padding:8px;flex-shrink:0}
#__matrix_root .search{width:200px;height:30px;background:var(--background-1);border:1px solid var(--border-1);border-radius:6px;display:flex;align-items:center;padding:0 10px;gap:7px}
#__matrix_root .search input{background:transparent;outline:none;border:none;color:var(--white);width:100%;font-size:12px}
#__matrix_root .mods{flex:1;padding:12px;display:grid;grid-template-columns:repeat(auto-fill,148px);gap:12px;justify-content:start;overflow-y:auto}
#__matrix_root .mods::-webkit-scrollbar{width:4px}
#__matrix_root .mods::-webkit-scrollbar-thumb{background:var(--border-2);border-radius:2px}
#__matrix_root .card{width:148px;height:148px;background:var(--background-4);border:1.5px solid var(--border-2);border-radius:8px;display:flex;flex-direction:column;align-items:center;overflow:visible}
#__matrix_root .card-icon{color:var(--grey-2);margin-top:18px;flex-shrink:0}
#__matrix_root .card .name{margin-top:10px;color:var(--grey-1);font-size:13px;text-align:center;padding:0 5px}
#__matrix_root .card-btn{width:100%;margin-top:auto;display:flex;flex-direction:column}
#__matrix_root .options,#__matrix_root .toggle-btn{display:block;width:100%;margin:0}
#__matrix_root .options{height:26px;border:none;border-top:1px solid var(--border-2);border-bottom:1px solid var(--border-2);background:var(--background-5);color:var(--white);cursor:pointer;font-size:12px}
#__matrix_root .toggle-btn{height:30px;border:none;background:var(--disabled);color:var(--white);font-weight:600;font-size:12px;cursor:pointer;border-bottom-left-radius:7px;border-bottom-right-radius:7px}
#__matrix_root .card.enabled .toggle-btn{background:var(--enabled)}
#__matrix_root .card.enabled .toggle-btn:hover{background:var(--enabled-hover)}
#__matrix_root .options:hover{background:var(--border-2)}
#__matrix_root .options-panel{position:absolute;inset:0;background:var(--background-2);display:none;flex-direction:column;z-index:20}
#__matrix_root .options-panel.open{display:flex}
#__matrix_root .options-header{height:6.5vh;display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid var(--border-1);background:var(--background-1);flex-shrink:0}
#__matrix_root .options-header span{font-size:14px;font-weight:600;color:var(--white)}
#__matrix_root .options-back{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:var(--background-3);border:1.5px solid var(--border-1);color:var(--white);border-radius:5px;cursor:pointer}
#__matrix_root .options-body{flex:1;padding:14px;display:flex;flex-direction:column;gap:12px;overflow-y:auto}
#__matrix_root .setting-row{display:flex;flex-direction:row;justify-content:space-between;align-items:center;gap:12px}
#__matrix_root .setting-row label{font-size:12px;color:var(--grey-2);text-transform:uppercase}
#__matrix_root .setting-row input[type=range]{width:50%;cursor:pointer}
#__matrix_root .setting-inline{display:flex;align-items:center;gap:10px;width:52%}
#__matrix_root .setting-inline input{flex:1}
#__matrix_root .range-val{min-width:36px;text-align:right;font-size:13px;color:var(--primary-1)}
#__matrix_root .keybind-box,.text-box,.color-input{background:var(--background-1);border:1px solid var(--border-1);border-radius:5px;padding:7px 12px;color:var(--white);font-size:12px;text-align:center;cursor:pointer;outline:none}
#__matrix_root .text-box{width:40%;cursor:text}
#__matrix_root .color-input{width:72px;padding:2px}
#__matrix_root .keybind-box:hover,.text-box:focus{border-color:var(--primary-1)}
#__matrix_root .opt-toggle{position:relative;display:inline-block;width:44px;height:22px}
#__matrix_root .opt-toggle input{display:none}
#__matrix_root .opt-toggle label{position:absolute;inset:0;background:var(--background-1);border:1px solid var(--border-1);border-radius:11px;cursor:pointer}
#__matrix_root .opt-toggle input:checked+label{background:var(--primary-1)}
#__matrix_root .opt-toggle label:after{content:"";position:absolute;top:2px;left:3px;width:16px;height:16px;background:var(--white);border-radius:50%;transition:left .2s}
#__matrix_root .opt-toggle input:checked+label:after{left:25px}
#__matrix_root #matrix-settings-panel{display:none;flex-direction:column;gap:12px;padding:14px;overflow-y:auto;flex:1}
#__matrix_root .mmmd-panel{padding:14px;overflow:auto;flex:1}
#__matrix_root .mmmd-hero{padding:18px;border:1px solid rgba(81,127,230,.22);border-radius:12px;background:linear-gradient(135deg,rgba(81,127,230,.10),rgba(20,20,35,.78));margin-bottom:14px}
#__matrix_root .mmmd-title{font-size:26px;font-weight:900;letter-spacing:4px}
#__matrix_root .mmmd-subtitle{font-size:12px;color:var(--grey-2);margin-top:6px}
#__matrix_root .mmmd-section-title{font-size:11px;text-transform:uppercase;font-weight:800;color:var(--primary-1);letter-spacing:1px;margin:14px 0 8px}
#__matrix_root .mmmd-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#__matrix_root .mmmd-card,.mmmd-stat{padding:12px;border:1px solid var(--border-1);border-radius:10px;background:var(--background-3)}
#__matrix_root .mmmd-name{font-weight:800}.mmmd-role{display:inline-block;margin-top:5px;padding:2px 6px;border-radius:999px;background:rgba(35,189,97,.16);color:var(--enabled);font-size:9px;font-weight:900}
#__matrix_root .mmmd-handle{font-size:10px;color:var(--grey-2);margin-top:6px}
#__matrix_root .mmmd-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#__matrix_root #mx-shader{position:fixed;inset:0;z-index:2147482980;pointer-events:none;opacity:0}
#__matrix_root #mx-cross{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:2147482990}
#__matrix_root #mx-badge{position:fixed;z-index:2147482990;pointer-events:none;padding:4px 8px;border-radius:5px;background:linear-gradient(135deg,#6430bf,#ae78ff);color:#fff;font:800 9px Arial;letter-spacing:.08em}
#__matrix_root #mx-keys{position:fixed;z-index:2147482990;display:grid;grid-template-columns:repeat(3,42px);gap:4px;pointer-events:none}
#__matrix_root .mx-key{height:34px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:#000b;border:1px solid #fff2;color:#fff;font:10px Arial}
#__matrix_root .mx-key.down{background:#6f36d8}
#__matrix_root #mx-hud{position:fixed;inset:0;pointer-events:none;z-index:2147482990}
#__matrix_root .mx-hud-box{position:fixed;padding:5px 8px;border:1px solid #fff1;border-radius:5px;background:#000a;color:#fff;font:11px monospace}
`;

function injectCSS(){ if(!document.getElementById("matrix-client-css")){const s=document.createElement("style");s.id="matrix-client-css";s.textContent=CSS;document.head?.appendChild(s) || document.documentElement.appendChild(s);} }

function renderMods(){
  const panel=document.getElementById("matrix-mods-panel");
  const q=MX.search.trim().toLowerCase();
  const arr=[...MX.modules.values()].filter(m=>!q || m.name.toLowerCase().includes(q));
  panel.innerHTML=arr.map(m=>`
    <div class="card ${m.enabled?"enabled":""}" data-mod="${m.id}">
      <div class="card-icon">${m.icon}</div>
      <div class="name">${esc(m.name)}</div>
      <div class="card-btn">
        ${m.configurable?`<button class="options" data-options="${m.id}">Options</button>`:""}
        <button class="toggle-btn" data-toggle="${m.id}">${m.enabled?"Enabled":"Disabled"}</button>
      </div>
    </div>
  `).join("");

  panel.querySelectorAll("[data-toggle]").forEach(b=>b.addEventListener("click",e=>{
    e.stopPropagation();
    const id=b.dataset.toggle, m=MX.modules.get(id);
    if(!m)return;
    m.enabled=!m.enabled;
    set(id+".enabled",m.enabled);
    renderMods();
  }));
  panel.querySelectorAll("[data-options]").forEach(b=>b.addEventListener("click",e=>{
    e.stopPropagation(); openOptions(b.dataset.options);
  }));
}

function renderSettings(){
  const p=document.getElementById("matrix-settings-panel");
  p.innerHTML=`
    <div class="setting-row"><label>Auto Fullscreen</label><div class="opt-toggle"><input type="checkbox" id="client-autofullscreen-btn" ${get("client.autoFullscreen",false)?"checked":""}><label for="client-autofullscreen-btn"></label></div></div>
    <div class="setting-row"><label>Menu Keybind</label><button class="keybind-box" id="client-keybind-btn">${keyName(get("client.keybind","KeyG"))}</button></div>
    <div class="setting-row"><label>URL</label><div class="site-buttons"><button class="opt-btn" id="btn-main">minefun.io</button><button class="opt-btn" id="btn-sandbox">sandbox.minefun.io</button></div></div>
  `;
  p.querySelector("#client-autofullscreen-btn").addEventListener("change",e=>set("client.autoFullscreen",e.target.checked));
  p.querySelector("#client-keybind-btn").addEventListener("click",()=>beginBind("client.keybind",p.querySelector("#client-keybind-btn")));
  p.querySelector("#btn-main").addEventListener("click",()=>set("client.site","main"));
  p.querySelector("#btn-sandbox").addEventListener("click",()=>set("client.site","sandbox"));
}

function openOptions(id){
  const m=MX.modules.get(id); if(!m)return;
  MX.selectedMod=id;
  const panel=document.getElementById("matrix-options-panel");
  document.getElementById("matrix-options-title").textContent=m.name+" Options";
  document.getElementById("matrix-options-body").innerHTML=m.options?m.options(m):"";
  panel.classList.add("open");
  bindOptionEvents(panel);
}
function closeOptions(){document.getElementById("matrix-options-panel").classList.remove("open"); MX.selectedMod=null;}
function bindOptionEvents(panel){
  panel.querySelectorAll("[data-option]").forEach(el=>{
    const p=el.dataset.option;
    if(el.type==="checkbox")el.addEventListener("change",()=>set(p,el.checked));
    else el.addEventListener("input",()=>{let v=el.type==="range"?Number(el.value):el.value;set(p,v);const o=panel.querySelector(`[data-output="${p}"]`);if(o)o.textContent=el.type==="range"?el.value:el.value;});
  });
  panel.querySelectorAll("[data-keybind]").forEach(el=>el.addEventListener("click",()=>beginBind(el.dataset.keybind,el)));
}
function beginBind(path,el){MX.bind={path,el};el.classList.add("waiting");el.textContent="Press key...";}
function finishBind(code){if(!MX.bind)return;set(MX.bind.path,code);if(MX.bind.el){MX.bind.el.classList.remove("waiting");MX.bind.el.textContent=keyName(code);}MX.bind=null;}

function showTab(tab){
  MX.activeTab=tab;
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));
  const mods=document.getElementById("matrix-mods-panel"), settings=document.getElementById("matrix-settings-panel"), mmmd=document.getElementById("matrix-mmmd-panel");
  mods.style.display=tab==="mods"?"grid":"none";
  settings.style.display=tab==="settings"?"flex":"none";
  mmmd.style.display=tab==="mmmd"?"block":"none";
  document.getElementById("matrix-options-panel").classList.remove("open");
  if(tab==="mods")renderMods();
  if(tab==="settings")renderSettings();
}
function openMenu(v){MX.open=typeof v==="boolean"?v:!MX.open;document.getElementById("matrix-menu").classList.toggle("open",MX.open);if(MX.open)showTab(MX.activeTab);}
function applyAll(){
  renderHud();
  renderKeystrokes();
  renderCrosshair();
  renderBadge();
  renderShader();
}

function renderHud(){
  const h=document.getElementById("mx-hud"); if(!h)return;
  let html="";
  if(get("fps.enabled",false))html+=`<div class="mx-hud-box" style="left:${get("fps.x",20)}px;top:${get("fps.y",20)}px;transform:scale(${get("fps.scale",1)})">FPS ${MX.runtime.fps}</div>`;
  if(get("cps.enabled",false))html+=`<div class="mx-hud-box" style="left:${get("cps.x",20)}px;top:${get("cps.y",50)}px;transform:scale(${get("cps.scale",1)})">CPS ${MX.runtime.lmb.length}</div>`;
  h.innerHTML=html;
}
function renderKeystrokes(){
  const el=document.getElementById("mx-keys"); if(!el)return;
  if(!get("keystrokes.enabled",true)){el.style.display="none";return;}
  el.style.display="grid";el.style.left=get("keystrokes.x",20)+"px";el.style.top=get("keystrokes.y",200)+"px";el.style.transform=`scale(${get("keystrokes.scale",1)})`;
  el.innerHTML=`<div></div><div class="mx-key ${MX.runtime.keys.KeyW?"down":""}" data-k="KeyW">W</div><div></div>
    <div class="mx-key ${MX.runtime.keys.KeyA?"down":""}" data-k="KeyA">A</div><div class="mx-key ${MX.runtime.keys.KeyS?"down":""}" data-k="KeyS">S</div><div class="mx-key ${MX.runtime.keys.KeyD?"down":""}" data-k="KeyD">D</div>
    <div class="mx-key ${MX.runtime.keys.Space?"down":""}" data-k="Space">SPACE</div>
    <div class="mx-key ${MX.runtime.keys.MouseLeft?"down":""}" data-k="MouseLeft">LMB</div>
    <div class="mx-key ${MX.runtime.keys.MouseRight?"down":""}" data-k="MouseRight">RMB</div>`;
}
function renderCrosshair(){
  const h=document.getElementById("mx-cross");if(!h)return;
  if(!get("crosshair.enabled",false)&&!get("visual-crosshair.enabled",false)){h.style.display="none";return}
  const s=get("crosshair.size",32),o=get("crosshair.opacity",1),gap=5;
  h.style.display="block";
  const url=get("crosshair.url","");
  if(url){h.innerHTML=`<img src="${esc(url)}" style="width:${s}px;height:${s}px;opacity:${o};image-rendering:pixelated">`;return}
  h.innerHTML=`<svg width="${s}" height="${s}" viewBox="0 0 100 100"><g stroke="#000" stroke-width="4" opacity="${o}"><path d="M50 10V45M50 55V90M10 50H45M55 50H90"/></g><g stroke="#fff" stroke-width="2" opacity="${o}"><path d="M50 10V45M50 55V90M10 50H45M55 50H90"/></g></svg>`;
}
function renderBadge(){
  const b=document.getElementById("mx-badge"); if(!b)return;
  if(!get("badges.enabled",true)){b.style.display="none";return}
  b.style.display="block";b.style.left=get("badges.x",20)+"px";b.style.top=get("badges.y",90)+"px";b.style.transform=`scale(${get("badges.scale",1)})`;
  b.textContent=String(get("badges.badge","matrix")).toUpperCase();
}
function renderShader(){
  const c=document.getElementById("mx-shader");if(!c)return;
  const on=get("shaders.enabled",false)&&!get("performance.enabled",false);
  c.style.opacity=on?String(get("shaders.opacity",.22)):"0";if(!on)return;
  const ctx=c.getContext("2d"); if(!ctx)return;
  c.width=innerWidth;c.height=innerHeight;
  ctx.clearRect(0,0,c.width,c.height);
  const p=get("shaders.preset","matrix"),t=performance.now()/1000,i=get("shaders.intensity",.6);
  if(p==="matrix"){ctx.strokeStyle=`rgba(95,255,185,${.06*i})`;for(let y=0;y<c.height;y+=34){ctx.beginPath();ctx.moveTo(0,(y+t*12)%c.height);ctx.lineTo(c.width,(y+t*12)%c.height);ctx.stroke();}}
  else if(p==="nebula"){const g=ctx.createRadialGradient(c.width*.5,c.height*.5,0,c.width*.5,c.height*.5,Math.max(c.width,c.height)*.7);g.addColorStop(0,`rgba(160,80,255,${.2*i})`);g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);}
  else {ctx.fillStyle=`rgba(180,190,255,${.04*i})`;for(let y=0;y<c.height;y+=5)ctx.fillRect(0,y,c.width,1);}
}

function eventHooks(){
  addEventListener("keydown",e=>{
    if(MX.bind){if(!typing(e.target)){finishBind(e.code);e.preventDefault();e.stopPropagation();}return;}
    MX.runtime.keys[e.code]=true;
    if(e.code===get("client.keybind","KeyG")&&!e.repeat&&!typing(e.target)){openMenu();e.preventDefault();e.stopPropagation();return;}
    if(e.code===get("clearscreen.keybind","KeyH")&&!e.repeat&&!typing(e.target)&&get("clearscreen.enabled",true)){const o=document.getElementById("mx-overlay");o.style.visibility=o.style.visibility==="hidden"?"visible":"hidden";}
  },true);
  addEventListener("keyup",e=>{MX.runtime.keys[e.code]=false;},true);
  addEventListener("mousedown",e=>{const t=Date.now();if(e.button===0)MX.runtime.lmb.push(t);if(e.button===2)MX.runtime.rmb.push(t);MX.runtime.keys[e.button===0?"MouseLeft":"MouseRight"]=true;},true);
  addEventListener("mouseup",e=>{MX.runtime.keys[e.button===0?"MouseLeft":"MouseRight"]=false;},true);
  document.getElementById("matrix-close").addEventListener("click",()=>openMenu(false));
  document.getElementById("matrix-options-back").addEventListener("click",closeOptions);
  document.getElementById("matrix-search").addEventListener("input",e=>{MX.search=e.target.value;renderMods();});
  document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>showTab(t.dataset.tab)));
}

function ticker(now){
  MX.runtime.frames++;
  if(now-MX.runtime.last>=1000){
    MX.runtime.fps=MX.runtime.frames;MX.runtime.frames=0;MX.runtime.last=now;
    const n=Date.now();MX.runtime.lmb=MX.runtime.lmb.filter(t=>n-t<1000);MX.runtime.rmb=MX.runtime.rmb.filter(t=>n-t<1000);
    renderHud();
  }
  renderKeystrokes();
  requestAnimationFrame(ticker);
}

function boot(){
  if(window.__MATRIX_CLIENT_2_LOADED)return;
  window.__MATRIX_CLIENT_2_LOADED=true;

  for(const [id,name,category,icon,conf] of moduleList){
    register(id,name,category,icon,conf,()=>simpleOption({id,name}));
  }
  ensureRoot();injectCSS();renderMods();renderSettings();showTab("mods");eventHooks();applyAll();requestAnimationFrame(ticker);
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();

window.MatrixClient2={toggle:()=>openMenu(),open:()=>openMenu(true),close:()=>openMenu(false)};
})();
