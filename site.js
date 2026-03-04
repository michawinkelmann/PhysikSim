// PhysikSim‑Lab – Übersicht (offline, ohne Bibliotheken)
//
// EXPERIMENTS ist die zentrale Liste (kein Directory‑Scan möglich im file:// Kontext).
// Neues Experiment hinzufügen (Kurzform):
// 1) Ordner kopieren (z.B. experiments/_template → experiments/<thema>/<slug>/)
// 2) In der Experiment‑HTML: „Zurück zur Übersicht“ Link prüfen (relativer Pfad!)
// 3) Titel/Topic/Tags in EXPERIMENTS ergänzen
// 4) index.html (Root) öffnen und testen (ohne Internet)

const EXPERIMENTS = [
  {
    id: "stabmagnet",
    title: "Stabmagnet entdecken",
    topic: "Magnetismus",
    grade: "Klasse 5",
    teaser: "Pole, Anziehung/Abstoßung und erste Beobachtungen mit Büroklammern.",
    tags: ["Magnet", "Pole", "Anziehung", "Abstoßung"],
    path: "experiments/magnetismus/stabmagnet/index.html",
    status: "ready"
  },
  {
    id: "magnetismus-erklaeren",
    title: "Wie lässt sich Magnetismus erklären?",
    topic: "Magnetismus",
    grade: "Klasse 5",
    teaser: "Magnetisieren, Entmagnetisieren und Pole mit zwei einfachen Versuchsreihen verstehen.",
    tags: ["Elementarmagnete", "Erhitzen", "Schlagen", "Pole"],
    path: "experiments/magnetismus/wie-laesst-sich-magnetismus-erklaeren/index.html",
    status: "ready"
  },
  {
    id: "magnetwirkung-sichtbar-machen",
    title: "Magnetwirkung sichtbar machen",
    topic: "Magnetismus",
    grade: "Klasse 5",
    teaser: "Feldlinien mit Eisenspänen modellieren und die Wechselwirkung zwischen zwei Magneten untersuchen.",
    tags: ["Feldlinien", "Eisenspäne", "Pole", "Wechselwirkung"],
    path: "experiments/magnetismus/magnetwirkung-sichtbar-machen/index.html",
    status: "ready"
  },
  {
    id: "freier-fall",
    title: "Freier Fall – Zeit & Strecke (Vorbereitung)",
    topic: "Mechanik",
    grade: "Klasse 7",
    teaser: "Untersuche, wie sich Zeit und Fallstrecke zueinander verhalten (Modell).",
    tags: ["Fall", "Beschleunigung", "Diagramm"],
    path: "experiments/mechanik/freier-fall/index.html",
    status: "coming-soon"
  },
  {
    id: "linse",
    title: "Sammellinse – Bildweite (Vorbereitung)",
    topic: "Optik",
    grade: "Klasse 8",
    teaser: "Verschiebe Gegenstand & Linse und beobachte die Bildentstehung (Modell).",
    tags: ["Linse", "Brennweite", "Bild"],
    path: "experiments/optik/sammellinse/index.html",
    status: "coming-soon"
  }
];

const ui = {
  searchInput: document.getElementById("searchInput"),
  topicSelect: document.getElementById("topicSelect"),
  sortSelect: document.getElementById("sortSelect"),
  topicChips: document.getElementById("topicChips"),
  cards: document.getElementById("cards"),
  resultMeta: document.getElementById("resultMeta"),
  resetBtn: document.getElementById("resetFiltersBtn")
};

const filterState = {
  q: "",
  topic: "Alle",
  sort: "topic"
};

function init(){
  buildTopicControls();
  bindUI();
  render();
}

function bindUI(){
  ui.searchInput.addEventListener("input", (e)=>{
    filterState.q = (e.target.value || "").trim();
    render();
  });

  ui.topicSelect.addEventListener("change", (e)=>{
    filterState.topic = e.target.value;
    syncChipsToSelect();
    render();
  });

  ui.sortSelect.addEventListener("change", (e)=>{
    filterState.sort = e.target.value;
    render();
  });

  ui.resetBtn.addEventListener("click", ()=>{
    filterState.q = "";
    filterState.topic = "Alle";
    filterState.sort = "topic";
    ui.searchInput.value = "";
    ui.topicSelect.value = "Alle";
    ui.sortSelect.value = "topic";
    syncChipsToSelect();
    render();
  });
}

