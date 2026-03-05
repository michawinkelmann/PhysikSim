const STAGE = { w: 1000, h: 600 };
const NS = "http://www.w3.org/2000/svg";

const LAMPS = {
  spar: { label: "Sparlampe", resistance: 30, color: "#f59e0b" },
  standard: { label: "Standardlampe", resistance: 50, color: "#fbbf24" },
  mini: { label: "Minilampe", resistance: 80, color: "#fde047" }
};

const state = {
  meta: {
    title: "Elektrische Energie, Spannung, Stromstärke",
    steps: ["V1: Glühlämpchen", "V2: Motoren"]
  },
  stepIndex: 0,
  answers: {},
  v1: { leftLamp: "standard", rightLamp: "mini", current: 0.3 },
  v2: { mode: "single", voltage: 4.5 }
};

const scenes = [
  {
    key: "v1",
    title: "V1 – Glühlämpchen vergleichen",
    text: "Stelle zwei unterschiedliche Lämpchen in getrennten Stromkreisen so ein, dass die Stromstärke gleich ist. Beobachte Helligkeit und Quellenspannung.",
    hint: "Gleiche Stromstärke, unterschiedliche Spannung: U = R · I.",
    tasks: [
      { id: "v1-obs", type: "text", prompt: "Beschreibe die Helligkeit beider Lampen." },
      {
        id: "v1-mcq",
        type: "mcq",
        prompt: "Welche Aussage passt?",
        options: [
          "Bei gleicher Stromstärke brauchen verschiedene Lampen unterschiedliche Spannung.",
          "Bei gleicher Stromstärke ist die Spannung immer gleich.",
          "Helligkeit hängt nur von der Farbe der Lampe ab."
        ],
        correct: 0
      }
    ]
  },
  {
    key: "v2",
    title: "V2 – Motordrehzahl, Reihen- und Parallelschaltung",
    text: "Untersuche: Ein Motor allein, zwei Motoren in Reihe und zwei Motoren parallel.",
    hint: "Bei Reihenschaltung muss für gleiche Drehzahl die Spannung erhöht werden. Bei Parallelschaltung verdoppelt sich die Stromstärke.",
    tasks: [
      { id: "v2-obs", type: "text", prompt: "Was passiert mit der Stromstärke bei zwei parallel geschalteten Motoren?" },
      {
        id: "v2-mcq",
        type: "mcq",
        prompt: "Welche Aussage ist richtig?",
        options: [
          "Reihenschaltung halbiert die nötige Spannung.",
          "Parallelschaltung bei gleicher Spannung erhöht die Gesamtstromstärke.",
          "Die Anzahl der Motoren hat keinen Einfluss auf den Strom."
        ],
        correct: 1
      }
    ]
  }
];

function init() {
  drawGrid();
  bindUI();
  buildStepper();
  renderAll();
}

function bindUI() {
  document.getElementById("resetBtn").addEventListener("click", resetAll);
  document.getElementById("helpBtn").addEventListener("click", () => document.getElementById("helpModal").hidden = false);
  document.getElementById("closeHelp").addEventListener("click", () => document.getElementById("helpModal").hidden = true);

  document.getElementById("nextStep").addEventListener("click", () => setStep(state.stepIndex + 1));
  document.getElementById("prevStep").addEventListener("click", () => setStep(state.stepIndex - 1));

  const panel = document.getElementById("panel");
  const panelToggle = document.getElementById("panelToggle");
  panelToggle.addEventListener("click", () => {
    const collapsed = panel.dataset.collapsed === "true";
    panel.dataset.collapsed = collapsed ? "false" : "true";
    panelToggle.textContent = collapsed ? "Aufgaben & Steuerung ▲" : "Aufgaben & Steuerung ▼";
    panelToggle.setAttribute("aria-expanded", collapsed ? "true" : "false");
  });
}

function buildStepper() {
  const stepper = document.getElementById("stepper");
  stepper.innerHTML = "";
  state.meta.steps.forEach((label, i) => {
    const b = document.createElement("button");
    b.className = "step";
    b.textContent = `${i + 1}. ${label}`;
    b.addEventListener("click", () => setStep(i));
    stepper.appendChild(b);
  });
}

