const LAMPS = [
  { name: "Lampe A", resistance: 3 },
  { name: "Lampe B", resistance: 6 },
  { name: "Lampe C", resistance: 9 }
];

const TASKS = {
  V1: [
    "Schließe verschiedene Lampen an die gleiche Quelle an und vergleiche die Stromstärke.",
    "Nutze die gleiche Lampe mit 2, 3 und 4 Zellen und beobachte die Änderung der Stromstärke.",
    "Formuliere die drei Regeln aus dem Versuch (gleich/verschieden bei Lampe und Quelle)."
  ],
  V2: [
    "Baue die Reihenschaltung mit zwei identischen Lampen nach.",
    "Starte mit geöffnetem Schalter: rotes Voltmeter zeigt die Quellspannung, Lampenvoltmeter zeigen 0 V.",
    "Schließe den Schalter und vergleiche: Beide Lampenvoltmeter zeigen die gleiche Teilspannung."
  ],
  V3: [
    "Ersetze die Lampen durch einen Draht und lasse das Voltmeter am Draht entlang wandern.",
    "Verändere die Quellspannung und beobachte die Teilspannung.",
    "Beschreibe: Je länger das Drahtstück zwischen Messpunkten, desto größer die gemessene Teilspannung."
  ]
};

const NOTE = {
  V1: "Modellannahme: I = U / R mit U = 1,5 V pro Zelle.",
  V2: "Bei geschlossenem Schalter teilen zwei gleiche Lampen die Quellspannung etwa halb auf.",
  V3: "Die Spannung steigt entlang eines gleichmäßigen Drahts annähernd linear mit der Strecke an."
};

const state = {
  mode: "V1",
  lampIndex: 0,
  cells: 2,
  switchClosed: false,
  lampNominal: 3,
  sourceV2: 6,
  sourceV3: 6,
  tap: 50
};

function init() {
  bindUI();
  render();
}

function bindUI() {
  document.getElementById("modeV1Btn").addEventListener("click", () => setMode("V1"));
  document.getElementById("modeV2Btn").addEventListener("click", () => setMode("V2"));
  document.getElementById("modeV3Btn").addEventListener("click", () => setMode("V3"));

  document.getElementById("lampTypeSelect").addEventListener("change", (e) => {
    state.lampIndex = Number(e.target.value);
    renderV1();
  });

  document.getElementById("cellsRange").addEventListener("input", (e) => {
    state.cells = Number(e.target.value);
    renderV1();
  });

  document.getElementById("lampNominalRange").addEventListener("input", (e) => {
    state.lampNominal = Number(e.target.value);
    if (state.sourceV2 < state.lampNominal * 2) state.sourceV2 = state.lampNominal * 2;
    document.getElementById("sourceRange").value = String(state.sourceV2);
    renderV2();
  });

  document.getElementById("sourceRange").addEventListener("input", (e) => {
    state.sourceV2 = Number(e.target.value);
    renderV2();
  });

  document.getElementById("switchBtn").addEventListener("click", () => {
    state.switchClosed = !state.switchClosed;
    renderV2();
  });

  document.getElementById("sourceV3Range").addEventListener("input", (e) => {
    state.sourceV3 = Number(e.target.value);
    renderV3();
  });

  document.getElementById("tapRange").addEventListener("input", (e) => {
    state.tap = Number(e.target.value);
    renderV3();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    state.mode = "V1";
    state.lampIndex = 0;
    state.cells = 2;
    state.switchClosed = false;
    state.lampNominal = 3;
    state.sourceV2 = 6;
    state.sourceV3 = 6;
    state.tap = 50;

    document.getElementById("lampTypeSelect").value = "0";
    document.getElementById("cellsRange").value = "2";
    document.getElementById("lampNominalRange").value = "3";
    document.getElementById("sourceRange").value = "6";
    document.getElementById("sourceV3Range").value = "6";
    document.getElementById("tapRange").value = "50";
    render();
  });
}

function setMode(mode) {
  state.mode = mode;
  render();
}

function render() {
  ["V1", "V2", "V3"].forEach((m) => {
    document.getElementById(`mode${m}`).hidden = state.mode !== m;
    document.getElementById(`mode${m}Btn`).classList.toggle("primary", state.mode === m);
  });

  document.getElementById("subtitle").textContent =
    state.mode === "V1" ? "V1 – Stromstärke messen" : state.mode === "V2" ? "V2 – Reihenschaltung" : "V3 – Teilspannung am Draht";

  renderTasks();
  renderV1();
  renderV2();
  renderV3();
}

function renderV1() {
  const lamp = LAMPS[state.lampIndex];
  const voltage = state.cells * 1.5;
  const current = voltage / lamp.resistance;
  document.getElementById("cellsValue").textContent = `${state.cells} Zellen (${voltage.toFixed(1)} V)`;
  document.getElementById("ammeterValue").textContent = current.toFixed(2);
}

function renderV2() {
  const source = state.sourceV2;
  const lampVoltage = state.switchClosed ? source / 2 : 0;
  document.getElementById("lampNominalValue").textContent = `${state.lampNominal.toFixed(1)} V`;
  document.getElementById("sourceValue").textContent = `${source.toFixed(1)} V`;
  document.getElementById("switchBtn").textContent = `Schalter: ${state.switchClosed ? "geschlossen" : "offen"}`;
  document.getElementById("vSource").textContent = source.toFixed(1);
  document.getElementById("vLamp1").textContent = lampVoltage.toFixed(1);
  document.getElementById("vLamp2").textContent = lampVoltage.toFixed(1);
}

function renderV3() {
  const partial = state.sourceV3 * (state.tap / 100);
  document.getElementById("sourceV3Value").textContent = `${state.sourceV3.toFixed(1)} V`;
  document.getElementById("tapValue").textContent = `${state.tap} % der Drahtlänge`;
  document.getElementById("partialValue").textContent = partial.toFixed(1);
  document.getElementById("tapMarker").style.left = `${state.tap}%`;
}

function renderTasks() {
  const wrap = document.getElementById("tasks");
  wrap.innerHTML = "";
  TASKS[state.mode].forEach((t, i) => {
    const div = document.createElement("div");
    div.className = "taskItem";
    div.textContent = `${i + 1}) ${t}`;
    wrap.appendChild(div);
  });
  document.getElementById("note").textContent = NOTE[state.mode];
}

init();
