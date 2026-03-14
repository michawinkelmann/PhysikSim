(function () {
  'use strict';

  // ==================== DATA ====================

  var EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'V1: Glühlampen',
      title: 'V1: Glühlampen bei gleicher Stromstärke',
      instruction: 'Wähle zwei verschiedene Glühlampen aus und stelle die Spannung so ein, dass die Stromstärke in beiden Stromkreisen gleich ist. Beobachte die Helligkeit der Lampen und die eingestellten Spannungen.',
      type: 'bulb-comparison',
      conclusion: 'Bei gleicher Stromstärke leuchten verschiedene Lampen unterschiedlich hell. Die von der Quelle angezeigte Spannung ist ebenfalls unterschiedlich. Gleiche Stromstärke bedeutet nicht gleiche elektrische Leistung – die Spannung bestimmt mit, wie viel Energie pro Zeit umgesetzt wird. Es gilt: P = U · I.'
    },
    b: {
      id: 'b',
      tab: 'V2a: Motor',
      title: 'V2a: Motor an einstellbarer Spannung',
      instruction: 'Schließe einen Experimentiermotor an ein Netzgerät mit einstellbarer Spannung an. Verändere die Spannung und beobachte die Stromstärke und Drehzahl des Motors.',
      type: 'motor-single',
      conclusion: 'Je größer die Spannung, desto schneller läuft der Motor. Mit steigender Spannung nimmt auch die Stromstärke zu. Die elektrische Leistung (P = U · I) und damit die dem Motor zugeführte Energie pro Zeit steigt.'
    },
    c: {
      id: 'c',
      tab: 'V2b: Reihe',
      title: 'V2b: Zwei Motoren in Reihe',
      instruction: 'Schalte einen zweiten Motor in Reihe. Erhöhe die Spannung der Quelle, bis sich beide Motoren so schnell drehen wie zuvor ein Motor allein. Beobachte die Stromstärke.',
      type: 'motor-series',
      conclusion: 'Die gleiche Motordrehzahl ergibt sich bei doppelter Spannung und gleicher Stromstärke. Jeder Motor erhält die Hälfte der Gesamtspannung. In der Reihenschaltung teilt sich die Spannung auf – die Stromstärke bleibt gleich.'
    },
    d: {
      id: 'd',
      tab: 'V2c: Parallel',
      title: 'V2c: Zwei Motoren parallel',
      instruction: 'Stelle die Spannung auf einen festen Wert ein. Schalte den zweiten Motor diesmal parallel dazu. Beobachte Drehzahl und Stromstärke.',
      type: 'motor-parallel',
      conclusion: 'Beide Motoren drehen sich so schnell wie zuvor der eine Motor allein. Mit dem Zuschalten des zweiten Motors verdoppelt sich die Stromstärke. In der Parallelschaltung liegt an jedem Motor die volle Spannung an – die Ströme addieren sich.'
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
    tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = '';
    Object.keys(EXPERIMENTS).forEach(function (key) {
      var exp = EXPERIMENTS[key];
      var btn = document.createElement('button');
      btn.className = 'tab';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
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
      btn.setAttribute('aria-selected', keys[i] === key);
    });

    var container = document.getElementById('experiment-container');
    container.innerHTML = '';
    container.setAttribute('role', 'tabpanel');

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
      case 'bulb-comparison': renderV1(panel); break;
      case 'motor-single': renderV2a(panel); break;
      case 'motor-series': renderV2b(panel); break;
      case 'motor-parallel': renderV2c(panel); break;
    }
  }

  // ==================== HELPERS ====================

  function formatNum(val, decimals) {
    return val.toFixed(decimals).replace('.', ',');
  }

  function getBulbClass(power, ratedPower) {
    var ratio = power / ratedPower;
    if (ratio < 0.05) return 'off';
    if (ratio < 0.4) return 'dim';
    if (ratio < 0.8) return 'on';
    return 'bright';
  }

  function drawMotor(container, x, y, label, spinning, speedDuration) {
    var motor = document.createElement('div');
    motor.className = 'motor-container' + (spinning ? ' motor-spinning' : '');
    if (spinning) {
      motor.style.setProperty('--spin-duration', speedDuration + 's');
    }
    motor.style.cssText += ';left:' + (x - 22) + 'px;top:' + (y - 22) + 'px;';

    var body = document.createElement('div');
    body.className = 'motor-body';
    body.innerHTML = '<span class="motor-symbol">M</span>';

    var blade = document.createElement('div');
    blade.className = 'motor-blade';
    blade.innerHTML =
      '<div class="motor-blade-arm"></div>' +
      '<div class="motor-blade-arm"></div>' +
      '<div class="motor-blade-arm"></div>';

    var lbl = document.createElement('div');
    lbl.className = 'motor-label';
    lbl.textContent = label;
    lbl.style.marginTop = '2px';

    motor.appendChild(blade);
    motor.appendChild(body);
    motor.appendChild(lbl);
    container.appendChild(motor);
  }

  function drawPowerSupply(container, x, y, voltageText) {
    var ps = document.createElement('div');
    ps.className = 'power-supply';
    ps.style.left = (x - 35) + 'px';
    ps.style.top = (y - 25) + 'px';

    ps.innerHTML =
      '<div class="power-supply-body">' +
      '<div class="power-supply-display">' + voltageText + '</div>' +
      '<div class="power-supply-label">Netzgerät</div>' +
      '</div>';
    container.appendChild(ps);
  }

  function drawAmmeter(container, x, y, valueText) {
    var meter = document.createElement('div');
    meter.className = 'meter';
    meter.style.cssText = 'left:' + (x - 21) + 'px;top:' + (y - 21) + 'px;z-index:2;';
    meter.innerHTML =
      '<div class="meter-body ammeter">A</div>' +
      '<span class="meter-value">' + valueText + '</span>';
    container.appendChild(meter);
  }

  function drawWires(container, pathD, isOn) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:1;';

    var wireColor = isOn ? '#dc2626' : '#6b7280';
    var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', pathD);
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', wireColor);
    pathEl.setAttribute('stroke-width', isOn ? '3' : '2');
    pathEl.setAttribute('stroke-linecap', 'round');
    pathEl.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(pathEl);

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

  // ==================== V1: BULB COMPARISON ====================

  function renderV1(panel) {
    var bulbs = [
      { name: 'Glühlampe 3,5 V / 0,2 A', ratedV: 3.5, ratedI: 0.2, resistance: 17.5, ratedP: 0.7 },
      { name: 'Glühlampe 6 V / 0,3 A', ratedV: 6, ratedI: 0.3, resistance: 20, ratedP: 1.8 },
      { name: 'Glühlampe 6 V / 0,1 A', ratedV: 6, ratedI: 0.1, resistance: 60, ratedP: 0.6 },
      { name: 'Glühlampe 3,5 V / 0,1 A', ratedV: 3.5, ratedI: 0.1, resistance: 35, ratedP: 0.35 }
    ];

    state.bulb1 = 0;
    state.bulb2 = 1;
    state.voltage1 = 3.0;
    state.voltage2 = 3.0;
    state.measurements = [];

    // Bulb selectors
    var selectCard = document.createElement('div');
    selectCard.className = 'card';

    var row1 = document.createElement('div');
    row1.className = 'control-row';
    row1.innerHTML = '<span class="control-label">Lampe 1:</span>';
    var sel1 = document.createElement('select');
    sel1.className = 'select-control';
    sel1.id = 'v1-bulb1';
    bulbs.forEach(function (b, i) {
      var opt = document.createElement('option');
      opt.value = i; opt.textContent = b.name;
      sel1.appendChild(opt);
    });
    row1.appendChild(sel1);
    selectCard.appendChild(row1);

    var row2 = document.createElement('div');
    row2.className = 'control-row mt-sm';
    row2.innerHTML = '<span class="control-label">Lampe 2:</span>';
    var sel2 = document.createElement('select');
    sel2.className = 'select-control';
    sel2.id = 'v1-bulb2';
    sel2.value = 1;
    bulbs.forEach(function (b, i) {
      var opt = document.createElement('option');
      opt.value = i; opt.textContent = b.name;
      if (i === 1) opt.selected = true;
      sel2.appendChild(opt);
    });
    row2.appendChild(sel2);
    selectCard.appendChild(row2);

    panel.appendChild(selectCard);

    // Dual circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var dual = document.createElement('div');
    dual.className = 'dual-circuit';

    var half1 = document.createElement('div');
    half1.className = 'circuit-half';
    half1.innerHTML = '<div class="circuit-half-label">Stromkreis 1</div>';
    var viz1 = document.createElement('div');
    viz1.className = 'circuit-viz';
    viz1.id = 'v1-circuit1';
    half1.appendChild(viz1);

    var half2 = document.createElement('div');
    half2.className = 'circuit-half';
    half2.innerHTML = '<div class="circuit-half-label">Stromkreis 2</div>';
    var viz2 = document.createElement('div');
    viz2.className = 'circuit-viz';
    viz2.id = 'v1-circuit2';
    half2.appendChild(viz2);

    dual.appendChild(half1);
    dual.appendChild(half2);
    vizCard.appendChild(dual);
    panel.appendChild(vizCard);

    // Voltage sliders
    var sliderCard = document.createElement('div');
    sliderCard.className = 'card';
    sliderCard.innerHTML =
      '<div class="slider-container">' +
      '<div class="control-label">Spannung Stromkreis 1:</div>' +
      '<div class="slider-row">' +
      '<input type="range" class="slider-input" id="v1-slider1" min="0" max="8" step="0.1" value="3.0">' +
      '<span class="slider-value" id="v1-volt1">3,0 V</span>' +
      '</div></div>' +
      '<div class="slider-container mt-sm">' +
      '<div class="control-label">Spannung Stromkreis 2:</div>' +
      '<div class="slider-row">' +
      '<input type="range" class="slider-input" id="v1-slider2" min="0" max="8" step="0.1" value="3.0">' +
      '<span class="slider-value" id="v1-volt2">3,0 V</span>' +
      '</div></div>';
    panel.appendChild(sliderCard);

    // Readings
    var readCard = document.createElement('div');
    readCard.className = 'card';
    var voltRow = document.createElement('div');
    voltRow.className = 'voltage-row';
    voltRow.id = 'v1-readings';
    readCard.appendChild(voltRow);
    panel.appendChild(readCard);

    // Match indicator
    var matchDiv = document.createElement('div');
    matchDiv.className = 'text-center';
    matchDiv.id = 'v1-match';
    panel.appendChild(matchDiv);

    // Results table
    var resultsCard = document.createElement('div');
    resultsCard.className = 'card';
    resultsCard.innerHTML =
      '<div class="control-label" style="margin-bottom:0.5rem;">Messprotokoll:</div>' +
      '<table class="results-table"><thead><tr><th>Nr.</th><th>Lampe 1</th><th>U₁</th><th>Lampe 2</th><th>U₂</th><th>I</th></tr></thead>' +
      '<tbody id="v1-results-body"></tbody></table>';
    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-secondary mt-sm';
    saveBtn.textContent = 'Messwert speichern';
    saveBtn.id = 'v1-save-btn';
    resultsCard.appendChild(saveBtn);
    panel.appendChild(resultsCard);

    // Conclusion
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v1-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    function updateV1() {
      var b1 = bulbs[state.bulb1];
      var b2 = bulbs[state.bulb2];
      var i1 = state.voltage1 / b1.resistance;
      var i2 = state.voltage2 / b2.resistance;
      var p1 = state.voltage1 * i1;
      var p2 = state.voltage2 * i2;

      // Draw circuits
      drawV1Half(document.getElementById('v1-circuit1'), b1, state.voltage1, i1, p1);
      drawV1Half(document.getElementById('v1-circuit2'), b2, state.voltage2, i2, p2);

      // Update readings
      var readings = document.getElementById('v1-readings');
      readings.innerHTML =
        '<div class="voltage-box source"><div class="voltage-label">U₁ (Stromkreis 1)</div><div class="voltage-value">' + formatNum(state.voltage1, 1) + ' V</div></div>' +
        '<div class="voltage-box current"><div class="voltage-label">I₁</div><div class="voltage-value">' + formatNum(i1 * 1000, 0) + ' mA</div></div>' +
        '<div class="voltage-box source"><div class="voltage-label">U₂ (Stromkreis 2)</div><div class="voltage-value">' + formatNum(state.voltage2, 1) + ' V</div></div>' +
        '<div class="voltage-box current"><div class="voltage-label">I₂</div><div class="voltage-value">' + formatNum(i2 * 1000, 0) + ' mA</div></div>';

      // Match check
      var matchEl = document.getElementById('v1-match');
      var diff = Math.abs(i1 - i2);
      if (state.voltage1 > 0.1 && state.voltage2 > 0.1 && diff < 0.005) {
        matchEl.innerHTML = '<span class="status-badge success">Stromstärken gleich! Die Lampen leuchten unterschiedlich hell.</span>';
      } else if (diff < 0.02) {
        matchEl.innerHTML = '<span class="status-badge warning">Fast gleich – feinjustieren!</span>';
      } else {
        matchEl.innerHTML = '<span class="status-badge info">Stelle die Spannungen so ein, dass beide Stromstärken gleich sind.</span>';
      }
    }

    function drawV1Half(container, bulb, voltage, current, power) {
      container.innerHTML = '';
      var w = container.offsetWidth || 200;
      var h = container.offsetHeight || 260;
      var cx = w * 0.5;
      var isOn = voltage > 0.2;

      // Wires
      var topY = 35;
      var botY = h - 50;
      var leftX = w * 0.15;
      var rightX = w * 0.85;
      var ammY = h * 0.45;

      var pathD =
        'M ' + cx + ' ' + topY +
        ' L ' + rightX + ' ' + topY +
        ' L ' + rightX + ' ' + ammY +
        ' M ' + rightX + ' ' + ammY +
        ' L ' + rightX + ' ' + botY +
        ' L ' + cx + ' ' + botY +
        ' M ' + cx + ' ' + botY +
        ' L ' + leftX + ' ' + botY +
        ' L ' + leftX + ' ' + topY +
        ' L ' + cx + ' ' + topY;

      drawWires(container, pathD, isOn);

      // Power supply
      var psEl = document.createElement('div');
      psEl.style.cssText = 'position:absolute;left:' + (cx - 30) + 'px;top:' + (topY - 12) + 'px;z-index:2;';
      psEl.innerHTML = '<div class="battery-body" style="width:60px;"><span class="battery-label">' + formatNum(voltage, 1) + ' V</span></div>';
      container.appendChild(psEl);

      // Bulb
      var bulbClass = getBulbClass(power, bulb.ratedP);
      var bulbEl = document.createElement('div');
      bulbEl.style.cssText = 'position:absolute;left:' + (cx - 14) + 'px;top:' + (botY - 22) + 'px;z-index:2;display:flex;flex-direction:column;align-items:center;';
      bulbEl.innerHTML =
        '<div class="bulb-glass ' + bulbClass + '"></div>' +
        '<div class="bulb-label" style="font-size:0.6rem;max-width:80px;text-align:center;overflow:hidden;text-overflow:ellipsis;">' + bulb.name.split('/')[0].trim() + '</div>';
      container.appendChild(bulbEl);

      // Ammeter
      drawAmmeter(container, rightX, ammY, isOn ? formatNum(current * 1000, 0) + ' mA' : '0 mA');
    }

    var slider1 = document.getElementById('v1-slider1');
    var slider2 = document.getElementById('v1-slider2');

    function onSlider1() {
      state.voltage1 = parseFloat(slider1.value);
      document.getElementById('v1-volt1').textContent = formatNum(state.voltage1, 1) + ' V';
      updateV1();
    }
    function onSlider2() {
      state.voltage2 = parseFloat(slider2.value);
      document.getElementById('v1-volt2').textContent = formatNum(state.voltage2, 1) + ' V';
      updateV1();
    }
    function onBulb1Change() {
      state.bulb1 = parseInt(sel1.value);
      updateV1();
    }
    function onBulb2Change() {
      state.bulb2 = parseInt(sel2.value);
      updateV1();
    }
    function onSave() {
      var b1 = bulbs[state.bulb1];
      var b2 = bulbs[state.bulb2];
      var i1 = state.voltage1 / b1.resistance;
      var i2 = state.voltage2 / b2.resistance;
      state.measurements.push({});
      var tbody = document.getElementById('v1-results-body');
      var row = document.createElement('tr');
      row.innerHTML =
        '<td>' + state.measurements.length + '</td>' +
        '<td>' + b1.name + '</td>' +
        '<td>' + formatNum(state.voltage1, 1) + ' V</td>' +
        '<td>' + b2.name + '</td>' +
        '<td>' + formatNum(state.voltage2, 1) + ' V</td>' +
        '<td><strong>' + formatNum(i1 * 1000, 0) + ' / ' + formatNum(i2 * 1000, 0) + ' mA</strong></td>';
      tbody.appendChild(row);

      if (state.measurements.length >= 2) {
        document.getElementById('v1-conclusion').classList.remove('hidden');
      }
    }

    slider1.addEventListener('input', onSlider1);
    slider2.addEventListener('input', onSlider2);
    sel1.addEventListener('change', onBulb1Change);
    sel2.addEventListener('change', onBulb2Change);
    document.getElementById('v1-save-btn').addEventListener('click', onSave);

    cleanupFns.push(function () {
      slider1.removeEventListener('input', onSlider1);
      slider2.removeEventListener('input', onSlider2);
      sel1.removeEventListener('change', onBulb1Change);
      sel2.removeEventListener('change', onBulb2Change);
    });

    // Initial draw after DOM is ready
    requestAnimationFrame(function () { updateV1(); });
  }

  // ==================== V2a: SINGLE MOTOR ====================

  function renderV2a(panel) {
    var motorResistance = 15; // ohms (simplified model)

    state.voltage = 0;

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 'v2a-circuit';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Voltage slider
    var sliderCard = document.createElement('div');
    sliderCard.className = 'card';
    sliderCard.innerHTML =
      '<div class="slider-container">' +
      '<div class="control-label">Spannung des Netzgeräts:</div>' +
      '<div class="slider-row">' +
      '<input type="range" class="slider-input" id="v2a-slider" min="0" max="12" step="0.5" value="0">' +
      '<span class="slider-value" id="v2a-volt-val">0,0 V</span>' +
      '</div></div>';
    panel.appendChild(sliderCard);

    // Readings
    var readCard = document.createElement('div');
    readCard.className = 'card';
    readCard.innerHTML =
      '<div class="voltage-row">' +
      '<div class="voltage-box source"><div class="voltage-label">Spannung</div><div class="voltage-value" id="v2a-u">0,0 V</div></div>' +
      '<div class="voltage-box current"><div class="voltage-label">Stromstärke</div><div class="voltage-value" id="v2a-i">0 mA</div></div>' +
      '<div class="voltage-box speed"><div class="voltage-label">Drehzahl</div><div class="voltage-value" id="v2a-speed">0 %</div></div>' +
      '</div>';
    panel.appendChild(readCard);

    // Speed bar
    var speedCard = document.createElement('div');
    speedCard.className = 'card';
    speedCard.innerHTML =
      '<div class="control-label" style="margin-bottom:0.5rem;">Motordrehzahl:</div>' +
      '<div class="speed-bar-container">' +
      '<span class="speed-bar-label">0%</span>' +
      '<div class="speed-bar-track"><div class="speed-bar-fill" id="v2a-speed-bar" style="width:0%"></div></div>' +
      '<span class="speed-bar-label">100%</span>' +
      '</div>';
    panel.appendChild(speedCard);

    // Results
    var resultsCard = document.createElement('div');
    resultsCard.className = 'card';
    resultsCard.innerHTML =
      '<div class="control-label" style="margin-bottom:0.5rem;">Messprotokoll:</div>' +
      '<table class="results-table"><thead><tr><th>Nr.</th><th>Spannung</th><th>Strom</th><th>Drehzahl</th></tr></thead>' +
      '<tbody id="v2a-results-body"></tbody></table>';
    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-secondary mt-sm';
    saveBtn.textContent = 'Messwert speichern';
    saveBtn.id = 'v2a-save-btn';
    resultsCard.appendChild(saveBtn);
    panel.appendChild(resultsCard);

    state.v2aMeasurements = [];

    // Conclusion
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v2a-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    function updateV2a() {
      var v = state.voltage;
      var current = v / motorResistance;
      var speedPct = Math.min(100, (v / 9) * 100); // 9V = 100% speed
      var isOn = v > 0.3;

      document.getElementById('v2a-u').textContent = formatNum(v, 1) + ' V';
      document.getElementById('v2a-i').textContent = formatNum(current * 1000, 0) + ' mA';
      document.getElementById('v2a-speed').textContent = Math.round(speedPct) + ' %';
      document.getElementById('v2a-speed-bar').style.width = speedPct + '%';

      drawV2aCircuit(document.getElementById('v2a-circuit'), v, current, isOn, speedPct);
    }

    function drawV2aCircuit(container, voltage, current, isOn, speedPct) {
      container.innerHTML = '';
      var w = container.offsetWidth || 400;
      var h = container.offsetHeight || 320;
      var cx = w * 0.5;
      var topY = 40;
      var botY = h - 60;
      var leftX = w * 0.15;
      var rightX = w * 0.85;
      var motorY = botY - 10;
      var ammY = h * 0.45;

      var pathD =
        'M ' + cx + ' ' + topY +
        ' L ' + rightX + ' ' + topY +
        ' L ' + rightX + ' ' + ammY +
        ' M ' + rightX + ' ' + ammY +
        ' L ' + rightX + ' ' + motorY +
        ' L ' + (cx + 22) + ' ' + motorY +
        ' M ' + (cx - 22) + ' ' + motorY +
        ' L ' + leftX + ' ' + motorY +
        ' L ' + leftX + ' ' + topY +
        ' L ' + cx + ' ' + topY;

      drawWires(container, pathD, isOn);

      // Power supply
      drawPowerSupply(container, cx, topY + 5, formatNum(voltage, 1) + ' V');

      // Motor
      var spinDur = isOn ? Math.max(0.3, 3 - (speedPct / 100) * 2.7) : 0;
      drawMotor(container, cx, motorY, 'Motor', isOn, spinDur);

      // Ammeter
      drawAmmeter(container, rightX, ammY, isOn ? formatNum(current * 1000, 0) + ' mA' : '0 mA');
    }

    var slider = document.getElementById('v2a-slider');

    function onSliderChange() {
      state.voltage = parseFloat(slider.value);
      document.getElementById('v2a-volt-val').textContent = formatNum(state.voltage, 1) + ' V';
      updateV2a();
    }

    function onSave() {
      var v = state.voltage;
      var current = v / motorResistance;
      var speedPct = Math.min(100, (v / 9) * 100);
      state.v2aMeasurements.push({});
      var tbody = document.getElementById('v2a-results-body');
      var row = document.createElement('tr');
      row.innerHTML =
        '<td>' + state.v2aMeasurements.length + '</td>' +
        '<td>' + formatNum(v, 1) + ' V</td>' +
        '<td>' + formatNum(current * 1000, 0) + ' mA</td>' +
        '<td><strong>' + Math.round(speedPct) + ' %</strong></td>';
      tbody.appendChild(row);
      if (state.v2aMeasurements.length >= 3) {
        document.getElementById('v2a-conclusion').classList.remove('hidden');
      }
    }

    slider.addEventListener('input', onSliderChange);
    document.getElementById('v2a-save-btn').addEventListener('click', onSave);

    cleanupFns.push(function () {
      slider.removeEventListener('input', onSliderChange);
    });

    requestAnimationFrame(function () { updateV2a(); });
  }

  // ==================== V2b: MOTORS IN SERIES ====================

  function renderV2b(panel) {
    var motorResistance = 15;
    var refVoltage = 6; // reference: single motor at 6V
    var refSpeed = (refVoltage / 9) * 100;

    state.voltage = 0;

    // Info card
    var infoCard = document.createElement('div');
    infoCard.className = 'card';
    infoCard.innerHTML =
      '<div class="text-center"><span class="status-badge info">Referenz: Ein Motor allein dreht sich bei ' + formatNum(refVoltage, 0) + ' V mit ' + Math.round(refSpeed) + ' % Drehzahl (Strom: ' + formatNum((refVoltage / motorResistance) * 1000, 0) + ' mA)</span></div>';
    panel.appendChild(infoCard);

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 'v2b-circuit';
    viz.style.height = '360px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Voltage slider
    var sliderCard = document.createElement('div');
    sliderCard.className = 'card';
    sliderCard.innerHTML =
      '<div class="slider-container">' +
      '<div class="control-label">Spannung des Netzgeräts:</div>' +
      '<div class="slider-row">' +
      '<input type="range" class="slider-input" id="v2b-slider" min="0" max="18" step="0.5" value="0">' +
      '<span class="slider-value" id="v2b-volt-val">0,0 V</span>' +
      '</div></div>';
    panel.appendChild(sliderCard);

    // Readings
    var readCard = document.createElement('div');
    readCard.className = 'card';
    readCard.innerHTML =
      '<div class="voltage-row">' +
      '<div class="voltage-box source"><div class="voltage-label">U gesamt</div><div class="voltage-value" id="v2b-u">0,0 V</div></div>' +
      '<div class="voltage-box lamp"><div class="voltage-label">U je Motor</div><div class="voltage-value" id="v2b-um">0,0 V</div></div>' +
      '<div class="voltage-box current"><div class="voltage-label">Stromstärke</div><div class="voltage-value" id="v2b-i">0 mA</div></div>' +
      '<div class="voltage-box speed"><div class="voltage-label">Drehzahl</div><div class="voltage-value" id="v2b-speed">0 %</div></div>' +
      '</div>';
    panel.appendChild(readCard);

    // Match indicator
    var matchDiv = document.createElement('div');
    matchDiv.className = 'text-center';
    matchDiv.id = 'v2b-match';
    panel.appendChild(matchDiv);

    // Results
    var resultsCard = document.createElement('div');
    resultsCard.className = 'card';
    resultsCard.innerHTML =
      '<div class="control-label" style="margin-bottom:0.5rem;">Messprotokoll:</div>' +
      '<table class="results-table"><thead><tr><th>Nr.</th><th>U ges.</th><th>U Motor</th><th>Strom</th><th>Drehzahl</th></tr></thead>' +
      '<tbody id="v2b-results-body"></tbody></table>';
    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-secondary mt-sm';
    saveBtn.textContent = 'Messwert speichern';
    saveBtn.id = 'v2b-save-btn';
    resultsCard.appendChild(saveBtn);
    panel.appendChild(resultsCard);

    state.v2bMeasurements = [];

    // Conclusion
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v2b-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    function updateV2b() {
      var v = state.voltage;
      // Two motors in series: total resistance doubles
      var current = v / (motorResistance * 2);
      var vPerMotor = v / 2;
      var speedPct = Math.min(100, (vPerMotor / 9) * 100);
      var isOn = v > 0.5;

      document.getElementById('v2b-u').textContent = formatNum(v, 1) + ' V';
      document.getElementById('v2b-um').textContent = formatNum(vPerMotor, 1) + ' V';
      document.getElementById('v2b-i').textContent = formatNum(current * 1000, 0) + ' mA';
      document.getElementById('v2b-speed').textContent = Math.round(speedPct) + ' %';

      // Check if speed matches reference
      var matchEl = document.getElementById('v2b-match');
      var speedDiff = Math.abs(speedPct - refSpeed);
      if (isOn && speedDiff < 3) {
        matchEl.innerHTML = '<span class="status-badge success">Gleiche Drehzahl wie ein Motor allein bei ' + formatNum(refVoltage, 0) + ' V erreicht!</span>';
      } else if (isOn && speedDiff < 10) {
        matchEl.innerHTML = '<span class="status-badge warning">Fast gleiche Drehzahl – weiter anpassen!</span>';
      } else {
        matchEl.innerHTML = '<span class="status-badge info">Erhöhe die Spannung, bis beide Motoren so schnell drehen wie ein Motor bei ' + formatNum(refVoltage, 0) + ' V.</span>';
      }

      drawV2bCircuit(document.getElementById('v2b-circuit'), v, vPerMotor, current, isOn, speedPct);
    }

    function drawV2bCircuit(container, voltage, vPerMotor, current, isOn, speedPct) {
      container.innerHTML = '';
      var w = container.offsetWidth || 400;
      var h = container.offsetHeight || 360;
      var cx = w * 0.5;
      var topY = 45;
      var botY = h - 50;
      var leftX = w * 0.12;
      var rightX = w * 0.88;
      var motor1X = w * 0.35;
      var motor2X = w * 0.65;
      var motorY = botY - 10;
      var ammY = h * 0.4;

      var pathD =
        'M ' + cx + ' ' + topY +
        ' L ' + rightX + ' ' + topY +
        ' L ' + rightX + ' ' + ammY +
        ' M ' + rightX + ' ' + ammY +
        ' L ' + rightX + ' ' + motorY +
        ' L ' + (motor2X + 22) + ' ' + motorY +
        ' M ' + (motor2X - 22) + ' ' + motorY +
        ' L ' + (motor1X + 22) + ' ' + motorY +
        ' M ' + (motor1X - 22) + ' ' + motorY +
        ' L ' + leftX + ' ' + motorY +
        ' L ' + leftX + ' ' + topY +
        ' L ' + cx + ' ' + topY;

      drawWires(container, pathD, isOn);

      // Power supply
      drawPowerSupply(container, cx, topY + 5, formatNum(voltage, 1) + ' V');

      // Motors
      var spinDur = isOn ? Math.max(0.3, 3 - (speedPct / 100) * 2.7) : 0;
      drawMotor(container, motor1X, motorY, 'Motor 1', isOn, spinDur);
      drawMotor(container, motor2X, motorY, 'Motor 2', isOn, spinDur);

      // Ammeter
      drawAmmeter(container, rightX, ammY, isOn ? formatNum(current * 1000, 0) + ' mA' : '0 mA');
    }

    var slider = document.getElementById('v2b-slider');

    function onSliderChange() {
      state.voltage = parseFloat(slider.value);
      document.getElementById('v2b-volt-val').textContent = formatNum(state.voltage, 1) + ' V';
      updateV2b();
    }

    function onSave() {
      var v = state.voltage;
      var current = v / (motorResistance * 2);
      var vPerMotor = v / 2;
      var speedPct = Math.min(100, (vPerMotor / 9) * 100);
      state.v2bMeasurements.push({});
      var tbody = document.getElementById('v2b-results-body');
      var row = document.createElement('tr');
      row.innerHTML =
        '<td>' + state.v2bMeasurements.length + '</td>' +
        '<td>' + formatNum(v, 1) + ' V</td>' +
        '<td>' + formatNum(vPerMotor, 1) + ' V</td>' +
        '<td>' + formatNum(current * 1000, 0) + ' mA</td>' +
        '<td><strong>' + Math.round(speedPct) + ' %</strong></td>';
      tbody.appendChild(row);
      if (state.v2bMeasurements.length >= 2) {
        document.getElementById('v2b-conclusion').classList.remove('hidden');
      }
    }

    slider.addEventListener('input', onSliderChange);
    document.getElementById('v2b-save-btn').addEventListener('click', onSave);

    cleanupFns.push(function () {
      slider.removeEventListener('input', onSliderChange);
    });

    requestAnimationFrame(function () { updateV2b(); });
  }

  // ==================== V2c: MOTORS IN PARALLEL ====================

  function renderV2c(panel) {
    var motorResistance = 15;
    var fixedVoltage = 6;

    state.secondMotorOn = false;

    // Info card
    var infoCard = document.createElement('div');
    infoCard.className = 'card';
    infoCard.innerHTML =
      '<div class="text-center"><span class="status-badge info">Spannung fest eingestellt auf ' + formatNum(fixedVoltage, 0) + ' V</span></div>';
    panel.appendChild(infoCard);

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 'v2c-circuit';
    viz.style.height = '380px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Toggle button
    var btnCard = document.createElement('div');
    btnCard.className = 'card';
    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row';
    btnRow.style.justifyContent = 'center';
    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn btn-primary';
    toggleBtn.id = 'v2c-toggle';
    toggleBtn.textContent = 'Zweiten Motor zuschalten';
    btnRow.appendChild(toggleBtn);
    btnCard.appendChild(btnRow);

    var statusDiv = document.createElement('div');
    statusDiv.className = 'text-center mt-sm';
    statusDiv.id = 'v2c-status';
    statusDiv.innerHTML = '<span class="status-badge info">Ein Motor angeschlossen</span>';
    btnCard.appendChild(statusDiv);
    panel.appendChild(btnCard);

    // Readings
    var readCard = document.createElement('div');
    readCard.className = 'card';
    readCard.innerHTML =
      '<div class="voltage-row">' +
      '<div class="voltage-box source"><div class="voltage-label">Spannung</div><div class="voltage-value" id="v2c-u">' + formatNum(fixedVoltage, 1) + ' V</div></div>' +
      '<div class="voltage-box current"><div class="voltage-label">Strom gesamt</div><div class="voltage-value" id="v2c-i">0 mA</div></div>' +
      '<div class="voltage-box speed"><div class="voltage-label">Drehzahl Motor 1</div><div class="voltage-value" id="v2c-speed1">0 %</div></div>' +
      '<div class="voltage-box speed"><div class="voltage-label" id="v2c-speed2-label">Drehzahl Motor 2</div><div class="voltage-value" id="v2c-speed2">– –</div></div>' +
      '</div>';
    panel.appendChild(readCard);

    state.v2cToggleCount = 0;

    // Conclusion
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v2c-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    function updateV2c() {
      var numMotors = state.secondMotorOn ? 2 : 1;
      var totalCurrent = (fixedVoltage / motorResistance) * numMotors;
      var speedPct = Math.min(100, (fixedVoltage / 9) * 100);

      document.getElementById('v2c-i').textContent = formatNum(totalCurrent * 1000, 0) + ' mA';
      document.getElementById('v2c-speed1').textContent = Math.round(speedPct) + ' %';
      document.getElementById('v2c-speed2').textContent = state.secondMotorOn ? Math.round(speedPct) + ' %' : '– –';

      drawV2cCircuit(document.getElementById('v2c-circuit'), fixedVoltage, totalCurrent, speedPct, state.secondMotorOn);
    }

    function drawV2cCircuit(container, voltage, totalCurrent, speedPct, twoMotors) {
      container.innerHTML = '';
      var w = container.offsetWidth || 400;
      var h = container.offsetHeight || 380;
      var cx = w * 0.5;
      var topY = 45;
      var botY = h - 30;
      var leftX = w * 0.1;
      var rightX = w * 0.9;
      var ammY = topY + 50;

      var motor1Y = h * 0.55;
      var motor2Y = h * 0.55;
      var motor1X = w * 0.35;
      var motor2X = w * 0.65;

      var branchTopY = ammY + 40;
      var branchBotY = motor1Y + 45;

      var spinDur = Math.max(0.3, 3 - (speedPct / 100) * 2.7);

      if (twoMotors) {
        // Parallel circuit: splits into two branches
        var pathD =
          // Top: power supply to right
          'M ' + cx + ' ' + topY +
          ' L ' + rightX + ' ' + topY +
          // Right side down to ammeter
          ' L ' + rightX + ' ' + ammY +
          // From ammeter down to branch point
          ' M ' + rightX + ' ' + ammY +
          ' L ' + rightX + ' ' + branchTopY +
          // Branch to motor 1 (left)
          ' L ' + motor1X + ' ' + branchTopY +
          ' L ' + motor1X + ' ' + (motor1Y - 22) +
          // Motor 1 bottom to merge point
          ' M ' + motor1X + ' ' + (motor1Y + 22) +
          ' L ' + motor1X + ' ' + branchBotY +
          // Branch to motor 2 (right)
          ' M ' + rightX + ' ' + branchTopY +
          ' L ' + motor2X + ' ' + branchTopY +
          ' L ' + motor2X + ' ' + (motor2Y - 22) +
          // Motor 2 bottom to merge point
          ' M ' + motor2X + ' ' + (motor2Y + 22) +
          ' L ' + motor2X + ' ' + branchBotY +
          // Merge point to left and back to power supply
          ' M ' + motor1X + ' ' + branchBotY +
          ' L ' + leftX + ' ' + branchBotY +
          ' L ' + leftX + ' ' + topY +
          ' L ' + cx + ' ' + topY +
          // Right merge
          ' M ' + motor2X + ' ' + branchBotY +
          ' L ' + motor1X + ' ' + branchBotY;

        drawWires(container, pathD, true);
        drawMotor(container, motor1X, motor1Y, 'Motor 1', true, spinDur);
        drawMotor(container, motor2X, motor2Y, 'Motor 2', true, spinDur);
      } else {
        // Single motor circuit
        var singleMotorY = h * 0.6;
        var pathD =
          'M ' + cx + ' ' + topY +
          ' L ' + rightX + ' ' + topY +
          ' L ' + rightX + ' ' + ammY +
          ' M ' + rightX + ' ' + ammY +
          ' L ' + rightX + ' ' + singleMotorY +
          ' L ' + (cx + 22) + ' ' + singleMotorY +
          ' M ' + (cx - 22) + ' ' + singleMotorY +
          ' L ' + leftX + ' ' + singleMotorY +
          ' L ' + leftX + ' ' + topY +
          ' L ' + cx + ' ' + topY;

        drawWires(container, pathD, true);
        drawMotor(container, cx, singleMotorY, 'Motor 1', true, spinDur);
      }

      // Power supply
      drawPowerSupply(container, cx, topY + 5, formatNum(voltage, 1) + ' V');

      // Ammeter
      drawAmmeter(container, rightX, ammY, formatNum(totalCurrent * 1000, 0) + ' mA');
    }

    function onToggle() {
      state.secondMotorOn = !state.secondMotorOn;
      state.v2cToggleCount++;

      if (state.secondMotorOn) {
        toggleBtn.textContent = 'Zweiten Motor trennen';
        document.getElementById('v2c-status').innerHTML = '<span class="status-badge success">Zwei Motoren parallel angeschlossen</span>';
      } else {
        toggleBtn.textContent = 'Zweiten Motor zuschalten';
        document.getElementById('v2c-status').innerHTML = '<span class="status-badge info">Ein Motor angeschlossen</span>';
      }

      updateV2c();

      if (state.v2cToggleCount >= 2) {
        document.getElementById('v2c-conclusion').classList.remove('hidden');
      }
    }

    toggleBtn.addEventListener('click', onToggle);
    cleanupFns.push(function () {
      toggleBtn.removeEventListener('click', onToggle);
    });

    requestAnimationFrame(function () { updateV2c(); });
  }

  // ==================== START ====================

  window.addEventListener('DOMContentLoaded', init);
})();
