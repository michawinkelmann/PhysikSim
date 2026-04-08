---
name: PhysikSim
description: Erstellt interaktive Physik-Simulationen als eigenstaendige HTML-Dateien mit eingebettetem CSS und JavaScript. Die Simulationen folgen dem PhysikSim-Designsystem mit Tab-basierter Navigation, Card-Layout, SVG/Canvas-Visualisierungen und responsivem Design.
triggers:
  - simulation erstellen
  - physik simulation
  - interaktive simulation
  - experiment simulation
  - html simulation
---

# PhysikSim – Interaktive Physik-Simulationen

Du erstellst interaktive Physik-Simulationen als **eigenstaendige .html Dateien** (CSS und JS inline). Die Simulationen sind fuer den Physikunterricht gedacht und folgen einem einheitlichen Designsystem.

## Ausgabeformat

Jede Simulation ist eine **einzelne .html Datei** mit folgendem Grundgeruest:

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>[Titel] – PhysikSim</title>
  <style>
    /* === ALLE CSS-REGELN INLINE === */
  </style>
</head>
<body>
  <header>
    <a href="#" class="back-link">PhysikSim</a>
    <h1>[Titel]</h1>
  </header>
  <nav id="tabs" role="tablist"></nav>
  <main id="experiment-container"></main>
  <script>
    /* === GESAMTE SIMULATION INLINE === */
  </script>
</body>
</html>
```

## CSS-Design-System

Verwende exakt dieses Design-System. Alle CSS-Variablen und Regeln muessen in einem `<style>`-Block im `<head>` stehen:

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg: #f0f2f5;
  --surface: #ffffff;
  --text: #1a1a2e;
  --text-sec: #5a5a7a;
  --border: #e2e4e9;
  --accent: #2563eb;
  --green: #16a34a;
  --red: #dc2626;
  --yellow: #ca8a04;
  --orange: #d97706;
  --radius: 12px;
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
}

html { font-size: 16px; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior: none;
  overflow-x: hidden;
}

/* Header */
header {
  background: var(--surface);
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
}

.back-link::before {
  content: '\2190\00a0';
}

header h1 {
  font-size: 1.15rem;
  font-weight: 600;
}

/* Tabs */
#tabs {
  display: flex;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
#tabs::-webkit-scrollbar { display: none; }

.tab {
  flex: 0 0 auto;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-sec);
  cursor: pointer;
  border: none;
  background: none;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
  min-width: 48px;
  text-align: center;
}

.tab:hover { color: var(--text); }
.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* Main Container */
main {
  max-width: 700px;
  margin: 0 auto;
  padding: 1rem;
}

/* Experiment Panel */
.experiment {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.exp-title {
  font-size: 1.05rem;
  font-weight: 600;
}

.exp-instruction {
  font-size: 0.9rem;
  color: var(--text-sec);
  line-height: 1.5;
}

/* Card */
.card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.25rem;
}

/* Conclusion Box */
.conclusion {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #1e40af;
}

.conclusion strong {
  display: block;
  margin-bottom: 0.25rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  user-select: none;
  -webkit-user-select: none;
  min-height: 44px;
}

.btn:active { transform: scale(0.97); }

.btn-primary {
  background: var(--accent);
  color: #fff;
}
.btn-primary:hover { background: #1d4ed8; }
.btn-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}
.btn-secondary:hover { background: #d1d5db; }

.btn-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Results Table */
.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.results-table th {
  text-align: left;
  padding: 0.6rem 0.75rem;
  border-bottom: 2px solid var(--border);
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--text-sec);
}

.results-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border);
}

.results-table tr:last-child td { border-bottom: none; }

/* Controls */
.control-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.control-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-sec);
  white-space: nowrap;
}

/* Slider */
.slider-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slider-input {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border);
  border-radius: 3px;
  outline: none;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.slider-input::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  border: none;
}

.slider-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent);
  min-width: 50px;
  text-align: right;
}

/* Voltage/Value Display Boxes */
.voltage-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.voltage-box {
  flex: 1;
  min-width: 80px;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
}

.voltage-box .voltage-label {
  font-size: 0.7rem;
  color: var(--text-sec);
  margin-bottom: 0.25rem;
}

.voltage-box .voltage-value {
  font-size: 1.1rem;
}

.voltage-box.source {
  background: #fee2e2;
  border: 1px solid #fecaca;
}
.voltage-box.source .voltage-value { color: #991b1b; }

.voltage-box.current {
  background: #fef3c7;
  border: 1px solid #fde68a;
}
.voltage-box.current .voltage-value { color: #92400e; }

.voltage-box.resistance {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}
.voltage-box.resistance .voltage-value { color: #166534; }

.voltage-box.lamp {
  background: #dbeafe;
  border: 1px solid #bfdbfe;
}
.voltage-box.lamp .voltage-value { color: #1e40af; }

/* Circuit Visualization */
.circuit-viz {
  position: relative;
  width: 100%;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.circuit-viz svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* Canvas Area */
.canvas-card {
  padding: 0;
  overflow: hidden;
}

.canvas-wrapper {
  width: 100%;
  position: relative;
}

.sim-canvas {
  display: block;
  width: 100%;
  border-radius: var(--radius);
  background: #f8fafb;
}

/* Chart */
.chart-container {
  position: relative;
  width: 100%;
  height: 300px;
  background: var(--surface);
  border-radius: 10px;
  border: 1px solid var(--border);
  overflow: hidden;
}

.chart-container svg {
  width: 100%;
  height: 100%;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 0.35rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.info {
  background: #eff6ff;
  color: var(--accent);
}

.status-badge.success {
  background: #dcfce7;
  color: var(--green);
}

.status-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

/* Grid Buttons */
.btn-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.grid-btn {
  padding: 0.7rem 0.5rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  user-select: none;
  -webkit-user-select: none;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-btn:active { transform: scale(0.97); }
.grid-btn.active {
  border-color: var(--accent);
  background: #eff6ff;
}
.grid-btn.tested {
  border-color: var(--green);
  background: #f0fdf4;
}

/* Progress Bar */
.progress-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: var(--text-sec);
}

.progress-track {
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.3s;
}

/* Utility */
.hidden { display: none !important; }
.text-center { text-align: center; }
.mt-sm { margin-top: 0.5rem; }
.mt-md { margin-top: 1rem; }

@media (max-width: 480px) {
  header { padding: 0.75rem 1rem; }
  header h1 { font-size: 1rem; }
  main { padding: 0.75rem; }
  .voltage-row { flex-direction: column; }
  .chart-container { height: 250px; }
  .btn-grid { grid-template-columns: repeat(2, 1fr); }
}
```

