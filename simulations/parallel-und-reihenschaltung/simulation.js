(function () {
  'use strict';

  // ==================== DATA ====================

  var EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'V1: Parallelschaltung',
      title: 'V1: Parallelschaltung aufbauen und messen',
      instruction: 'Baue die Parallelschaltung aus der Schaltskizze auf. Stelle die Spannung der Quelle ein und miss die Stromstärken I\u2081, I\u2082 und I\u2081\u2082 sowie die Spannungen U\u2081, U\u2082 und U\u2081\u2082. Speichere mehrere Messwerte und beobachte die Zusammenhänge.',
      type: 'parallel',
      conclusion: 'Die Stromstärke I\u2081\u2082 ist etwa die Summe der Stromstärken I\u2081 und I\u2082. Die Spannungen U\u2081, U\u2082 und U\u2081\u2082 sind alle gleich. In der Parallelschaltung liegt an jedem Widerstand die volle Spannung an, während sich die Ströme aufteilen.'
    },
    b: {
      id: 'b',
      tab: 'V2: Reihenschaltung',
      title: 'V2: Reihenschaltung aufbauen und messen',
      instruction: 'Baue die Reihenschaltung auf. Stelle die Spannung der Quelle ein und miss die Stromstärken I\u2081, I\u2082 und I\u2081\u2082 sowie die Spannungen U\u2081, U\u2082 und U\u2081\u2082. Speichere mehrere Messwerte und beobachte die Zusammenhänge.',
      type: 'series',
      conclusion: 'Die Stromstärken I\u2081, I\u2082 und I\u2081\u2082 sind alle gleich. Die Spannung U\u2081\u2082 ist etwa die Summe der Teilspannungen U\u2081 und U\u2082. In der Reihenschaltung fließt überall der gleiche Strom, während sich die Spannung aufteilt.'
    }
  };

  // Resistor values for the two components
  var R1 = 100; // Ohm
  var R2 = 150; // Ohm

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
      case 'parallel': renderParallel(panel); break;
      case 'series': renderSeries(panel); break;
    }
  }

  // ==================== HELPERS ====================

  function formatNum(val, decimals) {
    return val.toFixed(decimals).replace('.', ',');
  }

  function drawWires(container, paths, isOn) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:1;';

    var wireColor = isOn ? '#dc2626' : '#6b7280';
    var strokeW = isOn ? 3 : 2;

    for (var p = 0; p < paths.length; p++) {
      var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', paths[p]);
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('stroke', wireColor);
      pathEl.setAttribute('stroke-width', strokeW);
      pathEl.setAttribute('stroke-linecap', 'round');
      pathEl.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(pathEl);
    }

    if (isOn) {
      var animCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      animCircle.setAttribute('r', '4');
      animCircle.setAttribute('fill', '#fde047');
      animCircle.setAttribute('stroke', '#f59e0b');
      animCircle.setAttribute('stroke-width', '1');
      var animMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
      animMotion.setAttribute('dur', '2.5s');
      animMotion.setAttribute('repeatCount', 'indefinite');
      animMotion.setAttribute('path', paths[0]);
      animCircle.appendChild(animMotion);
      svg.appendChild(animCircle);
    }

    container.appendChild(svg);
  }

  function drawPowerSupply(container, x, y, voltageText) {
    var ps = document.createElement('div');
    ps.className = 'power-supply';
    ps.style.left = (x - 35) + 'px';
    ps.style.top = (y - 25) + 'px';

    ps.innerHTML =
      '<div class="power-supply-body">' +
      '<div class="power-supply-display">' + voltageText + '</div>' +
      '<div class="power-supply-label">Netzger\u00e4t</div>' +
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

  function drawVoltmeter(container, x, y, valueText) {
    var meter = document.createElement('div');
    meter.className = 'meter';
    meter.style.cssText = 'left:' + (x - 21) + 'px;top:' + (y - 21) + 'px;z-index:2;';
    meter.innerHTML =
      '<div class="meter-body voltmeter">V</div>' +
      '<span class="meter-value">' + valueText + '</span>';
    container.appendChild(meter);
  }

  function drawResistor(container, x, y, label) {
    var res = document.createElement('div');
    res.className = 'resistor-container';
    res.style.left = (x - 24) + 'px';
    res.style.top = (y - 10) + 'px';
    res.innerHTML =
      '<div class="resistor-body"><span class="resistor-symbol">' + label + '</span></div>';
    container.appendChild(res);
  }

  function drawResistorVertical(container, x, y, label) {
    var res = document.createElement('div');
    res.className = 'resistor-container';
    res.style.left = (x - 10) + 'px';
    res.style.top = (y - 24) + 'px';
    var body = document.createElement('div');
    body.className = 'resistor-body';
    body.style.cssText = 'width:20px;height:48px;flex-direction:column;';
    body.innerHTML = '<span class="resistor-symbol">' + label + '</span>';
    res.appendChild(body);
    var lbl = document.createElement('div');
    lbl.className = 'resistor-label';
    lbl.style.marginTop = '2px';
    res.appendChild(lbl);
    container.appendChild(res);
  }

  // ==================== V1: PARALLELSCHALTUNG ====================

  function renderParallel(panel) {
    state.voltage = 6;
    state.measurements = [];

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 'v1-circuit';
    viz.style.height = '340px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Voltage slider
    var sliderCard = document.createElement('div');
    sliderCard.className = 'card';
    sliderCard.innerHTML =
      '<div class="slider-container">' +
      '<div class="control-label">Spannung der Quelle:</div>' +
      '<div class="slider-row">' +
      '<input type="range" class="slider-input" id="v1-slider" min="0" max="12" step="0.5" value="6">' +
      '<span class="slider-value" id="v1-volt-val">6,0 V</span>' +
      '</div></div>';
    panel.appendChild(sliderCard);

    // Readings – Voltages
    var readCardV = document.createElement('div');
    readCardV.className = 'card';
    readCardV.innerHTML =
      '<div class="control-label" style="margin-bottom:0.5rem;">Spannungen:</div>' +
      '<div class="voltage-row" id="v1-voltages"></div>';
    panel.appendChild(readCardV);

    // Readings – Currents
    var readCardI = document.createElement('div');
    readCardI.className = 'card';
    readCardI.innerHTML =
      '<div class="control-label" style="margin-bottom:0.5rem;">Stromst\u00e4rken:</div>' +
      '<div class="voltage-row" id="v1-currents"></div>';
    panel.appendChild(readCardI);

    // Relationship indicator
    var relDiv = document.createElement('div');
    relDiv.className = 'text-center';
    relDiv.id = 'v1-relation';
    panel.appendChild(relDiv);

    // Results table
    var resultsCard = document.createElement('div');
    resultsCard.className = 'card';
    resultsCard.innerHTML =
      '<div class="control-label" style="margin-bottom:0.5rem;">Messprotokoll:</div>' +
      '<table class="results-table"><thead><tr>' +
      '<th>Nr.</th><th>U\u2081\u2082</th><th>U\u2081</th><th>U\u2082</th><th>I\u2081\u2082</th><th>I\u2081</th><th>I\u2082</th>' +
      '</tr></thead><tbody id="v1-results-body"></tbody></table>';
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

    function calcParallel() {
      var U = state.voltage;
      var I1 = U / R1;
      var I2 = U / R2;
      var Iges = I1 + I2;
      return { U: U, U1: U, U2: U, I1: I1, I2: I2, Iges: Iges };
    }

    function updateV1() {
      var vals = calcParallel();
      var isOn = vals.U > 0.2;

      // Draw circuit
      drawParallelCircuit(document.getElementById('v1-circuit'), vals, isOn);

      // Update voltage readings
      var voltages = document.getElementById('v1-voltages');
      voltages.innerHTML =
        '<div class="voltage-box source"><div class="voltage-label">U\u2081\u2082 (gesamt)</div><div class="voltage-value">' + formatNum(vals.U, 1) + ' V</div></div>' +
        '<div class="voltage-box lamp"><div class="voltage-label">U\u2081</div><div class="voltage-value">' + formatNum(vals.U1, 1) + ' V</div></div>' +
        '<div class="voltage-box lamp"><div class="voltage-label">U\u2082</div><div class="voltage-value">' + formatNum(vals.U2, 1) + ' V</div></div>';

      // Update current readings
      var currents = document.getElementById('v1-currents');
      currents.innerHTML =
        '<div class="voltage-box current"><div class="voltage-label">I\u2081\u2082 (gesamt)</div><div class="voltage-value">' + formatNum(vals.Iges * 1000, 0) + ' mA</div></div>' +
        '<div class="voltage-box current"><div class="voltage-label">I\u2081</div><div class="voltage-value">' + formatNum(vals.I1 * 1000, 0) + ' mA</div></div>' +
        '<div class="voltage-box current"><div class="voltage-label">I\u2082</div><div class="voltage-value">' + formatNum(vals.I2 * 1000, 0) + ' mA</div></div>';

      // Relationship indicator
      var relEl = document.getElementById('v1-relation');
      if (isOn) {
        relEl.innerHTML =
          '<span class="status-badge success">U\u2081 = U\u2082 = U\u2081\u2082 = ' + formatNum(vals.U, 1) + ' V &nbsp;|&nbsp; I\u2081\u2082 = I\u2081 + I\u2082 = ' + formatNum(vals.I1 * 1000, 0) + ' + ' + formatNum(vals.I2 * 1000, 0) + ' = ' + formatNum(vals.Iges * 1000, 0) + ' mA</span>';
      } else {
        relEl.innerHTML = '<span class="status-badge info">Stelle eine Spannung ein, um die Messwerte zu sehen.</span>';
      }
    }

    function drawParallelCircuit(container, vals, isOn) {
      container.innerHTML = '';
      var w = container.offsetWidth || 400;
      var h = container.offsetHeight || 340;

      var leftX = w * 0.08;
      var rightX = w * 0.92;
      var topY = 40;
      var botY = h - 30;
      var cx = w * 0.5;

      // Parallel branch positions
      var branch1X = w * 0.35;
      var branch2X = w * 0.65;
      var branchTopY = topY + 60;
      var branchBotY = botY - 40;
      var branchMidY = (branchTopY + branchBotY) / 2;

      // Ammeter positions
      var ammGesY = (topY + branchTopY) / 2;
      var amm1Y = branchMidY - 30;
      var amm2Y = branchMidY - 30;

      // Resistor positions
      var res1Y = branchMidY + 25;
      var res2Y = branchMidY + 25;

      // Wire paths
      var mainPath =
        // Top: from power supply to right and split
        'M ' + cx + ' ' + topY +
        ' L ' + rightX + ' ' + topY +
        ' L ' + rightX + ' ' + ammGesY +
        // From ammeter down to branch top
        ' M ' + rightX + ' ' + ammGesY +
        ' L ' + rightX + ' ' + branchTopY;

      var branchPath1 =
        // Branch 1 top to ammeter to resistor to bottom
        'M ' + rightX + ' ' + branchTopY +
        ' L ' + branch1X + ' ' + branchTopY +
        ' L ' + branch1X + ' ' + branchBotY +
        ' L ' + rightX + ' ' + branchBotY;

      var branchPath2 =
        // Branch 2
        'M ' + rightX + ' ' + branchTopY +
        ' L ' + branch2X + ' ' + branchTopY +
        ' L ' + branch2X + ' ' + branchBotY +
        ' L ' + rightX + ' ' + branchBotY;

      var returnPath =
        // Bottom return
        'M ' + rightX + ' ' + branchBotY +
        ' L ' + rightX + ' ' + botY +
        ' L ' + leftX + ' ' + botY +
        ' L ' + leftX + ' ' + topY +
        ' L ' + cx + ' ' + topY;

      drawWires(container, [mainPath, branchPath1, branchPath2, returnPath], isOn);

      // Power supply at top center
      drawPowerSupply(container, cx, topY + 5, formatNum(vals.U, 1) + ' V');

      // Ammeter Iges on right side
      drawAmmeter(container, rightX, ammGesY, isOn ? formatNum(vals.Iges * 1000, 0) + ' mA' : '0 mA');

      // Ammeter I1 in branch 1
      drawAmmeter(container, branch1X, amm1Y, isOn ? formatNum(vals.I1 * 1000, 0) + ' mA' : '0 mA');

      // Ammeter I2 in branch 2
      drawAmmeter(container, branch2X, amm2Y, isOn ? formatNum(vals.I2 * 1000, 0) + ' mA' : '0 mA');

      // Resistor R1
      drawResistorVertical(container, branch1X, res1Y, 'R\u2081');

      // Resistor R2
      drawResistorVertical(container, branch2X, res2Y, 'R\u2082');

      // Voltmeter Uges near power supply
      drawVoltmeter(container, leftX + 30, (topY + botY) / 2, isOn ? formatNum(vals.U, 1) + ' V' : '0 V');

      // Labels for ammeters
      addLabel(container, rightX - 6, ammGesY - 30, 'I\u2081\u2082');
      addLabel(container, branch1X - 6, amm1Y - 30, 'I\u2081');
      addLabel(container, branch2X - 6, amm2Y - 30, 'I\u2082');

      // Label for voltmeter
      addLabel(container, leftX + 24, (topY + botY) / 2 - 30, 'U\u2081\u2082');
    }

    function addLabel(container, x, y, text) {
      var lbl = document.createElement('div');
      lbl.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;font-size:0.65rem;font-weight:700;color:#475569;z-index:3;white-space:nowrap;';
      lbl.textContent = text;
      container.appendChild(lbl);
    }

    var slider = document.getElementById('v1-slider');

    function onSliderChange() {
      state.voltage = parseFloat(slider.value);
      document.getElementById('v1-volt-val').textContent = formatNum(state.voltage, 1) + ' V';
      updateV1();
    }

    function onSave() {
      var vals = calcParallel();
      if (vals.U < 0.2) return;
      state.measurements.push({});
      var tbody = document.getElementById('v1-results-body');
      var row = document.createElement('tr');
      row.innerHTML =
        '<td>' + state.measurements.length + '</td>' +
        '<td>' + formatNum(vals.U, 1) + ' V</td>' +
        '<td>' + formatNum(vals.U1, 1) + ' V</td>' +
        '<td>' + formatNum(vals.U2, 1) + ' V</td>' +
        '<td><strong>' + formatNum(vals.Iges * 1000, 0) + ' mA</strong></td>' +
        '<td>' + formatNum(vals.I1 * 1000, 0) + ' mA</td>' +
        '<td>' + formatNum(vals.I2 * 1000, 0) + ' mA</td>';
      tbody.appendChild(row);

      if (state.measurements.length >= 2) {
        document.getElementById('v1-conclusion').classList.remove('hidden');
      }
    }

    slider.addEventListener('input', onSliderChange);
    document.getElementById('v1-save-btn').addEventListener('click', onSave);

    cleanupFns.push(function () {
      slider.removeEventListener('input', onSliderChange);
    });

    requestAnimationFrame(function () { updateV1(); });
  }

  // ==================== V2: REIHENSCHALTUNG ====================

  function renderSeries(panel) {
    state.voltage = 6;
    state.measurements = [];

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 'v2-circuit';
    viz.style.height = '340px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Voltage slider
    var sliderCard = document.createElement('div');
    sliderCard.className = 'card';
    sliderCard.innerHTML =
      '<div class="slider-container">' +
      '<div class="control-label">Spannung der Quelle:</div>' +
      '<div class="slider-row">' +
      '<input type="range" class="slider-input" id="v2-slider" min="0" max="12" step="0.5" value="6">' +
      '<span class="slider-value" id="v2-volt-val">6,0 V</span>' +
      '</div></div>';
    panel.appendChild(sliderCard);

    // Readings – Voltages
    var readCardV = document.createElement('div');
    readCardV.className = 'card';
    readCardV.innerHTML =
      '<div class="control-label" style="margin-bottom:0.5rem;">Spannungen:</div>' +
      '<div class="voltage-row" id="v2-voltages"></div>';
    panel.appendChild(readCardV);

    // Readings – Currents
    var readCardI = document.createElement('div');
    readCardI.className = 'card';
    readCardI.innerHTML =
      '<div class="control-label" style="margin-bottom:0.5rem;">Stromst\u00e4rken:</div>' +
      '<div class="voltage-row" id="v2-currents"></div>';
    panel.appendChild(readCardI);

    // Relationship indicator
    var relDiv = document.createElement('div');
    relDiv.className = 'text-center';
    relDiv.id = 'v2-relation';
    panel.appendChild(relDiv);

    // Results table
    var resultsCard = document.createElement('div');
    resultsCard.className = 'card';
    resultsCard.innerHTML =
      '<div class="control-label" style="margin-bottom:0.5rem;">Messprotokoll:</div>' +
      '<table class="results-table"><thead><tr>' +
      '<th>Nr.</th><th>U\u2081\u2082</th><th>U\u2081</th><th>U\u2082</th><th>I\u2081\u2082</th><th>I\u2081</th><th>I\u2082</th>' +
      '</tr></thead><tbody id="v2-results-body"></tbody></table>';
    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-secondary mt-sm';
    saveBtn.textContent = 'Messwert speichern';
    saveBtn.id = 'v2-save-btn';
    resultsCard.appendChild(saveBtn);
    panel.appendChild(resultsCard);

    // Conclusion
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v2-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    function calcSeries() {
      var U = state.voltage;
      var Rges = R1 + R2;
      var I = U / Rges;
      var U1 = I * R1;
      var U2 = I * R2;
      return { U: U, U1: U1, U2: U2, I: I, I1: I, I2: I, Iges: I };
    }

    function updateV2() {
      var vals = calcSeries();
      var isOn = vals.U > 0.2;

      // Draw circuit
      drawSeriesCircuit(document.getElementById('v2-circuit'), vals, isOn);

      // Update voltage readings
      var voltages = document.getElementById('v2-voltages');
      voltages.innerHTML =
        '<div class="voltage-box source"><div class="voltage-label">U\u2081\u2082 (gesamt)</div><div class="voltage-value">' + formatNum(vals.U, 1) + ' V</div></div>' +
        '<div class="voltage-box lamp"><div class="voltage-label">U\u2081</div><div class="voltage-value">' + formatNum(vals.U1, 1) + ' V</div></div>' +
        '<div class="voltage-box lamp"><div class="voltage-label">U\u2082</div><div class="voltage-value">' + formatNum(vals.U2, 1) + ' V</div></div>';

      // Update current readings
      var currents = document.getElementById('v2-currents');
      currents.innerHTML =
        '<div class="voltage-box current"><div class="voltage-label">I\u2081\u2082 (gesamt)</div><div class="voltage-value">' + formatNum(vals.Iges * 1000, 0) + ' mA</div></div>' +
        '<div class="voltage-box current"><div class="voltage-label">I\u2081</div><div class="voltage-value">' + formatNum(vals.I1 * 1000, 0) + ' mA</div></div>' +
        '<div class="voltage-box current"><div class="voltage-label">I\u2082</div><div class="voltage-value">' + formatNum(vals.I2 * 1000, 0) + ' mA</div></div>';

      // Relationship indicator
      var relEl = document.getElementById('v2-relation');
      if (isOn) {
        relEl.innerHTML =
          '<span class="status-badge success">I\u2081 = I\u2082 = I\u2081\u2082 = ' + formatNum(vals.I * 1000, 0) + ' mA &nbsp;|&nbsp; U\u2081\u2082 = U\u2081 + U\u2082 = ' + formatNum(vals.U1, 1) + ' + ' + formatNum(vals.U2, 1) + ' = ' + formatNum(vals.U, 1) + ' V</span>';
      } else {
        relEl.innerHTML = '<span class="status-badge info">Stelle eine Spannung ein, um die Messwerte zu sehen.</span>';
      }
    }

    function drawSeriesCircuit(container, vals, isOn) {
      container.innerHTML = '';
      var w = container.offsetWidth || 400;
      var h = container.offsetHeight || 340;

      var leftX = w * 0.08;
      var rightX = w * 0.92;
      var topY = 40;
      var botY = h - 30;
      var cx = w * 0.5;

      // Component positions along the bottom
      var res1X = w * 0.33;
      var res2X = w * 0.66;
      var resY = botY - 15;

      // Ammeter positions on right side
      var ammGesY = (topY + botY) * 0.35;
      var amm1Y = resY;
      var amm2Y = resY;

      // Wire paths for series circuit
      var topPath =
        'M ' + cx + ' ' + topY +
        ' L ' + rightX + ' ' + topY +
        ' L ' + rightX + ' ' + ammGesY;

      var rightPath =
        'M ' + rightX + ' ' + ammGesY +
        ' L ' + rightX + ' ' + resY +
        ' L ' + (res2X + 24) + ' ' + resY;

      var midPath =
        'M ' + (res2X - 24) + ' ' + resY +
        ' L ' + (res1X + 24) + ' ' + resY;

      var leftPath =
        'M ' + (res1X - 24) + ' ' + resY +
        ' L ' + leftX + ' ' + resY +
        ' L ' + leftX + ' ' + topY +
        ' L ' + cx + ' ' + topY;

      drawWires(container, [topPath, rightPath, midPath, leftPath], isOn);

      // Power supply at top center
      drawPowerSupply(container, cx, topY + 5, formatNum(vals.U, 1) + ' V');

      // Ammeter Iges on right side
      drawAmmeter(container, rightX, ammGesY, isOn ? formatNum(vals.Iges * 1000, 0) + ' mA' : '0 mA');

      // Resistors
      drawResistor(container, res1X, resY, 'R\u2081');
      drawResistor(container, res2X, resY, 'R\u2082');

      // Voltmeter Uges near power supply on left
      drawVoltmeter(container, leftX + 30, (topY + resY) / 2, isOn ? formatNum(vals.U, 1) + ' V' : '0 V');

      // Voltmeter U1 above R1
      drawVoltmeter(container, res1X, resY - 65, isOn ? formatNum(vals.U1, 1) + ' V' : '0 V');

      // Voltmeter U2 above R2
      drawVoltmeter(container, res2X, resY - 65, isOn ? formatNum(vals.U2, 1) + ' V' : '0 V');

      // Labels
      addLabel(container, rightX - 6, ammGesY - 30, 'I\u2081\u2082');
      addLabel(container, leftX + 24, (topY + resY) / 2 - 30, 'U\u2081\u2082');
      addLabel(container, res1X - 6, resY - 95, 'U\u2081');
      addLabel(container, res2X - 6, resY - 95, 'U\u2082');
      addLabel(container, res1X - 8, resY + 18, 'R\u2081=' + R1 + '\u2126');
      addLabel(container, res2X - 8, resY + 18, 'R\u2082=' + R2 + '\u2126');
    }

    function addLabel(container, x, y, text) {
      var lbl = document.createElement('div');
      lbl.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;font-size:0.65rem;font-weight:700;color:#475569;z-index:3;white-space:nowrap;';
      lbl.textContent = text;
      container.appendChild(lbl);
    }

    var slider = document.getElementById('v2-slider');

    function onSliderChange() {
      state.voltage = parseFloat(slider.value);
      document.getElementById('v2-volt-val').textContent = formatNum(state.voltage, 1) + ' V';
      updateV2();
    }

    function onSave() {
      var vals = calcSeries();
      if (vals.U < 0.2) return;
      state.measurements.push({});
      var tbody = document.getElementById('v2-results-body');
      var row = document.createElement('tr');
      row.innerHTML =
        '<td>' + state.measurements.length + '</td>' +
        '<td>' + formatNum(vals.U, 1) + ' V</td>' +
        '<td>' + formatNum(vals.U1, 1) + ' V</td>' +
        '<td>' + formatNum(vals.U2, 1) + ' V</td>' +
        '<td><strong>' + formatNum(vals.Iges * 1000, 0) + ' mA</strong></td>' +
        '<td>' + formatNum(vals.I1 * 1000, 0) + ' mA</td>' +
        '<td>' + formatNum(vals.I2 * 1000, 0) + ' mA</td>';
      tbody.appendChild(row);

      if (state.measurements.length >= 2) {
        document.getElementById('v2-conclusion').classList.remove('hidden');
      }
    }

    slider.addEventListener('input', onSliderChange);
    document.getElementById('v2-save-btn').addEventListener('click', onSave);

    cleanupFns.push(function () {
      slider.removeEventListener('input', onSliderChange);
    });

    requestAnimationFrame(function () { updateV2(); });
  }

  // ==================== START ====================

  window.addEventListener('DOMContentLoaded', init);
})();
