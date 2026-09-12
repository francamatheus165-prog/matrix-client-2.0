(() => {
  "use strict";
  const VERSION = "2.0.0";
  const STORE = "matrix2";
  const defaults = {
    crosshair: true,
    showFps: true,
    showCps: true,
    showKeystrokes: true,
    zoom: 100,
    noFog: false,
    hideClouds: false,
    hideParticles: false,
    hideNametags: false,
    toggleCrouch: false,
    autoGG: false,
    performanceMode: false,
    menuKey: "Insert"
  };
  const state = Object.assign({}, defaults, GM_getValue(STORE, {}));
  const save = () => GM_setValue(STORE, state);
  GM_addStyle(`
    #matrix-root{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:Arial,sans-serif;color:#fff}
    #matrix-menu{position:fixed;right:18px;top:70px;width:310px;max-height:calc(100vh - 100px);overflow:auto;padding:14px;border:1px solid #7e3eea;border-radius:14px;background:rgba(13,10,24,.94);box-shadow:0 14px 50px rgba(0,0,0,.5);backdrop-filter:blur(12px);pointer-events:auto;display:none}
    #matrix-menu.open{display:block} #matrix-menu h2{margin:0 0 4px;font-size:18px}
    #matrix-menu .sub{opacity:.65;font-size:11px;margin-bottom:12px}.row{display:flex;align-items:center;gap:8px;padding:5px 0}
    #matrix-menu .title{font-size:11px;text-transform:uppercase;opacity:.55;margin-top:10px}
    .toggle,.action{width:100%;color:#fff;border-radius:9px;padding:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);cursor:pointer;text-align:left}
    .toggle.on{border-color:#9b62ff;background:rgba(126,62,218,.28)} .action{border:0;background:#7136d8;text-align:center;margin-top:6px}
    #matrix-hud{position:fixed;left:12px;top:12px;padding:7px 9px;border-radius:8px;background:rgba(8,8,15,.55);font:12px monospace;pointer-events:none}
    #matrix-crosshair{position:fixed;left:50%;top:50%;width:14px;height:14px;margin:-7px;pointer-events:none}
    #matrix-crosshair:before,#matrix-crosshair:after{content:"";position:absolute;background:#fff}
    #matrix-crosshair:before{width:2px;height:14px;left:6px}#matrix-crosshair:after{height:2px;width:14px;top:6px}
    #matrix-keys{position:fixed;right:12px;bottom:12px;display:grid;grid-template-columns:repeat(3,31px);gap:4px}
    #matrix-keys span{width:31px;height:27px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:rgba(10,10,16,.62);border:1px solid rgba(255,255,255,.1);font:11px monospace}
    #matrix-keys .empty{visibility:hidden}.down{background:rgba(132,65,230,.45)!important}
  `);
  let open = false, clicks = 0, cps = 0, fps = 0, frames = 0, lastF = performance.now(), lastC = Math.floor(Date.now()/1000);

  function build() {
    if (document.getElementById("matrix-root")) return;
    const root = document.createElement("div");
    root.id = "matrix-root";
    const entries = ["crosshair","showFps","showCps","showKeystrokes","noFog","hideClouds","hideParticles","hideNametags","toggleCrouch","autoGG","performanceMode"];
    const labels = {crosshair:"Crosshair",showFps:"FPS counter",showCps:"CPS counter",showKeystrokes:"Keystrokes",noFog:"No fog",hideClouds:"Hide clouds",hideParticles:"Hide particles",hideNametags:"Hide nametags",toggleCrouch:"Toggle crouch",autoGG:"Auto GG",performanceMode:"Performance mode"};
    root.innerHTML = `<div id="matrix-menu"><h2>Matrix Client</h2><div class="sub">MathPRIME Edition • v${VERSION}</div><div class="title">Features</div>${entries.map(k=>`<div class="row"><button class="toggle" data-k="${k}">${labels[k]}</button></div>`).join("")}<div class="row"><label>Zoom <input id="matrix-zoom" type="range" min="50" max="160" step="5"></label></div><button class="action" id="matrix-reset">Reset settings</button><button class="action" id="matrix-close">Close menu</button></div><div id="matrix-hud"></div><div id="matrix-crosshair"></div><div id="matrix-keys"><span class="empty">.</span><span data-c="KeyW">W</span><span class="empty">.</span><span data-c="KeyA">A</span><span data-c="KeyS">S</span><span data-c="KeyD">D</span></div>`;
    document.documentElement.appendChild(root);
    root.querySelectorAll(".toggle").forEach(b=>b.onclick=()=>{state[b.dataset.k]=!state[b.dataset.k];save();render();});
    root.querySelector("#matrix-zoom").oninput=e=>{state.zoom=+e.target.value;save();apply();};
    root.querySelector("#matrix-reset").onclick=()=>{Object.assign(state,defaults);save();render();};
    root.querySelector("#matrix-close").onclick=()=>toggle(false);
    render();
  }
  function render(){
    const m=document.getElementById("matrix-menu"); if(!m) return;
    m.classList.toggle("open",open);
    document.querySelectorAll(".toggle").forEach(b=>b.classList.toggle("on",!!state[b.dataset.k]));
    const z=document.getElementById("matrix-zoom"); if(z) z.value=state.zoom;
    const c=document.getElementById("matrix-crosshair"); if(c) c.style.display=state.crosshair?"block":"none";
    const k=document.getElementById("matrix-keys"); if(k) k.style.display=state.showKeystrokes?"grid":"none";
    apply();
  }
  function toggle(v){open=typeof v==="boolean"?v:!open;render();}
  function apply(){
    const canvas=document.querySelector("canvas");
    if(canvas){const z=Math.max(.5,Math.min(1.6,state.zoom/100));canvas.style.transform=z===1?"":`scale(${1/z})`;canvas.style.transformOrigin="center center";}
    const h=document.getElementById("matrix-hud");
    if(h){h.textContent=[state.showFps?`FPS ${fps}`:"",state.showCps?`CPS ${cps}`:""].filter(Boolean).join(" • ");h.style.display=h.textContent?"block":"none";}
  }
  window.addEventListener("keydown",e=>{
    if(e.code===state.menuKey&&!e.repeat){toggle();e.preventDefault();return;}
    const x=document.querySelector(`#matrix-keys [data-c="${e.code}"]`);if(x)x.classList.add("down");
  },true);
  window.addEventListener("keyup",e=>{const x=document.querySelector(`#matrix-keys [data-c="${e.code}"]`);if(x)x.classList.remove("down");},true);
  window.addEventListener("mousedown",()=>clicks++,true);
  function loop(t){
    frames++;
    if(t-lastF>=1000){fps=frames;frames=0;lastF=t;const s=Math.floor(Date.now()/1000);if(s!==lastC){cps=clicks;clicks=0;lastC=s;}apply();}
    requestAnimationFrame(loop);
  }
  function start(){
    build(); requestAnimationFrame(loop);
    new MutationObserver(()=>{build();apply();}).observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
