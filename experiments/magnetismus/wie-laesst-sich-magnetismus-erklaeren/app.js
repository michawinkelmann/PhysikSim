const NS = "http://www.w3.org/2000/svg";

const state = {
  stepIndex: 0,
  panelCollapsed: false,
  answers: {},
  model: {
    needleMagnetization: 0,
    clipAttraction: 0,
    heated: false,
    struck: false,
    splitMagnet: false,
    nailForce: 0
  }
};

const steps = [
  {
    title: "A1/A2: Magnetisieren",
    hint: "Streiche die Nadel mehrfach in eine Richtung und nähere sie der Büroklammer.",
    materials: ["Magnet", "Stricknadel", "Büroklammer"],
    checklist: [
      "Schritt 1: Streiche mit dem Magneten mehrfach in eine Richtung über die Stricknadel.",
      "Schritt 2: Nähere die Stricknadel der Büroklammer."
    ],
    tasks: [
      { id: "s1_obs", type: "text", prompt: "Notiere deine Beobachtung nach Schritt 1 und 2.", placeholder: "Beobachtung..." },
      { id: "s1_mc", type: "mcq", prompt: "Wo ist die magnetische Wirkung an einem Stabmagneten meist am stärksten?", options: ["In der Mitte", "An den Polen/Enden"], correct: 1 }
    ]
  },
  {
    title: "A3/A4: Entmagnetisieren durch Wärme",
    hint: "Erhitze die Nadel in der Flamme und prüfe erneut die Anziehung.",
    materials: ["Magnetisierte Stricknadel", "Kerze", "Zange", "Büroklammer"],
    checklist: [
      "Schritt 3: Halte die Stricknadel mit der Zange einige Minuten in die Kerzenflamme.",
      "Schritt 4: Nähere die Stricknadel erneut der Büroklammer."
    ],
    tasks: [
      { id: "s2_obs", type: "textcheck", minChars: 35, prompt: "Beschreibe den Vorgang des Entmagnetisierens.", placeholder: "Beim Erhitzen ..." }
    ]
  },
  {
    title: "A5/A6: Wiederholen und Schlagen",
    hint: "Magnetisiere erneut und schlage die Nadel mehrmals auf den Tisch.",
    materials: ["Magnet", "Stricknadel", "Büroklammer", "Tisch"],
    checklist: [
      "Schritt 5: Wiederhole Schritt 1 und Schritt 2.",
      "Schritt 6: Schlage die Stricknadel einige Male auf den Tisch und prüfe erneut."
    ],
    tasks: [
      { id: "s3_mc", type: "mcq", prompt: "Was passiert mit der Ordnung der Elementarmagnete beim Schlagen?", options: ["Sie ordnen sich stärker", "Sie geraten wieder ungeordnet"], correct: 1 },
      { id: "s3_conclusion", type: "textcheck", minChars: 45, prompt: "Ziehe eine Schlussfolgerung zum Magnetisieren und Entmagnetisieren.", placeholder: "Schlussfolgerung..." }
    ]
  },
  {
    title: "B: Aus zwei mach eins",
    hint: "Teile den magnetisierten Draht und bringe Nord- und Südpol zusammen.",
    materials: ["Eisendraht", "Kneifzange", "2 Stabmagnete", "Büroklammer", "großer Eisennagel"],
    checklist: [
      "Schritt 1/2: Magnetisiere den Draht, teile ihn und teste die Enden an Büroklammern.",
      "Schritt 3/4: Lege Nord- und Südpol zusammen und halte den Nagel an die Berührungsstelle."
    ],
    tasks: [
      { id: "s4_obs", type: "text", prompt: "Was beobachtest du an der Berührungsstelle von Nord- und Südpol?", placeholder: "Beobachtung..." },
      { id: "s4_model", type: "mcq", prompt: "Warum kann die Berührungsstelle den Nagel stark anziehen?", options: ["Die Feldlinien bündeln sich dort", "Dort gibt es gar kein Feld"], correct: 0 }
    ]
  }
];

function init(){
  bindUI();
  updateStepper();
  renderStep();
}

function bindUI(){
  document.getElementById("resetBtn").addEventListener("click", resetAll);
  document.getElementById("nextStep").addEventListener("click", ()=>setStep((state.stepIndex + 1) % steps.length));
  document.getElementById("checkBtn").addEventListener("click", checkTasks);

  document.getElementById("panelToggle").addEventListener("click", ()=>{
    state.panelCollapsed = !state.panelCollapsed;
    document.getElementById("panel").setAttribute("data-collapsed", String(state.panelCollapsed));
    document.getElementById("panelToggle").textContent = state.panelCollapsed ? "Aufgaben ▼" : "Aufgaben ▲";
  });

  document.getElementById("helpBtn").addEventListener("click", ()=> document.getElementById("helpModal").hidden = false);
  document.getElementById("closeHelp").addEventListener("click", ()=> document.getElementById("helpModal").hidden = true);

  document.getElementById("actionBtnA").addEventListener("click", primaryAction);
  document.getElementById("actionBtnB").addEventListener("click", secondaryAction);
}