function buildTopicControls(){
  const topics = ["Alle", ...Array.from(new Set(EXPERIMENTS.map(e=>e.topic))).sort((a,b)=>a.localeCompare(b,"de"))];

  // Select (DOM, ohne HTML-String)
  ui.topicSelect.innerHTML = "";
  for(const t of topics){
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    ui.topicSelect.appendChild(opt);
  }

  // Chips
  ui.topicChips.innerHTML = "";
  topics.forEach(t=>{
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.textContent = t;
    b.setAttribute("aria-pressed", t==="Alle" ? "true":"false");
    b.addEventListener("click", ()=>{
      filterState.topic = t;
      ui.topicSelect.value = t;
      syncChipsToSelect();
      render();
    });
    ui.topicChips.appendChild(b);
  });

  syncChipsToSelect();
}

function syncChipsToSelect(){
  const kids = Array.from(ui.topicChips.children);
  for(const el of kids){
    const active = (el.textContent === filterState.topic);
    el.classList.toggle("active", active);
    el.setAttribute("aria-pressed", active ? "true":"false");
  }
}

function render(){
  const results = getFilteredSorted();
  ui.cards.innerHTML = "";

  ui.resultMeta.textContent = `${results.length} Simulation${results.length===1?"":"en"} angezeigt`;

  if(results.length===0){
    ui.cards.innerHTML = `<div class="empty" role="status">Keine Treffer. Tipp: Suche leeren oder Thema auf „Alle“ setzen.</div>`;
    return;
  }

  for(const exp of results){
    ui.cards.appendChild(renderCard(exp));
  }
}

function getFilteredSorted(){
  const q = filterState.q.toLowerCase();
  const topic = filterState.topic;

  let list = EXPERIMENTS.filter(e=>{
    const topicOk = (topic==="Alle") || (e.topic===topic);
    if(!topicOk) return false;
    if(!q) return true;

    const hay = [
      e.title, e.teaser, e.grade, e.topic,
      ...(e.tags||[])
    ].join(" ").toLowerCase();

    return hay.includes(q);
  });

  const byTitle = (a,b)=>a.title.localeCompare(b.title,"de");
  const byTopic = (a,b)=> (a.topic.localeCompare(b.topic,"de") || byTitle(a,b));
  const byGrade = (a,b)=> (gradeKey(a.grade) - gradeKey(b.grade)) || byTopic(a,b);

  switch(filterState.sort){
    case "title": list.sort(byTitle); break;
    case "grade": list.sort(byGrade); break;
    default: list.sort(byTopic);
  }

  return list;
}

function renderCard(exp){
  const wrap = document.createElement("article");
  wrap.className = "card";
  wrap.setAttribute("aria-label", `Simulation: ${exp.title}`);

  const badgeRow = document.createElement("div");
  badgeRow.className = "hstack";
  const topicChip = document.createElement("span");
  topicChip.className = "chip badge";
  topicChip.textContent = exp.topic;

  const gradeChip = document.createElement("span");
  gradeChip.className = "chip";
  gradeChip.textContent = exp.grade || "—";

  badgeRow.append(topicChip, gradeChip);

  if(exp.status && exp.status !== "ready"){
    const s = document.createElement("span");
    s.className = "chip warn";
    s.textContent = "In Vorbereitung";
    badgeRow.appendChild(s);
  }

  const h = document.createElement("h2");
  h.className = "cardTitle";
  h.textContent = exp.title;

  const p = document.createElement("p");
  p.className = "cardTeaser muted";
  p.textContent = exp.teaser || "";

  const tags = document.createElement("div");
  tags.className = "tagList";
  (exp.tags||[]).slice(0,8).forEach(t=>{
    const el = document.createElement("span");
    el.className = "tag";
    el.textContent = t;
    tags.appendChild(el);
  });

  const btnRow = document.createElement("div");
  btnRow.className = "rowBtns";

  const start = document.createElement("a");
  start.className = "btn primary";
  start.textContent = "Starten";
  start.href = exp.path;
  start.setAttribute("aria-label", `${exp.title} starten`);

  // Bei „coming soon“ ist die Simulation trotzdem aufrufbar (Platzhalter‑Seite), aber klar markiert.
  if(exp.status && exp.status !== "ready"){
    start.classList.remove("primary");
    start.classList.add("btn");
  }

  btnRow.appendChild(start);

  wrap.append(badgeRow, h, p, tags, btnRow);
  return wrap;
}

function gradeKey(s){
  // erwartete Strings: "Klasse 5", "Klasse 7", ...
  const m = /([0-9]{1,2})/.exec(String(s||""));
  return m ? parseInt(m[1],10) : 99;
}

init();