function setStep(next) {
  state.stepIndex = Math.max(0, Math.min(state.meta.steps.length - 1, next));
  renderAll();
}

function renderAll() {
  renderHeader();
  renderControls();
  renderTasks();
  renderScene();
}

function renderHeader() {
  const i = state.stepIndex;
  document.getElementById("title").textContent = state.meta.title;
  document.getElementById("subtitle").textContent = `Schritt ${i + 1} von ${state.meta.steps.length}`;

  const scene = scenes[i];
  document.getElementById("experimentTitle").textContent = scene.title;
  document.getElementById("experimentText").textContent = scene.text;
  document.getElementById("stageHint").textContent = scene.hint;

  [...document.querySelectorAll(".step")].forEach((el, idx) => el.classList.toggle("active", idx === i));

  document.getElementById("prevStep").disabled = i === 0;
  document.getElementById("nextStep").disabled = i === scenes.length - 1;
}

function renderControls() {
  const el = document.getElementById("controls");
  el.innerHTML = "";

  if (state.stepIndex === 0) {
    el.appendChild(selectField("Linke Lampe", "leftLamp", state.v1.leftLamp, Object.entries(LAMPS).map(([value, l]) => ({ value, label: l.label })), (v) => {
      state.v1.leftLamp = v;
      renderScene();
    }));
    el.appendChild(selectField("Rechte Lampe", "rightLamp", state.v1.rightLamp, Object.entries(LAMPS).map(([value, l]) => ({ value, label: l.label })), (v) => {
      state.v1.rightLamp = v;
      renderScene();
    }));
    el.appendChild(rangeField("Gemeinsame Stromstärke I", "current", 0.1, 0.8, 0.05, state.v1.current, "A", (v) => {
      state.v1.current = v;
      renderScene();
    }));
  } else {
    el.appendChild(selectField("Schaltung", "mode", state.v2.mode, [
      { value: "single", label: "Ein Motor" },
      { value: "series", label: "Zwei Motoren in Reihe" },
      { value: "parallel", label: "Zwei Motoren parallel" }
    ], (v) => {
      state.v2.mode = v;
      renderScene();
    }));
    el.appendChild(rangeField("Spannung U", "voltage", 2, 12, 0.5, state.v2.voltage, "V", (v) => {
      state.v2.voltage = v;
      renderScene();
    }));
  }
}

function selectField(label, id, value, options, onChange) {
  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.innerHTML = `<span>${label}</span>`;
  const select = document.createElement("select");
  select.id = id;
  options.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    o.selected = opt.value === value;
    select.appendChild(o);
  });
  select.addEventListener("change", (e) => onChange(e.target.value));
  wrap.appendChild(select);
  return wrap;
}

function rangeField(label, id, min, max, step, value, unit, onChange) {
  const wrap = document.createElement("label");
  wrap.className = "field";
  const out = document.createElement("span");
  out.textContent = `${label}: ${Number(value).toFixed(2)} ${unit}`;
  const input = document.createElement("input");
  input.type = "range";
  input.id = id;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener("input", (e) => {
    const val = Number(e.target.value);
    out.textContent = `${label}: ${val.toFixed(2)} ${unit}`;
    onChange(val);
  });
  wrap.append(out, input);
  return wrap;
}

function renderScene() {
  const g = document.getElementById("objects");
  const overlays = document.getElementById("overlays");
  g.innerHTML = "";
  overlays.innerHTML = "";

  if (state.stepIndex === 0) renderV1(g, overlays);
  if (state.stepIndex === 1) renderV2(g, overlays);
}

function renderV1(g, overlays) {
  const left = LAMPS[state.v1.leftLamp];
  const right = LAMPS[state.v1.rightLamp];
  const I = state.v1.current;
  const UL = left.resistance * I;
  const UR = right.resistance * I;

  drawCircuit(g, 260, 300, left, UL, I);
  drawCircuit(g, 740, 300, right, UR, I);

  addOverlayText(overlays, 500, 80, `I links = I rechts = ${I.toFixed(2)} A`);
  addOverlayText(overlays, 500, 120, `Quellenspannung links: ${UL.toFixed(1)} V   |   rechts: ${UR.toFixed(1)} V`);
}

