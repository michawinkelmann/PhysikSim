const STAGE = { w:1000, h:600 };
const NS = "http://www.w3.org/2000/svg";

const clamp = (v,a,b)=>Math.max(a, Math.min(b,v));
const dist = (a,b)=>Math.hypot(a.x-b.x, a.y-b.y);

const state = {
  meta: {
    title: "Magnetwirkung sichtbar machen",
    steps: ["Ein Magnet", "Feldwirkung", "Wechselwirkung", "Merksatz"],
    stepIndex: 0
  },
  objects: [],
  dragging: null,
  answers: {},
  showSecond: false,
  tasksByStep: [
    [
      { id:"s1a", type:"text", prompt:"Beschreibe: Wo siehst du viele ausgerichtete Eisenspäne?", placeholder:"Viele Späne sehe ich …" },
      { id:"s1b", type:"mcq", prompt:"Wo ist die magnetische Wirkung am stärksten?", options:["In der Mitte des Stabmagneten","An den Polen (Enden)","Überall gleich stark"], correct:1,
        feedback:{ ok:"Richtig: An den Polen bündeln sich die Feldlinien.", wrong:"Tipp: Schaue auf die Dichte der Eisenspäne." } }
    ],
    [
      { id:"s2a", type:"textcheck", prompt:"Formuliere einen Je-desto-Satz zur Feldliniendichte.", placeholder:"Je dichter …, desto …", minChars:22 }
    ],
    [
      { id:"s3a", type:"mcq", prompt:"Welche Pole stoßen sich ab?", options:["Nord-Süd","Nord-Nord und Süd-Süd","Alle Pole ziehen sich an"], correct:1,
        feedback:{ ok:"Genau: Gleichnamige Pole stoßen sich ab.", wrong:"Denke an die Polregel: gleichnamig abstoßend." } },
      { id:"s3b", type:"text", prompt:"Drehe einen Magneten und beschreibe die Veränderung.", placeholder:"Nach dem Drehen …" }
    ],
    [
      { id:"s4a", type:"textcheck", prompt:"Merksatz: Vervollständige mit beiden Regeln.", placeholder:"Gleichnamige Pole …, ungleichnamige Pole …", minChars:25 }
    ]
  ]
};

function init(){
  document.getElementById("title").textContent = state.meta.title;
  bindUI();
  buildStepper();
  seedObjects();
  renderAll();
  setStep(0);
}

function bindUI(){
  document.getElementById("resetBtn").addEventListener("click", resetAll);
  document.getElementById("flipBtn").addEventListener("click", ()=>{
    const m1 = getObj("m1");
    m1.rot = (m1.rot + 180) % 360;
    updateField();
  });
  document.getElementById("toggleSecondBtn").addEventListener("click", ()=>{
    state.showSecond = !state.showSecond;
    const m2 = getObj("m2");
    m2.visible = state.showSecond;
    updateSecondButtonText();
    renderObjects();
    updateField();
  });

  const help = document.getElementById("helpModal");
  document.getElementById("helpBtn").addEventListener("click", ()=> help.hidden=false);
  document.getElementById("closeHelp").addEventListener("click", ()=> help.hidden=true);

  document.getElementById("prevStep").addEventListener("click", ()=> setStep(state.meta.stepIndex-1));
  document.getElementById("nextStep").addEventListener("click", ()=> setStep(state.meta.stepIndex+1));

  const panel = document.getElementById("panel");
  const toggle = document.getElementById("panelToggle");
  toggle.addEventListener("click", ()=>{
    const collapsed = panel.getAttribute("data-collapsed")==="true";
    panel.setAttribute("data-collapsed", collapsed ? "false":"true");
    toggle.textContent = collapsed ? "Aufgaben ▲" : "Aufgaben ▼";
    toggle.setAttribute("aria-expanded", collapsed ? "true":"false");
  });
}

function buildStepper(){
  const el = document.getElementById("stepper");
  el.innerHTML = "";
  state.meta.steps.forEach((name,i)=>{
    const b = document.createElement("button");
    b.className = "step" + (i===state.meta.stepIndex ? " active":"");
    b.textContent = `${i+1}. ${name}`;
    b.addEventListener("click", ()=> setStep(i));
    el.appendChild(b);
  });
}

function setStep(i){
  const max = state.meta.steps.length - 1;
  state.meta.stepIndex = clamp(i, 0, max);
  document.getElementById("subtitle").textContent = `Schritt ${state.meta.stepIndex+1} von ${state.meta.steps.length}`;
  buildStepper();
  renderTasksForStep();

  if(state.meta.stepIndex >= 2){
    state.showSecond = true;
    getObj("m2").visible = true;
  }
  updateSecondButtonText();
  renderObjects();
  updateField();

  const hints = [
    "Ziehe den Magneten. Die Eisenspäne zeigen das Feldbild.",
    "Beobachte: Wo die Späne dichter stehen, ist die Wirkung stärker.",
    "Nutze zwei Magnete: Nähe gleiche/ungleiche Pole an.",
    "Formuliere den Merksatz aus deinen Beobachtungen."
  ];
  document.getElementById("stageHint").textContent = hints[state.meta.stepIndex];
}

