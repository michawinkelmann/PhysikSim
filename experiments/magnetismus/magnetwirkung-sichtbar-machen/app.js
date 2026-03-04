const STAGE = { w: 1000, h: 600 };
const NS = "http://www.w3.org/2000/svg";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const state = {
  mode: "A1",
  polarity: "gleich",
  dragging: null,
  magnets: [
    { id: "m1", x: 350, y: 300, w: 220, h: 72, rot: 0, visible: true },
    { id: "m2", x: 650, y: 300, w: 220, h: 72, rot: 180, visible: false }
  ]
};

const TASKS = {
  A1: [
    "1) Zeichne die Lage der Eisenspäne um den Magneten.",
    "2) Kennzeichne die Stellen mit besonders großer magnetischer Wirkung.",
    "3) Benenne diese Stellen als Pole.",
    "4) Formuliere einen Je-desto-Satz zur Feldliniendichte."
  ],
  A2: [
    "1) Vergleiche die Lage der Eisenspäne bei zwei Magneten.",
    "2) Markiere wieder die Bereiche mit der größten Wirkung.",
    "3) Beschreibe: Wo bündeln sich Feldlinien besonders stark?"
  ],
  B: [
    "1) Lege gleichnamige Pole gegenüber und beobachte den Feldlinienverlauf.",
    "2) Schalte auf ungleichnamige Pole und vergleiche den Bereich zwischen den Magneten.",
    "3) Stelle den Zusammenhang zwischen Polgesetz und Feldlinienverlauf her."
  ]
};

function init() {
  bindUI();
  drawGrid();
  drawFieldBase();
  renderAll();
  applyMode("A1");
}

function bindUI() {
  document.getElementById("modeA1Btn").addEventListener("click", () => applyMode("A1"));
  document.getElementById("modeA2Btn").addEventListener("click", () => applyMode("A2"));
  document.getElementById("modeBBtn").addEventListener("click", () => applyMode("B"));

  document.getElementById("flipM1Btn").addEventListener("click", () => {
    const m1 = getMagnet("m1");
    m1.rot = (m1.rot + 180) % 360;
    updateField();
    renderObjects();
  });

  document.getElementById("flipM2Btn").addEventListener("click", () => {
    const m2 = getMagnet("m2");
    m2.rot = (m2.rot + 180) % 360;
    updateField();
    renderObjects();
  });

  document.getElementById("polarityBtn").addEventListener("click", () => {
    state.polarity = state.polarity === "gleich" ? "ungleich" : "gleich";
    applyPolarity();
  });

  const slider = document.getElementById("distanceRange");
  slider.addEventListener("input", () => {
    document.getElementById("distanceValue").textContent = slider.value;
    if (state.mode === "B") {
      layoutForDistance(Number(slider.value));
      renderObjects();
      updateField();
    }
  });

  const help = document.getElementById("helpModal");
  document.getElementById("helpBtn").addEventListener("click", () => (help.hidden = false));
  document.getElementById("closeHelp").addEventListener("click", () => (help.hidden = true));

  const stage = document.getElementById("stage");
  stage.onpointerdown = onDown;
  stage.onpointermove = onMove;
  stage.onpointerup = onUp;
  stage.onpointercancel = onUp;

  document.getElementById("resetBtn").addEventListener("click", resetAll);
}

function applyMode(mode) {
  state.mode = mode;
  const m2 = getMagnet("m2");

  if (mode === "A1") {
    m2.visible = false;
    document.getElementById("subtitle").textContent = "Experiment A – Magnetfelder sichtbar machen (ein Magnet)";
    document.getElementById("stageHint").textContent = "Beobachte die Eisenspäne besonders an den Enden (Polen) des Magneten.";
  } else if (mode === "A2") {
    m2.visible = true;
    m2.rot = 0;
    m2.x = 650;
    m2.y = 300;
    document.getElementById("subtitle").textContent = "Experiment A – Magnetfelder sichtbar machen (zwei Magnete)";
    document.getElementById("stageHint").textContent = "Verschiebe beide Magnete und vergleiche, wie sich das Feldbild verändert.";
  } else {
    m2.visible = true;
    layoutForDistance(Number(document.getElementById("distanceRange").value));
    applyPolarity();
    document.getElementById("subtitle").textContent = "Experiment B – Wechselwirkung sichtbar machen";
    document.getElementById("stageHint").textContent = "Bei gleichnamigen Polen weichen Feldlinien in der Mitte aus, bei ungleichnamigen verbinden sie sich.";
  }

  document.getElementById("distanceWrap").style.display = mode === "B" ? "grid" : "none";
  renderTasks();
  renderObjects();
  updateModeButtons();
  updateField();
}

