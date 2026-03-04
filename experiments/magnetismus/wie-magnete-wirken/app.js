const state = {
  tab: "A",
  A: { rows: [], magneticMaterials: new Set() },
  B: { rows: [], magneticMetals: new Set() },
  C: { trial: 1, threshold: randomThreshold(), rows: [] },
  D: { rows: [], pass: 0, shield: 0 }
};

const objectsA = [
  { name: "Büroklammer", material: "Stahl", magnetic: true },
  { name: "Münze", material: "Kupfer/Nickel", magnetic: false },
  { name: "Radiergummi", material: "Kunststoff", magnetic: false },
  { name: "Schraube", material: "Eisen", magnetic: true },
  { name: "Holzstab", material: "Holz", magnetic: false },
  { name: "Alufolie", material: "Aluminium", magnetic: false },
  { name: "Nagel", material: "Eisen", magnetic: true },
  { name: "Glasmurmel", material: "Glas", magnetic: false },
  { name: "Unterlegscheibe", material: "Stahl", magnetic: true },
  { name: "Bleistift", material: "Holz/Graphit", magnetic: false }
];

const objectsB = [
  { name: "Eisennagel", metal: "Eisen", magnetic: true },
  { name: "Stahlschraube", metal: "Stahl", magnetic: true },
  { name: "Kupferdraht", metal: "Kupfer", magnetic: false },
  { name: "Messingschraube", metal: "Messing", magnetic: false },
  { name: "Alublech", metal: "Aluminium", magnetic: false },
  { name: "Silberkette", metal: "Silber", magnetic: false }
];

const materialsD = [
  { name: "Papier", shields: false },
  { name: "Karton", shields: false },
  { name: "Kunststoff", shields: false },
  { name: "Holz", shields: false },
  { name: "Glas", shields: false },
  { name: "Aluminium", shields: false },
  { name: "Kupfer", shields: false },
  { name: "Eisenplatte", shields: true },
  { name: "Stahlplatte", shields: true }
];

function init() {
  bindTabs();
  fillSelect("aObjectSelect", objectsA, (o) => `${o.name} (${o.material})`);
  fillSelect("bObjectSelect", objectsB, (o) => `${o.name} (${o.metal})`);
  fillSelect("dMaterial", materialsD, (o) => o.name);

  document.getElementById("aTestBtn").addEventListener("click", testA);
  document.getElementById("bTestBtn").addEventListener("click", testB);
  document.getElementById("cDistance").addEventListener("input", updateDistanceLabel);
  document.getElementById("cMoveBtn").addEventListener("click", testC);
  document.getElementById("cTrialBtn").addEventListener("click", nextTrialC);
  document.getElementById("dTestBtn").addEventListener("click", testD);
  document.getElementById("resetBtn").addEventListener("click", resetAll);
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });
}

function setTab(tab) {
  state.tab = tab;
  const subtitles = {
    A: "Experiment A – Welche Stoffe werden angezogen?",
    B: "Experiment B – Welche Metalle werden angezogen?",
    C: "Experiment C – Reichweite der Magnetwirkung",
    D: "Experiment D – Durchdringung und Abschirmung"
  };
  document.getElementById("subtitle").textContent = subtitles[tab];
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  ["A", "B", "C", "D"].forEach((id) => document.getElementById(`panel${id}`).classList.toggle("hidden", id !== tab));
}

function testA() {
  const item = objectsA[document.getElementById("aObjectSelect").selectedIndex];
  const result = item.magnetic ? "ja" : "nein";
  if (item.magnetic) state.A.magneticMaterials.add(item.material);
  addUniqueRow(state.A.rows, item.name, [item.name, item.material, result]);
  renderRows("aTableBody", state.A.rows);
  setResult("aResult", `${item.name}: ${result.toUpperCase()}, wird ${item.magnetic ? "angezogen" : "nicht angezogen"}.`, item.magnetic);
  const mats = [...state.A.magneticMaterials];
  document.getElementById("aSummary").textContent = `Bisher erkannte magnetische Stoffe: ${mats.length ? mats.join(", ") : "–"}`;
}

function testB() {
  const item = objectsB[document.getElementById("bObjectSelect").selectedIndex];
  const result = item.magnetic ? "ja" : "nein";
  if (item.magnetic) state.B.magneticMetals.add(item.metal);
  addUniqueRow(state.B.rows, item.name, [item.name, item.metal, result]);
  renderRows("bTableBody", state.B.rows);
  setResult("bResult", `${item.metal}: ${result.toUpperCase()}, ${item.magnetic ? "ferromagnetisch" : "nicht ferromagnetisch"}.`, item.magnetic);
  const metals = [...state.B.magneticMetals];
  document.getElementById("bSummary").textContent = `Metalle mit Magnetwirkung: ${metals.length ? metals.join(", ") : "–"}`;
}

