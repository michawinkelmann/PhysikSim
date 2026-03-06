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
      instruction: 'Beobachte den frei aufgehängten Magneten. Er richtet sich in Nord-Süd-Richtung aus. Bestimme, welcher Pol nach Norden und welcher nach Süden zeigt.',
      type: 'compass-align',
      conclusion: 'Ein frei aufgehängter Magnet richtet sich immer in Nord-Süd-Richtung aus. Das Ende, das nach Norden zeigt, heißt Nordpol (rot). Das Ende, das nach Süden zeigt, heißt Südpol (blau).'
    },
    c: {
      id: 'c',
      tab: 'C: Gegenseitig',
      title: 'C: Wer wirkt auf wen?',
      instruction: 'Teste beide Richtungen: Bewege den Magneten zum Eisen und dann das Eisen zum Magneten. Beobachte, was jeweils passiert.',
      type: 'mutual-attraction',
      conclusion: 'Die Anziehung zwischen Magnet und Eisen ist gegenseitig. Der Magnet zieht das Eisen an – aber das Eisen zieht auch den Magneten an. Beide wirken aufeinander.'
    },
    d: {
      id: 'd',
      tab: 'D: Zwei Magnete',
      title: 'D: Zwei Magnete wirken aufeinander',
      instruction: 'Bewege den oberen Magneten langsam auf den unteren zu. Teste alle vier Polkombinationen und beobachte, ob sich die Magnete anziehen oder abstoßen.',
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
    Object.keys(EXPERIMENTS).forEach(function (key) {
      var exp = EXPERIMENTS[key];
      var btn = document.createElement('button');
      btn.className = 'tab';
      btn.textContent = exp.tab;
      btn.setAttribute('role', 'tab');
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
    });
    resetState(key);
    var container = document.getElementById('experiment-container');
    container.innerHTML = '';
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
      state = { aligned: false, northIdentified: false, southIdentified: false };
    } else if (exp.type === 'mutual-attraction') {
      state = { tested: {}, animating: false };
    } else if (exp.type === 'pole-interaction') {
      state = { tested: {}, animating: false, magnetPos: 0 };
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
        '<div class="zone-nail" id="zone-nail">' +
          '<div class="nail-icon"></div>' +
          '<span>Eisennagel</span>' +
        '</div>' +
      '</div>';
    root.appendChild(vizCard);

    // Instruction steps
    var stepsCard = document.createElement('div');
    stepsCard.className = 'card';
    stepsCard.innerHTML =
      '<div class="steps-list">' +
        '<div class="step-item"><span class="step-num">Schritt 1:</span> Lege die Büroklammern auf den Tisch.</div>' +
        '<div class="step-item"><span class="step-num">Schritt 2:</span> Halte den Stabmagneten waagerecht und nähere ihn den Büroklammern.</div>' +
        '<div class="step-item"><span class="step-num">Schritt 3:</span> Lege den Stabmagneten auf den Tisch.</div>' +
        '<div class="step-item"><span class="step-num">Schritt 4:</span> Nähere die Spitze des Eisennagels langsam der Mitte des Magneten.</div>' +
      '</div>';
    root.appendChild(stepsCard);

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

    // Build zone hit areas
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

    // Highlight zone button
    var btns = document.querySelectorAll('.zone-btn');
    btns[index].classList.add('testing');

    // Highlight zone area on magnet
    var areas = document.querySelectorAll('.zone-area');
    areas[index].classList.add('active');

    // Show clips animation
    var clipsContainer = document.getElementById('zone-clips');
    clipsContainer.innerHTML = '';

    setTimeout(function () {
      // Show clips at this zone position
      for (var c = 0; c < zone.clips; c++) {
        var clip = document.createElement('div');
        clip.className = 'zone-clip';
        clip.style.left = (zone.position * 25) + '%';
        clip.style.animationDelay = (c * 0.08) + 's';
        clip.style.transform = 'translateX(-50%) rotate(' + (Math.random() * 40 - 20) + 'deg)';
        clipsContainer.appendChild(clip);
      }

      if (zone.clips === 0) {
        var noClip = document.createElement('div');
        noClip.className = 'zone-no-clip';
        noClip.style.left = (zone.position * 25) + '%';
        noClip.textContent = 'keine';
        clipsContainer.appendChild(noClip);
      }

      // Record result
      setTimeout(function () {
        state.tested[index] = zone.clips;
        btns[index].classList.remove('testing');
        btns[index].classList.add(zone.clips > 0 ? 'tested-strong' : 'tested-weak');

        // Add result badge
        var badge = document.createElement('span');
        badge.className = 'zone-btn-badge';
        badge.textContent = zone.clips > 0 ? zone.clips + ' Klammern' : 'keine';
        btns[index].appendChild(badge);

        // Update results table
        updateZoneResults();

        // Progress
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

  // ==================== B: COMPASS ALIGN ====================

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
        // Stand
        '<div class="cs-stand-base"></div>' +
        '<div class="cs-stand-rod"></div>' +
        '<div class="cs-stand-arm"></div>' +
        // Thread
        '<div class="cs-thread" id="cs-thread"></div>' +
        // Magnet (will rotate)
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
        // Status
        '<div class="cs-status" id="cs-status">Der Magnet dreht sich...</div>' +
      '</div>';
    root.appendChild(vizCard);

    // Instruction steps
    var stepsCard = document.createElement('div');
    stepsCard.className = 'card';
    stepsCard.innerHTML =
      '<div class="steps-list">' +
        '<div class="step-item"><span class="step-num">Schritt 1:</span> Hänge den Magneten mit einem Bindfaden an ein Stativ.</div>' +
        '<div class="step-item"><span class="step-num">Schritt 2:</span> Warte solange, bis der Magnet sich nicht mehr bewegt.</div>' +
        '<div class="step-item"><span class="step-num">Schritt 3:</span> Bestimme die Himmelsrichtungen, in die die Pole des Magneten zeigen.</div>' +
      '</div>';
    root.appendChild(stepsCard);

    // Buttons for identification
    var idCard = document.createElement('div');
    idCard.className = 'card';
    idCard.id = 'identify-card';
    idCard.style.display = 'none';
    idCard.innerHTML =
      '<div style="font-weight:600;font-size:0.9rem;margin-bottom:0.75rem">Welcher Pol zeigt nach Norden?</div>' +
      '<div class="btn-row">' +
        '<button class="btn btn-primary" id="btn-n-north">Der rote Pol (N)</button>' +
        '<button class="btn btn-secondary" id="btn-s-north">Der blaue Pol (S)</button>' +
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

    // Start animation: magnet swings and aligns
    startCompassAnimation();

    document.getElementById('reset-btn').addEventListener('click', function () {
      switchExperiment('b');
    });
  }

  function startCompassAnimation() {
    var magnetEl = document.getElementById('cs-magnet');
    var statusEl = document.getElementById('cs-status');

    // Start with a random rotation
    var startAngle = 120 + Math.random() * 120;
    magnetEl.style.transform = 'rotate(' + startAngle + 'deg)';

    // Animate to 0 (aligned N-S) after a delay
    setTimeout(function () {
      magnetEl.style.transition = 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      magnetEl.style.transform = 'rotate(0deg)';

      setTimeout(function () {
        state.aligned = true;
        statusEl.textContent = 'Der Magnet hat sich ausgerichtet.';
        statusEl.classList.add('aligned');

        // Show identification question
        document.getElementById('identify-card').style.display = 'block';

        document.getElementById('btn-n-north').addEventListener('click', function () {
          handlePoleAnswer(true);
        });
        document.getElementById('btn-s-north').addEventListener('click', function () {
          handlePoleAnswer(false);
        });
      }, 3200);
    }, 800);
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
    } else {
      feedback.className = 'identify-feedback incorrect';
      feedback.textContent = 'Nicht ganz. Schau genau hin: Welches Ende zeigt in Richtung „N" (Norden)?';
    }
  }

  // ==================== C: MUTUAL ATTRACTION ====================

  var MUTUAL_TESTS = [
    { id: 'magnet-to-iron', label: 'Magnet bewegt sich zum Eisen', moverIsLeft: true },
    { id: 'iron-to-magnet', label: 'Eisen bewegt sich zum Magneten', moverIsLeft: false }
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
        // Table surface
        '<div class="mutual-table"></div>' +
        // Left rollers
        '<div class="mutual-roller mutual-roller-l1"></div>' +
        '<div class="mutual-roller mutual-roller-l2"></div>' +
        // Right rollers
        '<div class="mutual-roller mutual-roller-r1"></div>' +
        '<div class="mutual-roller mutual-roller-r2"></div>' +
        // Left object (magnet)
        '<div class="mutual-obj mutual-left" id="mutual-left">' +
          '<div class="mutual-magnet">' +
            '<div class="magnet-n">N</div><div class="magnet-s">S</div>' +
          '</div>' +
          '<span class="mutual-label">Magnet</span>' +
        '</div>' +
        // Right object (iron block)
        '<div class="mutual-obj mutual-right" id="mutual-right">' +
          '<div class="mutual-iron"></div>' +
          '<span class="mutual-label">Eisenquader</span>' +
        '</div>' +
        // Status
        '<div class="mutual-status" id="mutual-status">Wähle einen Versuch</div>' +
      '</div>';
    root.appendChild(vizCard);

    // Instruction steps
    var stepsCard = document.createElement('div');
    stepsCard.className = 'card';
    stepsCard.innerHTML =
      '<div class="steps-list">' +
        '<div class="step-item"><span class="step-num">Schritt 1:</span> Lege den Eisenquader auf zwei Bleistifte.</div>' +
        '<div class="step-item"><span class="step-num">Schritt 2:</span> Bewege den Magneten mit einem Pol langsam auf das Ende des Eisenquaders zu.</div>' +
        '<div class="step-item"><span class="step-num">Schritt 3:</span> Lege nun den Magneten auf die Bleistifte.</div>' +
        '<div class="step-item"><span class="step-num">Schritt 4:</span> Bewege das Ende des Eisenquaders langsam auf einen Pol des Magneten zu.</div>' +
      '</div>';
    root.appendChild(stepsCard);

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
        runMutualTest(i);
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

  function runMutualTest(index) {
    if (state.animating) return;
    state.animating = true;

    var test = MUTUAL_TESTS[index];
    var leftEl = document.getElementById('mutual-left');
    var rightEl = document.getElementById('mutual-right');
    var statusEl = document.getElementById('mutual-status');

    // Reset positions
    leftEl.classList.remove('moved');
    rightEl.classList.remove('moved');

    // Highlight button
    var btns = document.querySelectorAll('.mutual-test-btn');
    btns.forEach(function (b) { b.classList.remove('active-test'); });
    btns[index].classList.add('active-test');

    statusEl.textContent = 'Beobachte...';

    setTimeout(function () {
      if (test.moverIsLeft) {
        // Magnet moves toward iron -> iron also rolls toward magnet
        leftEl.classList.add('moved');
        setTimeout(function () {
          rightEl.classList.add('moved');
          statusEl.textContent = 'Auch das Eisen bewegt sich zum Magneten!';
          finishMutualTest(index);
        }, 400);
      } else {
        // Iron moves toward magnet -> magnet also rolls toward iron
        rightEl.classList.add('moved');
        setTimeout(function () {
          leftEl.classList.add('moved');
          statusEl.textContent = 'Auch der Magnet bewegt sich zum Eisen!';
          finishMutualTest(index);
        }, 400);
      }
    }, 500);
  }

  function finishMutualTest(index) {
    state.tested[index] = true;
    state.animating = false;

    // Update button
    var btns = document.querySelectorAll('.mutual-test-btn');
    btns[index].classList.add('tested');

    // Update results
    var resCard = document.getElementById('results-card');
    resCard.style.display = 'block';
    var resDiv = document.getElementById('mutual-results');
    resDiv.innerHTML = '';

    Object.keys(state.tested).forEach(function (k) {
      var test = MUTUAL_TESTS[parseInt(k)];
      var item = document.createElement('div');
      item.className = 'mutual-result-item';
      if (test.moverIsLeft) {
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

  // ==================== D: POLE INTERACTION ====================

  var POLE_COMBOS = [
    { id: 'nn', topPole: 'N', bottomPole: 'N', topLabel: 'Nordpol', bottomLabel: 'Nordpol', attracts: false },
    { id: 'sn', topPole: 'S', bottomPole: 'N', topLabel: 'Südpol', bottomLabel: 'Nordpol', attracts: true },
    { id: 'ns', topPole: 'N', bottomPole: 'S', topLabel: 'Nordpol', bottomLabel: 'Südpol', attracts: true },
    { id: 'ss', topPole: 'S', bottomPole: 'S', topLabel: 'Südpol', bottomLabel: 'Südpol', attracts: false }
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
        // Table with rollers
        '<div class="pole-table"></div>' +
        '<div class="pole-roller pole-roller-1"></div>' +
        '<div class="pole-roller pole-roller-2"></div>' +
        // Bottom magnet (stationary, on rollers)
        '<div class="pole-bottom" id="pole-bottom">' +
          '<div class="pole-magnet-h">' +
            '<div class="pole-n" id="bottom-left">N</div>' +
            '<div class="pole-s" id="bottom-right">S</div>' +
          '</div>' +
        '</div>' +
        // Top magnet (movable)
        '<div class="pole-top" id="pole-top">' +
          '<div class="pole-magnet-h">' +
            '<div class="pole-n" id="top-left">N</div>' +
            '<div class="pole-s" id="top-right">S</div>' +
          '</div>' +
          '<div class="pole-hand">&#9995;</div>' +
        '</div>' +
        // Result indicator
        '<div class="pole-result-indicator hidden" id="pole-result-indicator"></div>' +
        // Status
        '<div class="pole-status" id="pole-status">Wähle eine Polkombination</div>' +
      '</div>';
    root.appendChild(vizCard);

    // Instruction steps
    var stepsCard = document.createElement('div');
    stepsCard.className = 'card';
    stepsCard.innerHTML =
      '<div class="steps-list">' +
        '<div class="step-item"><span class="step-num">Schritt 1:</span> Lege einen Stabmagneten auf zwei Bleistifte.</div>' +
        '<div class="step-item"><span class="step-num">Schritt 2:</span> Bewege den zweiten Stabmagneten mit dem Nordpol langsam auf den Nordpol des liegenden Magneten zu.</div>' +
        '<div class="step-item"><span class="step-num">Schritt 3:</span> Bewege den zweiten Stabmagneten mit dem Südpol langsam auf den Nordpol des liegenden Magneten zu.</div>' +
        '<div class="step-item"><span class="step-num">Schritt 4:</span> Nähere nun nacheinander die Pole des zweiten Magneten dem Südpol des liegenden Magneten.</div>' +
      '</div>';
    root.appendChild(stepsCard);

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
          '<span class="combo-pole ' + (combo.topPole === 'N' ? 'pole-red' : 'pole-blue') + '">' + combo.topPole + '</span>' +
          '<span class="combo-arrow">→</span>' +
          '<span class="combo-pole ' + (combo.bottomPole === 'N' ? 'pole-red' : 'pole-blue') + '">' + combo.bottomPole + '</span>' +
        '</span>' +
        '<span class="combo-desc">' + combo.topLabel + ' → ' + combo.bottomLabel + '</span>';
      btn.addEventListener('click', function () {
        testPoleCombo(i);
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

  function testPoleCombo(index) {
    if (state.animating) return;
    state.animating = true;

    var combo = POLE_COMBOS[index];
    var topEl = document.getElementById('pole-top');
    var bottomEl = document.getElementById('pole-bottom');
    var statusEl = document.getElementById('pole-status');
    var indicator = document.getElementById('pole-result-indicator');

    // Update magnet labels based on orientation
    var topLeft = document.getElementById('top-left');
    var topRight = document.getElementById('top-right');

    // The approaching pole is on the right side of the top magnet
    if (combo.topPole === 'N') {
      topLeft.textContent = 'S';
      topLeft.className = 'pole-s';
      topRight.textContent = 'N';
      topRight.className = 'pole-n';
    } else {
      topLeft.textContent = 'N';
      topLeft.className = 'pole-n';
      topRight.textContent = 'S';
      topRight.className = 'pole-s';
    }

    // Bottom magnet: approaching pole is on the left
    var bottomLeft = document.getElementById('bottom-left');
    var bottomRight = document.getElementById('bottom-right');
    if (combo.bottomPole === 'N') {
      bottomLeft.textContent = 'N';
      bottomLeft.className = 'pole-n';
      bottomRight.textContent = 'S';
      bottomRight.className = 'pole-s';
    } else {
      bottomLeft.textContent = 'S';
      bottomLeft.className = 'pole-s';
      bottomRight.textContent = 'N';
      bottomRight.className = 'pole-n';
    }

    // Reset positions
    topEl.classList.remove('approach', 'repelled');
    bottomEl.classList.remove('repelled');
    indicator.classList.add('hidden');

    // Highlight combo button
    var btns = document.querySelectorAll('.combo-btn');
    btns.forEach(function (b) { b.classList.remove('active'); });
    btns[index].classList.add('active');

    statusEl.textContent = 'Magnet nähert sich...';

    setTimeout(function () {
      topEl.classList.add('approach');

      setTimeout(function () {
        if (combo.attracts) {
          // Attraction: bottom magnet rolls toward top
          bottomEl.classList.add('attracted');
          statusEl.textContent = 'Anziehung! Die Magnete ziehen sich an.';
          indicator.textContent = 'Anziehung';
          indicator.className = 'pole-result-indicator attract';
        } else {
          // Repulsion: bottom magnet rolls away, top bounces back
          topEl.classList.add('repelled');
          bottomEl.classList.add('repelled');
          statusEl.textContent = 'Abstoßung! Die Magnete stoßen sich ab.';
          indicator.textContent = 'Abstoßung';
          indicator.className = 'pole-result-indicator repel';
        }

        // Record result
        setTimeout(function () {
          if (state.tested[index] === undefined) {
            state.tested[index] = combo.attracts;

            btns[index].classList.add(combo.attracts ? 'tested-attract' : 'tested-repel');

            // Update results table
            updatePoleResults();

            // Progress
            var tested = Object.keys(state.tested).length;
            document.getElementById('progress-text').textContent = tested + ' / 4 getestet';
            document.getElementById('progress-fill').style.width = (tested / 4 * 100) + '%';

            if (tested === 4) {
              document.getElementById('conclusion').classList.remove('hidden');
            }
          }

          state.animating = false;
        }, 400);
      }, 800);
    }, 300);
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
