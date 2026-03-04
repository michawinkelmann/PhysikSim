const state = {
  tab: "A",
  A: { rows: [], magneticMaterials: new Set(), active: null },
  B: { rows: [], magneticMetals: new Set(), active: null },
  C: { trial: 1, threshold: randomThreshold(), rows: [], distance: 10 },
  D: { rows: [], pass: 0, shield: 0 }
};

const objectIcons = {
  Büroklammer: "📎",
  Münze: "🪙",
  Radiergummi: "🧽",
  Schraube: "🔩",
  Holzstab: "🪵",
  Alufolie: "🥫",
  Nagel: "📌",
  Glasmurmel: "🔮",
  Unterlegscheibe: "⚙️",
  Bleistift: "✏️",
  Eisennagel: "📌",
  Stahlschraube: "🔩",
  Kupferdraht: "🧵",
  Messingschraube: "🔩",
  Alublech: "🥫",
  Silberkette: "⛓️"
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
  createDraggableObjects("A", objectsA, "aObjects", "material");
  createDraggableObjects("B", objectsB, "bObjects", "metal");

  document.getElementById("aObjectSelect").addEventListener("change", () => setActiveObject("A"));
  document.getElementById("bObjectSelect").addEventListener("change", () => setActiveObject("B"));
  document.getElementById("aTestBtn").addEventListener("click", testA);
  document.getElementById("bTestBtn").addEventListener("click", testB);
  document.getElementById("cDistance").addEventListener("input", updateDistanceFromSlider);
  document.getElementById("cMoveBtn").addEventListener("click", testC);
  document.getElementById("cTrialBtn").addEventListener("click", nextTrialC);
  document.getElementById("dTestBtn").addEventListener("click", testD);
  document.getElementById("resetBtn").addEventListener("click", resetAll);

  bindCMagnetDrag();
  setActiveObject("A");
  setActiveObject("B");
}

function createDraggableObjects(tab, objects, containerId, field) {
  const layer = document.getElementById(containerId);
  layer.innerHTML = "";
  objects.forEach((item, index) => {
    const el = document.createElement("button");
    el.className = "obj";
    el.type = "button";
    el.dataset.tab = tab;
    el.dataset.index = String(index);
    el.innerHTML = `<span class="icon">${objectIcons[item.name] || "🔹"}</span><span class="name">${item.name}</span><small>${item[field]}</small>`;
    el.style.left = `${16 + (index % 3) * 29}%`;
    el.style.top = `${16 + Math.floor(index / 3) * 18}%`;
    bindDrag(el, layer);
    el.addEventListener("click", () => {
      const select = document.getElementById(tab === "A" ? "aObjectSelect" : "bObjectSelect");
      select.selectedIndex = index;
      setActiveObject(tab);
    });
    layer.appendChild(el);
  });
}

function bindDrag(el, container) {
  el.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    el.setPointerCapture(event.pointerId);
    const box = container.getBoundingClientRect();
    const offsetX = event.clientX - el.getBoundingClientRect().left;
    const offsetY = event.clientY - el.getBoundingClientRect().top;
    el.style.cursor = "grabbing";

    const move = (e) => {
      const obj = el.getBoundingClientRect();
      const left = clamp(e.clientX - box.left - offsetX, 6, box.width - obj.width - 6);
      const top = clamp(e.clientY - box.top - offsetY, 8, box.height - obj.height - 8);
      el.style.left = `${(left / box.width) * 100}%`;
      el.style.top = `${(top / box.height) * 100}%`;
    };

    const up = () => {
      el.style.cursor = "grab";
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  });
}

function setActiveObject(tab) {
  const selectId = tab === "A" ? "aObjectSelect" : "bObjectSelect";
  const select = document.getElementById(selectId);
  state[tab].active = select.selectedIndex;
  document.querySelectorAll(`.obj[data-tab='${tab}']`).forEach((objEl) => {
    objEl.classList.toggle("active", Number(objEl.dataset.index) === select.selectedIndex);
  });
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
  setActiveObject("A");
  const index = document.getElementById("aObjectSelect").selectedIndex;
  const item = objectsA[index];
  const result = item.magnetic ? "ja" : "nein";
  animateObjectResult("A", index, item.magnetic);
  if (item.magnetic) state.A.magneticMaterials.add(item.material);
  addUniqueRow(state.A.rows, item.name, [item.name, item.material, result]);
  renderRows("aTableBody", state.A.rows);
  setResult("aResult", `${item.name}: ${result.toUpperCase()}, wird ${item.magnetic ? "angezogen" : "nicht angezogen"}.`, item.magnetic);
  const mats = [...state.A.magneticMaterials];
  document.getElementById("aSummary").textContent = `Bisher erkannte magnetische Stoffe: ${mats.length ? mats.join(", ") : "–"}`;
}

function testB() {
  setActiveObject("B");
  const index = document.getElementById("bObjectSelect").selectedIndex;
  const item = objectsB[index];
  const result = item.magnetic ? "ja" : "nein";
  animateObjectResult("B", index, item.magnetic);
  if (item.magnetic) state.B.magneticMetals.add(item.metal);
  addUniqueRow(state.B.rows, item.name, [item.name, item.metal, result]);
  renderRows("bTableBody", state.B.rows);
  setResult("bResult", `${item.metal}: ${result.toUpperCase()}, ${item.magnetic ? "ferromagnetisch" : "nicht ferromagnetisch"}.`, item.magnetic);
  const metals = [...state.B.magneticMetals];
  document.getElementById("bSummary").textContent = `Metalle mit Magnetwirkung: ${metals.length ? metals.join(", ") : "–"}`;
}