function updateDistanceLabel() {
  document.getElementById("cDistanceValue").textContent = Number(document.getElementById("cDistance").value).toFixed(1);
}

function testC() {
  const distance = Number(document.getElementById("cDistance").value);
  const attracted = distance <= state.C.threshold;
  const msg = attracted
    ? `Büroklammer wird angezogen bei ${distance.toFixed(1)} cm.`
    : `Noch keine Anziehung bei ${distance.toFixed(1)} cm. Näher heran bewegen.`;
  setResult("cResult", `${msg} (Versuch ${state.C.trial}/3)`, attracted);

  if (attracted) {
    const existing = state.C.rows.find((r) => r[0] === String(state.C.trial));
    const row = [String(state.C.trial), distance.toFixed(1)];
    if (existing) {
      existing[1] = row[1];
    } else {
      state.C.rows.push(row);
      state.C.rows.sort((a, b) => Number(a[0]) - Number(b[0]));
    }
    renderRows("cTableBody", state.C.rows);
    updateCSummary();
  }
}

function nextTrialC() {
  if (state.C.trial >= 3) {
    setResult("cResult", "Alle drei Versuche sind abgeschlossen. Nutze Reset für neue Messreihen.", false);
    return;
  }
  state.C.trial += 1;
  state.C.threshold = randomThreshold();
  document.getElementById("cResult").className = "result";
  document.getElementById("cResult").textContent = `Versuch ${state.C.trial} von 3 gestartet.`;
}

function updateCSummary() {
  if (!state.C.rows.length) {
    document.getElementById("cSummary").textContent = "Mittelwert: –";
    return;
  }
  const values = state.C.rows.map((r) => Number(r[1]));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  document.getElementById("cSummary").textContent = `Mittelwert: ${avg.toFixed(2)} cm · mögliche Abweichungen durch ungenaues Ablesen oder Bewegung der Büroklammer.`;
}

function testD() {
  const item = materialsD[document.getElementById("dMaterial").selectedIndex];
  const blocked = item.shields;
  const obs = blocked ? "Büroklammer fällt herunter (Wirkung abgeschirmt)" : "Büroklammer bleibt hängen (Wirkung dringt durch)";
  if (blocked) state.D.shield += 1;
  else state.D.pass += 1;
  addUniqueRow(state.D.rows, item.name, [item.name, obs]);
  renderRows("dTableBody", state.D.rows);
  setResult("dResult", `${item.name}: ${obs}.`, !blocked);
  document.getElementById("dSummary").textContent = `Durchdrungen: ${state.D.pass} · Abgeschirmt: ${state.D.shield}`;
}

function setResult(id, text, positive) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `result ${positive ? "ok" : "bad"}`;
}

function addUniqueRow(arr, key, values) {
  const idx = arr.findIndex((r) => r[0] === key);
  if (idx >= 0) arr[idx] = values;
  else arr.push(values);
}

function renderRows(tbodyId, rows) {
  const body = document.getElementById(tbodyId);
  body.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });
}

function fillSelect(id, data, mapLabel) {
  const sel = document.getElementById(id);
  sel.innerHTML = "";
  data.forEach((entry) => {
    const opt = document.createElement("option");
    opt.textContent = mapLabel(entry);
    sel.appendChild(opt);
  });
}

function randomThreshold() {
  return 5.8 + Math.random() * 1.8;
}

function resetAll() {
  state.A.rows = [];
  state.A.magneticMaterials = new Set();
  state.B.rows = [];
  state.B.magneticMetals = new Set();
  state.C.rows = [];
  state.C.trial = 1;
  state.C.threshold = randomThreshold();
  state.D.rows = [];
  state.D.pass = 0;
  state.D.shield = 0;

  ["aTableBody", "bTableBody", "cTableBody", "dTableBody"].forEach((id) => renderRows(id, []));
  document.getElementById("aSummary").textContent = "Bisher erkannte magnetische Stoffe: –";
  document.getElementById("bSummary").textContent = "Metalle mit Magnetwirkung: –";
  document.getElementById("cSummary").textContent = "Mittelwert: –";
  document.getElementById("dSummary").textContent = "Durchdrungen: 0 · Abgeschirmt: 0";

  document.getElementById("aResult").className = "result";
  document.getElementById("aResult").textContent = "Noch kein Test durchgeführt.";
  document.getElementById("bResult").className = "result";
  document.getElementById("bResult").textContent = "Noch kein Test durchgeführt.";
  document.getElementById("cResult").className = "result";
  document.getElementById("cResult").textContent = "Versuch 1 von 3.";
  document.getElementById("dResult").className = "result";
  document.getElementById("dResult").textContent = "Noch kein Material getestet.";

  document.getElementById("cDistance").value = "10";
  updateDistanceLabel();
  setTab("A");
}

init();
