(function () {
  'use strict';

  // ==================== DATA ====================

  const EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'A: Stoffe',
      title: 'A: Welche Stoffe werden von einem Magneten angezogen?',
      instruction: 'Tippe auf einen Gegenstand, um ihn mit dem Magneten zu testen.',
      type: 'magnet-test',
      conclusion: 'Von einem Magneten werden nur Gegenst\u00e4nde angezogen, die aus Eisen, Stahl, Nickel oder Cobalt bestehen. Diese Stoffe nennt man ferromagnetisch.',
      objects: [
        { name: 'Lineal', material: 'Kunststoff', magnetic: false, color: '#eab308' },
        { name: 'B\u00fcroklammer', material: 'Stahl', magnetic: true, color: '#94a3b8' },
        { name: 'Radiergummi', material: 'Gummi', magnetic: false, color: '#ec4899' },
        { name: '1-Cent-M\u00fcnze', material: 'Stahl (verkupfert)', magnetic: true, color: '#b45309' },
        { name: 'Nagel', material: 'Eisen', magnetic: true, color: '#64748b' },
        { name: 'Kugelschreiber', material: 'Kunststoff', magnetic: false, color: '#3b82f6' },
        { name: 'Schl\u00fcssel', material: 'Stahl', magnetic: true, color: '#a1a1aa' },
        { name: 'Alufolie', material: 'Aluminium', magnetic: false, color: '#cbd5e1' },
        { name: 'Glasmurmel', material: 'Glas', magnetic: false, color: '#67e8f9' },
        { name: 'Holzst\u00e4bchen', material: 'Holz', magnetic: false, color: '#a16207' }
      ]
    },
    b: {
      id: 'b',
      tab: 'B: Metalle',
      title: 'B: Welche Metalle werden von einem Magneten angezogen?',
      instruction: 'Tippe auf einen metallischen Gegenstand, um ihn mit dem Magneten zu testen.',
      type: 'magnet-test',
      conclusion: 'Nicht alle Metalle sind magnetisch. Nur die ferromagnetischen Metalle Eisen, Nickel und Cobalt (sowie deren Legierungen wie Stahl) werden von einem Magneten angezogen.',
      objects: [
        { name: 'Kupferdraht', material: 'Kupfer', magnetic: false, color: '#b45309' },
        { name: 'Silberkette', material: 'Silber', magnetic: false, color: '#cbd5e1' },
        { name: 'Messingschraube', material: 'Messing', magnetic: false, color: '#ca8a04' },
        { name: 'Eisennagel', material: 'Eisen', magnetic: true, color: '#64748b' },
        { name: 'Aluminiumfolie', material: 'Aluminium', magnetic: false, color: '#e2e8f0' },
        { name: 'Stahlb\u00fcroklammer', material: 'Stahl', magnetic: true, color: '#94a3b8' },
        { name: 'Nickelm\u00fcnze', material: 'Nickel', magnetic: true, color: '#9ca3af' },
        { name: 'Zinnbecher', material: 'Zinn', magnetic: false, color: '#d1d5db' }
      ]
    },
    c: {
      id: 'c',
      tab: 'C: Reichweite',
      title: 'C: Wie weit reicht die Wirkung von Magneten?',
      instruction: 'Schiebe den Magneten langsam in Richtung der B\u00fcroklammer. Wenn die B\u00fcroklammer angezogen wird, nimm die Messung auf. Wiederhole den Versuch dreimal.',
      type: 'distance',
      conclusion: 'Die Wirkung eines Magneten nimmt mit zunehmender Entfernung ab. Die Reichweite h\u00e4ngt von der St\u00e4rke des Magneten ab. Kleine Abweichungen zwischen den Messungen sind normal und entstehen durch ungenaues Ablesen oder leicht ver\u00e4nderte Bedingungen.'
    },
    d: {
      id: 'd',
      tab: 'D: Abschirmung',
      title: 'D: Durchdringung und Abschirmung untersuchen',
      instruction: 'W\u00e4hle ein Material aus und platziere es zwischen dem Magneten und der B\u00fcroklammer. Beobachte, ob die B\u00fcroklammer weiter schwebt oder herunterfallt.',
      type: 'shielding',
      conclusion: 'Magnetische Felder durchdringen die meisten Materialien wie Papier, Holz, Kunststoff, Glas, Aluminium und Kupfer. Nur ferromagnetische Materialien wie Eisen, Stahl und Nickel k\u00f6nnen ein Magnetfeld abschirmen.',
      materials: [
        { name: 'Papier', blocks: false, color: '#fefce8' },
        { name: 'Holz', blocks: false, color: '#a16207' },
        { name: 'Kunststoff', blocks: false, color: '#3b82f6' },
        { name: 'Glas', blocks: false, color: '#a5f3fc' },
        { name: 'Aluminium', blocks: false, color: '#cbd5e1' },
        { name: 'Kupfer', blocks: false, color: '#b45309' },
        { name: 'Eisen', blocks: true, color: '#64748b' },
        { name: 'Stahl', blocks: true, color: '#94a3b8' },
        { name: 'Nickel', blocks: true, color: '#9ca3af' }
      ]
    }
  };

  // ==================== STATE ====================

  let currentExp = null;
  let state = {};
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
    // Cleanup previous experiment listeners
    cleanupFns.forEach(function (fn) { fn(); });
    cleanupFns = [];
    // Update tabs
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-exp') === key);
      t.setAttribute('aria-selected', t.getAttribute('data-exp') === key);
    });
    // Reset state for this experiment
    resetState(key);
    // Render
    var container = document.getElementById('experiment-container');
    container.innerHTML = '';
    container.setAttribute('role', 'tabpanel');
    var exp = EXPERIMENTS[key];
    if (exp.type === 'magnet-test') renderMagnetTest(container, exp);
    else if (exp.type === 'distance') renderDistance(container, exp);
    else if (exp.type === 'shielding') renderShielding(container, exp);
  }

  function resetState(key) {
    var exp = EXPERIMENTS[key];
    if (exp.type === 'magnet-test') {
      state = { tested: {}, testing: false };
    } else if (exp.type === 'distance') {
      state = { measurements: [], magnetPos: 0, snapped: false, criticalDistances: generateCriticalDistances() };
    } else if (exp.type === 'shielding') {
      state = { tested: {}, currentMaterial: null };
    }
  }

  function generateCriticalDistances() {
    // Generate 3 slightly different critical distances (2.5-4.0 cm range)
    var base = 3.0;
    return [
      base + (Math.random() - 0.5) * 1.2,
      base + (Math.random() - 0.5) * 1.2,
      base + (Math.random() - 0.5) * 1.2
    ].map(function (v) { return Math.round(v * 10) / 10; });
  }

  // ==================== MAGNET TEST (A & B) ====================

  function renderMagnetTest(container, exp) {
    var root = document.createElement('div');
    root.className = 'experiment';

    // Title & instruction
    root.innerHTML =
      '<h2 class="exp-title">' + exp.title + '</h2>' +
      '<p class="exp-instruction">' + exp.instruction + '</p>';

    // Object grid
    var grid = document.createElement('div');
    grid.className = 'object-grid';
    grid.id = 'obj-grid';

    exp.objects.forEach(function (obj, i) {
      var card = document.createElement('div');
      card.className = 'obj-card';
      card.setAttribute('data-index', i);
      card.innerHTML =
        '<div class="obj-icon" style="background:' + obj.color + '"></div>' +
        '<span class="obj-name">' + obj.name + '</span>' +
        '<span class="obj-material">' + obj.material + '</span>';
      card.addEventListener('click', function () {
        testObject(exp, i);
      });
      grid.appendChild(card);
    });
    root.appendChild(grid);

    // Test animation area
    var testCard = document.createElement('div');
    testCard.className = 'card';
    testCard.id = 'test-area-card';
    testCard.style.display = 'none';
    testCard.innerHTML =
      '<div class="test-area" id="test-area">' +
        '<div class="magnet-display"><div class="magnet-n">N</div><div class="magnet-s">S</div></div>' +
        '<div class="test-object-preview" id="test-preview"></div>' +
      '</div>' +
      '<div class="test-result-text" id="test-result"></div>';
    root.appendChild(testCard);

    // Progress
    var progressDiv = document.createElement('div');
    progressDiv.className = 'progress-bar';
    progressDiv.id = 'progress';
    progressDiv.innerHTML =
      '<span id="progress-text">0 / ' + exp.objects.length + ' getestet</span>' +
      '<div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>';
    root.appendChild(progressDiv);

    // Results table
    var tableCard = document.createElement('div');
    tableCard.className = 'card';
    tableCard.id = 'results-card';
    tableCard.style.display = 'none';
    tableCard.innerHTML =
      '<table class="results-table">' +
        '<thead><tr><th>Gegenstand</th><th>Stoff</th><th>Angezogen?</th></tr></thead>' +
        '<tbody id="results-body"></tbody>' +
      '</table>';
    root.appendChild(tableCard);

    // Conclusion
    var conc = document.createElement('div');
    conc.className = 'conclusion hidden';
    conc.id = 'conclusion';
    conc.innerHTML = '<strong>Erkenntnis</strong>' + exp.conclusion;
    root.appendChild(conc);

    // Reset button
    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-md';
    btnRow.innerHTML = '<button class="btn btn-secondary" id="reset-btn">Zur\u00fccksetzen</button>';
    root.appendChild(btnRow);

    container.appendChild(root);

    document.getElementById('reset-btn').addEventListener('click', function () {
      switchExperiment(currentExp);
    });
  }

  function testObject(exp, index) {
    if (state.testing || state.tested[index] !== undefined) return;
    state.testing = true;

    var obj = exp.objects[index];
    var cards = document.querySelectorAll('.obj-card');
    var card = cards[index];
    card.classList.add('testing');

    // Show test area
    var testCard = document.getElementById('test-area-card');
    testCard.style.display = 'block';
    var preview = document.getElementById('test-preview');
    preview.style.background = obj.color;
    preview.textContent = obj.name.substring(0, 2);
    preview.className = 'test-object-preview';
    var resultText = document.getElementById('test-result');
    resultText.textContent = '';
    resultText.className = 'test-result-text';

    // Animate after short delay
    setTimeout(function () {
      if (obj.magnetic) {
        preview.classList.add('attracted');
        resultText.textContent = 'Wird angezogen!';
        resultText.classList.add('yes');
      } else {
        preview.classList.add('not-attracted');
        resultText.textContent = 'Wird nicht angezogen.';
        resultText.classList.add('no');
      }

      // Record result
      setTimeout(function () {
        state.tested[index] = obj.magnetic;
        card.classList.remove('testing');
        card.classList.add(obj.magnetic ? 'tested-yes' : 'tested-no');

        // Add result badge to card
        var badge = document.createElement('span');
        badge.className = 'obj-result ' + (obj.magnetic ? 'yes' : 'no');
        badge.textContent = obj.magnetic ? '\u2713' : '\u2717';
        card.appendChild(badge);

        // Update results table
        updateResultsTable(exp);

        // Update progress
        var tested = Object.keys(state.tested).length;
        var total = exp.objects.length;
        document.getElementById('progress-text').textContent = tested + ' / ' + total + ' getestet';
        document.getElementById('progress-fill').style.width = (tested / total * 100) + '%';

        // Show conclusion when all tested
        if (tested === total) {
          document.getElementById('conclusion').classList.remove('hidden');
        }

        state.testing = false;
      }, 600);
    }, 300);
  }

  function updateResultsTable(exp) {
    var tbody = document.getElementById('results-body');
    var card = document.getElementById('results-card');
    card.style.display = 'block';
    tbody.innerHTML = '';

    var keys = Object.keys(state.tested).sort(function (a, b) { return parseInt(a) - parseInt(b); });
    keys.forEach(function (k) {
      var obj = exp.objects[parseInt(k)];
      var magnetic = state.tested[k];
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + obj.name + '</td>' +
        '<td>' + obj.material + '</td>' +
        '<td class="' + (magnetic ? 'result-yes' : 'result-no') + '">' + (magnetic ? 'Ja' : 'Nein') + '</td>';
      tbody.appendChild(tr);
    });
  }

  // ==================== DISTANCE (C) ====================

  function renderDistance(container, exp) {
    var root = document.createElement('div');
    root.className = 'experiment';

    root.innerHTML =
      '<h2 class="exp-title">' + exp.title + '</h2>' +
      '<p class="exp-instruction">' + exp.instruction + '</p>';

    // Ruler container
    var rulerCard = document.createElement('div');
    rulerCard.className = 'card';

    var rulerHTML =
      '<div class="ruler-container" id="ruler-container">' +
        '<div class="ruler-distance" id="ruler-distance">Entfernung: 8.0 cm</div>' +
        '<div class="ruler-track"></div>' +
        '<div class="ruler-ticks" id="ruler-ticks"></div>' +
        '<div class="ruler-magnet" id="ruler-magnet">' +
          '<div class="magnet-display"><div class="magnet-n">N</div><div class="magnet-s">S</div></div>' +
        '</div>' +
        '<svg class="ruler-paperclip" id="ruler-paperclip" viewBox="0 0 24 36">' +
          '<path d="M12 2 C6 2 4 6 4 10 L4 26 C4 30 7 34 12 34 C17 34 20 30 20 26 L20 14 C20 11 18 8 15 8 C12 8 10 11 10 14 L10 24" ' +
            'fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>' +
        '</svg>' +
      '</div>';
    rulerCard.innerHTML = rulerHTML;
    root.appendChild(rulerCard);

    // Measurements
    var measCard = document.createElement('div');
    measCard.className = 'card';
    var measHTML = '<div class="measurements" id="measurements">';
    for (var i = 1; i <= 3; i++) {
      measHTML += '<div class="measurement-row">' +
        '<span class="measurement-label">Versuch ' + i + ':</span>' +
        '<span class="measurement-value" id="meas-' + i + '">-.- cm</span>' +
      '</div>';
    }
    measHTML += '<div class="measurement-row measurement-avg">' +
      '<span class="measurement-label">Mittelwert:</span>' +
      '<span class="measurement-value" id="meas-avg">-.- cm</span>' +
    '</div></div>';
    measCard.innerHTML = measHTML;
    root.appendChild(measCard);

    // Buttons
    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row';
    btnRow.innerHTML =
      '<button class="btn btn-primary" id="record-btn">Messung aufnehmen</button>' +
      '<button class="btn btn-secondary" id="reset-btn">Zur\u00fccksetzen</button>';
    root.appendChild(btnRow);

    // Conclusion
    var conc = document.createElement('div');
    conc.className = 'conclusion hidden';
    conc.id = 'conclusion';
    conc.innerHTML = '<strong>Erkenntnis</strong>' + exp.conclusion;
    root.appendChild(conc);

    container.appendChild(root);

    // Build ruler ticks
    var ticksContainer = document.getElementById('ruler-ticks');
    for (var t = 0; t <= 8; t++) {
      var tick = document.createElement('div');
      tick.className = 'ruler-tick';
      tick.innerHTML = '<span class="ruler-tick-label">' + t + '</span>';
      ticksContainer.appendChild(tick);
    }

    initRulerDrag();

    document.getElementById('record-btn').addEventListener('click', recordMeasurement);
    document.getElementById('reset-btn').addEventListener('click', function () {
      switchExperiment('c');
    });
  }

  function initRulerDrag() {
    var rulerContainer = document.getElementById('ruler-container');
    var magnet = document.getElementById('ruler-magnet');
    var paperclip = document.getElementById('ruler-paperclip');
    var distLabel = document.getElementById('ruler-distance');
    var recordBtn = document.getElementById('record-btn');

    var containerRect, trackLeft, trackRight, trackWidth;
    var dragging = false;

    function updateLayout() {
      containerRect = rulerContainer.getBoundingClientRect();
      trackLeft = 40;
      trackRight = containerRect.width - 40;
      trackWidth = trackRight - trackLeft;
    }

    function setMagnetPos(fraction) {
      // fraction: 0 = left (far), 1 = right (at paperclip)
      state.magnetPos = Math.max(0, Math.min(1, fraction));
      updateLayout();
      var magnetW = 72;
      var x = trackLeft + state.magnetPos * (trackWidth - magnetW);
      magnet.style.left = x + 'px';

      // Distance in cm (0 to 8 cm scale)
      var distance = (1 - state.magnetPos) * 8;
      distance = Math.round(distance * 10) / 10;
      distLabel.textContent = 'Entfernung: ' + distance.toFixed(1) + ' cm';

      // Check if close enough to snap
      var trialIndex = state.measurements.length;
      if (trialIndex < 3) {
        var critical = state.criticalDistances[trialIndex];
        if (distance <= critical && !state.snapped) {
          state.snapped = true;
          state.currentDistance = critical;
          paperclip.style.transform = 'translateX(-15px)';
          distLabel.textContent = 'Entfernung: ' + critical.toFixed(1) + ' cm';
          recordBtn.disabled = false;
        }
      }

      if (!state.snapped) {
        paperclip.style.transform = 'translateX(0)';
      }
    }

    // Initial position
    updateLayout();
    setMagnetPos(0);
    recordBtn.disabled = true;

    function onPointerDown(e) {
      if (state.measurements.length >= 3) return;
      dragging = true;
      magnet.style.cursor = 'grabbing';
      magnet.setPointerCapture(e.pointerId);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging) return;
      updateLayout();
      var x = e.clientX - containerRect.left - 36;
      var fraction = (x - trackLeft) / (trackWidth - 72);
      setMagnetPos(fraction);
    }

    function onPointerUp() {
      dragging = false;
      magnet.style.cursor = 'grab';
    }

    magnet.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    // Register cleanup for tab switching
    cleanupFns.push(function () {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    });
  }

  function recordMeasurement() {
    if (!state.snapped || state.measurements.length >= 3) return;

    var index = state.measurements.length;
    state.measurements.push(state.currentDistance);
    document.getElementById('meas-' + (index + 1)).textContent = state.currentDistance.toFixed(1) + ' cm';

    if (state.measurements.length >= 3) {
      var sum = state.measurements.reduce(function (a, b) { return a + b; }, 0);
      var avg = sum / state.measurements.length;
      document.getElementById('meas-avg').textContent = avg.toFixed(1) + ' cm';
      document.getElementById('record-btn').disabled = true;
      document.getElementById('conclusion').classList.remove('hidden');
    }

    // Reset for next trial
    state.snapped = false;
    state.currentDistance = null;
    var paperclip = document.getElementById('ruler-paperclip');
    paperclip.style.transform = 'translateX(0)';

    // Move magnet back
    var magnet = document.getElementById('ruler-magnet');
    magnet.style.left = '40px';
    state.magnetPos = 0;
    var distLabel = document.getElementById('ruler-distance');
    distLabel.textContent = 'Entfernung: 8.0 cm';

    if (state.measurements.length < 3) {
      document.getElementById('record-btn').disabled = true;
    }
  }

  // ==================== SHIELDING (D) ====================

  function renderShielding(container, exp) {
    var root = document.createElement('div');
    root.className = 'experiment';

    root.innerHTML =
      '<h2 class="exp-title">' + exp.title + '</h2>' +
      '<p class="exp-instruction">' + exp.instruction + '</p>';

    // Setup visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    vizCard.style.padding = '0';
    vizCard.innerHTML =
      '<div class="shielding-setup" id="shielding-setup">' +
        // Stand
        '<div class="stand-rod"></div>' +
        '<div class="stand-arm"></div>' +
        '<div class="stand-base"></div>' +
        // Magnet
        '<div class="stand-magnet">' +
          '<div class="magnet-display"><div class="magnet-n">N</div><div class="magnet-s">S</div></div>' +
        '</div>' +
        // Field lines (dots)
        '<div class="field-lines" id="field-lines">' +
          '<div class="field-line"></div>' +
          '<div class="field-line"></div>' +
          '<div class="field-line"></div>' +
          '<div class="field-line"></div>' +
          '<div class="field-line"></div>' +
        '</div>' +
        // Material plate slot
        '<div class="stand-plate" id="stand-plate" style="opacity:0">Kein Material</div>' +
        // Thread
        '<div class="stand-thread" id="stand-thread"></div>' +
        // Paperclip
        '<div class="stand-clip floating" id="stand-clip">' +
          '<svg width="24" height="36" viewBox="0 0 24 36">' +
            '<path d="M12 2 C6 2 4 6 4 10 L4 26 C4 30 7 34 12 34 C17 34 20 30 20 26 L20 14 C20 11 18 8 15 8 C12 8 10 11 10 14 L10 24" ' +
              'fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>' +
          '</svg>' +
        '</div>' +
        // Status
        '<div class="status-label floating" id="status-label">B\u00fcroklammer schwebt</div>' +
      '</div>';
    root.appendChild(vizCard);

    // Material selection
    var matCard = document.createElement('div');
    matCard.className = 'card';
    matCard.innerHTML = '<div style="margin-bottom:0.5rem;font-weight:600;font-size:0.9rem">Material ausw\u00e4hlen:</div>';
    var matGrid = document.createElement('div');
    matGrid.className = 'material-grid';

    exp.materials.forEach(function (mat, i) {
      var btn = document.createElement('button');
      btn.className = 'mat-btn';
      btn.setAttribute('data-index', i);
      btn.textContent = mat.name;
      btn.addEventListener('click', function () {
        testMaterial(exp, i);
      });
      matGrid.appendChild(btn);
    });

    // Remove button
    var removeBtn = document.createElement('button');
    removeBtn.className = 'mat-btn';
    removeBtn.style.borderStyle = 'dashed';
    removeBtn.textContent = 'Entfernen';
    removeBtn.addEventListener('click', function () {
      removeMaterial();
    });
    matGrid.appendChild(removeBtn);

    matCard.appendChild(matGrid);
    root.appendChild(matCard);

    // Progress
    var progressDiv = document.createElement('div');
    progressDiv.className = 'progress-bar';
    progressDiv.id = 'progress';
    var total = exp.materials.length;
    progressDiv.innerHTML =
      '<span id="progress-text">0 / ' + total + ' getestet</span>' +
      '<div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>';
    root.appendChild(progressDiv);

    // Results
    var resCard = document.createElement('div');
    resCard.className = 'card';
    resCard.id = 'results-card';
    resCard.style.display = 'none';
    resCard.innerHTML =
      '<div style="font-weight:600;font-size:0.9rem;margin-bottom:0.5rem">Ergebnisse</div>' +
      '<div class="shield-results" id="shield-results"></div>';
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
    btnRow.innerHTML = '<button class="btn btn-secondary" id="reset-btn">Zur\u00fccksetzen</button>';
    root.appendChild(btnRow);

    container.appendChild(root);

    document.getElementById('reset-btn').addEventListener('click', function () {
      switchExperiment('d');
    });

    // Set initial clip position
    updateClipPosition(false);
  }

  function testMaterial(exp, index) {
    var mat = exp.materials[index];

    state.currentMaterial = index;

    // Update button states
    document.querySelectorAll('.mat-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    var btns = document.querySelectorAll('.mat-btn[data-index]');
    btns[index].classList.add('active');

    // Show plate
    var plate = document.getElementById('stand-plate');
    plate.style.opacity = '1';
    plate.style.background = mat.color;
    plate.textContent = mat.name;

    // Animate clip
    var clip = document.getElementById('stand-clip');
    var statusLabel = document.getElementById('status-label');
    var fieldLines = document.getElementById('field-lines');

    if (mat.blocks) {
      clip.className = 'stand-clip fallen';
      statusLabel.textContent = 'B\u00fcroklammer f\u00e4llt!';
      statusLabel.className = 'status-label fallen';
      fieldLines.classList.add('blocked');
      updateClipPosition(true);
    } else {
      clip.className = 'stand-clip floating';
      statusLabel.textContent = 'B\u00fcroklammer schwebt';
      statusLabel.className = 'status-label floating';
      fieldLines.classList.remove('blocked');
      updateClipPosition(false);
    }

    // Record result
    if (state.tested[index] === undefined) {
      state.tested[index] = mat.blocks;

      // Update button
      btns[index].classList.add(mat.blocks ? 'tested-block' : 'tested-pass');

      // Update results
      updateShieldResults(exp);

      // Progress
      var tested = Object.keys(state.tested).length;
      var total = exp.materials.length;
      document.getElementById('progress-text').textContent = tested + ' / ' + total + ' getestet';
      document.getElementById('progress-fill').style.width = (tested / total * 100) + '%';

      if (tested === total) {
        document.getElementById('conclusion').classList.remove('hidden');
      }
    }
  }

  function removeMaterial() {
    state.currentMaterial = null;

    document.querySelectorAll('.mat-btn').forEach(function (b) {
      b.classList.remove('active');
    });

    var plate = document.getElementById('stand-plate');
    plate.style.opacity = '0';

    var clip = document.getElementById('stand-clip');
    clip.className = 'stand-clip floating';
    var statusLabel = document.getElementById('status-label');
    statusLabel.textContent = 'B\u00fcroklammer schwebt';
    statusLabel.className = 'status-label floating';

    var fieldLines = document.getElementById('field-lines');
    fieldLines.classList.remove('blocked');

    updateClipPosition(false);
  }

  function updateClipPosition(fallen) {
    var thread = document.getElementById('stand-thread');
    if (!thread) return;
    if (fallen) {
      thread.classList.add('fallen');
    } else {
      thread.classList.remove('fallen');
    }
  }

  function updateShieldResults(exp) {
    var resultsDiv = document.getElementById('shield-results');
    var card = document.getElementById('results-card');
    card.style.display = 'block';
    resultsDiv.innerHTML = '';

    var keys = Object.keys(state.tested).sort(function (a, b) { return parseInt(a) - parseInt(b); });
    keys.forEach(function (k) {
      var mat = exp.materials[parseInt(k)];
      var blocks = state.tested[k];
      var item = document.createElement('div');
      item.className = 'shield-result-item';
      item.innerHTML =
        '<span class="shield-dot ' + (blocks ? 'block' : 'pass') + '"></span>' +
        '<span>' + mat.name + ': ' + (blocks ? 'abschirmend' : 'durchl\u00e4ssig') + '</span>';
      resultsDiv.appendChild(item);
    });
  }

  // ==================== START ====================

  document.addEventListener('DOMContentLoaded', init);
})();