## JavaScript-Architektur

Der gesamte JavaScript-Code steht in einem einzigen `<script>`-Block am Ende des `<body>`. Verwende exakt dieses Muster:

```javascript
(function () {
  'use strict';

  // ==================== DATA ====================

  var EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'V1: Kurzname',
      title: 'V1: Vollstaendiger Titel des Experiments',
      instruction: 'Ausfuehrliche Anweisung fuer den Schueler...',
      type: 'experiment-type',
      conclusion: 'Wissenschaftliche Erklaerung des Ergebnisses...'
    },
    b: {
      id: 'b',
      tab: 'V2: Kurzname',
      title: 'V2: Zweites Experiment',
      instruction: '...',
      type: 'experiment-type-2',
      conclusion: '...'
    }
  };

  // ==================== STATE ====================

  var currentExp = null;
  var state = {};
  var cleanupFns = [];

  // ==================== INIT ====================

  function init() {
    buildTabs();
    switchExperiment('a');
  }

  function buildTabs() {
    var tabs = document.getElementById('tabs');
    tabs.innerHTML = '';
    Object.keys(EXPERIMENTS).forEach(function (key) {
      var exp = EXPERIMENTS[key];
      var btn = document.createElement('button');
      btn.className = 'tab';
      btn.setAttribute('role', 'tab');
      btn.textContent = exp.tab;
      btn.addEventListener('click', function () { switchExperiment(key); });
      tabs.appendChild(btn);
    });
  }

  function switchExperiment(key) {
    // Cleanup vorheriges Experiment
    cleanupFns.forEach(function (fn) { fn(); });
    cleanupFns = [];
    state = {};

    currentExp = EXPERIMENTS[key];

    // Tab aktiv setzen
    var tabBtns = document.querySelectorAll('.tab');
    var keys = Object.keys(EXPERIMENTS);
    tabBtns.forEach(function (btn, i) {
      btn.classList.toggle('active', keys[i] === key);
    });

    // Container leeren und neu aufbauen
    var container = document.getElementById('experiment-container');
    container.innerHTML = '';

    var panel = document.createElement('div');
    panel.className = 'experiment';

    var title = document.createElement('h2');
    title.className = 'exp-title';
    title.textContent = currentExp.title;
    panel.appendChild(title);

    var instr = document.createElement('p');
    instr.className = 'exp-instruction';
    instr.textContent = currentExp.instruction;
    panel.appendChild(instr);

    container.appendChild(panel);

    // Experiment-Typ rendern
    switch (currentExp.type) {
      case 'type-1': renderType1(panel); break;
      case 'type-2': renderType2(panel); break;
    }
  }

  // ==================== HELPERS ====================

  function formatNum(val, decimals) {
    return val.toFixed(decimals).replace('.', ',');
  }

  function addEvt(el, evt, fn) {
    el.addEventListener(evt, fn);
    cleanupFns.push(function () { el.removeEventListener(evt, fn); });
  }

  // ==================== SVG HELPERS ====================

  var NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
      }
    }
    return el;
  }

  function createSVG(container, vbW, vbH) {
    var svg = svgEl('svg', {
      width: '100%',
      height: '100%',
      viewBox: '0 0 ' + vbW + ' ' + vbH,
      preserveAspectRatio: 'xMidYMid meet'
    });
    container.appendChild(svg);
    return svg;
  }

  function wire(svg, points, color) {
    svg.appendChild(svgEl('polyline', {
      points: points.map(function (p) { return p[0] + ',' + p[1]; }).join(' '),
      fill: 'none',
      stroke: color || '#475569',
      'stroke-width': '2.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }));
  }

  function txt(parent, x, y, text, opts) {
    opts = opts || {};
    var t = svgEl('text', {
      x: x, y: y,
      'text-anchor': opts.anchor || 'middle',
      'font-size': opts.size || '11',
      'font-weight': opts.weight || '600',
      fill: opts.fill || '#64748b',
      'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    });
    if (opts.id) t.setAttribute('id', opts.id);
    t.textContent = text;
    parent.appendChild(t);
    return t;
  }

  // ==================== RENDER FUNCTIONS ====================

  // Hier kommen die render-Funktionen fuer jeden Experiment-Typ

  // ==================== START ====================

  window.addEventListener('DOMContentLoaded', init);
})();
```

