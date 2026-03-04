const NS = "http://www.w3.org/2000/svg";
const STAGE = { w: 1000, h: 600 };

const EXPERIMENTS = {
  A: {
    title: "Experiment A – Einen Magneten selbst herstellen",
    materials: ["Magnet", "Stricknadel", "Büroklammer", "Kerze", "Zange"],
    steps: [
      "Streiche mit dem Magneten mehrfach in einer Richtung über die Stricknadel.",
      "Nähere die Stricknadel der Büroklammer.",
      "Halte die Stricknadel mit der Zange in die Kerzenflamme.",
      "Nähere die Stricknadel erneut der Büroklammer.",
      "Wiederhole Schritt 1 und Schritt 2.",
      "Schlage die Stricknadel einige Male auf den Tisch und teste erneut."
    ]
  },
  B: {
    title: "Experiment B – Aus zwei mach eins",
    materials: ["Eisendraht", "Kneifzange", "2 Stabmagnete", "Büroklammer", "großer Eisennagel"],
    steps: [
      "Magnetisiere den Draht und schneide ihn mit der Zange in der Mitte durch.",
      "Prüfe beide Drahtstücke jeweils an einer Büroklammer.",
      "Lege die zwei Stabmagnete so, dass sich Nord- und Südpol berühren.",
      "Nähere einen Eisennagel an die Berührungsstelle."
    ]
  }
};

const state = {
  experiment: "A",
  stepIndex: 0,
  panelCollapsed: false,
  dragging: null,
  feedback: "",
  A: {
    magnetization: 0,
    strokes: 0,
    restrokes: 0,
    heated: false,
    clipAttached: false,
    hitCount: 0,
    stepDone: [false, false, false, false, false, false],
    holdMs: 0,
    lastHeatTick: 0,
    needle: { x: 560, y: 210 },
    magnet: { x: 240, y: 210 },
    clip: { x: 260, y: 450 }
  },
  B: {
    magnetized: 0,
    wireCut: false,
    clipLeftAttached: false,
    clipRightAttached: false,
    contactBuilt: false,
    nailAttached: false,
    stepDone: [false, false, false, false],
    wire: { x: 520, y: 230 },
    wireLeft: { x: 470, y: 230 },
    wireRight: { x: 570, y: 230 },
    magnetTool: { x: 240, y: 210 },
    barA: { x: 350, y: 470 },
    barB: { x: 650, y: 470 },
    nail: { x: 500, y: 130 },
    clipLeft: { x: 300, y: 440 },
    clipRight: { x: 720, y: 440 }
  }
};

function init() {
  bindUI();
  render();
}

function bindUI() {
  document.getElementById("resetBtn").addEventListener("click", resetAll);
  document.getElementById("helpBtn").addEventListener("click", () => document.getElementById("helpModal").hidden = false);
  document.getElementById("closeHelp").addEventListener("click", () => document.getElementById("helpModal").hidden = true);
  document.getElementById("nextStepBtn").addEventListener("click", nextStep);
  document.getElementById("panelToggle").addEventListener("click", togglePanel);
  document.getElementById("contextBtn").addEventListener("click", onContextAction);

  const stage = document.getElementById("stage");
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);
}

function render() {
  renderTabs();
  renderStepper();
  renderPanel();
  renderScene();
  renderStatus();
  renderContextButton();
}

function renderTabs() {
  const tabs = document.getElementById("experimentTabs");
  tabs.innerHTML = "";
  Object.entries(EXPERIMENTS).forEach(([key, exp]) => {
    const btn = document.createElement("button");
    btn.className = `step ${state.experiment === key ? "active" : ""}`;
    btn.textContent = exp.title;
    btn.addEventListener("click", () => {
      state.experiment = key;
      state.stepIndex = 0;
      state.feedback = "";
      render();
    });
    tabs.appendChild(btn);
  });
}

function renderStepper() {
  const steps = EXPERIMENTS[state.experiment].steps;
  const done = state[state.experiment].stepDone;
  const el = document.getElementById("stepper");
  el.innerHTML = "";
  steps.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.className = `step ${i === state.stepIndex ? "active" : ""}`;
    btn.textContent = `${i + 1}${done[i] ? " ✓" : ""}`;
    btn.addEventListener("click", () => {
      if (i <= maxUnlockedStep()) {
        state.stepIndex = i;
        render();
      }
    });
    el.appendChild(btn);
  });
  document.getElementById("subtitle").textContent = `${EXPERIMENTS[state.experiment].title} · Schritt ${state.stepIndex + 1}`;
}