function seedObjects(){
  state.objects = [
    { id:"m1", type:"magnet", x:340, y:300, w:220, h:72, rot:0, draggable:true, visible:true },
    { id:"m2", type:"magnet", x:700, y:300, w:220, h:72, rot:180, draggable:true, visible:false }
  ];
}

function renderAll(){
  drawGrid();
  drawFieldBase();
  renderObjects();
  attachPointerHandlers();
  updateField();
  updateSecondButtonText();
}

function drawGrid(){
  const g = document.getElementById("grid");
  g.innerHTML = "";
  for(let x=100; x<STAGE.w; x+=100){
    const l = document.createElementNS(NS,"line");
    l.setAttribute("x1", x); l.setAttribute("y1", 0);
    l.setAttribute("x2", x); l.setAttribute("y2", STAGE.h);
    g.appendChild(l);
  }
  for(let y=100; y<STAGE.h; y+=100){
    const l = document.createElementNS(NS,"line");
    l.setAttribute("x1", 0); l.setAttribute("y1", y);
    l.setAttribute("x2", STAGE.w); l.setAttribute("y2", y);
    g.appendChild(l);
  }
}

function drawFieldBase(){
  const g = document.getElementById("overlays");
  g.innerHTML = "";
  for(let y=70; y<=530; y+=35){
    for(let x=70; x<=930; x+=35){
      const seg = document.createElementNS(NS,"line");
      seg.setAttribute("data-filings","1");
      seg.setAttribute("x1", x-6);
      seg.setAttribute("y1", y);
      seg.setAttribute("x2", x+6);
      seg.setAttribute("y2", y);
      seg.setAttribute("stroke", "rgba(16,19,33,.18)");
      seg.setAttribute("stroke-width", "1.8");
      seg.setAttribute("stroke-linecap", "round");
      g.appendChild(seg);
    }
  }
}

function renderObjects(){
  const g = document.getElementById("objects");
  g.innerHTML = "";
  for(const o of state.objects){
    if(!o.visible) continue;
    g.appendChild(makeMagnet(o));
  }
}

function makeMagnet(o){
  const root = document.createElementNS(NS,"g");
  root.setAttribute("data-id", o.id);
  root.setAttribute("transform", `translate(${o.x} ${o.y}) rotate(${o.rot})`);

  const left = document.createElementNS(NS,"rect");
  left.setAttribute("x", -o.w/2);
  left.setAttribute("y", -o.h/2);
  left.setAttribute("width", o.w/2);
  left.setAttribute("height", o.h);
  left.setAttribute("rx", "12");
  left.setAttribute("fill", "#ef4444");

  const right = document.createElementNS(NS,"rect");
  right.setAttribute("x", 0);
  right.setAttribute("y", -o.h/2);
  right.setAttribute("width", o.w/2);
  right.setAttribute("height", o.h);
  right.setAttribute("rx", "12");
  right.setAttribute("fill", "#16a34a");

  const n = labelText("N", -o.w*0.25, 8);
  const s = labelText("S",  o.w*0.25, 8);

  root.append(left, right, n, s);
  return root;
}

function labelText(t, x, y){
  const el = document.createElementNS(NS,"text");
  el.textContent = t;
  el.setAttribute("x", x);
  el.setAttribute("y", y);
  el.setAttribute("text-anchor", "middle");
  el.setAttribute("font-family", "ui-sans-serif,system-ui");
  el.setAttribute("font-size", "28");
  el.setAttribute("font-weight", "800");
  el.setAttribute("fill", "white");
  return el;
}

function attachPointerHandlers(){
  const stage = document.getElementById("stage");
  stage.onpointerdown = onDown;
  stage.onpointermove = onMove;
  stage.onpointerup = onUp;
  stage.onpointercancel = onUp;
}

