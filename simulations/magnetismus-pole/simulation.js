(function () {
  'use strict';

  // ==================== DATA ====================

  var EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'A: Stabmagnet',
      title: 'A: Ein Stabmagnet wird genauer untersucht',
      instruction: 'Tippe auf die verschiedenen Stellen des Stabmagneten, um Büroklammern anzunähern. Beobachte, wo die meisten Büroklammern haften bleiben.',
      type: 'magnet-zones',
      conclusion: 'An den Enden (Polen) eines Magneten ist die magnetische Wirkung am stärksten. In der Mitte des Magneten ist die Wirkung am schwächsten.'
    },
    b: {
      id: 'b',
      tab: 'B: Pole bestimmen',
      title: 'B: Die Pole werden bestimmt',
      instruction: 'Stupse den aufgehängten Magneten an oder drehe ihn mit dem Finger. Er richtet sich immer wieder in Nord-Süd-Richtung aus. Bestimme danach, welcher Pol nach Norden zeigt.',
      type: 'compass-align',
      conclusion: 'Ein frei aufgehängter Magnet richtet sich immer in Nord-Süd-Richtung aus. Das Ende, das nach Norden zeigt, heißt Nordpol (rot). Das Ende, das nach Süden zeigt, heißt Südpol (grün).'
    },
    c: {
      id: 'c',
      tab: 'C: Gegenseitig',
      title: 'C: Wer wirkt auf wen?',
      instruction: 'Ziehe den Magneten zum Eisenquader oder den Eisenquader zum Magneten. Beobachte, was jeweils passiert.',
      type: 'mutual-attraction',
      conclusion: 'Die Anziehung zwischen Magnet und Eisen ist gegenseitig. Der Magnet zieht das Eisen an – aber das Eisen zieht auch den Magneten an. Beide wirken aufeinander.'
    },
    d: {
      id: 'd',
      tab: 'D: Zwei Magnete',
      title: 'D: Zwei Magnete wirken aufeinander',
      instruction: 'Wähle eine Polkombination und ziehe den linken Magneten langsam zum rechten. Beobachte, ob sie sich anziehen oder abstoßen.',
      type: 'pole-interaction',
      conclusion: 'Gleichnamige Pole (Nordpol–Nordpol oder Südpol–Südpol) stoßen sich ab. Ungleichnamige Pole (Nordpol–Südpol) ziehen sich an.'
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

  // ==================== TABS ====================

  function buildTabs() {
    var tabs = document.getElementById('tabs');
    tabs.setAttribute('role', 'tablist');
    Object.keys(EXPERIMENTS).forEach(function (key) {
      var exp = EXPERIMENTS[key];
      var btn = document.createElement('button');
      btn.className = 'tab';
      btn.textContent = exp.tab;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('data-exp', key);
      btn.addEventListener('click', function () {
        switchExperiment(key);
      });
      tabs.appendChild(btn);
    });
  }

  function switchExperiment(key) {
    currentExp = key;
    cleanupFns.forEach(function (fn) { fn(); });
    cleanupFns = [];
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-exp') === key);
      t.setAttribute('aria-selected', t.getAttribute('data-exp') === key);
    });
    resetState(key);
    var container = document.getElementById('experiment-container');
    container.innerHTML = '';
    container.setAttribute('role', 'tabpanel');
    var exp = EXPERIMENTS[key];
    if (exp.type === 'magnet-zones') renderMagnetZones(container, exp);
    else if (exp.type === 'compass-align') renderCompassAlign(container, exp);
    else if (exp.type === 'mutual-attraction') renderMutualAttraction(container, exp);
    else if (exp.type === 'pole-interaction') renderPoleInteraction(container, exp);
  }

  function resetState(key) {
    var exp = EXPERIMENTS[key];
    if (exp.type === 'magnet-zones') {
      state = { tested: {}, testing: false };
    } else if (exp.type === 'compass-align') {
      state = { angle: 150, angularVel: 0, dragging: false, aligned: false, answered: false };
    } else if (exp.type === 'mutual-attraction') {
      state = { tested: {}, animating: false, dragging: false, currentTest: -1 };
    } else if (exp.type === 'pole-interaction') {
      state = { tested: {}, dragging: false, currentCombo: 0 };
    }
  }

  // ==================== A: MAGNET ZONES ====================

  var ZONES = [
    { id: 'left-end', label: 'Nordpol (Ende links)', position: 0, clips: 5 },
    { id: 'left-mid', label: 'Links der Mitte', position: 1, clips: 2 },
    { id: 'center', label: 'Mitte', position: 2, clips: 0 },
    { id: 'right-mid', label: 'Rechts der Mitte', position: 3, clips: 2 },
    { id: 'right-end', label: 'Südpol (Ende rechts)', position: 4, clips: 5 }
  ];

  function renderMagnetZones(container, exp) {
    var root = document.createElement('div');
    root.className = 'experiment';

    root.innerHTML =
      '<h2 class="exp-title">' + exp.title + '</h2>' +
      '<p class="exp-instruction">' + exp.instruction + '</p>';

    // Magnet visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    vizCard.innerHTML =
      '<div class="zone-viz" id="zone-viz">' +
        '<div class="zone-magnet">' +
          '<div class="zone-magnet-n">N</div>' +
          '<div class="zone-magnet-body"></div>' +
          '<div class="zone-magnet-s">S</div>' +
        '</div>' +
        '<div class="zone-areas" id="zone-areas"></div>' +
        '<div class="zone-clips-container" id="zone-clips"></div>' +
      '</div>';
    root.appendChild(vizCard);

    // Zone buttons
    var zoneCard = document.createElement('div');
    zoneCard.className = 'card';
    zoneCard.innerHTML = '<div style="margin-bottom:0.5rem;font-weight:600;font-size:0.9rem">Stelle am Magneten auswählen:</div>';
    var zoneGrid = document.createElement('div');
    zoneGrid.className = 'zone-btn-grid';

    ZONES.forEach(function (zone, i) {
      var btn = document.createElement('button');
      btn.className = 'zone-btn';
      btn.setAttribute('data-index', i);
      btn.textContent = zone.label;
      btn.addEventListener('click', function () {
        testZone(exp, i);
      });
      zoneGrid.appendChild(btn);
    });
    zoneCard.appendChild(zoneGrid);
    root.appendChild(zoneCard);

    // Progress
    var progressDiv = document.createElement('div');
    progressDiv.className = 'progress-bar';
    progressDiv.id = 'progress';
    progressDiv.innerHTML =
      '<span id="progress-text">0 / ' + ZONES.length + ' getestet</span>' +
      '<div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>';
    root.appendChild(progressDiv);

    // Results
    var resCard = document.createElement('div');
    resCard.className = 'card';
    resCard.id = 'results-card';
    resCard.style.display = 'none';
    resCard.innerHTML =
      '<table class="results-table">' +
        '<thead><tr><th>Stelle</th><th>Büroklammern</th><th>Stärke</th></tr></thead>' +
        '<tbody id="results-body"></tbody>' +
      '</table>';
    root.appendChild(resCard);

    // Conclusion
    var conc = document.createElement('div');
    conc.className = 'conclusion hidden';
    conc.id = 'conclusion';
    conc.innerHTML = '<strong>Erkenntnis</strong>' + exp.conclusion;
    root.appendChild(conc);

    // Reset
    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-md';
    btnRow.innerHTML = '<button class="btn btn-secondary" id="reset-btn">Zurücksetzen</button>';
    root.appendChild(btnRow);

    container.appendChild(root);

    buildZoneAreas();

    document.getElementById('reset-btn').addEventListener('click', function () {
      switchExperiment('a');
    });
  }

  function buildZoneAreas() {
    var areasContainer = document.getElementById('zone-areas');
    ZONES.forEach(function (zone, i) {
      var area = document.createElement('div');
      area.className = 'zone-area';
      area.setAttribute('data-zone', i);
      area.addEventListener('click', function () {
        testZone(EXPERIMENTS.a, i);
      });
      areasContainer.appendChild(area);
    });
  }

  function testZone(exp, index) {
    if (state.testing || state.tested[index] !== undefined) return;
    state.testing = true;

    var zone = ZONES[index];
    var btns = document.querySelectorAll('.zone-btn');
    btns[index].classList.add('testing');

    var areas = document.querySelectorAll('.zone-area');
    areas[index].classList.add('active');

    var clipsContainer = document.getElementById('zone-clips');
    clipsContainer.innerHTML = '';

    setTimeout(function () {
      for (var c = 0; c < zone.clips; c++) {
        var clip = document.createElement('div');
        clip.className = 'zone-clip';
        var baseLeft = zone.position * 25;
        // Spread clips visually so count is distinguishable
        var spread = zone.clips > 1 ? (c - (zone.clips - 1) / 2) * 3.5 : 0;
        clip.style.left = (baseLeft + spread) + '%';
        clip.style.animationDelay = (c * 0.1) + 's';
        var rotation = Math.random() * 30 - 15;
        clip.style.setProperty('--clip-rotation', rotation + 'deg');
        // Use SVG paper clip shape
        clip.innerHTML =
          '<svg viewBox="0 0 14 32" width="14" height="32" class="clip-svg">' +
            '<path d="M4,2 C2,2 1,3.5 1,5 L1,24 C1,27.5 3.5,30 7,30 C10.5,30 13,27.5 13,24 L13,8 C13,5.5 11.5,4 9.5,4 C7.5,4 6,5.5 6,8 L6,22 C6,23.5 6.8,24.5 8,24.5 C9.2,24.5 10,23.5 10,22 L10,8" ' +
              'fill="none" stroke="#78716c" stroke-width="1.5" stroke-linecap="round"/>' +
          '</svg>';
        clipsContainer.appendChild(clip);
      }

      if (zone.clips === 0) {
        var noClip = document.createElement('div');
        noClip.className = 'zone-no-clip';
        noClip.style.left = (zone.position * 25) + '%';
        noClip.textContent = 'keine';
        clipsContainer.appendChild(noClip);
      }

      setTimeout(function () {
        state.tested[index] = zone.clips;
        btns[index].classList.remove('testing');
        btns[index].classList.add(zone.clips > 0 ? 'tested-strong' : 'tested-weak');

        var badge = document.createElement('span');
        badge.className = 'zone-btn-badge';
        badge.textContent = zone.clips > 0 ? zone.clips + ' Klammern' : 'keine';
        btns[index].appendChild(badge);

        updateZoneResults();

        var tested = Object.keys(state.tested).length;
        document.getElementById('progress-text').textContent = tested + ' / ' + ZONES.length + ' getestet';
        document.getElementById('progress-fill').style.width = (tested / ZONES.length * 100) + '%';

        if (tested === ZONES.length) {
          document.getElementById('conclusion').classList.remove('hidden');
        }

        state.testing = false;
      }, 500);
    }, 200);
  }

  function updateZoneResults() {
    var tbody = document.getElementById('results-body');
    var card = document.getElementById('results-card');
    card.style.display = 'block';
    tbody.innerHTML = '';

    var keys = Object.keys(state.tested).sort(function (a, b) { return parseInt(a) - parseInt(b); });
    keys.forEach(function (k) {
      var zone = ZONES[parseInt(k)];
      var clips = state.tested[k];
      var strength = clips >= 5 ? 'sehr stark' : clips >= 2 ? 'mittel' : 'sehr schwach';
      var strengthClass = clips >= 5 ? 'result-strong' : clips >= 2 ? 'result-medium' : 'result-weak';
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + zone.label + '</td>' +
        '<td>' + clips + '</td>' +
        '<td class="' + strengthClass + '">' + strength + '</td>';
      tbody.appendChild(tr);
    });
  }

  // ==================== B: COMPASS ALIGN (Physics-based pendulum) ====================

  function renderCompassAlign(container, exp) {
    var root = document.createElement('div');
    root.className = 'experiment';

    root.innerHTML =
      '<h2 class="exp-title">' + exp.title + '</h2>' +
      '<p class="exp-instruction">' + exp.instruction + '</p>';

    // Hanging magnet visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    vizCard.style.padding = '0';
    vizCard.innerHTML =
      '<div class="compass-setup" id="compass-setup">' +
        // Stand (Stativ) – rod on left, horizontal arm to center
        '<div class="cs-stand-base"></div>' +
        '<div class="cs-stand-rod"></div>' +
        '<div class="cs-stand-arm"></div>' +
        '<div class="cs-stand-clamp"></div>' +
        // Thread from end of arm
        '<div class="cs-thread" id="cs-thread"></div>' +
        // Magnet (will rotate via physics)
        '<div class="cs-magnet-wrapper" id="cs-magnet">' +
          '<div class="cs-magnet">' +
            '<div class="cs-magnet-n" id="cs-pole-n">N</div>' +
            '<div class="cs-magnet-s" id="cs-pole-s">S</div>' +
          '</div>' +
        '</div>' +
        // Compass directions
        '<div class="cs-direction cs-north">N</div>' +
        '<div class="cs-direction cs-south">S</div>' +
        '<div class="cs-direction cs-east">O</div>' +
        '<div class="cs-direction cs-west">W</div>' +
        // Hint
        '<div class="cs-status" id="cs-status">Stupse den Magneten an!</div>' +
      '</div>';
    root.appendChild(vizCard);

    // Buttons for identification (hidden until first alignment)
    var idCard = document.createElement('div');
    idCard.className = 'card';
    idCard.id = 'identify-card';
    idCard.style.display = 'none';
    idCard.innerHTML =
      '<div style="font-weight:600;font-size:0.9rem;margin-bottom:0.75rem">Welcher Pol zeigt nach Norden?</div>' +
      '<div class="btn-row">' +
        '<button class="btn btn-primary" id="btn-n-north">Der rote Pol (N)</button>' +
        '<button class="btn btn-secondary" id="btn-s-north">Der grüne Pol (S)</button>' +
      '</div>' +
      '<div class="identify-feedback hidden" id="identify-feedback"></div>';
    root.appendChild(idCard);

    // Conclusion
    var conc = document.createElement('div');
    conc.className = 'conclusion hidden';
    conc.id = 'conclusion';
    conc.innerHTML = '<strong>Erkenntnis</strong>' + exp.conclusion;
    root.appendChild(conc);

    // Reset
    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-md';
    btnRow.innerHTML = '<button class="btn btn-secondary" id="reset-btn">Zurücksetzen</button>';
    root.appendChild(btnRow);

    container.appendChild(root);

    initCompassPhysics();

    document.getElementById('reset-btn').addEventListener('click', function () {
      switchExperiment('b');
    });
  }

  function initCompassPhysics() {
    var magnetEl = document.getElementById('cs-magnet');
    var setupEl = document.getElementById('compass-setup');
    var statusEl = document.getElementById('cs-status');

    // Physics constants
    var damping = 0.97;       // friction/air resistance
    var springK = 0.0008;     // restoring torque toward equilibrium
    var equilibrium = 90;     // N pole (left end) points up = North
    var angle = -60 + Math.random() * 100; // start angle (degrees), away from equilibrium
    var angularVel = 0;
    var animId = null;
    var dragging = false;
    var lastPointerAngle = 0;
    var lastTime = 0;
    var wasNudged = false;
    var alignedOnce = false;

    state.angle = angle;

    function updateMagnet() {
      magnetEl.style.transform = 'translateX(-50%) rotate(' + angle + 'deg)';
    }

    updateMagnet();

    // Physics loop
    function tick() {
      if (!dragging) {
        // Restoring torque toward equilibrium (-90°, N pole points North)
        var deltaAngle = (angle - equilibrium) * Math.PI / 180;
        var torque = -springK * Math.sin(deltaAngle) * 180;
        angularVel += torque;
        angularVel *= damping;
        angle += angularVel;

        // Normalize angle
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;

        updateMagnet();

        // Check if settled (nearly still and near equilibrium)
        if (wasNudged && Math.abs(angle - equilibrium) < 3 && Math.abs(angularVel) < 0.05) {
          if (!alignedOnce) {
            alignedOnce = true;
            statusEl.textContent = 'Der Magnet hat sich ausgerichtet.';
            statusEl.classList.add('aligned');
            // Show question
            document.getElementById('identify-card').style.display = 'block';
            setupAnswerListeners();
          }
        }
      }
      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);

    // Pointer interaction: drag to rotate
    function getPointerAngle(e) {
      var rect = setupEl.getBoundingClientRect();
      // Pivot point: where the thread meets the magnet (center-x of setup, below arm)
      var cx = rect.left + rect.width * 0.52;
      var cy = rect.top + 130; // pivot point (top of magnet wrapper)
      var dx = e.clientX - cx;
      var dy = e.clientY - cy;
      return Math.atan2(dx, dy) * 180 / Math.PI; // angle from vertical
    }

    function onPointerDown(e) {
      if (state.answered) return;
      dragging = true;
      wasNudged = true;
      lastPointerAngle = getPointerAngle(e);
      lastTime = Date.now();
      magnetEl.setPointerCapture(e.pointerId);
      e.preventDefault();
      statusEl.textContent = 'Drehe den Magneten...';
      statusEl.classList.remove('aligned');
    }

    function onPointerMove(e) {
      if (!dragging) return;
      var newPointerAngle = getPointerAngle(e);
      var delta = newPointerAngle - lastPointerAngle;
      // Handle wrap-around
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      angle -= delta;
      var now = Date.now();
      var dt = Math.max(1, now - lastTime);
      angularVel = -delta / dt * 16; // Approximate velocity

      lastPointerAngle = newPointerAngle;
      lastTime = now;
      updateMagnet();
    }

    function onPointerUp() {
      dragging = false;
      statusEl.textContent = 'Der Magnet schwingt zurück...';
    }

    magnetEl.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    cleanupFns.push(function () {
      cancelAnimationFrame(animId);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    });
  }

  function setupAnswerListeners() {
    document.getElementById('btn-n-north').addEventListener('click', function () {
      handlePoleAnswer(true);
    });
    document.getElementById('btn-s-north').addEventListener('click', function () {
      handlePoleAnswer(false);
    });
  }

  function handlePoleAnswer(choseNorth) {
    var feedback = document.getElementById('identify-feedback');
    feedback.classList.remove('hidden');

    if (choseNorth) {
      feedback.className = 'identify-feedback correct';
      feedback.textContent = 'Richtig! Der Nordpol (rot) des Magneten zeigt nach Norden. Daher kommt auch sein Name: Nordpol = „nord-suchender Pol".';
      document.getElementById('conclusion').classList.remove('hidden');
      document.getElementById('btn-n-north').disabled = true;
      document.getElementById('btn-s-north').disabled = true;
      state.answered = true;
    } else {
      feedback.className = 'identify-feedback incorrect';
      feedback.textContent = 'Nicht ganz. Schau genau hin: Welches Ende zeigt in Richtung „N" (Norden)?';
    }
  }

  // ==================== C: MUTUAL ATTRACTION (Drag-based) ====================

  var MUTUAL_TESTS = [
    { id: 'magnet-to-iron', label: 'Schiebe den Magneten zum Eisen', dragLeft: true },
    { id: 'iron-to-magnet', label: 'Schiebe das Eisen zum Magneten', dragLeft: false }
  ];

  function renderMutualAttraction(container, exp) {
    var root = document.createElement('div');
    root.className = 'experiment';

    root.innerHTML =
      '<h2 class="exp-title">' + exp.title + '</h2>' +
      '<p class="exp-instruction">' + exp.instruction + '</p>';

    // Visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    vizCard.style.padding = '0';
    vizCard.innerHTML =
      '<div class="mutual-setup" id="mutual-setup">' +
        '<div class="mutual-track"></div>' +
        '<div class="mutual-obj mutual-left" id="mutual-left">' +
          '<div class="mutual-magnet">' +
            '<div class="magnet-n">N</div><div class="magnet-s">S</div>' +
          '</div>' +
          '<span class="mutual-label">Magnet</span>' +
          '<div class="mutual-rollers">' +
            '<div class="mutual-wheel" id="wheel-l1"></div>' +
            '<div class="mutual-wheel" id="wheel-l2"></div>' +
          '</div>' +
        '</div>' +
        '<div class="mutual-obj mutual-right" id="mutual-right">' +
          '<div class="mutual-iron"></div>' +
          '<span class="mutual-label">Eisenquader</span>' +
          '<div class="mutual-rollers">' +
            '<div class="mutual-wheel" id="wheel-r1"></div>' +
            '<div class="mutual-wheel" id="wheel-r2"></div>' +
          '</div>' +
        '</div>' +
        '<div class="mutual-status" id="mutual-status">Wähle einen Versuch und ziehe</div>' +
      '</div>';
    root.appendChild(vizCard);

    // Test buttons
    var testCard = document.createElement('div');
    testCard.className = 'card';
    testCard.innerHTML = '<div style="font-weight:600;font-size:0.9rem;margin-bottom:0.75rem">Versuch auswählen:</div>';
    var testGrid = document.createElement('div');
    testGrid.className = 'mutual-btn-grid';

    MUTUAL_TESTS.forEach(function (test, i) {
      var btn = document.createElement('button');
      btn.className = 'btn btn-primary mutual-test-btn';
      btn.setAttribute('data-index', i);
      btn.textContent = test.label;
      btn.addEventListener('click', function () {
        selectMutualTest(i);
      });
      testGrid.appendChild(btn);
    });
    testCard.appendChild(testGrid);
    root.appendChild(testCard);

    // Results
    var resCard = document.createElement('div');
    resCard.className = 'card';
    resCard.id = 'results-card';
    resCard.style.display = 'none';
    resCard.innerHTML =
      '<div style="font-weight:600;font-size:0.9rem;margin-bottom:0.5rem">Beobachtungen</div>' +
      '<div id="mutual-results"></div>';
    root.appendChild(resCard);

    // Conclusion
    var conc = document.createElement('div');
    conc.className = 'conclusion hidden';
    conc.id = 'conclusion';
    conc.innerHTML = '<strong>Erkenntnis</strong>' + exp.conclusion;
    root.appendChild(conc);

    // Reset
    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-md';
    btnRow.innerHTML = '<button class="btn btn-secondary" id="reset-btn">Zurücksetzen</button>';
    root.appendChild(btnRow);

    container.appendChild(root);

    document.getElementById('reset-btn').addEventListener('click', function () {
      switchExperiment('c');
    });
  }

  function selectMutualTest(index) {
    var test = MUTUAL_TESTS[index];
    state.currentTest = index;

    // Reset positions
    var leftEl = document.getElementById('mutual-left');
    var rightEl = document.getElementById('mutual-right');
    var setupEl = document.getElementById('mutual-setup');
    var statusEl = document.getElementById('mutual-status');

    leftEl.style.transition = 'none';
    rightEl.style.transition = 'none';
    leftEl.style.left = '15%';
    leftEl.style.right = 'auto';
    rightEl.style.left = '75%';
    rightEl.style.right = 'auto';
    leftEl.classList.remove('draggable');
    rightEl.classList.remove('draggable');

    // Highlight button
    var btns = document.querySelectorAll('.mutual-test-btn');
    btns.forEach(function (b) { b.classList.remove('active-test'); });
    btns[index].classList.add('active-test');

    // Make the right element draggable
    var dragEl = test.dragLeft ? leftEl : rightEl;
    var otherEl = test.dragLeft ? rightEl : leftEl;
    dragEl.classList.add('draggable');

    statusEl.textContent = test.dragLeft ? 'Ziehe den Magneten →' : '← Ziehe das Eisen';

    // Setup drag
    initMutualDrag(setupEl, dragEl, otherEl, test.dragLeft, index);
  }

  function initMutualDrag(setupEl, dragEl, otherEl, dragIsLeft, testIndex) {
    // Clean up previous drag listeners
    cleanupFns.forEach(function (fn) { fn(); });
    cleanupFns = [];

    var dragging = false;
    var startX = 0;
    var startLeft = 0;
    var snapped = false;
    var attractAnimId = null;
    var otherPos = dragIsLeft ? 75 : 15; // initial position of other element in %
    var dragPos = dragIsLeft ? 15 : 75; // current position of dragged element in %
    var wheelRotation = 0;
    var otherWheelRotation = 0;

    // Set other element to explicit left position
    otherEl.style.left = otherPos + '%';
    otherEl.style.right = 'auto';

    function updateWheelRotation(el, delta, isOther) {
      if (isOther) {
        otherWheelRotation += delta * 8;
        var wheels = el.querySelectorAll('.mutual-wheel');
        wheels.forEach(function (w) {
          w.style.transform = 'rotate(' + otherWheelRotation + 'deg)';
        });
      } else {
        wheelRotation += delta * 8;
        var wheels = el.querySelectorAll('.mutual-wheel');
        wheels.forEach(function (w) {
          w.style.transform = 'rotate(' + wheelRotation + 'deg)';
        });
      }
    }

    // Continuous animation loop for the non-dragged object
    function attractionLoop() {
      if (snapped) return;

      var dragCenter = dragPos + 5;
      var otherCenter = otherPos + 5;
      var gap = Math.abs(otherCenter - dragCenter);

      if (gap < 25 && gap > 3) {
        var attractionStrength = (25 - gap) / 25;
        var moveStep = attractionStrength * 0.4;
        if (dragIsLeft) {
          otherPos -= moveStep;
        } else {
          otherPos += moveStep;
        }
        otherEl.style.left = otherPos + '%';
        otherEl.style.right = 'auto';
        updateWheelRotation(otherEl, dragIsLeft ? -moveStep : moveStep, true);

        // Re-check gap after movement for snap
        otherCenter = otherPos + 5;
        gap = Math.abs(otherCenter - dragCenter);
      }

      if (gap <= 3 && gap > 0) {
        snapped = true;
        dragging = false;
        if (dragIsLeft) {
          otherEl.style.transition = 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
          otherEl.style.left = (dragPos + 10) + '%';
        } else {
          otherEl.style.transition = 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
          otherEl.style.left = (dragPos - 10) + '%';
        }

        var statusEl = document.getElementById('mutual-status');
        if (dragIsLeft) {
          statusEl.textContent = 'Das Eisen rollt zum Magneten!';
        } else {
          statusEl.textContent = 'Der Magnet rollt zum Eisen!';
        }

        finishMutualTest(testIndex);
        return;
      }

      attractAnimId = requestAnimationFrame(attractionLoop);
    }

    attractAnimId = requestAnimationFrame(attractionLoop);

    function onPointerDown(e) {
      if (snapped) return;
      dragging = true;
      var rect = setupEl.getBoundingClientRect();
      startX = e.clientX;
      startLeft = dragEl.getBoundingClientRect().left - rect.left;
      dragEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging || snapped) return;
      var rect = setupEl.getBoundingClientRect();
      var dx = e.clientX - startX;
      var newLeft = startLeft + dx;
      var pct = (newLeft / rect.width) * 100;
      pct = Math.max(5, Math.min(85, pct));

      var oldPct = dragPos;
      dragPos = pct;
      dragEl.style.left = pct + '%';
      dragEl.style.right = 'auto';
      updateWheelRotation(dragEl, pct - oldPct, false);
    }

    function onPointerUp() {
      dragging = false;
    }

    dragEl.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    cleanupFns.push(function () {
      if (attractAnimId) cancelAnimationFrame(attractAnimId);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    });
  }

  function finishMutualTest(index) {
    state.tested[index] = true;

    var btns = document.querySelectorAll('.mutual-test-btn');
    btns[index].classList.add('tested');

    var resCard = document.getElementById('results-card');
    resCard.style.display = 'block';
    var resDiv = document.getElementById('mutual-results');
    resDiv.innerHTML = '';

    Object.keys(state.tested).forEach(function (k) {
      var test = MUTUAL_TESTS[parseInt(k)];
      var item = document.createElement('div');
      item.className = 'mutual-result-item';
      if (test.dragLeft) {
        item.innerHTML = '<span class="shield-dot pass"></span> Magnet nähert sich → Eisen rollt auch zum Magneten';
      } else {
        item.innerHTML = '<span class="shield-dot pass"></span> Eisen nähert sich → Magnet rollt auch zum Eisen';
      }
      resDiv.appendChild(item);
    });

    if (Object.keys(state.tested).length >= 2) {
      document.getElementById('conclusion').classList.remove('hidden');
    }
  }

  // ==================== D: POLE INTERACTION (Drag-based) ====================

  var POLE_COMBOS = [
    { id: 'nn', topPole: 'N', bottomPole: 'N', topLabel: 'Nordpol', bottomLabel: 'Nordpol', attracts: false, leftLabel: 'N →', rightLabel: '← N' },
    { id: 'sn', topPole: 'S', bottomPole: 'N', topLabel: 'Südpol', bottomLabel: 'Nordpol', attracts: true, leftLabel: 'S →', rightLabel: '← N' },
    { id: 'ns', topPole: 'N', bottomPole: 'S', topLabel: 'Nordpol', bottomLabel: 'Südpol', attracts: true, leftLabel: 'N →', rightLabel: '← S' },
    { id: 'ss', topPole: 'S', bottomPole: 'S', topLabel: 'Südpol', bottomLabel: 'Südpol', attracts: false, leftLabel: 'S →', rightLabel: '← S' }
  ];

  function renderPoleInteraction(container, exp) {
    var root = document.createElement('div');
    root.className = 'experiment';

    root.innerHTML =
      '<h2 class="exp-title">' + exp.title + '</h2>' +
      '<p class="exp-instruction">' + exp.instruction + '</p>';

    // Visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    vizCard.style.padding = '0';
    vizCard.innerHTML =
      '<div class="pole-setup" id="pole-setup">' +
        '<div class="pole-track"></div>' +
        '<div class="pole-left" id="pole-left" style="left:15%">' +
          '<div class="pole-hand">&#9995;</div>' +
          '<div class="pole-magnet-h">' +
            '<div class="pole-n" id="top-left">N</div>' +
            '<div class="pole-s" id="top-right">S</div>' +
          '</div>' +
          '<div class="pole-wheels">' +
            '<div class="pole-wh" id="pw-l1"></div>' +
            '<div class="pole-wh" id="pw-l2"></div>' +
          '</div>' +
        '</div>' +
        '<div class="pole-right" id="pole-right">' +
          '<div class="pole-magnet-h">' +
            '<div class="pole-n" id="bottom-left">N</div>' +
            '<div class="pole-s" id="bottom-right">S</div>' +
          '</div>' +
          '<div class="pole-wheels">' +
            '<div class="pole-wh" id="pw-r1"></div>' +
            '<div class="pole-wh" id="pw-r2"></div>' +
          '</div>' +
        '</div>' +
        '<div class="pole-result-indicator hidden" id="pole-result-indicator"></div>' +
        '<div class="pole-status" id="pole-status">Wähle eine Polkombination</div>' +
      '</div>';
    root.appendChild(vizCard);

    // Combination selector
    var comboCard = document.createElement('div');
    comboCard.className = 'card';
    comboCard.innerHTML = '<div style="font-weight:600;font-size:0.9rem;margin-bottom:0.75rem">Polkombination auswählen:</div>';
    var comboGrid = document.createElement('div');
    comboGrid.className = 'combo-grid';

    POLE_COMBOS.forEach(function (combo, i) {
      var btn = document.createElement('button');
      btn.className = 'combo-btn';
      btn.setAttribute('data-index', i);
      btn.innerHTML =
        '<span class="combo-poles">' +
          '<span class="combo-pole ' + (combo.topPole === 'N' ? 'pole-red' : 'pole-green') + '">' + combo.topPole + '</span>' +
          '<span class="combo-arrow">→</span>' +
          '<span class="combo-pole ' + (combo.bottomPole === 'N' ? 'pole-red' : 'pole-green') + '">' + combo.bottomPole + '</span>' +
        '</span>' +
        '<span class="combo-desc">' + combo.topLabel + ' → ' + combo.bottomLabel + '</span>';
      btn.addEventListener('click', function () {
        selectPoleCombo(i);
      });
      comboGrid.appendChild(btn);
    });
    comboCard.appendChild(comboGrid);
    root.appendChild(comboCard);

    // Progress
    var progressDiv = document.createElement('div');
    progressDiv.className = 'progress-bar';
    progressDiv.id = 'progress';
    progressDiv.innerHTML =
      '<span id="progress-text">0 / 4 getestet</span>' +
      '<div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>';
    root.appendChild(progressDiv);

    // Results table
    var resCard = document.createElement('div');
    resCard.className = 'card';
    resCard.id = 'results-card';
    resCard.style.display = 'none';
    resCard.innerHTML =
      '<table class="results-table">' +
        '<thead><tr><th>Gegenüberliegende Pole</th><th>Ergebnis</th></tr></thead>' +
        '<tbody id="results-body"></tbody>' +
      '</table>';
    root.appendChild(resCard);

    // Conclusion
    var conc = document.createElement('div');
    conc.className = 'conclusion hidden';
    conc.id = 'conclusion';
    conc.innerHTML = '<strong>Erkenntnis</strong>' + exp.conclusion;
    root.appendChild(conc);

    // Reset
    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-md';
    btnRow.innerHTML = '<button class="btn btn-secondary" id="reset-btn">Zurücksetzen</button>';
    root.appendChild(btnRow);

    container.appendChild(root);

    document.getElementById('reset-btn').addEventListener('click', function () {
      switchExperiment('d');
    });
  }

  function selectPoleCombo(index) {
    var combo = POLE_COMBOS[index];
    state.currentCombo = index;

    var leftEl = document.getElementById('pole-left');
    var rightEl = document.getElementById('pole-right');
    var statusEl = document.getElementById('pole-status');
    var indicator = document.getElementById('pole-result-indicator');

    // Reset positions
    leftEl.style.left = '15%';
    leftEl.style.transition = 'none';
    rightEl.style.left = '70%';
    rightEl.style.transition = 'none';
    indicator.classList.add('hidden');

    // Update magnet pole labels - left magnet: the facing pole (right side) is topPole
    var topLeft = document.getElementById('top-left');
    var topRight = document.getElementById('top-right');
    if (combo.topPole === 'N') {
      topLeft.textContent = 'S'; topLeft.className = 'pole-s';
      topRight.textContent = 'N'; topRight.className = 'pole-n';
    } else {
      topLeft.textContent = 'N'; topLeft.className = 'pole-n';
      topRight.textContent = 'S'; topRight.className = 'pole-s';
    }

    // Right magnet: the facing pole (left side) is bottomPole
    var bottomLeft = document.getElementById('bottom-left');
    var bottomRight = document.getElementById('bottom-right');
    if (combo.bottomPole === 'N') {
      bottomLeft.textContent = 'N'; bottomLeft.className = 'pole-n';
      bottomRight.textContent = 'S'; bottomRight.className = 'pole-s';
    } else {
      bottomLeft.textContent = 'S'; bottomLeft.className = 'pole-s';
      bottomRight.textContent = 'N'; bottomRight.className = 'pole-n';
    }

    // Highlight button
    var btns = document.querySelectorAll('.combo-btn');
    btns.forEach(function (b) { b.classList.remove('active'); });
    btns[index].classList.add('active');

    statusEl.textContent = 'Ziehe den linken Magneten →';

    // Setup drag for left magnet
    initPoleDrag(index);
  }

  function initPoleDrag(comboIndex) {
    // Remove old drag listeners
    cleanupFns.forEach(function (fn) { fn(); });
    cleanupFns = [];

    var combo = POLE_COMBOS[comboIndex];
    var leftEl = document.getElementById('pole-left');
    var rightEl = document.getElementById('pole-right');
    var setupEl = document.getElementById('pole-setup');
    var statusEl = document.getElementById('pole-status');
    var indicator = document.getElementById('pole-result-indicator');

    var dragging = false;
    var startX = 0;
    var startLeftPx = 0;
    var triggered = false;
    var rightPos = 70; // initial right magnet position in %
    var leftPos = 15; // current left magnet position in %
    var wheelRotation = 0;
    var rightWheelRotation = 0;
    var animId = null;

    function updateWheels(el, delta, isRight) {
      if (isRight) {
        rightWheelRotation += delta * 8;
        var wheels = el.querySelectorAll('.pole-wh');
        wheels.forEach(function (w) {
          w.style.transform = 'rotate(' + rightWheelRotation + 'deg)';
        });
      } else {
        wheelRotation += delta * 8;
        var wheels = el.querySelectorAll('.pole-wh');
        wheels.forEach(function (w) {
          w.style.transform = 'rotate(' + wheelRotation + 'deg)';
        });
      }
    }

    function finishInteraction() {
      triggered = true;
      dragging = false;

      if (combo.attracts) {
        leftEl.style.transition = 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
        rightEl.style.transition = 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
        rightEl.style.left = (leftPos + 14) + '%';
        statusEl.textContent = 'Anziehung! Die Magnete ziehen sich an.';
        indicator.textContent = 'Anziehung';
        indicator.className = 'pole-result-indicator attract';
      } else {
        leftEl.style.transition = 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        rightEl.style.transition = 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        leftEl.style.left = '5%';
        rightEl.style.left = '85%';
        statusEl.textContent = 'Abstoßung! Die Magnete stoßen sich ab.';
        indicator.textContent = 'Abstoßung';
        indicator.className = 'pole-result-indicator repel';
      }

      if (state.tested[comboIndex] === undefined) {
        state.tested[comboIndex] = combo.attracts;

        var btns = document.querySelectorAll('.combo-btn');
        btns[comboIndex].classList.add(combo.attracts ? 'tested-attract' : 'tested-repel');

        updatePoleResults();

        var tested = Object.keys(state.tested).length;
        document.getElementById('progress-text').textContent = tested + ' / 4 getestet';
        document.getElementById('progress-fill').style.width = (tested / 4 * 100) + '%';

        if (tested === 4) {
          document.getElementById('conclusion').classList.remove('hidden');
        }
      }
    }

    // Continuous animation loop for the right magnet
    function physicsLoop() {
      if (triggered) return;

      var leftRight = leftPos + 13;
      var gap = rightPos - leftRight;

      if (gap < 25 && gap > 2) {
        var strength = (25 - gap) / 25;
        var moveStep = strength * 0.35;
        if (combo.attracts) {
          rightPos -= moveStep;
          updateWheels(rightEl, -moveStep, true);
        } else {
          rightPos += moveStep;
          rightPos = Math.min(88, rightPos);
          updateWheels(rightEl, moveStep, true);
        }
        rightEl.style.left = rightPos + '%';

        // Re-check gap
        gap = rightPos - (leftPos + 13);
      }

      if (gap <= 2 && combo.attracts) {
        finishInteraction();
        return;
      }

      animId = requestAnimationFrame(physicsLoop);
    }

    animId = requestAnimationFrame(physicsLoop);

    function onPointerDown(e) {
      if (triggered) return;
      dragging = true;
      var rect = setupEl.getBoundingClientRect();
      startX = e.clientX;
      startLeftPx = leftEl.getBoundingClientRect().left - rect.left;
      leftEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging || triggered) return;
      var rect = setupEl.getBoundingClientRect();
      var dx = e.clientX - startX;
      var newLeft = startLeftPx + dx;
      var pct = (newLeft / rect.width) * 100;
      pct = Math.max(5, Math.min(80, pct));

      var oldPct = leftPos;
      leftPos = pct;
      leftEl.style.left = pct + '%';
      updateWheels(leftEl, pct - oldPct, false);

      // Check snap for repulsion (needs to happen during drag)
      var gap = rightPos - (leftPos + 13);
      if (gap < 3 && !combo.attracts) {
        finishInteraction();
      }
    }

    function onPointerUp() {
      dragging = false;
    }

    leftEl.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    cleanupFns.push(function () {
      if (animId) cancelAnimationFrame(animId);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    });
  }

  function updatePoleResults() {
    var tbody = document.getElementById('results-body');
    var card = document.getElementById('results-card');
    card.style.display = 'block';
    tbody.innerHTML = '';

    var keys = Object.keys(state.tested).sort(function (a, b) { return parseInt(a) - parseInt(b); });
    keys.forEach(function (k) {
      var combo = POLE_COMBOS[parseInt(k)];
      var attracts = state.tested[k];
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + combo.topLabel + ' – ' + combo.bottomLabel + '</td>' +
        '<td class="' + (attracts ? 'result-attract' : 'result-repel') + '">' +
          (attracts ? 'Anziehung' : 'Abstoßung') +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  // ==================== START ====================

  document.addEventListener('DOMContentLoaded', init);
})();
