// PhysikSim-Lab – Experiment Template (offline, ohne Bibliotheken)
//
// Dieses JS ist ein minimaler Skeleton:
// - state (Meta, Steps, Objects, Tasks)
// - Pointer-Drag via Pointer Events + setPointerCapture
// - Reset immer sichtbar (Topbar)
//
// Für ein neues Experiment:
// 1) state.meta & seedObjects() anpassen
// 2) tasksByStep ergänzen
// 3) In /site.js registrieren (EXPERIMENTS)

const STAGE = { w:1000, h:600 };
const NS = "http://www.w3.org/2000/svg";

const clamp = (v,a,b)=>Math.max(a, Math.min(b,v));
const lerp  = (a,b,t)=>a+(b-a)*t;

const state = {
  meta: {
    title: "Freier Fall – Zeit & Strecke",
    steps: ["Aufbau", "Durchführung", "Beobachtung", "Auswertung"],
    stepIndex: 0
  },
  objects: [],
  dragging: null,
  answers: {},
  tasksByStep: [
    [ { id:"p1", type:"text", prompt:"Was soll hier untersucht werden?", placeholder:"Fragestellung: …" } ],
    [ { id:"p2", type:"text", prompt:"Welche Größe veränderst du?", placeholder:"Ich variiere …" } ],
    [ { id:"p3", type:"text", prompt:"Welche Beobachtung machst du?", placeholder:"Ich beobachte …" } ],
    [ { id:"p4", type:"textcheck", prompt:"Formuliere ein Ergebnis.", placeholder:"Ergebnis: …", minChars: 15 } ]
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

  const help = document.getElementById("helpModal");
  document.getElementById("helpBtn").addEventListener("click", ()=> help.hidden=false);
  document.getElementById("closeHelp").addEventListener("click", ()=> help.hidden=true);

  document.getElementById("prevStep").addEventListener("click", ()=> setStep(state.meta.stepIndex-1));
  document.getElementById("nextStep").addEventListener("click", ()=> setStep(state.meta.stepIndex+1));

  // Panel toggle (Mobile)
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
  state.meta.stepIndex = Math.max(0, Math.min(max, i));
  document.getElementById("subtitle").textContent = `Schritt ${state.meta.stepIndex+1} von ${state.meta.steps.length}`;
  buildStepper();
  renderTasksForStep();
}

function seedObjects(){
  // Platzhalterobjekte (Experiment in Vorbereitung)
  state.objects = [
    {id:"obj1", type:"block", x:320, y:300, rot:0, w:280, h:80, draggable:true},
    {id:"obj2", type:"chip",  x:700, y:380, rot:0, w:70,  h:30, draggable:true},
  ];
}


function renderAll(){
  drawGrid();
  renderObjects();
  attachPointerHandlers();
}

function drawGrid(){
  const g = document.getElementById("grid");
  g.innerHTML = "";
  // Leichtes Raster (optional)
  for(let x=80; x<STAGE.w; x+=120){
    const l = document.createElementNS(NS,"line");
    l.setAttribute("x1", x); l.setAttribute("y1", 0);
    l.setAttribute("x2", x); l.setAttribute("y2", STAGE.h);
    g.appendChild(l);
  }
  for(let y=80; y<STAGE.h; y+=120){
    const l = document.createElementNS(NS,"line");
    l.setAttribute("x1", 0); l.setAttribute("y1", y);
    l.setAttribute("x2", STAGE.w); l.setAttribute("y2", y);
    g.appendChild(l);
  }
}

function renderObjects(){
  const g = document.getElementById("objects");
  g.innerHTML = "";
  for(const o of state.objects){
    g.appendChild(makeSvgObject(o));
  }
}

function makeSvgObject(o){
  const root = document.createElementNS(NS,"g");
  root.setAttribute("data-id", o.id);
  root.setAttribute("transform", `translate(${o.x} ${o.y}) rotate(${o.rot})`);

  if(o.type==="block"){
    const r = document.createElementNS(NS,"rect");
    r.setAttribute("x",-o.w/2); r.setAttribute("y",-o.h/2);
    r.setAttribute("width",o.w); r.setAttribute("height",o.h);
    r.setAttribute("rx","18");
    r.setAttribute("fill","#ffffff");
    r.setAttribute("stroke","rgba(16,19,33,.18)");
    root.appendChild(r);

    const label = document.createElementNS(NS,"text");
    label.textContent = "Objekt";
    label.setAttribute("text-anchor","middle");
    label.setAttribute("y","6");
    label.setAttribute("font-family","ui-sans-serif, system-ui");
    label.setAttribute("font-weight","800");
    label.setAttribute("font-size","20");
    label.setAttribute("fill","#101321");
    root.appendChild(label);
  } else {
    const e = document.createElementNS(NS,"ellipse");
    e.setAttribute("cx","0"); e.setAttribute("cy","0");
    e.setAttribute("rx", o.w/2); e.setAttribute("ry", o.h/2);
    e.setAttribute("fill","#94a3b8");
    root.appendChild(e);
  }

  return root;
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
  const id = g.getAttribute("data-id");
  return state.objects.find(o=>o.id===id) || null;
}

function onDown(evt){
  const o = findObjFromEvent(evt);
  if(!o || !o.draggable) return;
  evt.preventDefault();

  const p = svgPoint(evt);
  state.dragging = { id:o.id, dx:o.x - p.x, dy:o.y - p.y, pointerId: evt.pointerId };

  // Stabilität: Pointer capture, damit Drag nicht „abbricht“, wenn der Finger den Shape verlässt.
  evt.target.setPointerCapture(evt.pointerId);
}

function onMove(evt){
  if(!state.dragging || evt.pointerId !== state.dragging.pointerId) return;
  const o = state.objects.find(x=>x.id===state.dragging.id);
  if(!o) return;

  const p = svgPoint(evt);
  o.x = clamp(p.x + state.dragging.dx, 60, STAGE.w-60);
  o.y = clamp(p.y + state.dragging.dy, 60, STAGE.h-60);

  updateObjectTransform(o);
}

function onUp(evt){
  if(!state.dragging || evt.pointerId !== state.dragging.pointerId) return;
  state.dragging = null;
}

function updateObjectTransform(o){
  const g = document.querySelector(`[data-id="${o.id}"]`);
  if(g) g.setAttribute("transform", `translate(${o.x} ${o.y}) rotate(${o.rot})`);
}

function renderTasksForStep(){
  const el = document.getElementById("tasks");
  el.innerHTML = "";

  const tasks = state.tasksByStep[state.meta.stepIndex] || [];
  if(tasks.length===0){
    el.innerHTML = `<div class="muted">Keine Aufgaben für diesen Schritt.</div>`;
    return;
  }

  for(const t of tasks){
    el.appendChild(renderTask(t));
  }
}

function renderTask(t){
  const wrap = document.createElement("div");
  wrap.style.marginTop = "12px";

  const p = document.createElement("div");
  p.style.fontWeight = "800";
  p.textContent = t.prompt;

  wrap.appendChild(p);

  if(t.type==="text" || t.type==="textcheck"){
    const ta = document.createElement("textarea");
    ta.placeholder = t.placeholder || "";
    ta.value = state.answers[t.id] || "";
    ta.addEventListener("input", ()=> state.answers[t.id] = ta.value);
    wrap.appendChild(ta);

    if(t.type==="textcheck"){
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.style.marginTop = "10px";
      btn.textContent = "Check";
      btn.addEventListener("click", ()=>{
        const ok = (ta.value || "").trim().length >= (t.minChars||1);
        showFeedback(ok ? "ok" : "warn", ok ? "Passt! (Text hat genug Inhalt.)" : "Tipp: Formuliere etwas ausführlicher.");
      });
      wrap.appendChild(btn);
    }
  }

  if(t.type==="mcq"){
    const box = document.createElement("div");
    box.style.display = "grid";
    box.style.gap = "10px";
    box.style.marginTop = "10px";

    t.options.forEach((opt, idx)=>{
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = opt;
      b.addEventListener("click", ()=>{
        state.answers[t.id] = idx;
        const ok = Array.isArray(t.correct) ? t.correct.includes(idx) : (idx===t.correct);
        showFeedback(ok ? "ok" : "warn", ok ? (t.feedback?.ok || "Richtig.") : (t.feedback?.wrong || "Noch nicht."));
      });
      box.appendChild(b);
    });

    wrap.appendChild(box);
  }

  return wrap;
}

function showFeedback(kind, text){
  const el = document.getElementById("taskFeedback");
  el.hidden = false;
  el.textContent = text;
  el.style.background = kind==="ok" ? "rgba(22,163,74,.10)" : "rgba(234,179,8,.14)";
}

function resetAll(){
  state.answers = {};
  state.dragging = null;
  seedObjects();
  renderAll();
  setStep(0);

  const fb = document.getElementById("taskFeedback");
  fb.hidden = true;
  fb.textContent = "";
}

init();