function renderPanel() {
  document.getElementById("panel").setAttribute("data-collapsed", String(state.panelCollapsed));
  document.getElementById("panelToggle").textContent = state.panelCollapsed ? "Aufgaben ▼" : "Aufgaben ▲";
  const m = document.getElementById("materials");
  m.innerHTML = "";
  EXPERIMENTS[state.experiment].materials.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    m.appendChild(li);
  });

  const ins = document.getElementById("instructions");
  ins.innerHTML = "";
  EXPERIMENTS[state.experiment].steps.forEach((text, i) => {
    const row = document.createElement("div");
    row.className = `check ${state[state.experiment].stepDone[i] ? "done" : ""}`;
    row.textContent = `Schritt ${i + 1}: ${text}`;
    ins.appendChild(row);
  });
}

function renderStatus() {
  document.getElementById("statusText").textContent = state.feedback || "Führe den aktuellen Schritt auf der Bühne aus.";
  document.getElementById("stageFeedback").textContent = state.feedback || "";
}

function renderContextButton() {
  const btn = document.getElementById("contextBtn");
  btn.hidden = true;
  if (state.experiment === "A" && state.stepIndex === 5) {
    btn.hidden = false;
    btn.textContent = "Auf Tisch schlagen";
  }
  if (state.experiment === "B" && state.stepIndex === 0) {
    btn.hidden = false;
    btn.textContent = "Draht in der Mitte durchschneiden";
  }
}

function maxUnlockedStep() {
  const done = state[state.experiment].stepDone;
  let idx = 0;
  while (idx < done.length && done[idx]) idx += 1;
  return Math.min(idx, done.length - 1);
}

function nextStep() {
  const done = state[state.experiment].stepDone;
  if (!done[state.stepIndex]) {
    state.feedback = "Dieser Schritt ist noch nicht erfüllt.";
    renderStatus();
    return;
  }
  if (state.stepIndex < done.length - 1) {
    state.stepIndex += 1;
    state.feedback = "";
    render();
  } else {
    state.feedback = "Experiment abgeschlossen. Du kannst jetzt Beobachtungen notieren oder resetten.";
    renderStatus();
  }
}

function onContextAction() {
  if (state.experiment === "A" && state.stepIndex === 5) {
    applyNeedleHit();
  }
  if (state.experiment === "B" && state.stepIndex === 0) {
    const b = state.B;
    if (b.magnetized < 55) {
      state.feedback = "Magnetisiere den Draht zuerst durch mehrfaches Streichen.";
    } else {
      b.wireCut = true;
      b.stepDone[0] = true;
      state.feedback = "Draht wurde geteilt: Es sind zwei kleinere Magnete entstanden.";
    }
  }
  render();
}

function onDown(evt) {
  const target = evt.target.closest("[data-drag]");
  if (!target) return;
  const key = target.dataset.drag;
  const pos = getPos(key);
  if (!pos) return;
  const p = svgPoint(evt);
  state.dragging = { key, dx: pos.x - p.x, dy: pos.y - p.y, pointerId: evt.pointerId };
  target.setPointerCapture(evt.pointerId);
}

function onMove(evt) {
  if (!state.dragging) return;
  const p = svgPoint(evt);
  const key = state.dragging.key;
  const pos = getPos(key);
  pos.x = clamp(p.x + state.dragging.dx, 80, 920);
  pos.y = clamp(p.y + state.dragging.dy, 90, 550);
  applyPhysics();
  renderScene();
}

function onUp() {
  if (!state.dragging) return;
  if (state.experiment === "A" && state.stepIndex === 5 && state.dragging.key === "needle") {
    const a = state.A;
    if (a.needle.y >= 500) applyNeedleHit();
  }
  state.dragging = null;
  applyPhysics();
  render();
}

function applyPhysics() {
  if (state.experiment === "A") updateA();
  else updateB();
}

