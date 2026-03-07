(function () {
  'use strict';

  // ==================== DATA ====================

  var EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'A: Magnet herstellen',
      title: 'A: Einen Magneten selbst herstellen',
      instruction: 'Führe die Schritte der Reihe nach durch: Magnetisiere eine Stricknadel, teste sie, entmagnetisiere sie durch Erhitzen oder Schlagen und teste erneut.',
      type: 'make-magnet',
      conclusion: 'Durch Streichen mit einem Magneten werden die Elementarmagnete in der Stricknadel ausgerichtet – die Nadel wird magnetisch. Durch Erhitzen oder Schlagen werden die Elementarmagnete wieder durcheinander gebracht – die Nadel verliert ihren Magnetismus.'
    },
    b: {
      id: 'b',
      tab: 'B: Aus zwei mach eins',
      title: 'B: Aus zwei mach eins',
      instruction: 'Magnetisiere einen Eisendraht, schneide ihn durch und teste die Hälften. Lege dann zwei Stabmagnete zusammen und nähere einen Eisennagel der Berührungsstelle.',
      type: 'split-magnet',
      conclusion: 'Jedes Stück eines Magneten ist selbst wieder ein vollständiger Magnet mit Nord- und Südpol. Das lässt sich mit dem Modell der Elementarmagnete erklären: Auch nach dem Teilen sind die Elementarmagnete in jedem Stück ausgerichtet. Wenn zwei Magnete mit N-S zusammengelegt werden, heben sich die Pole an der Berührungsstelle auf – wie in der Mitte eines einzelnen Magneten.'
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
    if (exp.type === 'make-magnet') renderMakeMagnet(container, exp);
    else if (exp.type === 'split-magnet') renderSplitMagnet(container, exp);
  }

  function resetState(key) {
    var exp = EXPERIMENTS[key];
    if (exp.type === 'make-magnet') {
      state = { currentStep: -1, completedSteps: {}, isMagnetized: false, animating: false };
    } else if (exp.type === 'split-magnet') {
      state = { currentStep: -1, completedSteps: {}, phase: 'wire', animating: false };
    }
  }

  // ==================== HELPERS ====================

  function clipSVG(color) {
    return '<svg width="20" height="40" viewBox="0 0 20 40">' +
      '<rect x="5" y="2" width="10" height="36" rx="5" fill="none" stroke="' + (color || '#64748b') + '" stroke-width="2"/>' +
      '<rect x="8" y="8" width="4" height="24" rx="2" fill="none" stroke="' + (color || '#64748b') + '" stroke-width="1.5"/>' +
    '</svg>';
  }

  // ==================== A: MAKE MAGNET ====================

  var STEPS_A = [
    { id: 0, label: 'Schritt 1: Mit dem Magneten über die Stricknadel streichen', action: 'stroke' },
    { id: 1, label: 'Schritt 2: Stricknadel der Büroklammer nähern', action: 'test-clip' },
    { id: 2, label: 'Schritt 3: Stricknadel in die Kerzenflamme halten', action: 'heat' },
    { id: 3, label: 'Schritt 4: Stricknadel erneut der Büroklammer nähern', action: 'test-clip-after-heat' },
    { id: 4, label: 'Schritt 5: Erneut mit dem Magneten streichen und testen', action: 'stroke-again' },
    { id: 5, label: 'Schritt 6: Stricknadel auf den Tisch schlagen und testen', action: 'hit' }
  ];

  function renderMakeMagnet(container, exp) {
    var root = document.createElement('div');
    root.className = 'experiment';

    root.innerHTML =
      '<h2 class="exp-title">' + exp.title + '</h2>' +
      '<p class="exp-instruction">' + exp.instruction + '</p>';

    // Visualization card
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    vizCard.innerHTML =
      '<div class="mag-viz" id="mag-viz">' +
        // Needle
        '<div class="mag-needle" id="mag-needle">' +
          '<div class="mag-needle-tip"></div>' +
        '</div>' +
        // Elementary magnets row
        '<div class="elem-magnets" id="elem-magnets"></div>' +
        // Status
        '<div class="mag-status" id="mag-status">Stricknadel (unmagnetisch)</div>' +
        // Stroking magnet
        '<div class="mag-stroker" id="mag-stroker">' +
          '<div class="mag-stroker-n">N</div>' +
          '<div class="mag-stroker-s">S</div>' +
        '</div>' +
        // Flame
        '<div class="mag-flame" id="mag-flame">' +
          '<div class="flame-body"></div>' +
          '<div class="flame-wick"></div>' +
          '<div class="flame-candle"></div>' +
        '</div>' +
        // Paperclip
        '<div class="mag-clip-area" id="mag-clip-area">' +
          '<div class="mag-clip" id="mag-clip">' + clipSVG() + '</div>' +
          '<div class="mag-clip-label">Büroklammer</div>' +
        '</div>' +
        // Attraction result
        '<div class="mag-attract-result" id="mag-attract-result"></div>' +
        // Hit area
        '<div class="mag-hit-area" id="mag-hit-area">' +
          '<div class="mag-table-surface"></div>' +
          '<div class="mag-hit-label">Tisch</div>' +
        '</div>' +
      '</div>';
    root.appendChild(vizCard);

    // Build elementary magnets
    buildElementaryMagnets();

    // Steps card
    var stepsCard = document.createElement('div');
    stepsCard.className = 'card';
    stepsCard.innerHTML = '<div style="margin-bottom:0.5rem;font-weight:600;font-size:0.9rem">Durchführung:</div>';
    var stepGrid = document.createElement('div');
    stepGrid.className = 'step-btn-grid';
    stepGrid.id = 'steps-grid';

    STEPS_A.forEach(function (step, i) {
      var btn = document.createElement('button');
      btn.className = 'step-btn';
      btn.id = 'step-btn-' + i;
      btn.disabled = (i !== 0);
      btn.innerHTML =
        '<span class="step-num">' + (i + 1) + '</span>' +
        '<span class="step-text">' + step.label + '</span>';
      btn.addEventListener('click', function () {
        executeStepA(i);
      });
      stepGrid.appendChild(btn);
    });
    stepsCard.appendChild(stepGrid);
    root.appendChild(stepsCard);

    // Progress
    var progressDiv = document.createElement('div');
    progressDiv.className = 'progress-bar';
    progressDiv.id = 'progress';
    progressDiv.innerHTML =
      '<span id="progress-text">0 / ' + STEPS_A.length + ' Schritte</span>' +
      '<div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>';
    root.appendChild(progressDiv);

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
      switchExperiment('a');
    });
  }

  function buildElementaryMagnets() {
    var container = document.getElementById('elem-magnets');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < 8; i++) {
      var em = document.createElement('div');
      em.className = 'elem-magnet';
      em.id = 'elem-' + i;
      em.innerHTML = '<div class="elem-n"></div><div class="elem-s"></div>';
      // Start with random orientations
      var angle = Math.floor(Math.random() * 360);
      em.style.transform = 'rotate(' + angle + 'deg)';
      container.appendChild(em);
    }
  }

  function alignElementaryMagnets() {
    for (var i = 0; i < 8; i++) {
      var em = document.getElementById('elem-' + i);
      if (em) em.style.transform = 'rotate(0deg)';
    }
  }

  function randomizeElementaryMagnets() {
    for (var i = 0; i < 8; i++) {
      var em = document.getElementById('elem-' + i);
      if (em) {
        var angle = Math.floor(Math.random() * 360);
        em.style.transform = 'rotate(' + angle + 'deg)';
      }
    }
  }

  function executeStepA(stepIndex) {
    if (state.animating) return;
    if (state.completedSteps[stepIndex]) return;

    state.animating = true;
    state.currentStep = stepIndex;
    var step = STEPS_A[stepIndex];
    var btn = document.getElementById('step-btn-' + stepIndex);
    btn.classList.add('active');

    // Hide all viz elements first
    hideAllVizElements();

    if (step.action === 'stroke' || step.action === 'stroke-again') {
      animateStroke(stepIndex);
    } else if (step.action === 'test-clip' || step.action === 'test-clip-after-heat') {
      animateTestClip(stepIndex);
    } else if (step.action === 'heat') {
      animateHeat(stepIndex);
    } else if (step.action === 'hit') {
      animateHit(stepIndex);
    }
  }

  function hideAllVizElements() {
    var stroker = document.getElementById('mag-stroker');
    var flame = document.getElementById('mag-flame');
    var clipArea = document.getElementById('mag-clip-area');
    var result = document.getElementById('mag-attract-result');
    var hitArea = document.getElementById('mag-hit-area');
    var needle = document.getElementById('mag-needle');

    if (stroker) stroker.classList.remove('visible', 'stroking');
    if (flame) { flame.classList.remove('visible'); flame.style.right = ''; flame.style.bottom = ''; }
    if (clipArea) { clipArea.classList.remove('visible'); clipArea.style.bottom = ''; clipArea.style.left = ''; }
    if (result) { result.classList.remove('visible', 'yes', 'no'); }
    if (hitArea) { hitArea.classList.remove('visible'); hitArea.style.right = ''; hitArea.style.bottom = ''; }
    if (needle) { needle.classList.remove('heating-glow'); needle.style.transform = 'translate(-50%, -50%)'; }
  }

  function animateStroke(stepIndex) {
    var stroker = document.getElementById('mag-stroker');
    var needle = document.getElementById('mag-needle');
    var statusEl = document.getElementById('mag-status');

    stroker.classList.add('visible');
    stroker.style.left = '30%';

    var strokeCount = 0;
    var maxStrokes = 3;

    function doStroke() {
      stroker.style.transition = 'left 0.6s ease-in-out';
      stroker.style.left = '62%';

      setTimeout(function () {
        stroker.style.transition = 'left 0.2s ease';
        stroker.style.left = '30%';
        strokeCount++;

        if (strokeCount < maxStrokes) {
          setTimeout(doStroke, 300);
        } else {
          // Magnetized!
          state.isMagnetized = true;
          needle.classList.add('magnetized');
          statusEl.textContent = 'Stricknadel (magnetisiert)';
          statusEl.className = 'mag-status magnetized';
          alignElementaryMagnets();

          setTimeout(function () {
            stroker.classList.remove('visible');
            completeStepA(stepIndex);
          }, 500);
        }
      }, 650);
    }

    setTimeout(doStroke, 300);
  }

  function animateTestClip(stepIndex) {
    var clipArea = document.getElementById('mag-clip-area');
    var result = document.getElementById('mag-attract-result');
    var clip = document.getElementById('mag-clip');
    var needle = document.getElementById('mag-needle');

    clipArea.classList.add('visible');

    // Move clip area toward needle
    clipArea.style.transition = 'bottom 0.8s ease, left 0.8s ease';
    clipArea.style.bottom = '42%';
    clipArea.style.left = '38%';

    setTimeout(function () {
      if (state.isMagnetized) {
        // Snap clip to needle tip
        clipArea.style.transition = 'bottom 0.3s ease, left 0.3s ease';
        clipArea.style.bottom = '46%';
        clipArea.style.left = '42%';
        clip.classList.add('sticking');
        result.textContent = 'Angezogen! Büroklammer haftet an der Nadel.';
        result.className = 'mag-attract-result visible yes';
      } else {
        result.textContent = 'Keine Anziehung';
        result.className = 'mag-attract-result visible no';
      }

      setTimeout(function () {
        clip.classList.remove('sticking');
        // Reset clip position
        clipArea.style.transition = 'opacity 0.3s';
        clipArea.style.bottom = '';
        clipArea.style.left = '';
        completeStepA(stepIndex);
      }, 1400);
    }, 900);
  }

  function animateHeat(stepIndex) {
    var flame = document.getElementById('mag-flame');
    var needle = document.getElementById('mag-needle');
    var statusEl = document.getElementById('mag-status');

    // Move flame to center first, then bring needle into it
    flame.classList.add('visible');
    flame.style.transition = 'right 0.5s ease, bottom 0.5s ease';
    flame.style.right = '38%';
    flame.style.bottom = '38%';

    statusEl.textContent = 'Erhitzen...';
    statusEl.className = 'mag-status heating';

    // Move needle tip into flame
    setTimeout(function () {
      needle.style.transition = 'transform 0.6s ease';
      needle.style.transform = 'translate(-30%, -50%)';

      setTimeout(function () {
        // Needle is now in flame – glow effect
        needle.classList.add('heating-glow');

        setTimeout(function () {
          // Demagnetize
          state.isMagnetized = false;
          needle.classList.remove('magnetized');
          needle.classList.add('shaking');
          randomizeElementaryMagnets();

          setTimeout(function () {
            needle.classList.remove('shaking', 'heating-glow');
            needle.style.transform = 'translate(-50%, -50%)';
            statusEl.textContent = 'Stricknadel (entmagnetisiert)';
            statusEl.className = 'mag-status demagnetized';

            // Move flame back
            flame.style.right = '';
            flame.style.bottom = '';

            setTimeout(function () {
              flame.classList.remove('visible');
              completeStepA(stepIndex);
            }, 500);
          }, 1000);
        }, 800);
      }, 700);
    }, 600);
  }

  function animateHit(stepIndex) {
    var hitArea = document.getElementById('mag-hit-area');
    var needle = document.getElementById('mag-needle');
    var statusEl = document.getElementById('mag-status');
    var clipArea = document.getElementById('mag-clip-area');
    var result = document.getElementById('mag-attract-result');
    var clip = document.getElementById('mag-clip');

    // Show table surface
    hitArea.classList.add('visible');
    hitArea.style.transition = 'right 0.4s ease, bottom 0.4s ease';
    hitArea.style.right = '35%';
    hitArea.style.bottom = '30%';

    // Move needle down toward the table
    setTimeout(function () {
      needle.style.transition = 'transform 0.3s ease';
      needle.style.transform = 'translate(-50%, -50%) rotate(60deg)';

      setTimeout(function () {
        // Hit! Needle strikes the table
        needle.style.transition = 'transform 0.1s ease';
        needle.style.transform = 'translate(-50%, -30%) rotate(60deg)';
        needle.classList.add('shaking');

        setTimeout(function () {
          // Second hit
          needle.style.transform = 'translate(-50%, -50%) rotate(60deg)';

          setTimeout(function () {
            needle.style.transform = 'translate(-50%, -30%) rotate(60deg)';
            needle.classList.remove('shaking');
            needle.classList.add('shaking');

            setTimeout(function () {
              needle.classList.remove('shaking');

              // Demagnetize
              state.isMagnetized = false;
              needle.classList.remove('magnetized');
              randomizeElementaryMagnets();
              statusEl.textContent = 'Stricknadel (entmagnetisiert)';
              statusEl.className = 'mag-status demagnetized';

              // Return needle to normal position
              needle.style.transition = 'transform 0.5s ease';
              needle.style.transform = 'translate(-50%, -50%)';

              // Reset hit area
              hitArea.style.right = '';
              hitArea.style.bottom = '';

              // Now test clip - move clip toward needle like in steps 2/4
              setTimeout(function () {
                hitArea.classList.remove('visible');
                clipArea.classList.add('visible');
                clipArea.style.transition = 'bottom 0.8s ease, left 0.8s ease';
                clipArea.style.bottom = '42%';
                clipArea.style.left = '38%';

                setTimeout(function () {
                  result.textContent = 'Keine Anziehung';
                  result.className = 'mag-attract-result visible no';

                  setTimeout(function () {
                    clipArea.style.transition = 'opacity 0.3s';
                    clipArea.style.bottom = '';
                    clipArea.style.left = '';
                    completeStepA(stepIndex);
                  }, 1000);
                }, 800);
              }, 600);
            }, 500);
          }, 200);
        }, 300);
      }, 300);
    }, 500);
  }

  function completeStepA(stepIndex) {
    state.completedSteps[stepIndex] = true;
    state.animating = false;

    var btn = document.getElementById('step-btn-' + stepIndex);
    btn.classList.remove('active');
    btn.classList.add('completed');
    btn.disabled = true;

    // Enable next step
    var nextBtn = document.getElementById('step-btn-' + (stepIndex + 1));
    if (nextBtn) {
      nextBtn.disabled = false;
    }

    // Update progress
    var completed = Object.keys(state.completedSteps).length;
    var total = STEPS_A.length;
    var pct = Math.round((completed / total) * 100);
    var progressText = document.getElementById('progress-text');
    var progressFill = document.getElementById('progress-fill');
    if (progressText) progressText.textContent = completed + ' / ' + total + ' Schritte';
    if (progressFill) progressFill.style.width = pct + '%';

    // Show conclusion if all done
    if (completed === total) {
      var conc = document.getElementById('conclusion');
      if (conc) conc.classList.remove('hidden');
    }
  }

  // ==================== B: SPLIT MAGNET ====================

  var STEPS_B_WIRE = [
    { id: 0, label: 'Schritt 1: Eisendraht magnetisieren und durchschneiden', action: 'cut' },
    { id: 1, label: 'Schritt 2: Beide Stücke an Büroklammer testen', action: 'test-halves' }
  ];

  var STEPS_B_BARS = [
    { id: 2, label: 'Schritt 3: Zwei Stabmagnete N–S zusammenlegen', action: 'combine' },
    { id: 3, label: 'Schritt 4: Eisennägel an Pole und Berührungsstelle nähern', action: 'test-contact' }
  ];

  function renderSplitMagnet(container, exp) {
    var root = document.createElement('div');
    root.className = 'experiment';

    root.innerHTML =
      '<h2 class="exp-title">' + exp.title + '</h2>' +
      '<p class="exp-instruction">' + exp.instruction + '</p>';

    // ---- Part 1: Wire ----
    var wireLabel = document.createElement('div');
    wireLabel.style.cssText = 'font-weight:600;font-size:0.9rem;color:var(--accent);';
    wireLabel.textContent = 'Teil 1: Eisendraht teilen';
    root.appendChild(wireLabel);

    var wireCard = document.createElement('div');
    wireCard.className = 'card';
    wireCard.innerHTML =
      '<div class="wire-viz" id="wire-viz">' +
        '<div class="wire-status" id="wire-status" style="background:#f1f5f9;color:var(--text-sec);">Magnetisierter Eisendraht</div>' +
        '<div class="wire-full magnetized" id="wire-full"></div>' +
        '<div class="wire-half wire-half-left hidden" id="wire-half-left"></div>' +
        '<div class="wire-half wire-half-right hidden" id="wire-half-right"></div>' +
        '<div class="wire-cut-line" id="wire-cut-line"></div>' +
        '<div class="wire-scissors" id="wire-scissors">&#9986;</div>' +
        '<div class="wire-clip-test wire-clip-left hidden" id="wire-clip-left">' +
          '<div class="mag-clip">' + clipSVG() + '</div>' +
          '<div class="mag-clip-label">Büroklammer</div>' +
        '</div>' +
        '<div class="wire-clip-test wire-clip-right hidden" id="wire-clip-right">' +
          '<div class="mag-clip">' + clipSVG() + '</div>' +
          '<div class="mag-clip-label">Büroklammer</div>' +
        '</div>' +
      '</div>';
    root.appendChild(wireCard);

    // Wire steps
    var wireStepsCard = document.createElement('div');
    wireStepsCard.className = 'card';
    var wireStepGrid = document.createElement('div');
    wireStepGrid.className = 'step-btn-grid';

    STEPS_B_WIRE.forEach(function (step, i) {
      var btn = document.createElement('button');
      btn.className = 'step-btn';
      btn.id = 'step-btn-' + step.id;
      btn.disabled = (i !== 0);
      btn.innerHTML =
        '<span class="step-num">' + (step.id + 1) + '</span>' +
        '<span class="step-text">' + step.label + '</span>';
      btn.addEventListener('click', function () {
        executeStepB(step.id);
      });
      wireStepGrid.appendChild(btn);
    });
    wireStepsCard.appendChild(wireStepGrid);
    root.appendChild(wireStepsCard);

    // ---- Part 2: Bar Magnets ----
    var barLabel = document.createElement('div');
    barLabel.style.cssText = 'font-weight:600;font-size:0.9rem;color:var(--accent);margin-top:0.5rem;';
    barLabel.textContent = 'Teil 2: Zwei Stabmagnete zusammenlegen';
    root.appendChild(barLabel);

    var barCard = document.createElement('div');
    barCard.className = 'card';
    barCard.innerHTML =
      '<div class="bar-magnets-area" id="bar-area">' +
        '<div class="bar-magnet bar-magnet-left" id="bar-left">' +
          '<div class="bar-n">N</div>' +
          '<div class="bar-s">S</div>' +
        '</div>' +
        '<div class="bar-magnet bar-magnet-right" id="bar-right">' +
          '<div class="bar-n">N</div>' +
          '<div class="bar-s">S</div>' +
        '</div>' +
        '<div class="contact-indicator" id="contact-indicator" style="background:#fef3c7;color:#92400e;">Berührungsstelle</div>' +
        '<div class="iron-nail iron-nail-left hidden" id="iron-nail-left">' +
          '<div class="nail-body"><div class="nail-head"></div><div class="nail-point"></div></div>' +
          '<div class="nail-label">Eisennagel</div>' +
        '</div>' +
        '<div class="iron-nail iron-nail-center hidden" id="iron-nail-center">' +
          '<div class="nail-body"><div class="nail-head"></div><div class="nail-point"></div></div>' +
          '<div class="nail-label">Eisennagel</div>' +
        '</div>' +
        '<div class="iron-nail iron-nail-right hidden" id="iron-nail-right">' +
          '<div class="nail-body"><div class="nail-head"></div><div class="nail-point"></div></div>' +
          '<div class="nail-label">Eisennagel</div>' +
        '</div>' +
      '</div>';
    root.appendChild(barCard);

    // Bar steps
    var barStepsCard = document.createElement('div');
    barStepsCard.className = 'card';
    var barStepGrid = document.createElement('div');
    barStepGrid.className = 'step-btn-grid';

    STEPS_B_BARS.forEach(function (step, i) {
      var btn = document.createElement('button');
      btn.className = 'step-btn';
      btn.id = 'step-btn-' + step.id;
      btn.disabled = true;
      btn.innerHTML =
        '<span class="step-num">' + (step.id + 1) + '</span>' +
        '<span class="step-text">' + step.label + '</span>';
      btn.addEventListener('click', function () {
        executeStepB(step.id);
      });
      barStepGrid.appendChild(btn);
    });
    barStepsCard.appendChild(barStepGrid);
    root.appendChild(barStepsCard);

    // Elementary magnet model card
    var modelCard = document.createElement('div');
    modelCard.className = 'card hidden';
    modelCard.id = 'model-card';
    modelCard.innerHTML =
      '<div style="font-weight:600;font-size:0.9rem;margin-bottom:0.75rem">Modell der Elementarmagnete</div>' +
      '<div class="elem-model" id="elem-model"></div>';
    root.appendChild(modelCard);

    // Progress
    var totalSteps = STEPS_B_WIRE.length + STEPS_B_BARS.length;
    var progressDiv = document.createElement('div');
    progressDiv.className = 'progress-bar';
    progressDiv.id = 'progress';
    progressDiv.innerHTML =
      '<span id="progress-text">0 / ' + totalSteps + ' Schritte</span>' +
      '<div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>';
    root.appendChild(progressDiv);

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
      switchExperiment('b');
    });
  }

  function executeStepB(stepId) {
    if (state.animating) return;
    if (state.completedSteps[stepId]) return;

    state.animating = true;
    state.currentStep = stepId;
    var btn = document.getElementById('step-btn-' + stepId);
    btn.classList.add('active');

    if (stepId === 0) animateCut();
    else if (stepId === 1) animateTestHalves();
    else if (stepId === 2) animateCombine();
    else if (stepId === 3) animateTestContact();
  }

  function animateCut() {
    var wireFull = document.getElementById('wire-full');
    var wireHalfL = document.getElementById('wire-half-left');
    var wireHalfR = document.getElementById('wire-half-right');
    var cutLine = document.getElementById('wire-cut-line');
    var scissors = document.getElementById('wire-scissors');
    var statusEl = document.getElementById('wire-status');

    // Show scissors
    scissors.classList.add('visible');

    setTimeout(function () {
      // Show cut line
      cutLine.classList.add('visible');

      setTimeout(function () {
        // Hide full wire, show halves
        wireFull.classList.add('hidden');
        wireHalfL.classList.remove('hidden');
        wireHalfR.classList.remove('hidden');
        scissors.classList.remove('visible');
        cutLine.classList.remove('visible');

        statusEl.textContent = 'Zwei Hälften – jeweils ein Magnet?';
        statusEl.style.background = '#fef3c7';
        statusEl.style.color = '#92400e';

        setTimeout(function () {
          completeStepB(0);
        }, 500);
      }, 800);
    }, 600);
  }

  function animateTestHalves() {
    var clipL = document.getElementById('wire-clip-left');
    var clipR = document.getElementById('wire-clip-right');
    var statusEl = document.getElementById('wire-status');

    clipL.classList.remove('hidden');
    clipR.classList.remove('hidden');

    setTimeout(function () {
      // Both attract - animate clips moving up
      var clipsL = clipL.querySelector('.mag-clip');
      var clipsR = clipR.querySelector('.mag-clip');
      if (clipsL) clipsL.classList.add('attracted');
      if (clipsR) clipsR.classList.add('attracted');

      statusEl.textContent = 'Beide Hälften ziehen an! Jede ist ein Magnet.';
      statusEl.style.background = '#dcfce7';
      statusEl.style.color = '#166534';

      // Show elementary magnet model for wire
      showWireModel();

      setTimeout(function () {
        completeStepB(1);
      }, 1200);
    }, 800);
  }

  function showWireModel() {
    var modelCard = document.getElementById('model-card');
    var modelContainer = document.getElementById('elem-model');
    if (!modelCard || !modelContainer) return;

    modelCard.classList.remove('hidden');
    modelContainer.innerHTML = '';

    // Full wire
    var fullLabel = document.createElement('div');
    fullLabel.className = 'elem-label';
    fullLabel.textContent = 'Ganzer Draht:';
    modelContainer.appendChild(fullLabel);

    var fullRow = document.createElement('div');
    fullRow.className = 'elem-row';
    for (var i = 0; i < 8; i++) {
      var m = document.createElement('div');
      m.className = 'elem-mini';
      m.innerHTML = '<div class="elem-mini-n"></div><div class="elem-mini-s"></div>';
      fullRow.appendChild(m);
    }
    modelContainer.appendChild(fullRow);

    // Arrow
    var arrow = document.createElement('div');
    arrow.style.cssText = 'font-size:1.2rem;color:var(--text-sec);';
    arrow.textContent = '\u2193 teilen \u2193';
    modelContainer.appendChild(arrow);

    // Two halves
    var halvesWrap = document.createElement('div');
    halvesWrap.style.cssText = 'display:flex;gap:1.5rem;align-items:center;';

    ['Linke Hälfte:', 'Rechte Hälfte:'].forEach(function (label) {
      var col = document.createElement('div');
      col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.3rem;';
      var lbl = document.createElement('div');
      lbl.className = 'elem-label';
      lbl.textContent = label;
      col.appendChild(lbl);

      var row = document.createElement('div');
      row.className = 'elem-row';
      for (var j = 0; j < 4; j++) {
        var m2 = document.createElement('div');
        m2.className = 'elem-mini';
        m2.innerHTML = '<div class="elem-mini-n"></div><div class="elem-mini-s"></div>';
        row.appendChild(m2);
      }
      col.appendChild(row);

      var poleLbl = document.createElement('div');
      poleLbl.className = 'elem-label';
      poleLbl.style.fontSize = '0.7rem';
      poleLbl.innerHTML = '<span style="color:var(--red)">N</span> \u2190\u2192 <span style="color:var(--green)">S</span>';
      col.appendChild(poleLbl);

      halvesWrap.appendChild(col);
    });
    modelContainer.appendChild(halvesWrap);
  }

  function animateCombine() {
    var barLeft = document.getElementById('bar-left');
    var barRight = document.getElementById('bar-right');
    var indicator = document.getElementById('contact-indicator');

    // Move magnets together: left S meets right N
    barLeft.style.left = 'calc(50% - 120px)';
    barRight.style.right = 'calc(50% - 120px)';

    setTimeout(function () {
      indicator.classList.add('visible');

      setTimeout(function () {
        completeStepB(2);
      }, 600);
    }, 700);
  }

  function animateTestContact() {
    var nailLeft = document.getElementById('iron-nail-left');
    var nailCenter = document.getElementById('iron-nail-center');
    var nailRight = document.getElementById('iron-nail-right');
    var indicator = document.getElementById('contact-indicator');

    // Show all three nails
    nailLeft.classList.remove('hidden');
    nailCenter.classList.remove('hidden');
    nailRight.classList.remove('hidden');

    // Move all nails up toward the magnets
    setTimeout(function () {
      nailLeft.style.bottom = '55%';
      nailLeft.style.transform = 'translateX(-50%) translateY(50%)';
      nailCenter.style.bottom = '55%';
      nailCenter.style.transform = 'translateX(-50%) translateY(50%)';
      nailRight.style.bottom = '55%';
      nailRight.style.transform = 'translateX(-50%) translateY(50%)';

      setTimeout(function () {
        // Pole nails stay attracted (snap closer)
        nailLeft.style.bottom = '58%';
        nailLeft.classList.add('attracted');
        nailRight.style.bottom = '58%';
        nailRight.classList.add('attracted');

        // Center nail falls back down - no attraction
        nailCenter.classList.add('falling');
        nailCenter.style.bottom = '8%';
        nailCenter.style.transform = 'translateX(-50%) translateY(50%)';

        indicator.textContent = 'Keine Anziehung an der Berührungsstelle – aber an den Polen!';
        indicator.style.background = '#fef2f2';
        indicator.style.color = '#991b1b';

        // Show model for combined magnets
        showCombinedModel();

        setTimeout(function () {
          completeStepB(3);
        }, 1200);
      }, 800);
    }, 500);
  }

  function showCombinedModel() {
    var modelCard = document.getElementById('model-card');
    var modelContainer = document.getElementById('elem-model');
    if (!modelCard || !modelContainer) return;

    modelCard.classList.remove('hidden');

    // Add separator
    var sep = document.createElement('div');
    sep.style.cssText = 'width:100%;height:1px;background:var(--border);margin:0.5rem 0;';
    modelContainer.appendChild(sep);

    // Combined magnets label
    var combLabel = document.createElement('div');
    combLabel.className = 'elem-label';
    combLabel.textContent = 'Zwei Magnete zusammengelegt (S–N):';
    modelContainer.appendChild(combLabel);

    var combRow = document.createElement('div');
    combRow.className = 'elem-row';
    combRow.style.position = 'relative';

    for (var i = 0; i < 8; i++) {
      var m = document.createElement('div');
      m.className = 'elem-mini';
      m.innerHTML = '<div class="elem-mini-n"></div><div class="elem-mini-s"></div>';
      if (i === 4) {
        m.style.marginLeft = '2px';
      }
      combRow.appendChild(m);
    }
    modelContainer.appendChild(combRow);

    // Explanation
    var explLabel = document.createElement('div');
    explLabel.className = 'elem-label';
    explLabel.style.fontSize = '0.75rem';
    explLabel.style.maxWidth = '280px';
    explLabel.innerHTML = 'An der Berührungsstelle treffen S und N aufeinander \u2013 die Wirkung hebt sich auf, wie in der Mitte eines einzelnen Magneten.';
    modelContainer.appendChild(explLabel);
  }

  function completeStepB(stepId) {
    state.completedSteps[stepId] = true;
    state.animating = false;

    var btn = document.getElementById('step-btn-' + stepId);
    btn.classList.remove('active');
    btn.classList.add('completed');
    btn.disabled = true;

    // Enable next step
    var nextId = stepId + 1;
    var nextBtn = document.getElementById('step-btn-' + nextId);
    if (nextBtn) {
      nextBtn.disabled = false;
    }

    // Update progress
    var completed = Object.keys(state.completedSteps).length;
    var total = STEPS_B_WIRE.length + STEPS_B_BARS.length;
    var pct = Math.round((completed / total) * 100);
    var progressText = document.getElementById('progress-text');
    var progressFill = document.getElementById('progress-fill');
    if (progressText) progressText.textContent = completed + ' / ' + total + ' Schritte';
    if (progressFill) progressFill.style.width = pct + '%';

    // Show conclusion if all done
    if (completed === total) {
      var conc = document.getElementById('conclusion');
      if (conc) conc.classList.remove('hidden');
    }
  }

  // ==================== START ====================

  document.addEventListener('DOMContentLoaded', init);
})();
