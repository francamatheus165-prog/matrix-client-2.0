(() => {
"use strict";

const MX={
 version:"2.6.0",
 root:null, menu:null, open:false, tab:"mods", search:"", options:null,
 bindPath:null, modules:new Map(), state:null,
 stats:{fps:0,frames:0,last:performance.now(),lmb:[],rmb:[],cpsL:0,cpsR:0},
 keys:Object.create(null), observers:[], timers:[], glPatched:false, shaderGL:null,
 assets:"https://raw.githubusercontent.com/francamatheus165-prog/matrix-client-2.0/main/assets/"
};

const DEFAULTS={
 client:{menuKey:"KeyG",theme:"dark",compact:false},
 zoom:{enabled:false,factor:3,keybind:"KeyV",smooth:true,scrollable:false},
 crosshair:{enabled:false,image:"",size:32,opacity:1,gap:5,thickness:2,color:"#ffffff",outline:"#000000"},
 keystrokes:{enabled:true,x:20,y:190,scale:1,showLeftCPS:false,showRightCPS:false,pressAnimation:true,rainbow:false,shadow:true,border:true,radius:5,keyColor:"#000000a8",pressedColor:"#517fe6",textColor:"#ffffff",pressedTextColor:"#ffffff"},
 fps:{enabled:false,x:20,y:20,scale:1},cps:{enabled:false,x:20,y:50,scale:1},directionhud:{enabled:false,scale:1},
 textures:{enabled:false,pack:"matrix"},
 badges:{enabled:true,localPlayer:"alex-PRIME",badge:"matrix",autoChat:true,x:20,y:80,scale:1},
 shaders:{enabled:false,preset:"matrix",opacity:.20,intensity:.60},
 nofog:{enabled:false},hidearm:{enabled:false},hidenametag:{enabled:false},hideparticles:{enabled:false},hideclouds:{enabled:false},
 hurtcam:{enabled:false,strength:.25},damagevignette:{enabled:false,color:"#e05252"},togglecrouch:{enabled:false,keybind:"Control"},
 clearscreen:{enabled:true,keybind:"KeyH"},autogg:{enabled:false,message:"gg"},armorhud:{enabled:true},blockoutline:{enabled:false,color:"#81e1ff"},
 scoreboard:{enabled:false},chatemojis:{enabled:true},guiscale:{enabled:true,hotbar:100,inventory:100},actionbar:{enabled:false},
 customui:{enabled:false,css:""},performance:{enabled:false},smoothcamera:{enabled:false,strength:.4},cinematicfx:{enabled:false,opacity:.12},
 mousetrail:{enabled:false,opacity:.45},stopwatch:{enabled:false},displayenhancer:{enabled:false,level:.3},visualkeyboard:{enabled:false},darkmode:{enabled:true},
 fullbright:{enabled:false},galaxy:{enabled:false},weather:{enabled:false,intensity:.4},screeneffects:{enabled:false},flashlight:{enabled:false},gamehud:{enabled:false},fontmanager:{enabled:false}
};

function clone(v){return JSON.parse(JSON.stringify(v));}
function merge(a,b){const o=clone(a);for(const k of Object.keys(b||{})){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&o[k]&&typeof o[k]==="object")o[k]=merge(o[k],b[k]);else o[k]=b[k];}return o;}
try{MX.state=merge(DEFAULTS,GM_getValue("matrix-client-2",{}));}catch{MX.state=clone(DEFAULTS);}
function cfg(path,fallback){const v=path.split(".").reduce((o,k)=>o?.[k],MX.state);return v===undefined?fallback:v;}
function save(){try{GM_setValue("matrix-client-2",MX.state);}catch{}}
function cfgSet(path,value){const p=path.split("."),last=p.pop();let o=MX.state;for(const k of p){if(!o[k]||typeof o[k]!=="object")o[k]={};o=o[k];}o[last]=value;save();applyAll();}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function isTyping(target=document.activeElement){return!!target&&(target.tagName==="INPUT"||target.tagName==="TEXTAREA"||target.tagName==="SELECT"||target.isContentEditable===true);}
function keyLabel(k){return({KeyG:"G",KeyV:"V",KeyH:"H",Control:"CTRL",ShiftLeft:"SHIFT",ShiftRight:"SHIFT",Space:"SPACE",Escape:"ESC",Enter:"ENTER",Tab:"TAB"}[k]||String(k||"").replace(/^Key/,"").replace(/^Digit/,""));}
function makeIcon(path){return `<svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;}

const I={
 zoom:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>',
 cross:'<circle cx="12" cy="12" r="6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
 keyboard:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h.01M10 9h.01M13 9h.01M16 9h.01M7 13h.01M10 13h.01M13 13h4"/>',
 direction:'<path d="m12 3 7 18-7-4-7 4z"/>', heart:'<path d="M20.8 8.8a5.4 5.4 0 0 0-9-3.8 5.4 5.4 0 0 0-9 3.8c0 3.9 4.1 6.5 9 11.2 4.9-4.7 9-7.3 9-11.2Z"/>',
 texture:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h3v3H8zM13 13h3v3h-3zM13 8h3M8 16h3"/>',
 shield:'<path d="m12 3 8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z"/>', spark:'<path d="m12 2 1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8Z"/>',
 translation:'<path d="M4 5h16v11H7l-3 3V5Z"/><path d="M8 9h8M8 12h5"/>', clear:'<path d="M4 4h16v16H4z"/><path d="m7 7 10 10M17 7 7 17"/>',
 smooth:'<path d="M3 17c4-8 7-8 10-3 2 3 4 3 8-2"/>', cinematic:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14"/>',
 mouse:'<rect x="7" y="2" width="10" height="20" rx="7"/><path d="M12 5v4"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 display:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>', hub:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>',
 dark:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>', sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 galaxy:'<path d="M12 2s1 4-1 6 2 4 4 2 4-5 4-5 2 7-2 10-9 4-11 0 0-8 3-10 3-3 3-3Z"/>', weather:'<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 20 11.5 3.5 3.5 0 0 1 19 18Z"/>',
 flashlight:'<path d="M9 2h6l2 6-2 14H9L7 8zM7 8h10"/>', hud:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h5M8 16h8"/>', font:'<path d="m6 19 6-14 6 14M8 15h8"/>',
 score:'<path d="M4 19V5M4 19h16"/><path d="M7 16v-4M11 16V8M15 16v-6M19 16v-9"/>', hurt:'<path d="M12 3v5M12 16v5M3 12h5M16 12h5"/><circle cx="12" cy="12" r="3"/>',
 armor:'<path d="M12 3 20 6v6c0 4.5-3.1 7.8-8 9-4.9-1.2-8-4.5-8-9V6z"/>', outline:'<rect x="5" y="5" width="14" height="14" rx="1"/><path d="M5 9h4M15 5v4M19 15h-4M9 19v-4"/>',
 nofog:'<path d="M4 8h16M3 12h18M5 16h14"/>', name:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 15-5 16 0"/>', particles:'<circle cx="6" cy="7" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="10" cy="14" r="1"/><circle cx="18" cy="15" r="1"/><circle cx="5" cy="19" r="1"/>', clouds:'<path d="M6 18a4 4 0 1 1 1-7.9A5 5 0 0 1 17 12a3 3 0 0 1 1 6Z"/>',
 position:'<path d="m12 4 4 4-4 4-4-4zM12 12l4 4-4 4-4-4z"/>', scale:'<path d="M6 3h12M6 21h12M9 3v18M15 3v18"/>', action:'<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 12h10"/>', chat:'<path d="M4 5h16v11H8l-4 3z"/><path d="M8 9h8M8 12h5"/>', badge:'<path d="M12 3 15 9l6 1-4.5 4.5L17 21l-5-3-5 3 1.5-6.5L4 10l6-1z"/>', bolt:'<path d="m13 2-9 12h7l-1 8 9-12h-7z"/>'
};

function register(id,name,category,iconKey,configurable,description,options){MC.modules.set(id,{id,name,category,icon:makeIcon(I[iconKey]||I.hud),configurable,description,options:options||(()=>""),enabled:!!cfg(id+".enabled",false)});}

function rangeOpt(p,l,min,max,step,suffix=""){const v=Number(cfg(p,min));return `<div class="setting-row"><label>${escapeHtml(l)}</label><div class="setting-inline"><input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-option="${p}"><span class="range-val" data-output="${p}">${v}${suffix}</span></div></div>`;}
function toggleOpt(p,l){const v=!!cfg(p,false);const id="mxopt-"+p.replace(/[^a-z0-9]/gi,"-");return `<div class="setting-row"><label>${escapeHtml(l)}</label><div class="opt-toggle"><input type="checkbox" id="${id}" data-option="${p}" ${v?"checked":""}><label for="${id}"></label></div></div>`;}
function colorOpt(p,l){return `<div class="setting-row"><label>${escapeHtml(l)}</label><input class="color-input" type="color" value="${escapeHtml(cfg(p,"#ffffff"))}" data-option="${p}"></div>`;}
function textOpt(p,l){return `<div class="setting-row"><label>${escapeHtml(l)}</label><input class="text-box" type="text" value="${escapeHtml(cfg(p,""))}" data-option="${p}"></div>`;}
function selectOpt(p,l,vals){const cur=cfg(p,vals[0]);return `<div class="setting-row"><label>${escapeHtml(l)}</label><select class="text-box" data-option="${p}">${vals.map(v=>`<option value="${escapeHtml(v)}" ${String(cur)===String(v)?"selected":""}>${escapeHtml(v)}</option>`).join("")}</select></div>`;}
function keyOpt(p,l){return `<div class="setting-row"><label>${escapeHtml(l)}</label><button class="keybind-box" data-bind-key="${p}">${escapeHtml(keyLabel(cfg(p,"KeyG")))}</button></div>`;}

register("zoom","Zoom","utilities","zoom",true,"Zoom the camera while holding a key.",()=>`${rangeOpt("zoom.factor","Distance",2,5,.1,"x")}${toggleOpt("zoom.smooth","Smoothness")}${toggleOpt("zoom.scrollable","Scrollable")}${keyOpt("zoom.keybind","Keybind")}`);
register("crosshair","Crosshair","visuals","cross",true,"Change your crosshair.",()=>`${textOpt("crosshair.image","Image URL")}${rangeOpt("crosshair.size","Size",8,128,1,"px")}${rangeOpt("crosshair.opacity","Opacity",.1,1,.05,"%")}${colorOpt("crosshair.color","Color")}${colorOpt("crosshair.outline","Outline")}`);
register("keystrokes","Keystrokes","hud","keyboard",true,"Movement and mouse HUD.",()=>`${toggleOpt("keystrokes.showLeftCPS","Show Left CPS")}${toggleOpt("keystrokes.showRightCPS","Show Right CPS")}${toggleOpt("keystrokes.pressAnimation","Press Animation")}${toggleOpt("keystrokes.rainbow","Rainbow")}${toggleOpt("keystrokes.border","Border")}${rangeOpt("keystrokes.scale","Scale",.5,2,.05,"x")}${rangeOpt("keystrokes.radius","Radius",0,12,1,"px")}${colorOpt("keystrokes.keyColor","Key Color")}${colorOpt("keystrokes.pressedColor","Pressed Color")}`);
register("directionhud","Direction HUD","hud","direction",true,"Compass HUD.",()=>rangeOpt("directionhud.scale","Scale",.5,1.7,.05,"x"));
register("autogg","Auto GG","utilities","heart",true,"Optional end-of-round helper.",()=>textOpt("autogg.message","Message"));
register("textures","Texture Pack","visuals","texture",true,"Original Matrix pack catalog and texture override adapters.",()=>`${selectOpt("textures.pack","Pack",["matrix","prime"])}${toggleOpt("textures.enabled","Enable overrides")}<div class="asset-grid"><div class="asset-card"><div class="asset-preview matrix-pack-preview"></div><strong>Matrix</strong><span>Original Matrix preview</span></div><div class="asset-card"><div class="asset-preview prime-pack-preview"></div><strong>PRIME</strong><span>Original PRIME preview</span></div></div>`);
register("hidearm","Hide Arm","visuals","position",false,"Hide exposed first-person arm layers.");
register("fps","FPS Counter","hud","fps",true,"Frames per second counter.",()=>rangeOpt("fps.scale","Scale",.5,2,.05,"x"));
register("cps","CPS Counter","hud","fps",true,"Clicks per second counter.",()=>`${rangeOpt("cps.scale","Scale",.5,2,.05,"x")}${toggleOpt("keystrokes.showLeftCPS","Left mouse CPS")}${toggleOpt("keystrokes.showRightCPS","Right mouse CPS")}`);
register("clearscreen","Clear Screen","utilities","clear",true,"Hide Matrix overlays with a key.",()=>keyOpt("clearscreen.keybind","Keybind"));
register("translator","Matrix Translation","utilities","translation",true,"Local translation controls.",()=>selectOpt("translator.language","Language",["en","pt","es","fr","de"]));
register("kdrindicator","K/D Indicator","hud","score",false,"Visible-score K/D helper.");
register("damagevignette","Damage Vignette","visuals","hurt",true,"Local damage flash.",()=>colorOpt("damagevignette.color","Color"));
register("armorhud","Armor HUD","hud","armor",false,"Armor/equipment HUD helper.");
register("blockoutline","Block Outline","visuals","outline",true,"Target block outline color.",()=>colorOpt("blockoutline.color","Color"));
register("nofog","No Fog","visuals","nofog",false,"WebGL fog uniform adapter.");
register("hidenametag","Hide Nametag","visuals","name",false,"Hide exposed nametag layers.");
register("hurtcam","Hurt Cam","visuals","hurt",true,"Damage camera strength.",()=>rangeOpt("hurtcam.strength","Strength",0,1,.05));
register("togglecrouch","Toggle Crouch","utilities","position",true,"Toggle crouch helper.",()=>keyOpt("togglecrouch.keybind","Keybind"));
register("hideparticles","Hide Particles","visuals","particles",false,"Hide exposed particle layers.");
register("hideclouds","Hide Clouds","visuals","clouds",false,"Hide exposed cloud layers.");
register("bedwarsnotif","BedWars Notifications","utilities","score",true,"Visible event notifications.",()=>`<div class="mod-description">Uses visible client text and event surfaces where available.</div>`);
register("armoffset","Arm Position","visuals","position",true,"First-person arm offset.",()=>rangeOpt("armoffset.y","Vertical Offset",-60,60,1,"px"));
register("scoreboard","Scoreboard","hud","score",false,"Scoreboard presentation helper.");
register("chatemojis","Chat Emojis","utilities","chat",false,"Local chat convenience helper.");
register("guiscale","GUI Scale","utilities","scale",true,"GUI scale helper.",()=>`${rangeOpt("guiscale.hotbar","Hotbar",50,150,1,"%")}${rangeOpt("guiscale.inventory","Inventory",50,150,1,"%")}`);
register("actionbar","Action Bar","hud","action",true,"Action bar helper.",()=>`<div class="mod-description">Custom Matrix action bar overlay.</div>`);
register("customui","Custom UI","utilities","settings",true,"Optional custom CSS.",()=>textOpt("customui.css","CSS"));
register("badges","Custom Badges","visuals","badge",true,"Matrix badge system. Profile alex-PRIME is included by default.",()=>`${textOpt("badges.localPlayer","Profile")}${selectOpt("badges.badge","Badge",["matrix","prime","owner","dev","mod"])}${toggleOpt("badges.autoChat","Chat badge matching")}${rangeOpt("badges.scale","Scale",.6,1.7,.05,"x")}`);
register("shaders","Shaders","visuals","shader",true,"Full-screen WebGL/Canvas shader presets.",()=>`${selectOpt("shaders.preset","Preset",["matrix","nebula","scanlines"])}${rangeOpt("shaders.opacity","Opacity",0,.6,.01)}${rangeOpt("shaders.intensity","Intensity",0,1,.05)}`);
register("performance","Performance Mode","utilities","bolt",false,"Disable optional observers and effects.");
register("smoothcamera","Smooth Camera","visuals","smooth",true,"Camera interpolation helper.",()=>rangeOpt("smoothcamera.strength","Strength",0,1,.05));
register("cinematicfx","Cinematic FX","visuals","cinematic",true,"Letterbox and vignette.",()=>rangeOpt("cinematicfx.opacity","Opacity",0,.5,.01));
register("mousetrail","Mouse Trail","visuals","mouse",true,"Local mouse trail.",()=>rangeOpt("mousetrail.opacity","Opacity",0,1,.05));
register("stopwatch","Stopwatch","utilities","clock",true,"Local stopwatch.",()=>`<div class="mod-description">The stopwatch runs locally and does not interact with the game.</div><button class="opt-btn" data-stopwatch-reset>Reset</button>`);
register("displayenhancer","Display Enhancer","visuals","display",true,"Local contrast overlay.",()=>rangeOpt("displayenhancer.level","Level",0,1,.05));
register("visualkeyboard","Visual Keyboard","hud","keyboard",true,"Alternative keyboard HUD.",()=>rangeOpt("keystrokes.scale","Scale",.5,2,.05,"x"));
register("hub","Matrix Hub","utilities","hub",true,"Local client dashboard.",()=>`<div class="hub-grid"><div><span>FPS</span><strong id="hub-fps">0</strong></div><div><span>Modules</span><strong>${MC.modules.size}</strong></div><div><span>Profile</span><strong>alex-PRIME</strong></div></div>`);
register("darkmode","Dark Mode","visuals","dark",false,"Matrix dark UI is always used.");
register("fullbright","Full Bright","visuals","sun",false,"Brightness helper when a safe surface is exposed.");
register("galaxy","Galaxy Mode","visuals","galaxy",false,"Cosmetic star overlay.");
register("weather","Weather FX","visuals","weather",true,"Cosmetic weather overlay.",()=>rangeOpt("weather.intensity","Intensity",0,1,.05));
register("screeneffects","Screen Effects","visuals","display",false,"Cosmetic screen effects.");
register("flashlight","Flashlight","visuals","flashlight",false,"Local flashlight overlay.");
register("gamehud","Game HUD","hud","hud",true,"Matrix HUD helpers.",()=>`<div class="mod-description">FPS, CPS and keystrokes are configured in their modules.</div>`);
register("fontmanager","Font Manager","visuals","font",true,"Safe browser font layer.",()=>`<div class="mod-description">Third-party binary fonts are not bundled automatically.</div>`);

const CSS=`
#__matrix_root{position:fixed;inset:0;width:100vw;height:100vh;z-index:999999;pointer-events:none}
#__matrix_root *{box-sizing:border-box;font-family:sans-serif!important;margin:0;padding:0}
#__matrix_root .matrix-menu[data-theme=dark]{--background-1:#181818;--background-2:#242424;--background-3:#282828;--background-4:#303030;--background-5:#393939;--border-1:#353535;--border-2:#424242;--primary-1:#517fe6;--white:#e6f1ff;--grey-1:#b6b6b6;--grey-2:#807f7f;--enabled:#23bd61;--enabled-hover:#2ca45c;--disabled:#a32444;--disabled-hover:#8f203b}
#__matrix_root .matrix-menu{pointer-events:all;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:43vw;height:55vh;min-width:650px;min-height:490px;max-width:920px;max-height:760px;background:var(--background-2);border:1px solid var(--border-1);border-radius:6px;overflow:hidden;color:#fff;box-shadow:0 0 1rem rgba(0,0,0,.5);display:none;flex-direction:column}
#__matrix_root .matrix-menu.open{display:flex}
#__matrix_root .header{height:6.5vh;min-height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;border-bottom:1px solid var(--border-1);background:var(--background-1);flex-shrink:0}
#__matrix_root .title{display:flex;align-items:center;color:var(--white);font-size:16px;font-weight:600}
#__matrix_root .tabs{display:flex;gap:8px}
#__matrix_root .tab{border:1.5px solid var(--border-1);border-radius:4px;background:transparent;color:var(--white);cursor:pointer;padding:4px 14px;font-size:13px}
#__matrix_root .tab.active{background:var(--background-3)}
#__matrix_root .close{width:28px;height:28px;border:1.5px solid var(--border-1);background:var(--background-3);color:var(--white);border-radius:5px;cursor:pointer;font-size:20px;line-height:1;display:flex;align-items:center;justify-content:center}
#__matrix_root .toolbar{padding:8px;flex-shrink:0}
#__matrix_root .search{width:245px;height:30px;background:var(--background-1);border:1px solid var(--border-1);border-radius:6px;display:flex;align-items:center;padding:0 10px;gap:7px}
#__matrix_root .search input{background:transparent;outline:0;border:0;color:var(--white);width:100%;font-size:12px}
#__matrix_root .mods{flex:1;padding:12px;display:grid;grid-template-columns:repeat(auto-fill,148px);gap:12px;justify-content:start;overflow:auto}
#__matrix_root .mods::-webkit-scrollbar{width:4px}#__matrix_root .mods::-webkit-scrollbar-thumb{background:var(--border-2);border-radius:2px}
#__matrix_root .card{width:148px;height:148px;background:var(--background-4);border:1.5px solid var(--border-2);border-radius:8px;display:flex;flex-direction:column;align-items:center;overflow:hidden}
#__matrix_root .card-icon{width:28px;height:28px;color:var(--grey-2);margin-top:18px;flex-shrink:0}.card .name{margin-top:10px;color:var(--grey-1);font-size:13px;text-align:center;line-height:1.2;padding:0 7px;min-height:31px}
#__matrix_root .card-btn{width:100%;margin-top:auto;display:flex;flex-direction:column}.options,.toggle-btn{display:block;width:100%;margin:0}
#__matrix_root .options{height:26px;border:0;border-top:1px solid var(--border-2);border-bottom:1px solid var(--border-2);background:var(--background-5);color:var(--white);cursor:pointer;font-size:12px}
#__matrix_root .toggle-btn{height:30px;border:0;background:var(--disabled);color:var(--white);font-weight:600;font-size:12px;cursor:pointer;border-bottom-left-radius:7px;border-bottom-right-radius:7px}.card.enabled .toggle-btn{background:var(--enabled)}
#__matrix_root .options-panel{position:absolute;inset:0;background:var(--background-2);display:none;flex-direction:column;z-index:40}.options-panel.open{display:flex}
#__matrix_root .options-header{height:6.5vh;min-height:54px;display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid var(--border-1);background:var(--background-1);flex-shrink:0}.options-header span{font-size:14px;font-weight:600;color:var(--white)}
#__matrix_root .options-back{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:var(--background-3);border:1.5px solid var(--border-1);color:var(--white);border-radius:5px;cursor:pointer;font-size:20px}
#__matrix_root .options-body{flex:1;padding:14px;display:flex;flex-direction:column;gap:12px;overflow:auto}.setting-row{display:flex;flex-direction:row;justify-content:space-between;align-items:center;gap:12px;min-height:32px}.setting-row label{font-size:12px;color:var(--grey-2);text-transform:uppercase}.setting-inline{display:flex;align-items:center;gap:10px;width:52%}.setting-inline input{flex:1}.range-val{min-width:45px;text-align:right;font-size:13px;color:var(--primary-1)}
#__matrix_root .keybind-box,.text-box,.color-input{background:var(--background-1);border:1px solid var(--border-1);border-radius:5px;padding:7px 12px;color:var(--white);font-size:12px;outline:0;text-align:center}.keybind-box{cursor:pointer}.keybind-box.waiting{border-color:var(--primary-1)}.text-box{width:42%;cursor:text}.color-input{width:72px;padding:2px}
#__matrix_root .opt-toggle{position:relative;width:44px;height:22px}.opt-toggle input{display:none}.opt-toggle label{position:absolute;inset:0;background:var(--background-1);border:1px solid var(--border-1);border-radius:11px;cursor:pointer}.opt-toggle input:checked+label{background:var(--primary-1)}.opt-toggle label:after{content:"";position:absolute;top:2px;left:3px;width:16px;height:16px;background:var(--white);border-radius:50%;transition:left .2s}.opt-toggle input:checked+label:after{left:25px}
#__matrix_root .mod-description{font-size:12px;color:var(--grey-2);line-height:1.5;padding:3px 0}.asset-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.asset-card{border:1px solid var(--border-1);background:var(--background-3);border-radius:8px;padding:8px}.asset-preview{height:82px;border-radius:6px;margin-bottom:8px;border:1px solid var(--border-2);overflow:hidden}.matrix-pack-preview{background:linear-gradient(135deg,#171126,#5b2bb1 45%,#178e94)}.prime-pack-preview{background:linear-gradient(135deg,#05121d,#0588c8 55%,#081822)}.asset-card strong{font-size:11px;color:var(--white)}.asset-card span{display:block;color:var(--grey-2);font-size:9px;margin-top:3px}
#__matrix_root .settings-panel{display:none;flex-direction:column;gap:12px;padding:14px;overflow:auto;flex:1}.settings-card{border:1px solid var(--border-1);background:var(--background-3);border-radius:8px;padding:12px}.settings-card h3{font-size:13px;color:var(--white);margin-bottom:6px}.settings-card p{font-size:10px;color:var(--grey-2);margin-bottom:10px}
#__matrix_root .mmmd-panel{padding:14px;overflow:auto;flex:1}.mmmd-hero{padding:18px;border:1px solid #517fe644;border-radius:12px;background:linear-gradient(135deg,#517fe61a,#141423);margin-bottom:14px}.mmmd-title{font-size:26px;font-weight:900;letter-spacing:4px}.mmmd-subtitle{font-size:12px;color:var(--grey-2);margin-top:6px}.mmmd-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mmmd-stat{padding:12px;border:1px solid var(--border-1);border-radius:10px;background:var(--background-3)}.mmmd-stat span{display:block;font-size:10px;color:var(--grey-2)}.mmmd-stat strong{display:block;margin-top:4px;font-size:15px;color:var(--white)}.mmmd-note{margin-top:10px;font-size:10px;color:var(--grey-2);padding:10px;border:1px dashed var(--border-1);border-radius:8px}
#__matrix_root #mx-hud{position:fixed;inset:0;pointer-events:none;z-index:1000}.mx-hud-box{position:fixed;padding:5px 8px;border:1px solid #fff2;border-radius:5px;background:#000a;color:#fff;font:11px monospace}.mx-keyboard{position:fixed;display:grid;grid-template-columns:repeat(3,42px);gap:4px;z-index:1001;pointer-events:none}.mx-key{height:34px;display:flex;align-items:center;justify-content:center;border-radius:5px;background:#000b;border:1px solid #fff2;color:#fff;font-size:10px}.mx-key.down{background:#517fe6;transform:scale(.94)}
#__matrix_root #mx-crosshair{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:1002}#__matrix_root #mx-badge{position:fixed;z-index:1003;pointer-events:none;padding:4px 8px;border-radius:5px;background:linear-gradient(135deg,#4b21a8,#9b63ff);color:#fff;font:800 9px Arial;letter-spacing:.08em;box-shadow:0 0 10px #517fe633}#__matrix_root #mx-direction{position:fixed;left:50%;top:16px;transform:translateX(-50%);padding:5px 9px;border-radius:5px;background:#000a;border:1px solid #fff2;color:#fff;font:10px monospace;z-index:1001}
#__matrix_root #mx-shader{position:fixed;inset:0;width:100%;height:100%;opacity:0;z-index:998;pointer-events:none}.matrix-chat-badge{display:inline-flex!important;align-items:center;margin-left:5px;padding:1px 5px;border-radius:4px;background:#5c2cb2;color:#fff!important;font:700 9px Arial!important;vertical-align:middle;letter-spacing:.04em}
#__matrix_root .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);padding:7px 11px;border:1px solid #fff2;border-radius:6px;background:#111d;color:#fff;font:10px Arial;opacity:0;transition:.16s;z-index:2000;pointer-events:none}.toast.show{opacity:1}
#__matrix_root .hub-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.hub-grid div{padding:12px;border:1px solid var(--border-1);border-radius:8px;background:var(--background-3)}.hub-grid span{display:block;color:var(--grey-2);font-size:10px}.hub-grid strong{display:block;color:var(--white);font-size:16px;margin-top:4px}
@media(max-width:900px){#__matrix_root .matrix-menu{width:92vw;min-width:0;height:76vh}}
`;

function installCss(){if(!document.getElementById("matrix-client-css")){const s=document.createElement("style");s.id="matrix-client-css";s.textContent=CSS;(document.head||document.documentElement).appendChild(s);}}

function ensureRoot(){
 if(MC.root)return;
 MC.root=document.createElement("div");MC.root.id="__matrix_root";
 MC.root.innerHTML=`<div class="matrix-menu" id="matrix-menu" data-theme="dark">
  <div class="header"><div class="title"><span>Matrix Client</span></div><div class="tabs"><button class="tab active" data-tab="mods">Mods</button><button class="tab" data-tab="settings">Settings</button><button class="tab" data-tab="mmmd">MMMD</button></div><button class="close" id="matrix-close">×</button></div>
  <div class="toolbar" id="matrix-toolbar"><div class="search"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="matrix-search" placeholder="Search..."></div></div>
  <div class="mods" id="matrix-mods-panel"></div>
  <div class="settings-panel" id="matrix-settings-panel"></div>
  <div class="mmmd-panel" id="matrix-mmmd-panel" style="display:none"><div class="mmmd-hero"><div class="mmmd-title">MMMD</div><div class="mmmd-subtitle">Matrix Multi-Module Dashboard</div></div><div class="mmmd-stat-grid"><div class="mmmd-stat"><span>Profile</span><strong id="mmmd-profile">alex-PRIME</strong></div><div class="mmmd-stat"><span>Badge</span><strong id="mmmd-badge">MATRIX</strong></div><div class="mmmd-stat"><span>FPS</span><strong id="mmmd-fps">0</strong></div><div class="mmmd-stat"><span>Modules</span><strong>${MC.modules.size}</strong></div></div><div class="mmmd-note">Matrix Client 2.0 browser edition. URL selection is intentionally absent because Tampermonkey runs on MineFun and Sandbox directly.</div></div>
  <div class="options-panel" id="matrix-options-panel"><div class="options-header"><button class="options-back" id="matrix-options-back">﹤</button><span id="matrix-options-title">Options</span></div><div class="options-body" id="matrix-options-body"></div></div>
 </div>
 <div id="mx-hud"></div><div class="mx-keyboard" id="mx-keyboard"></div><div id="mx-crosshair"></div><div id="mx-direction"></div><div id="mx-badge"></div><canvas id="mx-shader"></canvas><div class="toast" id="mx-toast"></div>`;
 document.documentElement.appendChild(MC.root);MC.menu=MC.root.querySelector("#matrix-menu");
}

function renderCards(){
 const p=MC.root.querySelector("#matrix-mods-panel");const q=MC.search.toLowerCase().trim();
 const list=[...MC.modules.values()].filter(m=>!q||m.name.toLowerCase().includes(q)||m.category.includes(q)||m.description.toLowerCase().includes(q));
 p.innerHTML=list.map(m=>`<div class="card ${m.enabled?"enabled":""}" data-mod="${m.id}">${m.icon}<div class="name">${escapeHtml(m.name)}</div><div class="card-btn">${m.configurable?`<button class="options" data-options="${m.id}">Options</button>`:""}<button class="toggle-btn" data-toggle="${m.id}">${m.enabled?"Enabled":"Disabled"}</button></div></div>`).join("");
 p.querySelectorAll("[data-toggle]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();const m=MC.modules.get(b.dataset.toggle);if(!m)return;m.enabled=!m.enabled;cfgSet(m.id+".enabled",m.enabled);renderCards();}));
 p.querySelectorAll("[data-options]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();openOptions(b.dataset.options);}));
}

function renderSettings(){
 const p=MC.root.querySelector("#matrix-settings-panel");
 p.innerHTML=`<div class="settings-card"><h3>Client</h3><p>Matrix menu controls. The URL section is removed for the Tampermonkey edition.</p>${toggleOpt("client.compact","Compact")}${keyOpt("client.menuKey","Menu Keybind")}</div>
 <div class="settings-card"><h3>Profile & Badge</h3><p>Matrix badge profile.</p>${textOpt("badges.localPlayer","Profile")}${selectOpt("badges.badge","Badge",["matrix","prime","owner","dev","mod"])}${toggleOpt("badges.autoChat","Match badge in chat")}</div>
 <div class="settings-card"><h3>Performance</h3><p>Reduce optional Matrix effects and observers.</p>${toggleOpt("performance.enabled","Performance Mode")}</div>`;
 bindOptions(p);
}

function setTab(tab){MC.tab=tab;MC.root.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));MC.root.querySelector("#matrix-toolbar").style.display=tab==="mods"?"block":"none";MC.root.querySelector("#matrix-mods-panel").style.display=tab==="mods"?"grid":"none";MC.root.querySelector("#matrix-settings-panel").style.display=tab==="settings"?"flex":"none";MC.root.querySelector("#matrix-mmmd-panel").style.display=tab==="mmmd"?"block":"none";closeOptions();if(tab==="mods")renderCards();if(tab==="settings")renderSettings();if(tab==="mmmd")updateMMMD();}
function openMenu(v){MC.open=typeof v==="boolean"?v:!MC.open;MC.menu.classList.toggle("open",MC.open);if(MC.open)setTab(MC.tab);}
function openOptions(id){const m=MC.modules.get(id);if(!m)return;MC.options=id;const panel=MC.root.querySelector("#matrix-options-panel");MC.root.querySelector("#matrix-options-title").textContent=m.name+" Options";MC.root.querySelector("#matrix-options-body").innerHTML=m.options(m);panel.classList.add("open");bindOptions(panel);}
function closeOptions(){MC.options=null;MC.root.querySelector("#matrix-options-panel")?.classList.remove("open");}
function bindOptions(container){
 container.querySelectorAll("[data-option]").forEach(el=>{const path=el.dataset.option;const event=el.type==="checkbox"||el.tagName==="SELECT"?"change":"input";el.addEventListener(event,()=>{const v=el.type==="checkbox"?el.checked:el.type==="range"?Number(el.value):el.value;cfgSet(path,v);const out=container.querySelector(`[data-output="${CSS.escape(path)}"]`);if(out){if(path.includes("opacity"))out.textContent=Math.round(v*100)+"%";else if(path.includes("scale")||path==="zoom.factor")out.textContent=Number(v).toFixed(2)+"x";else out.textContent=String(v);}});});
 container.querySelectorAll("[data-bind-key]").forEach(el=>el.addEventListener("click",()=>{MC.bindPath=el.dataset.bindKey;el.classList.add("waiting");el.textContent="Press key...";}));
 const reset=container.querySelector("[data-stopwatch-reset]");if(reset)reset.addEventListener("click",()=>{Stopwatch.started=0;Stopwatch.elapsed=0;showToast("Stopwatch reset");});
}

function inputHooks(){
 addEventListener("keydown",e=>{
  if(MC.bindPath){if(isTyping(e.target))return;const path=MC.bindPath;MC.bindPath=null;cfgSet(path,e.code);const b=MC.root.querySelector(".keybind-box.waiting");if(b){b.classList.remove("waiting");b.textContent=keyLabel(e.code);}e.preventDefault();e.stopPropagation();return;}
  MC.keys[e.code]=true;
  if(isTyping(e.target))return;
  if(e.code===cfg("client.menuKey","KeyG")&&!e.repeat){openMenu();e.preventDefault();e.stopPropagation();return;}
  if(getEnabled("clearscreen")&&e.code===cfg("clearscreen.keybind","KeyH")&&!e.repeat){const h=MC.root.querySelector("#mx-hud"),k=MC.root.querySelector("#mx-keyboard"),c=MC.root.querySelector("#mx-crosshair"),d=MC.root.querySelector("#mx-direction"),b=MC.root.querySelector("#mx-badge");const hidden=h.dataset.hidden==="1"?false:true;[h,k,c,d,b].forEach(x=>x.style.visibility=hidden?"hidden":"visible");h.dataset.hidden=hidden?"1":"0";}
 },true);
 addEventListener("keyup",e=>{MC.keys[e.code]=false;},true);
 addEventListener("mousedown",e=>{const t=Date.now();if(e.button===0){MC.stats.lmb.push(t);MC.keys.MouseLeft=true;}if(e.button===2){MC.stats.rmb.push(t);MC.keys.MouseRight=true;}},true);
 addEventListener("mouseup",e=>{if(e.button===0)MC.keys.MouseLeft=false;if(e.button===2)MC.keys.MouseRight=false;},true);
 MC.root.querySelector("#matrix-close").addEventListener("click",()=>openMenu(false));
 MC.root.querySelector("#matrix-options-back").addEventListener("click",closeOptions);
 MC.root.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
 MC.root.querySelector("#matrix-search").addEventListener("input",e=>{MC.search=e.target.value;renderCards();});
}

function getEnabled(id){return!!MC.modules.get(id)?.enabled;}
function showToast(t){const el=MC.root.querySelector("#mx-toast");el.textContent=t;el.classList.add("show");clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("show"),1400);}

function applyFPS(){const now=Date.now();MC.stats.lmb=MC.stats.lmb.filter(t=>now-t<1000);MC.stats.rmb=MC.stats.rmb.filter(t=>now-t<1000);MC.stats.cpsL=MC.stats.lmb.length;MC.stats.cpsR=MC.stats.rmb.length;const h=MC.root.querySelector("#mx-hud");let html="";if(getEnabled("fps"))html+=`<div class="mx-hud-box" style="left:${cfg("fps.x",20)}px;top:${cfg("fps.y",20)}px;transform:scale(${cfg("fps.scale",1)})">FPS ${MC.stats.fps}</div>`;if(getEnabled("cps"))html+=`<div class="mx-hud-box" style="left:${cfg("cps.x",20)}px;top:${cfg("cps.y",50)}px;transform:scale(${cfg("cps.scale",1)})">CPS ${MC.stats.cpsL}</div>`;h.innerHTML=html;const hub=MC.root.querySelector("#hub-fps");if(hub)hub.textContent=MC.stats.fps;}
function applyKeys(){const el=MC.root.querySelector("#mx-keyboard");if(!getEnabled("keystrokes")){el.style.display="none";return;}el.style.display="grid";el.style.left=cfg("keystrokes.x",20)+"px";el.style.top=cfg("keystrokes.y",190)+"px";el.style.transform=`scale(${cfg("keystrokes.scale",1)})`;const down=k=>MC.keys[k]?"down":"";el.innerHTML=`<div></div><div class="mx-key ${down("KeyW")}">W</div><div></div><div class="mx-key ${down("KeyA")}">A</div><div class="mx-key ${down("KeyS")}">S</div><div class="mx-key ${down("KeyD")}">D</div><div class="mx-key ${down("Space")}">SPACE</div><div class="mx-key ${down("MouseLeft")}">LMB${cfg("keystrokes.showLeftCPS",false)?` ${MC.stats.cpsL}`:""}</div><div class="mx-key ${down("MouseRight")}">RMB${cfg("keystrokes.showRightCPS",false)?` ${MC.stats.cpsR}`:""}</div>`;}
function applyCrosshair(){const host=MC.root.querySelector("#mx-crosshair");if(!cfg("crosshair.enabled",false)){host.style.display="none";return;}host.style.display="block";const size=cfg("crosshair.size",32),op=cfg("crosshair.opacity",1),url=cfg("crosshair.image","");if(url){host.innerHTML=`<img src="${esc(url)}" style="width:${size}px;height:${size}px;opacity:${op};object-fit:contain;image-rendering:pixelated">`;return;}const t=cfg("crosshair.thickness",2),c=esc(cfg("crosshair.color","#fff")),o=esc(cfg("crosshair.outline","#000"));host.innerHTML=`<svg width="${size}" height="${size}" viewBox="0 0 100 100"><g stroke="${o}" stroke-width="${t+2}" opacity="${op}" stroke-linecap="round"><path d="M50 8V44M50 56V92M8 50H44M56 50H92"/></g><g stroke="${c}" stroke-width="${t}" opacity="${op}" stroke-linecap="round"><path d="M50 8V44M50 56V92M8 50H44M56 50H92"/></g></svg>`;}
function applyDirection(){let d=MC.root.querySelector("#mx-direction");if(!getEnabled("directionhud")){d.style.display="none";return;}d.style.display="block";d.style.transform=`translateX(-50%) scale(${cfg("directionhud.scale",1)})`;d.textContent="N  •  NE  •  E  •  SE  •  S  •  SW  •  W  •  NW";}
function applyBadge(){const b=MC.root.querySelector("#mx-badge");if(!cfg("badges.enabled",true)){b.style.display="none";return;}b.style.display="block";b.style.left=cfg("badges.x",20)+"px";b.style.top=cfg("badges.y",80)+"px";b.style.transform=`scale(${cfg("badges.scale",1)})`;b.textContent=String(cfg("badges.badge","matrix")).toUpperCase();}

function applyShader(){const c=MC.root.querySelector("#mx-shader");if(!getEnabled("shaders")||cfg("performance.enabled",false)){c.style.opacity="0";return;}c.style.opacity=String(cfg("shaders.opacity",.2));c.width=innerWidth;c.height=innerHeight;const gl=c.getContext("webgl",{alpha:true,antialias:false});if(!gl){const ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle=`rgba(110,190,255,${.03*cfg("shaders.intensity",.6)})`;for(let y=0;y<c.height;y+=5)ctx.fillRect(0,y,c.width,1);return;}if(!MC.shaderGL){MC.shaderGL=makeShader(gl);}
 if(!MC.shaderGL)return;const t=performance.now()/1000;gl.viewport(0,0,c.width,c.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(MC.shaderGL.program);gl.uniform1f(MC.shaderGL.time,t);gl.uniform1f(MC.shaderGL.intensity,cfg("shaders.intensity",.6));gl.drawArrays(gl.TRIANGLES,0,6);}
function makeShader(gl){const vs=`attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}`;const fs=`precision mediump float;uniform float u;uniform float i;void main(){vec2 p=gl_FragCoord.xy/vec2(${innerWidth.toFixed(1)},${innerHeight.toFixed(1)});float x=0.0;if(${JSON.stringify(cfg("shaders.preset","matrix"))}=="matrix")x=sin((p.y+u*.07)*100.0)*.5+.5;else if(${JSON.stringify(cfg("shaders.preset","matrix"))}=="nebula")x=1.0-length(p-.5);else x=sin(p.y*800.0)*.5+.5;vec3 c=vec3(.15,.85,.50)*x*i;gl_FragColor=vec4(c,.18*i);}`;function compile(t,s){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return gl.getShaderParameter(sh,gl.COMPILE_STATUS)?sh:null;}const a=compile(gl.VERTEX_SHADER,vs),b=compile(gl.FRAGMENT_SHADER,fs);if(!a||!b)return null;const p=gl.createProgram();gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(p,"a");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);return{program:p,time:gl.getUniformLocation(p,"u"),intensity:gl.getUniformLocation(p,"i")};}

function patchWebGL(){
 if(MX.glPatched)return;MC.glPatched=true;
 const oldGet=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(type,attrs){const gl=oldGet.call(this,type,attrs);if(gl&&(type==="webgl"||type==="webgl2")&&this.id==="game"){patchGL(gl);}return gl;};
 function patchGL(gl){if(gl.__matrixPatched)return;gl.__matrixPatched=true;const origU=gl.uniformMatrix4fv.bind(gl),orig1=gl.uniform1f.bind(gl),orig1v=gl.uniform1fv.bind(gl),origLoc=gl.getUniformLocation.bind(gl);const names=new Map();gl.getUniformLocation=function(program,name){const loc=origLoc(program,name);if(loc)names.set(loc,String(name));return loc;};gl.uniform1f=function(loc,v){if(getEnabled("nofog")&&loc){const n=(names.get(loc)||"").toLowerCase();if(n.includes("fog"))return orig1(loc,n.includes("density")?0:(n.includes("near")?999999:999999),v);}return orig1(loc,v);};gl.uniform1fv=function(loc,v){if(getEnabled("nofog")&&loc){const n=(names.get(loc)||"").toLowerCase();if(n.includes("fog"))return orig1v(loc,new Float32Array(v.length));}return orig1v(loc,v);};let current=null;gl.useProgram=function(p){current=p;return gl.__proto__.useProgram.call(gl,p);};};
}

function hideLayers(){const sel=[];if(getEnabled("hideclouds"))sel.push("[class*=cloud],[id*=cloud]");if(getEnabled("hideparticles"))sel.push("[class*=particle],[id*=particle]");if(getEnabled("hidenametag"))sel.push("[class*=nametag],[id*=nametag]");if(sel.length){try{document.querySelectorAll(sel.join(",")).forEach(x=>x.style.setProperty("display","none","important"));}catch{}}}

function badgeChat(){if(!cfg("badges.autoChat",true))return;const aliases=[String(cfg("badges.localPlayer","alex-PRIME")),"alex-PRIME","alex-prime"];const nodes=document.querySelectorAll("[class*=chat] [class*=message], [class*=chat] [class*=msg], .chat-message, .message");nodes.forEach(n=>{if(n.closest("#__matrix_root"))return;if(n.dataset.matrixBadge)return;const txt=n.textContent||"";const match=aliases.find(a=>txt.toLowerCase().includes(a.toLowerCase()));if(!match)return;const b=document.createElement("span");b.className="matrix-chat-badge";b.textContent="◆ MATRIX";b.title="Matrix badge";n.appendChild(b);n.dataset.matrixBadge="1";});}

function patchTextureImages(){if(!getEnabled("textures")||!cfg("textures.enabled",false))return;const pack=cfg("textures.pack","matrix");const rules={};if(pack==="matrix"){rules["grass"]=`${MC.assets}textures/matrix-preview.svg`;rules["stone"]=`${MC.assets}textures/matrix-preview.svg`;}if(pack==="prime"){rules["grass"]=`${MC.assets}textures/prime-preview.svg`;}
document.querySelectorAll("img[src]").forEach(img=>{for(const k in rules){if(img.src.toLowerCase().includes(k)&&img.src!==rules[k]){img.src=rules[k];break;}}});}

const Stopwatch={started:0,elapsed:0};
function stopwatchTick(){if(!getEnabled("stopwatch"))return; if(!Stopwatch.started)Stopwatch.started=Date.now();Stopwatch.elapsed=Date.now()-Stopwatch.started;}
function applySpecialVisuals(){
 const overlay=MC.root.querySelector("#mx-overlay");if(!overlay)return;
 overlay.style.filter="";
 if(getEnabled("displayenhancer"))overlay.style.filter=`contrast(${1+Number(cfg("displayenhancer.level",.3))*.12}) saturate(${1+Number(cfg("displayenhancer.level",.3))*.12})`;
 if(getEnabled("cinematicfx")){overlay.style.boxShadow="inset 0 8vh 0 #0006,inset 0 -8vh 0 #0006";}else{overlay.style.boxShadow="";}
}
function applyAll(){applyFPS();applyKeys();applyCrosshair();applyDirection();applyBadge();applyShader();hideLayers();badgeChat();patchTextureImages();applySpecialVisuals();}
function updateMMMD(){MC.root.querySelector("#mmmd-profile").textContent=cfg("badges.localPlayer","alex-PRIME");MC.root.querySelector("#mmmd-badge").textContent=String(cfg("badges.badge","matrix")).toUpperCase();MC.root.querySelector("#mmmd-fps").textContent=MC.stats.fps;}

function boot(){
 if(window.__MATRIX_CLIENT_26)return;window.__MATRIX_CLIENT_26=true;
 ensureRoot();installCss();renderCards();renderSettings();
 MC.root.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>{setTab(t.dataset.tab);}));
 MC.root.querySelector("#matrix-close").addEventListener("click",()=>openMenu(false));
 MC.root.querySelector("#matrix-options-back").addEventListener("click",closeOptions);
 MC.root.querySelector("#matrix-search").addEventListener("input",e=>{MC.search=e.target.value;renderCards();});
 inputHooks();patchWebGL();
 const mo=new MutationObserver(()=>{badgeChat();hideLayers();});mo.observe(document.documentElement,{childList:true,subtree:true});MC.observers.push(mo);
 setInterval(()=>{applyAll();stopwatchTick();updateMMMD();},500);
 requestAnimationFrame(function loop(now){MC.stats.frames++;if(now-MC.stats.last>=1000){MC.stats.fps=MC.stats.frames;MC.stats.frames=0;MC.stats.last=now;}applyKeys();applyDirection();applyBadge();applyShader();requestAnimationFrame(loop);});
 showToast("Matrix Client loaded");
}

function setTab(tab){MC.tab=tab;MC.root.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));MC.root.querySelector("#matrix-toolbar").style.display=tab==="mods"?"block":"none";MC.root.querySelector("#matrix-mods-panel").style.display=tab==="mods"?"grid":"none";MC.root.querySelector("#matrix-settings-panel").style.display=tab==="settings"?"flex":"none";MC.root.querySelector("#matrix-mmmd-panel").style.display=tab==="mmmd"?"block":"none";closeOptions();if(tab==="mods")renderCards();if(tab==="settings")renderSettings();if(tab==="mmmd")updateMMMD();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
window.MatrixClient={open:()=>openMenu(true),close:()=>openMenu(false),toggle:()=>openMenu(),version:MX.version,profile:"alex-PRIME"};
})();