function svgPoint(evt){
  const svg = document.getElementById("stage");
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function findObjFromEvent(evt){
  const g = evt.target.closest("[data-id]");
  if(!g) return null;
  return getObj(g.getAttribute("data-id"));
}

function onDown(evt){
  const o = findObjFromEvent(evt);
  if(!o || !o.draggable) return;
  evt.preventDefault();
  const p = svgPoint(evt);
  state.dragging = { id:o.id, dx:o.x-p.x, dy:o.y-p.y, pointerId:evt.pointerId };
  evt.target.setPointerCapture(evt.pointerId);
}

function onMove(evt){
  if(!state.dragging || evt.pointerId !== state.dragging.pointerId) return;
  const o = getObj(state.dragging.id);
  if(!o) return;
  const p = svgPoint(evt);
  o.x = clamp(p.x + state.dragging.dx, 120, STAGE.w-120);
  o.y = clamp(p.y + state.dragging.dy, 90, STAGE.h-90);
  updateTransform(o);
  if(o.id === "m1" || o.id === "m2"){
    keepMagnetsSeparated();
    updateField();
  }
}

function onUp(evt){
  if(!state.dragging || evt.pointerId !== state.dragging.pointerId) return;
  state.dragging = null;
}

function keepMagnetsSeparated(){
  const m1 = getObj("m1");
  const m2 = getObj("m2");
  if(!m2.visible) return;
  if(dist(m1,m2) < 180){
    m2.x = clamp(m2.x + 12, 120, STAGE.w-120);
    updateTransform(m2);
  }
}

function updateTransform(o){
  const g = document.querySelector(`[data-id="${o.id}"]`);
  if(g) g.setAttribute("transform", `translate(${o.x} ${o.y}) rotate(${o.rot})`);
}

function updateField(){
  const filings = Array.from(document.querySelectorAll('[data-filings="1"]'));
  const magnets = state.objects.filter(o=>o.visible);
  filings.forEach(seg=>{
    const x = (Number(seg.getAttribute("x1")) + Number(seg.getAttribute("x2"))) / 2;
    const y = Number(seg.getAttribute("y1"));
    const f = fieldAt(x,y,magnets);
    const len = clamp(8 + f.mag*14000, 7, 17);
    const dx = Math.cos(f.angle) * len;
    const dy = Math.sin(f.angle) * len;
    seg.setAttribute("x1", (x-dx).toFixed(2));
    seg.setAttribute("y1", (y-dy).toFixed(2));
    seg.setAttribute("x2", (x+dx).toFixed(2));
    seg.setAttribute("y2", (y+dy).toFixed(2));
    seg.setAttribute("opacity", clamp(0.12 + f.mag*17000, 0.12, 0.95).toFixed(2));
  });
}

function fieldAt(x,y,magnets){
  let fx = 0;
  let fy = 0;
  for(const m of magnets){
    const poles = getPoles(m);
    for(const p of poles){
      const dx = x - p.x;
      const dy = y - p.y;
      const r2 = Math.max(600, dx*dx + dy*dy);
      const inv = p.q / (r2 * Math.sqrt(r2));
      fx += dx * inv;
      fy += dy * inv;
    }
  }
  return { angle: Math.atan2(fy, fx), mag: Math.hypot(fx,fy) };
}

function getPoles(m){
  const a = (m.rot||0) * Math.PI/180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const d = m.w*0.25;
  return [
    { x: m.x - ux*d, y: m.y - uy*d, q: 1 },
    { x: m.x + ux*d, y: m.y + uy*d, q:-1 }
  ];
}

function getObj(id){ return state.objects.find(o=>o.id===id); }

function renderTasksForStep(){
  const el = document.getElementById("tasks");
  el.innerHTML = "";
  const tasks = state.tasksByStep[state.meta.stepIndex] || [];
  for(const t of tasks) el.appendChild(renderTask(t));
}

function renderTask(t){
  const wrap = document.createElement("div");
  wrap.style.marginTop = "12px";
  const p = document.createElement("div");
  p.style.fontWeight = "800";
  p.textContent = t.prompt;
  wrap.appendChild(p);

  if(t.type === "text" || t.type === "textcheck"){
    const ta = document.createElement("textarea");
    ta.placeholder = t.placeholder || "";
    ta.value = state.answers[t.id] || "";
    ta.addEventListener("input", ()=> state.answers[t.id] = ta.value);
    wrap.appendChild(ta);
    if(t.type === "textcheck"){
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.style.marginTop = "10px";
      btn.textContent = "Check";
      btn.addEventListener("click", ()=>{
        const ok = (ta.value || "").trim().length >= (t.minChars||1);
        showFeedback(ok?"ok":"warn", ok?"Gute Formulierung!":"Bitte etwas genauer formulieren.");
      });
      wrap.appendChild(btn);
    }
  }

  if(t.type === "mcq"){
    const box = document.createElement("div");
    box.style.display = "grid";
    box.style.gap = "10px";
    box.style.marginTop = "10px";
    t.options.forEach((opt,idx)=>{
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = opt;
      b.addEventListener("click", ()=>{
        state.answers[t.id] = idx;
        const ok = idx === t.correct;
        showFeedback(ok?"ok":"warn", ok?(t.feedback?.ok||"Richtig"):(t.feedback?.wrong||"Noch nicht richtig"));
      });
      box.appendChild(b);
    });
    wrap.appendChild(box);
  }

  return wrap;
}

function showFeedback(kind,text){
  const el = document.getElementById("taskFeedback");
  el.hidden = false;
  el.textContent = text;
  el.style.background = kind === "ok" ? "rgba(22,163,74,.10)" : "rgba(234,179,8,.14)";
}

function updateSecondButtonText(){
  document.getElementById("toggleSecondBtn").textContent = state.showSecond ? "2. Magnet ausblenden" : "2. Magnet anzeigen";
}

function resetAll(){
  state.answers = {};
  state.dragging = null;
  state.showSecond = false;
  seedObjects();
  renderAll();
  setStep(0);
  const fb = document.getElementById("taskFeedback");
  fb.hidden = true;
  fb.textContent = "";
}

init();