function updateA() {
  const a = state.A;
  const step = state.stepIndex;

  if (step === 0 || step === 4) {
    if (a.magnet.x > 640 && Math.abs(a.magnet.y - a.needle.y) < 30) {
      const gain = step === 0 ? 14 : 18;
      a.magnetization = Math.min(100, a.magnetization + gain);
      if (step === 0) a.strokes += 1;
      if (step === 4) a.restrokes += 1;
      a.magnet.x = 240;
      if (step === 0) {
        state.feedback = `Streichbewegung ${a.strokes}/4.`;
      } else {
        state.feedback = `Erneut magnetisiert: ${a.restrokes}/3 Streichbewegungen.`;
      }
      if (step === 0 && a.strokes >= 4) {
        a.stepDone[0] = true;
        state.feedback = "Die Nadel ist nun magnetisiert.";
      }
    }
  }

  const nearClip = distance(a.needle, a.clip) < 90;
  if ((step === 1 || step === 4) && nearClip && a.magnetization > 45) {
    a.clipAttached = true;
    a.clip.x = a.needle.x - 70;
    a.clip.y = a.needle.y + 20;
    if (step === 1) a.stepDone[1] = true;
    if (step === 4 && a.restrokes >= 2) a.stepDone[4] = true;
    state.feedback = "Die Büroklammer wird angezogen.";
  }

  if (step === 3 && nearClip) {
    if (a.magnetization < 35) {
      a.clipAttached = false;
      a.stepDone[3] = true;
      state.feedback = "Nach dem Erhitzen ist die Anziehung fast verschwunden.";
    } else {
      state.feedback = "Die Nadel ist noch zu stark magnetisiert. Erhitze länger.";
    }
  }

  if (step === 2) {
    const inFlame = a.needle.x > 710 && a.needle.x < 810 && a.needle.y > 250 && a.needle.y < 430;
    const now = performance.now();
    if (!a.lastHeatTick) a.lastHeatTick = now;
    if (inFlame) {
      a.holdMs += now - a.lastHeatTick;
      a.magnetization = Math.max(0, a.magnetization - 0.06 * (now - a.lastHeatTick));
      state.feedback = `Erhitzen läuft: ${Math.min(100, Math.round((a.holdMs / 1800) * 100))}%`;
      if (a.holdMs >= 1800) {
        a.stepDone[2] = true;
        state.feedback = "Erhitzen abgeschlossen. Die Nadel ist weitgehend entmagnetisiert.";
      }
    }
    a.lastHeatTick = now;
  }

  if (a.clipAttached && step === 5 && a.magnetization < 30) {
    a.clipAttached = false;
  }
}

function updateB() {
  const b = state.B;
  const step = state.stepIndex;

  if (step === 0 && !b.wireCut && b.magnetTool.x > 620 && Math.abs(b.magnetTool.y - b.wire.y) < 28) {
    b.magnetized = Math.min(100, b.magnetized + 12);
    b.magnetTool.x = 240;
    state.feedback = `Draht magnetisiert: ${Math.round(b.magnetized)}%.`;
  }

  if (step === 1 && b.wireCut) {
    if (distance(b.wireLeft, b.clipLeft) < 90) {
      b.clipLeftAttached = true;
      b.clipLeft.x = b.wireLeft.x - 55;
      b.clipLeft.y = b.wireLeft.y + 20;
    }
    if (distance(b.wireRight, b.clipRight) < 90) {
      b.clipRightAttached = true;
      b.clipRight.x = b.wireRight.x - 55;
      b.clipRight.y = b.wireRight.y + 20;
    }
    if (b.clipLeftAttached && b.clipRightAttached) {
      b.stepDone[1] = true;
      state.feedback = "Beide Drahtstücke wirken wie Magnete und ziehen Büroklammern an.";
    }
  }

  if (step === 2) {
    const contact = Math.abs(b.barA.x + 100 - (b.barB.x - 100)) < 22 && Math.abs(b.barA.y - b.barB.y) < 16;
    b.contactBuilt = contact;
    if (contact) {
      b.stepDone[2] = true;
      state.feedback = "Nord- und Südpol berühren sich.";
    }
  }

  if (step === 3 && b.contactBuilt) {
    const contactPoint = { x: (b.barA.x + b.barB.x) / 2, y: b.barA.y };
    if (distance(b.nail, contactPoint) < 80) {
      b.nailAttached = true;
      b.nail.x = contactPoint.x;
      b.nail.y = contactPoint.y - 110;
      b.stepDone[3] = true;
      state.feedback = "Der Nagel wird an der Berührungsstelle stark angezogen.";
    }
  }
}