function layoutForDistance(distance) {
  const m1 = getMagnet("m1");
  const m2 = getMagnet("m2");
  m1.x = STAGE.w / 2 - distance / 2;
  m2.x = STAGE.w / 2 + distance / 2;
  m1.y = 300;
  m2.y = 300;
}

function applyPolarity() {
  const m2 = getMagnet("m2");
  m2.rot = state.polarity === "gleich" ? 180 : 0;
  document.getElementById("polarityBtn").textContent = `Polanordnung: ${state.polarity}namig`;
  renderObjects();
  updateField();
}

function updateModeButtons() {
  ["modeA1Btn", "modeA2Btn", "modeBBtn"].forEach((id) => {
    document.getElementById(id).classList.remove("primary");
  });
  document.getElementById(`mode${state.mode}Btn`).classList.add("primary");
}

function renderTasks() {
  const el = document.getElementById("tasks");
  el.innerHTML = "";
  (TASKS[state.mode] || []).forEach((task) => {
    const item = document.createElement("p");
    item.className = "taskItem";
    item.textContent = task;
    el.appendChild(item);
  });
}

function drawGrid() {
  const g = document.getElementById("grid");
  g.innerHTML = "";
  for (let x = 100; x < STAGE.w; x += 100) {
    g.appendChild(makeLine(x, 0, x, STAGE.h));
  }
  for (let y = 100; y < STAGE.h; y += 100) {
    g.appendChild(makeLine(0, y, STAGE.w, y));
  }
}

function makeLine(x1, y1, x2, y2) {
  const l = document.createElementNS(NS, "line");
  l.setAttribute("x1", x1);
  l.setAttribute("y1", y1);
  l.setAttribute("x2", x2);
  l.setAttribute("y2", y2);
  return l;
}

function drawFieldBase() {
  const g = document.getElementById("overlays");
  g.innerHTML = "";

  // Feldlinien-Segmente (Ausrichtung des Feldes)
  for (let y = 70; y <= 530; y += 35) {
    for (let x = 70; x <= 930; x += 35) {
      const seg = document.createElementNS(NS, "line");
      seg.setAttribute("data-filings", "1");
      seg.setAttribute("x1", x - 6);
      seg.setAttribute("y1", y);
      seg.setAttribute("x2", x + 6);
      seg.setAttribute("y2", y);
      seg.setAttribute("data-cx", x);
      seg.setAttribute("data-cy", y);
      seg.setAttribute("stroke", "rgba(16,19,33,.18)");
      seg.setAttribute("stroke-width", "1.8");
      seg.setAttribute("stroke-linecap", "round");
      g.appendChild(seg);
    }
  }

  // Zusätzliche Eisenspäne-Punkte, deren Sichtbarkeit mit der Feldstärke zunimmt.
  // Dadurch wird die Feldstärke über wahrgenommene "Dichte" klarer erkennbar.
  for (let y = 62; y <= 538; y += 22) {
    for (let x = 62; x <= 938; x += 22) {
      const dot = document.createElementNS(NS, "circle");
      const jx = ((x * 17 + y * 11) % 7) - 3;
      const jy = ((x * 13 + y * 19) % 7) - 3;
      const cx = x + jx;
      const cy = y + jy;

      dot.setAttribute("data-filings-dot", "1");
      dot.setAttribute("data-cx", cx);
      dot.setAttribute("data-cy", cy);
      dot.setAttribute("cx", cx);
      dot.setAttribute("cy", cy);
      dot.setAttribute("r", "1.25");
      dot.setAttribute("fill", "rgba(16,19,33,.22)");
      dot.setAttribute("opacity", "0.03");
      g.appendChild(dot);
    }
  }
}

function renderAll() {
  renderObjects();
  updateField();
}

function renderObjects() {
  const g = document.getElementById("objects");
  g.innerHTML = "";
  state.magnets.filter((m) => m.visible).forEach((m) => g.appendChild(makeMagnet(m)));
}

function makeMagnet(m) {
  const root = document.createElementNS(NS, "g");
  root.setAttribute("data-id", m.id);
  root.setAttribute("transform", `translate(${m.x} ${m.y}) rotate(${m.rot})`);

  const left = document.createElementNS(NS, "rect");
  left.setAttribute("x", -m.w / 2);
  left.setAttribute("y", -m.h / 2);
  left.setAttribute("width", m.w / 2);
  left.setAttribute("height", m.h);
  left.setAttribute("rx", "12");
  left.setAttribute("fill", "#ef4444");

  const right = document.createElementNS(NS, "rect");
  right.setAttribute("x", 0);
  right.setAttribute("y", -m.h / 2);
  right.setAttribute("width", m.w / 2);
  right.setAttribute("height", m.h);
  right.setAttribute("rx", "12");
  right.setAttribute("fill", "#16a34a");

  root.append(left, right, labelText("N", -m.w * 0.25), labelText("S", m.w * 0.25));
  return root;
}

