(function () {
  'use strict';

  // ==================== DATA ====================

  var EXPERIMENTS = {
    a: {
      id: 'a',
      tab: 'A: Magnetfelder',
      title: 'A: Magnetfelder sichtbar machen',
      instruction: 'Wähle einen Magneten aus und streue Eisenpfeilspäne auf die Folie. Beobachte, wie sich die Späne ausrichten und wo die Wirkung besonders stark ist.',
      type: 'field-viz',
      conclusion: 'Die Eisenpfeilspäne ordnen sich entlang der Feldlinien an. An den Polen ist die magnetische Wirkung am stärksten \u2013 dort sind die Feldlinien am dichtesten. Je dichter die Feldlinien beieinander liegen, desto stärker ist die magnetische Wirkung.'
    },
    b: {
      id: 'b',
      tab: 'B: Wechselwirkung',
      title: 'B: Die Wechselwirkung sichtbar machen',
      instruction: 'Wähle eine Polkombination und streue Eisenpfeilspäne. Beobachte, wie sich das Feldlinienbild je nach Ausrichtung der Pole verändert.',
      type: 'interaction-viz',
      conclusion: 'Bei ungleichnamigen Polen (N\u2194S) verlaufen die Feldlinien von einem Magneten zum anderen \u2013 die Magnete ziehen sich an. Bei gleichnamigen Polen (N\u2194N oder S\u2194S) stoßen sich die Feldlinien ab, es bildet sich ein feldfreier Bereich zwischen den Magneten \u2013 die Magnete stoßen sich ab.'
    }
  };

  var MAGNET_TYPES = [
    {
      id: 'stab',
      name: 'Stabmagnet',
      poles: [{ x: -70, y: 0, q: 1 }, { x: 70, y: 0, q: -1 }],
      isInside: function (x, y) {
        return Math.abs(x) < 75 && Math.abs(y) < 20;
      }
    },
    {
      id: 'hufeisen',
      name: 'Hufeisenmagnet',
      poles: [{ x: -30, y: 55, q: 1 }, { x: 30, y: 55, q: -1 }],
      isInside: function (x, y) {
        if (Math.abs(x + 34) < 14 && y > -45 && y < 58) return true;
        if (Math.abs(x - 34) < 14 && y > -45 && y < 58) return true;
        if (y > -52 && y < -35 && Math.abs(x) < 48) return true;
        return false;
      }
    },
    {
      id: 'scheiben',
      name: 'Scheibenmagnet',
      poles: [{ x: 0, y: -22, q: 1 }, { x: 0, y: 22, q: -1 }],
      isInside: function (x, y) {
        return (x * x + y * y) < 35 * 35;
      }
    }
  ];

  var POLE_CONFIGS = [
    {
      id: 'nn',
      name: 'N \u2194 N',
      desc: 'Gleichnamige Pole',
      leftPoles: [{ x: -130, y: 0, q: -1 }, { x: -50, y: 0, q: 1 }],
      rightPoles: [{ x: 50, y: 0, q: 1 }, { x: 130, y: 0, q: -1 }],
      leftFlip: true,
      rightFlip: false
    },
    {
      id: 'ns',
      name: 'N \u2194 S',
      desc: 'Ungleichnamige Pole',
      leftPoles: [{ x: -130, y: 0, q: -1 }, { x: -50, y: 0, q: 1 }],
      rightPoles: [{ x: 50, y: 0, q: -1 }, { x: 130, y: 0, q: 1 }],
      leftFlip: true,
      rightFlip: true
    },
    {
      id: 'sn',
      name: 'S \u2194 N',
      desc: 'Ungleichnamige Pole',
      leftPoles: [{ x: -130, y: 0, q: 1 }, { x: -50, y: 0, q: -1 }],
      rightPoles: [{ x: 50, y: 0, q: 1 }, { x: 130, y: 0, q: -1 }],
      leftFlip: false,
      rightFlip: false
    },
    {
      id: 'ss',
      name: 'S \u2194 S',
      desc: 'Gleichnamige Pole',
      leftPoles: [{ x: -130, y: 0, q: 1 }, { x: -50, y: 0, q: -1 }],
      rightPoles: [{ x: 50, y: 0, q: -1 }, { x: 130, y: 0, q: 1 }],
      leftFlip: false,
      rightFlip: true
    }
  ];

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
    if (exp.type === 'field-viz') renderFieldViz(container, exp);
    else if (exp.type === 'interaction-viz') renderInteractionViz(container, exp);
  }

  function resetState(key) {
    if (state.animId) {
      cancelAnimationFrame(state.animId);
    }
    if (key === 'a') {
      state = { tested: {}, currentMagnet: null, filings: null, animId: null, sprinkling: false };
    } else {
      state = { tested: {}, currentConfig: null, filings: null, animId: null, sprinkling: false };
    }
  }

  // ==================== MAGNETIC FIELD ====================

  function calcField(x, y, poles) {
    var bx = 0, by = 0;
    for (var i = 0; i < poles.length; i++) {
      var p = poles[i];
      var dx = x - p.x;
      var dy = y - p.y;
      var r2 = dx * dx + dy * dy;
      if (r2 < 25) r2 = 25;
      // 3D monopole model (1/r²): more realistic for iron filings
      // on a 2D surface experiencing a 3D magnetic field
      var r3 = r2 * Math.sqrt(r2);
      bx += p.q * dx / r3;
      by += p.q * dy / r3;
    }
    return { x: bx, y: by };
  }

  function fieldStrength(b) {
    return Math.sqrt(b.x * b.x + b.y * b.y);
  }

  function fieldAngle(b) {
    return Math.atan2(b.y, b.x);
  }

  // ==================== IRON FILINGS ====================

  function generateFilings(poles, isInside, canvasW, canvasH, count) {
    var filings = [];
    var maxAttempts = count * 4;
    var attempts = 0;

    while (filings.length < count && attempts < maxAttempts) {
      attempts++;
      var px, py;

      // 30% biased toward poles for natural density
      if (Math.random() < 0.3) {
        var poleIdx = Math.floor(Math.random() * poles.length);
        var pole = poles[poleIdx];
        var r = 15 + Math.random() * 90;
        var theta = Math.random() * Math.PI * 2;
        px = pole.x + r * Math.cos(theta);
        py = pole.y + r * Math.sin(theta);
      } else {
        px = (Math.random() - 0.5) * (canvasW - 40);
        py = (Math.random() - 0.5) * (canvasH - 40);
      }

      // Check bounds
      if (Math.abs(px) > canvasW / 2 - 15 || Math.abs(py) > canvasH / 2 - 15) continue;
      // Check inside magnet
      if (isInside && isInside(px, py)) continue;

      var b = calcField(px, py, poles);
      var str = fieldStrength(b);
      var angle = fieldAngle(b);

      // Small random jitter for realism
      angle += (Math.random() - 0.5) * 0.2;

      filings.push({
        x: px,
        y: py,
        targetAngle: angle,
        currentAngle: Math.random() * Math.PI * 2,
        strength: str,
        delay: Math.random() * 500,
        opacity: 0,
        length: 3 + Math.min(str * 15000, 5)
      });
    }
    return filings;
  }

  // Generate extra filings focused in the gap between two magnets (for unlike poles)
  function generateGapFilings(poles, canvasH, count) {
    var filings = [];
    var maxAttempts = count * 4;
    var attempts = 0;
    // Gap region: x from -45 to 45 (between the two bar magnets)
    var gapLeft = -45, gapRight = 45;

    while (filings.length < count && attempts < maxAttempts) {
      attempts++;
      // Concentrate filings along the horizontal axis with some vertical spread
      var px = gapLeft + Math.random() * (gapRight - gapLeft);
      // Gaussian-like vertical distribution: most filings near y=0
      var py = (Math.random() + Math.random() + Math.random() - 1.5) * 60;

      if (Math.abs(py) > canvasH / 2 - 15) continue;

      var b = calcField(px, py, poles);
      var str = fieldStrength(b);
      var angle = fieldAngle(b);

      angle += (Math.random() - 0.5) * 0.15;

      filings.push({
        x: px,
        y: py,
        targetAngle: angle,
        currentAngle: Math.random() * Math.PI * 2,
        strength: str,
        delay: Math.random() * 500,
        opacity: 0,
        length: 3 + Math.min(str * 15000, 5)
      });
    }
    return filings;
  }

  // ==================== CANVAS DRAWING ====================

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawStabmagnet(ctx) {
    var w = 140, h = 36;
    // N half (red)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-w / 2, -h / 2, w / 2, h);
    // S half (green)
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, -h / 2, w / 2, h);
    // Border
    roundRect(ctx, -w / 2, -h / 2, w, h, 4);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Dividing line
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(0, h / 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.stroke();
    // Labels
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', -w / 4, 0);
    ctx.fillText('S', w / 4, 0);
  }

  function drawHufeisenmagnet(ctx) {
    // Top connector (gray)
    ctx.fillStyle = '#94a3b8';
    roundRect(ctx, -45, -52, 90, 20, 8);
    ctx.fill();
    // Left arm (N - red)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-45, -36, 22, 88);
    // Left rounded bottom
    ctx.beginPath();
    ctx.arc(-34, 52, 11, 0, Math.PI);
    ctx.fill();
    // Right arm (S - green)
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(23, -36, 22, 88);
    // Right rounded bottom
    ctx.beginPath();
    ctx.arc(34, 52, 11, 0, Math.PI);
    ctx.fill();
    // Borders
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    roundRect(ctx, -45, -52, 90, 20, 8);
    ctx.stroke();
    ctx.strokeRect(-45, -36, 22, 88);
    ctx.strokeRect(23, -36, 22, 88);
    // Labels
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', -34, 25);
    ctx.fillText('S', 34, 25);
  }

  function drawScheibenmagnet(ctx) {
    var r = 35;
    // Top half (N - red)
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    // Bottom half (S - green)
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#16a34a';
    ctx.fill();
    // Border
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Dividing line
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Labels
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -14);
    ctx.fillText('S', 0, 14);
  }

  var MAGNET_DRAW_FNS = [drawStabmagnet, drawHufeisenmagnet, drawScheibenmagnet];

  function drawBarMagnet(ctx, x, y, flipped) {
    var w = 80, h = 30;
    ctx.save();
    ctx.translate(x, y);
    // Left half
    ctx.fillStyle = flipped ? '#16a34a' : '#dc2626';
    ctx.fillRect(-w / 2, -h / 2, w / 2, h);
    // Right half
    ctx.fillStyle = flipped ? '#dc2626' : '#16a34a';
    ctx.fillRect(0, -h / 2, w / 2, h);
    // Border
    roundRect(ctx, -w / 2, -h / 2, w, h, 3);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Dividing line
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(0, h / 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.stroke();
    // Labels
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(flipped ? 'S' : 'N', -w / 4, 0);
    ctx.fillText(flipped ? 'N' : 'S', w / 4, 0);
    ctx.restore();
  }

  // ==================== ANIMATION ====================

  function animateFilings(canvas, ctx, drawMagnetFn, filings) {
    var dpr = window.devicePixelRatio || 1;
    var startTime = Date.now();

    function frame() {
      var t = Date.now() - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      var cw = canvas.width / dpr;
      var ch = canvas.height / dpr;

      // Background
      ctx.fillStyle = '#f8fafb';
      ctx.fillRect(0, 0, cw, ch);

      // Draw magnet
      ctx.save();
      ctx.translate(cw / 2, ch / 2);
      drawMagnetFn(ctx);
      ctx.restore();

      // Draw filings
      var allSettled = true;
      ctx.save();
      ctx.translate(cw / 2, ch / 2);
      for (var i = 0; i < filings.length; i++) {
        var f = filings[i];
        if (t < f.delay) {
          allSettled = false;
          continue;
        }
        var elapsed = t - f.delay;
        f.opacity = Math.min(1, elapsed / 250);

        // Ease toward target angle
        var diff = f.targetAngle - f.currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        var blend = Math.min(1, elapsed / 350);
        f.currentAngle += diff * blend;
        if (blend < 1 || f.opacity < 1) allSettled = false;

        var alpha = f.opacity * Math.min(0.85, f.strength * 5000 + 0.06);
        if (alpha < 0.03) continue;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.currentAngle);
        ctx.strokeStyle = 'rgba(55, 65, 81, ' + alpha.toFixed(2) + ')';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-f.length / 2, 0);
        ctx.lineTo(f.length / 2, 0);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      ctx.restore();

      if (!allSettled) {
        state.animId = requestAnimationFrame(frame);
      } else {
        // Draw final static frame
        drawStaticFrame(canvas, ctx, drawMagnetFn, filings);
        state.animId = null;
      }
    }

    if (state.animId) cancelAnimationFrame(state.animId);
    state.animId = requestAnimationFrame(frame);
  }

  function drawStaticFrame(canvas, ctx, drawMagnetFn, filings) {
    var dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    var cw = canvas.width / dpr;
    var ch = canvas.height / dpr;

    ctx.fillStyle = '#f8fafb';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    drawMagnetFn(ctx);
    ctx.restore();

    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    for (var i = 0; i < filings.length; i++) {
      var f = filings[i];
      var alpha = Math.min(0.85, f.strength * 5000 + 0.06);
      if (alpha < 0.03) continue;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.targetAngle);
      ctx.strokeStyle = 'rgba(55, 65, 81, ' + alpha.toFixed(2) + ')';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-f.length / 2, 0);
      ctx.lineTo(f.length / 2, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }

  // ==================== CANVAS SETUP ====================

  function setupCanvas(container, height) {
    var wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    var canvas = document.createElement('canvas');
    canvas.className = 'sim-canvas';
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);

    function resize() {
      var dpr = window.devicePixelRatio || 1;
      var w = wrapper.clientWidth || 400;
      canvas.width = w * dpr;
      canvas.height = height * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = height + 'px';
    }
    resize();

    var resizeHandler = function () {
      resize();
      // Redraw current state if filings exist
      if (state.filings && state.filings.length > 0 && !state.animId) {
        var drawFn = getCurrentDrawFn();
        if (drawFn) drawStaticFrame(canvas, canvas.getContext('2d'), drawFn, state.filings);
      }
    };
    window.addEventListener('resize', resizeHandler);
    cleanupFns.push(function () {
      window.removeEventListener('resize', resizeHandler);
      if (state.animId) {
        cancelAnimationFrame(state.animId);
        state.animId = null;
      }
    });

    return { canvas: canvas, wrapper: wrapper, resize: resize };
  }

  function getCurrentDrawFn() {
    if (currentExp === 'a' && state.currentMagnet !== null) {
      return MAGNET_DRAW_FNS[state.currentMagnet];
    } else if (currentExp === 'b' && state.currentConfig !== null) {
      var cfg = POLE_CONFIGS[state.currentConfig];
      return function (ctx) {
        drawBarMagnet(ctx, -90, 0, cfg.leftFlip);
        drawBarMagnet(ctx, 90, 0, cfg.rightFlip);
      };
    }
    return null;
  }

  function drawEmptyCanvas(canvas, ctx, text) {
    var dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    var cw = canvas.width / dpr;
    var ch = canvas.height / dpr;
    ctx.fillStyle = '#f8fafb';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cw / 2, ch / 2);
    ctx.restore();
  }

  function drawMagnetOnly(canvas, ctx, drawFn) {
    var dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    var cw = canvas.width / dpr;
    var ch = canvas.height / dpr;
    ctx.fillStyle = '#f8fafb';
    ctx.fillRect(0, 0, cw, ch);
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    drawFn(ctx);
    ctx.restore();
    ctx.restore();
  }

  // ==================== EXPERIMENT A: FIELD VISUALIZATION ====================

  function renderFieldViz(container, exp) {
    var root = document.createElement('div');
    root.className = 'experiment';

    root.innerHTML =
      '<h2 class="exp-title">' + exp.title + '</h2>' +
      '<p class="exp-instruction">' + exp.instruction + '</p>';

    // Canvas area
    var canvasCard = document.createElement('div');
    canvasCard.className = 'card canvas-card';
    root.appendChild(canvasCard);

    // Magnet selection
    var selectCard = document.createElement('div');
    selectCard.className = 'card';
    selectCard.innerHTML = '<div class="card-label">Magnet auswählen:</div>';
    var btnGrid = document.createElement('div');
    btnGrid.className = 'magnet-btn-grid';

    MAGNET_TYPES.forEach(function (mt, i) {
      var btn = document.createElement('button');
      btn.className = 'mag-btn';
      btn.setAttribute('data-index', i);
      btn.textContent = mt.name;
      btn.addEventListener('click', function () {
        selectMagnet(i);
      });
      btnGrid.appendChild(btn);
    });
    selectCard.appendChild(btnGrid);
    root.appendChild(selectCard);

    // Action buttons
    var actionRow = document.createElement('div');
    actionRow.className = 'btn-row';
    actionRow.innerHTML =
      '<button class="btn btn-primary" id="sprinkle-btn" disabled>Eisenpfeilspäne streuen</button>' +
      '<button class="btn btn-secondary" id="clear-btn" disabled>Folie anheben</button>';
    root.appendChild(actionRow);

    // Progress
    var progressDiv = document.createElement('div');
    progressDiv.className = 'progress-bar';
    progressDiv.id = 'progress';
    progressDiv.innerHTML =
      '<span id="progress-text">0 / ' + MAGNET_TYPES.length + ' getestet</span>' +
      '<div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>';
    root.appendChild(progressDiv);

    // Conclusion
    var conc = document.createElement('div');
    conc.className = 'conclusion hidden';
    conc.id = 'conclusion';
    conc.innerHTML = '<strong>Erkenntnis:</strong>' + exp.conclusion;
    root.appendChild(conc);

    // Reset
    var resetRow = document.createElement('div');
    resetRow.className = 'btn-row mt-md';
    resetRow.innerHTML = '<button class="btn btn-secondary" id="reset-btn">Zurücksetzen</button>';
    root.appendChild(resetRow);

    // Add to DOM first so canvas gets proper dimensions
    container.appendChild(root);

    // Setup canvas
    var canvasSetup = setupCanvas(canvasCard, 350);
    state.canvas = canvasSetup.canvas;
    state.ctx = canvasSetup.canvas.getContext('2d');

    drawEmptyCanvas(state.canvas, state.ctx, 'Wähle einen Magneten aus');

    // Event handlers
    document.getElementById('sprinkle-btn').addEventListener('click', function () {
      sprinkleFilingsA();
    });
    document.getElementById('clear-btn').addEventListener('click', function () {
      clearFilingsA();
    });
    document.getElementById('reset-btn').addEventListener('click', function () {
      switchExperiment('a');
    });
  }

  function selectMagnet(index) {
    if (state.sprinkling) return;
    state.currentMagnet = index;

    document.querySelectorAll('.mag-btn').forEach(function (b, i) {
      b.classList.toggle('active', i === index);
    });

    document.getElementById('sprinkle-btn').disabled = false;
    document.getElementById('clear-btn').disabled = true;

    drawMagnetOnly(state.canvas, state.ctx, MAGNET_DRAW_FNS[index]);
    state.filings = null;
  }

  function sprinkleFilingsA() {
    if (state.currentMagnet === null || state.sprinkling) return;
    state.sprinkling = true;

    var mt = MAGNET_TYPES[state.currentMagnet];
    var canvas = state.canvas;
    var ctx = state.ctx;
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;

    var filings = generateFilings(mt.poles, mt.isInside, w, h, 1000);
    state.filings = filings;

    var drawFn = MAGNET_DRAW_FNS[state.currentMagnet];
    animateFilings(canvas, ctx, drawFn, filings);

    document.getElementById('sprinkle-btn').disabled = true;
    document.getElementById('clear-btn').disabled = false;

    setTimeout(function () {
      state.sprinkling = false;
      if (!state.tested[state.currentMagnet]) {
        state.tested[state.currentMagnet] = true;
        var btns = document.querySelectorAll('.mag-btn');
        if (btns[state.currentMagnet]) btns[state.currentMagnet].classList.add('tested');
        var tested = Object.keys(state.tested).length;
        document.getElementById('progress-text').textContent = tested + ' / ' + MAGNET_TYPES.length + ' getestet';
        document.getElementById('progress-fill').style.width = (tested / MAGNET_TYPES.length * 100) + '%';
        if (tested === MAGNET_TYPES.length) {
          document.getElementById('conclusion').classList.remove('hidden');
        }
      }
    }, 700);
  }

  function clearFilingsA() {
    if (state.animId) {
      cancelAnimationFrame(state.animId);
      state.animId = null;
    }
    state.filings = null;
    state.sprinkling = false;
    document.getElementById('sprinkle-btn').disabled = state.currentMagnet === null;
    document.getElementById('clear-btn').disabled = true;

    if (state.currentMagnet !== null) {
      drawMagnetOnly(state.canvas, state.ctx, MAGNET_DRAW_FNS[state.currentMagnet]);
    } else {
      drawEmptyCanvas(state.canvas, state.ctx, 'Wähle einen Magneten aus');
    }
  }

  // ==================== EXPERIMENT B: INTERACTION VISUALIZATION ====================

  function renderInteractionViz(container, exp) {
    var root = document.createElement('div');
    root.className = 'experiment';

    root.innerHTML =
      '<h2 class="exp-title">' + exp.title + '</h2>' +
      '<p class="exp-instruction">' + exp.instruction + '</p>';

    // Canvas area
    var canvasCard = document.createElement('div');
    canvasCard.className = 'card canvas-card';
    root.appendChild(canvasCard);

    // Config selection
    var selectCard = document.createElement('div');
    selectCard.className = 'card';
    selectCard.innerHTML = '<div class="card-label">Polkombination wählen:</div>';
    var btnGrid = document.createElement('div');
    btnGrid.className = 'config-btn-grid';

    POLE_CONFIGS.forEach(function (cfg, i) {
      var btn = document.createElement('button');
      btn.className = 'cfg-btn';
      btn.setAttribute('data-index', i);
      btn.innerHTML =
        '<span class="cfg-poles">' + buildPoleIcons(cfg) + '</span>' +
        '<span class="cfg-desc">' + cfg.desc + '</span>';
      btn.addEventListener('click', function () {
        selectConfig(i);
      });
      btnGrid.appendChild(btn);
    });
    selectCard.appendChild(btnGrid);
    root.appendChild(selectCard);

    // Action buttons
    var actionRow = document.createElement('div');
    actionRow.className = 'btn-row';
    actionRow.innerHTML =
      '<button class="btn btn-primary" id="sprinkle-btn" disabled>Eisenpfeilspäne streuen</button>' +
      '<button class="btn btn-secondary" id="clear-btn" disabled>Folie anheben</button>';
    root.appendChild(actionRow);

    // Progress
    var progressDiv = document.createElement('div');
    progressDiv.className = 'progress-bar';
    progressDiv.id = 'progress';
    progressDiv.innerHTML =
      '<span id="progress-text">0 / ' + POLE_CONFIGS.length + ' getestet</span>' +
      '<div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>';
    root.appendChild(progressDiv);

    // Conclusion
    var conc = document.createElement('div');
    conc.className = 'conclusion hidden';
    conc.id = 'conclusion';
    conc.innerHTML = '<strong>Erkenntnis:</strong>' + exp.conclusion;
    root.appendChild(conc);

    // Reset
    var resetRow = document.createElement('div');
    resetRow.className = 'btn-row mt-md';
    resetRow.innerHTML = '<button class="btn btn-secondary" id="reset-btn">Zurücksetzen</button>';
    root.appendChild(resetRow);

    // Add to DOM first
    container.appendChild(root);

    // Setup canvas
    var canvasSetup = setupCanvas(canvasCard, 300);
    state.canvas = canvasSetup.canvas;
    state.ctx = canvasSetup.canvas.getContext('2d');

    drawEmptyCanvas(state.canvas, state.ctx, 'Wähle eine Polkombination aus');

    // Event handlers
    document.getElementById('sprinkle-btn').addEventListener('click', function () {
      sprinkleFilingsB();
    });
    document.getElementById('clear-btn').addEventListener('click', function () {
      clearFilingsB();
    });
    document.getElementById('reset-btn').addEventListener('click', function () {
      switchExperiment('b');
    });
  }

  function buildPoleIcons(cfg) {
    // Show left-pole-facing → right-pole-facing
    var leftInner = cfg.leftFlip ? 'S' : 'N';
    var leftColor = cfg.leftFlip ? 'pole-green' : 'pole-red';
    var rightInner = cfg.rightFlip ? 'N' : 'S';
    var rightColor = cfg.rightFlip ? 'pole-red' : 'pole-green';
    // Which pole of left magnet faces right? If not flipped: N|S → S faces right. If flipped: S|N → N faces right.
    // Actually, for bar magnets: not flipped = [N][S], inner pole facing gap = S
    // flipped = [S][N], inner pole facing gap = N
    var leftFacing = cfg.leftFlip ? 'N' : 'S';
    var leftFacingColor = cfg.leftFlip ? 'pole-red' : 'pole-green';
    var rightFacing = cfg.rightFlip ? 'S' : 'N';
    var rightFacingColor = cfg.rightFlip ? 'pole-green' : 'pole-red';
    // Wait, the pole configs define which poles face each other.
    // leftFlip=false: [N][S] → right side is S. leftFlip=true: [S][N] → right side is N
    // rightFlip=false: [N][S] → left side is N. rightFlip=true: [S][N] → left side is S
    // So facing poles: left-right-side ↔ right-left-side
    // leftFlip=false,rightFlip=false: S ↔ N → wait, that should be for N↔N config...
    // Let me recheck. The POLE_CONFIGS define the actual pole positions/charges.
    // For the buttons, just show the config name
    return '<span class="combo-pole ' + leftFacingColor + '">' + leftFacing + '</span>' +
      '<span class="combo-arrow">\u2194</span>' +
      '<span class="combo-pole ' + rightFacingColor + '">' + rightFacing + '</span>';
  }

  function selectConfig(index) {
    if (state.sprinkling) return;
    state.currentConfig = index;

    document.querySelectorAll('.cfg-btn').forEach(function (b, i) {
      b.classList.toggle('active', i === index);
    });

    document.getElementById('sprinkle-btn').disabled = false;
    document.getElementById('clear-btn').disabled = true;

    var cfg = POLE_CONFIGS[index];
    var drawFn = function (ctx) {
      drawBarMagnet(ctx, -90, 0, cfg.leftFlip);
      drawBarMagnet(ctx, 90, 0, cfg.rightFlip);
    };
    drawMagnetOnly(state.canvas, state.ctx, drawFn);
    state.filings = null;
  }

  function sprinkleFilingsB() {
    if (state.currentConfig === null || state.sprinkling) return;
    state.sprinkling = true;

    var cfg = POLE_CONFIGS[state.currentConfig];
    var allPoles = cfg.leftPoles.concat(cfg.rightPoles);
    var canvas = state.canvas;
    var ctx = state.ctx;
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;

    var isInside = function (x, y) {
      if (Math.abs(x + 90) < 44 && Math.abs(y) < 18) return true;
      if (Math.abs(x - 90) < 44 && Math.abs(y) < 18) return true;
      return false;
    };

    var filings = generateFilings(allPoles, isInside, w, h, 1200);

    // For unlike poles, add extra filings in the gap to clearly show
    // field lines running from one magnet to the other
    var isUnlikePoles = (cfg.id === 'ns' || cfg.id === 'sn');
    if (isUnlikePoles) {
      var gapFilings = generateGapFilings(allPoles, h, 350);
      filings = filings.concat(gapFilings);
    }

    state.filings = filings;

    var cfgCopy = cfg;
    var drawFn = function (ctx) {
      drawBarMagnet(ctx, -90, 0, cfgCopy.leftFlip);
      drawBarMagnet(ctx, 90, 0, cfgCopy.rightFlip);
    };

    animateFilings(canvas, ctx, drawFn, filings);

    document.getElementById('sprinkle-btn').disabled = true;
    document.getElementById('clear-btn').disabled = false;

    setTimeout(function () {
      state.sprinkling = false;
      if (!state.tested[state.currentConfig]) {
        state.tested[state.currentConfig] = true;
        var btns = document.querySelectorAll('.cfg-btn');
        if (btns[state.currentConfig]) btns[state.currentConfig].classList.add('tested');
        var tested = Object.keys(state.tested).length;
        document.getElementById('progress-text').textContent = tested + ' / ' + POLE_CONFIGS.length + ' getestet';
        document.getElementById('progress-fill').style.width = (tested / POLE_CONFIGS.length * 100) + '%';
        if (tested === POLE_CONFIGS.length) {
          document.getElementById('conclusion').classList.remove('hidden');
        }
      }
    }, 700);
  }

  function clearFilingsB() {
    if (state.animId) {
      cancelAnimationFrame(state.animId);
      state.animId = null;
    }
    state.filings = null;
    state.sprinkling = false;

    document.getElementById('sprinkle-btn').disabled = state.currentConfig === null;
    document.getElementById('clear-btn').disabled = true;

    if (state.currentConfig !== null) {
      var cfg = POLE_CONFIGS[state.currentConfig];
      var drawFn = function (ctx) {
        drawBarMagnet(ctx, -90, 0, cfg.leftFlip);
        drawBarMagnet(ctx, 90, 0, cfg.rightFlip);
      };
      drawMagnetOnly(state.canvas, state.ctx, drawFn);
    } else {
      drawEmptyCanvas(state.canvas, state.ctx, 'Wähle eine Polkombination aus');
    }
  }

  // ==================== START ====================

  init();
})();