## Verbindliche Regeln

### JavaScript
1. **ES5-kompatibel**: Verwende `var` statt `let`/`const`, keine Arrow-Functions, keine Template-Literals, keine Destructuring, kein `class`
2. **IIFE-Pattern**: Gesamter Code in `(function () { 'use strict'; ... })();`
3. **Keine externen Bibliotheken**: Nur Vanilla JS, kein p5.js, kein jQuery, kein D3
4. **SVG fuer Schaltkreise/Diagramme**: Verwende SVG-Namespace `http://www.w3.org/2000/svg` mit den Helper-Funktionen `svgEl()`, `createSVG()`, `wire()`, `txt()`
5. **Canvas fuer Partikel/Physik-Simulationen**: Verwende `<canvas>` mit `requestAnimationFrame` fuer dynamische Simulationen (z.B. Magnetfeld-Eisenspaene, Wellenausbreitung)
6. **Cleanup-Pattern**: Event-Listener via `addEvt()` registrieren, damit sie beim Tab-Wechsel entfernt werden. Bei `requestAnimationFrame` die ID in `state.animId` speichern und in `switchExperiment` via `cancelAnimationFrame` aufraumen
7. **Deutsche Sprache**: Alle Texte, Labels, Einheiten auf Deutsch. Dezimalkomma verwenden (`formatNum`). Unicode fuer Sonderzeichen: `\u03A9` (Omega), `\u2192` (Pfeil), `\u2081` (Index 1) etc.
8. **Komma als Dezimaltrennzeichen**: Verwende `formatNum(val, decimals)` statt `toFixed()` direkt