function setStep(index){
  state.stepIndex = index;
  document.getElementById("taskFeedback").hidden = true;
  document.getElementById("taskFeedback").textContent = "";
  updateStepper();
  renderStep();
}

function updateStepper(){
  const stepper = document.getElementById("stepper");
  stepper.innerHTML = "";
  steps.forEach((step, i)=>{
    const btn = document.createElement("button");
    btn.className = `step ${i===state.stepIndex ? "active" : ""}`;
    btn.textContent = `${i+1}. ${step.title}`;
    btn.addEventListener("click", ()=>setStep(i));
    stepper.appendChild(btn);
  });
  document.getElementById("subtitle").textContent = `Schritt ${state.stepIndex + 1} von ${steps.length}`;
}

function renderStep(){
  const step = steps[state.stepIndex];
  document.getElementById("stageHint").textContent = step.hint;

  const m = document.getElementById("materials");
  m.innerHTML = "";
  step.materials.forEach(item=>{
    const li = document.createElement("li");
    li.textContent = item;
    m.appendChild(li);
  });

  const cl = document.getElementById("checklist");
  cl.innerHTML = "";
  step.checklist.forEach(item=>{
    const row = document.createElement("label");
    row.className = "checkitem";
    const box = document.createElement("input");
    box.type = "checkbox";
    row.append(box, document.createTextNode(item));
    cl.appendChild(row);
  });

  renderTasks();
  renderScene();
  updateActionButtons();
}

function renderTasks(){
  const tasks = steps[state.stepIndex].tasks;
  const target = document.getElementById("tasks");
  target.innerHTML = "";

  tasks.forEach(task=>{
    const wrap = document.createElement("div");
    wrap.className = "task";
    const p = document.createElement("div");
    p.style.fontWeight = "700";
    p.style.marginTop = "10px";
    p.textContent = task.prompt;
    wrap.appendChild(p);

    if(task.type === "text" || task.type === "textcheck"){
      const ta = document.createElement("textarea");
      ta.placeholder = task.placeholder || "";
      ta.value = state.answers[task.id] || "";
      ta.addEventListener("input", ()=>state.answers[task.id] = ta.value);
      wrap.appendChild(ta);
    }

    if(task.type === "mcq"){
      const box = document.createElement("div");
      box.className = "choiceGrid";
      task.options.forEach((opt, idx)=>{
        const b = document.createElement("button");
        b.className = "btn";
        b.textContent = opt;
        b.addEventListener("click", ()=>{
          state.answers[task.id] = idx;
          b.style.borderColor = "rgba(37,99,235,.4)";
        });
        box.appendChild(b);
      });
      wrap.appendChild(box);
    }

    target.appendChild(wrap);
  });
}

function checkTasks(){
  const tasks = steps[state.stepIndex].tasks;
  let correct = 0;
  let total = 0;

  tasks.forEach(task=>{
    if(task.type === "mcq"){
      total += 1;
      if(state.answers[task.id] === task.correct) correct += 1;
    }
    if(task.type === "textcheck"){
      total += 1;
      const len = (state.answers[task.id] || "").trim().length;
      if(len >= (task.minChars || 20)) correct += 1;
    }
  });

  const feedback = document.getElementById("taskFeedback");
  feedback.hidden = false;
  feedback.textContent = total === 0
    ? "Deine Beobachtung ist gespeichert. Vergleiche sie mit dem Modell der Elementarmagnete."
    : `Ergebnis: ${correct}/${total} passend. Tipp: Beziehe dich auf geordnete bzw. ungeordnete Elementarmagnete.`;
}

function updateActionButtons(){
  const a = document.getElementById("actionBtnA");
  const b = document.getElementById("actionBtnB");

  if(state.stepIndex === 0){
    a.hidden = false; b.hidden = false;
    a.textContent = "Nadel magnetisieren";
    b.textContent = "Büroklammer testen";
  } else if(state.stepIndex === 1){
    a.hidden = false; b.hidden = false;
    a.textContent = "Nadel erhitzen";
    b.textContent = "Erneut prüfen";
  } else if(state.stepIndex === 2){
    a.hidden = false; b.hidden = false;
    a.textContent = "Neu magnetisieren";
    b.textContent = "Nadel auf Tisch schlagen";
  } else {
    a.hidden = false; b.hidden = false;
    a.textContent = "Draht teilen";
    b.textContent = "Pole zusammenführen";
  }
}

function primaryAction(){
  if(state.stepIndex === 0){
    state.model.needleMagnetization = Math.min(100, state.model.needleMagnetization + 35);
    stageMessage("Die Elementarmagnete richten sich stärker aus.");
  }
  if(state.stepIndex === 1){
    state.model.heated = true;
    state.model.needleMagnetization = Math.max(0, state.model.needleMagnetization - 55);
    stageMessage("Durch Wärme verlieren viele Bereiche ihre gemeinsame Ausrichtung.");
  }
  if(state.stepIndex === 2){
    state.model.needleMagnetization = 85;
    state.model.struck = false;
    stageMessage("Die Nadel ist wieder deutlich magnetisiert.");
  }
  if(state.stepIndex === 3){
    state.model.splitMagnet = true;
    stageMessage("Aus dem Draht sind zwei kleinere Magnete entstanden.");
  }
  renderScene();
}