function drawCircuit(g, x, y, lamp, voltage, current) {
  const group = document.createElementNS(NS, "g");
  group.setAttribute("transform", `translate(${x} ${y})`);

  group.appendChild(line(-130, -90, 130, -90));
  group.appendChild(line(-130, -90, -130, 90));
  group.appendChild(line(130, -90, 130, 90));
  group.appendChild(line(-130, 90, 130, 90));

  const bulb = document.createElementNS(NS, "circle");
  bulb.setAttribute("cx", "0");
  bulb.setAttribute("cy", "-90");
  bulb.setAttribute("r", "34");
  bulb.setAttribute("fill", lamp.color);
  bulb.setAttribute("fill-opacity", String(Math.min(1, 0.25 + (voltage / 30))));
  bulb.setAttribute("stroke", "#111827");
  bulb.setAttribute("stroke-width", "4");
  group.appendChild(bulb);

  const source = rect(-44, 62, 88, 56, "#cbd5e1");
  group.appendChild(source);

  const label = text(0, 6, `${lamp.label}`);
  label.setAttribute("font-size", "20");
  group.appendChild(label);

  const meas = text(0, 148, `U=${voltage.toFixed(1)} V | I=${current.toFixed(2)} A`);
  meas.setAttribute("font-size", "20");
  group.appendChild(meas);

  g.appendChild(group);
}

function renderV2(g, overlays) {
  const { mode, voltage } = state.v2;
  const speed = motorSpeed(mode, voltage);
  const current = motorCurrent(mode, voltage);

  drawPowerSupply(g, 180, 120, voltage);

  if (mode === "single") {
    drawMotor(g, 560, 300, speed, "M1");
    drawWire(g, [[260, 200], [520, 200], [520, 300], [524, 300]]);
    drawWire(g, [[596, 300], [720, 300], [720, 360], [260, 360], [260, 230]]);
  } else if (mode === "series") {
    drawMotor(g, 500, 300, speed, "M1");
    drawMotor(g, 700, 300, speed, "M2");
    drawWire(g, [[260, 200], [460, 200], [460, 300], [464, 300]]);
    drawWire(g, [[536, 300], [664, 300]]);
    drawWire(g, [[736, 300], [820, 300], [820, 380], [260, 380], [260, 230]]);
  } else {
    drawMotor(g, 520, 240, speed, "M1");
    drawMotor(g, 520, 390, speed, "M2");
    drawWire(g, [[260, 200], [460, 200], [460, 240], [484, 240]]);
    drawWire(g, [[460, 200], [460, 390], [484, 390]]);
    drawWire(g, [[556, 240], [760, 240], [760, 360], [260, 360], [260, 230]]);
    drawWire(g, [[556, 390], [760, 390], [760, 360]]);
  }

  addOverlayText(overlays, 590, 80, `Drehzahl pro Motor: ${speed.toFixed(0)} U/min`);
  addOverlayText(overlays, 590, 120, `Gesamtstromstärke: ${current.toFixed(2)} A`);
}

function motorSpeed(mode, voltage) {
  if (mode === "single") return 200 * voltage;
  if (mode === "series") return 100 * voltage;
  return 200 * voltage;
}

function motorCurrent(mode, voltage) {
  if (mode === "single") return 0.15 * voltage;
  if (mode === "series") return 0.15 * voltage;
  return 0.30 * voltage;
}

function drawPowerSupply(g, x, y, voltage) {
  g.appendChild(rect(x, y, 180, 110, "#1f2937"));
  const t = text(x + 90, y + 35, "Netzgerät");
  t.setAttribute("fill", "#fff");
  g.appendChild(t);
  const u = text(x + 90, y + 78, `${voltage.toFixed(1)} V`);
  u.setAttribute("fill", "#93c5fd");
  g.appendChild(u);
}

function drawMotor(g, x, y, speed, name) {
  const housing = document.createElementNS(NS, "circle");
  housing.setAttribute("cx", x);
  housing.setAttribute("cy", y);
  housing.setAttribute("r", "36");
  housing.setAttribute("fill", "#38bdf8");
  housing.setAttribute("stroke", "#0f172a");
  housing.setAttribute("stroke-width", "4");
  g.appendChild(housing);

  const rotor = line(x, y, x + 24 * Math.cos(speed / 20), y + 24 * Math.sin(speed / 20));
  rotor.setAttribute("stroke-width", "6");
  g.appendChild(rotor);

  const label = text(x, y + 60, `${name}`);
  label.setAttribute("font-size", "18");
  g.appendChild(label);
}

