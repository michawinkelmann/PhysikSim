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
      instruction: 'Schließe nacheinander eine Glühlampe, einen Konstantandraht (Länge 1,6\u202fm; Querschnittsfläche 0,01\u202fmm²) und einen Eisendraht an eine elektrische Quelle an. Miss die Stromstärke für verschiedene Spannungen. Wiederhole die Messung für den Eisendraht im Wasserbad.',
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

  // ==================== HELPERS ====================

  function makeSVG(container) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    var rect = container.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    container.appendChild(svg);
    return svg;
  }

  function drawWire(svg, points, color) {
    var polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points.map(function (p) { return p[0] + ',' + p[1]; }).join(' '));
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', color || '#475569');
    polyline.setAttribute('stroke-width', '2.5');
    polyline.setAttribute('stroke-linecap', 'round');
    polyline.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(polyline);
    return polyline;
  }

  function addConclusion(panel, text) {
    var box = document.createElement('div');
    box.className = 'conclusion';
    box.innerHTML = '<strong>Erkenntnis</strong>' + text;
    panel.appendChild(box);
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

    // We'll draw the circuit after the DOM is ready
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

      // Update bulb visual
      var bulbEl = document.querySelector('.bulb-glass');
      if (bulbEl) bulbEl.className = 'bulb-glass on';

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

      // Turn off bulb
      var bulbEl = document.querySelector('.bulb-glass');
      if (bulbEl) bulbEl.className = 'bulb-glass off';

      // Show initial resistance (hot)
      var startR = state.resistance;
      document.getElementById('v1-resistance-val').textContent = startR.toFixed(1) + ' \u03A9';
      document.getElementById('v1-status').innerHTML = '<span class="status-badge warning">Ohmmeter misst – Widerstand sinkt beim Abkühlen...</span>';

      // Animate cooling: resistance drops from current value to 6.6
      var coolStart = Date.now();
      var coolDuration = 4000; // 4 seconds to cool
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
        if (ohmDisplay) ohmDisplay.textContent = r.toFixed(1) + ' \u03A9';
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
      var bulbEl = document.querySelector('.bulb-glass');
      if (bulbEl) bulbEl.className = 'bulb-glass off';
      var ohmDisplay = document.getElementById('v1-ohm-display');
      if (ohmDisplay) ohmDisplay.textContent = '– \u03A9';

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
    var w = viz.offsetWidth;
    var h = viz.offsetHeight;

    // Power supply (battery) - bottom left
    var ps = document.createElement('div');
    ps.className = 'power-supply';
    ps.style.left = (w * 0.05) + 'px';
    ps.style.top = (h * 0.5 - 25) + 'px';
    ps.innerHTML =
      '<div class="power-supply-body">' +
        '<div class="power-supply-display">6 V</div>' +
        '<div class="power-supply-label">Quelle</div>' +
      '</div>';
    viz.appendChild(ps);

    // Bulb - top center
    var bulb = document.createElement('div');
    bulb.className = 'bulb-container';
    bulb.style.left = (w * 0.42) + 'px';
    bulb.style.top = (h * 0.08) + 'px';
    bulb.innerHTML =
      '<div class="bulb-glass off"></div>' +
      '<span class="bulb-label">6V / 0,1A</span>';
    viz.appendChild(bulb);

    // Ohmmeter - right
    var ohm = document.createElement('div');
    ohm.className = 'ohmmeter';
    ohm.style.right = (w * 0.08) + 'px';
    ohm.style.top = (h * 0.35) + 'px';
    ohm.innerHTML =
      '<div class="ohmmeter-body">' +
        '<div class="ohmmeter-symbol">\u03A9</div>' +
        '<div class="ohmmeter-display" id="v1-ohm-display">– \u03A9</div>' +
      '</div>';
    viz.appendChild(ohm);

    // Draw wires via SVG
    var svg = makeSVG(viz);

    // Wire from power supply top to bulb left
    drawWire(svg, [
      [w * 0.09, h * 0.5 - 25],
      [w * 0.09, h * 0.22],
      [w * 0.45, h * 0.22]
    ], '#475569');

    // Wire from bulb right to ohmmeter top
    drawWire(svg, [
      [w * 0.49, h * 0.22],
      [w * 0.82, h * 0.22],
      [w * 0.82, h * 0.38]
    ], '#475569');

    // Wire from ohmmeter bottom to power supply bottom
    drawWire(svg, [
      [w * 0.82, h * 0.62],
      [w * 0.82, h * 0.82],
      [w * 0.09, h * 0.82],
      [w * 0.09, h * 0.5 + 25]
    ], '#475569');

    // Switch indicator label
    var switchLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    switchLabel.setAttribute('x', w * 0.25);
    switchLabel.setAttribute('y', h * 0.17);
    switchLabel.setAttribute('font-size', '11');
    switchLabel.setAttribute('fill', '#64748b');
    switchLabel.setAttribute('font-weight', '600');
    switchLabel.textContent = 'Schalter';
    svg.appendChild(switchLabel);
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
    viz.style.height = '300px';
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

      var ironOhmDisplay = document.getElementById('v2-iron-ohm');
      var constOhmDisplay = document.getElementById('v2-const-ohm');
      if (ironOhmDisplay) ironOhmDisplay.textContent = state.ironR.toFixed(1) + ' \u03A9';
      if (constOhmDisplay) constOhmDisplay.textContent = state.constantanR.toFixed(1) + ' \u03A9';

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

      // Show flame
      var flameEl = document.getElementById('v2-flame');
      if (flameEl) flameEl.classList.remove('hidden');

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
      var flameEl = document.getElementById('v2-flame');
      if (flameEl) flameEl.classList.add('hidden');
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
      var flameEl = document.getElementById('v2-flame');
      if (flameEl) flameEl.classList.add('hidden');

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
    var w = viz.offsetWidth;
    var h = viz.offsetHeight;

    // Iron wire (coiled) - left side
    var ironWire = document.createElement('div');
    ironWire.className = 'wire-component';
    ironWire.style.left = (w * 0.15) + 'px';
    ironWire.style.top = (h * 0.25) + 'px';
    ironWire.innerHTML =
      '<div class="wire-resistor">' +
        '<span class="resistor-label">Eisendraht</span>' +
        '<div class="resistor-body iron">Fe</div>' +
        '<span class="meter-value" id="v2-iron-ohm">2.0 \u03A9</span>' +
      '</div>';
    viz.appendChild(ironWire);

    // Constantan wire - right side
    var constWire = document.createElement('div');
    constWire.className = 'wire-component';
    constWire.style.left = (w * 0.6) + 'px';
    constWire.style.top = (h * 0.25) + 'px';
    constWire.innerHTML =
      '<div class="wire-resistor">' +
        '<span class="resistor-label">Konstantandraht</span>' +
        '<div class="resistor-body constantan">CuNi</div>' +
        '<span class="meter-value" id="v2-const-ohm">8.0 \u03A9</span>' +
      '</div>';
    viz.appendChild(constWire);

    // Ohmmeter in center
    var ohm = document.createElement('div');
    ohm.className = 'ohmmeter';
    ohm.style.left = (w * 0.4) + 'px';
    ohm.style.top = (h * 0.05) + 'px';
    ohm.innerHTML =
      '<div class="ohmmeter-body">' +
        '<div class="ohmmeter-symbol">\u03A9</div>' +
        '<div class="ohmmeter-display">Ohmmeter</div>' +
      '</div>';
    viz.appendChild(ohm);

    // Flame / candle at bottom center
    var flame = document.createElement('div');
    flame.className = 'flame hidden';
    flame.id = 'v2-flame';
    flame.style.left = (w * 0.43) + 'px';
    flame.style.top = (h * 0.65) + 'px';
    flame.innerHTML = '<div style="text-align:center;font-size:2rem">🕯️</div><div style="font-size:0.65rem;text-align:center;color:#92400e;font-weight:600">Teelicht</div>';
    viz.appendChild(flame);

    // SVG wires
    var svg = makeSVG(viz);

    // Wires from ohmmeter to iron wire
    drawWire(svg, [
      [w * 0.43, h * 0.12],
      [w * 0.25, h * 0.12],
      [w * 0.25, h * 0.28]
    ], '#475569');

    // Wires from ohmmeter to constantan wire
    drawWire(svg, [
      [w * 0.55, h * 0.12],
      [w * 0.72, h * 0.12],
      [w * 0.72, h * 0.28]
    ], '#475569');

    // Ground wires
    drawWire(svg, [
      [w * 0.25, h * 0.5],
      [w * 0.25, h * 0.85],
      [w * 0.72, h * 0.85],
      [w * 0.72, h * 0.5]
    ], '#94a3b8');
  }

  // ==================== V3: U-I CHARACTERISTICS ====================

  function renderV3(panel) {
    state.activeLines = { bulb: true, constantan: true, ironAir: true, ironWater: true };
    state.voltageIndex = 0;
    state.measuredPoints = {};
    Object.keys(V3_DATA).forEach(function (k) { state.measuredPoints[k] = [{ v: 0, i: 0 }]; });
    state.allMeasured = false;

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
    });

    // Measure at current voltage
    btnMeasure.addEventListener('click', function () {
      var v = parseInt(slider.value);
      var vIdx = v; // 0..6 maps to index 0..6
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
