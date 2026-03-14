(function () {
  'use strict';

  /* ===== DATA ===== */
  var EXPERIMENTS = [
    {
      id: 'v1',
      tab: 'V1',
      title: 'V1 – Dampfmaschine mit Generator',
      instruction: 'Setze die Spielzeugdampfmaschine in Betrieb und betreibe mit ihr über einen Generator eine Lampe. Beobachte die Energieumwandlungskette.',
      type: 'steam-generator',
      conclusion: 'Die Dampfmaschine wandelt Wärmeenergie in Bewegungsenergie um. Der Generator wandelt Bewegungsenergie in elektrische Energie um, die dann die Lampe zum Leuchten bringt. Energiekette: Wärme → Bewegung → Elektrizität → Licht.'
    },
    {
      id: 'v2',
      tab: 'V2',
      title: 'V2 – Solarzelle mit einem Ventilator',
      instruction: 'Eine Solarzelle ist mit einem Motor mit Ventilatorflügeln verbunden. Bestrahle die Solarzelle mit einer Lampe und beobachte den Ventilator. Ändere die Lampenhelligkeit.',
      type: 'solar-single',
      conclusion: 'Die Solarzelle wandelt Lichtenergie in elektrische Energie um, die den Motor antreibt. Bei einer helleren Lampe erzeugt die Solarzelle mehr Spannung – der Ventilator dreht sich schneller.'
    },
    {
      id: 'v3',
      tab: 'V3',
      title: 'V3 – Solarzelle mit zwei Ventilatoren',
      instruction: 'Versuch V2 wird mit zwei Ventilatoren im Stromkreis durchgeführt. Vergleiche die Drehgeschwindigkeit mit V2.',
      type: 'solar-double',
      conclusion: 'Bei zwei Ventilatoren im Stromkreis muss die elektrische Energie auf beide Verbraucher aufgeteilt werden. Deshalb drehen sich beide Ventilatoren langsamer als der einzelne Ventilator in V2.'
    },
    {
      id: 's1',
      tab: 'Station I',
      title: 'Station I – Modell einer Windkraftanlage',
      instruction: 'Betreibe mit dem Föhn das Windrad, das über einen Generator eine Glühlampe versorgt. Wiederhole mit anderer Föhngeschwindigkeit. Beschreibe die Energieüberführung.',
      type: 'wind-power',
      conclusion: 'Der Föhn erzeugt Wind (Bewegungsenergie), der das Windrad antreibt. Der Generator wandelt diese Bewegungsenergie in elektrische Energie um. Bei höherer Föhnstufe dreht das Windrad schneller und die Lampe leuchtet heller. Energiekette: Bewegung (Wind) → Bewegung (Rotation) → Elektrizität → Licht.'
    },
    {
      id: 's2',
      tab: 'Station II',
      title: 'Station II – Bewegungsenergie → elektrische Energie',
      instruction: 'Betreibe mit dem Kurbel-Generator eine Glühlampe. Wiederhole den Versuch mit einer zusätzlichen Glühlampe, die zur ersten parallel geschaltet ist. Zeichne Diagramme zum Energietransport.',
      type: 'crank-generator',
      conclusion: 'Der Kurbel-Generator wandelt Bewegungsenergie in elektrische Energie um. Bei einer parallelen zweiten Lampe muss man schneller kurbeln, da mehr Energie benötigt wird. Beide Lampen leuchten etwas schwächer als eine einzelne Lampe.'
    },
    {
      id: 's3',
      tab: 'Station III',
      title: 'Station III – Höhenenergie → elektrische Energie',
      instruction: 'Hänge Gewichtsstücke an die Schnur des Generators und beobachte die Glühlampe. Wiederhole mit zwei und drei Gewichtsstücken.',
      type: 'weight-generator',
      conclusion: 'Die Höhenenergie (Lageenergie) der Gewichte wird beim Fallen in Bewegungsenergie umgewandelt, die den Generator antreibt. Mehr Gewicht bedeutet mehr Energie: Die Lampe leuchtet heller. Energiekette: Höhenenergie → Bewegung → Elektrizität → Licht.'
    },
    {
      id: 's4',
      tab: 'Station IV',
      title: 'Station IV – Energie beim Föhn',
      instruction: 'Miss die im Stromkreis in jeweils 60 Sekunden überführte Energie bei Stufe I und II mit dem Energiezähler. Wiederhole die Messung mit 30 und 120 Sekunden.',
      type: 'hairdryer-energy',
      conclusion: 'Der Föhn auf Stufe II verbraucht mehr Energie als auf Stufe I. Doppelte Zeit bedeutet doppelten Energieverbrauch. Die Energie ist proportional zur Leistung und zur Zeit: E = P × t.'
    }
  ];

  /* ===== STATE ===== */
  var state = {};
  var cleanupFns = [];

  /* ===== HELPERS ===== */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var container = function () { return document.getElementById('experiment-container'); };

  function cleanup() {
    cleanupFns.forEach(function (fn) { fn(); });
    cleanupFns = [];
  }

  function addEvt(el, evt, fn) {
    el.addEventListener(evt, fn);
    cleanupFns.push(function () { el.removeEventListener(evt, fn); });
  }

  function bulbClass(level) {
    if (level <= 0) return 'off';
    if (level < 0.35) return 'dim';
    if (level < 0.7) return 'on';
    return 'bright';
  }

  function spinDuration(speed) {
    if (speed <= 0) return '0s';
    return Math.max(0.15, 2.5 - speed * 2) + 's';
  }

  /* ===== DRAW WIRES (SVG) ===== */
  function drawWire(svg, points, color) {
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    path.setAttribute('points', points.map(function (p) { return p[0] + ',' + p[1]; }).join(' '));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color || '#dc2626');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
  }

  function makeSVG(container) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.zIndex = '0';
    // Set viewBox after layout so SVG coords match pixel positions exactly
    function setViewBox() {
      var w = container.offsetWidth || 400;
      var h = container.offsetHeight || 320;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    }
    setViewBox();
    // Update on resize
    var resizeTimer;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setViewBox, 100);
    }
    window.addEventListener('resize', onResize);
    cleanupFns.push(function () { window.removeEventListener('resize', onResize); });
    return svg;
  }

  /* Helper: get connection point of an element relative to a container in SVG coords */
  function connPt(container, el, dx, dy) {
    var cx = el.offsetLeft - container.offsetLeft + (dx || 0);
    var cy = el.offsetTop - container.offsetTop + (dy || 0);
    return [cx, cy];
  }

  /* ===== ENERGY CHAIN ===== */
  function energyChainHTML(steps) {
    var html = '<div class="energy-chain">';
    steps.forEach(function (s, i) {
      if (i > 0) html += '<span class="energy-arrow">→</span>';
      html += '<span class="energy-step ' + s.cls + '">' + s.label + '</span>';
    });
    html += '</div>';
    return html;
  }

  /* ===== BUILD TABS ===== */
  function buildTabs() {
    var tabBar = document.getElementById('tabs');
    tabBar.setAttribute('role', 'tablist');
    tabBar.innerHTML = '';
    EXPERIMENTS.forEach(function (exp) {
      var btn = document.createElement('button');
      btn.className = 'tab';
      btn.textContent = exp.tab;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('data-exp', exp.id);
      tabBar.appendChild(btn);
      // Use direct addEventListener (not addEvt) so tab handlers survive cleanup()
      btn.addEventListener('click', function () { switchExperiment(exp.id); });
    });
  }

  function setActiveTab(id) {
    var tabs = document.querySelectorAll('#tabs .tab');
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-exp') === id);
      t.setAttribute('aria-selected', t.getAttribute('data-exp') === id);
    });
  }

  /* ===== SWITCH EXPERIMENT ===== */
  function switchExperiment(id) {
    cleanup();
    state = {};
    setActiveTab(id);
    container().setAttribute('role', 'tabpanel');
    var exp = EXPERIMENTS.filter(function (e) { return e.id === id; })[0];
    if (!exp) return;

    var renderers = {
      'steam-generator': renderSteamGenerator,
      'solar-single': renderSolarSingle,
      'solar-double': renderSolarDouble,
      'wind-power': renderWindPower,
      'crank-generator': renderCrankGenerator,
      'weight-generator': renderWeightGenerator,
      'hairdryer-energy': renderHairdryerEnergy
    };

    var fn = renderers[exp.type];
    if (fn) fn(exp);
  }

  /* ================================================================
     V1 – DAMPFMASCHINE MIT GENERATOR
     ================================================================ */
  function renderSteamGenerator(exp) {
    var main = container();
    main.innerHTML =
      '<div class="experiment">' +
        '<div class="exp-title">' + exp.title + '</div>' +
        '<div class="exp-instruction">' + exp.instruction + '</div>' +
        '<div class="card">' +
          '<div class="slider-container">' +
            '<div class="control-label">Feuerleistung</div>' +
            '<div class="slider-row">' +
              '<span style="font-size:1.2rem">🔥</span>' +
              '<input type="range" class="slider-input" id="fire-slider" min="0" max="100" value="0">' +
              '<span class="slider-value" id="fire-value">0%</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="circuit-viz" id="steam-circuit"></div>' +
        '</div>' +
        '<div class="voltage-row">' +
          '<div class="voltage-box source"><div class="voltage-label">Feuer</div><div class="voltage-value" id="disp-fire">Aus</div></div>' +
          '<div class="voltage-box speed"><div class="voltage-label">Generator</div><div class="voltage-value" id="disp-gen">0 U/min</div></div>' +
          '<div class="voltage-box lamp"><div class="voltage-label">Lampe</div><div class="voltage-value" id="disp-lamp">Aus</div></div>' +
        '</div>' +
        '<div class="card" id="chain-card">' +
          energyChainHTML([
            { cls: 'thermal', label: 'Wärme' },
            { cls: 'kinetic', label: 'Bewegung' },
            { cls: 'electric', label: 'Elektrizität' },
            { cls: 'light', label: 'Licht' }
          ]) +
        '</div>' +
        '<div class="conclusion hidden" id="conclusion"><strong>Erkenntnis</strong>' + exp.conclusion + '</div>' +
      '</div>';

    var circuit = document.getElementById('steam-circuit');

    // Steam engine
    circuit.innerHTML =
      '<div class="steam-engine" id="steam-eng" style="left:5%;top:18%">' +
        '<div class="steam-engine-chimney"></div>' +
        '<div class="steam-puff" style="display:none"></div>' +
        '<div class="steam-puff" style="display:none"></div>' +
        '<div class="steam-puff" style="display:none"></div>' +
        '<div class="steam-puff" style="display:none"></div>' +
        '<div class="steam-engine-body">' +
          '<span class="steam-engine-label">Dampf-<br>maschine</span>' +
          '<div class="steam-engine-gauge"></div>' +
          '<div class="steam-engine-piston">' +
            '<div class="steam-engine-piston-rod"></div>' +
            '<div class="steam-engine-piston-cylinder"></div>' +
          '</div>' +
        '</div>' +
        '<div class="steam-engine-flywheel"><div class="steam-engine-flywheel-hub"></div></div>' +
        '<div class="steam-engine-grate"></div>' +
        '<div class="steam-engine-fire" id="steam-fire">' +
          '<div class="steam-engine-flame"></div>' +
          '<div class="steam-engine-flame"></div>' +
          '<div class="steam-engine-flame"></div>' +
          '<div class="steam-engine-flame"></div>' +
        '</div>' +
        '<div class="steam-engine-wheel left"></div>' +
        '<div class="steam-engine-wheel right"></div>' +
      '</div>' +
      // Generator
      '<div class="generator" id="v1-gen" style="left:38%;top:26%">' +
        '<div class="generator-body">' +
          '<div class="generator-coils"></div>' +
          '<div class="generator-rotor"></div>' +
          '<span class="generator-symbol">G</span>' +
          '<div class="generator-terminal pos"></div>' +
          '<div class="generator-terminal neg"></div>' +
        '</div>' +
        '<div class="generator-label">Generator</div>' +
      '</div>' +
      // Bulb
      '<div style="position:absolute;right:12%;top:22%;z-index:2" class="bulb-container" id="v1-bulb-grp">' +
        '<div class="bulb-glass off" id="v1-bulb"></div>' +
        '<div class="bulb-base"></div>' +
        '<span class="bulb-label">Lampe</span>' +
      '</div>';

    // Draw wires after components are in DOM so we can measure positions
    var svg = makeSVG(circuit);
    circuit.insertBefore(svg, circuit.firstChild);

    requestAnimationFrame(function () {
      var genEl_ = document.getElementById('v1-gen');
      var genBody = genEl_ ? genEl_.querySelector('.generator-body') : null;
      var bulbGrp = document.getElementById('v1-bulb-grp');
      var steamEng_ = document.getElementById('steam-eng');
      var flywheel = steamEng_ ? steamEng_.querySelector('.steam-engine-flywheel') : null;

      if (genBody && bulbGrp) {
        // Generator terminal positions (pos: top-right, neg: bottom-right of body)
        var genPosX = genBody.offsetLeft + genBody.offsetWidth - 13;
        var genPosY = genBody.offsetTop - 0;
        var genNegX = genPosX;
        var genNegY = genBody.offsetTop + genBody.offsetHeight + 0;
        // Offset generator position relative to circuit
        var gOff = connPt(circuit, genEl_, 0, 0);
        var gPosAbs = [gOff[0] + genPosX, gOff[1] + genPosY];
        var gNegAbs = [gOff[0] + genNegX, gOff[1] + genNegY];

        // Bulb connection points (top and bottom)
        var bPt = connPt(circuit, bulbGrp, 16, 0);
        var bPtBot = connPt(circuit, bulbGrp, 16, 42);

        // Red wire (positive): generator pos → up → across → down to bulb top
        drawWire(svg, [gPosAbs, [gPosAbs[0], gPosAbs[1] - 30], [bPt[0], gPosAbs[1] - 30], bPt], '#dc2626');
        // Blue wire (negative): generator neg → down → across → up to bulb bottom
        drawWire(svg, [gNegAbs, [gNegAbs[0], gNegAbs[1] + 80], [bPtBot[0], gNegAbs[1] + 80], bPtBot], '#2563eb');
      }

      // Drive belt from flywheel to generator
      if (flywheel && genEl_) {
        var fwPt = connPt(circuit, flywheel, 14, 10);
        var gLeft = connPt(circuit, genEl_, 0, 18);
        drawWire(svg, [[fwPt[0], fwPt[1]], [gLeft[0], fwPt[1]]], '#78716c');
        drawWire(svg, [[fwPt[0], fwPt[1] + 8], [gLeft[0], fwPt[1] + 8]], '#78716c');
      }
    });

    var slider = document.getElementById('fire-slider');
    var fireVal = document.getElementById('fire-value');
    var dispFire = document.getElementById('disp-fire');
    var dispGen = document.getElementById('disp-gen');
    var dispLamp = document.getElementById('disp-lamp');
    var bulb = document.getElementById('v1-bulb');
    var steamEng = document.getElementById('steam-eng');
    var genEl = document.getElementById('v1-gen');
    var conc = document.getElementById('conclusion');
    var shown = false;

    function update() {
      var v = parseInt(slider.value) / 100;
      fireVal.textContent = Math.round(v * 100) + '%';
      dispFire.textContent = v === 0 ? 'Aus' : Math.round(v * 100) + '%';
      var rpm = Math.round(v * 3000);
      dispGen.textContent = rpm + ' U/min';
      var lampLevel = Math.max(0, v - 0.1);
      dispLamp.textContent = lampLevel <= 0 ? 'Aus' : (lampLevel < 0.35 ? 'Schwach' : (lampLevel < 0.7 ? 'Mittel' : 'Hell'));
      bulb.className = 'bulb-glass ' + bulbClass(lampLevel);

      var puffs = steamEng.querySelectorAll('.steam-puff');
      if (v > 0.05) {
        steamEng.classList.add('steam-spinning');
        steamEng.classList.add('steam-active');
        steamEng.style.setProperty('--spin-duration', spinDuration(v));
        genEl.classList.add('generator-spinning');
        genEl.style.setProperty('--spin-duration', spinDuration(v));
        puffs.forEach(function (p) { p.style.display = ''; });
      } else {
        steamEng.classList.remove('steam-spinning');
        steamEng.classList.remove('steam-active');
        genEl.classList.remove('generator-spinning');
        puffs.forEach(function (p) { p.style.display = 'none'; });
      }

      if (v > 0.5 && !shown) { conc.classList.remove('hidden'); shown = true; }
    }

    addEvt(slider, 'input', update);
    update();
  }

  /* ================================================================
     V2 – SOLARZELLE MIT EINEM VENTILATOR
     ================================================================ */
  function renderSolarSingle(exp) {
    var main = container();
    main.innerHTML =
      '<div class="experiment">' +
        '<div class="exp-title">' + exp.title + '</div>' +
        '<div class="exp-instruction">' + exp.instruction + '</div>' +
        '<div class="card">' +
          '<div class="slider-container">' +
            '<div class="control-label">Lampenhelligkeit</div>' +
            '<div class="slider-row">' +
              '<span style="font-size:1.2rem">💡</span>' +
              '<input type="range" class="slider-input" id="light-slider" min="0" max="100" value="0">' +
              '<span class="slider-value" id="light-value">0%</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="circuit-viz" id="solar-circuit" style="height:260px"></div>' +
        '</div>' +
        '<div class="voltage-row">' +
          '<div class="voltage-box lamp"><div class="voltage-label">Lichtintensität</div><div class="voltage-value" id="disp-light">0%</div></div>' +
          '<div class="voltage-box current"><div class="voltage-label">Spannung</div><div class="voltage-value" id="disp-volt">0 V</div></div>' +
          '<div class="voltage-box speed"><div class="voltage-label">Drehzahl</div><div class="voltage-value" id="disp-speed">0 U/min</div></div>' +
        '</div>' +
        '<div class="card">' +
          energyChainHTML([
            { cls: 'light', label: 'Licht' },
            { cls: 'electric', label: 'Elektrizität' },
            { cls: 'kinetic', label: 'Bewegung' }
          ]) +
        '</div>' +
        '<div class="conclusion hidden" id="conclusion"><strong>Erkenntnis</strong>' + exp.conclusion + '</div>' +
      '</div>';

    var circuit = document.getElementById('solar-circuit');

    // Lamp (light source)
    circuit.innerHTML =
      '<div id="v2-lamp" style="position:absolute;left:10%;top:2%;z-index:3;display:flex;flex-direction:column;align-items:center">' +
        '<div class="bulb-glass dim" style="width:24px;height:24px;border-width:1.5px"></div>' +
        '<div class="bulb-base" style="width:12px;height:7px"></div>' +
        '<span style="font-size:0.6rem;font-weight:600;color:var(--text-sec);margin-top:2px">Lampe</span>' +
      '</div>' +
      // Light rays
      '<div id="light-rays" style="position:absolute;left:12%;top:22%;z-index:1;display:none">' +
        '<div style="width:3px;height:30px;background:linear-gradient(180deg,#fde047,transparent);position:absolute;left:0;transform:rotate(-10deg)"></div>' +
        '<div style="width:3px;height:30px;background:linear-gradient(180deg,#fde047,transparent);position:absolute;left:12px;transform:rotate(0deg)"></div>' +
        '<div style="width:3px;height:30px;background:linear-gradient(180deg,#fde047,transparent);position:absolute;left:24px;transform:rotate(10deg)"></div>' +
        '<div style="width:2px;height:24px;background:linear-gradient(180deg,#fde047,transparent);position:absolute;left:6px;transform:rotate(-5deg);opacity:0.6"></div>' +
        '<div style="width:2px;height:24px;background:linear-gradient(180deg,#fde047,transparent);position:absolute;left:18px;transform:rotate(5deg);opacity:0.6"></div>' +
      '</div>' +
      // Solar panel
      '<div class="solar-cell" id="v2-solar" style="left:8%;top:30%">' +
        '<div class="solar-panel-frame"><div class="solar-panel">' +
          '<div class="solar-segment"></div><div class="solar-segment"></div><div class="solar-segment"></div>' +
          '<div class="solar-segment"></div><div class="solar-segment"></div><div class="solar-segment"></div>' +
        '</div></div>' +
        '<div class="solar-terminal pos"></div>' +
        '<div class="solar-terminal neg"></div>' +
        '<div class="solar-stand"></div>' +
        '<div class="solar-label">Solarzelle</div>' +
      '</div>' +
      // Motor
      '<div id="v2-motor" style="position:absolute;right:17%;top:58%;display:flex;flex-direction:column;align-items:center;z-index:2">' +
        '<div class="motor-body" style="width:36px;height:36px"><span class="motor-symbol" style="font-size:0.8rem">M</span></div>' +
        '<span class="motor-label">Motor</span>' +
      '</div>' +
      // Fan with guard
      '<div class="fan-container" id="fan1" style="right:15%;top:12%">' +
        '<div class="fan-blades">' +
          '<div class="fan-guard"></div>' +
          '<div class="fan-hub"></div>' +
          '<div class="fan-blade-arm red"></div>' +
          '<div class="fan-blade-arm blue"></div>' +
          '<div class="fan-blade-arm red"></div>' +
          '<div class="fan-blade-arm blue"></div>' +
        '</div>' +
        '<div class="fan-label">Ventilator</div>' +
      '</div>';

    var svg2 = makeSVG(circuit);
    circuit.insertBefore(svg2, circuit.firstChild);

    requestAnimationFrame(function () {
      var solar = document.getElementById('v2-solar');
      var motor = document.getElementById('v2-motor');
      if (solar && motor) {
        // Solar cell right side → wire up to top → across → down to motor top
        var solarR = connPt(circuit, solar, 70, 20);
        var solarRBot = connPt(circuit, solar, 70, 45);
        var motorL = connPt(circuit, motor, 0, 10);
        var motorLBot = connPt(circuit, motor, 0, 28);
        // Red wire (top path)
        drawWire(svg2, [solarR, [solarR[0], solarR[1] - 20], [motorL[0], solarR[1] - 20], motorL], '#dc2626');
        // Blue wire (bottom path)
        drawWire(svg2, [solarRBot, [solarRBot[0], solarRBot[1] + 40], [motorLBot[0], solarRBot[1] + 40], motorLBot], '#2563eb');
      }
    });

    var slider = document.getElementById('light-slider');
    var lightVal = document.getElementById('light-value');
    var dispLight = document.getElementById('disp-light');
    var dispVolt = document.getElementById('disp-volt');
    var dispSpeed = document.getElementById('disp-speed');
    var fan = document.getElementById('fan1');
    var rays = document.getElementById('light-rays');
    var v2Lamp = document.getElementById('v2-lamp');
    var v2LampGlass = v2Lamp ? v2Lamp.querySelector('.bulb-glass') : null;
    var conc = document.getElementById('conclusion');
    var shown = false;

    function update() {
      var v = parseInt(slider.value) / 100;
      lightVal.textContent = Math.round(v * 100) + '%';
      dispLight.textContent = Math.round(v * 100) + '%';
      var volt = (v * 4.5).toFixed(1);
      dispVolt.textContent = volt + ' V';
      var rpm = Math.round(v * 2500);
      dispSpeed.textContent = rpm + ' U/min';

      rays.style.display = v > 0.05 ? '' : 'none';
      rays.style.opacity = Math.min(1, v * 1.5);

      // Update lamp appearance
      if (v2LampGlass) {
        v2LampGlass.className = 'bulb-glass ' + bulbClass(v);
      }

      if (v > 0.05) {
        fan.classList.add('fan-spinning');
        fan.style.setProperty('--spin-duration', spinDuration(v));
      } else {
        fan.classList.remove('fan-spinning');
      }

      if (v > 0.5 && !shown) { conc.classList.remove('hidden'); shown = true; }
    }

    addEvt(slider, 'input', update);
    update();
  }

  /* ================================================================
     V3 – SOLARZELLE MIT ZWEI VENTILATOREN
     ================================================================ */
  function renderSolarDouble(exp) {
    var main = container();
    main.innerHTML =
      '<div class="experiment">' +
        '<div class="exp-title">' + exp.title + '</div>' +
        '<div class="exp-instruction">' + exp.instruction + '</div>' +
        '<div class="card">' +
          '<div class="slider-container">' +
            '<div class="control-label">Lampenhelligkeit</div>' +
            '<div class="slider-row">' +
              '<span style="font-size:1.2rem">💡</span>' +
              '<input type="range" class="slider-input" id="light-slider2" min="0" max="100" value="0">' +
              '<span class="slider-value" id="light-value2">0%</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="circuit-viz" id="solar-circuit2" style="height:280px"></div>' +
        '</div>' +
        '<div class="voltage-row">' +
          '<div class="voltage-box lamp"><div class="voltage-label">Lichtintensität</div><div class="voltage-value" id="disp-light2">0%</div></div>' +
          '<div class="voltage-box speed"><div class="voltage-label">Ventilator 1</div><div class="voltage-value" id="disp-fan1">0 U/min</div></div>' +
          '<div class="voltage-box speed"><div class="voltage-label">Ventilator 2</div><div class="voltage-value" id="disp-fan2">0 U/min</div></div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="conclusion" style="background:#fff7ed;border-color:#fed7aa;color:#9a3412">' +
            '<strong>Vergleich mit V2</strong>Beide Ventilatoren drehen sich langsamer als der einzelne Ventilator in V2, da die Energie auf zwei Verbraucher aufgeteilt wird.' +
          '</div>' +
        '</div>' +
        '<div class="conclusion hidden" id="conclusion2"><strong>Erkenntnis</strong>' + exp.conclusion + '</div>' +
      '</div>';

    var circuit = document.getElementById('solar-circuit2');

    // Components first, then SVG wires
    circuit.innerHTML =
      // Lamp (light source)
      '<div id="v3-lamp" style="position:absolute;left:8%;top:2%;z-index:3;display:flex;flex-direction:column;align-items:center">' +
        '<div class="bulb-glass dim" style="width:24px;height:24px;border-width:1.5px"></div>' +
        '<div class="bulb-base" style="width:12px;height:7px"></div>' +
        '<span style="font-size:0.6rem;font-weight:600;color:var(--text-sec);margin-top:2px">Lampe</span>' +
      '</div>' +
      // Light rays
      '<div id="light-rays2" style="position:absolute;left:10%;top:20%;z-index:1;display:none">' +
        '<div style="width:3px;height:30px;background:linear-gradient(180deg,#fde047,transparent);position:absolute;left:0;transform:rotate(-10deg)"></div>' +
        '<div style="width:3px;height:30px;background:linear-gradient(180deg,#fde047,transparent);position:absolute;left:12px"></div>' +
        '<div style="width:3px;height:30px;background:linear-gradient(180deg,#fde047,transparent);position:absolute;left:24px;transform:rotate(10deg)"></div>' +
        '<div style="width:2px;height:24px;background:linear-gradient(180deg,#fde047,transparent);position:absolute;left:6px;transform:rotate(-5deg);opacity:0.6"></div>' +
        '<div style="width:2px;height:24px;background:linear-gradient(180deg,#fde047,transparent);position:absolute;left:18px;transform:rotate(5deg);opacity:0.6"></div>' +
      '</div>' +
      // Solar panel
      '<div class="solar-cell" id="v3-solar" style="left:5%;top:30%">' +
        '<div class="solar-panel-frame"><div class="solar-panel">' +
          '<div class="solar-segment"></div><div class="solar-segment"></div><div class="solar-segment"></div>' +
          '<div class="solar-segment"></div><div class="solar-segment"></div><div class="solar-segment"></div>' +
        '</div></div>' +
        '<div class="solar-terminal pos"></div>' +
        '<div class="solar-terminal neg"></div>' +
        '<div class="solar-stand"></div>' +
        '<div class="solar-label">Solarzelle</div>' +
      '</div>' +
      // Motor 1
      '<div id="v3-motor1" style="position:absolute;right:37%;top:56%;display:flex;flex-direction:column;align-items:center;z-index:2">' +
        '<div class="motor-body" style="width:32px;height:32px"><span class="motor-symbol" style="font-size:0.7rem">M</span></div>' +
        '<span class="motor-label">Motor 1</span>' +
      '</div>' +
      // Motor 2
      '<div id="v3-motor2" style="position:absolute;right:10%;top:56%;display:flex;flex-direction:column;align-items:center;z-index:2">' +
        '<div class="motor-body" style="width:32px;height:32px"><span class="motor-symbol" style="font-size:0.7rem">M</span></div>' +
        '<span class="motor-label">Motor 2</span>' +
      '</div>' +
      // Fan 1 with guard
      '<div class="fan-container" id="fan2a" style="right:35%;top:4%">' +
        '<div class="fan-blades">' +
          '<div class="fan-guard"></div>' +
          '<div class="fan-hub"></div>' +
          '<div class="fan-blade-arm red"></div>' +
          '<div class="fan-blade-arm blue"></div>' +
          '<div class="fan-blade-arm red"></div>' +
          '<div class="fan-blade-arm blue"></div>' +
        '</div>' +
        '<div class="fan-label">Ventilator 1</div>' +
      '</div>' +
      // Fan 2 with guard
      '<div class="fan-container" id="fan2b" style="right:8%;top:4%">' +
        '<div class="fan-blades">' +
          '<div class="fan-guard"></div>' +
          '<div class="fan-hub"></div>' +
          '<div class="fan-blade-arm green"></div>' +
          '<div class="fan-blade-arm yellow"></div>' +
          '<div class="fan-blade-arm green"></div>' +
          '<div class="fan-blade-arm yellow"></div>' +
        '</div>' +
        '<div class="fan-label">Ventilator 2</div>' +
      '</div>';

    var svg3 = makeSVG(circuit);
    circuit.insertBefore(svg3, circuit.firstChild);

    requestAnimationFrame(function () {
      var solar = document.getElementById('v3-solar');
      var motor1 = document.getElementById('v3-motor1');
      var motor2 = document.getElementById('v3-motor2');
      if (solar && motor1 && motor2) {
        var solarR = connPt(circuit, solar, 70, 15);
        var solarRBot = connPt(circuit, solar, 70, 45);
        var m1L = connPt(circuit, motor1, 0, 8);
        var m1LBot = connPt(circuit, motor1, 0, 24);
        var m2L = connPt(circuit, motor2, 0, 8);
        var m2LBot = connPt(circuit, motor2, 0, 24);
        // Red wire: solar → junction → motor1 and motor2 (parallel)
        var juncY = Math.min(solarR[1], m1L[1]) - 15;
        drawWire(svg3, [solarR, [solarR[0], juncY], [m1L[0], juncY], m1L], '#dc2626');
        drawWire(svg3, [[m1L[0], juncY], [m2L[0], juncY], m2L], '#dc2626');
        // Blue wire: solar → junction → motor1 and motor2
        var juncYBot = Math.max(solarRBot[1], m1LBot[1]) + 15;
        drawWire(svg3, [solarRBot, [solarRBot[0], juncYBot], [m1LBot[0], juncYBot], m1LBot], '#2563eb');
        drawWire(svg3, [[m1LBot[0], juncYBot], [m2LBot[0], juncYBot], m2LBot], '#2563eb');
      }
    });

    var slider = document.getElementById('light-slider2');
    var lightVal = document.getElementById('light-value2');
    var dispLight = document.getElementById('disp-light2');
    var dispFan1 = document.getElementById('disp-fan1');
    var dispFan2 = document.getElementById('disp-fan2');
    var fanA = document.getElementById('fan2a');
    var fanB = document.getElementById('fan2b');
    var rays = document.getElementById('light-rays2');
    var v3Lamp = document.getElementById('v3-lamp');
    var v3LampGlass = v3Lamp ? v3Lamp.querySelector('.bulb-glass') : null;
    var conc = document.getElementById('conclusion2');
    var shown = false;

    function update() {
      var v = parseInt(slider.value) / 100;
      lightVal.textContent = Math.round(v * 100) + '%';
      dispLight.textContent = Math.round(v * 100) + '%';
      // Each fan gets ~60% of single fan speed
      var rpm = Math.round(v * 1500);
      dispFan1.textContent = rpm + ' U/min';
      dispFan2.textContent = rpm + ' U/min';

      rays.style.display = v > 0.05 ? '' : 'none';
      rays.style.opacity = Math.min(1, v * 1.5);

      // Update lamp appearance
      if (v3LampGlass) {
        v3LampGlass.className = 'bulb-glass ' + bulbClass(v);
      }

      var fanSpeed = v * 0.6;
      if (fanSpeed > 0.03) {
        fanA.classList.add('fan-spinning');
        fanB.classList.add('fan-spinning');
        var dur = spinDuration(fanSpeed);
        fanA.style.setProperty('--spin-duration', dur);
        fanB.style.setProperty('--spin-duration', dur);
      } else {
        fanA.classList.remove('fan-spinning');
        fanB.classList.remove('fan-spinning');
      }

      if (v > 0.5 && !shown) { conc.classList.remove('hidden'); shown = true; }
    }

    addEvt(slider, 'input', update);
    update();
  }

  /* ================================================================
     STATION I – WINDKRAFTANLAGE
     ================================================================ */
  function renderWindPower(exp) {
    var main = container();
    main.innerHTML =
      '<div class="experiment">' +
        '<div class="exp-title">' + exp.title + '</div>' +
        '<div class="exp-instruction">' + exp.instruction + '</div>' +
        '<div class="card">' +
          '<div class="control-label">Föhnstufe wählen:</div>' +
          '<div class="btn-row mt-sm">' +
            '<button class="btn btn-secondary" id="wind-off">Aus</button>' +
            '<button class="btn btn-secondary" id="wind-low">Stufe I (niedrig)</button>' +
            '<button class="btn btn-secondary" id="wind-high">Stufe II (hoch)</button>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="circuit-viz" id="wind-circuit" style="height:300px"></div>' +
        '</div>' +
        '<div class="voltage-row">' +
          '<div class="voltage-box source"><div class="voltage-label">Föhn</div><div class="voltage-value" id="disp-wind">Aus</div></div>' +
          '<div class="voltage-box speed"><div class="voltage-label">Windrad</div><div class="voltage-value" id="disp-turbine">0 U/min</div></div>' +
          '<div class="voltage-box lamp"><div class="voltage-label">Lampe</div><div class="voltage-value" id="disp-wlamp">Aus</div></div>' +
        '</div>' +
        '<div class="card">' +
          energyChainHTML([
            { cls: 'kinetic', label: 'Wind' },
            { cls: 'kinetic', label: 'Rotation' },
            { cls: 'electric', label: 'Elektrizität' },
            { cls: 'light', label: 'Licht' }
          ]) +
        '</div>' +
        '<div class="conclusion hidden" id="conclusion-w"><strong>Erkenntnis</strong>' + exp.conclusion + '</div>' +
      '</div>';

    var circuit = document.getElementById('wind-circuit');

    // Components
    circuit.innerHTML =
      // Hairdryer
      '<div class="hairdryer" id="wind-dryer" style="left:3%;top:30%">' +
        '<div class="hairdryer-body">' +
          '<span class="hairdryer-label">Föhn</span>' +
          '<div class="hairdryer-switch"></div>' +
          '<div class="hairdryer-nozzle"></div>' +
        '</div>' +
        '<div class="hairdryer-handle"></div>' +
      '</div>' +
      // Wind lines
      '<div id="wind-lines" style="position:absolute;left:22%;top:28%;display:none">' +
        '<div class="wind-line" style="top:0"></div>' +
        '<div class="wind-line" style="top:8px;animation-delay:0.15s"></div>' +
        '<div class="wind-line" style="top:16px;animation-delay:0.3s"></div>' +
        '<div class="wind-line" style="top:24px;animation-delay:0.45s"></div>' +
      '</div>' +
      // Wind turbine with nacelle
      '<div class="wind-turbine" id="wind-turb" style="left:38%;top:3%">' +
        '<div class="wind-turbine-blades">' +
          '<div class="wind-turbine-hub"></div>' +
          '<div class="wind-blade"></div>' +
          '<div class="wind-blade"></div>' +
          '<div class="wind-blade"></div>' +
        '</div>' +
        '<div class="wind-turbine-nacelle"></div>' +
        '<div class="wind-turbine-pole"></div>' +
      '</div>' +
      // Generator with rotor
      '<div class="generator" id="w-gen" style="left:52%;top:38%">' +
        '<div class="generator-body">' +
          '<div class="generator-coils"></div>' +
          '<div class="generator-rotor"></div>' +
          '<span class="generator-symbol">G</span>' +
          '<div class="generator-terminal pos"></div>' +
          '<div class="generator-terminal neg"></div>' +
        '</div>' +
        '<div class="generator-label">Generator</div>' +
      '</div>' +
      // Mechanical link: turbine pole to generator
      '<div id="w-shaft" style="position:absolute;left:44%;top:32%;width:calc(10%);height:3px;background:linear-gradient(90deg,#94a3b8,#78909c);z-index:1;border-radius:1px"></div>' +
      // Bulb with base
      '<div style="position:absolute;right:10%;top:28%;z-index:2" class="bulb-container" id="w-bulb-grp">' +
        '<div class="bulb-glass off" id="w-bulb"></div>' +
        '<div class="bulb-base"></div>' +
        '<span class="bulb-label">Lampe</span>' +
      '</div>';

    var svgw = makeSVG(circuit);
    circuit.insertBefore(svgw, circuit.firstChild);

    requestAnimationFrame(function () {
      var genEl_ = document.getElementById('w-gen');
      var bulbGrp = document.getElementById('w-bulb-grp');
      if (genEl_ && bulbGrp) {
        var genBody = genEl_.querySelector('.generator-body');
        var gOff = connPt(circuit, genEl_, 0, 0);
        var gPosAbs = [gOff[0] + genBody.offsetWidth - 13, gOff[1]];
        var gNegAbs = [gOff[0] + genBody.offsetWidth - 13, gOff[1] + genBody.offsetHeight];
        var bPt = connPt(circuit, bulbGrp, 16, 0);
        var bPtBot = connPt(circuit, bulbGrp, 16, 42);
        drawWire(svgw, [gPosAbs, [gPosAbs[0], gPosAbs[1] - 25], [bPt[0], gPosAbs[1] - 25], bPt], '#dc2626');
        drawWire(svgw, [gNegAbs, [gNegAbs[0], gNegAbs[1] + 60], [bPtBot[0], gNegAbs[1] + 60], bPtBot], '#2563eb');
      }
    });

    var btns = { off: document.getElementById('wind-off'), low: document.getElementById('wind-low'), high: document.getElementById('wind-high') };
    var turb = document.getElementById('wind-turb');
    var wLines = document.getElementById('wind-lines');
    var wBulb = document.getElementById('w-bulb');
    var wGen = document.getElementById('w-gen');
    var dispWind = document.getElementById('disp-wind');
    var dispTurb = document.getElementById('disp-turbine');
    var dispWLamp = document.getElementById('disp-wlamp');
    var conc = document.getElementById('conclusion-w');
    var tested = {};

    function setWind(level) {
      Object.keys(btns).forEach(function (k) { btns[k].classList.toggle('btn-primary', k === level); btns[k].classList.toggle('btn-secondary', k !== level); });

      var v = level === 'high' ? 0.9 : (level === 'low' ? 0.45 : 0);
      dispWind.textContent = level === 'off' ? 'Aus' : (level === 'low' ? 'Stufe I' : 'Stufe II');

      var rpm = Math.round(v * 2800);
      dispTurb.textContent = rpm + ' U/min';
      var lampLev = Math.max(0, v - 0.1);
      dispWLamp.textContent = lampLev <= 0 ? 'Aus' : (lampLev < 0.35 ? 'Schwach' : (lampLev < 0.7 ? 'Mittel' : 'Hell'));
      wBulb.className = 'bulb-glass ' + bulbClass(lampLev);

      wLines.style.display = v > 0 ? '' : 'none';

      if (v > 0) {
        turb.classList.add('wind-spinning');
        turb.style.setProperty('--spin-duration', spinDuration(v));
        wGen.classList.add('generator-spinning');
        wGen.style.setProperty('--spin-duration', spinDuration(v));
      } else {
        turb.classList.remove('wind-spinning');
        wGen.classList.remove('generator-spinning');
      }

      tested[level] = true;
      if (tested.low && tested.high) conc.classList.remove('hidden');
    }

    addEvt(btns.off, 'click', function () { setWind('off'); });
    addEvt(btns.low, 'click', function () { setWind('low'); });
    addEvt(btns.high, 'click', function () { setWind('high'); });
    setWind('off');
  }

  /* ================================================================
     STATION II – KURBEL-GENERATOR
     ================================================================ */
  function renderCrankGenerator(exp) {
    var main = container();
    main.innerHTML =
      '<div class="experiment">' +
        '<div class="exp-title">' + exp.title + '</div>' +
        '<div class="exp-instruction">' + exp.instruction + '</div>' +
        '<div class="card">' +
          '<div class="control-label">Kurbelgeschwindigkeit:</div>' +
          '<div class="slider-row mt-sm">' +
            '<span style="font-size:1.2rem">⚡</span>' +
            '<input type="range" class="slider-input" id="crank-slider" min="0" max="100" value="0">' +
            '<span class="slider-value" id="crank-value">0%</span>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="control-label">Schaltung:</div>' +
          '<div class="btn-row mt-sm">' +
            '<button class="btn btn-primary" id="crank-1lamp">1 Lampe</button>' +
            '<button class="btn btn-secondary" id="crank-2lamp">2 Lampen (parallel)</button>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="circuit-viz" id="crank-circuit" style="height:280px"></div>' +
        '</div>' +
        '<div class="voltage-row" id="crank-displays">' +
          '<div class="voltage-box speed"><div class="voltage-label">Kurbel</div><div class="voltage-value" id="disp-crank">0%</div></div>' +
          '<div class="voltage-box current"><div class="voltage-label">Spannung</div><div class="voltage-value" id="disp-cvolt">0 V</div></div>' +
          '<div class="voltage-box lamp"><div class="voltage-label">Lampe 1</div><div class="voltage-value" id="disp-cl1">Aus</div></div>' +
          '<div class="voltage-box lamp hidden" id="cl2-box"><div class="voltage-label">Lampe 2</div><div class="voltage-value" id="disp-cl2">Aus</div></div>' +
        '</div>' +
        '<div class="card">' +
          energyChainHTML([
            { cls: 'kinetic', label: 'Bewegung (Kurbel)' },
            { cls: 'electric', label: 'Elektrizität' },
            { cls: 'light', label: 'Licht' }
          ]) +
        '</div>' +
        '<div class="conclusion hidden" id="conclusion-c"><strong>Erkenntnis</strong>' + exp.conclusion + '</div>' +
      '</div>';

    var circuit = document.getElementById('crank-circuit');
    state.twoLamps = false;

    // Components
    circuit.innerHTML =
      // Crank visual with base
      '<div class="crank-container" id="crank-vis" style="left:3%;top:28%">' +
        '<div class="crank-handle">' +
          '<div class="crank-base"></div>' +
          '<div class="crank-arm"></div>' +
          '<div class="crank-knob"></div>' +
        '</div>' +
      '</div>' +
      // Drive shaft connecting crank to generator
      '<div id="c-shaft" style="position:absolute;left:calc(3% + 22px);top:calc(28% + 16px);width:calc(15% - 12px);height:4px;background:linear-gradient(90deg,#94a3b8,#78909c,#94a3b8);z-index:1;border-radius:2px;box-shadow:0 1px 2px rgba(0,0,0,0.15)"></div>' +
      // Generator with rotor
      '<div class="generator" id="c-gen" style="left:18%;top:26%">' +
        '<div class="generator-body" style="width:55px;height:40px">' +
          '<div class="generator-coils"></div>' +
          '<div class="generator-rotor"></div>' +
          '<span class="generator-symbol">G</span>' +
          '<div class="generator-terminal pos"></div>' +
          '<div class="generator-terminal neg"></div>' +
        '</div>' +
        '<div class="generator-label">Generator</div>' +
      '</div>' +
      // Bulb 1 with base
      '<div style="position:absolute;right:25%;top:24%;z-index:2" class="bulb-container" id="lamp1-grp">' +
        '<div class="bulb-glass off" id="c-bulb1"></div>' +
        '<div class="bulb-base"></div>' +
        '<span class="bulb-label">Lampe 1</span>' +
      '</div>' +
      // Bulb 2 (hidden initially) with base
      '<div style="position:absolute;right:8%;top:24%;z-index:2;display:none" class="bulb-container" id="lamp2-grp">' +
        '<div class="bulb-glass off" id="c-bulb2"></div>' +
        '<div class="bulb-base"></div>' +
        '<span class="bulb-label">Lampe 2</span>' +
      '</div>';

    var svgc = makeSVG(circuit);
    circuit.insertBefore(svgc, circuit.firstChild);

    requestAnimationFrame(function () {
      var genEl_ = document.getElementById('c-gen');
      var lamp1 = document.getElementById('lamp1-grp');
      var lamp2 = document.getElementById('lamp2-grp');
      if (genEl_ && lamp1) {
        var genBody = genEl_.querySelector('.generator-body');
        var gOff = connPt(circuit, genEl_, 0, 0);
        var gPosAbs = [gOff[0] + genBody.offsetWidth - 13, gOff[1]];
        var gNegAbs = [gOff[0] + genBody.offsetWidth - 13, gOff[1] + genBody.offsetHeight];
        var b1Pt = connPt(circuit, lamp1, 16, 0);
        var b1PtBot = connPt(circuit, lamp1, 16, 42);
        // Red wire: generator → top → across → down to lamp1
        drawWire(svgc, [gPosAbs, [gPosAbs[0], gPosAbs[1] - 25], [b1Pt[0], gPosAbs[1] - 25], b1Pt], '#dc2626');
        // Blue wire: generator → bottom → across → up to lamp1
        drawWire(svgc, [gNegAbs, [gNegAbs[0], gNegAbs[1] + 60], [b1PtBot[0], gNegAbs[1] + 60], b1PtBot], '#2563eb');
        // Wire extensions to lamp2 (parallel branch)
        if (lamp2) {
          var b2Pt = connPt(circuit, lamp2, 16, 0);
          var b2PtBot = connPt(circuit, lamp2, 16, 42);
          drawWire(svgc, [[b1Pt[0], gPosAbs[1] - 25], [b2Pt[0], gPosAbs[1] - 25], b2Pt], '#dc2626');
          drawWire(svgc, [[b1PtBot[0], gNegAbs[1] + 60], [b2PtBot[0], gNegAbs[1] + 60], b2PtBot], '#2563eb');
        }
      }
    });

    var slider = document.getElementById('crank-slider');
    var crankVal = document.getElementById('crank-value');
    var dispCrank = document.getElementById('disp-crank');
    var dispVolt = document.getElementById('disp-cvolt');
    var dispL1 = document.getElementById('disp-cl1');
    var dispL2 = document.getElementById('disp-cl2');
    var bulb1 = document.getElementById('c-bulb1');
    var bulb2 = document.getElementById('c-bulb2');
    var cl2Box = document.getElementById('cl2-box');
    var lamp2Grp = document.getElementById('lamp2-grp');
    var crankVis = document.getElementById('crank-vis');
    var cGen = document.getElementById('c-gen');
    var conc = document.getElementById('conclusion-c');
    var btn1 = document.getElementById('crank-1lamp');
    var btn2 = document.getElementById('crank-2lamp');
    var tested2 = false;

    function update() {
      var v = parseInt(slider.value) / 100;
      crankVal.textContent = Math.round(v * 100) + '%';
      dispCrank.textContent = Math.round(v * 100) + '%';

      var volt = (v * 6).toFixed(1);
      dispVolt.textContent = volt + ' V';

      if (v > 0.05) {
        crankVis.classList.add('crank-spinning');
        crankVis.style.setProperty('--spin-duration', spinDuration(v));
        cGen.classList.add('generator-spinning');
        cGen.style.setProperty('--spin-duration', spinDuration(v));
      } else {
        crankVis.classList.remove('crank-spinning');
        cGen.classList.remove('generator-spinning');
      }

      if (state.twoLamps) {
        var lampLev = Math.max(0, v * 0.65 - 0.05);
        var cls = bulbClass(lampLev);
        bulb1.className = 'bulb-glass ' + cls;
        bulb2.className = 'bulb-glass ' + cls;
        var txt = lampLev <= 0 ? 'Aus' : (lampLev < 0.35 ? 'Schwach' : (lampLev < 0.7 ? 'Mittel' : 'Hell'));
        dispL1.textContent = txt;
        dispL2.textContent = txt;
      } else {
        var lampLev2 = Math.max(0, v - 0.08);
        bulb1.className = 'bulb-glass ' + bulbClass(lampLev2);
        bulb2.className = 'bulb-glass off';
        dispL1.textContent = lampLev2 <= 0 ? 'Aus' : (lampLev2 < 0.35 ? 'Schwach' : (lampLev2 < 0.7 ? 'Mittel' : 'Hell'));
      }

      if (tested2 && v > 0.3) conc.classList.remove('hidden');
    }

    function setLamps(two) {
      state.twoLamps = two;
      btn1.className = 'btn ' + (two ? 'btn-secondary' : 'btn-primary');
      btn2.className = 'btn ' + (two ? 'btn-primary' : 'btn-secondary');
      cl2Box.classList.toggle('hidden', !two);
      lamp2Grp.style.display = two ? '' : 'none';
      if (two) tested2 = true;
      update();
    }

    addEvt(slider, 'input', update);
    addEvt(btn1, 'click', function () { setLamps(false); });
    addEvt(btn2, 'click', function () { setLamps(true); });
    setLamps(false);
    update();
  }

  /* ================================================================
     STATION III – HÖHENENERGIE → ELEKTRISCHE ENERGIE
     ================================================================ */
  function renderWeightGenerator(exp) {
    var main = container();
    main.innerHTML =
      '<div class="experiment">' +
        '<div class="exp-title">' + exp.title + '</div>' +
        '<div class="exp-instruction">' + exp.instruction + '</div>' +
        '<div class="card">' +
          '<div class="control-label">Anzahl Gewichtsstücke:</div>' +
          '<div class="btn-row mt-sm">' +
            '<button class="btn btn-secondary" id="w0">Kein Gewicht</button>' +
            '<button class="btn btn-secondary" id="w1">1 Gewicht</button>' +
            '<button class="btn btn-secondary" id="w2">2 Gewichte</button>' +
            '<button class="btn btn-secondary" id="w3">3 Gewichte</button>' +
          '</div>' +
          '<div class="btn-row mt-sm">' +
            '<button class="btn btn-secondary" id="w-reset" style="width:100%">Gewichte hochziehen (Reset)</button>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="circuit-viz" id="weight-circuit" style="height:320px"></div>' +
        '</div>' +
        '<div class="card">' +
          '<table class="results-table" id="weight-table">' +
            '<thead><tr><th>Gewichte</th><th>Lampe</th><th>Helligkeit</th></tr></thead>' +
            '<tbody id="weight-tbody"></tbody>' +
          '</table>' +
        '</div>' +
        '<div class="card">' +
          energyChainHTML([
            { cls: 'potential', label: 'Höhenenergie' },
            { cls: 'kinetic', label: 'Bewegung' },
            { cls: 'electric', label: 'Elektrizität' },
            { cls: 'light', label: 'Licht' }
          ]) +
        '</div>' +
        '<div class="conclusion hidden" id="conclusion-wt"><strong>Erkenntnis</strong>' + exp.conclusion + '</div>' +
      '</div>';

    var circuit = document.getElementById('weight-circuit');

    // Components
    circuit.innerHTML =
      // Pulley wheel at top
      '<div style="position:absolute;left:31%;top:14%;width:16px;height:16px;border-radius:50%;border:2.5px solid #64748b;background:radial-gradient(circle,#e2e8f0,#cbd5e1);z-index:2;box-shadow:0 1px 2px rgba(0,0,0,0.15)" id="wt-pulley"></div>' +
      // Rope from pulley to generator shaft
      '<div id="wt-rope-horiz" style="position:absolute;left:calc(31% + 16px);top:calc(14% + 7px);width:calc(7%);height:2.5px;background:#78716c;z-index:1;border-radius:1px"></div>' +
      // Generator on stand with rotor
      '<div class="generator" id="wt-gen" style="left:38%;top:8%;z-index:2">' +
        '<div class="generator-body" style="width:55px;height:40px">' +
          '<div class="generator-coils"></div>' +
          '<div class="generator-rotor"></div>' +
          '<span class="generator-symbol">G</span>' +
          '<div class="generator-terminal pos"></div>' +
          '<div class="generator-terminal neg"></div>' +
        '</div>' +
        '<div class="generator-label">Generator</div>' +
      '</div>' +
      // Stand with cross-brace
      '<div style="position:absolute;left:40%;top:25%;width:8px;height:55%;background:linear-gradient(90deg,#b0bec5,#94a3b8,#78909c);border-radius:2px;z-index:1;box-shadow:1px 0 2px rgba(0,0,0,0.1)"></div>' +
      '<div style="position:absolute;left:36%;top:50%;width:24px;height:4px;background:linear-gradient(180deg,#94a3b8,#78909c);border-radius:1px;z-index:1"></div>' +
      // Weight container
      '<div id="weight-group" style="position:absolute;left:22%;top:70%;display:flex;flex-direction:column;align-items:center;gap:2px;z-index:2;transition:top 1.5s ease-in"></div>' +
      // Bulb with base
      '<div style="position:absolute;right:15%;top:26%;z-index:2" class="bulb-container" id="wt-bulb-grp">' +
        '<div class="bulb-glass off" id="wt-bulb"></div>' +
        '<div class="bulb-base"></div>' +
        '<span class="bulb-label">Lampe</span>' +
      '</div>';

    var svgwt = makeSVG(circuit);
    circuit.insertBefore(svgwt, circuit.firstChild);

    // Draw rope and wires after layout
    requestAnimationFrame(function () {
      var pulley = document.getElementById('wt-pulley');
      var wGrp = document.getElementById('weight-group');
      var genEl_ = document.getElementById('wt-gen');
      var bulbGrp = document.getElementById('wt-bulb-grp');
      if (pulley && genEl_ && bulbGrp) {
        // Rope from pulley down to weight area
        var pulleyPt = connPt(circuit, pulley, 8, 16);
        var ropeBottom = [pulleyPt[0], circuit.offsetHeight * 0.75];
        drawWire(svgwt, [connPt(circuit, pulley, 8, 0), pulleyPt, ropeBottom], '#78716c');

        // Wires from generator to bulb
        var genBody = genEl_.querySelector('.generator-body');
        var gOff = connPt(circuit, genEl_, 0, 0);
        var gPosAbs = [gOff[0] + genBody.offsetWidth - 13, gOff[1]];
        var gNegAbs = [gOff[0] + genBody.offsetWidth - 13, gOff[1] + genBody.offsetHeight];
        var bPt = connPt(circuit, bulbGrp, 16, 0);
        var bPtBot = connPt(circuit, bulbGrp, 16, 42);
        drawWire(svgwt, [gPosAbs, [gPosAbs[0], gPosAbs[1] - 20], [bPt[0], gPosAbs[1] - 20], bPt], '#dc2626');
        drawWire(svgwt, [gNegAbs, [gNegAbs[0], circuit.offsetHeight * 0.88], [bPtBot[0], circuit.offsetHeight * 0.88], bPtBot], '#2563eb');
      }
    });

    var btns = {
      0: document.getElementById('w0'),
      1: document.getElementById('w1'),
      2: document.getElementById('w2'),
      3: document.getElementById('w3')
    };
    var resetBtn = document.getElementById('w-reset');
    var bulb = document.getElementById('wt-bulb');
    var weightGrp = document.getElementById('weight-group');
    var wtGen = document.getElementById('wt-gen');
    var wtPulley = document.getElementById('wt-pulley');
    var conc = document.getElementById('conclusion-wt');
    var tbody = document.getElementById('weight-tbody');
    var tested = {};
    var animTimer = null;
    var fallTimer = null;
    var currentWeights = 0;
    var weightsFallen = false;

    function setWeights(n) {
      currentWeights = n;
      weightsFallen = false;
      Object.keys(btns).forEach(function (k) {
        btns[k].className = 'btn ' + (parseInt(k) === n ? 'btn-primary' : 'btn-secondary');
      });

      // Draw weights
      var html = '';
      for (var i = 0; i < n; i++) {
        html += '<div style="width:30px;height:20px;background:linear-gradient(180deg,#78716c,#57534e);border:2px solid #44403c;border-radius:3px;display:flex;align-items:center;justify-content:center">' +
          '<span style="font-size:0.5rem;font-weight:700;color:#fafaf9">' + (i + 1) + '</span></div>';
      }
      if (n === 0) {
        html = '<span style="font-size:0.7rem;color:var(--text-sec)">—</span>';
      }
      weightGrp.innerHTML = html;

      // Start at top
      weightGrp.style.transition = 'none';
      weightGrp.style.top = '28%';
      if (animTimer) clearTimeout(animTimer);
      if (fallTimer) clearTimeout(fallTimer);

      if (n > 0) {
        // Start falling after brief pause
        animTimer = setTimeout(function () {
          weightGrp.style.transition = 'top 1.5s ease-in';
          weightGrp.style.top = '72%';
        }, 50);
        // Spin generator and pulley during fall
        var fallSpeed = n * 0.3;
        wtGen.classList.add('generator-spinning');
        wtGen.style.setProperty('--spin-duration', spinDuration(fallSpeed));
        wtPulley.style.animation = 'motorSpin ' + spinDuration(fallSpeed) + ' linear infinite';

        // Lamp brightness based on weight count
        var levels = [0, 0.3, 0.6, 0.95];
        var v = levels[n];
        bulb.className = 'bulb-glass ' + bulbClass(v);

        // Stop generator when weights reach bottom (after 1.5s fall animation)
        fallTimer = setTimeout(function () {
          weightsFallen = true;
          wtGen.classList.remove('generator-spinning');
          wtPulley.style.animation = 'none';
          bulb.className = 'bulb-glass off';
        }, 1600);

        var names = ['Aus', 'Schwach', 'Mittel', 'Hell'];
        tested[n] = true;
        var rowId = 'wr-' + n;
        if (!document.getElementById(rowId)) {
          var tr = document.createElement('tr');
          tr.id = rowId;
          tr.innerHTML = '<td>' + n + ' Gewicht' + (n > 1 ? 'e' : '') + '</td><td>' + bulbClass(v) + '</td><td>' + names[n] + '</td>';
          tbody.appendChild(tr);
        }
      } else {
        wtGen.classList.remove('generator-spinning');
        wtPulley.style.animation = 'none';
        bulb.className = 'bulb-glass off';
      }

      if (tested[1] && tested[2] && tested[3]) conc.classList.remove('hidden');
    }

    function resetWeights() {
      if (animTimer) clearTimeout(animTimer);
      if (fallTimer) clearTimeout(fallTimer);
      wtGen.classList.remove('generator-spinning');
      wtPulley.style.animation = 'none';
      bulb.className = 'bulb-glass off';
      weightsFallen = false;

      // Animate weights back up
      weightGrp.style.transition = 'top 1s ease-out';
      weightGrp.style.top = '28%';

      // Reset button states
      Object.keys(btns).forEach(function (k) {
        btns[k].className = 'btn btn-secondary';
      });
      currentWeights = 0;
    }

    Object.keys(btns).forEach(function (k) {
      addEvt(btns[k], 'click', function () { setWeights(parseInt(k)); });
    });
    addEvt(resetBtn, 'click', resetWeights);
    setWeights(0);
  }

  /* ================================================================
     STATION IV – ENERGIE BEIM FÖHN
     ================================================================ */
  function renderHairdryerEnergy(exp) {
    var main = container();
    main.innerHTML =
      '<div class="experiment">' +
        '<div class="exp-title">' + exp.title + '</div>' +
        '<div class="exp-instruction">' + exp.instruction + '</div>' +
        '<div class="card">' +
          '<div class="control-row">' +
            '<div class="control-label">Föhnstufe:</div>' +
            '<button class="btn btn-secondary" id="fd-off">Aus</button>' +
            '<button class="btn btn-secondary" id="fd-s1">Stufe I</button>' +
            '<button class="btn btn-secondary" id="fd-s2">Stufe II</button>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="control-row">' +
            '<div class="control-label">Messdauer:</div>' +
            '<button class="btn btn-secondary" id="fd-30">30 s</button>' +
            '<button class="btn btn-primary" id="fd-60">60 s</button>' +
            '<button class="btn btn-secondary" id="fd-120">120 s</button>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="circuit-viz" id="dryer-circuit" style="height:220px"></div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="voltage-row">' +
            '<div class="voltage-box source"><div class="voltage-label">Leistung</div><div class="voltage-value" id="disp-power">0 W</div></div>' +
            '<div class="voltage-box current"><div class="voltage-label">Zeit</div><div class="voltage-value" id="disp-time">0 s</div></div>' +
            '<div class="voltage-box energy"><div class="voltage-label">Energie</div><div class="voltage-value" id="disp-energy">0 Wh</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<button class="btn btn-primary" id="fd-start" style="width:100%">Messung starten</button>' +
          '<div class="speed-bar-container mt-sm">' +
            '<span class="speed-bar-label">Fortschritt</span>' +
            '<div class="speed-bar-track"><div class="speed-bar-fill" id="fd-progress" style="width:0%"></div></div>' +
            '<span class="speed-bar-label" id="fd-pct">0%</span>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<table class="results-table">' +
            '<thead><tr><th>Stufe</th><th>Dauer</th><th>Leistung</th><th>Energie</th></tr></thead>' +
            '<tbody id="fd-tbody"></tbody>' +
          '</table>' +
        '</div>' +
        '<div class="conclusion hidden" id="conclusion-fd"><strong>Erkenntnis</strong>' + exp.conclusion + '</div>' +
      '</div>';

    var circuit = document.getElementById('dryer-circuit');

    // Components
    circuit.innerHTML =
      // Hairdryer with enhanced details
      '<div class="hairdryer" id="s4-dryer" style="left:8%;top:26%">' +
        '<div class="hairdryer-body">' +
          '<span class="hairdryer-label">Föhn</span>' +
          '<div class="hairdryer-switch"></div>' +
          '<div class="hairdryer-nozzle"></div>' +
        '</div>' +
        '<div class="hairdryer-handle"></div>' +
      '</div>' +
      // Energy meter
      '<div class="energy-meter" id="s4-meter" style="right:12%;top:22%">' +
        '<div class="energy-meter-body">' +
          '<div class="energy-meter-display" id="meter-disp">0.0 Wh</div>' +
          '<div class="energy-meter-label">Energiezähler</div>' +
        '</div>' +
      '</div>';

    var svgd = makeSVG(circuit);
    circuit.insertBefore(svgd, circuit.firstChild);

    requestAnimationFrame(function () {
      var dryer = document.getElementById('s4-dryer');
      var meter = document.getElementById('s4-meter');
      if (dryer && meter) {
        var dryerR = connPt(circuit, dryer, 70, 10);
        var dryerRBot = connPt(circuit, dryer, 70, 30);
        var meterL = connPt(circuit, meter, 0, 10);
        var meterLBot = connPt(circuit, meter, 0, 40);
        drawWire(svgd, [dryerR, [dryerR[0], dryerR[1] - 20], [meterL[0], dryerR[1] - 20], meterL], '#dc2626');
        drawWire(svgd, [dryerRBot, [dryerRBot[0], dryerRBot[1] + 30], [meterLBot[0], dryerRBot[1] + 30], meterLBot], '#2563eb');
      }
    });

    var stufe = 0;
    var dauer = 60;
    var measuring = false;
    var timer = null;
    var elapsed = 0;

    var powers = { 0: 0, 1: 1000, 2: 2000 };
    var stufeBtns = { off: document.getElementById('fd-off'), s1: document.getElementById('fd-s1'), s2: document.getElementById('fd-s2') };
    var dauerBtns = { 30: document.getElementById('fd-30'), 60: document.getElementById('fd-60'), 120: document.getElementById('fd-120') };
    var startBtn = document.getElementById('fd-start');
    var dispPow = document.getElementById('disp-power');
    var dispTime = document.getElementById('disp-time');
    var dispEnergy = document.getElementById('disp-energy');
    var progress = document.getElementById('fd-progress');
    var pctLabel = document.getElementById('fd-pct');
    var meterDisp = document.getElementById('meter-disp');
    var tbody = document.getElementById('fd-tbody');
    var conc = document.getElementById('conclusion-fd');
    var measurements = 0;

    function setStufe(s) {
      stufe = s;
      stufeBtns.off.className = 'btn ' + (s === 0 ? 'btn-primary' : 'btn-secondary');
      stufeBtns.s1.className = 'btn ' + (s === 1 ? 'btn-primary' : 'btn-secondary');
      stufeBtns.s2.className = 'btn ' + (s === 2 ? 'btn-primary' : 'btn-secondary');
      dispPow.textContent = powers[s] + ' W';
    }

    function setDauer(d) {
      dauer = d;
      Object.keys(dauerBtns).forEach(function (k) {
        dauerBtns[k].className = 'btn ' + (parseInt(k) === d ? 'btn-primary' : 'btn-secondary');
      });
    }

    function stopMeasure() {
      measuring = false;
      if (timer) { clearInterval(timer); timer = null; }
      startBtn.textContent = 'Messung starten';
      startBtn.disabled = false;
    }

    function startMeasure() {
      if (stufe === 0) return;
      if (measuring) { stopMeasure(); return; }

      measuring = true;
      elapsed = 0;
      startBtn.textContent = 'Messung läuft...';

      var totalSec = dauer;
      var power = powers[stufe];
      var step = 100;

      timer = setInterval(function () {
        elapsed += step / 1000;
        var pct = Math.min(100, (elapsed / totalSec) * 100);
        progress.style.width = pct + '%';
        pctLabel.textContent = Math.round(pct) + '%';
        dispTime.textContent = elapsed.toFixed(1) + ' s';

        var energyWh = (power * elapsed / 3600).toFixed(2);
        dispEnergy.textContent = energyWh + ' Wh';
        meterDisp.textContent = energyWh + ' Wh';

        if (elapsed >= totalSec) {
          stopMeasure();
          var finalEnergy = (power * totalSec / 3600).toFixed(2);

          var tr = document.createElement('tr');
          tr.innerHTML = '<td>Stufe ' + stufe + '</td><td>' + totalSec + ' s</td><td>' + power + ' W</td><td>' + finalEnergy + ' Wh</td>';
          tbody.appendChild(tr);
          measurements++;

          if (measurements >= 3) conc.classList.remove('hidden');
        }
      }, step);
    }

    addEvt(stufeBtns.off, 'click', function () { if (!measuring) setStufe(0); });
    addEvt(stufeBtns.s1, 'click', function () { if (!measuring) setStufe(1); });
    addEvt(stufeBtns.s2, 'click', function () { if (!measuring) setStufe(2); });
    addEvt(dauerBtns[30], 'click', function () { if (!measuring) setDauer(30); });
    addEvt(dauerBtns[60], 'click', function () { if (!measuring) setDauer(60); });
    addEvt(dauerBtns[120], 'click', function () { if (!measuring) setDauer(120); });
    addEvt(startBtn, 'click', startMeasure);

    setStufe(0);
    setDauer(60);
  }

  /* ===== INIT ===== */
  function init() {
    buildTabs();
    switchExperiment(EXPERIMENTS[0].id);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
