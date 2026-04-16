(function () {
  'use strict';

  // ==================== DATA ====================

  var EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'V1: Stromstärke',
      title: 'V1: Verschiedene Glühlampen an Batteriehaltern',
      instruction: 'Wähle verschiedene Glühlampen und Spannungsquellen (2 oder 4 Mignonzellen). Beobachte die Stromstärke auf dem Amperemeter.',
      type: 'current-measurement',
      conclusion: 'Bei gleichen Lampen an der gleichen Quelle ist die Stromstärke gleich. Bei verschiedenen Lampen an der gleichen Quelle sind die Stromstärken unterschiedlich. Bei gleichen Lampen an verschiedenen Quellen sind die Stromstärken unterschiedlich. Die Spannung der Quelle und der Widerstand der Lampe bestimmen gemeinsam die Stromstärke.'
    },
    b: {
      id: 'b',
      tab: 'V2: Reihenschaltung',
      title: 'V2: Zwei Lampen in Reihe mit Voltmetern',
      instruction: 'Baue einen Stromkreis mit Schalter und zwei identischen Lampen in Reihe. Die Nennspannung der Quelle ist doppelt so groß wie die der Lampen. Öffne und schließe den Schalter und beobachte die Voltmeter.',
      type: 'series-voltage',
      conclusion: 'Die Nennspannung der Quelle (rotes Voltmeter) bleibt immer gleich – egal ob der Schalter offen oder geschlossen ist. Bei geschlossenem Schalter teilt sich die Gesamtspannung auf die beiden Lampen auf. Jede Lampe erhält die Hälfte der Gesamtspannung. Es gilt: U_gesamt = U_1 + U_2.'
    },
    c: {
      id: 'c',
      tab: 'V3: Spannungsteiler',
      title: 'V3: Teilspannung am Draht',
      instruction: 'Ersetze die Glühlampen durch einen Draht. Verschiebe den Kontakt entlang des Drahtes und beobachte, wie sich die Teilspannung ändert. Verändere auch die Spannung der Quelle.',
      type: 'voltage-divider',
      conclusion: 'Die Teilspannung am Draht ist proportional zur Länge des Drahtabschnitts. Je weiter der Kontakt verschoben wird, desto größer ist die gemessene Teilspannung. Die Teilspannung ist außerdem proportional zur Gesamtspannung der Quelle. Dies ist das Prinzip des Spannungsteilers.'
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
    // Cleanup
    cleanupFns.forEach(function (fn) { fn(); });
    cleanupFns = [];
    state = {};

    currentExp = EXPERIMENTS[key];

    // Update tabs
    var tabBtns = document.querySelectorAll('.tab');
    var keys = Object.keys(EXPERIMENTS);
    tabBtns.forEach(function (btn, i) {
      btn.classList.toggle('active', keys[i] === key);
    });

    // Render
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
      case 'current-measurement': renderV1(panel); break;
      case 'series-voltage': renderV2(panel); break;
      case 'voltage-divider': renderV3(panel); break;
    }
  }

  // ==================== V1: CURRENT MEASUREMENT ====================

  function renderV1(panel) {
    // Lamp data: name, resistance in ohms (approximate)
    var lamps = [
      { name: 'Glühlampe 3,5 V / 0,2 A', resistance: 17.5, ratedV: 3.5 },
      { name: 'Glühlampe 6 V / 0,3 A', resistance: 20, ratedV: 6 },
      { name: 'Glühlampe 6 V / 0,1 A', resistance: 60, ratedV: 6 },
      { name: 'Glühlampe 3,5 V / 0,1 A', resistance: 35, ratedV: 3.5 }
    ];

    var sources = [
      { name: '2 Mignonzellen (3 V)', voltage: 3 },
      { name: '4 Mignonzellen (6 V)', voltage: 6 }
    ];

    state.selectedLamp = 0;
    state.selectedSource = 0;
    state.measurements = [];

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 'v1-circuit';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Controls
    var controlCard = document.createElement('div');
    controlCard.className = 'card';

    // Lamp selector
    var lampRow = document.createElement('div');
    lampRow.className = 'control-row';
    var lampLabel = document.createElement('span');
    lampLabel.className = 'control-label';
    lampLabel.textContent = 'Glühlampe:';
    var lampSelect = document.createElement('select');
    lampSelect.className = 'select-control';
    lampSelect.id = 'v1-lamp-select';
    lamps.forEach(function (lamp, i) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = lamp.name;
      lampSelect.appendChild(opt);
    });
    lampRow.appendChild(lampLabel);
    lampRow.appendChild(lampSelect);
    controlCard.appendChild(lampRow);

    // Source selector
    var srcRow = document.createElement('div');
    srcRow.className = 'control-row mt-sm';
    var srcLabel = document.createElement('span');
    srcLabel.className = 'control-label';
    srcLabel.textContent = 'Spannungsquelle:';
    var srcSelect = document.createElement('select');
    srcSelect.className = 'select-control';
    srcSelect.id = 'v1-source-select';
    sources.forEach(function (src, i) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = src.name;
      srcSelect.appendChild(opt);
    });
    srcRow.appendChild(srcLabel);
    srcRow.appendChild(srcSelect);
    controlCard.appendChild(srcRow);

    // Measure button
    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-sm';
    var measureBtn = document.createElement('button');
    measureBtn.className = 'btn btn-primary';
    measureBtn.textContent = 'Messen';
    measureBtn.id = 'v1-measure-btn';
    btnRow.appendChild(measureBtn);
    controlCard.appendChild(btnRow);

    panel.appendChild(controlCard);

    // Current display
    var currentCard = document.createElement('div');
    currentCard.className = 'current-display';
    currentCard.id = 'v1-current';
    currentCard.innerHTML = '<span>Amperemeter: </span><span id="v1-current-val">– – –</span><span class="unit"> mA</span>';
    panel.appendChild(currentCard);

    // Results table
    var resultsCard = document.createElement('div');
    resultsCard.className = 'card';
    resultsCard.id = 'v1-results';
    resultsCard.innerHTML = '<table class="results-table"><thead><tr><th>Nr.</th><th>Lampe</th><th>Quelle</th><th>Strom</th></tr></thead><tbody id="v1-results-body"></tbody></table>';
    panel.appendChild(resultsCard);

    // Conclusion (hidden initially)
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v1-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    // Draw initial circuit
    drawV1Circuit(viz, lamps[0], sources[0], false, 0);

    // Events
    function onLampChange() {
      state.selectedLamp = parseInt(lampSelect.value);
      drawV1Circuit(viz, lamps[state.selectedLamp], sources[state.selectedSource], false, 0);
      document.getElementById('v1-current-val').textContent = '– – –';
    }

    function onSrcChange() {
      state.selectedSource = parseInt(srcSelect.value);
      drawV1Circuit(viz, lamps[state.selectedLamp], sources[state.selectedSource], false, 0);
      document.getElementById('v1-current-val').textContent = '– – –';
    }

    function onMeasure() {
      var lamp = lamps[state.selectedLamp];
      var source = sources[state.selectedSource];
      var current = (source.voltage / lamp.resistance) * 1000; // mA
      // Add some realistic variation
      current = current * (0.95 + Math.random() * 0.1);
      current = Math.round(current);

      document.getElementById('v1-current-val').textContent = current;
      drawV1Circuit(viz, lamp, source, true, current);

      // Add to results
      state.measurements.push({
        lamp: lamp.name,
        source: source.name,
        current: current
      });

      var tbody = document.getElementById('v1-results-body');
      var row = document.createElement('tr');
      row.innerHTML = '<td>' + state.measurements.length + '</td><td>' + lamp.name + '</td><td>' + source.name + '</td><td><strong>' + current + ' mA</strong></td>';
      tbody.appendChild(row);

      // Show conclusion after 3+ measurements
      if (state.measurements.length >= 3) {
        document.getElementById('v1-conclusion').classList.remove('hidden');
      }
    }

    lampSelect.addEventListener('change', onLampChange);
    srcSelect.addEventListener('change', onSrcChange);
    measureBtn.addEventListener('click', onMeasure);

    cleanupFns.push(function () {
      lampSelect.removeEventListener('change', onLampChange);
      srcSelect.removeEventListener('change', onSrcChange);
      measureBtn.removeEventListener('click', onMeasure);
    });
  }

  function drawV1Circuit(container, lamp, source, isOn, currentVal) {
    container.innerHTML = '';

    // Battery
    var batteryCount = source.voltage / 1.5;
    var batteryEl = document.createElement('div');
    batteryEl.className = 'battery';
    batteryEl.style.cssText = 'left: 50%; top: 20px; transform: translateX(-50%);';
    var battBody = document.createElement('div');
    battBody.className = 'battery-body';
    battBody.style.width = (batteryCount * 24) + 'px';
    var battLabel = document.createElement('span');
    battLabel.className = 'battery-label';
    battLabel.textContent = source.voltage + ' V';
    battBody.appendChild(battLabel);
    var plusTerm = document.createElement('span');
    plusTerm.className = 'battery-terminal-plus';
    plusTerm.textContent = '+';
    plusTerm.style.cssText = 'position:absolute; left:50%; transform:translateX(-50%) translateX(-' + (batteryCount * 12 + 8) + 'px); top:24px;';
    var minusTerm = document.createElement('span');
    minusTerm.className = 'battery-terminal-minus';
    minusTerm.textContent = '–';
    minusTerm.style.cssText = 'position:absolute; left:50%; transform:translateX(-50%) translateX(' + (batteryCount * 12 + 8) + 'px); top:24px;';
    batteryEl.appendChild(battBody);
    container.appendChild(batteryEl);
    container.appendChild(plusTerm);
    container.appendChild(minusTerm);

    // Lightbulb
    var bulbEl = document.createElement('div');
    bulbEl.className = 'bulb';
    bulbEl.style.cssText = 'left: 50%; bottom: 60px; transform: translateX(-50%);';
    var glass = document.createElement('div');
    glass.className = 'bulb-glass ' + (isOn ? 'on' : 'off');
    var base = document.createElement('div');
    base.className = 'bulb-base';
    var bLabel = document.createElement('span');
    bLabel.className = 'bulb-label';
    bLabel.textContent = lamp.name.split('/')[0].trim();
    bulbEl.appendChild(glass);
    bulbEl.appendChild(base);
    bulbEl.appendChild(bLabel);
    container.appendChild(bulbEl);

    // Ammeter
    var ammeter = document.createElement('div');
    ammeter.className = 'meter';
    ammeter.style.cssText = 'right: 15%; top: 50%; transform: translateY(-50%);';
    var ammBody = document.createElement('div');
    ammBody.className = 'meter-body ammeter';
    ammBody.textContent = 'A';
    var ammVal = document.createElement('span');
    ammVal.className = 'meter-value';
    ammVal.textContent = isOn ? currentVal + ' mA' : '0 mA';
    ammeter.appendChild(ammBody);
    ammeter.appendChild(ammVal);
    container.appendChild(ammeter);

    // Draw circuit wires using SVG
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none;';

    var wireColor = isOn ? '#dc2626' : '#6b7280';
    var wireWidth = isOn ? '3' : '2';

    // Coordinate-based wires
    var w = container.offsetWidth || 400;
    var h = container.offsetHeight || 320;

    var cx = w * 0.5;
    var rightX = w * 0.82;
    var leftX = w * 0.18;
    var topY = 44;
    var botY = h - 60;
    var ammY = h * 0.5;

    var pathD = 'M ' + cx + ' ' + topY +
      ' L ' + rightX + ' ' + topY +
      ' L ' + rightX + ' ' + ammY +
      ' M ' + rightX + ' ' + ammY +
      ' L ' + rightX + ' ' + botY +
      ' L ' + cx + ' ' + botY +
      ' M ' + cx + ' ' + botY +
      ' L ' + leftX + ' ' + botY +
      ' L ' + leftX + ' ' + topY +
      ' L ' + cx + ' ' + topY;

    var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', pathD);
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', wireColor);
    pathEl.setAttribute('stroke-width', wireWidth);
    pathEl.setAttribute('stroke-linecap', 'round');
    pathEl.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(pathEl);

    // Current flow animation when on
    if (isOn) {
      var animCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      animCircle.setAttribute('r', '4');
      animCircle.setAttribute('fill', '#fde047');
      animCircle.setAttribute('stroke', '#f59e0b');
      animCircle.setAttribute('stroke-width', '1');
      var animMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
      animMotion.setAttribute('dur', '2s');
      animMotion.setAttribute('repeatCount', 'indefinite');
      animMotion.setAttribute('path', pathD);
      animCircle.appendChild(animMotion);
      svg.appendChild(animCircle);
    }

    container.appendChild(svg);
  }

  // ==================== V2: SERIES VOLTAGE ====================

  function renderV2(panel) {
    var lampRatedV = 3.5; // Each lamp rated 3.5V
    var sourceV = 7; // Source is 2× lamp voltage

    state.switchClosed = false;

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 'v2-circuit';
    viz.style.height = '360px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Switch control
    var switchCard = document.createElement('div');
    switchCard.className = 'card';
    var switchRow = document.createElement('div');
    switchRow.className = 'btn-row';
    switchRow.style.justifyContent = 'center';

    var switchBtn = document.createElement('button');
    switchBtn.className = 'btn btn-primary';
    switchBtn.id = 'v2-switch-btn';
    switchBtn.textContent = 'Schalter schließen';
    switchRow.appendChild(switchBtn);
    switchCard.appendChild(switchRow);

    var switchStatus = document.createElement('div');
    switchStatus.className = 'text-center mt-sm';
    switchStatus.id = 'v2-switch-status';
    switchStatus.innerHTML = '<span class="status-badge warning">Schalter offen – Stromkreis unterbrochen</span>';
    switchCard.appendChild(switchStatus);
    panel.appendChild(switchCard);

    // Voltage readings
    var voltageCard = document.createElement('div');
    voltageCard.className = 'card';
    voltageCard.id = 'v2-voltages';
    var voltTitle = document.createElement('div');
    voltTitle.className = 'control-label';
    voltTitle.textContent = 'Voltmeter-Anzeigen:';
    voltTitle.style.marginBottom = '0.5rem';
    voltageCard.appendChild(voltTitle);

    var voltRow = document.createElement('div');
    voltRow.className = 'voltage-row';
    voltRow.innerHTML =
      '<div class="voltage-box source"><div class="voltage-label">U Quelle (rot)</div><div class="voltage-value" id="v2-u-source">' + sourceV.toFixed(1) + ' V</div></div>' +
      '<div class="voltage-box lamp"><div class="voltage-label">U Lampe 1</div><div class="voltage-value" id="v2-u-lamp1">0,0 V</div></div>' +
      '<div class="voltage-box lamp"><div class="voltage-label">U Lampe 2</div><div class="voltage-value" id="v2-u-lamp2">0,0 V</div></div>';
    voltageCard.appendChild(voltRow);
    panel.appendChild(voltageCard);

    // Conclusion
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v2-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    state.v2ToggleCount = 0;

    // Draw initial circuit
    drawV2Circuit(viz, false, sourceV, 0, 0);

    function onSwitchToggle() {
      state.switchClosed = !state.switchClosed;
      state.v2ToggleCount++;

      var statusEl = document.getElementById('v2-switch-status');
      var uLamp1 = document.getElementById('v2-u-lamp1');
      var uLamp2 = document.getElementById('v2-u-lamp2');

      if (state.switchClosed) {
        switchBtn.textContent = 'Schalter öffnen';
        statusEl.innerHTML = '<span class="status-badge success">Schalter geschlossen – Strom fließt</span>';
        var u1 = lampRatedV * (0.97 + Math.random() * 0.06);
        var u2 = sourceV - u1;
        uLamp1.textContent = u1.toFixed(1).replace('.', ',') + ' V';
        uLamp2.textContent = u2.toFixed(1).replace('.', ',') + ' V';
        drawV2Circuit(viz, true, sourceV, u1, u2);
      } else {
        switchBtn.textContent = 'Schalter schließen';
        statusEl.innerHTML = '<span class="status-badge warning">Schalter offen – Stromkreis unterbrochen</span>';
        uLamp1.textContent = '0,0 V';
        uLamp2.textContent = '0,0 V';
        drawV2Circuit(viz, false, sourceV, 0, 0);
      }

      // Show conclusion after toggling a few times
      if (state.v2ToggleCount >= 2) {
        document.getElementById('v2-conclusion').classList.remove('hidden');
      }
    }

    switchBtn.addEventListener('click', onSwitchToggle);
    cleanupFns.push(function () {
      switchBtn.removeEventListener('click', onSwitchToggle);
    });
  }

  function drawV2Circuit(container, isClosed, sourceV, u1, u2) {
    container.innerHTML = '';
    var w = container.offsetWidth || 400;
    var h = container.offsetHeight || 360;

    // Positions
    var cx = w * 0.5;
    var leftX = w * 0.12;
    var rightX = w * 0.88;
    var topY = 30;
    var botY = h - 30;
    var midY = h * 0.5;

    // SVG for wires
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none; z-index:1;';

    var wireColor = isClosed ? '#dc2626' : '#6b7280';

    // Circuit: Battery at top center, switch on left, lamp1 at bottom-left, lamp2 at bottom-right
    // Battery top-center
    var battX = cx;
    var battY = topY + 15;
    // Switch on left side
    var switchX = leftX + 20;
    var switchY = midY;
    // Lamp1 at bottom-left
    var lamp1X = w * 0.33;
    var lamp1Y = botY - 30;
    // Lamp2 at bottom-right
    var lamp2X = w * 0.67;
    var lamp2Y = botY - 30;

    // Draw wires
    var pathD =
      // Top: battery right terminal to right side
      'M ' + (battX + 30) + ' ' + battY +
      ' L ' + rightX + ' ' + battY +
      // Right side down
      ' L ' + rightX + ' ' + lamp2Y +
      // Bottom right to lamp2
      ' L ' + (lamp2X + 20) + ' ' + lamp2Y +
      // Between lamps
      ' M ' + (lamp2X - 20) + ' ' + lamp2Y +
      ' L ' + (lamp1X + 20) + ' ' + lamp1Y +
      // Lamp1 to left side
      ' M ' + (lamp1X - 20) + ' ' + lamp1Y +
      ' L ' + leftX + ' ' + lamp1Y +
      // Left side up to switch
      ' L ' + leftX + ' ' + (switchY + 15);

    // Switch to battery (if closed, continuous line)
    if (isClosed) {
      pathD += ' M ' + leftX + ' ' + (switchY - 5) +
        ' L ' + leftX + ' ' + battY +
        ' L ' + (battX - 30) + ' ' + battY;
    } else {
      pathD += ' M ' + leftX + ' ' + (switchY - 20) +
        ' L ' + leftX + ' ' + battY +
        ' L ' + (battX - 30) + ' ' + battY;
    }

    var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', pathD);
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', wireColor);
    pathEl.setAttribute('stroke-width', isClosed ? '3' : '2');
    pathEl.setAttribute('stroke-linecap', 'round');
    pathEl.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(pathEl);

    // Current flow animation
    if (isClosed) {
      var flowPath = 'M ' + (battX + 30) + ' ' + battY +
        ' L ' + rightX + ' ' + battY +
        ' L ' + rightX + ' ' + lamp2Y +
        ' L ' + (lamp2X + 20) + ' ' + lamp2Y +
        ' L ' + (lamp2X - 20) + ' ' + lamp2Y +
        ' L ' + (lamp1X + 20) + ' ' + lamp1Y +
        ' L ' + (lamp1X - 20) + ' ' + lamp1Y +
        ' L ' + leftX + ' ' + lamp1Y +
        ' L ' + leftX + ' ' + battY +
        ' L ' + (battX - 30) + ' ' + battY;

      var animCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      animCircle.setAttribute('r', '4');
      animCircle.setAttribute('fill', '#fde047');
      animCircle.setAttribute('stroke', '#f59e0b');
      animCircle.setAttribute('stroke-width', '1');
      var animMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
      animMotion.setAttribute('dur', '3s');
      animMotion.setAttribute('repeatCount', 'indefinite');
      animMotion.setAttribute('path', flowPath);
      animCircle.appendChild(animMotion);
      svg.appendChild(animCircle);
    }

    container.appendChild(svg);

    // Battery
    var batteryEl = document.createElement('div');
    batteryEl.style.cssText = 'position:absolute; left:' + (battX - 30) + 'px; top:' + (battY - 12) + 'px; z-index:2;';
    batteryEl.innerHTML =
      '<div class="battery-body" style="width:60px;"><span class="battery-label">' + sourceV.toFixed(0) + ' V</span></div>';
    container.appendChild(batteryEl);

    // Switch
    var switchEl = document.createElement('div');
    switchEl.style.cssText = 'position:absolute; left:' + (leftX - 18) + 'px; top:' + (switchY - 15) + 'px; z-index:2;';
    var leverClass = isClosed ? 'closed' : 'open';
    switchEl.innerHTML =
      '<div class="switch-body">' +
      '<div class="switch-contact-left"></div>' +
      '<div class="switch-contact-right"></div>' +
      '<div class="switch-lever ' + leverClass + '"></div>' +
      '</div>' +
      '<div class="switch-label" style="text-align:center; margin-top:2px;">S</div>';
    container.appendChild(switchEl);

    // Lamp 1
    var bulb1 = document.createElement('div');
    bulb1.style.cssText = 'position:absolute; left:' + (lamp1X - 14) + 'px; top:' + (lamp1Y - 22) + 'px; z-index:2; display:flex; flex-direction:column; align-items:center;';
    bulb1.innerHTML =
      '<div class="bulb-glass ' + (isClosed ? 'on' : 'off') + '"></div>' +
      '<div class="bulb-label">Lampe 1</div>';
    container.appendChild(bulb1);

    // Lamp 2
    var bulb2 = document.createElement('div');
    bulb2.style.cssText = 'position:absolute; left:' + (lamp2X - 14) + 'px; top:' + (lamp2Y - 22) + 'px; z-index:2; display:flex; flex-direction:column; align-items:center;';
    bulb2.innerHTML =
      '<div class="bulb-glass ' + (isClosed ? 'on' : 'off') + '"></div>' +
      '<div class="bulb-label">Lampe 2</div>';
    container.appendChild(bulb2);

    // Voltmeter U source (red) - at top right of battery
    var vmSource = document.createElement('div');
    vmSource.className = 'meter';
    vmSource.style.cssText = 'position:absolute; left:' + (cx - 21) + 'px; top:' + (battY + 22) + 'px; z-index:2;';
    vmSource.innerHTML =
      '<div class="meter-body voltmeter">V</div>' +
      '<span class="meter-value">' + sourceV.toFixed(1) + ' V</span>';
    container.appendChild(vmSource);

    // Voltmeter U lamp1 (blue)
    var vmLamp1 = document.createElement('div');
    vmLamp1.className = 'meter';
    vmLamp1.style.cssText = 'position:absolute; left:' + (lamp1X - 21) + 'px; top:' + (lamp1Y - 75) + 'px; z-index:2;';
    vmLamp1.innerHTML =
      '<div class="meter-body voltmeter-blue">V</div>' +
      '<span class="meter-value">' + (isClosed ? u1.toFixed(1) : '0.0') + ' V</span>';
    container.appendChild(vmLamp1);

    // Voltmeter U lamp2 (blue)
    var vmLamp2 = document.createElement('div');
    vmLamp2.className = 'meter';
    vmLamp2.style.cssText = 'position:absolute; left:' + (lamp2X - 21) + 'px; top:' + (lamp2Y - 75) + 'px; z-index:2;';
    vmLamp2.innerHTML =
      '<div class="meter-body voltmeter-blue">V</div>' +
      '<span class="meter-value">' + (isClosed ? u2.toFixed(1) : '0.0') + ' V</span>';
    container.appendChild(vmLamp2);
  }

  // ==================== V3: VOLTAGE DIVIDER ====================

  function renderV3(panel) {
    state.v3SourceV = 6;
    state.v3Position = 50; // percentage along wire (0-100)

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 'v3-circuit';
    viz.style.height = '300px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Source voltage control
    var srcCard = document.createElement('div');
    srcCard.className = 'card';
    var srcSlider = document.createElement('div');
    srcSlider.className = 'slider-container';
    srcSlider.innerHTML =
      '<div class="control-label">Spannung der Quelle:</div>' +
      '<div class="slider-row">' +
      '<input type="range" class="slider-input" id="v3-source-slider" min="1" max="12" step="0.5" value="6">' +
      '<span class="slider-value" id="v3-source-value">6,0 V</span>' +
      '</div>';
    srcCard.appendChild(srcSlider);
    panel.appendChild(srcCard);

    // Wire position control
    var posCard = document.createElement('div');
    posCard.className = 'card';

    var wireViz = document.createElement('div');
    wireViz.className = 'wire-viz';
    wireViz.id = 'v3-wire-viz';
    wireViz.innerHTML =
      '<div class="wire-track">' +
      '<div class="wire-marker" id="v3-wire-marker" style="left:50%;"></div>' +
      '</div>' +
      '<div class="wire-label-left">0%</div>' +
      '<div class="wire-label-right">100%</div>';
    posCard.appendChild(wireViz);

    var posSlider = document.createElement('div');
    posSlider.className = 'slider-container mt-sm';
    posSlider.innerHTML =
      '<div class="control-label">Position des Kontakts:</div>' +
      '<div class="slider-row">' +
      '<input type="range" class="slider-input" id="v3-pos-slider" min="0" max="100" step="1" value="50">' +
      '<span class="slider-value" id="v3-pos-value">50%</span>' +
      '</div>';
    posCard.appendChild(posSlider);
    panel.appendChild(posCard);

    // Voltage reading
    var readCard = document.createElement('div');
    readCard.className = 'card';

    var voltRow = document.createElement('div');
    voltRow.className = 'voltage-row';
    voltRow.innerHTML =
      '<div class="voltage-box source"><div class="voltage-label">U Quelle</div><div class="voltage-value" id="v3-u-source">6,0 V</div></div>' +
      '<div class="voltage-box lamp"><div class="voltage-label">U Teilspannung</div><div class="voltage-value" id="v3-u-partial">3,0 V</div></div>';
    readCard.appendChild(voltRow);

    var ratioText = document.createElement('div');
    ratioText.className = 'text-center mt-sm';
    ratioText.id = 'v3-ratio';
    ratioText.style.fontSize = '0.85rem';
    ratioText.style.color = 'var(--text-sec)';
    ratioText.textContent = 'Anteil: 50 % der Gesamtspannung';
    readCard.appendChild(ratioText);
    panel.appendChild(readCard);

    // Results table
    var resultsCard = document.createElement('div');
    resultsCard.className = 'card';
    resultsCard.innerHTML = '<div class="control-label" style="margin-bottom:0.5rem;">Messprotokoll:</div>' +
      '<table class="results-table"><thead><tr><th>Nr.</th><th>U Quelle</th><th>Position</th><th>U Teil</th></tr></thead>' +
      '<tbody id="v3-results-body"></tbody></table>';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-secondary mt-sm';
    saveBtn.textContent = 'Messwert speichern';
    saveBtn.id = 'v3-save-btn';
    resultsCard.appendChild(saveBtn);
    panel.appendChild(resultsCard);

    state.v3Measurements = [];

    // Conclusion
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v3-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    // Draw initial
    drawV3Circuit(viz, state.v3SourceV, state.v3Position);
    updateV3Readings();

    // Events
    var sourceSlider = document.getElementById('v3-source-slider');
    var posSliderEl = document.getElementById('v3-pos-slider');

    function onSourceChange() {
      state.v3SourceV = parseFloat(sourceSlider.value);
      document.getElementById('v3-source-value').textContent = state.v3SourceV.toFixed(1).replace('.', ',') + ' V';
      updateV3Readings();
      drawV3Circuit(viz, state.v3SourceV, state.v3Position);
    }

    function onPosChange() {
      state.v3Position = parseInt(posSliderEl.value);
      document.getElementById('v3-pos-value').textContent = state.v3Position + '%';
      document.getElementById('v3-wire-marker').style.left = state.v3Position + '%';
      updateV3Readings();
      drawV3Circuit(viz, state.v3SourceV, state.v3Position);
    }

    function onSave() {
      var partialV = state.v3SourceV * (state.v3Position / 100);
      state.v3Measurements.push({
        source: state.v3SourceV,
        position: state.v3Position,
        partial: partialV
      });

      var tbody = document.getElementById('v3-results-body');
      var row = document.createElement('tr');
      row.innerHTML = '<td>' + state.v3Measurements.length + '</td>' +
        '<td>' + state.v3SourceV.toFixed(1).replace('.', ',') + ' V</td>' +
        '<td>' + state.v3Position + '%</td>' +
        '<td><strong>' + partialV.toFixed(1).replace('.', ',') + ' V</strong></td>';
      tbody.appendChild(row);

      if (state.v3Measurements.length >= 3) {
        document.getElementById('v3-conclusion').classList.remove('hidden');
      }
    }

    sourceSlider.addEventListener('input', onSourceChange);
    posSliderEl.addEventListener('input', onPosChange);
    saveBtn.addEventListener('click', onSave);

    cleanupFns.push(function () {
      sourceSlider.removeEventListener('input', onSourceChange);
      posSliderEl.removeEventListener('input', onPosChange);
      saveBtn.removeEventListener('click', onSave);
    });
  }

  function updateV3Readings() {
    var partialV = state.v3SourceV * (state.v3Position / 100);
    document.getElementById('v3-u-source').textContent = state.v3SourceV.toFixed(1).replace('.', ',') + ' V';
    document.getElementById('v3-u-partial').textContent = partialV.toFixed(1).replace('.', ',') + ' V';
    document.getElementById('v3-ratio').textContent = 'Anteil: ' + state.v3Position + ' % der Gesamtspannung';
  }

  function drawV3Circuit(container, sourceV, position) {
    container.innerHTML = '';
    var w = container.offsetWidth || 400;
    var h = container.offsetHeight || 300;

    var leftX = w * 0.1;
    var rightX = w * 0.9;
    var topY = 40;
    var botY = h - 40;
    var wireY = botY - 30;

    // Battery at top center
    var battX = w * 0.5;
    var battY = topY + 10;

    // Wire (resistor) at bottom
    var wireStartX = w * 0.2;
    var wireEndX = w * 0.8;
    var wireContactX = wireStartX + (wireEndX - wireStartX) * (position / 100);

    // SVG wires
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none; z-index:1;';

    // Main circuit path
    var pathD =
      // Battery right to right side
      'M ' + (battX + 30) + ' ' + battY +
      ' L ' + rightX + ' ' + battY +
      ' L ' + rightX + ' ' + wireY +
      ' L ' + wireEndX + ' ' + wireY +
      // Wire (drawn as thick line separately)
      // Battery left to left side
      ' M ' + (battX - 30) + ' ' + battY +
      ' L ' + leftX + ' ' + battY +
      ' L ' + leftX + ' ' + wireY +
      ' L ' + wireStartX + ' ' + wireY;

    var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', pathD);
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', '#dc2626');
    pathEl.setAttribute('stroke-width', '2.5');
    pathEl.setAttribute('stroke-linecap', 'round');
    pathEl.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(pathEl);

    // Resistance wire (thicker, gray)
    var wireLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    wireLine.setAttribute('x1', wireStartX);
    wireLine.setAttribute('y1', wireY);
    wireLine.setAttribute('x2', wireEndX);
    wireLine.setAttribute('y2', wireY);
    wireLine.setAttribute('stroke', '#64748b');
    wireLine.setAttribute('stroke-width', '6');
    wireLine.setAttribute('stroke-linecap', 'round');
    svg.appendChild(wireLine);

    // Highlighted portion (measured section)
    var highlightLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    highlightLine.setAttribute('x1', wireStartX);
    highlightLine.setAttribute('y1', wireY);
    highlightLine.setAttribute('x2', wireContactX);
    highlightLine.setAttribute('y2', wireY);
    highlightLine.setAttribute('stroke', '#2563eb');
    highlightLine.setAttribute('stroke-width', '6');
    highlightLine.setAttribute('stroke-linecap', 'round');
    svg.appendChild(highlightLine);

    // Sliding contact marker
    var contactCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    contactCircle.setAttribute('cx', wireContactX);
    contactCircle.setAttribute('cy', wireY);
    contactCircle.setAttribute('r', '8');
    contactCircle.setAttribute('fill', '#2563eb');
    contactCircle.setAttribute('stroke', '#fff');
    contactCircle.setAttribute('stroke-width', '2');
    svg.appendChild(contactCircle);

    // Voltmeter connection lines (dashed)
    var vmY = wireY - 60;
    var vmDash = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    vmDash.setAttribute('d',
      'M ' + wireStartX + ' ' + wireY +
      ' L ' + wireStartX + ' ' + vmY +
      ' L ' + wireContactX + ' ' + vmY +
      ' L ' + wireContactX + ' ' + wireY);
    vmDash.setAttribute('fill', 'none');
    vmDash.setAttribute('stroke', '#2563eb');
    vmDash.setAttribute('stroke-width', '1.5');
    vmDash.setAttribute('stroke-dasharray', '4,3');
    svg.appendChild(vmDash);

    // Current flow
    var flowPath = 'M ' + (battX + 30) + ' ' + battY +
      ' L ' + rightX + ' ' + battY +
      ' L ' + rightX + ' ' + wireY +
      ' L ' + wireEndX + ' ' + wireY +
      ' L ' + wireStartX + ' ' + wireY +
      ' L ' + leftX + ' ' + wireY +
      ' L ' + leftX + ' ' + battY +
      ' L ' + (battX - 30) + ' ' + battY;

    var animCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    animCircle.setAttribute('r', '4');
    animCircle.setAttribute('fill', '#fde047');
    animCircle.setAttribute('stroke', '#f59e0b');
    animCircle.setAttribute('stroke-width', '1');
    var animMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
    animMotion.setAttribute('dur', '3s');
    animMotion.setAttribute('repeatCount', 'indefinite');
    animMotion.setAttribute('path', flowPath);
    animCircle.appendChild(animMotion);
    svg.appendChild(animCircle);

    container.appendChild(svg);

    // Battery
    var batteryEl = document.createElement('div');
    batteryEl.style.cssText = 'position:absolute; left:' + (battX - 30) + 'px; top:' + (battY - 12) + 'px; z-index:2;';
    batteryEl.innerHTML =
      '<div class="battery-body" style="width:60px;"><span class="battery-label">' + sourceV.toFixed(1) + ' V</span></div>';
    container.appendChild(batteryEl);

    // Voltmeter for partial voltage
    var partialV = sourceV * (position / 100);
    var vmX = (wireStartX + wireContactX) / 2;
    var vmEl = document.createElement('div');
    vmEl.className = 'meter';
    vmEl.style.cssText = 'position:absolute; left:' + (vmX - 21) + 'px; top:' + (vmY - 28) + 'px; z-index:2;';
    vmEl.innerHTML =
      '<div class="meter-body voltmeter-blue">V</div>' +
      '<span class="meter-value">' + partialV.toFixed(1).replace('.', ',') + ' V</span>';
    container.appendChild(vmEl);

    // Wire labels
    var startLabel = document.createElement('span');
    startLabel.style.cssText = 'position:absolute; left:' + wireStartX + 'px; top:' + (wireY + 14) + 'px; transform:translateX(-50%); font-size:0.65rem; font-weight:600; color:var(--text-sec); z-index:2;';
    startLabel.textContent = '0%';
    container.appendChild(startLabel);

    var endLabel = document.createElement('span');
    endLabel.style.cssText = 'position:absolute; left:' + wireEndX + 'px; top:' + (wireY + 14) + 'px; transform:translateX(-50%); font-size:0.65rem; font-weight:600; color:var(--text-sec); z-index:2;';
    endLabel.textContent = '100%';
    container.appendChild(endLabel);

    var contactLabel = document.createElement('span');
    contactLabel.style.cssText = 'position:absolute; left:' + wireContactX + 'px; top:' + (wireY + 14) + 'px; transform:translateX(-50%); font-size:0.7rem; font-weight:700; color:var(--accent); z-index:2;';
    contactLabel.textContent = position + '%';
    container.appendChild(contactLabel);
  }

  // ==================== START ====================

  window.addEventListener('DOMContentLoaded', init);
})();
