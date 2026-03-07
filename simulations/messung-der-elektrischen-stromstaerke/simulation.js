(function () {
  'use strict';

  var EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'V1: Elektromagnet',
      title: 'V1: Magnet an Feder über einem Elektromagneten',
      instruction: 'Stelle die Spannung des Netzgeräts ein und beobachte die Stromstärke und die Auslenkung des an der Feder hängenden Magneten.',
      conclusion: 'Mit steigender Spannung steigt die Stromstärke. Dadurch wird der Elektromagnet stärker und der Magnet wird weiter nach unten gezogen – die Feder dehnt sich stärker.'
    },
    b: {
      id: 'b',
      tab: 'V2: Lampe im Stromkreis',
      title: 'V2: Stromstärke bei unterschiedlicher Lampenhelligkeit',
      instruction: 'Verändere die Helligkeit der Lampe. Miss die Stromstärke an verschiedenen Stellen im gleichen Stromkreis und vergleiche die Werte.',
      conclusion: 'Bei gleicher Lampenhelligkeit ist die Stromstärke an allen Messstellen eines unverzweigten Stromkreises gleich groß. Wird die Lampe heller, nimmt die Stromstärke im gesamten Stromkreis zu.'
    }
  };

  var state = {};

  function init() {
    buildTabs();
    switchExperiment('a');
  }

  function buildTabs() {
    var tabs = document.getElementById('tabs');
    tabs.innerHTML = '';
    Object.keys(EXPERIMENTS).forEach(function (key) {
      var btn = document.createElement('button');
      btn.className = 'tab';
      btn.setAttribute('role', 'tab');
      btn.textContent = EXPERIMENTS[key].tab;
      btn.addEventListener('click', function () {
        switchExperiment(key);
      });
      tabs.appendChild(btn);
    });
  }

  function switchExperiment(key) {
    state = {};

    var tabBtns = document.querySelectorAll('.tab');
    var keys = Object.keys(EXPERIMENTS);
    tabBtns.forEach(function (btn, i) {
      btn.classList.toggle('active', keys[i] === key);
    });

    var exp = EXPERIMENTS[key];
    var container = document.getElementById('experiment-container');
    container.innerHTML = '';

    var panel = document.createElement('div');
    panel.className = 'experiment';

    var title = document.createElement('h2');
    title.className = 'exp-title';
    title.textContent = exp.title;
    panel.appendChild(title);

    var instr = document.createElement('p');
    instr.className = 'exp-instruction';
    instr.textContent = exp.instruction;
    panel.appendChild(instr);

    if (key === 'a') {
      renderV1(panel, exp);
    } else {
      renderV2(panel, exp);
    }

    container.appendChild(panel);
  }

  function renderV1(panel, exp) {
    state.voltage = 2;
    state.resistance = 18;

    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    vizCard.innerHTML = '' +
      '<div class="spring-setup" id="v1-viz">' +
      '  <div class="scale"><span>40 mm</span><span>30 mm</span><span>20 mm</span><span>10 mm</span><span>0 mm</span></div>' +
      '  <div class="spring" id="v1-spring"></div>' +
      '  <div class="magnet" id="v1-magnet"></div>' +
      '  <div class="coil"></div>' +
      '</div>';
    panel.appendChild(vizCard);

    var controlCard = document.createElement('div');
    controlCard.className = 'card exp-grid';
    controlCard.innerHTML = '' +
      '<label class="slider-wrap">' +
      '  <span class="control-label">Spannung des Netzgeräts: <strong id="v1-voltage">2.0 V</strong></span>' +
      '  <input id="v1-slider" type="range" min="1" max="12" step="0.5" value="2">' +
      '</label>' +
      '<div class="readout">Stromstärke: <span id="v1-current">111</span> mA <span class="badge-inline" id="v1-stretch">Federdehnung: 8 mm</span></div>';
    panel.appendChild(controlCard);

    var conclusion = document.createElement('div');
    conclusion.className = 'conclusion';
    conclusion.innerHTML = '<strong>Erkenntnis:</strong> ' + exp.conclusion;
    panel.appendChild(conclusion);

    function update() {
      var voltage = state.voltage;
      var currentA = voltage / state.resistance;
      var currentmA = Math.round(currentA * 1000);
      var stretch = Math.min(36, Math.round(4 + currentA * 60));
      var springHeight = 72 + stretch;
      var magnetTop = 96 + stretch;

      document.getElementById('v1-voltage').textContent = voltage.toFixed(1) + ' V';
      document.getElementById('v1-current').textContent = String(currentmA);
      document.getElementById('v1-stretch').textContent = 'Federdehnung: ' + stretch + ' mm';
      document.getElementById('v1-spring').style.height = springHeight + 'px';
      document.getElementById('v1-magnet').style.top = magnetTop + 'px';
    }

    document.getElementById('v1-slider').addEventListener('input', function (event) {
      state.voltage = parseFloat(event.target.value);
      update();
    });

    update();
  }

  function renderV2(panel, exp) {
    state.brightness = 40;
    state.position = 'left';

    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    vizCard.innerHTML = '' +
      '<div class="circuit-setup">' +
      '  <div class="wire w1"></div><div class="wire w2"></div><div class="wire w3"></div>' +
      '  <div class="ammeter" id="v2-meter">0 mA</div>' +
      '  <div class="lamp" id="v2-lamp"></div><div class="lamp-label">Lampe</div>' +
      '  <div class="meter-point left active" data-pos="left">A</div>' +
      '  <div class="meter-point right" data-pos="right">B</div>' +
      '  <div class="meter-point bottom" data-pos="bottom">C</div>' +
      '</div>';
    panel.appendChild(vizCard);

    var controlCard = document.createElement('div');
    controlCard.className = 'card exp-grid';
    controlCard.innerHTML = '' +
      '<label class="slider-wrap">' +
      '  <span class="control-label">Lampenhelligkeit: <strong id="v2-bright">40 %</strong></span>' +
      '  <input id="v2-bright-slider" type="range" min="10" max="100" step="5" value="40">' +
      '</label>' +
      '<div class="position-grid">' +
      '  <button class="btn btn-secondary" data-set-pos="left">Messgerät an Stelle A</button>' +
      '  <button class="btn btn-secondary" data-set-pos="right">Messgerät an Stelle B</button>' +
      '  <button class="btn btn-secondary" data-set-pos="bottom">Messgerät an Stelle C</button>' +
      '</div>' +
      '<div class="readout" id="v2-info"></div>';
    panel.appendChild(controlCard);

    var conclusion = document.createElement('div');
    conclusion.className = 'conclusion';
    conclusion.innerHTML = '<strong>Erkenntnis:</strong> ' + exp.conclusion;
    panel.appendChild(conclusion);

    function currentFromBrightness(brightness) {
      return Math.round(30 + brightness * 2.2);
    }

    function update() {
      var current = currentFromBrightness(state.brightness);
      var lamp = document.getElementById('v2-lamp');
      var alpha = 0.15 + state.brightness / 120;
      lamp.style.background = 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(250,204,21,' + alpha.toFixed(2) + '))';
      lamp.style.boxShadow = '0 0 ' + (8 + state.brightness / 3) + 'px rgba(250,204,21,0.45), inset 0 0 10px rgba(0,0,0,0.06)';

      document.getElementById('v2-bright').textContent = state.brightness + ' %';
      document.getElementById('v2-meter').textContent = current + ' mA';
      var labelMap = { left: 'A', right: 'B', bottom: 'C' };
      document.getElementById('v2-info').textContent = 'Messpunkt ' + labelMap[state.position] + ': ' + current + ' mA bei ' + state.brightness + ' % Helligkeit.';

      document.querySelectorAll('.meter-point').forEach(function (el) {
        el.classList.toggle('active', el.getAttribute('data-pos') === state.position);
      });
    }

    document.getElementById('v2-bright-slider').addEventListener('input', function (event) {
      state.brightness = parseInt(event.target.value, 10);
      update();
    });

    document.querySelectorAll('[data-set-pos]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.position = btn.getAttribute('data-set-pos');
        update();
      });
    });

    update();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
