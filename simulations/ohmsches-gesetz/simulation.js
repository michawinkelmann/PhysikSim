(function () {
  'use strict';

  // ==================== DATA ====================

  var EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'V1: Ohmmeter',
      title: 'V1: Widerstand einer Glühlampe',
      instruction: 'Eine Glühlampe (6\u202fV / 0,1\u202fA) leuchtet zunächst eine Minute lang. Dann wird der Schalter schnell umgelegt und die Anzeige auf dem Ohmmeter beobachtet. Der angezeigte Wert fällt von nahezu 60\u202f\u03A9 zu Beginn auf 6,6\u202f\u03A9.',
      type: 'ohmmeter',
      conclusion: 'Der Widerstand der Glühlampe hängt von ihrer Temperatur ab. Im heißen Zustand (leuchtend) ist der Widerstand hoch (~60\u202f\u03A9). Sobald der Strom abgeschaltet wird, kühlt der Glühdraht ab und sein Widerstand sinkt auf den Kaltwiderstand (~6,6\u202f\u03A9). Metalle haben einen temperaturabhängigen Widerstand.'
    },
    b: {
      id: 'b',
      tab: 'V2: Erwärmung',
      title: 'V2: Widerstand beim Erwärmen',
      instruction: 'Die Widerstände eines aufgewickelten Stücks Eisendraht und eines Stücks Konstantandraht werden mit dem Ohmmeter gemessen, während die Drähte mit einem Teelicht erhitzt werden. Beobachte, wie sich die Widerstände verändern.',
      type: 'heating',
      conclusion: 'Der Widerstand des Eisendrahtes steigt beim Erwärmen deutlich an. Der Widerstand des Konstantandrahtes verändert sich beim Erwärmen dagegen nicht. Konstantan ist eine spezielle Legierung, die so konstruiert wurde, dass ihr Widerstand temperaturunabhängig bleibt – daher der Name.'
    },
    c: {
      id: 'c',
      tab: 'V3: U-I-Kennlinie',
      title: 'V3: Strom-Spannungs-Kennlinien',
      instruction: 'Schließe nacheinander eine Glühlampe, einen Konstantandraht (Länge 1,6\u202fm; Querschnittsfläche 0,1\u202fmm²) und einen Eisendraht an eine elektrische Quelle an. Miss die Stromstärke für verschiedene Spannungen. Wiederhole die Messung für den Eisendraht im Wasserbad.',
      type: 'ui-chart',
      conclusion: 'Verdoppeln von U führt beim Konstantandraht zur Verdopplung von I – Spannung und Stromstärke sind proportional. Das ist das Ohmsche Gesetz: U = R · I. Bei der Glühlampe und dem Eisendraht in Luft besteht dagegen kein proportionaler Zusammenhang, weil sich der Widerstand durch die Erwärmung ändert. Durch das Wasserbad erwärmt sich der Eisendraht weniger – Spannung und Stromstärke sind im gekühlten Draht proportional.'
    }
  };

  // V3 measurement data from the textbook
  var V3_DATA = {
    bulb:      { label: 'Glühlampe',          color: '#ef4444', voltages: [0, 1, 2, 3, 4, 5, 6], currents: [0, 0.13, 0.22, 0.30, 0.36, 0.40, 0.45] },
    constantan:{ label: 'Konstantandraht',     color: '#2563eb', voltages: [0, 1, 2, 3, 4, 5, 6], currents: [0, 0.12, 0.24, 0.36, 0.49, 0.61, 0.74] },
    ironAir:   { label: 'Eisendraht in Luft',  color: '#d97706', voltages: [0, 1, 2, 3, 4, 5, 6], currents: [0, 0.34, 0.60, 0.80, 0.98, 1.08, 1.13] },
    ironWater: { label: 'Eisendraht in Wasser', color: '#16a34a', voltages: [0, 1, 2, 3, 4, 5, 6], currents: [0, 0.44, 0.90, 1.34, 1.75, 2.26, 2.66] }
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
    cleanupFns.forEach(function (fn) { fn(); });
    cleanupFns = [];
    state = {};

    currentExp = EXPERIMENTS[key];

    var tabBtns = document.querySelectorAll('.tab');
    var keys = Object.keys(EXPERIMENTS);
    tabBtns.forEach(function (btn, i) {
      btn.classList.toggle('active', keys[i] === key);
    });

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

    switch (currentExp.type) {
      case 'ohmmeter': renderV1(panel); break;
      case 'heating': renderV2(panel); break;
      case 'ui-chart': renderV3(panel); break;
    }
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

  // Battery component
  function drawBattery(svg, cx, cy, label) {
    var g = svgEl('g', {});
    // Shadow
    g.appendChild(svgEl('rect', { x: cx - 32, y: cy - 20, width: 64, height: 46, rx: 6, fill: '#cbd5e1' }));
    // Body
    g.appendChild(svgEl('rect', { x: cx - 30, y: cy - 22, width: 60, height: 44, rx: 5, fill: '#e2e8f0', stroke: '#94a3b8', 'stroke-width': '2' }));
    // Display
    g.appendChild(svgEl('rect', { x: cx - 18, y: cy - 10, width: 36, height: 18, rx: 3, fill: '#dbeafe', stroke: '#93c5fd', 'stroke-width': '1' }));
    txt(g, cx, cy + 4, label, { size: '12', weight: '700', fill: '#1e40af' });
    txt(g, cx, cy + 34, 'Quelle', { size: '9', fill: '#64748b' });
    // Terminal markers
    txt(g, cx + 24, cy - 24, '+', { size: '13', weight: 'bold', fill: '#dc2626' });
    txt(g, cx + 24, cy + 32, '−', { size: '15', weight: 'bold', fill: '#2563eb' });
    svg.appendChild(g);
  }

  // Switch with open/closed arm
  function drawSwitch(svg, x1, x2, y, id) {
    var g = svgEl('g', { id: id });
    // Contact dots
    g.appendChild(svgEl('circle', { cx: x1, cy: y, r: '5', fill: '#334155', stroke: '#1e293b', 'stroke-width': '1' }));
    g.appendChild(svgEl('circle', { cx: x2, cy: y, r: '5', fill: '#334155', stroke: '#1e293b', 'stroke-width': '1' }));
    // Arm - starts open (angled up)
    g.appendChild(svgEl('line', {
      id: id + '-arm',
      x1: x1, y1: y, x2: x2, y2: y - 22,
      stroke: '#334155', 'stroke-width': '3', 'stroke-linecap': 'round'
    }));
    // Label
    txt(g, (x1 + x2) / 2, y - 28, 'Schalter', { size: '10', fill: '#64748b' });
    svg.appendChild(g);
  }

  // Light bulb with glow effect
  function drawBulb(svg, cx, cy, id) {
    var g = svgEl('g', { id: id });
    // Glow (hidden initially)
    g.appendChild(svgEl('circle', {
      id: id + '-glow', cx: cx, cy: cy, r: '28',
      fill: 'rgba(253,224,71,0)', stroke: 'none'
    }));
    // Glass envelope
    g.appendChild(svgEl('circle', {
      id: id + '-glass', cx: cx, cy: cy, r: '18',
      fill: '#e5e7eb', stroke: '#9ca3af', 'stroke-width': '2.5'
    }));
    // Filament (zigzag)
    g.appendChild(svgEl('path', {
      id: id + '-filament',
      d: 'M' + (cx - 7) + ',' + (cy + 6) +
         ' L' + (cx - 4) + ',' + (cy - 8) +
         ' L' + (cx) + ',' + (cy + 4) +
         ' L' + (cx + 4) + ',' + (cy - 8) +
         ' L' + (cx + 7) + ',' + (cy + 6),
      fill: 'none', stroke: '#9ca3af', 'stroke-width': '1.5',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));
    // Base
    g.appendChild(svgEl('rect', {
      x: cx - 8, y: cy + 16, width: 16, height: 7, rx: 2,
      fill: '#94a3b8', stroke: '#64748b', 'stroke-width': '1'
    }));
    // Label
    txt(g, cx, cy + 36, '6V / 0,1A', { size: '9', fill: '#64748b' });
    svg.appendChild(g);
    return g;
  }

  // Ohmmeter
  function drawOhmmeter(svg, cx, cy, displayId) {
    var g = svgEl('g', {});
    g.appendChild(svgEl('rect', { x: cx - 34, y: cy - 21, width: 68, height: 50, rx: 6, fill: '#cbd5e1' }));
    g.appendChild(svgEl('rect', { x: cx - 32, y: cy - 23, width: 64, height: 48, rx: 5, fill: '#e2e8f0', stroke: '#94a3b8', 'stroke-width': '2' }));
    txt(g, cx, cy - 8, 'Ohmmeter', { size: '8', fill: '#64748b' });
    g.appendChild(svgEl('rect', { x: cx - 24, y: cy, width: 48, height: 16, rx: 3, fill: '#dbeafe', stroke: '#93c5fd', 'stroke-width': '1' }));
    txt(g, cx, cy + 12, '– Ω', { size: '10', weight: '700', fill: '#1e40af', id: displayId });
    svg.appendChild(g);
  }

  // Ammeter circle
  function drawAmmeter(svg, cx, cy, id) {
    var g = svgEl('g', {});
    g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '20', fill: '#fef3c7', stroke: '#d97706', 'stroke-width': '2.5' }));
    txt(g, cx, cy + 6, 'A', { size: '14', weight: '700', fill: '#92400e' });
    if (id) {
      g.appendChild(svgEl('rect', { x: cx - 16, y: cy + 22, width: 32, height: 14, rx: 3, fill: '#fff', stroke: '#e5e7eb', 'stroke-width': '1' }));
      txt(g, cx, cy + 32, '– A', { size: '8', weight: '600', fill: '#92400e', id: id });
    }
    svg.appendChild(g);
  }

  // Voltmeter circle
  function drawVoltmeter(svg, cx, cy) {
    var g = svgEl('g', {});
    g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '20', fill: '#fee2e2', stroke: '#dc2626', 'stroke-width': '2.5' }));
    txt(g, cx, cy + 6, 'V', { size: '14', weight: '700', fill: '#991b1b' });
    svg.appendChild(g);
  }

  // Wire coil for V2
  function drawCoil(svg, cx, cy, id, label, matLabel, fillColor, strokeColor) {
    var g = svgEl('g', { id: id });
    // Coil body
    g.appendChild(svgEl('rect', {
      id: id + '-body', x: cx - 32, y: cy - 14, width: 64, height: 28, rx: 5,
      fill: fillColor || '#d1d5db', stroke: strokeColor || '#6b7280', 'stroke-width': '2'
    }));
    // Winding lines
    for (var i = 0; i < 6; i++) {
      g.appendChild(svgEl('line', {
        x1: cx - 24 + i * 10, y1: cy - 12, x2: cx - 24 + i * 10, y2: cy + 12,
        stroke: strokeColor || '#6b7280', 'stroke-width': '1', opacity: '0.3'
      }));
    }
    // Material label
    txt(g, cx, cy + 4, matLabel, { size: '11', weight: '700', fill: '#475569' });
    // Name label above
    txt(g, cx, cy - 22, label, { size: '10', fill: '#475569' });
    svg.appendChild(g);
    return g;
  }

  // Candle with animated flame
  function drawCandle(svg, cx, cy, id) {
    var g = svgEl('g', { id: id });

    // Candle body
    g.appendChild(svgEl('rect', {
      x: cx - 10, y: cy, width: 20, height: 30, rx: 2,
      fill: '#fef3c7', stroke: '#d97706', 'stroke-width': '1.5'
    }));
    // Wick
    g.appendChild(svgEl('line', {
      x1: cx, y1: cy, x2: cx, y2: cy - 6,
      stroke: '#44403c', 'stroke-width': '1.5'
    }));
    // Label
    txt(g, cx, cy + 44, 'Teelicht', { size: '9', fill: '#92400e' });

    // Flame group (hidden initially)
    var flame = svgEl('g', { id: id + '-flame', opacity: '0' });

    // Outer flame glow
    flame.appendChild(svgEl('ellipse', {
      cx: cx, cy: cy - 18, rx: '14', ry: '20',
      fill: 'rgba(251,191,36,0.15)', stroke: 'none'
    }));
    // Outer flame
    flame.appendChild(svgEl('path', {
      d: 'M' + cx + ',' + (cy - 34) +
         ' Q' + (cx + 10) + ',' + (cy - 22) + ' ' + (cx + 8) + ',' + (cy - 8) +
         ' Q' + (cx + 4) + ',' + (cy - 4) + ' ' + cx + ',' + (cy - 6) +
         ' Q' + (cx - 4) + ',' + (cy - 4) + ' ' + (cx - 8) + ',' + (cy - 8) +
         ' Q' + (cx - 10) + ',' + (cy - 22) + ' ' + cx + ',' + (cy - 34) + ' Z',
      fill: '#fbbf24', stroke: '#f59e0b', 'stroke-width': '1', opacity: '0.9'
    }));
    // Inner flame
    flame.appendChild(svgEl('path', {
      d: 'M' + cx + ',' + (cy - 28) +
         ' Q' + (cx + 5) + ',' + (cy - 18) + ' ' + (cx + 4) + ',' + (cy - 10) +
         ' Q' + (cx + 2) + ',' + (cy - 6) + ' ' + cx + ',' + (cy - 8) +
         ' Q' + (cx - 2) + ',' + (cy - 6) + ' ' + (cx - 4) + ',' + (cy - 10) +
         ' Q' + (cx - 5) + ',' + (cy - 18) + ' ' + cx + ',' + (cy - 28) + ' Z',
      fill: '#fef08a', stroke: 'none', opacity: '0.9'
    }));
    // Tiny blue core
    flame.appendChild(svgEl('ellipse', {
      cx: cx, cy: cy - 8, rx: '2.5', ry: '4',
      fill: '#60a5fa', opacity: '0.7'
    }));

    // Animate flame flicker
    var animFlicker = svgEl('animateTransform', {
      attributeName: 'transform', type: 'translate',
      values: '0,0; 1,-1; -1,0; 0,1; 1,0; 0,0',
      dur: '0.8s', repeatCount: 'indefinite'
    });
    flame.appendChild(animFlicker);

    g.appendChild(flame);
    svg.appendChild(g);
    return g;
  }

  // Heat waves rising from candle
  function drawHeatWaves(svg, cx, cy, id) {
    var g = svgEl('g', { id: id, opacity: '0' });
    for (var i = 0; i < 3; i++) {
      var offsetX = (i - 1) * 30;
      var wave = svgEl('path', {
        d: 'M' + (cx + offsetX - 6) + ',' + cy +
           ' Q' + (cx + offsetX) + ',' + (cy - 10) + ' ' + (cx + offsetX + 6) + ',' + cy +
           ' Q' + (cx + offsetX + 12) + ',' + (cy + 10) + ' ' + (cx + offsetX + 18) + ',' + cy,
        fill: 'none', stroke: '#f97316', 'stroke-width': '1.5', opacity: '0.5',
        'stroke-linecap': 'round'
      });
      wave.appendChild(svgEl('animateTransform', {
        attributeName: 'transform', type: 'translate',
        values: '0,0; 0,-15; 0,-30',
        dur: (1.5 + i * 0.3) + 's', repeatCount: 'indefinite'
      }));
      wave.appendChild(svgEl('animate', {
        attributeName: 'opacity',
        values: '0.6;0.3;0',
        dur: (1.5 + i * 0.3) + 's', repeatCount: 'indefinite'
      }));
      g.appendChild(wave);
    }
    svg.appendChild(g);
  }

  // Resistor symbol (zigzag block)
  function drawResistorBlock(svg, cx, cy, id, label) {
    var g = svgEl('g', { id: id || '' });
    // Resistor rectangle with zigzag
    g.appendChild(svgEl('rect', {
      x: cx - 28, y: cy - 10, width: 56, height: 20, rx: 3,
      fill: '#f1f5f9', stroke: '#6b7280', 'stroke-width': '2'
    }));
    // Zigzag lines inside
    var zd = 'M' + (cx - 22) + ',' + cy;
    var segs = 5;
    var segW = 44 / segs;
    for (var i = 0; i < segs; i++) {
      var xOff = cx - 22 + i * segW;
      zd += ' L' + (xOff + segW * 0.25) + ',' + (cy - 6);
      zd += ' L' + (xOff + segW * 0.75) + ',' + (cy + 6);
    }
    zd += ' L' + (cx + 22) + ',' + cy;
    g.appendChild(svgEl('path', {
      d: zd, fill: 'none', stroke: '#6b7280', 'stroke-width': '1.5',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));
    if (label) txt(g, cx, cy - 16, label, { size: '9', fill: '#475569' });
    svg.appendChild(g);
  }

  function addConclusion(panel, text) {
    var box = document.createElement('div');
    box.className = 'conclusion';
    box.innerHTML = '<strong>Erkenntnis</strong>' + text;
    panel.appendChild(box);
  }

  // Bulb visual state helpers
  function setBulbOn(id) {
    var glass = document.getElementById(id + '-glass');
    var glow = document.getElementById(id + '-glow');
    var filament = document.getElementById(id + '-filament');
    if (glass) { glass.setAttribute('fill', '#fde047'); glass.setAttribute('stroke', '#f59e0b'); }
    if (glow) glow.setAttribute('fill', 'rgba(253,224,71,0.45)');
    if (filament) filament.setAttribute('stroke', '#fbbf24');
  }

  function setBulbOff(id) {
    var glass = document.getElementById(id + '-glass');
    var glow = document.getElementById(id + '-glow');
    var filament = document.getElementById(id + '-filament');
    if (glass) { glass.setAttribute('fill', '#e5e7eb'); glass.setAttribute('stroke', '#9ca3af'); }
    if (glow) glow.setAttribute('fill', 'rgba(253,224,71,0)');
    if (filament) filament.setAttribute('stroke', '#9ca3af');
  }

  function setSwitchClosed(id) {
    var arm = document.getElementById(id + '-arm');
    if (arm) {
      var y = arm.getAttribute('y1');
      arm.setAttribute('y2', y);
    }
  }

  function setSwitchOpen(id) {
    var arm = document.getElementById(id + '-arm');
    if (arm) {
      var y = parseFloat(arm.getAttribute('y1'));
      arm.setAttribute('y2', y - 22);
    }
  }

  // ==================== V1: OHMMETER ====================

  function renderV1(panel) {
    // State
    state.phase = 'ready'; // ready, heating, measuring
    state.heatProgress = 0;
    state.resistance = 6.6;
    state.targetResistance = 6.6;
    state.elapsed = 0;

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.style.height = '280px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    setTimeout(function () { drawV1Circuit(viz); }, 0);

    // Controls
    var controlCard = document.createElement('div');
    controlCard.className = 'card';

    // Status
    var statusDiv = document.createElement('div');
    statusDiv.id = 'v1-status';
    statusDiv.innerHTML = '<span class="status-badge info">Bereit – Drücke "Glühlampe einschalten"</span>';
    controlCard.appendChild(statusDiv);

    // Heat progress bar
    var heatRow = document.createElement('div');
    heatRow.className = 'heat-bar-container mt-sm';
    heatRow.innerHTML =
      '<span class="control-label">Temperatur:</span>' +
      '<div class="heat-bar-track"><div class="heat-bar-fill" id="v1-heat-fill" style="width:0%"></div></div>' +
      '<span class="heat-bar-label" id="v1-heat-label">kalt</span>';
    controlCard.appendChild(heatRow);

    // Buttons
    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-sm';

    var btnHeat = document.createElement('button');
    btnHeat.className = 'btn btn-primary';
    btnHeat.id = 'v1-btn-heat';
    btnHeat.textContent = 'Glühlampe einschalten';
    btnRow.appendChild(btnHeat);

    var btnMeasure = document.createElement('button');
    btnMeasure.className = 'btn btn-secondary';
    btnMeasure.id = 'v1-btn-measure';
    btnMeasure.textContent = 'Schalter umlegen (messen)';
    btnMeasure.disabled = true;
    btnRow.appendChild(btnMeasure);

    var btnReset = document.createElement('button');
    btnReset.className = 'btn btn-secondary';
    btnReset.id = 'v1-btn-reset';
    btnReset.textContent = 'Zurücksetzen';
    btnRow.appendChild(btnReset);

    controlCard.appendChild(btnRow);
    panel.appendChild(controlCard);

    // Display values
    var displayCard = document.createElement('div');
    displayCard.className = 'card';
    displayCard.innerHTML =
      '<div class="voltage-row">' +
        '<div class="voltage-box resistance">' +
          '<div class="voltage-label">Widerstand (Ohmmeter)</div>' +
          '<div class="voltage-value" id="v1-resistance-val">– \u03A9</div>' +
        '</div>' +
        '<div class="voltage-box lamp">' +
          '<div class="voltage-label">Zustand</div>' +
          '<div class="voltage-value" id="v1-state-val">Aus</div>' +
        '</div>' +
      '</div>';
    panel.appendChild(displayCard);

    // Event handlers
    var heatInterval = null;
    var coolInterval = null;

    btnHeat.addEventListener('click', function () {
      if (state.phase !== 'ready') return;
      state.phase = 'heating';
      btnHeat.disabled = true;
      btnMeasure.disabled = false;
      document.getElementById('v1-status').innerHTML = '<span class="status-badge warning">Glühlampe leuchtet – Draht heizt sich auf...</span>';
      document.getElementById('v1-state-val').textContent = 'Leuchtend';

      // Update bulb visual and switch
      setBulbOn('v1-bulb');
      setSwitchClosed('v1-switch');

      // Animate heating
      heatInterval = setInterval(function () {
        if (state.phase !== 'heating') return;
        state.heatProgress = Math.min(100, state.heatProgress + 2);
        state.resistance = 6.6 + (60 - 6.6) * (state.heatProgress / 100);
        document.getElementById('v1-heat-fill').style.width = state.heatProgress + '%';
        document.getElementById('v1-heat-label').textContent = state.heatProgress >= 100 ? 'heiß' : Math.round(state.heatProgress) + '%';
        if (state.heatProgress >= 100) {
          clearInterval(heatInterval);
          document.getElementById('v1-status').innerHTML = '<span class="status-badge success">Glühlampe voll aufgeheizt – Schalter umlegen zum Messen!</span>';
        }
      }, 50);
    });

    btnMeasure.addEventListener('click', function () {
      if (state.phase !== 'heating') return;
      state.phase = 'measuring';
      clearInterval(heatInterval);
      btnMeasure.disabled = true;
      document.getElementById('v1-state-val').textContent = 'Aus (Messen)';

      // Turn off bulb, open switch
      setBulbOff('v1-bulb');
      setSwitchOpen('v1-switch');

      // Show initial resistance (hot)
      var startR = state.resistance;
      document.getElementById('v1-resistance-val').textContent = startR.toFixed(1) + ' \u03A9';
      document.getElementById('v1-status').innerHTML = '<span class="status-badge warning">Ohmmeter misst – Widerstand sinkt beim Abkühlen...</span>';

      // Animate cooling: resistance drops from current value to 6.6
      var coolStart = Date.now();
      var coolDuration = 4000;
      coolInterval = setInterval(function () {
        var t = (Date.now() - coolStart) / coolDuration;
        if (t >= 1) {
          t = 1;
          clearInterval(coolInterval);
          document.getElementById('v1-status').innerHTML = '<span class="status-badge success">Abgekühlt – Kaltwiderstand erreicht</span>';
          addConclusion(panel, currentExp.conclusion);
        }
        // Exponential decay
        var r = 6.6 + (startR - 6.6) * Math.exp(-3 * t);
        state.resistance = r;
        state.heatProgress = ((r - 6.6) / (60 - 6.6)) * 100;
        document.getElementById('v1-resistance-val').textContent = r.toFixed(1) + ' \u03A9';
        document.getElementById('v1-heat-fill').style.width = Math.max(0, state.heatProgress) + '%';
        document.getElementById('v1-heat-label').textContent = state.heatProgress < 5 ? 'kalt' : Math.round(state.heatProgress) + '%';

        // Update ohmmeter display in circuit
        var ohmDisplay = document.getElementById('v1-ohm-display');
        if (ohmDisplay) ohmDisplay.textContent = r.toFixed(1) + ' Ω';
      }, 50);
    });

    btnReset.addEventListener('click', function () {
      clearInterval(heatInterval);
      clearInterval(coolInterval);
      state.phase = 'ready';
      state.heatProgress = 0;
      state.resistance = 6.6;
      btnHeat.disabled = false;
      btnMeasure.disabled = true;
      document.getElementById('v1-status').innerHTML = '<span class="status-badge info">Bereit – Drücke "Glühlampe einschalten"</span>';
      document.getElementById('v1-resistance-val').textContent = '– \u03A9';
      document.getElementById('v1-state-val').textContent = 'Aus';
      document.getElementById('v1-heat-fill').style.width = '0%';
      document.getElementById('v1-heat-label').textContent = 'kalt';

      // Reset visuals
      setBulbOff('v1-bulb');
      setSwitchOpen('v1-switch');
      var ohmDisplay = document.getElementById('v1-ohm-display');
      if (ohmDisplay) ohmDisplay.textContent = '– Ω';

      // Remove any conclusion
      var conclusions = panel.querySelectorAll('.conclusion');
      conclusions.forEach(function (c) { c.remove(); });
    });

    cleanupFns.push(function () {
      clearInterval(heatInterval);
      clearInterval(coolInterval);
    });
  }

  function drawV1Circuit(viz) {
    // All-SVG circuit with fixed viewBox — no gaps
    var svg = createSVG(viz, 500, 270);

    // Layout coordinates
    var batX = 65, batY = 135;    // Battery center
    var swL = 160, swR = 220, swY = 48; // Switch contacts
    var bulbX = 320, bulbY = 48;        // Bulb center
    var ohmX = 430, ohmY = 135;         // Ohmmeter center
    var botY = 235;                     // Bottom wire Y

    // --- Wires (drawn first, behind components) ---
    // Battery top → up → left switch contact
    wire(svg, [[batX, batY - 22], [batX, swY], [swL, swY]]);
    // Right switch contact → bulb left
    wire(svg, [[swR, swY], [bulbX - 18, swY]]);
    // Bulb right → ohmmeter top
    wire(svg, [[bulbX + 18, swY], [ohmX, swY], [ohmX, ohmY - 23]]);
    // Ohmmeter bottom → bottom → battery bottom
    wire(svg, [[ohmX, ohmY + 25], [ohmX, botY], [batX, botY], [batX, batY + 22]]);

    // --- Components ---
    drawBattery(svg, batX, batY, '6 V');
    drawSwitch(svg, swL, swR, swY, 'v1-switch');
    drawBulb(svg, bulbX, bulbY, 'v1-bulb');
    drawOhmmeter(svg, ohmX, ohmY, 'v1-ohm-display');

    // Current direction arrows on wires
    var arrowColor = '#94a3b8';
    // Arrow on top wire (right direction)
    svg.appendChild(svgEl('polygon', {
      points: (swR + 20) + ',' + (swY - 5) + ' ' + (swR + 30) + ',' + swY + ' ' + (swR + 20) + ',' + (swY + 5),
      fill: arrowColor
    }));
    // Arrow on bottom wire (left direction)
    svg.appendChild(svgEl('polygon', {
      points: (ohmX - 60) + ',' + (botY - 5) + ' ' + (ohmX - 70) + ',' + botY + ' ' + (ohmX - 60) + ',' + (botY + 5),
      fill: arrowColor
    }));
  }

  // ==================== V2: HEATING WIRE RESISTANCE ====================

  function renderV2(panel) {
    state.heating = false;
    state.heatLevel = 0;
    state.ironR = 2.0;
    state.constantanR = 8.0;

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.style.height = '320px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    setTimeout(function () { drawV2Circuit(viz); }, 0);

    // Display values
    var displayCard = document.createElement('div');
    displayCard.className = 'card';
    displayCard.innerHTML =
      '<div class="voltage-row">' +
        '<div class="voltage-box resistance">' +
          '<div class="voltage-label">Eisendraht</div>' +
          '<div class="voltage-value" id="v2-iron-val">2,0 \u03A9</div>' +
        '</div>' +
        '<div class="voltage-box lamp">' +
          '<div class="voltage-label">Konstantandraht</div>' +
          '<div class="voltage-value" id="v2-const-val">8,0 \u03A9</div>' +
        '</div>' +
      '</div>';
    panel.appendChild(displayCard);

    // Heat progress
    var heatCard = document.createElement('div');
    heatCard.className = 'card';

    var statusDiv = document.createElement('div');
    statusDiv.id = 'v2-status';
    statusDiv.innerHTML = '<span class="status-badge info">Bereit – Teelicht anzünden</span>';
    heatCard.appendChild(statusDiv);

    var heatRow = document.createElement('div');
    heatRow.className = 'heat-bar-container mt-sm';
    heatRow.innerHTML =
      '<span class="control-label">Erwärmung:</span>' +
      '<div class="heat-bar-track"><div class="heat-bar-fill" id="v2-heat-fill" style="width:0%"></div></div>' +
      '<span class="heat-bar-label" id="v2-heat-label">kalt</span>';
    heatCard.appendChild(heatRow);

    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-sm';

    var btnLight = document.createElement('button');
    btnLight.className = 'btn btn-primary';
    btnLight.id = 'v2-btn-light';
    btnLight.textContent = 'Teelicht anzünden';
    btnRow.appendChild(btnLight);

    var btnStop = document.createElement('button');
    btnStop.className = 'btn btn-secondary';
    btnStop.id = 'v2-btn-stop';
    btnStop.textContent = 'Teelicht löschen';
    btnStop.disabled = true;
    btnRow.appendChild(btnStop);

    var btnReset = document.createElement('button');
    btnReset.className = 'btn btn-secondary';
    btnReset.textContent = 'Zurücksetzen';
    btnRow.appendChild(btnReset);

    heatCard.appendChild(btnRow);
    panel.appendChild(heatCard);

    // Results table
    var tableCard = document.createElement('div');
    tableCard.className = 'card';
    tableCard.innerHTML =
      '<table class="results-table" id="v2-table">' +
        '<thead><tr><th>Erwärmung</th><th>Eisendraht (\u03A9)</th><th>Konstantandraht (\u03A9)</th></tr></thead>' +
        '<tbody>' +
          '<tr><td>Kalt (Start)</td><td>2,0</td><td>8,0</td></tr>' +
        '</tbody>' +
      '</table>';
    panel.appendChild(tableCard);

    var heatInterval = null;
    var conclusionShown = false;

    function updateV2Display() {
      document.getElementById('v2-iron-val').textContent = state.ironR.toFixed(1).replace('.', ',') + ' \u03A9';
      document.getElementById('v2-const-val').textContent = state.constantanR.toFixed(1).replace('.', ',') + ' \u03A9';
      document.getElementById('v2-heat-fill').style.width = state.heatLevel + '%';

      // Update SVG displays
      var ironOhmDisplay = document.getElementById('v2-iron-ohm');
      var constOhmDisplay = document.getElementById('v2-const-ohm');
      if (ironOhmDisplay) ironOhmDisplay.textContent = state.ironR.toFixed(1) + ' Ω';
      if (constOhmDisplay) constOhmDisplay.textContent = state.constantanR.toFixed(1) + ' Ω';

      // Update iron coil color based on heat (gets reddish)
      var ironBody = document.getElementById('v2-iron-coil-body');
      if (ironBody) {
        var heatFrac = state.heatLevel / 100;
        var r = Math.round(209 + 46 * heatFrac);
        var g = Math.round(213 - 80 * heatFrac);
        var b = Math.round(219 - 100 * heatFrac);
        ironBody.setAttribute('fill', 'rgb(' + r + ',' + g + ',' + b + ')');
        if (heatFrac > 0.5) {
          ironBody.setAttribute('stroke', '#b45309');
        } else {
          ironBody.setAttribute('stroke', '#6b7280');
        }
      }

      if (state.heatLevel < 20) {
        document.getElementById('v2-heat-label').textContent = 'kalt';
      } else if (state.heatLevel < 60) {
        document.getElementById('v2-heat-label').textContent = 'warm';
      } else {
        document.getElementById('v2-heat-label').textContent = 'heiß';
      }
    }

    function addTableRow() {
      var tbody = document.querySelector('#v2-table tbody');
      var label = state.heatLevel < 30 ? 'Leicht warm' : state.heatLevel < 70 ? 'Warm' : 'Heiß';
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + label + ' (' + Math.round(state.heatLevel) + '%)</td><td>' +
        state.ironR.toFixed(1).replace('.', ',') + '</td><td>' +
        state.constantanR.toFixed(1).replace('.', ',') + '</td>';
      tbody.appendChild(tr);
    }

    var lastTableUpdate = 0;

    btnLight.addEventListener('click', function () {
      if (state.heating) return;
      state.heating = true;
      btnLight.disabled = true;
      btnStop.disabled = false;
      document.getElementById('v2-status').innerHTML = '<span class="status-badge warning">Teelicht brennt – Drähte werden erhitzt...</span>';

      // Show flame and heat waves
      var flameEl = document.getElementById('v2-candle-flame');
      if (flameEl) flameEl.setAttribute('opacity', '1');
      var heatWaves = document.getElementById('v2-heat-waves');
      if (heatWaves) heatWaves.setAttribute('opacity', '1');

      heatInterval = setInterval(function () {
        if (!state.heating) return;
        state.heatLevel = Math.min(100, state.heatLevel + 0.5);

        // Iron resistance increases with temperature: 2.0 -> ~5.0
        state.ironR = 2.0 + 3.0 * (state.heatLevel / 100);
        // Constantan stays nearly the same
        state.constantanR = 8.0 + 0.05 * (state.heatLevel / 100);

        updateV2Display();

        // Add table row at 25%, 50%, 75%, 100%
        if (state.heatLevel >= 25 && lastTableUpdate < 25) { lastTableUpdate = 25; addTableRow(); }
        if (state.heatLevel >= 50 && lastTableUpdate < 50) { lastTableUpdate = 50; addTableRow(); }
        if (state.heatLevel >= 75 && lastTableUpdate < 75) { lastTableUpdate = 75; addTableRow(); }
        if (state.heatLevel >= 100) {
          lastTableUpdate = 100;
          addTableRow();
          clearInterval(heatInterval);
          state.heating = false;
          btnStop.disabled = true;
          document.getElementById('v2-status').innerHTML = '<span class="status-badge success">Maximale Temperatur erreicht</span>';
          if (!conclusionShown) {
            conclusionShown = true;
            addConclusion(panel, currentExp.conclusion);
          }
        }
      }, 50);
    });

    btnStop.addEventListener('click', function () {
      state.heating = false;
      clearInterval(heatInterval);
      btnLight.disabled = false;
      btnStop.disabled = true;
      document.getElementById('v2-status').innerHTML = '<span class="status-badge info">Teelicht gelöscht – Weiter erwärmen oder zurücksetzen</span>';

      // Hide flame and heat waves
      var flameEl = document.getElementById('v2-candle-flame');
      if (flameEl) flameEl.setAttribute('opacity', '0');
      var heatWaves = document.getElementById('v2-heat-waves');
      if (heatWaves) heatWaves.setAttribute('opacity', '0');

      if (state.heatLevel > 0 && lastTableUpdate < Math.floor(state.heatLevel / 25) * 25) {
        addTableRow();
        lastTableUpdate = Math.floor(state.heatLevel / 25) * 25;
      }
    });

    btnReset.addEventListener('click', function () {
      clearInterval(heatInterval);
      state.heating = false;
      state.heatLevel = 0;
      state.ironR = 2.0;
      state.constantanR = 8.0;
      lastTableUpdate = 0;
      conclusionShown = false;
      btnLight.disabled = false;
      btnStop.disabled = true;
      updateV2Display();
      document.getElementById('v2-status').innerHTML = '<span class="status-badge info">Bereit – Teelicht anzünden</span>';

      // Hide flame and heat waves
      var flameEl = document.getElementById('v2-candle-flame');
      if (flameEl) flameEl.setAttribute('opacity', '0');
      var heatWaves = document.getElementById('v2-heat-waves');
      if (heatWaves) heatWaves.setAttribute('opacity', '0');

      // Reset iron coil color
      var ironBody = document.getElementById('v2-iron-coil-body');
      if (ironBody) {
        ironBody.setAttribute('fill', '#d1d5db');
        ironBody.setAttribute('stroke', '#6b7280');
      }

      // Reset table
      var tbody = document.querySelector('#v2-table tbody');
      tbody.innerHTML = '<tr><td>Kalt (Start)</td><td>2,0</td><td>8,0</td></tr>';

      // Remove conclusions
      var conclusions = panel.querySelectorAll('.conclusion');
      conclusions.forEach(function (c) { c.remove(); });
    });

    cleanupFns.push(function () {
      clearInterval(heatInterval);
    });
  }

  function drawV2Circuit(viz) {
    var svg = createSVG(viz, 500, 310);

    // Layout coordinates
    var ohmX = 250, ohmY = 35;
    var ironX = 115, coilY = 140;
    var constX = 385, constY = 140;
    var candleX = 250, candleY = 230;
    var botY = 260;

    // --- Wires ---
    // Ohmmeter left → iron coil top
    wire(svg, [[ohmX - 32, ohmY], [ironX, ohmY], [ironX, coilY - 14]]);
    // Iron coil bottom → bottom wire → constantan bottom
    wire(svg, [[ironX, coilY + 14], [ironX, botY], [constX, botY], [constX, constY + 14]]);
    // Constantan coil top → ohmmeter right
    wire(svg, [[constX, constY - 14], [constX, ohmY], [ohmX + 32, ohmY]]);

    // --- Components ---
    drawOhmmeter(svg, ohmX, ohmY, 'v2-ohm-display');

    // Iron coil
    var ironGroup = drawCoil(svg, ironX, coilY, 'v2-iron-coil', 'Eisendraht', 'Fe', '#d1d5db', '#6b7280');
    // Resistance display under iron coil
    svg.appendChild(svgEl('rect', { x: ironX - 24, y: coilY + 20, width: 48, height: 16, rx: 3, fill: '#f0fdf4', stroke: '#bbf7d0', 'stroke-width': '1' }));
    txt(svg, ironX, coilY + 31, '2.0 Ω', { size: '9', weight: '700', fill: '#166534', id: 'v2-iron-ohm' });

    // Constantan coil
    drawCoil(svg, constX, constY, 'v2-const-coil', 'Konstantandraht', 'CuNi', '#fcd34d', '#d97706');
    // Resistance display under constantan coil
    svg.appendChild(svgEl('rect', { x: constX - 24, y: constY + 20, width: 48, height: 16, rx: 3, fill: '#dbeafe', stroke: '#bfdbfe', 'stroke-width': '1' }));
    txt(svg, constX, constY + 31, '8.0 Ω', { size: '9', weight: '700', fill: '#1e40af', id: 'v2-const-ohm' });

    // Heat waves (between candle and coils)
    drawHeatWaves(svg, candleX, coilY + 50, 'v2-heat-waves');

    // Candle
    drawCandle(svg, candleX, candleY, 'v2-candle');

    // Bracket showing both wires are heated
    var bracketY = coilY + 44;
    wire(svg, [[ironX - 10, bracketY], [ironX - 10, bracketY + 8], [constX + 10, bracketY + 8], [constX + 10, bracketY]], '#d97706');
    // Arrow down from bracket to candle
    svg.appendChild(svgEl('line', {
      x1: candleX, y1: bracketY + 8, x2: candleX, y2: candleY - 42,
      stroke: '#d97706', 'stroke-width': '1.5', 'stroke-dasharray': '4 3'
    }));
    txt(svg, candleX, bracketY + 22, 'erhitzt', { size: '9', fill: '#b45309' });
  }

  // ==================== V3: U-I CHARACTERISTICS ====================

  function renderV3(panel) {
    state.activeLines = { bulb: true, constantan: true, ironAir: true, ironWater: true };
    state.voltageIndex = 0;
    state.measuredPoints = {};
    Object.keys(V3_DATA).forEach(function (k) { state.measuredPoints[k] = [{ v: 0, i: 0 }]; });
    state.allMeasured = false;

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.style.height = '220px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    setTimeout(function () { drawV3Circuit(viz); }, 0);

    // Data table
    var tableCard = document.createElement('div');
    tableCard.className = 'card';
    tableCard.innerHTML = buildV3Table();
    panel.appendChild(tableCard);

    // Chart
    var chartCard = document.createElement('div');
    chartCard.className = 'card';

    var chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.id = 'v3-chart';
    chartCard.appendChild(chartContainer);

    // Legend
    var legend = document.createElement('div');
    legend.className = 'chart-legend';
    legend.id = 'v3-legend';
    Object.keys(V3_DATA).forEach(function (key) {
      var d = V3_DATA[key];
      var item = document.createElement('div');
      item.className = 'legend-item';
      item.dataset.key = key;
      item.innerHTML = '<div class="legend-color" style="background:' + d.color + '"></div>' + d.label;
      item.addEventListener('click', function () {
        state.activeLines[key] = !state.activeLines[key];
        item.classList.toggle('inactive', !state.activeLines[key]);
        drawV3Chart();
      });
      legend.appendChild(item);
    });
    chartCard.appendChild(legend);
    panel.appendChild(chartCard);

    // Tooltip
    var tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.id = 'v3-tooltip';
    chartContainer.appendChild(tooltip);

    // Controls for stepping through measurements
    var controlCard = document.createElement('div');
    controlCard.className = 'card';

    var statusDiv = document.createElement('div');
    statusDiv.id = 'v3-status';
    statusDiv.innerHTML = '<span class="status-badge info">Spannung einstellen und messen</span>';
    controlCard.appendChild(statusDiv);

    // Voltage slider
    var sliderDiv = document.createElement('div');
    sliderDiv.className = 'slider-container mt-sm';
    sliderDiv.innerHTML =
      '<div class="slider-row">' +
        '<span class="control-label">Spannung U:</span>' +
        '<input type="range" class="slider-input" id="v3-voltage" min="0" max="6" step="1" value="0">' +
        '<span class="slider-value" id="v3-voltage-val">0 V</span>' +
      '</div>';
    controlCard.appendChild(sliderDiv);

    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-sm';

    var btnMeasure = document.createElement('button');
    btnMeasure.className = 'btn btn-primary';
    btnMeasure.id = 'v3-btn-measure';
    btnMeasure.textContent = 'Messung durchführen';
    btnRow.appendChild(btnMeasure);

    var btnAutoAll = document.createElement('button');
    btnAutoAll.className = 'btn btn-secondary';
    btnAutoAll.id = 'v3-btn-auto';
    btnAutoAll.textContent = 'Alle Messungen automatisch';
    btnRow.appendChild(btnAutoAll);

    var btnReset = document.createElement('button');
    btnReset.className = 'btn btn-secondary';
    btnReset.textContent = 'Zurücksetzen';
    btnRow.appendChild(btnReset);

    controlCard.appendChild(btnRow);
    panel.appendChild(controlCard);

    // Draw initial empty chart
    setTimeout(function () { drawV3Chart(); }, 0);

    // Slider event
    var slider = document.getElementById('v3-voltage');
    slider.addEventListener('input', function () {
      document.getElementById('v3-voltage-val').textContent = slider.value + ' V';
      // Update voltage display in circuit
      var voltDisplay = document.getElementById('v3-volt-display');
      if (voltDisplay) voltDisplay.textContent = slider.value + ' V';
    });

    // Measure at current voltage
    btnMeasure.addEventListener('click', function () {
      var v = parseInt(slider.value);
      var vIdx = v;
      var anyNew = false;

      Object.keys(V3_DATA).forEach(function (key) {
        var data = V3_DATA[key];
        var alreadyMeasured = state.measuredPoints[key].some(function (p) { return p.v === v; });
        if (!alreadyMeasured && vIdx < data.voltages.length) {
          state.measuredPoints[key].push({ v: data.voltages[vIdx], i: data.currents[vIdx] });
          state.measuredPoints[key].sort(function (a, b) { return a.v - b.v; });
          anyNew = true;
        }
      });

      if (anyNew) {
        updateV3Table();
        drawV3Chart();
        checkAllMeasured();
      }
    });

    // Auto all measurements
    var autoInterval = null;
    btnAutoAll.addEventListener('click', function () {
      btnAutoAll.disabled = true;
      btnMeasure.disabled = true;
      var voltageStep = 0;
      autoInterval = setInterval(function () {
        if (voltageStep > 6) {
          clearInterval(autoInterval);
          btnMeasure.disabled = false;
          checkAllMeasured();
          return;
        }
        slider.value = voltageStep;
        document.getElementById('v3-voltage-val').textContent = voltageStep + ' V';
        var voltDisplay = document.getElementById('v3-volt-display');
        if (voltDisplay) voltDisplay.textContent = voltageStep + ' V';

        Object.keys(V3_DATA).forEach(function (key) {
          var data = V3_DATA[key];
          var alreadyMeasured = state.measuredPoints[key].some(function (p) { return p.v === voltageStep; });
          if (!alreadyMeasured && voltageStep < data.voltages.length) {
            state.measuredPoints[key].push({ v: data.voltages[voltageStep], i: data.currents[voltageStep] });
            state.measuredPoints[key].sort(function (a, b) { return a.v - b.v; });
          }
        });
        updateV3Table();
        drawV3Chart();
        voltageStep++;
      }, 500);
    });

    btnReset.addEventListener('click', function () {
      clearInterval(autoInterval);
      Object.keys(V3_DATA).forEach(function (k) { state.measuredPoints[k] = [{ v: 0, i: 0 }]; });
      state.allMeasured = false;
      slider.value = 0;
      document.getElementById('v3-voltage-val').textContent = '0 V';
      var voltDisplay = document.getElementById('v3-volt-display');
      if (voltDisplay) voltDisplay.textContent = '0 V';
      btnAutoAll.disabled = false;
      btnMeasure.disabled = false;
      document.getElementById('v3-status').innerHTML = '<span class="status-badge info">Spannung einstellen und messen</span>';
      updateV3Table();
      drawV3Chart();

      // Remove conclusions
      var conclusions = panel.querySelectorAll('.conclusion');
      conclusions.forEach(function (c) { c.remove(); });
    });

    function checkAllMeasured() {
      var allDone = true;
      Object.keys(V3_DATA).forEach(function (key) {
        if (state.measuredPoints[key].length < V3_DATA[key].voltages.length) allDone = false;
      });
      if (allDone && !state.allMeasured) {
        state.allMeasured = true;
        document.getElementById('v3-status').innerHTML = '<span class="status-badge success">Alle Messungen abgeschlossen</span>';
        addConclusion(panel, currentExp.conclusion);
      }
    }

    cleanupFns.push(function () {
      clearInterval(autoInterval);
    });
  }

  function drawV3Circuit(viz) {
    var svg = createSVG(viz, 520, 210);

    // Layout coordinates
    var psX = 60, psY = 105;          // Power supply center
    var amX = 200, amY = 40;          // Ammeter center
    var objX = 340, objY = 40;        // Test object center
    var vmX = 440, vmY = 105;         // Voltmeter center
    var botY = 180;                   // Bottom wire

    // --- Wires ---
    // Power supply top → ammeter left
    wire(svg, [[psX, psY - 22], [psX, amY], [amX - 20, amY]]);
    // Ammeter right → test object left
    wire(svg, [[amX + 20, amY], [objX - 28, amY]]);
    // Test object right → right side down
    wire(svg, [[objX + 28, amY], [vmX, amY], [vmX, vmY - 20]]);
    // Voltmeter bottom → bottom wire → power supply bottom
    wire(svg, [[vmX, vmY + 20], [vmX, botY], [psX, botY], [psX, psY + 22]]);

    // Voltmeter parallel connection wires (dashed to show parallel)
    var vmLeftX = objX - 28;
    svg.appendChild(svgEl('polyline', {
      points: vmLeftX + ',' + amY + ' ' + vmLeftX + ',' + (vmY) + ' ' + (vmX - 20) + ',' + vmY,
      fill: 'none', stroke: '#dc2626', 'stroke-width': '1.5',
      'stroke-dasharray': '6 3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));
    svg.appendChild(svgEl('polyline', {
      points: (objX + 28) + ',' + amY + ' ' + (objX + 28) + ',' + vmY + ' ' + (vmX + 20) + ',' + vmY,
      fill: 'none', stroke: '#dc2626', 'stroke-width': '1.5',
      'stroke-dasharray': '6 3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));

    // --- Components ---
    // Power supply with adjustable label
    var gPS = svgEl('g', {});
    gPS.appendChild(svgEl('rect', { x: psX - 32, y: psY - 20, width: 64, height: 46, rx: 6, fill: '#cbd5e1' }));
    gPS.appendChild(svgEl('rect', { x: psX - 30, y: psY - 22, width: 60, height: 44, rx: 5, fill: '#e2e8f0', stroke: '#94a3b8', 'stroke-width': '2' }));
    gPS.appendChild(svgEl('rect', { x: psX - 18, y: psY - 10, width: 36, height: 18, rx: 3, fill: '#dbeafe', stroke: '#93c5fd', 'stroke-width': '1' }));
    txt(gPS, psX, psY + 4, '0 V', { size: '12', weight: '700', fill: '#1e40af', id: 'v3-volt-display' });
    txt(gPS, psX, psY + 34, 'Quelle (regelbar)', { size: '8', fill: '#64748b' });
    txt(gPS, psX + 24, psY - 24, '+', { size: '13', weight: 'bold', fill: '#dc2626' });
    txt(gPS, psX + 24, psY + 32, '−', { size: '15', weight: 'bold', fill: '#2563eb' });
    svg.appendChild(gPS);

    // Ammeter
    drawAmmeter(svg, amX, amY);
    txt(svg, amX, amY + 28, 'Strommesser', { size: '8', fill: '#64748b' });

    // Test object (resistor/lamp symbol)
    drawResistorBlock(svg, objX, amY, null, 'Prüfobjekt');

    // Voltmeter
    drawVoltmeter(svg, vmX, vmY);
    txt(svg, vmX, vmY + 28, 'Spannungsmesser', { size: '8', fill: '#64748b' });

    // Current direction arrows
    var arrowColor = '#94a3b8';
    svg.appendChild(svgEl('polygon', {
      points: (amX - 40) + ',' + (amY - 5) + ' ' + (amX - 30) + ',' + amY + ' ' + (amX - 40) + ',' + (amY + 5),
      fill: arrowColor
    }));
    svg.appendChild(svgEl('polygon', {
      points: (psX + 40) + ',' + (botY + 5) + ' ' + (psX + 30) + ',' + botY + ' ' + (psX + 40) + ',' + (botY - 5),
      fill: arrowColor
    }));
    // Label: I direction
    txt(svg, amX - 35, amY - 12, 'I →', { size: '9', fill: '#94a3b8' });
  }

  function buildV3Table() {
    var voltages = [0, 1, 2, 3, 4, 5, 6];
    var html = '<table class="results-table" id="v3-table">';
    html += '<thead><tr><th></th><th>U in V</th>';
    voltages.forEach(function (v) { html += '<th>' + v.toFixed(1).replace('.', ',') + '</th>'; });
    html += '</tr></thead><tbody>';

    Object.keys(V3_DATA).forEach(function (key) {
      var d = V3_DATA[key];
      html += '<tr><td style="font-weight:600;white-space:nowrap">' + d.label + '</td><td style="font-style:italic">I in A</td>';
      voltages.forEach(function (v, idx) {
        var measured = state.measuredPoints[key].some(function (p) { return p.v === v; });
        if (measured) {
          html += '<td style="color:' + d.color + ';font-weight:600">' + d.currents[idx].toFixed(2).replace('.', ',') + '</td>';
        } else {
          html += '<td style="color:#ccc">–</td>';
        }
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  function updateV3Table() {
    var tableCard = document.getElementById('v3-table');
    if (tableCard) {
      tableCard.outerHTML = buildV3Table();
    }
  }

  function drawV3Chart() {
    var container = document.getElementById('v3-chart');
    if (!container) return;

    var tooltip = document.getElementById('v3-tooltip');
    // Remove old SVG
    var oldSvg = container.querySelector('svg');
    if (oldSvg) oldSvg.remove();

    var cw = container.offsetWidth;
    var ch = container.offsetHeight;
    if (cw === 0 || ch === 0) return;

    var margin = { top: 20, right: 20, bottom: 45, left: 55 };
    var plotW = cw - margin.left - margin.right;
    var plotH = ch - margin.top - margin.bottom;

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', cw);
    svg.setAttribute('height', ch);
    svg.setAttribute('viewBox', '0 0 ' + cw + ' ' + ch);
    container.insertBefore(svg, tooltip);

    var maxU = 6;
    var maxI = 3;

    function scaleX(u) { return margin.left + (u / maxU) * plotW; }
    function scaleY(i) { return margin.top + plotH - (i / maxI) * plotH; }

    // Grid lines
    for (var iu = 0; iu <= 6; iu++) {
      var gl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      gl.setAttribute('x1', scaleX(iu));
      gl.setAttribute('y1', margin.top);
      gl.setAttribute('x2', scaleX(iu));
      gl.setAttribute('y2', margin.top + plotH);
      gl.setAttribute('class', 'chart-grid-line');
      svg.appendChild(gl);

      var tl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tl.setAttribute('x', scaleX(iu));
      tl.setAttribute('y', margin.top + plotH + 18);
      tl.setAttribute('text-anchor', 'middle');
      tl.setAttribute('class', 'chart-tick-label');
      tl.textContent = iu.toFixed(1).replace('.', ',');
      svg.appendChild(tl);
    }

    for (var ii = 0; ii <= 6; ii++) {
      var val = ii * 0.5;
      if (val > maxI) break;
      var glh = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      glh.setAttribute('x1', margin.left);
      glh.setAttribute('y1', scaleY(val));
      glh.setAttribute('x2', margin.left + plotW);
      glh.setAttribute('y2', scaleY(val));
      glh.setAttribute('class', 'chart-grid-line');
      svg.appendChild(glh);

      var tlh = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tlh.setAttribute('x', margin.left - 10);
      tlh.setAttribute('y', scaleY(val) + 4);
      tlh.setAttribute('text-anchor', 'end');
      tlh.setAttribute('class', 'chart-tick-label');
      tlh.textContent = val.toFixed(1).replace('.', ',');
      svg.appendChild(tlh);
    }

    // Axes
    var xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', margin.left);
    xAxis.setAttribute('y1', margin.top + plotH);
    xAxis.setAttribute('x2', margin.left + plotW);
    xAxis.setAttribute('y2', margin.top + plotH);
    xAxis.setAttribute('stroke', '#374151');
    xAxis.setAttribute('stroke-width', '2');
    svg.appendChild(xAxis);

    var yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', margin.left);
    yAxis.setAttribute('y1', margin.top);
    yAxis.setAttribute('x2', margin.left);
    yAxis.setAttribute('y2', margin.top + plotH);
    yAxis.setAttribute('stroke', '#374151');
    yAxis.setAttribute('stroke-width', '2');
    svg.appendChild(yAxis);

    // Axis labels
    var xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', margin.left + plotW / 2);
    xLabel.setAttribute('y', ch - 5);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('class', 'chart-axis-label');
    xLabel.textContent = 'U in V';
    svg.appendChild(xLabel);

    var yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('x', 15);
    yLabel.setAttribute('y', margin.top + plotH / 2);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('class', 'chart-axis-label');
    yLabel.setAttribute('transform', 'rotate(-90,' + 15 + ',' + (margin.top + plotH / 2) + ')');
    yLabel.textContent = 'I in A';
    svg.appendChild(yLabel);

    // Plot data lines and dots
    Object.keys(V3_DATA).forEach(function (key) {
      if (!state.activeLines[key]) return;
      var d = V3_DATA[key];
      var points = state.measuredPoints[key];
      if (points.length < 2) {
        // Just draw the single dot at origin
        if (points.length === 1) {
          var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('cx', scaleX(points[0].v));
          dot.setAttribute('cy', scaleY(points[0].i));
          dot.setAttribute('r', '4');
          dot.setAttribute('fill', d.color);
          dot.setAttribute('stroke', '#fff');
          dot.setAttribute('class', 'chart-dot');
          svg.appendChild(dot);
        }
        return;
      }

      // Draw line
      var pathData = 'M';
      points.forEach(function (p, idx) {
        if (idx === 0) {
          pathData += scaleX(p.v) + ',' + scaleY(p.i);
        } else {
          pathData += ' L' + scaleX(p.v) + ',' + scaleY(p.i);
        }
      });

      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('class', 'chart-line');
      path.setAttribute('stroke', d.color);
      svg.appendChild(path);

      // Draw dots
      points.forEach(function (p) {
        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', scaleX(p.v));
        dot.setAttribute('cy', scaleY(p.i));
        dot.setAttribute('r', '4');
        dot.setAttribute('fill', d.color);
        dot.setAttribute('stroke', '#fff');
        dot.setAttribute('stroke-width', '2');
        dot.setAttribute('class', 'chart-dot');
        dot.addEventListener('mouseenter', function (e) {
          tooltip.textContent = d.label + ': U = ' + p.v.toFixed(1).replace('.', ',') + ' V, I = ' + p.i.toFixed(2).replace('.', ',') + ' A';
          tooltip.classList.add('visible');
          var rect = container.getBoundingClientRect();
          tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
          tooltip.style.top = (e.clientY - rect.top - 30) + 'px';
        });
        dot.addEventListener('mouseleave', function () {
          tooltip.classList.remove('visible');
        });
        svg.appendChild(dot);
      });
    });
  }

  // ==================== STARTUP ====================

  document.addEventListener('DOMContentLoaded', init);
})();