### Struktur
1. **Tab-basierte Navigation**: Jede Simulation hat mindestens 2 Experimente als Tabs (V1, V2, ...)
2. **Experiment-Objekte**: Jedes Experiment hat `id`, `tab`, `title`, `instruction`, `type`, `conclusion`
3. **Instruction-Text**: Beschreibt den Versuchsaufbau und die Aufgabe fuer den Schueler
4. **Conclusion-Box**: Erscheint nach Durchfuehrung und erklaert die wissenschaftliche Erkenntnis
5. **Card-Layout**: Interaktive Bereiche in `.card`-Containern
6. **Responsiv**: Mobile-first, funktioniert auf Smartphones (min-height: 44px fuer Touch-Targets)

### Visualisierungstypen

Verwende je nach Bedarf:

| Typ | Verwendung | Technik |
|-----|-----------|---------|
| Schaltkreis | Elektrische Schaltungen | SVG mit `wire()`, Bauteile als SVG-Gruppen |
| Diagramm/Chart | U-I-Kennlinien, Messwerte | SVG mit Achsen, Linien, Datenpunkten |
| Feldvisualisierung | Magnetfelder, elektrische Felder | Canvas mit `requestAnimationFrame` |
| Interaktive Steuerung | Slider, Buttons, Tabellen | DOM-Elemente mit Event-Listenern |
| Animation | Stromfluss, Generatoren, Wellen | SVG `<animate>` oder Canvas-Loop |

### UI-Komponenten (nach Bedarf einsetzen)

**Slider fuer Werte (z.B. Spannung):**
```html
<div class="slider-container">
  <div class="slider-row">
    <span class="control-label">Spannung:</span>
    <input type="range" class="slider-input" min="0" max="12" step="0.5" value="6">
    <span class="slider-value">6,0 V</span>
  </div>
</div>
```

**Messwert-Anzeige:**
```html
<div class="voltage-row">
  <div class="voltage-box source">
    <div class="voltage-label">Spannung U</div>
    <div class="voltage-value">6,0 V</div>
  </div>
  <div class="voltage-box current">
    <div class="voltage-label">Stromstaerke I</div>
    <div class="voltage-value">0,5 A</div>
  </div>
</div>
```

**Button-Raster fuer Auswahl:**
```html
<div class="btn-grid">
  <button class="grid-btn active">Option A</button>
  <button class="grid-btn">Option B</button>
  <button class="grid-btn tested">Option C</button>
</div>
```

**Ergebnistabelle:**
```html
<table class="results-table">
  <thead>
    <tr><th>Spannung (V)</th><th>Stromstaerke (A)</th></tr>
  </thead>
  <tbody>
    <tr><td>2,0</td><td>0,12</td></tr>
  </tbody>
</table>
```

**Conclusion-Box:**
```html
<div class="conclusion">
  <strong>Ergebnis:</strong>
  Erklaerungstext...
</div>
```

## Physikalische Korrektheit

- Verwende korrekte physikalische Formeln und Einheiten
- Ohmsches Gesetz: U = R * I
- Kirchhoffsche Regeln fuer Schaltkreise
- Magnetfeldberechnung: 1/r^2-Abfall fuer Monopole, 1/r^3 fuer Dipole
- Wellenmechanik: v = f * lambda
- Energieerhaltung: E_kin + E_pot = const
- SI-Einheiten mit korrekten Symbolen (V, A, Omega, N, m, s, kg, J, W, Hz)

## Workflow

Wenn der Benutzer eine Simulation anfordert:

1. **Thema analysieren**: Welche physikalischen Konzepte? Welche Experimente sind sinnvoll?
2. **Experimente planen**: 2-4 Tabs mit aufeinander aufbauenden Versuchen (einfach -> komplex)
3. **Visualisierung waehlen**: SVG fuer statische Diagramme, Canvas fuer dynamische Physik
4. **HTML-Datei erstellen**: Eine einzige .html Datei mit inline CSS und JS
5. **Testen**: Sicherstellen, dass alle Tabs funktionieren und die Physik korrekt ist

## Beispielhafte Themen

- Elektrische Schaltungen (Reihen-/Parallelschaltung)
- Ohmsches Gesetz und Widerstand
- Magnetismus und Magnetfelder
- Optik (Reflexion, Brechung, Linsen)
- Mechanik (Kraft, Beschleunigung, Energie)
- Wellen (Schall, Licht, Interferenz)
- Thermodynamik (Waerme, Temperatur, Aggregatzustaende)
- Radioaktivitaet und Kernphysik
- Elektromagnetische Induktion
- Schwingungen und Resonanz
