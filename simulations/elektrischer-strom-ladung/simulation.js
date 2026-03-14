(function () {
  'use strict';

  // ==================== DATA ====================

  var EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'V1: Glimmlampe',
      title: 'V1: Kugel laden und mit Glimmlampe prüfen',
      instruction: 'Verbinde die metallbeschichtete Kugel mit einem Pol der elektrischen Quelle, um sie zu laden. Berühre sie anschließend mit der Glimmlampe und beobachte, welches Ende der Lampe aufleuchtet.',
      type: 'glow-lamp-detect',
      conclusion: 'Die Glimmlampe kann elektrische Ladung nachweisen. Wird die Kugel mit dem Minuspol geladen, leuchtet das kugelnahe Ende der Glimmlampe auf. Wird sie mit dem Pluspol geladen, leuchtet das kugelferne Ende. So zeigt die Glimmlampe die Art der Ladung an.'
    },
    b: {
      id: 'b',
      tab: 'V2: Alustreifen',
      title: 'V2: Zwei Aluminiumstreifen – Anziehung und Abstoßung',
      instruction: 'Lade die zwei nebeneinander hängenden Aluminiumstreifen mit Hilfe der elektrischen Quelle. Berühre sie jeweils kurz mit einem Pol und beobachte, ob sich die Streifen anziehen oder abstoßen.',
      type: 'aluminum-strips',
      conclusion: 'Gleichnamige Ladungen stoßen sich ab: Werden beide Streifen mit dem gleichen Pol geladen, spreizen sie sich auseinander. Ungleichnamige Ladungen ziehen sich an: Werden die Streifen mit verschiedenen Polen geladen, bewegen sie sich aufeinander zu.'
    },
    c: {
      id: 'c',
      tab: 'V3: Offener Kreis',
      title: 'V3: Offener Stromkreis mit Metallplatten',
      instruction: 'Ein Stromkreis ist geöffnet. An den offenen Enden sind Metallplatten angebracht. Berühre jede Platte mit einer Experimentierkugel und prüfe mit der Glimmlampe. Beobachte, welches Ende der Lampe leuchtet.',
      type: 'open-circuit-plates',
      conclusion: 'An der mit dem Minuspol verbundenen Platte leuchtet das der Platte zugewandte Ende der Glimmlampe auf. An der mit dem Pluspol verbundenen Platte ist es das der Platte abgewandte Ende. Ladungen sammeln sich an den Platten eines offenen Stromkreises.'
    },
    d: {
      id: 'd',
      tab: 'V4: Ladungstrennung',
      title: 'V4: Ladungstrennung mit Kunststoff- und Aluminiumfolie',
      instruction: 'Lege ein Stück Aluminiumfolie unter die Kunststofffolie eines Schnellhefters und presse die Folien fest aufeinander. Prüfe mit der Glimmlampe. Ziehe dann die Kunststofffolie hoch und prüfe beide Folien erneut.',
      type: 'charge-separation',
      conclusion: 'Durch Andrücken und Trennen von Kunststoff und Aluminium werden Ladungen getrennt. Die Kunststofffolie trägt nach dem Trennen negative Ladung – die Glimmlampe leuchtet mehrmals auf. Die Aluminiumfolie trägt positive Ladung – die Lampe leuchtet einmal auf, jedoch am anderen Ende.'
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
      case 'glow-lamp-detect': renderV1(panel); break;
      case 'aluminum-strips': renderV2(panel); break;
      case 'open-circuit-plates': renderV3(panel); break;
      case 'charge-separation': renderV4(panel); break;
    }
  }

  // ==================== SHARED: GLOW LAMP DRAWING ====================

  function createGlowLamp(container, x, y, glowEnd, label) {
    // glowEnd: null, 'near', 'far'
    var lamp = document.createElement('div');
    lamp.className = 'glow-lamp';
    lamp.style.left = x + 'px';
    lamp.style.top = y + 'px';

    var tube = document.createElement('div');
    tube.className = 'glow-lamp-tube';

    var nearEnd = document.createElement('div');
    nearEnd.className = 'glow-lamp-end near' + (glowEnd === 'near' ? ' glowing' : '');
    nearEnd.textContent = '\u25C0'; // left arrow

    var farEnd = document.createElement('div');
    farEnd.className = 'glow-lamp-end far' + (glowEnd === 'far' ? ' glowing' : '');
    farEnd.textContent = '\u25B6'; // right arrow

    tube.appendChild(nearEnd);
    tube.appendChild(farEnd);
    lamp.appendChild(tube);

    if (label) {
      var lbl = document.createElement('span');
      lbl.className = 'glow-lamp-label';
      lbl.textContent = label;
      lamp.appendChild(lbl);
    }

    container.appendChild(lamp);
    return lamp;
  }

  // ==================== V1: GLOW LAMP DETECTION ====================

  function renderV1(panel) {
    state.ballCharge = null;
    state.lampTouched = false;
    state.testedCombos = {};

    // Visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'sim-viz';
    viz.id = 'v1-viz';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Controls
    var controlCard = document.createElement('div');
    controlCard.className = 'card';

    var chargeLabel = document.createElement('div');
    chargeLabel.className = 'control-label';
    chargeLabel.textContent = 'Schritt 1: Kugel laden';
    controlCard.appendChild(chargeLabel);

    var chargeRow = document.createElement('div');
    chargeRow.className = 'btn-row mt-sm';

    var minusBtn = document.createElement('button');
    minusBtn.className = 'btn btn-primary';
    minusBtn.textContent = 'Minuspol (\u2212) berühren';
    minusBtn.id = 'v1-minus-btn';

    var plusBtn = document.createElement('button');
    plusBtn.className = 'btn btn-danger';
    plusBtn.textContent = 'Pluspol (+) berühren';
    plusBtn.id = 'v1-plus-btn';

    chargeRow.appendChild(minusBtn);
    chargeRow.appendChild(plusBtn);
    controlCard.appendChild(chargeRow);

    var testLabel = document.createElement('div');
    testLabel.className = 'control-label mt-md';
    testLabel.textContent = 'Schritt 2: Mit Glimmlampe prüfen';
    controlCard.appendChild(testLabel);

    var testRow = document.createElement('div');
    testRow.className = 'btn-row mt-sm';

    var testBtn = document.createElement('button');
    testBtn.className = 'btn btn-secondary';
    testBtn.textContent = 'Glimmlampe an Kugel halten';
    testBtn.id = 'v1-test-btn';
    testBtn.disabled = true;

    var resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.textContent = 'Kugel entladen';
    resetBtn.id = 'v1-reset-btn';

    testRow.appendChild(testBtn);
    testRow.appendChild(resetBtn);
    controlCard.appendChild(testRow);

    panel.appendChild(controlCard);

    // Observation
    var obsDiv = document.createElement('div');
    obsDiv.className = 'observation neutral';
    obsDiv.id = 'v1-observation';
    obsDiv.textContent = 'Die Kugel ist ungeladen.';
    panel.appendChild(obsDiv);

    // Conclusion
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v1-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    drawV1(viz, null, null);

    function onMinus() {
      state.ballCharge = 'negative';
      state.lampTouched = false;
      testBtn.disabled = false;
      drawV1(viz, 'negative', null);
      document.getElementById('v1-observation').className = 'observation glow-near';
      document.getElementById('v1-observation').textContent = 'Die Kugel ist negativ geladen (\u2212). Prüfe jetzt mit der Glimmlampe.';
    }

    function onPlus() {
      state.ballCharge = 'positive';
      state.lampTouched = false;
      testBtn.disabled = false;
      drawV1(viz, 'positive', null);
      document.getElementById('v1-observation').className = 'observation glow-far';
      document.getElementById('v1-observation').textContent = 'Die Kugel ist positiv geladen (+). Prüfe jetzt mit der Glimmlampe.';
    }

    function onTest() {
      if (!state.ballCharge) return;
      state.lampTouched = true;
      var glowEnd = state.ballCharge === 'negative' ? 'near' : 'far';
      drawV1(viz, state.ballCharge, glowEnd);

      state.testedCombos[state.ballCharge] = true;

      var obs = document.getElementById('v1-observation');
      if (glowEnd === 'near') {
        obs.className = 'observation glow-near';
        obs.textContent = 'Die Glimmlampe leuchtet am kugelnahen Ende auf! Die Kugel trägt negative Ladung.';
      } else {
        obs.className = 'observation glow-far';
        obs.textContent = 'Die Glimmlampe leuchtet am kugelfernen Ende auf! Die Kugel trägt positive Ladung.';
      }

      if (state.testedCombos.negative && state.testedCombos.positive) {
        document.getElementById('v1-conclusion').classList.remove('hidden');
      }
    }

    function onReset() {
      state.ballCharge = null;
      state.lampTouched = false;
      testBtn.disabled = true;
      drawV1(viz, null, null);
      document.getElementById('v1-observation').className = 'observation neutral';
      document.getElementById('v1-observation').textContent = 'Die Kugel ist ungeladen.';
    }

    minusBtn.addEventListener('click', onMinus);
    plusBtn.addEventListener('click', onPlus);
    testBtn.addEventListener('click', onTest);
    resetBtn.addEventListener('click', onReset);

    cleanupFns.push(function () {
      minusBtn.removeEventListener('click', onMinus);
      plusBtn.removeEventListener('click', onPlus);
      testBtn.removeEventListener('click', onTest);
      resetBtn.removeEventListener('click', onReset);
    });
  }

  function drawV1(container, charge, glowEnd) {
    container.innerHTML = '';
    var w = container.offsetWidth || 400;
    var h = container.offsetHeight || 320;

    // Battery at top-left
    var battX = 60;
    var battY = 50;
    var battEl = document.createElement('div');
    battEl.className = 'battery';
    battEl.style.left = battX + 'px';
    battEl.style.top = battY + 'px';
    var battBody = document.createElement('div');
    battBody.className = 'battery-body';
    battBody.style.width = '52px';
    var battLabel = document.createElement('span');
    battLabel.className = 'battery-label';
    battLabel.textContent = 'Quelle';
    battBody.appendChild(battLabel);
    battEl.appendChild(battBody);
    container.appendChild(battEl);

    // Pole labels
    var minusLabel = document.createElement('span');
    minusLabel.className = 'pole-label minus';
    minusLabel.textContent = '\u2212';
    minusLabel.style.left = (battX - 10) + 'px';
    minusLabel.style.top = (battY + 28) + 'px';
    container.appendChild(minusLabel);

    var plusLabel = document.createElement('span');
    plusLabel.className = 'pole-label plus';
    plusLabel.textContent = '+';
    plusLabel.style.left = (battX + 52) + 'px';
    plusLabel.style.top = (battY + 28) + 'px';
    container.appendChild(plusLabel);

    // Metal ball at center
    var ballX = w * 0.42 - 32;
    var ballY = h * 0.45 - 32;
    var ball = document.createElement('div');
    ball.className = 'metal-ball' + (charge ? ' charged-' + charge : '');
    ball.style.left = ballX + 'px';
    ball.style.top = ballY + 'px';

    if (charge) {
      var chargeLbl = document.createElement('span');
      chargeLbl.className = 'ball-charge-label ' + charge;
      chargeLbl.textContent = charge === 'negative' ? '\u2212\u2212\u2212' : '+ + +';
      ball.appendChild(chargeLbl);
    }
    container.appendChild(ball);

    // Ball label
    var ballLabel = document.createElement('span');
    ballLabel.style.cssText = 'position:absolute; font-size:0.7rem; font-weight:600; color:var(--text-sec); z-index:4;';
    ballLabel.style.left = (ballX + 8) + 'px';
    ballLabel.style.top = (ballY + 70) + 'px';
    ballLabel.textContent = 'Metallkugel';
    container.appendChild(ballLabel);

    // SVG wires from battery to ball
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none; z-index:1;';

    if (charge) {
      var wireColor = charge === 'negative' ? '#2563eb' : '#dc2626';
      var startX = charge === 'negative' ? battX + 4 : battX + 48;

      var pathD = 'M ' + startX + ' ' + (battY + 24) +
        ' L ' + startX + ' ' + (ballY + 32) +
        ' L ' + (ballX + 10) + ' ' + (ballY + 32);

      var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', pathD);
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('stroke', wireColor);
      pathEl.setAttribute('stroke-width', '2.5');
      pathEl.setAttribute('stroke-linecap', 'round');
      pathEl.setAttribute('stroke-linejoin', 'round');
      pathEl.setAttribute('stroke-dasharray', '6,4');
      svg.appendChild(pathEl);
    }

    container.appendChild(svg);

    // Glow lamp to the right of the ball
    var lampX = w * 0.58;
    var lampY = ballY + 22;

    if (glowEnd) {
      createGlowLamp(container, lampX, lampY, glowEnd, 'Glimmlampe');

      // Spark effect at the glowing end
      var sparkX = glowEnd === 'near' ? lampX + 5 : lampX + 65;
      var sparkEl = document.createElement('div');
      sparkEl.className = 'spark';
      sparkEl.style.left = sparkX + 'px';
      sparkEl.style.top = (lampY - 2) + 'px';
      container.appendChild(sparkEl);
    } else {
      createGlowLamp(container, lampX, lampY, null, 'Glimmlampe');
    }

    // Labels for glow lamp ends
    var nearLabel = document.createElement('span');
    nearLabel.style.cssText = 'position:absolute; font-size:0.55rem; color:var(--text-sec); z-index:6;';
    nearLabel.style.left = (lampX + 2) + 'px';
    nearLabel.style.top = (lampY - 14) + 'px';
    nearLabel.textContent = 'nah';
    container.appendChild(nearLabel);

    var farLabel = document.createElement('span');
    farLabel.style.cssText = 'position:absolute; font-size:0.55rem; color:var(--text-sec); z-index:6;';
    farLabel.style.left = (lampX + 62) + 'px';
    farLabel.style.top = (lampY - 14) + 'px';
    farLabel.textContent = 'fern';
    container.appendChild(farLabel);
  }

  // ==================== V2: ALUMINUM STRIPS ====================

  function renderV2(panel) {
    state.strip1Charge = null;
    state.strip2Charge = null;
    state.testedCombos = {};
    state.charged = false;

    // Visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'sim-viz';
    viz.id = 'v2-viz';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Controls
    var controlCard = document.createElement('div');
    controlCard.className = 'card';

    // Strip 1 selector
    var s1Row = document.createElement('div');
    s1Row.className = 'control-row';
    var s1Label = document.createElement('span');
    s1Label.className = 'control-label';
    s1Label.textContent = 'Streifen 1:';
    var s1Select = document.createElement('select');
    s1Select.className = 'select-control';
    s1Select.id = 'v2-s1';
    s1Select.innerHTML = '<option value="negative">Minuspol (\u2212)</option><option value="positive">Pluspol (+)</option>';
    s1Row.appendChild(s1Label);
    s1Row.appendChild(s1Select);
    controlCard.appendChild(s1Row);

    // Strip 2 selector
    var s2Row = document.createElement('div');
    s2Row.className = 'control-row mt-sm';
    var s2Label = document.createElement('span');
    s2Label.className = 'control-label';
    s2Label.textContent = 'Streifen 2:';
    var s2Select = document.createElement('select');
    s2Select.className = 'select-control';
    s2Select.id = 'v2-s2';
    s2Select.innerHTML = '<option value="negative">Minuspol (\u2212)</option><option value="positive">Pluspol (+)</option>';
    s2Row.appendChild(s2Label);
    s2Row.appendChild(s2Select);
    controlCard.appendChild(s2Row);

    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-sm';

    var chargeBtn = document.createElement('button');
    chargeBtn.className = 'btn btn-primary';
    chargeBtn.textContent = 'Streifen laden';
    chargeBtn.id = 'v2-charge-btn';

    var resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.textContent = 'Entladen';
    resetBtn.id = 'v2-reset-btn';

    btnRow.appendChild(chargeBtn);
    btnRow.appendChild(resetBtn);
    controlCard.appendChild(btnRow);

    panel.appendChild(controlCard);

    // Observation
    var obsDiv = document.createElement('div');
    obsDiv.className = 'observation neutral';
    obsDiv.id = 'v2-observation';
    obsDiv.textContent = 'Wähle die Ladung für jeden Streifen und drücke "Streifen laden".';
    panel.appendChild(obsDiv);

    // Conclusion
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v2-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    drawV2(viz, null, null, 'neutral');

    function onCharge() {
      state.strip1Charge = s1Select.value;
      state.strip2Charge = s2Select.value;
      state.charged = true;

      var sameCharge = state.strip1Charge === state.strip2Charge;
      var comboKey = sameCharge ? 'same' : 'different';
      state.testedCombos[comboKey] = true;

      var interaction = sameCharge ? 'repel' : 'attract';
      drawV2(viz, state.strip1Charge, state.strip2Charge, interaction);

      var obs = document.getElementById('v2-observation');
      if (sameCharge) {
        obs.className = 'observation repel';
        var poleName = state.strip1Charge === 'negative' ? 'Minuspol (\u2212)' : 'Pluspol (+)';
        obs.textContent = 'Beide Streifen sind mit dem ' + poleName + ' geladen. Sie stoßen sich ab!';
      } else {
        obs.className = 'observation attract';
        obs.textContent = 'Die Streifen sind mit verschiedenen Polen geladen. Sie ziehen sich an!';
      }

      if (state.testedCombos.same && state.testedCombos.different) {
        document.getElementById('v2-conclusion').classList.remove('hidden');
      }
    }

    function onReset() {
      state.strip1Charge = null;
      state.strip2Charge = null;
      state.charged = false;
      drawV2(viz, null, null, 'neutral');
      document.getElementById('v2-observation').className = 'observation neutral';
      document.getElementById('v2-observation').textContent = 'Wähle die Ladung für jeden Streifen und drücke "Streifen laden".';
    }

    chargeBtn.addEventListener('click', onCharge);
    resetBtn.addEventListener('click', onReset);

    cleanupFns.push(function () {
      chargeBtn.removeEventListener('click', onCharge);
      resetBtn.removeEventListener('click', onReset);
    });
  }

  function drawV2(container, s1Charge, s2Charge, interaction) {
    container.innerHTML = '';
    var w = container.offsetWidth || 400;
    var h = container.offsetHeight || 320;

    // Battery at top
    var battX = w * 0.5 - 26;
    var battY = 12;
    var battEl = document.createElement('div');
    battEl.className = 'battery';
    battEl.style.left = battX + 'px';
    battEl.style.top = battY + 'px';
    var battBody = document.createElement('div');
    battBody.className = 'battery-body';
    battBody.style.width = '52px';
    var battLabel = document.createElement('span');
    battLabel.className = 'battery-label';
    battLabel.textContent = 'Quelle';
    battBody.appendChild(battLabel);
    battEl.appendChild(battBody);
    container.appendChild(battEl);

    // Support bar
    var support = document.createElement('div');
    support.className = 'strips-support';
    container.appendChild(support);

    // Strip 1 (left)
    var strip1 = document.createElement('div');
    strip1.className = 'strip-wrapper left';
    if (interaction === 'repel') strip1.classList.add('repel-left');
    else if (interaction === 'attract') strip1.classList.add('attract-left');
    else strip1.classList.add('neutral');

    var stripEl1 = document.createElement('div');
    stripEl1.className = 'aluminum-strip';
    strip1.appendChild(stripEl1);

    if (s1Charge) {
      var charges1 = [30, 60, 90, 120];
      charges1.forEach(function (cy) {
        var ch = document.createElement('div');
        ch.className = 'strip-charge ' + s1Charge;
        ch.textContent = s1Charge === 'negative' ? '\u2212' : '+';
        ch.style.left = '-8px';
        ch.style.top = cy + 'px';
        strip1.appendChild(ch);
      });
    }
    container.appendChild(strip1);

    // Strip label 1
    var lbl1 = document.createElement('span');
    lbl1.style.cssText = 'position:absolute; font-size:0.65rem; font-weight:600; color:var(--text-sec); z-index:4; bottom:30px; left:calc(50% - 70px); text-align:center;';
    lbl1.textContent = 'Streifen 1';
    container.appendChild(lbl1);

    // Strip 2 (right)
    var strip2 = document.createElement('div');
    strip2.className = 'strip-wrapper right';
    if (interaction === 'repel') strip2.classList.add('repel-right');
    else if (interaction === 'attract') strip2.classList.add('attract-right');
    else strip2.classList.add('neutral');

    var stripEl2 = document.createElement('div');
    stripEl2.className = 'aluminum-strip';
    strip2.appendChild(stripEl2);

    if (s2Charge) {
      var charges2 = [30, 60, 90, 120];
      charges2.forEach(function (cy) {
        var ch = document.createElement('div');
        ch.className = 'strip-charge ' + s2Charge;
        ch.textContent = s2Charge === 'negative' ? '\u2212' : '+';
        ch.style.right = '-8px';
        ch.style.top = cy + 'px';
        strip2.appendChild(ch);
      });
    }
    container.appendChild(strip2);

    // Strip label 2
    var lbl2 = document.createElement('span');
    lbl2.style.cssText = 'position:absolute; font-size:0.65rem; font-weight:600; color:var(--text-sec); z-index:4; bottom:30px; left:calc(50% + 25px); text-align:center;';
    lbl2.textContent = 'Streifen 2';
    container.appendChild(lbl2);

    // Interaction arrows
    if (interaction === 'repel') {
      var arrowL = document.createElement('span');
      arrowL.style.cssText = 'position:absolute; font-size:1.5rem; color:#ca8a04; z-index:5; top:50%; left:calc(50% - 68px); transform:translateY(-50%);';
      arrowL.textContent = '\u2190';
      container.appendChild(arrowL);

      var arrowR = document.createElement('span');
      arrowR.style.cssText = 'position:absolute; font-size:1.5rem; color:#ca8a04; z-index:5; top:50%; left:calc(50% + 48px); transform:translateY(-50%);';
      arrowR.textContent = '\u2192';
      container.appendChild(arrowR);
    } else if (interaction === 'attract') {
      var arrowL2 = document.createElement('span');
      arrowL2.style.cssText = 'position:absolute; font-size:1.5rem; color:var(--green); z-index:5; top:50%; left:calc(50% - 63px); transform:translateY(-50%);';
      arrowL2.textContent = '\u2192';
      container.appendChild(arrowL2);

      var arrowR2 = document.createElement('span');
      arrowR2.style.cssText = 'position:absolute; font-size:1.5rem; color:var(--green); z-index:5; top:50%; left:calc(50% + 43px); transform:translateY(-50%);';
      arrowR2.textContent = '\u2190';
      container.appendChild(arrowR2);
    }
  }

  // ==================== V3: OPEN CIRCUIT WITH PLATES ====================

  function renderV3(panel) {
    state.selectedPlate = null;
    state.lampApplied = false;
    state.testedPlates = {};

    // Visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'sim-viz';
    viz.id = 'v3-viz';
    viz.style.height = '360px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Controls
    var controlCard = document.createElement('div');
    controlCard.className = 'card';

    var label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = 'Platte auswählen und mit Glimmlampe prüfen:';
    controlCard.appendChild(label);

    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row mt-sm';

    var minusPlateBtn = document.createElement('button');
    minusPlateBtn.className = 'btn btn-primary';
    minusPlateBtn.textContent = 'Glimmlampe an Minuspol-Platte';
    minusPlateBtn.id = 'v3-minus-btn';

    var plusPlateBtn = document.createElement('button');
    plusPlateBtn.className = 'btn btn-danger';
    plusPlateBtn.textContent = 'Glimmlampe an Pluspol-Platte';
    plusPlateBtn.id = 'v3-plus-btn';

    var resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.textContent = 'Zurücksetzen';
    resetBtn.id = 'v3-reset-btn';

    btnRow.appendChild(minusPlateBtn);
    btnRow.appendChild(plusPlateBtn);
    btnRow.appendChild(resetBtn);
    controlCard.appendChild(btnRow);

    panel.appendChild(controlCard);

    // Observation
    var obsDiv = document.createElement('div');
    obsDiv.className = 'observation neutral';
    obsDiv.id = 'v3-observation';
    obsDiv.textContent = 'Der Stromkreis ist geöffnet. An den offenen Enden befinden sich Metallplatten. Wähle eine Platte zum Prüfen.';
    panel.appendChild(obsDiv);

    // Conclusion
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v3-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    drawV3(viz, null, null);

    function onMinusPlate() {
      state.selectedPlate = 'minus';
      state.lampApplied = true;
      state.testedPlates.minus = true;
      drawV3(viz, 'minus', 'far');

      var obs = document.getElementById('v3-observation');
      obs.className = 'observation glow-near';
      obs.textContent = 'An der Minuspol-Platte leuchtet das der Platte zugewandte Ende der Glimmlampe auf! Hier sammeln sich negative Ladungen.';

      if (state.testedPlates.minus && state.testedPlates.plus) {
        document.getElementById('v3-conclusion').classList.remove('hidden');
      }
    }

    function onPlusPlate() {
      state.selectedPlate = 'plus';
      state.lampApplied = true;
      state.testedPlates.plus = true;
      drawV3(viz, 'plus', 'far');

      var obs = document.getElementById('v3-observation');
      obs.className = 'observation glow-far';
      obs.textContent = 'An der Pluspol-Platte leuchtet das der Platte abgewandte Ende der Glimmlampe auf! Hier herrscht ein Mangel an negativen Ladungen.';

      if (state.testedPlates.minus && state.testedPlates.plus) {
        document.getElementById('v3-conclusion').classList.remove('hidden');
      }
    }

    function onReset() {
      state.selectedPlate = null;
      state.lampApplied = false;
      drawV3(viz, null, null);
      document.getElementById('v3-observation').className = 'observation neutral';
      document.getElementById('v3-observation').textContent = 'Der Stromkreis ist geöffnet. An den offenen Enden befinden sich Metallplatten. Wähle eine Platte zum Prüfen.';
    }

    minusPlateBtn.addEventListener('click', onMinusPlate);
    plusPlateBtn.addEventListener('click', onPlusPlate);
    resetBtn.addEventListener('click', onReset);

    cleanupFns.push(function () {
      minusPlateBtn.removeEventListener('click', onMinusPlate);
      plusPlateBtn.removeEventListener('click', onPlusPlate);
      resetBtn.removeEventListener('click', onReset);
    });
  }

  function drawV3(container, activePlate, glowEnd) {
    container.innerHTML = '';
    var w = container.offsetWidth || 400;
    var h = container.offsetHeight || 360;

    var cx = w * 0.5;
    var leftX = w * 0.18;
    var rightX = w * 0.82;
    var topY = 40;
    var midY = h * 0.5;
    var botY = h - 50;

    // Battery at top center
    var battEl = document.createElement('div');
    battEl.className = 'battery';
    battEl.style.left = (cx - 26) + 'px';
    battEl.style.top = topY + 'px';
    var battBody = document.createElement('div');
    battBody.className = 'battery-body';
    battBody.style.width = '52px';
    var battLabel = document.createElement('span');
    battLabel.className = 'battery-label';
    battLabel.textContent = 'Quelle';
    battBody.appendChild(battLabel);
    battEl.appendChild(battBody);
    container.appendChild(battEl);

    // Pole labels on battery
    var minusLbl = document.createElement('span');
    minusLbl.className = 'pole-label minus';
    minusLbl.textContent = '\u2212';
    minusLbl.style.left = (cx - 40) + 'px';
    minusLbl.style.top = (topY + 28) + 'px';
    container.appendChild(minusLbl);

    var plusLbl = document.createElement('span');
    plusLbl.className = 'pole-label plus';
    plusLbl.textContent = '+';
    plusLbl.style.left = (cx + 30) + 'px';
    plusLbl.style.top = (topY + 28) + 'px';
    container.appendChild(plusLbl);

    // Metal plates
    var plateLeftX = cx - 30;
    var plateRightX = cx + 14;
    var plateY = midY + 20;

    // Left plate (minus)
    var plateL = document.createElement('div');
    plateL.className = 'plate minus-plate' + (activePlate === 'minus' ? ' active-plate' : '');
    plateL.style.left = plateLeftX + 'px';
    plateL.style.top = plateY + 'px';
    container.appendChild(plateL);

    // Right plate (plus)
    var plateR = document.createElement('div');
    plateR.className = 'plate plus-plate' + (activePlate === 'plus' ? ' active-plate' : '');
    plateR.style.left = plateRightX + 'px';
    plateR.style.top = plateY + 'px';
    container.appendChild(plateR);

    // Plate labels
    var plateLLabel = document.createElement('span');
    plateLLabel.style.cssText = 'position:absolute; font-size:0.6rem; font-weight:600; color:var(--accent); z-index:4;';
    plateLLabel.style.left = (plateLeftX - 28) + 'px';
    plateLLabel.style.top = (plateY + 32) + 'px';
    plateLLabel.textContent = '\u2212 Platte';
    container.appendChild(plateLLabel);

    var plateRLabel = document.createElement('span');
    plateRLabel.style.cssText = 'position:absolute; font-size:0.6rem; font-weight:600; color:var(--red); z-index:4;';
    plateRLabel.style.left = (plateRightX + 20) + 'px';
    plateRLabel.style.top = (plateY + 32) + 'px';
    plateRLabel.textContent = '+ Platte';
    container.appendChild(plateRLabel);

    // Charge symbols on plates
    var chargesL = document.createElement('div');
    chargesL.className = 'plate-charges';
    chargesL.style.left = (plateLeftX - 18) + 'px';
    chargesL.style.top = (plateY + 5) + 'px';
    for (var i = 0; i < 4; i++) {
      var cs = document.createElement('div');
      cs.className = 'plate-charge-symbol neg';
      cs.textContent = '\u2212';
      chargesL.appendChild(cs);
    }
    container.appendChild(chargesL);

    var chargesR = document.createElement('div');
    chargesR.className = 'plate-charges';
    chargesR.style.left = (plateRightX + 20) + 'px';
    chargesR.style.top = (plateY + 5) + 'px';
    for (var j = 0; j < 4; j++) {
      var cs2 = document.createElement('div');
      cs2.className = 'plate-charge-symbol pos';
      cs2.textContent = '+';
      chargesR.appendChild(cs2);
    }
    container.appendChild(chargesR);

    // SVG wires
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none; z-index:1;';

    // Left wire: battery minus -> down left -> plate left
    var pathLeft = 'M ' + (cx - 26) + ' ' + (topY + 12) +
      ' L ' + leftX + ' ' + (topY + 12) +
      ' L ' + leftX + ' ' + (plateY + 40) +
      ' L ' + (plateLeftX + 8) + ' ' + (plateY + 40) +
      ' L ' + (plateLeftX + 8) + ' ' + (plateY + 80);

    // Right wire: battery plus -> down right -> plate right
    var pathRight = 'M ' + (cx + 26) + ' ' + (topY + 12) +
      ' L ' + rightX + ' ' + (topY + 12) +
      ' L ' + rightX + ' ' + (plateY + 40) +
      ' L ' + (plateRightX + 8) + ' ' + (plateY + 40) +
      ' L ' + (plateRightX + 8) + ' ' + (plateY + 80);

    var pathL = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathL.setAttribute('d', pathLeft);
    pathL.setAttribute('fill', 'none');
    pathL.setAttribute('stroke', '#2563eb');
    pathL.setAttribute('stroke-width', '2.5');
    pathL.setAttribute('stroke-linecap', 'round');
    pathL.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(pathL);

    var pathR = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathR.setAttribute('d', pathRight);
    pathR.setAttribute('fill', 'none');
    pathR.setAttribute('stroke', '#dc2626');
    pathR.setAttribute('stroke-width', '2.5');
    pathR.setAttribute('stroke-linecap', 'round');
    pathR.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(pathR);

    // Gap symbol between plates
    var gapText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    gapText.setAttribute('x', cx);
    gapText.setAttribute('y', plateY - 8);
    gapText.setAttribute('text-anchor', 'middle');
    gapText.setAttribute('font-size', '12');
    gapText.setAttribute('fill', '#9ca3af');
    gapText.textContent = 'Lücke';
    svg.appendChild(gapText);

    container.appendChild(svg);

    // Glow lamp at active plate
    if (activePlate && glowEnd) {
      var lampX, lampY2;
      if (activePlate === 'minus') {
        lampX = plateLeftX - 90;
        lampY2 = plateY + 28;
      } else {
        lampX = plateRightX + 30;
        lampY2 = plateY + 28;
      }
      createGlowLamp(container, lampX, lampY2, glowEnd, 'Glimmlampe');

      // Spark
      var sparkX2 = glowEnd === 'near' ? lampX + 5 : lampX + 65;
      var sparkEl = document.createElement('div');
      sparkEl.className = 'spark';
      sparkEl.style.left = sparkX2 + 'px';
      sparkEl.style.top = (lampY2 - 2) + 'px';
      container.appendChild(sparkEl);
    }
  }

  // ==================== V4: CHARGE SEPARATION ====================

  function renderV4(panel) {
    state.phase = 'together';
    state.testedTogether = false;
    state.plasticTouchCount = 0;
    state.plasticMaxTouches = 4;
    state.aluminumTested = false;

    // Visualization
    var vizCard = document.createElement('div');
    vizCard.className = 'card';
    var viz = document.createElement('div');
    viz.className = 'sim-viz';
    viz.id = 'v4-viz';
    viz.style.height = '340px';
    vizCard.appendChild(viz);
    panel.appendChild(vizCard);

    // Controls - together phase
    var controlCard = document.createElement('div');
    controlCard.className = 'card';
    controlCard.id = 'v4-controls';
    panel.appendChild(controlCard);

    // Observation
    var obsDiv = document.createElement('div');
    obsDiv.className = 'observation neutral';
    obsDiv.id = 'v4-observation';
    obsDiv.textContent = 'Die Kunststofffolie liegt auf der Aluminiumfolie. Teste mit der Glimmlampe oder trenne die Folien.';
    panel.appendChild(obsDiv);

    // Charge count (hidden initially)
    var countDiv = document.createElement('div');
    countDiv.className = 'charge-count hidden';
    countDiv.id = 'v4-charge-count';
    countDiv.textContent = '';
    panel.appendChild(countDiv);

    // Conclusion
    var conclusionDiv = document.createElement('div');
    conclusionDiv.className = 'conclusion hidden';
    conclusionDiv.id = 'v4-conclusion';
    conclusionDiv.innerHTML = '<strong>Erkenntnis:</strong> ' + currentExp.conclusion;
    panel.appendChild(conclusionDiv);

    drawV4(viz, 'together', null, null);
    renderV4Controls();

    function renderV4Controls() {
      var controlCard2 = document.getElementById('v4-controls');
      controlCard2.innerHTML = '';

      if (state.phase === 'together') {
        var label = document.createElement('div');
        label.className = 'control-label';
        label.textContent = 'Folien liegen aufeinander:';
        controlCard2.appendChild(label);

        var btnRow = document.createElement('div');
        btnRow.className = 'btn-row mt-sm';

        var testBtn = document.createElement('button');
        testBtn.className = 'btn btn-secondary';
        testBtn.textContent = 'Glimmlampe testen';

        var sepBtn = document.createElement('button');
        sepBtn.className = 'btn btn-primary';
        sepBtn.textContent = 'Kunststofffolie hochziehen';

        btnRow.appendChild(testBtn);
        btnRow.appendChild(sepBtn);
        controlCard2.appendChild(btnRow);

        function onTestTogether() {
          state.testedTogether = true;
          drawV4(viz, 'together', null, 'none');

          var obs = document.getElementById('v4-observation');
          obs.className = 'observation no-glow';
          obs.textContent = 'Die Glimmlampe leuchtet nicht. Die Folien tragen keine getrennte Ladung, solange sie aufeinander liegen.';
        }

        function onSeparate() {
          state.phase = 'separated';
          drawV4(viz, 'separated', null, null);

          var obs = document.getElementById('v4-observation');
          obs.className = 'observation neutral';
          obs.textContent = 'Die Folien sind getrennt. Durch das Andrücken und Trennen wurden Ladungen getrennt. Prüfe jetzt beide Folien.';

          document.getElementById('v4-charge-count').classList.remove('hidden');
          document.getElementById('v4-charge-count').textContent = 'Ladung auf Kunststofffolie: ' + (state.plasticMaxTouches - state.plasticTouchCount) + ' Entladungen möglich';

          renderV4Controls();
        }

        testBtn.addEventListener('click', onTestTogether);
        sepBtn.addEventListener('click', onSeparate);
        cleanupFns.push(function () {
          testBtn.removeEventListener('click', onTestTogether);
          sepBtn.removeEventListener('click', onSeparate);
        });

      } else {
        // Separated phase
        var label2 = document.createElement('div');
        label2.className = 'control-label';
        label2.textContent = 'Folien sind getrennt – mit Glimmlampe prüfen:';
        controlCard2.appendChild(label2);

        var btnRow2 = document.createElement('div');
        btnRow2.className = 'btn-row mt-sm';

        var plasticBtn = document.createElement('button');
        var plasticDischarged = state.plasticTouchCount >= state.plasticMaxTouches;
        if (plasticDischarged) {
          plasticBtn.className = 'btn btn-secondary';
          plasticBtn.textContent = 'Kunststofffolie ist entladen';
          plasticBtn.disabled = true;
        } else {
          plasticBtn.className = 'btn btn-primary';
          plasticBtn.textContent = 'Glimmlampe an Kunststofffolie';
        }

        var aluBtn = document.createElement('button');
        if (state.aluminumTested) {
          aluBtn.className = 'btn btn-secondary';
          aluBtn.textContent = 'Aluminiumfolie ist entladen';
          aluBtn.disabled = true;
        } else {
          aluBtn.className = 'btn btn-danger';
          aluBtn.textContent = 'Glimmlampe an Aluminiumfolie';
        }

        var resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-secondary';
        resetBtn.textContent = 'Folien erneut pressen';

        btnRow2.appendChild(plasticBtn);
        btnRow2.appendChild(aluBtn);
        btnRow2.appendChild(resetBtn);
        controlCard2.appendChild(btnRow2);

        function onPlastic() {
          if (state.plasticTouchCount >= state.plasticMaxTouches) return;
          state.plasticTouchCount++;
          drawV4(viz, 'separated', 'plastic', 'far');

          var remaining = state.plasticMaxTouches - state.plasticTouchCount;
          document.getElementById('v4-charge-count').textContent = 'Ladung auf Kunststofffolie: ' + remaining + ' Entladung' + (remaining !== 1 ? 'en' : '') + ' möglich';

          var obs = document.getElementById('v4-observation');
          obs.className = 'observation glow-near';
          obs.textContent = 'Die Glimmlampe leuchtet am nahen Ende auf! Die Kunststofffolie trägt negative Ladung. (Berührung ' + state.plasticTouchCount + '/' + state.plasticMaxTouches + ')';

          if (state.plasticTouchCount >= state.plasticMaxTouches) {
            plasticBtn.disabled = true;
            plasticBtn.className = 'btn btn-secondary';
            plasticBtn.textContent = 'Kunststofffolie ist entladen';

            var obs2 = document.getElementById('v4-observation');
            obs2.className = 'observation neutral';
            obs2.textContent = 'Die Kunststofffolie ist vollständig entladen. Die Glimmlampe leuchtet nicht mehr.';
            drawV4(viz, 'separated', null, null);
          }

          checkV4Conclusion();
        }

        function onAlu() {
          if (state.aluminumTested) return;
          state.aluminumTested = true;
          drawV4(viz, 'separated', 'aluminum', 'near');

          document.getElementById('v4-charge-count').textContent = 'Aluminiumfolie: entladen nach einer Berührung';

          var obs = document.getElementById('v4-observation');
          obs.className = 'observation glow-far';
          obs.textContent = 'Die Glimmlampe leuchtet am fernen Ende auf – am anderen Ende als bei der Kunststofffolie! Die Aluminiumfolie trägt positive Ladung.';

          aluBtn.disabled = true;
          aluBtn.className = 'btn btn-secondary';
          aluBtn.textContent = 'Aluminiumfolie ist entladen';

          checkV4Conclusion();
        }

        function onResetV4() {
          state.phase = 'together';
          state.testedTogether = false;
          state.plasticTouchCount = 0;
          state.aluminumTested = false;
          drawV4(viz, 'together', null, null);
          document.getElementById('v4-observation').className = 'observation neutral';
          document.getElementById('v4-observation').textContent = 'Die Kunststofffolie liegt auf der Aluminiumfolie. Teste mit der Glimmlampe oder trenne die Folien.';
          document.getElementById('v4-charge-count').classList.add('hidden');
          renderV4Controls();
        }

        plasticBtn.addEventListener('click', onPlastic);
        aluBtn.addEventListener('click', onAlu);
        resetBtn.addEventListener('click', onResetV4);
        cleanupFns.push(function () {
          plasticBtn.removeEventListener('click', onPlastic);
          aluBtn.removeEventListener('click', onAlu);
          resetBtn.removeEventListener('click', onResetV4);
        });
      }
    }

    function checkV4Conclusion() {
      if (state.plasticTouchCount >= 1 && state.aluminumTested) {
        document.getElementById('v4-conclusion').classList.remove('hidden');
      }
    }
  }

  function drawV4(container, phase, target, glowEnd) {
    container.innerHTML = '';
    var w = container.offsetWidth || 400;
    var h = container.offsetHeight || 340;
    var cx = w * 0.5;

    // Plastic foil
    var plasticEl = document.createElement('div');
    plasticEl.className = 'foil-layer plastic-foil' + (phase === 'separated' ? ' separated' : '');
    container.appendChild(plasticEl);

    // Plastic label
    var plasticLabel = document.createElement('span');
    plasticLabel.className = 'foil-label';
    if (phase === 'separated') {
      plasticLabel.style.left = (cx + 100) + 'px';
      plasticLabel.style.top = '20px';
    } else {
      plasticLabel.style.left = (cx + 100) + 'px';
      plasticLabel.style.top = '88px';
    }
    plasticLabel.textContent = 'Kunststofffolie';
    container.appendChild(plasticLabel);

    // Aluminum foil
    var aluEl = document.createElement('div');
    aluEl.className = 'foil-layer aluminum-foil';
    container.appendChild(aluEl);

    // Aluminum label
    var aluLabel = document.createElement('span');
    aluLabel.className = 'foil-label';
    aluLabel.style.left = (cx + 100) + 'px';
    aluLabel.style.top = '215px';
    aluLabel.textContent = 'Aluminiumfolie';
    container.appendChild(aluLabel);

    // Charge particles (only when separated)
    if (phase === 'separated') {
      // Negative charges on plastic
      var plasticChargePositions = [
        { x: cx - 65, y: 25 }, { x: cx - 30, y: 18 },
        { x: cx + 5, y: 22 }, { x: cx + 40, y: 20 },
        { x: cx - 50, y: 55 }, { x: cx + 20, y: 50 }
      ];
      plasticChargePositions.forEach(function (pos) {
        var p = document.createElement('div');
        p.className = 'charge-particle negative visible';
        p.style.left = pos.x + 'px';
        p.style.top = pos.y + 'px';
        p.textContent = '\u2212';
        container.appendChild(p);
      });

      // Positive charges on aluminum
      var aluChargePositions = [
        { x: cx - 65, y: 115 }, { x: cx - 30, y: 110 },
        { x: cx + 5, y: 118 }, { x: cx + 40, y: 112 },
        { x: cx - 50, y: 145 }, { x: cx + 20, y: 140 }
      ];
      aluChargePositions.forEach(function (pos) {
        var p = document.createElement('div');
        p.className = 'charge-particle positive visible';
        p.style.left = pos.x + 'px';
        p.style.top = pos.y + 'px';
        p.textContent = '+';
        container.appendChild(p);
      });
    }

    // Glow lamp
    if (glowEnd === 'none') {
      // No glow - lamp shown but off
      var lampX = cx + 95;
      var lampY = 135;
      createGlowLamp(container, lampX, lampY, null, 'Glimmlampe');

      // X mark
      var noGlow = document.createElement('span');
      noGlow.style.cssText = 'position:absolute; font-size:1.5rem; color:var(--red); font-weight:800; z-index:10;';
      noGlow.style.left = (lampX + 32) + 'px';
      noGlow.style.top = (lampY - 20) + 'px';
      noGlow.textContent = '\u2717';
      container.appendChild(noGlow);
    } else if (target === 'plastic' && glowEnd) {
      var lampX2 = cx - 115;
      var lampY2 = phase === 'separated' ? 25 : 105;
      createGlowLamp(container, lampX2, lampY2, glowEnd, 'Glimmlampe');

      var sparkEl = document.createElement('div');
      sparkEl.className = 'spark';
      var sparkX = glowEnd === 'near' ? lampX2 + 5 : lampX2 + 65;
      sparkEl.style.left = sparkX + 'px';
      sparkEl.style.top = (lampY2 - 2) + 'px';
      container.appendChild(sparkEl);
    } else if (target === 'aluminum' && glowEnd) {
      var lampX3 = cx - 115;
      var lampY3 = 130;
      createGlowLamp(container, lampX3, lampY3, glowEnd, 'Glimmlampe');

      var sparkEl2 = document.createElement('div');
      sparkEl2.className = 'spark';
      var sparkX2 = glowEnd === 'near' ? lampX3 + 5 : lampX3 + 65;
      sparkEl2.style.left = sparkX2 + 'px';
      sparkEl2.style.top = (lampY3 - 2) + 'px';
      container.appendChild(sparkEl2);
    }

    // Phase indicator
    var phaseLabel = document.createElement('span');
    phaseLabel.style.cssText = 'position:absolute; bottom:12px; left:50%; transform:translateX(-50%); font-size:0.75rem; font-weight:600; color:var(--text-sec); z-index:5;';
    phaseLabel.textContent = phase === 'together' ? 'Folien liegen aufeinander' : 'Folien sind getrennt';
    container.appendChild(phaseLabel);
  }

  // ==================== START ====================

  window.addEventListener('DOMContentLoaded', init);
})();
