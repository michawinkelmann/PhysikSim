(function () {
  'use strict';

  // ==================== DATA ====================

  var RHO = {
    konstantan:  { label: 'Konstantan',   value: 0.49,  color: '#d97706', cssClass: 'konstantan' },
    eisen:       { label: 'Eisen',        value: 0.13,  color: '#6b7280', cssClass: 'eisen' },
    chromNickel: { label: 'Chrom-Nickel', value: 1.10,  color: '#7c3aed', cssClass: 'chrom-nickel' }
  };

  // Station I: Widerstand und Länge (Konstantandraht, A = 0.03 mm², ρ = 0.49)
  var S1_LENGTHS = [0.25, 0.50, 0.75, 1.00];
  var S1_AREA = 0.03; // mm²
  var S1_RHO = 0.49;  // Ω·mm²/m

  // Station II: Widerstand und Querschnitt (Konstantandraht, l = 1 m)
  var S2_DIAMETERS = [0.20, 0.25, 0.30, 0.35]; // mm
  var S2_AREAS = [0.03, 0.05, 0.07, 0.10];      // mm² (rounded from textbook)
  var S2_LENGTH = 1.0; // m

  // Station III: Widerstand und Material (A = 0.03 mm², l = 1 m)
  var S3_AREA = 0.03;
  var S3_LENGTH = 1.0;
  var S3_MATERIALS = ['chromNickel', 'eisen', 'konstantan'];

  var EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'Station I: Länge',
      title: 'Station I: Widerstand und Länge der Leitung',
      instruction: 'Baue den Versuch wie in der Abbildung auf und führe die Messungen durch (Konstantandraht mit A\u202f=\u202f0,03\u202fmm² und \u03C1\u202f=\u202f0,49\u202f\u03A9\u00B7mm²/m). Übertrage die Werte in ein l-R-Diagramm und prüfe, ob es sich um einen proportionalen Zusammenhang handelt.',
      type: 'length',
      conclusion: 'Der Widerstand R ist proportional zur Länge l der Leitung. Verdoppelt man die Länge, verdoppelt sich auch der Widerstand. Die Messwerte bestätigen die Formel R\u202f=\u202f\u03C1\u202f\u00B7\u202fl\u202f/\u202fA. Je länger die Leitung, desto größer ist der Widerstand.'
    },
    b: {
      id: 'b',
      tab: 'Station II: Querschnitt',
      title: 'Station II: Widerstand und Querschnitt der Leitung',
      instruction: 'Baue den Versuch wie in der Abbildung auf und führe die Messungen durch (verschiedene Konstantandrähte mit l\u202f=\u202f1\u202fm). Übertrage die Werte in ein A-R-Diagramm und prüfe, ob es sich um einen proportionalen Zusammenhang handelt.',
      type: 'area',
      conclusion: 'Der Widerstand R ist umgekehrt proportional zum Querschnitt A. Verdoppelt man den Querschnitt, halbiert sich der Widerstand. Die Messwerte bestätigen die Formel R\u202f=\u202f\u03C1\u202f\u00B7\u202fl\u202f/\u202fA. Je dicker die Leitung, desto kleiner ist der Widerstand.'
    },
    c: {
      id: 'c',
      tab: 'Station III: Material',
      title: 'Station III: Widerstand und Material der Leitung',
      instruction: 'Baue den Versuch wie in der Abbildung auf und führe die Messungen durch (Leitungen aus verschiedenen Materialien mit A\u202f=\u202f0,03\u202fmm² und l\u202f=\u202f1\u202fm). Vergleiche den spezifischen Widerstand der drei Materialien und bestätige die Formel \u03C1\u202f=\u202fA\u202f\u00B7\u202fR\u202f/\u202fl.',
      type: 'material',
      conclusion: 'Der Widerstand hängt vom Material der Leitung ab. Jedes Material hat einen eigenen spezifischen Widerstand \u03C1. Chrom-Nickel hat den größten spezifischen Widerstand (\u03C1\u202f=\u202f1,10\u202f\u03A9\u00B7mm²/m), Konstantan liegt bei \u03C1\u202f=\u202f0,49\u202f\u03A9\u00B7mm²/m und Eisen hat den kleinsten (\u03C1\u202f=\u202f0,13\u202f\u03A9\u00B7mm²/m). Alle Messwerte bestätigen die Formel R\u202f=\u202f\u03C1\u202f\u00B7\u202fl\u202f/\u202fA.'
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
      case 'length':   renderStation1(panel); break;
      case 'area':     renderStation2(panel); break;
      case 'material': renderStation3(panel); break;
    }
  }

  // ==================== HELPERS ====================

  function fmt(val, decimals) {
    return val.toFixed(decimals).replace('.', ',');
  }

  function calcResistance(rho, length, area) {
    return rho * length / area;
  }

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
    box.innerHTML = '<strong>Erkenntnis:</strong>' + text;
    panel.appendChild(box);
  }

  // ==================== STATION I: LENGTH ====================

  function renderStation1(panel) {
    state.measuredIndex = -1;
    state.measurements = [];
    state.currentLength = S1_LENGTHS[0];

    // Formula reminder
    var formulaCard = document.createElement('div');
    formulaCard.className = 'card';
    formulaCard.innerHTML = '<div class="formula-box">R = \u03C1 \u00B7 l / A &nbsp;&nbsp;&nbsp; mit &nbsp; <span class="formula-highlight">\u03C1 = 0,49 \u03A9\u00B7mm\u00B2/m</span> &nbsp; und &nbsp; <span class="formula-highlight">A = 0,03 mm\u00B2</span></div>';
    panel.appendChild(formulaCard);

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 's1-viz';
    viz.style.height = '260px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    setTimeout(function () { drawS1Circuit(viz); }, 0);

    // Display boxes
    var displayCard = document.createElement('div');
    displayCard.className = 'card';
    displayCard.innerHTML =
      '<div class="voltage-row">' +
        '<div class="voltage-box length-box">' +
          '<div class="voltage-label">Länge l</div>' +
          '<div class="voltage-value" id="s1-length-val">\u2013</div>' +
        '</div>' +
        '<div class="voltage-box resistance">' +
          '<div class="voltage-label">Widerstand R</div>' +
          '<div class="voltage-value" id="s1-r-val">\u2013</div>' +
        '</div>' +
      '</div>';
    panel.appendChild(displayCard);

    // Controls
    var controlCard = document.createElement('div');
    controlCard.className = 'card';

    var statusDiv = document.createElement('div');
    statusDiv.id = 's1-status';
    statusDiv.innerHTML = '<span class="status-badge info">Wähle eine Drahtlänge und miss den Widerstand</span>';
    controlCard.appendChild(statusDiv);

    // Length slider
    var sliderDiv = document.createElement('div');
    sliderDiv.className = 'slider-container mt-sm';
    sliderDiv.innerHTML =
      '<div class="slider-row">' +
        '<span class="control-label">Länge l:</span>' +
        '<input type="range" class="slider-input" id="s1-slider" min="0" max="3" step="1" value="0">' +
        '<span class="slider-value" id="s1-slider-val">0,25 m</span>' +
      '</div>';
    controlCard.appendChild(sliderDiv);

    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-sm';

    var btnMeasure = document.createElement('button');
    btnMeasure.className = 'btn btn-primary';
    btnMeasure.textContent = 'Messung durchführen';
    btnRow.appendChild(btnMeasure);

    var btnAutoAll = document.createElement('button');
    btnAutoAll.className = 'btn btn-secondary';
    btnAutoAll.textContent = 'Alle Messungen automatisch';
    btnRow.appendChild(btnAutoAll);

    var btnReset = document.createElement('button');
    btnReset.className = 'btn btn-secondary';
    btnReset.textContent = 'Zurücksetzen';
    btnRow.appendChild(btnReset);

    controlCard.appendChild(btnRow);
    panel.appendChild(controlCard);

    // Results table
    var tableCard = document.createElement('div');
    tableCard.className = 'card';
    tableCard.id = 's1-table-card';
    tableCard.innerHTML = buildS1Table();
    panel.appendChild(tableCard);

    // Chart
    var chartCard = document.createElement('div');
    chartCard.className = 'card';
    var chartLabel = document.createElement('div');
    chartLabel.className = 'control-label';
    chartLabel.style.marginBottom = '0.5rem';
    chartLabel.textContent = 'l-R-Diagramm:';
    chartCard.appendChild(chartLabel);
    var chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.id = 's1-chart';
    chartCard.appendChild(chartContainer);
    var tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.id = 's1-tooltip';
    chartContainer.appendChild(tooltip);
    panel.appendChild(chartCard);

    setTimeout(function () { drawS1Chart(); }, 0);

    // Slider event
    var slider = document.getElementById('s1-slider');
    slider.addEventListener('input', function () {
      var idx = parseInt(slider.value);
      state.currentLength = S1_LENGTHS[idx];
      document.getElementById('s1-slider-val').textContent = fmt(S1_LENGTHS[idx], 2) + ' m';
      updateS1Viz();
    });

    // Measure button
    btnMeasure.addEventListener('click', function () {
      var l = state.currentLength;
      var alreadyMeasured = state.measurements.some(function (m) { return m.l === l; });
      if (alreadyMeasured) return;

      var R = calcResistance(S1_RHO, l, S1_AREA);
      // Add slight realistic noise
      var noise = (Math.random() - 0.5) * 0.2;
      R = Math.round((R + noise) * 10) / 10;
      state.measurements.push({ l: l, R: R });
      state.measurements.sort(function (a, b) { return a.l - b.l; });

      document.getElementById('s1-length-val').textContent = fmt(l, 2) + ' m';
      document.getElementById('s1-r-val').textContent = fmt(R, 1) + ' \u03A9';

      updateS1Table();
      drawS1Chart();
      updateS1OhmDisplay(R);
      checkS1Complete(panel);
    });

    // Auto all
    var autoInterval = null;
    btnAutoAll.addEventListener('click', function () {
      btnAutoAll.disabled = true;
      btnMeasure.disabled = true;
      var step = 0;
      autoInterval = setInterval(function () {
        if (step >= S1_LENGTHS.length) {
          clearInterval(autoInterval);
          btnMeasure.disabled = false;
          checkS1Complete(panel);
          return;
        }
        slider.value = step;
        state.currentLength = S1_LENGTHS[step];
        document.getElementById('s1-slider-val').textContent = fmt(S1_LENGTHS[step], 2) + ' m';
        updateS1Viz();

        var l = S1_LENGTHS[step];
        var alreadyMeasured = state.measurements.some(function (m) { return m.l === l; });
        if (!alreadyMeasured) {
          var R = calcResistance(S1_RHO, l, S1_AREA);
          var noise = (Math.random() - 0.5) * 0.2;
          R = Math.round((R + noise) * 10) / 10;
          state.measurements.push({ l: l, R: R });
          state.measurements.sort(function (a, b) { return a.l - b.l; });
          document.getElementById('s1-length-val').textContent = fmt(l, 2) + ' m';
          document.getElementById('s1-r-val').textContent = fmt(R, 1) + ' \u03A9';
          updateS1OhmDisplay(R);
        }

        updateS1Table();
        drawS1Chart();
        step++;
      }, 600);
    });

    // Reset
    btnReset.addEventListener('click', function () {
      clearInterval(autoInterval);
      state.measurements = [];
      state.currentLength = S1_LENGTHS[0];
      slider.value = 0;
      document.getElementById('s1-slider-val').textContent = fmt(S1_LENGTHS[0], 2) + ' m';
      document.getElementById('s1-length-val').textContent = '\u2013';
      document.getElementById('s1-r-val').textContent = '\u2013';
      document.getElementById('s1-status').innerHTML = '<span class="status-badge info">Wähle eine Drahtlänge und miss den Widerstand</span>';
      btnAutoAll.disabled = false;
      btnMeasure.disabled = false;
      updateS1Viz();
      updateS1Table();
      drawS1Chart();
      updateS1OhmDisplay(null);
      var conclusions = panel.querySelectorAll('.conclusion');
      conclusions.forEach(function (c) { c.remove(); });
    });

    cleanupFns.push(function () { clearInterval(autoInterval); });
  }

  function updateS1Viz() {
    var wireEl = document.getElementById('s1-wire-body');
    var rulerEl = document.getElementById('s1-ruler');
    if (!wireEl || !rulerEl) return;
    var fraction = state.currentLength / 1.0; // max 1m
    var minW = 40;
    var maxW = 200;
    var w = minW + (maxW - minW) * fraction;
    wireEl.style.width = w + 'px';
    rulerEl.style.width = (w + 20) + 'px';
    rulerEl.textContent = fmt(state.currentLength, 2) + ' m';
  }

  function updateS1OhmDisplay(R) {
    var el = document.getElementById('s1-ohm-display');
    if (!el) return;
    el.textContent = R !== null ? fmt(R, 1) + ' \u03A9' : '\u2013 \u03A9';
  }

  function buildS1Table() {
    var html = '<table class="results-table">';
    html += '<thead><tr><th>l in m</th>';
    S1_LENGTHS.forEach(function (l) { html += '<th>' + fmt(l, 2) + '</th>'; });
    html += '</tr></thead><tbody><tr><td style="font-weight:600">R in \u03A9</td>';
    S1_LENGTHS.forEach(function (l) {
      var m = state.measurements.filter(function (x) { return x.l === l; })[0];
      if (m) {
        html += '<td style="color:#d97706;font-weight:600">' + fmt(m.R, 1) + '</td>';
      } else {
        html += '<td style="color:#ccc">\u2026</td>';
      }
    });
    html += '</tr></tbody></table>';
    return html;
  }

  function updateS1Table() {
    var card = document.getElementById('s1-table-card');
    if (card) card.innerHTML = buildS1Table();
  }

  function checkS1Complete(panel) {
    if (state.measurements.length >= S1_LENGTHS.length) {
      document.getElementById('s1-status').innerHTML = '<span class="status-badge success">Alle Messungen abgeschlossen</span>';
      if (!panel.querySelector('.conclusion')) {
        addConclusion(panel, currentExp.conclusion);
      }
    }
  }

  function drawS1Circuit(viz) {
    var w = viz.offsetWidth;
    var h = viz.offsetHeight;

    // Ohmmeter - top center
    var ohm = document.createElement('div');
    ohm.className = 'ohmmeter';
    ohm.style.left = (w * 0.5 - 30) + 'px';
    ohm.style.top = '15px';
    ohm.innerHTML =
      '<div class="ohmmeter-body">' +
        '<div class="ohmmeter-symbol">\u03A9</div>' +
        '<div class="ohmmeter-display" id="s1-ohm-display">\u2013 \u03A9</div>' +
      '</div>';
    viz.appendChild(ohm);

    // Wire (Konstantandraht) - center
    var wireComp = document.createElement('div');
    wireComp.className = 'wire-component';
    wireComp.style.left = (w * 0.3) + 'px';
    wireComp.style.top = (h * 0.45) + 'px';
    wireComp.innerHTML =
      '<div class="wire-resistor">' +
        '<span class="resistor-label">Konstantandraht</span>' +
        '<div class="resistor-body konstantan" id="s1-wire-body" style="width:40px">CuNi</div>' +
      '</div>';
    viz.appendChild(wireComp);

    // Ruler below wire
    var ruler = document.createElement('div');
    ruler.className = 'ruler';
    ruler.id = 's1-ruler';
    ruler.style.left = (w * 0.28) + 'px';
    ruler.style.top = (h * 0.65) + 'px';
    ruler.style.width = '60px';
    ruler.textContent = '0,25 m';
    viz.appendChild(ruler);

    // Clips
    var clipL = document.createElement('div');
    clipL.className = 'clip';
    clipL.style.left = (w * 0.22) + 'px';
    clipL.style.top = (h * 0.48) + 'px';
    clipL.innerHTML = '<div class="clip-body"></div>';
    viz.appendChild(clipL);

    var clipR = document.createElement('div');
    clipR.className = 'clip';
    clipR.style.left = (w * 0.72) + 'px';
    clipR.style.top = (h * 0.48) + 'px';
    clipR.innerHTML = '<div class="clip-body green"></div>';
    viz.appendChild(clipR);

    // SVG wires
    var svg = makeSVG(viz);

    // Wire from ohmmeter left to clip left
    drawWire(svg, [
      [w * 0.47, h * 0.08 + 42],
      [w * 0.25, h * 0.08 + 42],
      [w * 0.25, h * 0.48]
    ], '#dc2626');

    // Wire from ohmmeter right to clip right
    drawWire(svg, [
      [w * 0.53, h * 0.08 + 42],
      [w * 0.75, h * 0.08 + 42],
      [w * 0.75, h * 0.48]
    ], '#16a34a');

    // Labels
    var labelKrok = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelKrok.setAttribute('x', w * 0.15);
    labelKrok.setAttribute('y', h * 0.92);
    labelKrok.setAttribute('font-size', '10');
    labelKrok.setAttribute('fill', '#64748b');
    labelKrok.setAttribute('font-weight', '600');
    labelKrok.textContent = 'Krokodilklemmen';
    svg.appendChild(labelKrok);
  }

  function drawS1Chart() {
    var container = document.getElementById('s1-chart');
    if (!container) return;

    var tooltip = document.getElementById('s1-tooltip');
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

    var maxL = 1.1;
    var maxR = 20;

    function scaleX(l) { return margin.left + (l / maxL) * plotW; }
    function scaleY(r) { return margin.top + plotH - (r / maxR) * plotH; }

    // Grid
    for (var il = 0; il <= 4; il++) {
      var lv = il * 0.25;
      var gl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      gl.setAttribute('x1', scaleX(lv)); gl.setAttribute('y1', margin.top);
      gl.setAttribute('x2', scaleX(lv)); gl.setAttribute('y2', margin.top + plotH);
      gl.setAttribute('class', 'chart-grid-line');
      svg.appendChild(gl);
      var tl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tl.setAttribute('x', scaleX(lv)); tl.setAttribute('y', margin.top + plotH + 18);
      tl.setAttribute('text-anchor', 'middle'); tl.setAttribute('class', 'chart-tick-label');
      tl.textContent = fmt(lv, 2);
      svg.appendChild(tl);
    }

    for (var ir = 0; ir <= 4; ir++) {
      var rv = ir * 5;
      var glh = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      glh.setAttribute('x1', margin.left); glh.setAttribute('y1', scaleY(rv));
      glh.setAttribute('x2', margin.left + plotW); glh.setAttribute('y2', scaleY(rv));
      glh.setAttribute('class', 'chart-grid-line');
      svg.appendChild(glh);
      var tlh = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tlh.setAttribute('x', margin.left - 10); tlh.setAttribute('y', scaleY(rv) + 4);
      tlh.setAttribute('text-anchor', 'end'); tlh.setAttribute('class', 'chart-tick-label');
      tlh.textContent = rv;
      svg.appendChild(tlh);
    }

    // Axes
    drawAxisLines(svg, margin, plotW, plotH);

    // Axis labels
    addAxisLabel(svg, 'l in m', margin.left + plotW / 2, ch - 5, false);
    addAxisLabel(svg, 'R in \u03A9', 15, margin.top + plotH / 2, true);

    // Data points and line
    if (state.measurements.length > 0) {
      if (state.measurements.length >= 2) {
        var pathData = 'M';
        state.measurements.forEach(function (p, idx) {
          if (idx === 0) pathData += scaleX(p.l) + ',' + scaleY(p.R);
          else pathData += ' L' + scaleX(p.l) + ',' + scaleY(p.R);
        });
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'chart-line');
        path.setAttribute('stroke', '#d97706');
        svg.appendChild(path);
      }

      // Proportional reference line (dashed) from origin
      if (state.measurements.length >= 2) {
        var refLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        var refR = calcResistance(S1_RHO, 1.0, S1_AREA);
        refLine.setAttribute('x1', scaleX(0)); refLine.setAttribute('y1', scaleY(0));
        refLine.setAttribute('x2', scaleX(1.0)); refLine.setAttribute('y2', scaleY(refR));
        refLine.setAttribute('stroke', '#94a3b8');
        refLine.setAttribute('stroke-width', '1.5');
        refLine.setAttribute('stroke-dasharray', '6 4');
        svg.appendChild(refLine);
      }

      state.measurements.forEach(function (p) {
        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', scaleX(p.l)); dot.setAttribute('cy', scaleY(p.R));
        dot.setAttribute('r', '5'); dot.setAttribute('fill', '#d97706');
        dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', '2');
        dot.setAttribute('class', 'chart-dot');
        dot.addEventListener('mouseenter', function (e) {
          tooltip.textContent = 'l = ' + fmt(p.l, 2) + ' m, R = ' + fmt(p.R, 1) + ' \u03A9';
          tooltip.classList.add('visible');
          var rect = container.getBoundingClientRect();
          tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
          tooltip.style.top = (e.clientY - rect.top - 30) + 'px';
        });
        dot.addEventListener('mouseleave', function () { tooltip.classList.remove('visible'); });
        svg.appendChild(dot);
      });
    }
  }

  // ==================== STATION II: CROSS-SECTION ====================

  function renderStation2(panel) {
    state.measurements = [];
    state.currentAreaIdx = 0;

    // Formula reminder
    var formulaCard = document.createElement('div');
    formulaCard.className = 'card';
    formulaCard.innerHTML = '<div class="formula-box">R = \u03C1 \u00B7 l / A &nbsp;&nbsp;&nbsp; mit &nbsp; <span class="formula-highlight">\u03C1 = 0,49 \u03A9\u00B7mm\u00B2/m</span> &nbsp; und &nbsp; <span class="formula-highlight">l = 1 m</span></div>';
    panel.appendChild(formulaCard);

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 's2-viz';
    viz.style.height = '260px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    setTimeout(function () { drawS2Circuit(viz); }, 0);

    // Display boxes
    var displayCard = document.createElement('div');
    displayCard.className = 'card';
    displayCard.innerHTML =
      '<div class="voltage-row">' +
        '<div class="voltage-box area-box">' +
          '<div class="voltage-label">Durchmesser d</div>' +
          '<div class="voltage-value" id="s2-d-val">\u2013</div>' +
        '</div>' +
        '<div class="voltage-box area-box">' +
          '<div class="voltage-label">Querschnitt A</div>' +
          '<div class="voltage-value" id="s2-a-val">\u2013</div>' +
        '</div>' +
        '<div class="voltage-box resistance">' +
          '<div class="voltage-label">Widerstand R</div>' +
          '<div class="voltage-value" id="s2-r-val">\u2013</div>' +
        '</div>' +
      '</div>';
    panel.appendChild(displayCard);

    // Controls
    var controlCard = document.createElement('div');
    controlCard.className = 'card';

    var statusDiv = document.createElement('div');
    statusDiv.id = 's2-status';
    statusDiv.innerHTML = '<span class="status-badge info">Wähle einen Drahtdurchmesser und miss den Widerstand</span>';
    controlCard.appendChild(statusDiv);

    var sliderDiv = document.createElement('div');
    sliderDiv.className = 'slider-container mt-sm';
    sliderDiv.innerHTML =
      '<div class="slider-row">' +
        '<span class="control-label">Durchmesser d:</span>' +
        '<input type="range" class="slider-input" id="s2-slider" min="0" max="3" step="1" value="0">' +
        '<span class="slider-value" id="s2-slider-val">0,20 mm</span>' +
      '</div>';
    controlCard.appendChild(sliderDiv);

    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-sm';

    var btnMeasure = document.createElement('button');
    btnMeasure.className = 'btn btn-primary';
    btnMeasure.textContent = 'Messung durchführen';
    btnRow.appendChild(btnMeasure);

    var btnAutoAll = document.createElement('button');
    btnAutoAll.className = 'btn btn-secondary';
    btnAutoAll.textContent = 'Alle Messungen automatisch';
    btnRow.appendChild(btnAutoAll);

    var btnReset = document.createElement('button');
    btnReset.className = 'btn btn-secondary';
    btnReset.textContent = 'Zurücksetzen';
    btnRow.appendChild(btnReset);

    controlCard.appendChild(btnRow);
    panel.appendChild(controlCard);

    // Results table
    var tableCard = document.createElement('div');
    tableCard.className = 'card';
    tableCard.id = 's2-table-card';
    tableCard.innerHTML = buildS2Table();
    panel.appendChild(tableCard);

    // Chart
    var chartCard = document.createElement('div');
    chartCard.className = 'card';
    var chartLabel = document.createElement('div');
    chartLabel.className = 'control-label';
    chartLabel.style.marginBottom = '0.5rem';
    chartLabel.textContent = 'A-R-Diagramm:';
    chartCard.appendChild(chartLabel);
    var chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.id = 's2-chart';
    chartCard.appendChild(chartContainer);
    var tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.id = 's2-tooltip';
    chartContainer.appendChild(tooltip);
    panel.appendChild(chartCard);

    setTimeout(function () { drawS2Chart(); }, 0);

    // Slider event
    var slider = document.getElementById('s2-slider');
    slider.addEventListener('input', function () {
      var idx = parseInt(slider.value);
      state.currentAreaIdx = idx;
      document.getElementById('s2-slider-val').textContent = fmt(S2_DIAMETERS[idx], 2) + ' mm';
      updateS2Viz();
    });

    // Measure
    btnMeasure.addEventListener('click', function () {
      var idx = state.currentAreaIdx;
      var A = S2_AREAS[idx];
      var d = S2_DIAMETERS[idx];
      var alreadyMeasured = state.measurements.some(function (m) { return m.A === A; });
      if (alreadyMeasured) return;

      var R = calcResistance(S1_RHO, S2_LENGTH, A);
      var noise = (Math.random() - 0.5) * 0.3;
      R = Math.round((R + noise) * 10) / 10;
      state.measurements.push({ d: d, A: A, R: R });
      state.measurements.sort(function (a, b) { return a.A - b.A; });

      document.getElementById('s2-d-val').textContent = fmt(d, 2) + ' mm';
      document.getElementById('s2-a-val').textContent = fmt(A, 2) + ' mm\u00B2';
      document.getElementById('s2-r-val').textContent = fmt(R, 1) + ' \u03A9';

      updateS2Table();
      drawS2Chart();
      updateS2OhmDisplay(R);
      checkS2Complete(panel);
    });

    // Auto all
    var autoInterval = null;
    btnAutoAll.addEventListener('click', function () {
      btnAutoAll.disabled = true;
      btnMeasure.disabled = true;
      var step = 0;
      autoInterval = setInterval(function () {
        if (step >= S2_DIAMETERS.length) {
          clearInterval(autoInterval);
          btnMeasure.disabled = false;
          checkS2Complete(panel);
          return;
        }
        slider.value = step;
        state.currentAreaIdx = step;
        document.getElementById('s2-slider-val').textContent = fmt(S2_DIAMETERS[step], 2) + ' mm';
        updateS2Viz();

        var A = S2_AREAS[step];
        var d = S2_DIAMETERS[step];
        var alreadyMeasured = state.measurements.some(function (m) { return m.A === A; });
        if (!alreadyMeasured) {
          var R = calcResistance(S1_RHO, S2_LENGTH, A);
          var noise = (Math.random() - 0.5) * 0.3;
          R = Math.round((R + noise) * 10) / 10;
          state.measurements.push({ d: d, A: A, R: R });
          state.measurements.sort(function (a, b) { return a.A - b.A; });
          document.getElementById('s2-d-val').textContent = fmt(d, 2) + ' mm';
          document.getElementById('s2-a-val').textContent = fmt(A, 2) + ' mm\u00B2';
          document.getElementById('s2-r-val').textContent = fmt(R, 1) + ' \u03A9';
          updateS2OhmDisplay(R);
        }

        updateS2Table();
        drawS2Chart();
        step++;
      }, 600);
    });

    // Reset
    btnReset.addEventListener('click', function () {
      clearInterval(autoInterval);
      state.measurements = [];
      state.currentAreaIdx = 0;
      slider.value = 0;
      document.getElementById('s2-slider-val').textContent = fmt(S2_DIAMETERS[0], 2) + ' mm';
      document.getElementById('s2-d-val').textContent = '\u2013';
      document.getElementById('s2-a-val').textContent = '\u2013';
      document.getElementById('s2-r-val').textContent = '\u2013';
      document.getElementById('s2-status').innerHTML = '<span class="status-badge info">Wähle einen Drahtdurchmesser und miss den Widerstand</span>';
      btnAutoAll.disabled = false;
      btnMeasure.disabled = false;
      updateS2Viz();
      updateS2Table();
      drawS2Chart();
      updateS2OhmDisplay(null);
      var conclusions = panel.querySelectorAll('.conclusion');
      conclusions.forEach(function (c) { c.remove(); });
    });

    cleanupFns.push(function () { clearInterval(autoInterval); });
  }

  function updateS2Viz() {
    var wireEl = document.getElementById('s2-wire-body');
    if (!wireEl) return;
    var idx = state.currentAreaIdx;
    // Thicker wire = larger height
    var minH = 10;
    var maxH = 24;
    var h = minH + (maxH - minH) * (idx / 3);
    wireEl.style.height = Math.round(h) + 'px';
    wireEl.textContent = 'd=' + fmt(S2_DIAMETERS[idx], 2);
  }

  function updateS2OhmDisplay(R) {
    var el = document.getElementById('s2-ohm-display');
    if (!el) return;
    el.textContent = R !== null ? fmt(R, 1) + ' \u03A9' : '\u2013 \u03A9';
  }

  function buildS2Table() {
    var html = '<table class="results-table">';
    html += '<thead><tr><th>d in mm</th>';
    S2_DIAMETERS.forEach(function (d) { html += '<th>' + fmt(d, 2) + '</th>'; });
    html += '</tr></thead><tbody>';
    html += '<tr><td style="font-weight:600">A in mm\u00B2</td>';
    S2_AREAS.forEach(function (a) { html += '<td>' + fmt(a, 2) + '</td>'; });
    html += '</tr><tr><td style="font-weight:600">R in \u03A9</td>';
    S2_AREAS.forEach(function (a) {
      var m = state.measurements.filter(function (x) { return x.A === a; })[0];
      if (m) {
        html += '<td style="color:#2563eb;font-weight:600">' + fmt(m.R, 1) + '</td>';
      } else {
        html += '<td style="color:#ccc">\u2026</td>';
      }
    });
    html += '</tr></tbody></table>';
    return html;
  }

  function updateS2Table() {
    var card = document.getElementById('s2-table-card');
    if (card) card.innerHTML = buildS2Table();
  }

  function checkS2Complete(panel) {
    if (state.measurements.length >= S2_AREAS.length) {
      document.getElementById('s2-status').innerHTML = '<span class="status-badge success">Alle Messungen abgeschlossen</span>';
      if (!panel.querySelector('.conclusion')) {
        addConclusion(panel, currentExp.conclusion);
      }
    }
  }

  function drawS2Circuit(viz) {
    var w = viz.offsetWidth;
    var h = viz.offsetHeight;

    // Ohmmeter
    var ohm = document.createElement('div');
    ohm.className = 'ohmmeter';
    ohm.style.left = (w * 0.5 - 30) + 'px';
    ohm.style.top = '15px';
    ohm.innerHTML =
      '<div class="ohmmeter-body">' +
        '<div class="ohmmeter-symbol">\u03A9</div>' +
        '<div class="ohmmeter-display" id="s2-ohm-display">\u2013 \u03A9</div>' +
      '</div>';
    viz.appendChild(ohm);

    // Wire
    var wireComp = document.createElement('div');
    wireComp.className = 'wire-component';
    wireComp.style.left = (w * 0.3) + 'px';
    wireComp.style.top = (h * 0.45) + 'px';
    wireComp.innerHTML =
      '<div class="wire-resistor">' +
        '<span class="resistor-label">Konstantandraht (l = 1 m)</span>' +
        '<div class="resistor-body konstantan" id="s2-wire-body" style="width:120px;height:10px">d=0,20</div>' +
      '</div>';
    viz.appendChild(wireComp);

    // Clips
    var clipL = document.createElement('div');
    clipL.className = 'clip';
    clipL.style.left = (w * 0.22) + 'px';
    clipL.style.top = (h * 0.48) + 'px';
    clipL.innerHTML = '<div class="clip-body"></div>';
    viz.appendChild(clipL);

    var clipR = document.createElement('div');
    clipR.className = 'clip';
    clipR.style.left = (w * 0.72) + 'px';
    clipR.style.top = (h * 0.48) + 'px';
    clipR.innerHTML = '<div class="clip-body green"></div>';
    viz.appendChild(clipR);

    // SVG wires
    var svg = makeSVG(viz);
    drawWire(svg, [
      [w * 0.47, h * 0.08 + 42],
      [w * 0.25, h * 0.08 + 42],
      [w * 0.25, h * 0.48]
    ], '#dc2626');

    drawWire(svg, [
      [w * 0.53, h * 0.08 + 42],
      [w * 0.75, h * 0.08 + 42],
      [w * 0.75, h * 0.48]
    ], '#16a34a');
  }

  function drawS2Chart() {
    var container = document.getElementById('s2-chart');
    if (!container) return;

    var tooltip = document.getElementById('s2-tooltip');
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

    var maxA = 0.12;
    var maxR = 20;

    function scaleX(a) { return margin.left + (a / maxA) * plotW; }
    function scaleY(r) { return margin.top + plotH - (r / maxR) * plotH; }

    // Grid - A axis
    var aVals = [0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12];
    aVals.forEach(function (a) {
      var gl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      gl.setAttribute('x1', scaleX(a)); gl.setAttribute('y1', margin.top);
      gl.setAttribute('x2', scaleX(a)); gl.setAttribute('y2', margin.top + plotH);
      gl.setAttribute('class', 'chart-grid-line');
      svg.appendChild(gl);
      var tl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tl.setAttribute('x', scaleX(a)); tl.setAttribute('y', margin.top + plotH + 18);
      tl.setAttribute('text-anchor', 'middle'); tl.setAttribute('class', 'chart-tick-label');
      tl.textContent = fmt(a, 2);
      svg.appendChild(tl);
    });

    // Grid - R axis
    for (var ir = 0; ir <= 4; ir++) {
      var rv = ir * 5;
      var glh = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      glh.setAttribute('x1', margin.left); glh.setAttribute('y1', scaleY(rv));
      glh.setAttribute('x2', margin.left + plotW); glh.setAttribute('y2', scaleY(rv));
      glh.setAttribute('class', 'chart-grid-line');
      svg.appendChild(glh);
      var tlh = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tlh.setAttribute('x', margin.left - 10); tlh.setAttribute('y', scaleY(rv) + 4);
      tlh.setAttribute('text-anchor', 'end'); tlh.setAttribute('class', 'chart-tick-label');
      tlh.textContent = rv;
      svg.appendChild(tlh);
    }

    drawAxisLines(svg, margin, plotW, plotH);
    addAxisLabel(svg, 'A in mm\u00B2', margin.left + plotW / 2, ch - 5, false);
    addAxisLabel(svg, 'R in \u03A9', 15, margin.top + plotH / 2, true);

    // 1/A reference curve (dashed)
    if (state.measurements.length >= 2) {
      var refPoints = [];
      for (var a = 0.02; a <= 0.11; a += 0.005) {
        var refR = calcResistance(S1_RHO, S2_LENGTH, a);
        if (refR <= maxR) refPoints.push([scaleX(a), scaleY(refR)]);
      }
      if (refPoints.length >= 2) {
        var refPath = 'M' + refPoints[0][0] + ',' + refPoints[0][1];
        for (var rp = 1; rp < refPoints.length; rp++) {
          refPath += ' L' + refPoints[rp][0] + ',' + refPoints[rp][1];
        }
        var refEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        refEl.setAttribute('d', refPath);
        refEl.setAttribute('fill', 'none');
        refEl.setAttribute('stroke', '#94a3b8');
        refEl.setAttribute('stroke-width', '1.5');
        refEl.setAttribute('stroke-dasharray', '6 4');
        svg.appendChild(refEl);
      }
    }

    // Data points and line
    if (state.measurements.length > 0) {
      if (state.measurements.length >= 2) {
        var pathData = 'M';
        state.measurements.forEach(function (p, idx) {
          if (idx === 0) pathData += scaleX(p.A) + ',' + scaleY(p.R);
          else pathData += ' L' + scaleX(p.A) + ',' + scaleY(p.R);
        });
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'chart-line');
        path.setAttribute('stroke', '#2563eb');
        svg.appendChild(path);
      }

      state.measurements.forEach(function (p) {
        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', scaleX(p.A)); dot.setAttribute('cy', scaleY(p.R));
        dot.setAttribute('r', '5'); dot.setAttribute('fill', '#2563eb');
        dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', '2');
        dot.setAttribute('class', 'chart-dot');
        dot.addEventListener('mouseenter', function (e) {
          tooltip.textContent = 'A = ' + fmt(p.A, 2) + ' mm\u00B2, R = ' + fmt(p.R, 1) + ' \u03A9';
          tooltip.classList.add('visible');
          var rect = container.getBoundingClientRect();
          tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
          tooltip.style.top = (e.clientY - rect.top - 30) + 'px';
        });
        dot.addEventListener('mouseleave', function () { tooltip.classList.remove('visible'); });
        svg.appendChild(dot);
      });
    }
  }

  // ==================== STATION III: MATERIAL ====================

  function renderStation3(panel) {
    state.measurements = [];
    state.currentMaterialIdx = 0;

    // Formula reminder
    var formulaCard = document.createElement('div');
    formulaCard.className = 'card';
    formulaCard.innerHTML = '<div class="formula-box">R = \u03C1 \u00B7 l / A &nbsp;&nbsp;&nbsp; mit &nbsp; <span class="formula-highlight">A = 0,03 mm\u00B2</span> &nbsp; und &nbsp; <span class="formula-highlight">l = 1 m</span> &nbsp;&nbsp; | &nbsp;&nbsp; \u03C1 = A \u00B7 R / l</div>';
    panel.appendChild(formulaCard);

    // Circuit visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'circuit-viz';
    viz.id = 's3-viz';
    viz.style.height = '260px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    setTimeout(function () { drawS3Circuit(viz); }, 0);

    // Display boxes
    var displayCard = document.createElement('div');
    displayCard.className = 'card';
    displayCard.innerHTML =
      '<div class="voltage-row">' +
        '<div class="voltage-box material-box">' +
          '<div class="voltage-label">Material</div>' +
          '<div class="voltage-value" id="s3-mat-val">\u2013</div>' +
        '</div>' +
        '<div class="voltage-box resistance">' +
          '<div class="voltage-label">Widerstand R</div>' +
          '<div class="voltage-value" id="s3-r-val">\u2013</div>' +
        '</div>' +
        '<div class="voltage-box material-box">' +
          '<div class="voltage-label">Spez. Widerstand \u03C1</div>' +
          '<div class="voltage-value" id="s3-rho-val">\u2013</div>' +
        '</div>' +
      '</div>';
    panel.appendChild(displayCard);

    // Controls
    var controlCard = document.createElement('div');
    controlCard.className = 'card';

    var statusDiv = document.createElement('div');
    statusDiv.id = 's3-status';
    statusDiv.innerHTML = '<span class="status-badge info">Wähle ein Material und miss den Widerstand</span>';
    controlCard.appendChild(statusDiv);

    // Material buttons
    var matRow = document.createElement('div');
    matRow.className = 'btn-row mt-sm';
    S3_MATERIALS.forEach(function (key, idx) {
      var mat = RHO[key];
      var btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.id = 's3-mat-btn-' + idx;
      btn.textContent = mat.label;
      btn.style.borderBottom = '3px solid ' + mat.color;
      btn.addEventListener('click', function () {
        state.currentMaterialIdx = idx;
        // Highlight active
        S3_MATERIALS.forEach(function (k, i) {
          var b = document.getElementById('s3-mat-btn-' + i);
          b.style.background = i === idx ? '#e2e4e9' : '';
        });
        updateS3Viz();
      });
      matRow.appendChild(btn);
    });
    controlCard.appendChild(matRow);

    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-sm';

    var btnMeasure = document.createElement('button');
    btnMeasure.className = 'btn btn-primary';
    btnMeasure.textContent = 'Messung durchführen';
    btnRow.appendChild(btnMeasure);

    var btnAutoAll = document.createElement('button');
    btnAutoAll.className = 'btn btn-secondary';
    btnAutoAll.textContent = 'Alle Messungen automatisch';
    btnRow.appendChild(btnAutoAll);

    var btnReset = document.createElement('button');
    btnReset.className = 'btn btn-secondary';
    btnReset.textContent = 'Zurücksetzen';
    btnRow.appendChild(btnReset);

    controlCard.appendChild(btnRow);
    panel.appendChild(controlCard);

    // Results table
    var tableCard = document.createElement('div');
    tableCard.className = 'card';
    tableCard.id = 's3-table-card';
    tableCard.innerHTML = buildS3Table();
    panel.appendChild(tableCard);

    // Measure
    btnMeasure.addEventListener('click', function () {
      var matKey = S3_MATERIALS[state.currentMaterialIdx];
      var mat = RHO[matKey];
      var alreadyMeasured = state.measurements.some(function (m) { return m.key === matKey; });
      if (alreadyMeasured) return;

      var R = calcResistance(mat.value, S3_LENGTH, S3_AREA);
      var noise = (Math.random() - 0.5) * 0.4;
      R = Math.round((R + noise) * 10) / 10;
      var rhoCalc = S3_AREA * R / S3_LENGTH;
      rhoCalc = Math.round(rhoCalc * 100) / 100;

      state.measurements.push({ key: matKey, label: mat.label, R: R, rho: rhoCalc, color: mat.color });

      document.getElementById('s3-mat-val').textContent = mat.label;
      document.getElementById('s3-r-val').textContent = fmt(R, 1) + ' \u03A9';
      document.getElementById('s3-rho-val').textContent = fmt(rhoCalc, 2) + ' \u03A9\u00B7mm\u00B2/m';

      updateS3Table();
      updateS3OhmDisplay(R);
      checkS3Complete(panel);
    });

    // Auto all
    var autoInterval = null;
    btnAutoAll.addEventListener('click', function () {
      btnAutoAll.disabled = true;
      btnMeasure.disabled = true;
      var step = 0;
      autoInterval = setInterval(function () {
        if (step >= S3_MATERIALS.length) {
          clearInterval(autoInterval);
          btnMeasure.disabled = false;
          checkS3Complete(panel);
          return;
        }
        state.currentMaterialIdx = step;
        S3_MATERIALS.forEach(function (k, i) {
          var b = document.getElementById('s3-mat-btn-' + i);
          b.style.background = i === step ? '#e2e4e9' : '';
        });
        updateS3Viz();

        var matKey = S3_MATERIALS[step];
        var mat = RHO[matKey];
        var alreadyMeasured = state.measurements.some(function (m) { return m.key === matKey; });
        if (!alreadyMeasured) {
          var R = calcResistance(mat.value, S3_LENGTH, S3_AREA);
          var noise = (Math.random() - 0.5) * 0.4;
          R = Math.round((R + noise) * 10) / 10;
          var rhoCalc = S3_AREA * R / S3_LENGTH;
          rhoCalc = Math.round(rhoCalc * 100) / 100;
          state.measurements.push({ key: matKey, label: mat.label, R: R, rho: rhoCalc, color: mat.color });
          document.getElementById('s3-mat-val').textContent = mat.label;
          document.getElementById('s3-r-val').textContent = fmt(R, 1) + ' \u03A9';
          document.getElementById('s3-rho-val').textContent = fmt(rhoCalc, 2) + ' \u03A9\u00B7mm\u00B2/m';
          updateS3OhmDisplay(R);
        }

        updateS3Table();
        step++;
      }, 800);
    });

    // Reset
    btnReset.addEventListener('click', function () {
      clearInterval(autoInterval);
      state.measurements = [];
      state.currentMaterialIdx = 0;
      document.getElementById('s3-mat-val').textContent = '\u2013';
      document.getElementById('s3-r-val').textContent = '\u2013';
      document.getElementById('s3-rho-val').textContent = '\u2013';
      document.getElementById('s3-status').innerHTML = '<span class="status-badge info">Wähle ein Material und miss den Widerstand</span>';
      btnAutoAll.disabled = false;
      btnMeasure.disabled = false;
      S3_MATERIALS.forEach(function (k, i) {
        var b = document.getElementById('s3-mat-btn-' + i);
        b.style.background = '';
      });
      updateS3Viz();
      updateS3Table();
      updateS3OhmDisplay(null);
      var conclusions = panel.querySelectorAll('.conclusion');
      conclusions.forEach(function (c) { c.remove(); });
    });

    cleanupFns.push(function () { clearInterval(autoInterval); });
  }

  function updateS3Viz() {
    var wireEl = document.getElementById('s3-wire-body');
    var wireLabel = document.getElementById('s3-wire-label');
    if (!wireEl || !wireLabel) return;
    var matKey = S3_MATERIALS[state.currentMaterialIdx];
    var mat = RHO[matKey];
    wireEl.className = 'resistor-body ' + mat.cssClass;
    wireEl.textContent = mat.label;
    wireLabel.textContent = mat.label + ' (l = 1 m, A = 0,03 mm\u00B2)';
  }

  function updateS3OhmDisplay(R) {
    var el = document.getElementById('s3-ohm-display');
    if (!el) return;
    el.textContent = R !== null ? fmt(R, 1) + ' \u03A9' : '\u2013 \u03A9';
  }

  function buildS3Table() {
    var html = '<table class="results-table">';
    html += '<thead><tr><th>Material</th><th>Chrom-Nickel</th><th>Eisen</th><th>Konstantan</th></tr></thead>';
    html += '<tbody>';
    html += '<tr><td style="font-weight:600">R in \u03A9</td>';
    S3_MATERIALS.forEach(function (key) {
      var m = state.measurements.filter(function (x) { return x.key === key; })[0];
      if (m) {
        html += '<td style="color:' + m.color + ';font-weight:600">' + fmt(m.R, 1) + '</td>';
      } else {
        html += '<td style="color:#ccc">\u2026</td>';
      }
    });
    html += '</tr>';
    html += '<tr><td style="font-weight:600">\u03C1 in \u03A9\u00B7mm\u00B2/m</td>';
    S3_MATERIALS.forEach(function (key) {
      var m = state.measurements.filter(function (x) { return x.key === key; })[0];
      if (m) {
        html += '<td style="color:' + m.color + ';font-weight:600">' + fmt(m.rho, 2) + '</td>';
      } else {
        html += '<td style="color:#ccc">\u2026</td>';
      }
    });
    html += '</tr></tbody></table>';
    return html;
  }

  function updateS3Table() {
    var card = document.getElementById('s3-table-card');
    if (card) card.innerHTML = buildS3Table();
  }

  function checkS3Complete(panel) {
    if (state.measurements.length >= S3_MATERIALS.length) {
      document.getElementById('s3-status').innerHTML = '<span class="status-badge success">Alle Messungen abgeschlossen</span>';
      if (!panel.querySelector('.conclusion')) {
        addConclusion(panel, currentExp.conclusion);
      }
    }
  }

  function drawS3Circuit(viz) {
    var w = viz.offsetWidth;
    var h = viz.offsetHeight;

    // Ohmmeter
    var ohm = document.createElement('div');
    ohm.className = 'ohmmeter';
    ohm.style.left = (w * 0.5 - 30) + 'px';
    ohm.style.top = '15px';
    ohm.innerHTML =
      '<div class="ohmmeter-body">' +
        '<div class="ohmmeter-symbol">\u03A9</div>' +
        '<div class="ohmmeter-display" id="s3-ohm-display">\u2013 \u03A9</div>' +
      '</div>';
    viz.appendChild(ohm);

    // Wire
    var wireComp = document.createElement('div');
    wireComp.className = 'wire-component';
    wireComp.style.left = (w * 0.25) + 'px';
    wireComp.style.top = (h * 0.45) + 'px';
    wireComp.innerHTML =
      '<div class="wire-resistor">' +
        '<span class="resistor-label" id="s3-wire-label">Chrom-Nickel (l = 1 m, A = 0,03 mm\u00B2)</span>' +
        '<div class="resistor-body chrom-nickel" id="s3-wire-body" style="width:140px">Chrom-Nickel</div>' +
      '</div>';
    viz.appendChild(wireComp);

    // Clips
    var clipL = document.createElement('div');
    clipL.className = 'clip';
    clipL.style.left = (w * 0.18) + 'px';
    clipL.style.top = (h * 0.48) + 'px';
    clipL.innerHTML = '<div class="clip-body"></div>';
    viz.appendChild(clipL);

    var clipR = document.createElement('div');
    clipR.className = 'clip';
    clipR.style.left = (w * 0.76) + 'px';
    clipR.style.top = (h * 0.48) + 'px';
    clipR.innerHTML = '<div class="clip-body green"></div>';
    viz.appendChild(clipR);

    // SVG wires
    var svg = makeSVG(viz);
    drawWire(svg, [
      [w * 0.47, h * 0.08 + 42],
      [w * 0.21, h * 0.08 + 42],
      [w * 0.21, h * 0.48]
    ], '#dc2626');

    drawWire(svg, [
      [w * 0.53, h * 0.08 + 42],
      [w * 0.79, h * 0.08 + 42],
      [w * 0.79, h * 0.48]
    ], '#16a34a');
  }

  // ==================== SHARED CHART HELPERS ====================

  function drawAxisLines(svg, margin, plotW, plotH) {
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
  }

  function addAxisLabel(svg, text, x, y, rotate) {
    var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', y);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'chart-axis-label');
    if (rotate) {
      label.setAttribute('transform', 'rotate(-90,' + x + ',' + y + ')');
    }
    label.textContent = text;
    svg.appendChild(label);
  }

  // ==================== STARTUP ====================

  document.addEventListener('DOMContentLoaded', init);
})();