function renderScene() {
  const g = document.getElementById("scene");
  g.innerHTML = "";
  if (state.experiment === "A") drawSceneA(g);
  else drawSceneB(g);
}

function drawSceneA(g) {
  const a = state.A;
  g.appendChild(svg("text", { x: 40, y: 52, class: "stageText" })).textContent = `A · Schritt ${state.stepIndex + 1}`;
  g.appendChild(svg("rect", { x: 0, y: 500, width: 1000, height: 100, fill: "#d6c6ad" }));

  g.appendChild(svg("rect", { x: 720, y: 320, width: 90, height: 160, rx: 36, fill: "#e76f51" }));
  g.appendChild(svg("polygon", { points: "765,250 740,320 790,320", fill: "#fbbf24" }));
  g.appendChild(svg("text", { x: 708, y: 520, class: "label" })).textContent = "Kerze";

  const needle = group("needle", a.needle.x, a.needle.y);
  needle.appendChild(svg("line", { x1: -170, y1: 0, x2: 170, y2: 0, stroke: "#64748b", "stroke-width": 10, "stroke-linecap": "round" }));
  needle.appendChild(svg("circle", { cx: -170, cy: 0, r: 10, fill: "#94a3b8" }));
  g.appendChild(needle);

  const magnet = group("magnet", a.magnet.x, a.magnet.y);
  magnet.appendChild(svg("rect", { x: -75, y: -25, width: 75, height: 50, rx: 10, fill: "#ef4444" }));
  magnet.appendChild(svg("rect", { x: 0, y: -25, width: 75, height: 50, rx: 10, fill: "#16a34a" }));
  magnet.appendChild(svg("text", { x: -38, y: 7, class: "label", fill: "white" })).textContent = "N";
  magnet.appendChild(svg("text", { x: 38, y: 7, class: "label", fill: "white" })).textContent = "S";
  g.appendChild(magnet);

  const clip = group("clip", a.clip.x, a.clip.y);
  clip.appendChild(svg("rect", { x: -18, y: -18, width: 36, height: 36, rx: 7, fill: "#9ca3af" }));
  g.appendChild(clip);

  g.appendChild(svg("text", { x: 40, y: 92, class: "label" })).textContent = `Magnetisierung der Nadel: ${Math.round(a.magnetization)}%`;
}