function drawWire(g, points) {
  for (let i = 1; i < points.length; i++) {
    g.appendChild(line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], "#ef4444"));
  }
}

function line(x1, y1, x2, y2, color = "#334155") {
  const l = document.createElementNS(NS, "line");
  l.setAttribute("x1", x1); l.setAttribute("y1", y1);
  l.setAttribute("x2", x2); l.setAttribute("y2", y2);
  l.setAttribute("stroke", color);
  l.setAttribute("stroke-width", "5");
  l.setAttribute("stroke-linecap", "round");
  return l;
}

function rect(x, y, w, h, fill) {
  const r = document.createElementNS(NS, "rect");
  r.setAttribute("x", x); r.setAttribute("y", y);
  r.setAttribute("width", w); r.setAttribute("height", h);
  r.setAttribute("rx", "16");
  r.setAttribute("fill", fill);
  r.setAttribute("stroke", "#334155");
  return r;
}

function text(x, y, content) {
  const t = document.createElementNS(NS, "text");
  t.setAttribute("x", x);
  t.setAttribute("y", y);
  t.setAttribute("text-anchor", "middle");
  t.setAttribute("font-family", "ui-sans-serif, system-ui");
  t.setAttribute("font-weight", "800");
  t.setAttribute("fill", "#0f172a");
  t.textContent = content;
  return t;
}

function addOverlayText(g, x, y, txt) {
  const bg = rect(x - 260, y - 28, 520, 42, "rgba(255,255,255,0.86)");
  bg.setAttribute("stroke", "rgba(15,23,42,.2)");
  g.appendChild(bg);
  const t = text(x, y, txt);
  t.setAttribute("font-size", "20");
  g.appendChild(t);
}

function renderTasks() {
  const taskWrap = document.getElementById("tasks");
  taskWrap.innerHTML = "";
  const scene = scenes[state.stepIndex];

  scene.tasks.forEach((task) => {
    const block = document.createElement("div");
    block.style.marginBottom = "12px";

    const p = document.createElement("div");
    p.style.fontWeight = "800";
    p.textContent = task.prompt;
    block.appendChild(p);

    if (task.type === "text") {
      const input = document.createElement("textarea");
      input.value = state.answers[task.id] || "";
      input.placeholder = "Antwort notieren …";
      input.addEventListener("input", (e) => state.answers[task.id] = e.target.value);
      block.appendChild(input);
    }

    if (task.type === "mcq") {
      const options = document.createElement("div");
      options.style.display = "grid";
      options.style.gap = "10px";
      task.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          state.answers[task.id] = idx;
          showFeedback(idx === task.correct ? "ok" : "warn", idx === task.correct ? "Richtig!" : "Noch nicht richtig. Prüfe die Messwerte.");
        });
        options.appendChild(btn);
      });
      block.appendChild(options);
    }

    taskWrap.appendChild(block);
  });
}

function showFeedback(kind, message) {
  const fb = document.getElementById("taskFeedback");
  fb.hidden = false;
  fb.textContent = message;
  fb.style.background = kind === "ok" ? "rgba(22,163,74,.12)" : "rgba(234,179,8,.16)";
}

function drawGrid() {
  const g = document.getElementById("grid");
  g.innerHTML = "";
  for (let x = 100; x < STAGE.w; x += 100) g.appendChild(line(x, 0, x, STAGE.h, "rgba(0,0,0,.05)"));
  for (let y = 100; y < STAGE.h; y += 100) g.appendChild(line(0, y, STAGE.w, y, "rgba(0,0,0,.05)"));
}

function resetAll() {
  state.stepIndex = 0;
  state.answers = {};
  state.v1 = { leftLamp: "standard", rightLamp: "mini", current: 0.3 };
  state.v2 = { mode: "single", voltage: 4.5 };
  const fb = document.getElementById("taskFeedback");
  fb.hidden = true;
  renderAll();
}

init();