function animateObjectResult(tab, index, magnetic) {
  const el = document.querySelector(`.obj[data-tab='${tab}'][data-index='${index}']`);
  const scene = document.getElementById(tab === "A" ? "sceneA" : "sceneB");
  const magnet = scene.querySelector(".magnet");
  if (!el || !magnet) return;

  const sceneRect = scene.getBoundingClientRect();
  const magnetRect = magnet.getBoundingClientRect();
  const targetLeft = ((magnetRect.left - sceneRect.left - 74) / sceneRect.width) * 100;
  const nearTop = ((magnetRect.bottom - sceneRect.top + 8) / sceneRect.height) * 100;

  el.classList.remove("drop");
  if (magnetic) {
    el.style.left = `${clamp(targetLeft, 4, 82)}%`;
    el.style.top = `${clamp(nearTop, 10, 58)}%`;
  } else {
    el.style.left = `${clamp(targetLeft, 4, 82)}%`;
    el.style.top = `${clamp(nearTop, 10, 58)}%`;
    setTimeout(() => {
      el.classList.add("drop");
      el.style.top = "64%";
      el.classList.remove("bad-shake");
      void el.offsetWidth;
      el.classList.add("bad-shake");
    }, 220);
  }
}

function updateDistanceFromSlider() {
  state.C.distance = Number(document.getElementById("cDistance").value);
  updateCDistanceUI();
}

function updateCDistanceUI() {
  const distance = state.C.distance;
  const scene = document.getElementById("sceneC");
  const magnet = document.getElementById("cMagnet");
  const clip = document.getElementById("cClip");
  const line = document.getElementById("cDistanceLine");

  const leftPercent = 14 + (15 - distance) * 3.1;
  magnet.style.left = `${leftPercent}%`;
  document.getElementById("cDistanceValue").textContent = distance.toFixed(1);

  const sceneRect = scene.getBoundingClientRect();
  const magnetRect = magnet.getBoundingClientRect();
  const clipRect = clip.getBoundingClientRect();
  const lineLeft = magnetRect.right - sceneRect.left;
  const lineWidth = Math.max(10, clipRect.left - magnetRect.right - 6);
  line.style.left = `${lineLeft}px`;
  line.style.width = `${lineWidth}px`;
}

function bindCMagnetDrag() {
  const scene = document.getElementById("sceneC");
  const magnet = document.getElementById("cMagnet");
  const slider = document.getElementById("cDistance");

  magnet.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    magnet.setPointerCapture(event.pointerId);
    magnet.classList.add("dragging");
    const sceneRect = scene.getBoundingClientRect();
    const offsetX = event.clientX - magnet.getBoundingClientRect().left;

    const move = (e) => {
      const clip = document.getElementById("cClip").getBoundingClientRect();
      const magnetRect = magnet.getBoundingClientRect();
      const minLeftPx = sceneRect.width * 0.12;
      const maxLeftPx = clip.left - sceneRect.left - magnetRect.width - 18;
      const leftPx = clamp(e.clientX - sceneRect.left - offsetX, minLeftPx, maxLeftPx);
      const leftPercent = (leftPx / sceneRect.width) * 100;
      state.C.distance = clamp((57 - leftPercent) / 3.1, 0, 15);
      slider.value = state.C.distance.toFixed(1);
      updateCDistanceUI();
    };

    const up = () => {
      magnet.classList.remove("dragging");
      magnet.removeEventListener("pointermove", move);
      magnet.removeEventListener("pointerup", up);
      magnet.removeEventListener("pointercancel", up);
    };

    magnet.addEventListener("pointermove", move);
    magnet.addEventListener("pointerup", up);
    magnet.addEventListener("pointercancel", up);
  });
}

function testC() {
  const distance = state.C.distance;
  const attracted = distance <= state.C.threshold;
  const clip = document.getElementById("cClip");
  const msg = attracted
    ? `Büroklammer wird angezogen bei ${distance.toFixed(1)} cm.`
    : `Noch keine Anziehung bei ${distance.toFixed(1)} cm. Näher heran bewegen.`;
  setResult("cResult", `${msg} (Versuch ${state.C.trial}/3)`, attracted);
  clip.classList.toggle("clip-pull", attracted);

  if (attracted) {
    const existing = state.C.rows.find((r) => r[0] === String(state.C.trial));
    const row = [String(state.C.trial), distance.toFixed(1)];
    if (existing) existing[1] = row[1];
    else state.C.rows.push(row);
    state.C.rows.sort((a, b) => Number(a[0]) - Number(b[0]));
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
  document.getElementById("cClip").classList.remove("clip-pull");
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
  const plate = document.getElementById("dPlate");
  const clip = document.getElementById("dClip");
  plate.style.background = blocked ? "#64748b" : "#cbd5e1";
  plate.style.borderColor = blocked ? "#334155" : "#94a3b8";
  clip.classList.toggle("drop", blocked);

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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resetAll() {
  state.A.rows = [];
  state.A.magneticMaterials = new Set();
  state.B.rows = [];
  state.B.magneticMetals = new Set();
  state.C.rows = [];
  state.C.trial = 1;
  state.C.distance = 10;
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
  document.getElementById("dPlate").style.background = "#94a3b8";
  document.getElementById("dPlate").style.borderColor = "#64748b";
  document.getElementById("dClip").classList.remove("drop");
  document.getElementById("cClip").classList.remove("clip-pull");

  createDraggableObjects("A", objectsA, "aObjects", "material");
  createDraggableObjects("B", objectsB, "bObjects", "metal");
  document.getElementById("aObjectSelect").selectedIndex = 0;
  document.getElementById("bObjectSelect").selectedIndex = 0;
  setActiveObject("A");
  setActiveObject("B");

  updateCDistanceUI();
  setTab("A");
}

init();
updateCDistanceUI();