function secondaryAction(){
  if(state.stepIndex === 0){
    state.model.clipAttraction = state.model.needleMagnetization;
    stageMessage(state.model.clipAttraction > 40 ? "Die Büroklammer wird angezogen." : "Noch schwach: streiche öfter in einer Richtung.");
  }
  if(state.stepIndex === 1){
    state.model.clipAttraction = state.model.needleMagnetization;
    stageMessage(state.model.clipAttraction < 35 ? "Nach dem Erhitzen ist die Anziehung deutlich kleiner." : "Es wirkt noch etwas Magnetismus.");
  }
  if(state.stepIndex === 2){
    state.model.struck = true;
    state.model.needleMagnetization = Math.max(10, state.model.needleMagnetization - 50);
    stageMessage("Durch Erschütterung wird die Ordnung wieder gestört.");
  }
  if(state.stepIndex === 3){
    state.model.nailForce = state.model.splitMagnet ? 95 : 20;
    stageMessage(state.model.splitMagnet ? "An der Berührungsstelle ist die Wirkung auf den Nagel stark." : "Teile zuerst den Draht für zwei Pole.");
  }
  renderScene();
}

function stageMessage(text){
  document.getElementById("stageFeedback").textContent = text;
}

function renderScene(){
  const g = document.getElementById("scene");
  g.innerHTML = "";
  drawLabel(g, steps[state.stepIndex].title);

  if(state.stepIndex < 3){
    drawNeedleScene(g);
  } else {
    drawSplitScene(g);
  }
}

function drawLabel(g, text){
  const t = svg("text", { x: 44, y: 54, class: "stageLabel" });
  t.textContent = text;
  g.appendChild(t);
}

function drawNeedleScene(g){
  g.appendChild(svg("rect", { x: 70, y: 380, width: 260, height: 70, rx: 12, fill: "#d1d5db" }));
  g.appendChild(svg("text", { x: 86, y: 425, class: "stageValue" })).textContent = "Büroklammern";

  const level = state.model.needleMagnetization;
  g.appendChild(svg("rect", { x: 220, y: 190, width: 560, height: 22, rx: 11, fill: "#475569" }));
  g.appendChild(svg("circle", { cx: 780, cy: 201, r: 14, fill: "#94a3b8" }));

  g.appendChild(svg("text", { x: 220, y: 160, class: "stageValue" })).textContent = `Magnetisierung: ${Math.round(level)}%`;
  g.appendChild(svg("rect", { x: 220, y: 230, width: 5 * level, height: 20, rx: 8, fill: "#2563eb" }));
  g.appendChild(svg("text", { x: 220, y: 275, class: "stageValue" })).textContent = `Anziehung Büroklammer: ${Math.round(state.model.clipAttraction)}%`;

  if(state.stepIndex === 1){
    g.appendChild(svg("rect", { x: 700, y: 300, width: 90, height: 150, rx: 30, fill: "#f97316" }));
    g.appendChild(svg("polygon", { points: "745,220 720,300 770,300", fill: "#facc15" }));
    g.appendChild(svg("text", { x: 690, y: 485, class: "stageValue" })).textContent = "Kerze";
  }
}

function drawSplitScene(g){
  const left = state.model.splitMagnet ? "#22c55e" : "#9ca3af";
  const right = state.model.splitMagnet ? "#f97316" : "#9ca3af";

  g.appendChild(svg("rect", { x: 160, y: 300, width: 220, height: 64, fill: left }));
  g.appendChild(svg("rect", { x: 380, y: 300, width: 220, height: 64, fill: right }));
  g.appendChild(svg("rect", { x: 600, y: 300, width: 220, height: 64, fill: left }));

  g.appendChild(svg("text", { x: 170, y: 290, class: "stageValue" })).textContent = "N";
  g.appendChild(svg("text", { x: 585, y: 290, class: "stageValue" })).textContent = "S";
  g.appendChild(svg("line", { x1: 600, y1: 200, x2: 600, y2: 300, stroke: "#334155", "stroke-width": 5 }));
  g.appendChild(svg("text", { x: 552, y: 190, class: "stageValue" })).textContent = "Nagel";
  g.appendChild(svg("text", { x: 160, y: 420, class: "stageValue" })).textContent = `Anziehung am Kontaktpunkt: ${Math.round(state.model.nailForce)}%`;
}

function svg(tag, attrs){
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k, v));
  return el;
}

function resetAll(){
  state.stepIndex = 0;
  state.answers = {};
  state.model = {
    needleMagnetization: 0,
    clipAttraction: 0,
    heated: false,
    struck: false,
    splitMagnet: false,
    nailForce: 0
  };
  stageMessage("Simulation zurückgesetzt.");
  updateStepper();
  renderStep();
}

init();