function labelText(t, x) {
  const el = document.createElementNS(NS, "text");
  el.textContent = t;
  el.setAttribute("x", x);
  el.setAttribute("y", 8);
  el.setAttribute("text-anchor", "middle");
  el.setAttribute("font-size", "28");
  el.setAttribute("font-weight", "800");
  el.setAttribute("fill", "white");
  return el;
}

function onDown(evt) {
  const magnet = findMagnetFromEvent(evt);
  if (!magnet) return;
  const p = svgPoint(evt);
  state.dragging = { id: magnet.id, dx: magnet.x - p.x, dy: magnet.y - p.y, pointerId: evt.pointerId };
  evt.target.setPointerCapture(evt.pointerId);
}

function onMove(evt) {
  if (!state.dragging || evt.pointerId !== state.dragging.pointerId) return;
  const m = getMagnet(state.dragging.id);
  const p = svgPoint(evt);
  m.x = clamp(p.x + state.dragging.dx, 120, STAGE.w - 120);
  m.y = clamp(p.y + state.dragging.dy, 90, STAGE.h - 90);
  renderObjects();
  updateField();
}

function onUp(evt) {
  if (!state.dragging || evt.pointerId !== state.dragging.pointerId) return;
  state.dragging = null;
}

function svgPoint(evt) {
  const svg = document.getElementById("stage");
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function findMagnetFromEvent(evt) {
  const g = evt.target.closest("[data-id]");
  if (!g) return null;
  return getMagnet(g.getAttribute("data-id"));
}

function updateField() {
  const filings = Array.from(document.querySelectorAll('[data-filings="1"]'));
  const filingDots = Array.from(document.querySelectorAll('[data-filings-dot="1"]'));
  const magnets = state.magnets.filter((m) => m.visible);

  filings.forEach((seg) => {
    const x = Number(seg.getAttribute("data-cx"));
    const y = Number(seg.getAttribute("data-cy"));
    const f = fieldAt(x, y, magnets);
    const len = clamp(8 + f.mag * 13000, 7, 18);
    const dx = Math.cos(f.angle) * len;
    const dy = Math.sin(f.angle) * len;

    seg.setAttribute("x1", (x - dx).toFixed(2));
    seg.setAttribute("y1", (y - dy).toFixed(2));
    seg.setAttribute("x2", (x + dx).toFixed(2));
    seg.setAttribute("y2", (y + dy).toFixed(2));
    seg.setAttribute("opacity", clamp(0.14 + f.mag * 16000, 0.14, 0.95).toFixed(2));
    seg.setAttribute("stroke-width", clamp(1.2 + f.mag * 26000, 1.2, 3.6).toFixed(2));
  });

  filingDots.forEach((dot) => {
    const x = Number(dot.getAttribute("data-cx"));
    const y = Number(dot.getAttribute("data-cy"));
    const f = fieldAt(x, y, magnets);
    const normalized = clamp(f.mag * 18500, 0, 1);
    const density = Math.pow(normalized, 1.5);

    dot.setAttribute("opacity", (0.015 + density * 0.7).toFixed(3));
    dot.setAttribute("r", (0.9 + density * 1.15).toFixed(2));
  });
}

function fieldAt(x, y, magnets) {
  let fx = 0;
  let fy = 0;
  magnets.forEach((m) => {
    getPoles(m).forEach((p) => {
      const dx = x - p.x;
      const dy = y - p.y;
      const r2 = Math.max(700, dx * dx + dy * dy);
      const inv = p.q / (r2 * Math.sqrt(r2));
      fx += dx * inv;
      fy += dy * inv;
    });
  });
  return { angle: Math.atan2(fy, fx), mag: Math.hypot(fx, fy) };
}

function getPoles(m) {
  const a = (m.rot || 0) * Math.PI / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const d = m.w * 0.25;
  return [
    { x: m.x - ux * d, y: m.y - uy * d, q: 1 },
    { x: m.x + ux * d, y: m.y + uy * d, q: -1 }
  ];
}

function getMagnet(id) {
  return state.magnets.find((m) => m.id === id);
}

function resetAll() {
  state.polarity = "gleich";
  state.magnets = [
    { id: "m1", x: 350, y: 300, w: 220, h: 72, rot: 0, visible: true },
    { id: "m2", x: 650, y: 300, w: 220, h: 72, rot: 180, visible: false }
  ];
  document.getElementById("distanceRange").value = 240;
  document.getElementById("distanceValue").textContent = "240";
  applyMode("A1");
}

init();