function drawSceneB(g) {
  const b = state.B;
  g.appendChild(svg("text", { x: 40, y: 52, class: "stageText" })).textContent = `B · Schritt ${state.stepIndex + 1}`;
  g.appendChild(svg("rect", { x: 0, y: 500, width: 1000, height: 100, fill: "#d6c6ad" }));

  if (!b.wireCut) {
    const wire = group("wire", b.wire.x, b.wire.y);
    wire.appendChild(svg("line", { x1: -180, y1: 0, x2: 180, y2: 0, stroke: "#64748b", "stroke-width": 10, "stroke-linecap": "round" }));
    g.appendChild(wire);
  } else {
    const left = group("wireLeft", b.wireLeft.x, b.wireLeft.y);
    left.appendChild(svg("line", { x1: -120, y1: 0, x2: 30, y2: 0, stroke: "#64748b", "stroke-width": 10, "stroke-linecap": "round" }));
    g.appendChild(left);
    const right = group("wireRight", b.wireRight.x, b.wireRight.y);
    right.appendChild(svg("line", { x1: -30, y1: 0, x2: 120, y2: 0, stroke: "#64748b", "stroke-width": 10, "stroke-linecap": "round" }));
    g.appendChild(right);
  }

  const tool = group("magnetTool", b.magnetTool.x, b.magnetTool.y);
  tool.appendChild(svg("rect", { x: -75, y: -25, width: 75, height: 50, rx: 10, fill: "#ef4444" }));
  tool.appendChild(svg("rect", { x: 0, y: -25, width: 75, height: 50, rx: 10, fill: "#16a34a" }));
  tool.appendChild(svg("text", { x: -38, y: 7, class: "label", fill: "white" })).textContent = "N";
  tool.appendChild(svg("text", { x: 38, y: 7, class: "label", fill: "white" })).textContent = "S";
  g.appendChild(tool);

  const barA = group("barA", b.barA.x, b.barA.y);
  barA.appendChild(svg("rect", { x: -100, y: -25, width: 200, height: 50, fill: "#22c55e" }));
  barA.appendChild(svg("text", { x: -80, y: 7, class: "label" })).textContent = "N";
  barA.appendChild(svg("text", { x: 60, y: 7, class: "label" })).textContent = "S";
  g.appendChild(barA);

  const barB = group("barB", b.barB.x, b.barB.y);
  barB.appendChild(svg("rect", { x: -100, y: -25, width: 200, height: 50, fill: "#f97316" }));
  barB.appendChild(svg("text", { x: -80, y: 7, class: "label" })).textContent = "N";
  barB.appendChild(svg("text", { x: 60, y: 7, class: "label" })).textContent = "S";
  g.appendChild(barB);

  const nail = group("nail", b.nail.x, b.nail.y);
  nail.appendChild(svg("line", { x1: 0, y1: -80, x2: 0, y2: 40, stroke: "#475569", "stroke-width": 11, "stroke-linecap": "round" }));
  g.appendChild(nail);

  const clipLeft = group("clipLeft", b.clipLeft.x, b.clipLeft.y);
  clipLeft.appendChild(svg("rect", { x: -16, y: -16, width: 32, height: 32, rx: 6, fill: "#9ca3af" }));
  g.appendChild(clipLeft);
  const clipRight = group("clipRight", b.clipRight.x, b.clipRight.y);
  clipRight.appendChild(svg("rect", { x: -16, y: -16, width: 32, height: 32, rx: 6, fill: "#9ca3af" }));
  g.appendChild(clipRight);

  g.appendChild(svg("text", { x: 40, y: 92, class: "label" })).textContent = `Magnetisierung Draht: ${Math.round(b.magnetized)}%`;
}

function getPos(key) {
  const a = state.A;
  const b = state.B;
  const map = { needle: a.needle, magnet: a.magnet, clip: a.clip, wire: b.wire, wireLeft: b.wireLeft, wireRight: b.wireRight, magnetTool: b.magnetTool, barA: b.barA, barB: b.barB, nail: b.nail, clipLeft: b.clipLeft, clipRight: b.clipRight };
  return map[key];
}

function togglePanel() {
  state.panelCollapsed = !state.panelCollapsed;
  renderPanel();
}

function resetAll() {
  state.experiment = "A";
  state.stepIndex = 0;
  state.feedback = "Alles wurde zurückgesetzt.";
  Object.assign(state.A, {
    magnetization: 0, strokes: 0, restrokes: 0, heated: false, clipAttached: false, hitCount: 0, stepDone: [false, false, false, false, false, false], holdMs: 0, lastHeatTick: 0,
    needle: { x: 560, y: 210 }, magnet: { x: 240, y: 210 }, clip: { x: 260, y: 450 }
  });
  Object.assign(state.B, {
    magnetized: 0, wireCut: false, clipLeftAttached: false, clipRightAttached: false, contactBuilt: false, nailAttached: false,
    stepDone: [false, false, false, false], wire: { x: 520, y: 230 }, wireLeft: { x: 470, y: 230 }, wireRight: { x: 570, y: 230 },
    magnetTool: { x: 240, y: 210 }, barA: { x: 350, y: 470 }, barB: { x: 650, y: 470 }, nail: { x: 500, y: 130 }, clipLeft: { x: 300, y: 440 }, clipRight: { x: 720, y: 440 }
  });
  render();
}

function svgPoint(evt) {
  const stage = document.getElementById("stage");
  const pt = stage.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(stage.getScreenCTM().inverse());
}

function group(key, x, y) {
  const g = svg("g", { transform: `translate(${x} ${y})`, "data-drag": key, style: "cursor: grab;" });
  return g;
}

function svg(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function applyNeedleHit() {
  const a = state.A;
  a.hitCount += 1;
  a.magnetization = Math.max(0, a.magnetization - 25);
  state.feedback = `Schlag ${a.hitCount}/3 ausgeführt.`;
  if (a.hitCount >= 3) {
    a.stepDone[5] = true;
    a.clipAttached = false;
    state.feedback = "Durch Erschütterung ist die Nadel deutlich entmagnetisiert.";
  }
}

init();
