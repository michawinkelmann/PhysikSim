# PhysikSim‑Lab – Bauanleitung für neue Simulationen (offline)

**Ziel:** Neue Experimente konsistent erstellen (UI/UX, Architektur, Touch‑Stabilität).  
**Erlaubte Dateitypen:** `.html`, `.css`, `.js` (optional: diese `skill.md`).  
**Keine externen Bibliotheken/CDNs/Assets.** Alles muss funktionieren, wenn man `/index.html` im Browser öffnet.

---

## 1) Verbindliche Ordner- & Dateikonventionen

**Root (Übersicht):**
- `/index.html`
- `/site.css`
- `/site.js`
- `/skill.md` (optional)

**Pro Experiment (immer):**
- `/experiments/<thema-slug>/<experiment-slug>/index.html`
- `/experiments/<thema-slug>/<experiment-slug>/styles.css`
- `/experiments/<thema-slug>/<experiment-slug>/app.js`

**Template (nicht in der Übersicht listen):**
- `/experiments/_template/` (enthält index.html, styles.css, app.js)

> Empfehlung: Experimente auf **3 Ebenen** halten (`experiments/<thema>/<slug>/`), damit Back‑Link und Struktur konsistent bleiben.

---

## 2) UI‑Layout (Pflicht)

### Mobile‑First
- **Topbar** (sticky): Titel + immer sichtbarer **Reset** + **Hilfe** + **„← Übersicht“**
- **Stepper**: Schritte 1..n, antippbar, horizontal scrollbar‑frei
- **Stage**: große Experimentierfläche mit **SVG viewBox `0 0 1000 600`**
- **Aufgabenpanel**:
  - Mobile: **Bottom‑Sheet** (einklappbar)
  - Desktop/Tablet (≥900px): **Sidepanel** rechts

### Touch‑Pflichten
- Buttons/Felder **≥ 44px** hoch
- Keine Hover‑Abhängigkeiten
- Drag nur über **Pointer Events** + `setPointerCapture`
- Stage `touch-action: none;` (im SVG)

---

## 3) Design‑Tokens (CSS Variablen)

Nutze diese Tokens (in jedem Experiment `:root{…}` oder gemeinsam):

```css
:root{
  --font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  --fs-1: 14px; --fs-2: 16px; --fs-3: 18px; --fs-4: 22px;

  --s-1: 6px; --s-2: 10px; --s-3: 14px; --s-4: 18px; --s-5: 24px;

  --r-1: 10px; --r-2: 16px; --r-3: 22px;
  --shadow-1: 0 1px 2px rgba(0,0,0,.08);
  --shadow-2: 0 10px 26px rgba(0,0,0,.12);

  --bg: #f6f7fb; --panel:#fff; --text:#101321; --muted:#5a607a;
  --border: rgba(16,19,33,.12);

  --accent:#2563eb; --accent-2:#16a34a; --warn:#eab308; --danger:#ef4444;

  --stage:#efe6d6; --stage-grid: rgba(0,0,0,.06);

  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}
```

---

## 4) Komponenten‑Baukasten (CSS Klassen)

**Topbar**
- `.topbar`, `.title`, `.muted`, `.actions`

**Buttons**
- `.btn`, `.btn.primary`, `.btn.ghost`  
  (min-height: 44px)

**Cards/Panels**
- `.card`, `.card.soft`

**Stepper**
- `.stepper`, `.step`, `.step.active`

**Bottom‑Sheet / Sidepanel**
- `.panel`, `.panelHandle`, `.panelToggle`, `.panelBody`  
- Mobile: `position: fixed; bottom:0;` + einklappbar via `data-collapsed="true"`
- Desktop: ab `@media (min-width: 900px)` auf `position: static;`

**Modal / Hilfe‑Popup**
- `.modal` + `hidden`‑Attribut für Ein-/Ausblenden
- Pflichtregel in CSS: `.modal[hidden]{ display:none !important; }`
- Sonst überschreibt `.modal { display: … }` das `hidden`‑Attribut und das Popup bleibt offen.

**Inputs**
- `.field`, `input/textarea/select` mit großen Paddings

---

## 5) JS‑Architektur (Minimalstandard)

### state‑Struktur (Beispiel)
```js
const STAGE = { w:1000, h:600 };

const state = {
  meta: { title:"…", steps:["…","…"], stepIndex:0 },
  objects: [],      // {id,type,x,y,rot,w,h,draggable,…}
  dragging: null,   // {id,dx,dy,pointerId}
  answers: {},      // Task‑Antworten
  tasksByStep: []   // Aufgaben je Schritt
};
```

### Tasks‑Schema (leichtgewichtig)
Unterstützte Typen (Empfehlung):
- `text` (Freitext)
- `mcq` (Multiple Choice)
- `matrix` (Tabelle/Zuordnung – optional)
- `textcheck` (Freitext + Mindestlänge/Check)

Beispiel:
```js
{ id:"mc1", type:"mcq", prompt:"Wo ist die Wirkung am größten?",
  options:["Mitte","Enden"], correct:[1],
  feedback:{ ok:"Richtig: an den Enden …", wrong:"Tipp: Probiere verschiedene Abstände." } }
```

### Pointer‑Drag (Pflicht‑Skeleton)
```js
stage.onpointerdown = onDown;
stage.onpointermove = onMove;
stage.onpointerup   = onUp;
stage.onpointercancel = onUp;

function onDown(evt){
  const obj = findObjFromEvent(evt);
  if(!obj || !obj.draggable) return;
  evt.preventDefault();
  const p = svgPoint(evt);
  state.dragging = { id: obj.id, dx: obj.x - p.x, dy: obj.y - p.y, pointerId: evt.pointerId };
  evt.target.setPointerCapture(evt.pointerId);
}
```

### Reset (immer sichtbar)
- Reset setzt **Step**, **Objekte**, **Antworten**, **Feedback** zurück.
- Reset darf keine Konsole‑Errors auslösen.

---

## 6) Checkliste (QA)

- **Offline‑Check:** `/index.html` öffnet ohne Internet, ohne externe Ressourcen
- **Link‑Check:** Startseite → Experiment → „← Übersicht“ funktioniert
- **Touch‑Check:** Drag stabil (kein Abbruch, kein Hover‑Zwang)
- **Reset‑Check:** reproduzierbar, setzt alles zurück
- **Modal‑Check:** Hilfe öffnen/schließen (Button „OK“), danach ist die Bühne wieder bedienbar
- **Stabilitäts‑Check:** keine „Jitter“‑Effekte, keine „Explosionen“, Clamp/Dämpfung nutzen

---

## 7) Schritt‑für‑Schritt: Neues Experiment hinzufügen

1. **Kopieren:** `experiments/_template` duplizieren nach  
   `experiments/<thema>/<slug>/`
2. **Anpassen:** Titel (HTML + `state.meta.title`), Steps, Aufgaben, Objekte
3. **Back‑Link prüfen:** In der Experiment‑HTML muss der Link zur Übersicht stimmen  
   (bei 3 Ebenen: `href="../../../index.html"`)
4. **Registrieren:** In `/site.js` im `EXPERIMENTS`‑Array ergänzen:
   ```js
   { id:"…", title:"…", topic:"…", grade:"…",
     teaser:"…", tags:[…], path:"experiments/<thema>/<slug>/index.html", status:"ready" }
   ```
5. **Test:** `/index.html` öffnen → Karte starten → Drag/Reset/Stepper testen
