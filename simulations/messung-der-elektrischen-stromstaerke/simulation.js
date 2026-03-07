(function () {
  'use strict';

  // ==================== DATA ====================

  var EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'V1: Elektromagnet',
      title: 'V1: Magnet an Feder über einem Elektromagneten',
      instruction: 'Stelle die Spannung des Netzgeräts ein und beobachte die Stromstärke und die Auslenkung des an der Feder hängenden Magneten. Speichere Messwerte bei verschiedenen Spannungen.',
      type: 'electromagnet',
      conclusion: 'Mit steigender Spannung steigt die Stromstärke. Dadurch wird der Elektromagnet stärker und der Magnet wird weiter nach unten gezogen – die Feder dehnt sich stärker.'
    },
    b: {
      id: 'b',
      tab: 'V2: Lampe im Stromkreis',
      title: 'V2: Stromstärke bei unterschiedlicher Lampenhelligkeit',
      instruction: 'Verändere die Helligkeit der Lampe und miss die Stromstärke an verschiedenen Stellen im gleichen Stromkreis. Vergleiche die Werte an den Messstellen A, B und C.',
      type: 'lamp-circuit',
      conclusion: 'Bei gleicher Lampenhelligkeit ist die Stromstärke an allen Messstellen eines unverzweigten Stromkreises gleich groß. Wird die Lampe heller, nimmt die Stromstärke im gesamten Stromkreis zu.'
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
      case 'electromagnet': renderV1(panel); break;
      case 'lamp-circuit': renderV2(panel); break;
    }
  }

  // ==================== V1: ELECTROMAGNET ====================

  function renderV1(panel) {
    state.voltage = 2;
    state.resistance = 18;
    state.measurements = [];

    // Visualization card with spring setup and circuit side by side
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 'v1-viz';
    viz.style.height = '320px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Controls
    var controlCard = document.createElement('div');
    controlCard.className = 'card';

    var sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    sliderContainer.innerHTML =
      '<div class="control-label">Spannung des Netzgeräts:</div>' +
      '<div class="slider-row">' +
      '<input type="range" class="slider-input" id="v1-slider" min="1" max="12" step="0.5" value="2">' +
      '<span class="slider-value" id="v1-voltage-val">2,0 V</span>' +
      '</div>';
    controlCard.appendChild(sliderContainer);
    panel.appendChild(controlCard);

    // Current display
    var currentCard = document.createElement('div');
    currentCard.className = 'current-display';
    currentCard.innerHTML =
      '<span>Amperemeter:</span>' +
      '<span id="v1-current-val">111</span>' +
      '<span class="unit">mA</span>' +
      '<span class="badge-stretch" id="v1-stretch-val">Federdehnung: 8 mm</span>';
    panel.appendChild(currentCard);

    // Save button + results table
    var resultsCard = document.createElement('div');
    resultsCard.className = 'card';
    resultsCard.innerHTML =
      '<div class="control-label" style="margin-bottom:0.5rem;">Messprotokoll:</div>' +
      '<table class="results-table"><thead><tr>' +
      '<th>Nr.</th><th>Spannung</th><th>Stromstärke</th><th>Federdehnung</th>' +
      '</tr></thead><tbody id="v1-results-body"></tbody></table>';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-secondary mt-sm';
    saveBtn.textContent = 'Messwert speichern';
    saveBtn.id = 'v1-save-btn';
    resultsCard.appendChild(saveBtn);
    panel.appendChild(resultsCard);

    // Conclusion (hidden initially)
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v1-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    // Initial draw
    drawV1Setup(viz);
    updateV1();

    // Events
    var slider = document.getElementById('v1-slider');

    function onSliderInput() {
      state.voltage = parseFloat(slider.value);
      updateV1();
      drawV1Setup(viz);
    }

    function onSave() {
      var currentA = state.voltage / state.resistance;
      var currentmA = Math.round(currentA * 1000);
      var stretch = Math.min(36, Math.round(4 + currentA * 60));

      state.measurements.push({
        voltage: state.voltage,
        current: currentmA,
        stretch: stretch
      });

      var tbody = document.getElementById('v1-results-body');
      var row = document.createElement('tr');
      row.innerHTML =
        '<td>' + state.measurements.length + '</td>' +
        '<td>' + state.voltage.toFixed(1).replace('.', ',') + ' V</td>' +
        '<td><strong>' + currentmA + ' mA</strong></td>' +
        '<td>' + stretch + ' mm</td>';
      tbody.appendChild(row);

      if (state.measurements.length >= 3) {
        document.getElementById('v1-conclusion').classList.remove('hidden');
      }
    }

    slider.addEventListener('input', onSliderInput);
    saveBtn.addEventListener('click', onSave);

    cleanupFns.push(function () {
      slider.removeEventListener('input', onSliderInput);
      saveBtn.removeEventListener('click', onSave);
    });
  }

  function updateV1() {
    var currentA = state.voltage / state.resistance;
    var currentmA = Math.round(currentA * 1000);
    var stretch = Math.min(36, Math.round(4 + currentA * 60));

    document.getElementById('v1-voltage-val').textContent = state.voltage.toFixed(1).replace('.', ',') + ' V';
    document.getElementById('v1-current-val').textContent = String(currentmA);
    document.getElementById('v1-stretch-val').textContent = 'Federdehnung: ' + stretch + ' mm';
  }

  function drawV1Setup(container) {
    container.innerHTML = '';
    var w = container.offsetWidth || 400;
    var h = container.offsetHeight || 320;

    var currentA = state.voltage / state.resistance;
    var stretch = Math.min(36, Math.round(4 + currentA * 60));
    var currentmA = Math.round(currentA * 1000);

    // SVG for background elements
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none; z-index:1;';

    // --- Left side: Spring setup ---
    var springCenterX = w * 0.3;

    // Support bar at top
    var supportBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    supportBar.setAttribute('x', springCenterX - 40);
    supportBar.setAttribute('y', 8);
    supportBar.setAttribute('width', 80);
    supportBar.setAttribute('height', 6);
    supportBar.setAttribute('rx', 2);
    supportBar.setAttribute('fill', '#475569');
    svg.appendChild(supportBar);

    // Spring (zigzag pattern)
    var springTop = 14;
    var springBottom = springTop + 50 + stretch * 1.8;
    var coils = 8;
    var coilH = (springBottom - springTop) / coils;
    var springPath = 'M ' + springCenterX + ' ' + springTop;
    for (var i = 0; i < coils; i++) {
      var y1 = springTop + i * coilH + coilH * 0.25;
      var y2 = springTop + i * coilH + coilH * 0.75;
      var y3 = springTop + (i + 1) * coilH;
      springPath += ' L ' + (springCenterX - 12) + ' ' + y1;
      springPath += ' L ' + (springCenterX + 12) + ' ' + y2;
      springPath += ' L ' + springCenterX + ' ' + y3;
    }
    var springEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    springEl.setAttribute('d', springPath);
    springEl.setAttribute('fill', 'none');
    springEl.setAttribute('stroke', '#64748b');
    springEl.setAttribute('stroke-width', '2.5');
    springEl.setAttribute('stroke-linecap', 'round');
    springEl.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(springEl);

    // Magnet (red/blue bar)
    var magnetTop = springBottom;
    var magnetH = 24;
    var magnetW = 44;

    // Red half
    var magnetRed = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    magnetRed.setAttribute('x', springCenterX - magnetW / 2);
    magnetRed.setAttribute('y', magnetTop);
    magnetRed.setAttribute('width', magnetW / 2);
    magnetRed.setAttribute('height', magnetH);
    magnetRed.setAttribute('rx', 4);
    magnetRed.setAttribute('fill', '#ef4444');
    magnetRed.setAttribute('stroke', '#475569');
    magnetRed.setAttribute('stroke-width', '1');
    svg.appendChild(magnetRed);

    // Blue half
    var magnetBlue = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    magnetBlue.setAttribute('x', springCenterX);
    magnetBlue.setAttribute('y', magnetTop);
    magnetBlue.setAttribute('width', magnetW / 2);
    magnetBlue.setAttribute('height', magnetH);
    magnetBlue.setAttribute('rx', 4);
    magnetBlue.setAttribute('fill', '#3b82f6');
    magnetBlue.setAttribute('stroke', '#475569');
    magnetBlue.setAttribute('stroke-width', '1');
    svg.appendChild(magnetBlue);

    // N/S labels on magnet
    var nLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    nLabel.setAttribute('x', springCenterX - magnetW / 4);
    nLabel.setAttribute('y', magnetTop + magnetH / 2 + 4);
    nLabel.setAttribute('text-anchor', 'middle');
    nLabel.setAttribute('font-size', '10');
    nLabel.setAttribute('font-weight', '700');
    nLabel.setAttribute('fill', '#fff');
    nLabel.textContent = 'N';
    svg.appendChild(nLabel);

    var sLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sLabel.setAttribute('x', springCenterX + magnetW / 4);
    sLabel.setAttribute('y', magnetTop + magnetH / 2 + 4);
    sLabel.setAttribute('text-anchor', 'middle');
    sLabel.setAttribute('font-size', '10');
    sLabel.setAttribute('font-weight', '700');
    sLabel.setAttribute('fill', '#fff');
    sLabel.textContent = 'S';
    svg.appendChild(sLabel);

    // Electromagnet coil at bottom
    var coilCenterY = h - 48;
    var coilRX = 34;
    var coilRY = 22;
    var coilEl = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    coilEl.setAttribute('cx', springCenterX);
    coilEl.setAttribute('cy', coilCenterY);
    coilEl.setAttribute('rx', coilRX);
    coilEl.setAttribute('ry', coilRY);
    coilEl.setAttribute('fill', 'none');
    coilEl.setAttribute('stroke', '#f97316');
    coilEl.setAttribute('stroke-width', '4');
    svg.appendChild(coilEl);

    // Inner coil ring
    var coilInner = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    coilInner.setAttribute('cx', springCenterX);
    coilInner.setAttribute('cy', coilCenterY);
    coilInner.setAttribute('rx', coilRX - 6);
    coilInner.setAttribute('ry', coilRY - 4);
    coilInner.setAttribute('fill', 'none');
    coilInner.setAttribute('stroke', '#fb923c');
    coilInner.setAttribute('stroke-width', '3');
    svg.appendChild(coilInner);

    // Coil label
    var coilLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    coilLabel.setAttribute('x', springCenterX);
    coilLabel.setAttribute('y', coilCenterY + 4);
    coilLabel.setAttribute('text-anchor', 'middle');
    coilLabel.setAttribute('font-size', '10');
    coilLabel.setAttribute('font-weight', '600');
    coilLabel.setAttribute('fill', '#9a3412');
    coilLabel.textContent = 'Spule';
    svg.appendChild(coilLabel);

    // Scale on the left
    var scaleX = w * 0.08;
    var scaleTop = 20;
    var scaleBottom = h - 20;
    var scaleH = scaleBottom - scaleTop;

    // Scale background
    var scaleBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    scaleBg.setAttribute('x', scaleX - 18);
    scaleBg.setAttribute('y', scaleTop);
    scaleBg.setAttribute('width', 36);
    scaleBg.setAttribute('height', scaleH);
    scaleBg.setAttribute('rx', 6);
    scaleBg.setAttribute('fill', '#fff');
    scaleBg.setAttribute('stroke', '#cbd5e1');
    scaleBg.setAttribute('stroke-width', '1');
    svg.appendChild(scaleBg);

    // Scale markings
    var scaleSteps = [0, 10, 20, 30, 40];
    scaleSteps.forEach(function (mm) {
      var yPos = scaleTop + 10 + (mm / 40) * (scaleH - 20);
      var tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', scaleX - 8);
      tick.setAttribute('y1', yPos);
      tick.setAttribute('x2', scaleX + 8);
      tick.setAttribute('y2', yPos);
      tick.setAttribute('stroke', '#94a3b8');
      tick.setAttribute('stroke-width', '1');
      svg.appendChild(tick);

      var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', scaleX);
      label.setAttribute('y', yPos - 4);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '8');
      label.setAttribute('fill', '#64748b');
      label.textContent = mm + '';
      svg.appendChild(label);
    });

    // Scale unit
    var scaleUnit = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    scaleUnit.setAttribute('x', scaleX);
    scaleUnit.setAttribute('y', scaleTop + scaleH + 14);
    scaleUnit.setAttribute('text-anchor', 'middle');
    scaleUnit.setAttribute('font-size', '8');
    scaleUnit.setAttribute('font-weight', '600');
    scaleUnit.setAttribute('fill', '#64748b');
    scaleUnit.textContent = 'mm';
    svg.appendChild(scaleUnit);

    // --- Right side: Circuit diagram ---
    var circuitCX = w * 0.72;
    var battX = circuitCX;
    var battY = 30;
    var rightX = w * 0.92;
    var leftX = w * 0.52;
    var botY = h - 30;
    var ammY = h * 0.45;

    // Power supply
    var battBody = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    battBody.setAttribute('x', battX - 28);
    battBody.setAttribute('y', battY - 10);
    battBody.setAttribute('width', 56);
    battBody.setAttribute('height', 20);
    battBody.setAttribute('rx', 3);
    battBody.setAttribute('fill', 'url(#battGrad)');
    battBody.setAttribute('stroke', '#1d4ed8');
    battBody.setAttribute('stroke-width', '1');
    svg.appendChild(battBody);

    // Battery gradient
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'battGrad');
    grad.setAttribute('x1', '0');
    grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0');
    grad.setAttribute('y2', '1');
    var stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#3b82f6');
    var stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#1d4ed8');
    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    // Battery label
    var battLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    battLabel.setAttribute('x', battX);
    battLabel.setAttribute('y', battY + 4);
    battLabel.setAttribute('text-anchor', 'middle');
    battLabel.setAttribute('font-size', '9');
    battLabel.setAttribute('font-weight', '700');
    battLabel.setAttribute('fill', '#fff');
    battLabel.textContent = state.voltage.toFixed(1) + ' V';
    svg.appendChild(battLabel);

    // Circuit wires
    var wireColor = '#dc2626';
    var pathD =
      'M ' + (battX + 28) + ' ' + battY +
      ' L ' + rightX + ' ' + battY +
      ' L ' + rightX + ' ' + botY +
      ' L ' + (springCenterX + coilRX + 4) + ' ' + botY +
      ' M ' + (springCenterX - coilRX - 4) + ' ' + botY +
      ' L ' + leftX + ' ' + botY +
      ' L ' + leftX + ' ' + battY +
      ' L ' + (battX - 28) + ' ' + battY;

    var wirePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    wirePath.setAttribute('d', pathD);
    wirePath.setAttribute('fill', 'none');
    wirePath.setAttribute('stroke', wireColor);
    wirePath.setAttribute('stroke-width', '2.5');
    wirePath.setAttribute('stroke-linecap', 'round');
    wirePath.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(wirePath);

    // Ammeter on right side
    var ammCX = rightX;
    var ammCY = ammY;

    var ammBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ammBg.setAttribute('cx', ammCX);
    ammBg.setAttribute('cy', ammCY);
    ammBg.setAttribute('r', '20');
    ammBg.setAttribute('fill', '#fef3c7');
    ammBg.setAttribute('stroke', '#d97706');
    ammBg.setAttribute('stroke-width', '2');
    svg.appendChild(ammBg);

    var ammText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ammText.setAttribute('x', ammCX);
    ammText.setAttribute('y', ammCY + 1);
    ammText.setAttribute('text-anchor', 'middle');
    ammText.setAttribute('dominant-baseline', 'middle');
    ammText.setAttribute('font-size', '14');
    ammText.setAttribute('font-weight', '700');
    ammText.setAttribute('fill', '#92400e');
    ammText.textContent = 'A';
    svg.appendChild(ammText);

    var ammVal = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ammVal.setAttribute('x', ammCX);
    ammVal.setAttribute('y', ammCY + 30);
    ammVal.setAttribute('text-anchor', 'middle');
    ammVal.setAttribute('font-size', '9');
    ammVal.setAttribute('font-weight', '600');
    ammVal.setAttribute('fill', '#5a5a7a');
    ammVal.textContent = currentmA + ' mA';
    svg.appendChild(ammVal);

    // Coil connection to circuit (bottom wires into coil)
    var coilWireL = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    coilWireL.setAttribute('x1', springCenterX - coilRX - 4);
    coilWireL.setAttribute('y1', botY);
    coilWireL.setAttribute('x2', springCenterX - coilRX - 4);
    coilWireL.setAttribute('y2', coilCenterY);
    coilWireL.setAttribute('stroke', wireColor);
    coilWireL.setAttribute('stroke-width', '2.5');
    svg.appendChild(coilWireL);

    var coilWireR = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    coilWireR.setAttribute('x1', springCenterX + coilRX + 4);
    coilWireR.setAttribute('y1', botY);
    coilWireR.setAttribute('x2', springCenterX + coilRX + 4);
    coilWireR.setAttribute('y2', coilCenterY);
    coilWireR.setAttribute('stroke', wireColor);
    coilWireR.setAttribute('stroke-width', '2.5');
    svg.appendChild(coilWireR);

    // Current flow animation
    var flowPath =
      'M ' + (battX + 28) + ' ' + battY +
      ' L ' + rightX + ' ' + battY +
      ' L ' + rightX + ' ' + botY +
      ' L ' + (springCenterX + coilRX + 4) + ' ' + botY +
      ' L ' + (springCenterX + coilRX + 4) + ' ' + coilCenterY +
      ' L ' + (springCenterX - coilRX - 4) + ' ' + coilCenterY +
      ' L ' + (springCenterX - coilRX - 4) + ' ' + botY +
      ' L ' + leftX + ' ' + botY +
      ' L ' + leftX + ' ' + battY +
      ' L ' + (battX - 28) + ' ' + battY;

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

    // + and - labels near battery
    var plusLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    plusLabel.setAttribute('x', battX + 35);
    plusLabel.setAttribute('y', battY + 16);
    plusLabel.setAttribute('font-size', '10');
    plusLabel.setAttribute('font-weight', '700');
    plusLabel.setAttribute('fill', '#dc2626');
    plusLabel.textContent = '+';
    svg.appendChild(plusLabel);

    var minusLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    minusLabel.setAttribute('x', battX - 38);
    minusLabel.setAttribute('y', battY + 16);
    minusLabel.setAttribute('font-size', '10');
    minusLabel.setAttribute('font-weight', '700');
    minusLabel.setAttribute('fill', '#2563eb');
    minusLabel.textContent = '–';
    svg.appendChild(minusLabel);

    container.appendChild(svg);
  }

  // ==================== V2: LAMP CIRCUIT ====================

  function renderV2(panel) {
    state.brightness = 40;
    state.position = 'A';
    state.measurements = [];
    state.testedPositions = {};

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 'v2-circuit';
    viz.style.height = '340px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Brightness control
    var controlCard = document.createElement('div');
    controlCard.className = 'card';

    var sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    sliderContainer.innerHTML =
      '<div class="control-label">Lampenhelligkeit:</div>' +
      '<div class="slider-row">' +
      '<input type="range" class="slider-input" id="v2-bright-slider" min="10" max="100" step="5" value="40">' +
      '<span class="slider-value" id="v2-bright-val">40 %</span>' +
      '</div>';
    controlCard.appendChild(sliderContainer);

    // Position buttons
    var posLabel = document.createElement('div');
    posLabel.className = 'control-label mt-sm';
    posLabel.textContent = 'Messstelle wählen:';
    controlCard.appendChild(posLabel);

    var posGrid = document.createElement('div');
    posGrid.className = 'position-grid mt-sm';
    posGrid.innerHTML =
      '<button class="option-btn active" data-set-pos="A">Messstelle A</button>' +
      '<button class="option-btn" data-set-pos="B">Messstelle B</button>' +
      '<button class="option-btn" data-set-pos="C">Messstelle C</button>';
    controlCard.appendChild(posGrid);
    panel.appendChild(controlCard);

    // Current display
    var currentCard = document.createElement('div');
    currentCard.className = 'current-display';
    currentCard.id = 'v2-current-display';
    currentCard.innerHTML =
      '<span>Amperemeter an Stelle <strong id="v2-pos-label">A</strong>:</span>' +
      '<span id="v2-current-val">118</span>' +
      '<span class="unit">mA</span>';
    panel.appendChild(currentCard);

    // Save + Results
    var resultsCard = document.createElement('div');
    resultsCard.className = 'card';
    resultsCard.innerHTML =
      '<div class="control-label" style="margin-bottom:0.5rem;">Messprotokoll:</div>' +
      '<table class="results-table"><thead><tr>' +
      '<th>Nr.</th><th>Helligkeit</th><th>Messstelle</th><th>Stromstärke</th>' +
      '</tr></thead><tbody id="v2-results-body"></tbody></table>';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-secondary mt-sm';
    saveBtn.textContent = 'Messwert speichern';
    saveBtn.id = 'v2-save-btn';
    resultsCard.appendChild(saveBtn);
    panel.appendChild(resultsCard);

    // Conclusion (hidden initially)
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v2-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    // Initial draw
    drawV2Circuit(viz);
    updateV2();

    // Events
    var brightSlider = document.getElementById('v2-bright-slider');

    function onBrightChange() {
      state.brightness = parseInt(brightSlider.value, 10);
      updateV2();
      drawV2Circuit(viz);
    }

    function onPosClick(e) {
      var btn = e.target.closest('[data-set-pos]');
      if (!btn) return;
      state.position = btn.getAttribute('data-set-pos');
      document.querySelectorAll('.position-grid .option-btn').forEach(function (el) {
        el.classList.toggle('active', el.getAttribute('data-set-pos') === state.position);
      });
      updateV2();
      drawV2Circuit(viz);
    }

    function onSave() {
      var current = currentFromBrightness(state.brightness);

      state.measurements.push({
        brightness: state.brightness,
        position: state.position,
        current: current
      });

      // Track tested positions
      var key = state.brightness + '-' + state.position;
      state.testedPositions[key] = true;

      // Mark button as tested
      document.querySelectorAll('.position-grid .option-btn').forEach(function (el) {
        var posKey = state.brightness + '-' + el.getAttribute('data-set-pos');
        if (state.testedPositions[posKey]) {
          el.classList.add('tested');
        }
      });

      var tbody = document.getElementById('v2-results-body');
      var row = document.createElement('tr');
      row.innerHTML =
        '<td>' + state.measurements.length + '</td>' +
        '<td>' + state.brightness + ' %</td>' +
        '<td>' + state.position + '</td>' +
        '<td><strong>' + current + ' mA</strong></td>';
      tbody.appendChild(row);

      if (state.measurements.length >= 3) {
        document.getElementById('v2-conclusion').classList.remove('hidden');
      }
    }

    brightSlider.addEventListener('input', onBrightChange);
    posGrid.addEventListener('click', onPosClick);
    saveBtn.addEventListener('click', onSave);

    cleanupFns.push(function () {
      brightSlider.removeEventListener('input', onBrightChange);
      posGrid.removeEventListener('click', onPosClick);
      saveBtn.removeEventListener('click', onSave);
    });
  }

  function currentFromBrightness(brightness) {
    return Math.round(30 + brightness * 2.2);
  }

  function updateV2() {
    var current = currentFromBrightness(state.brightness);
    document.getElementById('v2-bright-val').textContent = state.brightness + ' %';
    document.getElementById('v2-pos-label').textContent = state.position;
    document.getElementById('v2-current-val').textContent = String(current);
  }

  function drawV2Circuit(container) {
    container.innerHTML = '';
    var w = container.offsetWidth || 400;
    var h = container.offsetHeight || 340;

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none; z-index:1;';

    // Circuit layout
    var cx = w * 0.5;
    var leftX = w * 0.12;
    var rightX = w * 0.88;
    var topY = 40;
    var botY = h - 40;
    var midY = h * 0.5;

    // Battery at top center
    var battX = cx;
    var battY = topY;

    // Lamp at bottom center
    var lampX = cx;
    var lampY = botY - 20;

    // Measurement points
    var posA = { x: leftX, y: midY, label: 'A' };
    var posB = { x: rightX, y: midY, label: 'B' };
    var posC = { x: cx, y: botY, label: 'C' };

    // Battery gradient
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'v2BattGrad');
    grad.setAttribute('x1', '0');
    grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0');
    grad.setAttribute('y2', '1');
    var stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#3b82f6');
    var stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#1d4ed8');
    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    // Draw wires
    var wireColor = '#dc2626';
    var pathD =
      // Battery right -> down right side
      'M ' + (battX + 28) + ' ' + battY +
      ' L ' + rightX + ' ' + battY +
      ' L ' + rightX + ' ' + botY +
      // Bottom right to lamp
      ' L ' + (lampX + 20) + ' ' + botY +
      // Lamp to bottom left
      ' M ' + (lampX - 20) + ' ' + botY +
      ' L ' + leftX + ' ' + botY +
      // Left side up to battery
      ' L ' + leftX + ' ' + battY +
      ' L ' + (battX - 28) + ' ' + battY;

    var wirePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    wirePath.setAttribute('d', pathD);
    wirePath.setAttribute('fill', 'none');
    wirePath.setAttribute('stroke', wireColor);
    wirePath.setAttribute('stroke-width', '2.5');
    wirePath.setAttribute('stroke-linecap', 'round');
    wirePath.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(wirePath);

    // Current flow animation
    var flowPath =
      'M ' + (battX + 28) + ' ' + battY +
      ' L ' + rightX + ' ' + battY +
      ' L ' + rightX + ' ' + botY +
      ' L ' + (lampX + 20) + ' ' + botY +
      ' L ' + (lampX - 20) + ' ' + botY +
      ' L ' + leftX + ' ' + botY +
      ' L ' + leftX + ' ' + battY +
      ' L ' + (battX - 28) + ' ' + battY;

    var animCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    animCircle.setAttribute('r', '4');
    animCircle.setAttribute('fill', '#fde047');
    animCircle.setAttribute('stroke', '#f59e0b');
    animCircle.setAttribute('stroke-width', '1');
    var animMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
    var speed = Math.max(1.5, 4 - state.brightness / 40);
    animMotion.setAttribute('dur', speed + 's');
    animMotion.setAttribute('repeatCount', 'indefinite');
    animMotion.setAttribute('path', flowPath);
    animCircle.appendChild(animMotion);
    svg.appendChild(animCircle);

    // Battery
    var battBody = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    battBody.setAttribute('x', battX - 28);
    battBody.setAttribute('y', battY - 10);
    battBody.setAttribute('width', 56);
    battBody.setAttribute('height', 20);
    battBody.setAttribute('rx', 3);
    battBody.setAttribute('fill', 'url(#v2BattGrad)');
    battBody.setAttribute('stroke', '#1d4ed8');
    battBody.setAttribute('stroke-width', '1');
    svg.appendChild(battBody);

    var battLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    battLabel.setAttribute('x', battX);
    battLabel.setAttribute('y', battY + 4);
    battLabel.setAttribute('text-anchor', 'middle');
    battLabel.setAttribute('font-size', '9');
    battLabel.setAttribute('font-weight', '700');
    battLabel.setAttribute('fill', '#fff');
    battLabel.textContent = 'Batterie';
    svg.appendChild(battLabel);

    // + and - terminals
    var plusLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    plusLabel.setAttribute('x', battX + 35);
    plusLabel.setAttribute('y', battY + 16);
    plusLabel.setAttribute('font-size', '10');
    plusLabel.setAttribute('font-weight', '700');
    plusLabel.setAttribute('fill', '#dc2626');
    plusLabel.textContent = '+';
    svg.appendChild(plusLabel);

    var minusLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    minusLabel.setAttribute('x', battX - 38);
    minusLabel.setAttribute('y', battY + 16);
    minusLabel.setAttribute('font-size', '10');
    minusLabel.setAttribute('font-weight', '700');
    minusLabel.setAttribute('fill', '#2563eb');
    minusLabel.textContent = '–';
    svg.appendChild(minusLabel);

    // Lamp (lightbulb)
    var brightness = state.brightness;
    var glowAlpha = 0.15 + brightness / 120;
    var glowRadius = 8 + brightness / 3;

    // Lamp outer glow
    if (brightness > 20) {
      var lampGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      lampGlow.setAttribute('cx', lampX);
      lampGlow.setAttribute('cy', lampY);
      lampGlow.setAttribute('r', String(22 + brightness / 8));
      lampGlow.setAttribute('fill', 'rgba(253, 224, 71, ' + (glowAlpha * 0.3).toFixed(2) + ')');
      svg.appendChild(lampGlow);
    }

    // Lamp glass
    var lampGlass = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    lampGlass.setAttribute('cx', lampX);
    lampGlass.setAttribute('cy', lampY);
    lampGlass.setAttribute('r', '18');
    var lampFill = brightness > 30
      ? 'rgba(253, 224, 71, ' + glowAlpha.toFixed(2) + ')'
      : '#e5e7eb';
    lampGlass.setAttribute('fill', lampFill);
    lampGlass.setAttribute('stroke', brightness > 30 ? '#f59e0b' : '#9ca3af');
    lampGlass.setAttribute('stroke-width', '2.5');
    svg.appendChild(lampGlass);

    // Lamp filament
    var filament = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    filament.setAttribute('d',
      'M ' + (lampX - 6) + ' ' + (lampY + 6) +
      ' L ' + (lampX - 3) + ' ' + (lampY - 6) +
      ' L ' + lampX + ' ' + (lampY + 4) +
      ' L ' + (lampX + 3) + ' ' + (lampY - 6) +
      ' L ' + (lampX + 6) + ' ' + (lampY + 6));
    filament.setAttribute('fill', 'none');
    filament.setAttribute('stroke', brightness > 30 ? '#f97316' : '#9ca3af');
    filament.setAttribute('stroke-width', '1.5');
    filament.setAttribute('stroke-linecap', 'round');
    filament.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(filament);

    // Lamp label
    var lampLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lampLabel.setAttribute('x', lampX);
    lampLabel.setAttribute('y', lampY + 34);
    lampLabel.setAttribute('text-anchor', 'middle');
    lampLabel.setAttribute('font-size', '10');
    lampLabel.setAttribute('font-weight', '600');
    lampLabel.setAttribute('fill', '#5a5a7a');
    lampLabel.textContent = 'Lampe';
    svg.appendChild(lampLabel);

    // Measurement points A, B, C
    var points = [posA, posB, posC];
    var current = currentFromBrightness(state.brightness);
    points.forEach(function (p) {
      var isActive = p.label === state.position;
      var r = isActive ? 16 : 14;

      // Point background
      var pointBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pointBg.setAttribute('cx', p.x);
      pointBg.setAttribute('cy', p.y);
      pointBg.setAttribute('r', String(r));
      pointBg.setAttribute('fill', isActive ? '#dbeafe' : '#e2e8f0');
      pointBg.setAttribute('stroke', isActive ? '#3b82f6' : '#94a3b8');
      pointBg.setAttribute('stroke-width', isActive ? '3' : '2');
      svg.appendChild(pointBg);

      // Point label
      var pointLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      pointLabel.setAttribute('x', p.x);
      pointLabel.setAttribute('y', p.y + 1);
      pointLabel.setAttribute('text-anchor', 'middle');
      pointLabel.setAttribute('dominant-baseline', 'middle');
      pointLabel.setAttribute('font-size', '12');
      pointLabel.setAttribute('font-weight', '700');
      pointLabel.setAttribute('fill', isActive ? '#1d4ed8' : '#475569');
      pointLabel.textContent = p.label;
      svg.appendChild(pointLabel);

      // Show current value at active point
      if (isActive) {
        var valBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        var valText = current + ' mA';
        var valWidth = valText.length * 6.5 + 12;
        valBg.setAttribute('x', p.x - valWidth / 2);
        valBg.setAttribute('y', p.y - r - 22);
        valBg.setAttribute('width', valWidth);
        valBg.setAttribute('height', 18);
        valBg.setAttribute('rx', 4);
        valBg.setAttribute('fill', '#fef3c7');
        valBg.setAttribute('stroke', '#fde68a');
        valBg.setAttribute('stroke-width', '1');
        svg.appendChild(valBg);

        var valLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valLabel.setAttribute('x', p.x);
        valLabel.setAttribute('y', p.y - r - 10);
        valLabel.setAttribute('text-anchor', 'middle');
        valLabel.setAttribute('font-size', '10');
        valLabel.setAttribute('font-weight', '700');
        valLabel.setAttribute('fill', '#92400e');
        valLabel.textContent = valText;
        svg.appendChild(valLabel);
      }
    });

    // Ammeter indicator at active position
    var activePos = state.position === 'A' ? posA : (state.position === 'B' ? posB : posC);
    var ammOffX = activePos === posC ? 40 : 0;
    var ammOffY = activePos === posC ? -10 : 24;

    var ammBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ammBg.setAttribute('cx', activePos.x + ammOffX);
    ammBg.setAttribute('cy', activePos.y + ammOffY);
    ammBg.setAttribute('r', '12');
    ammBg.setAttribute('fill', '#fef3c7');
    ammBg.setAttribute('stroke', '#d97706');
    ammBg.setAttribute('stroke-width', '2');
    svg.appendChild(ammBg);

    var ammLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ammLabel.setAttribute('x', activePos.x + ammOffX);
    ammLabel.setAttribute('y', activePos.y + ammOffY + 1);
    ammLabel.setAttribute('text-anchor', 'middle');
    ammLabel.setAttribute('dominant-baseline', 'middle');
    ammLabel.setAttribute('font-size', '10');
    ammLabel.setAttribute('font-weight', '700');
    ammLabel.setAttribute('fill', '#92400e');
    ammLabel.textContent = 'A';
    svg.appendChild(ammLabel);

    container.appendChild(svg);
  }

  // ==================== START ====================

  window.addEventListener('DOMContentLoaded', init);
})();
