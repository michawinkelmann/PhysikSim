// PhysikSim-Lab: Stabmagnet (Klasse 5) – offline, ohne Bibliotheken
// Hinweis: Der Text ist sinngemäß (keine langen Buchzitate).

const STAGE = { w: 1000, h: 600, pad: 44 };
const NS = "http://www.w3.org/2000/svg";

const clamp = (v,a,b)=>Math.max(a, Math.min(b,v));
const lerp  = (a,b,t)=>a+(b-a)*t;
const dist  = (ax,ay,bx,by)=>Math.hypot(ax-bx, ay-by);
const rad   = (deg)=>deg*Math.PI/180;
const deg   = (rad)=>rad*180/Math.PI;

function deepClone(obj){ return JSON.parse(JSON.stringify(obj)); }

function smoothstep(t){
  t = clamp(t,0,1);
  return t*t*(3-2*t);
}

function toast(msg, ms=1400){
  state.toast.msg = msg;
  state.toast.until = performance.now()+ms;
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.hidden = false;
}

function hideToast(){
  const el = document.getElementById("toast");
  el.hidden = true;
  el.textContent = "";
}

const state = {
  meta: {
    title: "Stabmagnet entdecken",    steps: [
      "Wirkung am Magneten",
      "Pole bestimmen",
      "Wer wirkt auf wen?",
      "Zwei Magnete"
    ],
  },
  sceneIndex: 0,
  scenes: [],
  dragging: null,   // {mode, id, dx, dy, baseRot, startAng, pointerId}
  selectedId: null,
  toast: { msg:"", until:0 },
  lastT: 0
};

// --- Scenes -----------------------------------------------------------------

function makeScenes(){
  return [
    {
      id: "strength",
      name: "Wirkung am Magneten",
      learn: [
        "Ein Magnet zieht Eisen an – besonders stark an den Enden.",
        "Die Enden heißen Pole (Nordpol und Südpol).",
        "Mit einem Nagel kannst du testen: Pol oder Mitte – wo ist es stärker?"
      ],
      hint: "Ziehe den Magneten zu den Büroklammern. Probiere auch die Mitte.",
      materials: ["Stabmagnet", "Büroklammern", "Eisennagel"],
      modelNote: "Modell: Büroklammern/Nagel werden als „Eisenstücke“ dargestellt. Sie werden zu den Magnet-Enden am stärksten gezogen.",
      merksatz: "Am Stabmagneten ist die Wirkung an den Enden am stärksten. Diese Enden heißen Pole.",
      checklist: [
        "Lege die Büroklammern auf den Tisch.",
        "Halte den Magneten waagerecht und nähere ihn langsam.",
        "Lege den Magneten ab und beobachte, wo sich Klammern sammeln.",
        "Nähere die Nagelspitze der Magnet-Mitte und vergleiche mit den Enden."
      ],
      tasks: [
        { id:"obs1", type:"text", title:"1) Beobachten", prompt:"Beschreibe kurz, was mit den Büroklammern passiert.", placeholder:"Ich beobachte, dass …" },
        { id:"mc1", type:"mcq", title:"2) Wo ist die Wirkung am größten?", prompt:"Wähle eine Antwort.", options:["In der Mitte","An den Enden"], correct:1,
          feedback:{ ok:"Ja! An den Enden (Polen) werden die Klammern besonders stark angezogen.",
                     wrong:"Tipp: Schiebe den Magneten mal so, dass ein Ende ganz nah ist – und dann die Mitte." } },
        { id:"conc1", type:"textcheck", title:"3) Schlussfolgern", prompt:"Formuliere einen Merksatz (mit dem Wort „Enden“ oder „Pole“).", placeholder:"Merksatz: …",
          keywords:["ende","pol"] }
      ],
      initObjects(){
        const objs = [];
        // magnet: left half red (N), right half green (S)
        objs.push(magnetObj("mag1", 260, 310, 0, { draggable:true, rotatable:true, lockAngles:false }));
        // clips
        const clipPos = [
          [660, 505],[710, 505],[640, 505],[700, 505],[670, 505]
        ];
        clipPos.forEach((p,i)=>objs.push(clipObj(`c${i+1}`, p[0], p[1])));
        // nail
        objs.push(nailObj("nail1", 770, 505, -10));
        return objs;
      },
      overlays(svg){
        // Tischplatte (damit "fallen" konsistent ist)
        const y = 520;
        const gg = svgEl("g", {});
        gg.appendChild(svgEl("rect",{x:0,y:y,width:1000,height:80, rx:0, fill:"rgba(16,19,33,.06)"}));
        gg.appendChild(svgEl("rect",{x:0,y:y,width:1000,height:6, rx:0, fill:"rgba(16,19,33,.10)"}));
        const t = svgEl("text",{x:980,y:y+28,"text-anchor":"end","font-size":"16","font-weight":"800", fill:"rgba(16,19,33,.45)"});
        t.textContent = "Tisch";
        gg.appendChild(t);
        svg.appendChild(gg);
      },
      physics(dt){
        const mag = getObj("mag1");
        const irons = state.active.objects.filter(o=>o.kind==="iron");

        // "Schwerkraft" im Bild: zieht nach unten (größeres y), bis zur Tischhöhe.
        const g = 1800;          // Stärke der Schwerkraft
        const tableY = 520;      // Tischhöhe (im SVG-Koordinatensystem)
        for(const o of irons){
          if(isBeingDragged(o.id)) continue;
          if(o.attachedTo) continue;

          // Gravitation
          applyForce(o, 0, o.mass * g, dt);

          // Magnetische Anziehung (zu beiden Polen)
          const f = forceFromMagnetToPoint(mag, o.forcePoint ? o.forcePoint(o) : {x:o.x,y:o.y}, 9000, 26, 120);
          applyForce(o, f.fx, f.fy, dt);
        }

        // auto-attach small things when close
        for(const o of irons){
          if(o.type!=="clip" && o.type!=="nail") continue;
          if(isBeingDragged(o.id)) continue;
          if(o.attachedTo) continue;
          const pN = magnetPoleWorld(mag, "N");
          const pS = magnetPoleWorld(mag, "S");
          const oPt = o.forcePoint ? o.forcePoint(o) : {x:o.x,y:o.y};
          const dN = dist(oPt.x,oPt.y,pN.x,pN.y);
          const dS = dist(oPt.x,oPt.y,pS.x,pS.y);
          const pole = (dN<dS) ? "N" : "S";
          const d = Math.min(dN,dS);
          if(d < 34){
            attachToPole(o, mag.id, pole);
            toast(o.type==="clip" ? "Klammer rastet am Pol ein." : "Nagel wird am Pol angezogen.");
          }
        }

        // Bewegung aktualisieren + "Auf dem Tisch landen"
        for(const o of irons){
          integrate(o, dt);

          // Tisch (Boden) – wenn nicht am Magneten, fällt es bis hierher
          if(!o.attachedTo && !isBeingDragged(o.id)){
            const floor = tableY - o.h/2;
            if(o.y > floor){
              o.y = floor;
              if(o.vy > 0) o.vy = 0;
              o.vx *= 0.55; // Reibung am Tisch
            }
          }

          keepInStage(o);
          updateTransform(o);
        }
      }
    },

    {
      id: "poles",
      name: "Pole bestimmen",
      learn: [
        "Ein frei hängender Magnet dreht sich in Nord–Süd-Richtung.",
        "Das Ende mit „N“ zeigt (ungefähr) nach Norden und heißt Nordpol.",
      ],
      hint: "Tippe auf „Anstoßen“ und beobachte, wie sich der hängende Magnet ausrichtet.",
      materials: ["Stabmagnet", "Stativ/Stand", "Faden"],
      modelNote: "Modell: Die Erde wirkt wie ein riesiger Magnet. Ein frei hängender Magnet dreht sich so, dass sein Nordpol nach Norden zeigt.",
      merksatz: "Ein frei hängender Magnet richtet sich ungefähr in Nord–Süd-Richtung aus. Das Ende, das nach Norden zeigt, heißt Nordpol.",
      checklist: [
        "Hänge den Magneten an den Faden (hier ist er schon aufgehängt).",
        "Warte, bis er fast still ist.",
        "Lies am Kompass ab: Welches Ende zeigt nach Norden?"
      ],
      tasks: [
        { id:"obs2", type:"text", title:"1) Beobachten", prompt:"Was macht der Magnet nach dem Anstoßen?", placeholder:"Ich beobachte, dass …" },
        { id:"mc2", type:"mcq", title:"2) Welches Ende zeigt nach Norden?", prompt:"Wähle eine Antwort.", options:["Das rote Ende","Das grüne Ende"], correct:0,
          feedback:{ ok:"Genau. In dieser Simulation ist das rote Ende der Nordpol.",
                     wrong:"Schau auf den Kompass: Nach einiger Zeit zeigt immer dasselbe Ende nach N." } },
        { id:"conc2", type:"textcheck", title:"3) Schlussfolgern", prompt:"Ergänze: „Der Magnet richtet sich … aus.“", placeholder:"Der Magnet richtet sich … aus.",
          keywords:["nord","süd"] }
      ],
      initObjects(){
        const objs = [];
        objs.push(standObj("stand1", 330, 250));
        const m = magnetObj("magH", 460, 300, 40, { draggable:false, rotatable:false, lockAngles:false });
        m.hanging = { targetRot: 90, omega: 0 };
        objs.push(m);
        return objs;
      },
      overlays(svg){
        drawCompass(svg, 780, 170, 90);
      },
      physics(dt){
        const m = getObj("magH");
        // simple angular "spring" to targetRot with damping
        const hang = m.hanging;
        const err = normalizeDeg(hang.targetRot - m.rot);
        const torque = clamp(err * 8, -220, 220);
        hang.omega += torque * dt;
        hang.omega *= Math.pow(0.12, dt); // damping
        m.rot += hang.omega * dt;
        // small "swing" illusion: x depends on angle a bit
        const sway = Math.sin(rad(m.rot)) * 10;
        m.x = 460 + sway;
        updateTransform(m);
      }
    },

    {
      id: "mutual",
      name: "Wer wirkt auf wen?",
      learn: [
        "Magnet und Eisen ziehen sich an.",
        "Ob etwas sichtbar rollt, hängt von der Reibung ab (Bleistifte = Rollen).",
        "In diesem Aufbau bewegt sich nur das Teil, das auf den Rollen liegt."
      ],
      hint: "Lege entweder den Eisenblock ODER den Magneten auf die Bleistifte (nur ein Teil rollt). Dann nähere das andere Teil an.",
      materials: ["Stabmagnet", "Eisenblock (ähnlich groß)", "2 runde Bleistifte"],
      modelNote: "Modell: Auf den Bleistiften gibt es wenig Reibung. In dieser Version rollt immer nur das Teil, das auf den Bleistiften liegt.",
      merksatz: "Magnet und Eisen ziehen sich an. Bewegen kann sich in diesem Aufbau nur das Teil, das auf den Bleistiften (Rollen) liegt.",
      checklist: [
        "Lege den Eisenblock auf die zwei Bleistifte (er rastet ein).",
        "Halte den Magneten (stationär) in die Nähe des Blocks.",
        "Beobachte: Der Block rollt auf den Magneten zu.",
        "Jetzt anders herum: Lege den Magneten auf die Bleistifte und halte den Block stationär."
      ],
      tasks: [
        { id:"obs3", type:"text", title:"1) Beobachten", prompt:"Was passiert, wenn Magnet und Block nah zueinander sind?", placeholder:"Ich beobachte, dass …" },
        { id:"mc3", type:"mcq", title:"2) Wer bewegt sich?", prompt:"Wähle die beste Antwort.", options:[
            "Das Teil auf den Bleistiften (Rollen) bewegt sich.",
            "Immer nur der Magnet bewegt sich.",
            "Immer nur der Eisenblock bewegt sich."
          ], correct:0,
          feedback:{ ok:"Genau: In diesem Aufbau rollt nur das Teil, das auf den Bleistiften liegt.",
                     wrong:"Tipp: Probiere beide Varianten: erst Block auf die Rollen, dann Magnet auf die Rollen." } },
        { id:"conc3", type:"textcheck", title:"3) Schlussfolgern", prompt:"Ergänze: „Auf den Rollen bewegt sich …“", placeholder:"Auf den Rollen bewegt sich …",
          keywords:["teil","rollen","bleistift"] }
      ],
      initObjects(){
        const objs = [];
        // rollers (static)
        objs.push(pencilObj("p1", 610, 410));
        objs.push(pencilObj("p2", 760, 410));
        // track definition for snapping
        objs.push(ironBlockObj("block1", 685, 320));
        const mag = magnetObj("mag2", 240, 440, 0, { draggable:true, rotatable:false, lockAngles:true });
        objs.push(mag);
        return objs;
      },
      overlays(svg){
        drawTrackHint(svg, 555, 410, 820, 410, "Bleistifte (Rollen)");
      },
      physics(dt){
        const mag = getObj("mag2");
        const block = getObj("block1");

        // Nur das Objekt auf den Rollen bewegt sich:
        const mover = block.track ? block : (mag.track ? mag : null);

        // Kräfte berechnen (Magnet zieht Block an)
        const f = forceFromMagnetToPoint(mag, {x:block.x, y:block.y}, 900000, 70, 700);

        // Stationäres Teil: bleibt stehen (außer beim Ziehen)
        if(!isBeingDragged(mag.id) && !mag.track){
          mag.vx = 0; mag.vy = 0;
          updateTransform(mag);
        }
        if(!isBeingDragged(block.id) && !block.track){
          block.vx = 0; block.vy = 0;
          updateTransform(block);
        }

        if(mover === block && !isBeingDragged(block.id)){
          applyForce(block, f.fx, 0, dt);
        } else if(mover === mag && !isBeingDragged(mag.id)){
          // Wenn der Magnet rollt, bewegt er sich zur Blockseite (Gegenrichtung)
          applyForce(mag, -f.fx * 0.9, 0, dt);
        }

        // Integrate nur das rollende Objekt
        for(const o of [block, mag]){
          if(isBeingDragged(o.id)) continue;
          if(o !== mover) continue;

          integrate(o, dt);
          if(o.track){
            o.y = o.track.y;
            o.vy = 0;
            o.x = clamp(o.x, o.track.xmin, o.track.xmax);
            o.vx *= Math.pow(0.45, dt);
          }
          keepInStage(o);
          updateTransform(o);
        }

        // Abstand halten, damit nichts "durchrutscht"
        separateAlongX(block, mag, 270);
      }
    },

    {
      id: "two",
      name: "Zwei Magnete",
      learn: [
        "Zwei Magnete können sich anziehen oder abstoßen.",
        "Gleiche Pole stoßen sich ab, ungleiche ziehen sich an.",
        "Auf Rollen sieht man die Bewegung besonders gut."
      ],
      hint: "Lege beide Magnete auf die Bleistifte. Drehe dann einen Magneten und beobachte Anziehung/Abstoßung.",
      materials: ["2 Stabmagnete", "2 runde Bleistifte"],
      modelNote: "Modell: Beide Magnete rollen nur in einer Spur. Die Enden sind N (rot) und S (grün).",
      merksatz: "Gleiche Pole stoßen sich ab. Ungleiche Pole ziehen sich an.",
      checklist: [
        "Lege einen Magneten auf die Bleistifte (er rastet ein).",
        "Lege den zweiten Magneten auch auf die Bleistifte.",
        "Bringe gleiche Pole zueinander: Was passiert?",
        "Bringe ungleiche Pole zueinander: Was passiert?"
      ],
      tasks: [
        { id:"obs4", type:"text", title:"1) Beobachten", prompt:"Beschreibe kurz, wann sich die Magnete anziehen oder abstoßen.", placeholder:"Ich beobachte, dass …" },
        { id:"mat1", type:"matrix", title:"2) Tabelle ausfüllen", prompt:"Wähle „ziehen“ oder „stoßen“.",
          rows:[
            { key:"NN", label:"Nordpol an Nordpol" },
            { key:"NS", label:"Nordpol an Südpol" },
            { key:"SS", label:"Südpol an Südpol" }
          ],
          options:["ziehen","stoßen"],
          correct:{ NN:"stoßen", NS:"ziehen", SS:"stoßen" }
        },
        { id:"conc4", type:"textcheck", title:"3) Schlussfolgern", prompt:"Schreibe: „Gleiche Pole …, ungleiche Pole …“", placeholder:"Gleiche Pole …",
          keywords:["gleich","ungleich"] }
      ],
      initObjects(){
        const objs = [];
        objs.push(pencilObj("p3", 520, 420));
        objs.push(pencilObj("p4", 820, 420));
        const mA = magnetObj("mA", 560, 320, 0, { draggable:true, rotatable:false, lockAngles:true });
        const mB = magnetObj("mB", 800, 320, 180, { draggable:true, rotatable:false, lockAngles:true });
        // Start: both off track; students snap them on.
        objs.push(mA, mB);
        return objs;
      },
      overlays(svg){
        drawTrackHint(svg, 450, 420, 890, 420, "Bleistifte (Rollen)");
        drawPoleLegend(svg, 130, 90);
      },
      physics(dt){
        const a = getObj("mA");
        const b = getObj("mB");

        // Only interact if both on track (rolling)
        if(a.track && b.track){
          const ff = magnetMagnetForce1D(a,b, 900000, 70, 950); // kräftiger, gut sichtbar
          if(!isBeingDragged(a.id)) applyForce(a, ff.fxA, 0, dt);
          if(!isBeingDragged(b.id)) applyForce(b, ff.fxB, 0, dt);
        }

        for(const o of [a,b]){
          if(isBeingDragged(o.id)) continue;
          integrate(o, dt);
          if(o.track){
            o.y = o.track.y;
            o.vy = 0;
            o.x = clamp(o.x, o.track.xmin, o.track.xmax);
            o.vx *= Math.pow(0.45, dt);
          } else {
            o.vx *= Math.pow(0.08, dt);
            o.vy *= Math.pow(0.08, dt);
          }
          keepInStage(o);
          updateTransform(o);
        }

        // keep a minimum distance to avoid "through each other"
        if(a.track && b.track){
          separateAlongX(a,b, 250);
        }
      }
    }
  ];
}

// --- Object factory ----------------------------------------------------------

function baseObj(id, type, x,y, rot, w,h){
  return {
    id, type, kind: "misc",
    x,y, rot, w,h,
    vx:0, vy:0,
    mass: 1,
    draggable: true,
    rotatable: false,
    lockAngles: false,
    attachedTo: null,
    track: null
  };
}

function magnetObj(id, x,y, rot, opts={}){
  const o = baseObj(id, "magnet", x,y, rot, 260, 64);
  o.kind = "magnet";
  o.mass = 2.2;
  o.draggable = opts.draggable ?? true;
  o.rotatable = opts.rotatable ?? false;
  o.lockAngles = opts.lockAngles ?? false;
  // Local convention:
  // local -x end is RED = North pole (+1)
  // local +x end is GREEN = South pole (-1)
  o.poles = { N: {lx:-o.w/2, ly:0, s:+1}, S: {lx:+o.w/2, ly:0, s:-1} };
  return o;
}

function clipObj(id, x,y){
  const o = baseObj(id, "clip", x,y, 0, 46, 26);
  o.kind = "iron";
  o.mass = 0.3;
  o.rotatable = false;
  o.forcePoint = (obj)=>({x:obj.x,y:obj.y});
  return o;
}

function nailObj(id, x,y, rot){
  const o = baseObj(id, "nail", x,y, rot, 150, 20);
  o.kind = "iron";
  o.mass = 0.9;
  o.rotatable = true;
  // use tip point (right end in local space)
  o.forcePoint = (obj)=>{
    const tip = localToWorld(obj, obj.w/2, 0);
    return {x: tip.x, y: tip.y};
  };
  return o;
}

function ironBlockObj(id, x,y){
  const o = baseObj(id, "block", x,y, 0, 240, 86);
  o.kind = "iron";
  o.mass = 4.0;
  o.rotatable = false;
  o.canSnapToTrack = true;
  return o;
}

function pencilObj(id, x,y){
  const o = baseObj(id, "pencil", x,y, 0, 220, 26);
  o.kind = "static";
  o.draggable = false;
  o.mass = Infinity;
  return o;
}

function standObj(id, x,y){
  const o = baseObj(id, "stand", x,y, 0, 260, 260);
  o.kind = "static";
  o.draggable = false;
  o.mass = Infinity;
  return o;
}

// --- Rendering ---------------------------------------------------------------

function svgEl(tag, attrs={}){
  const el = document.createElementNS(NS, tag);
  for(const [k,v] of Object.entries(attrs)){
    el.setAttribute(k, String(v));
  }
  return el;
}

function buildGrid(){
  const g = document.getElementById("grid");
  g.innerHTML = "";
  const step = 80;
  for(let x=step; x<STAGE.w; x+=step){
    g.appendChild(svgEl("line", {x1:x,y1:0,x2:x,y2:STAGE.h, class:"gridLine"}));
  }
  for(let y=step; y<STAGE.h; y+=step){
    g.appendChild(svgEl("line", {x1:0,y1:y,x2:STAGE.w,y2:y, class:"gridLine"}));
  }
}

function renderScene(){
  const scene = state.active;
  document.getElementById("stageHint").textContent = scene.hint;

  // stage buttons per scene
  const nudgeBtn = document.getElementById("nudgeBtn");
  nudgeBtn.hidden = scene.id !== "poles";
  const flipBtn = document.getElementById("flipBtn");
  flipBtn.hidden = !(scene.id === "mutual" || scene.id === "two");

  // overlays
  const ov = document.getElementById("overlays");
  ov.innerHTML = "";
  scene.overlays?.(ov);

  // objects
  const g = document.getElementById("objects");
  g.innerHTML = "";
  for(const o of scene.objects){
    g.appendChild(makeSvgObject(o));
  }
}

function makeSvgObject(o){
  const root = svgEl("g", {"data-id": o.id});
  root.setAttribute("transform", `translate(${o.x} ${o.y}) rotate(${o.rot})`);

  // invisible hit pad
  const pad = svgEl("rect", {
    x: -o.w/2 - 16, y: -o.h/2 - 16,
    width: o.w + 32, height: o.h + 32,
    rx: 18, fill: "transparent"
  });
  pad.setAttribute("pointer-events","all");
  root.appendChild(pad);

  if(o.type==="magnet"){
    root.appendChild(drawMagnet(o));
  } else if(o.type==="clip"){
    root.appendChild(drawClip(o));
  } else if(o.type==="nail"){
    root.appendChild(drawNail(o));
  } else if(o.type==="block"){
    root.appendChild(drawBlock(o));
  } else if(o.type==="pencil"){
    root.appendChild(drawPencil(o));
  } else if(o.type==="stand"){
    root.appendChild(drawStand(o));
  }

  // selection outline
  const sel = svgEl("rect", {
    x: -o.w/2 - 6, y: -o.h/2 - 6,
    width: o.w + 12, height: o.h + 12,
    rx: 18, fill:"none", stroke:"rgba(37,99,235,.55)", "stroke-width": 3
  });
  sel.setAttribute("data-sel","1");
  sel.setAttribute("pointer-events","none");
  sel.style.display = (state.selectedId===o.id) ? "block" : "none";
  root.appendChild(sel);

  return root;
}

function drawMagnet(o){
  const g = svgEl("g", {filter:"url(#shadow)"});
  const half = o.w/2;

  const left = svgEl("rect", {x:-o.w/2, y:-o.h/2, width:half, height:o.h, rx:14, fill:"#ef4444", stroke:"rgba(0,0,0,.15)"});
  const right = svgEl("rect", {x:0, y:-o.h/2, width:half, height:o.h, rx:14, fill:"#22c55e", stroke:"rgba(0,0,0,.15)"});
  const seam = svgEl("rect", {x:-2, y:-o.h/2, width:4, height:o.h, rx:2, fill:"rgba(255,255,255,.55)"});

  const labelR = svgEl("text", {x:-o.w/4, y:8, "text-anchor":"middle", "font-size":"20", "font-weight":"900", fill:"rgba(255,255,255,.85)"});
  labelR.textContent = "N";
  const labelG = svgEl("text", {x:o.w/4, y:8, "text-anchor":"middle", "font-size":"20", "font-weight":"900", fill:"rgba(255,255,255,.85)"});
  labelG.textContent = "S";

  g.append(left, right, seam, labelR, labelG);

  // rotate handle (shown only when rotatable)
  if(o.rotatable){
    const h = svgEl("circle", {cx:o.w/2-10, cy:-o.h/2-10, r:16, fill:"#fff", stroke:"rgba(16,19,33,.25)", "stroke-width":2});
    h.setAttribute("data-handle","rot");
    const a = svgEl("text", {x:o.w/2-10, y:-o.h/2-4, "text-anchor":"middle", "font-size":"18", "font-weight":"900", fill:"rgba(16,19,33,.75)"});
    a.textContent = "↻";
    a.setAttribute("pointer-events","none");
    g.append(h,a);
  }

  return g;
}

function drawClip(o){
  const g = svgEl("g", {filter:"url(#shadow)"});
  const path = svgEl("path", {
    d: "M -18 -8 Q -18 -18 -6 -18 L 10 -18 Q 20 -18 20 -8 L 20 10 Q 20 18 12 18 L -4 18 Q -12 18 -12 10 L -12 -2 Q -12 -8 -6 -8 L 8 -8",
    fill:"none",
    stroke:"rgba(71,85,105,.95)",
    "stroke-width": 5,
    "stroke-linecap":"round",
    "stroke-linejoin":"round"
  });
  g.appendChild(path);
  return g;
}

function drawNail(o){
  const g = svgEl("g", {filter:"url(#shadow)"});
  const body = svgEl("rect", {x:-o.w/2, y:-o.h/2, width:o.w-16, height:o.h, rx:8, fill:"#94a3b8", stroke:"rgba(0,0,0,.12)"});
  const tip = svgEl("path", {d:`M ${o.w/2-16} ${-o.h/2} L ${o.w/2} 0 L ${o.w/2-16} ${o.h/2} Z`,
    fill:"#a1aab8", stroke:"rgba(0,0,0,.12)"});
  const dot = svgEl("circle", {cx:o.w/2-4, cy:0, r:5, fill:"rgba(16,19,33,.55)"});
  g.append(body, tip, dot);

  if(o.rotatable){
    const h = svgEl("circle", {cx:o.w/2+18, cy:-o.h/2-10, r:16, fill:"#fff", stroke:"rgba(16,19,33,.25)", "stroke-width":2});
    h.setAttribute("data-handle","rot");
    const a = svgEl("text", {x:o.w/2+18, y:-o.h/2-4, "text-anchor":"middle", "font-size":"18", "font-weight":"900", fill:"rgba(16,19,33,.75)"});
    a.textContent = "↻";
    a.setAttribute("pointer-events","none");
    g.append(h,a);
  }

  return g;
}

function drawBlock(o){
  const g = svgEl("g", {filter:"url(#shadow)"});
  const r = svgEl("rect", {x:-o.w/2, y:-o.h/2, width:o.w, height:o.h, rx:18, fill:"#cbd5e1", stroke:"rgba(0,0,0,.14)"});
  const shine = svgEl("path", {d:`M ${-o.w/2+18} ${-o.h/2+14} L ${-o.w/2+120} ${-o.h/2+14} L ${-o.w/2+60} ${o.h/2-14} L ${-o.w/2+18} ${o.h/2-14} Z`,
    fill:"rgba(255,255,255,.22)"});
  g.append(r, shine);
  return g;
}

function drawPencil(o){
  const g = svgEl("g", {filter:"url(#shadow)"});
  const r = svgEl("rect", {x:-o.w/2, y:-o.h/2, width:o.w, height:o.h, rx:13, fill:"#f2c94c", stroke:"rgba(0,0,0,.12)"});
  const line = svgEl("rect", {x:-o.w/2+12, y:-2, width:o.w-24, height:4, rx:2, fill:"rgba(16,19,33,.22)"});
  g.append(r, line);
  return g;
}

function drawStand(o){
  const g = svgEl("g", {filter:"url(#shadow)"});
  const base = svgEl("rect", {x:-120, y:90, width:240, height:40, rx:18, fill:"#9ca3af", stroke:"rgba(0,0,0,.14)"});
  const rod = svgEl("rect", {x:-10, y:-110, width:20, height:220, rx:10, fill:"#6b7280"});
  const arm = svgEl("rect", {x:-10, y:-110, width:140, height:18, rx:9, fill:"#6b7280"});
  const hook = svgEl("circle", {cx:130, cy:-101, r:8, fill:"#111827"});
  const string = svgEl("line", {x1:130,y1:-94,x2:130,y2:44, stroke:"rgba(16,19,33,.65)", "stroke-width":3});
  g.append(base, rod, arm, hook, string);
  return g;
}

function drawCompass(svg, x,y, r){
  const g = svgEl("g", {});
  // ring
  g.appendChild(svgEl("circle",{cx:x,cy:y,r:r, fill:"rgba(255,255,255,.70)", stroke:"rgba(16,19,33,.18)", "stroke-width":2}));
  // cross
  g.appendChild(svgEl("line",{x1:x-r+14,y1:y,x2:x+r-14,y2:y, stroke:"rgba(16,19,33,.16)", "stroke-width":2}));
  g.appendChild(svgEl("line",{x1:x,y1:y-r+14,x2:x,y2:y+r-14, stroke:"rgba(16,19,33,.16)", "stroke-width":2}));

  const letters = [
    ["N", x, y-r+26],
    ["S", x, y+r-12],
    ["W", x-r+22, y+6],
    ["E", x+r-22, y+6],
  ];
  for(const [t,tx,ty] of letters){
    const el = svgEl("text",{x:tx,y:ty,"text-anchor":"middle","font-size":"20","font-weight":"900", fill:"rgba(16,19,33,.75)"});
    el.textContent = t;
    g.appendChild(el);
  }
  // arrow hint
  const tip = svgEl("path",{d:`M ${x} ${y} L ${x} ${y-r+32}`, stroke:"rgba(239,68,68,.8)", "stroke-width":5, "stroke-linecap":"round"});
  g.appendChild(tip);

  svg.appendChild(g);
}

function drawTrackHint(svg, x1,y1,x2,y2,label){
  const g = svgEl("g",{});
  g.appendChild(svgEl("line",{x1,y1,x2,y2, stroke:"rgba(16,19,33,.20)", "stroke-width":10, "stroke-linecap":"round"}));
  const t = svgEl("text",{x:(x1+x2)/2,y:y1-16,"text-anchor":"middle","font-size":"16","font-weight":"800", fill:"rgba(16,19,33,.55)"});
  t.textContent = label;
  g.appendChild(t);
  svg.appendChild(g);
}

function drawPoleLegend(svg, x,y){
  const g = svgEl("g",{});
  const box = svgEl("rect",{x:x-10,y:y-10,width:190,height:70,rx:16,fill:"rgba(255,255,255,.72)",stroke:"rgba(16,19,33,.14)"});
  g.appendChild(box);
  g.appendChild(svgEl("rect",{x:x+10,y:y+14,width:30,height:18,rx:6,fill:"#ef4444"}));
  g.appendChild(svgEl("rect",{x:x+10,y:y+40,width:30,height:18,rx:6,fill:"#22c55e"}));
  const t1 = svgEl("text",{x:x+52,y:y+29,"font-size":"16","font-weight":"900", fill:"rgba(16,19,33,.70)"});
  t1.textContent = "rot = Nordpol";
  const t2 = svgEl("text",{x:x+52,y:y+55,"font-size":"16","font-weight":"900", fill:"rgba(16,19,33,.70)"});
  t2.textContent = "grün = Südpol";
  g.append(t1,t2);
  svg.appendChild(g);
}

// --- Transforms & geometry ---------------------------------------------------

function updateTransform(o){
  const g = document.querySelector(`[data-id="${o.id}"]`);
  if(!g) return;
  g.setAttribute("transform", `translate(${o.x} ${o.y}) rotate(${o.rot})`);
  const sel = g.querySelector('[data-sel="1"]');
  if(sel) sel.style.display = (state.selectedId===o.id) ? "block" : "none";
}

function normalizeDeg(a){
  // to [-180,180]
  let d = ((a % 360) + 360) % 360;
  if(d > 180) d -= 360;
  return d;
}

function localToWorld(o, lx,ly){
  const a = rad(o.rot);
  const cos = Math.cos(a), sin = Math.sin(a);
  return { x: o.x + lx*cos - ly*sin, y: o.y + lx*sin + ly*cos };
}

function worldToLocal(o, wx,wy){
  const a = rad(-o.rot);
  const dx = wx - o.x, dy = wy - o.y;
  const cos = Math.cos(a), sin = Math.sin(a);
  return { x: dx*cos - dy*sin, y: dx*sin + dy*cos };
}

function magnetPoleWorld(m, pole){
  const p = m.poles[pole];
  return localToWorld(m, p.lx, p.ly);
}

// --- Physics helpers ---------------------------------------------------------

function integrate(o, dt){
  const maxV = 520;
  o.vx = clamp(o.vx, -maxV, maxV);
  o.vy = clamp(o.vy, -maxV, maxV);
  o.x += o.vx * dt;
  o.y += o.vy * dt;
  // general damping
  const damp = Math.pow(0.06, dt);
  o.vx *= damp;
  o.vy *= damp;
}

function applyForce(o, fx, fy, dt){
  if(o.mass === Infinity) return;
  const ax = fx / o.mass;
  const ay = fy / o.mass;
  o.vx += ax * dt;
  o.vy += ay * dt;
}

function keepInStage(o){
  const px = o.w/2 + STAGE.pad/2;
  const py = o.h/2 + STAGE.pad/2;
  o.x = clamp(o.x, px, STAGE.w - px);
  o.y = clamp(o.y, py, STAGE.h - py);
}

function forceFromMagnetToPoint(m, pt, k=10000, soft=30, fMax=140){
  const pN = magnetPoleWorld(m,"N");
  const pS = magnetPoleWorld(m,"S");

  const f1 = attractTo(pN.x,pN.y, pt.x,pt.y, k, soft, fMax);
  const f2 = attractTo(pS.x,pS.y, pt.x,pt.y, k, soft, fMax);

  // sum forces (always attraction for iron)
  return { fx: f1.fx + f2.fx, fy: f1.fy + f2.fy };
}

function attractTo(ax,ay, bx,by, k, soft, fMax){
  const dx = ax - bx, dy = ay - by;
  const d2 = dx*dx + dy*dy + soft*soft;
  const d = Math.sqrt(d2);
  let f = k / d2;
  f = clamp(f, 0, fMax);
  const fx = f * (dx/d);
  const fy = f * (dy/d);
  return {fx,fy};
}

function magnetMagnetForce1D(a,b, k=12000, soft=40, fMax=220){
  // 1D along x track: compute pole-pole interactions and project to x
  const polesA = [
    {pole:"N", s:+1, p: magnetPoleWorld(a,"N")},
    {pole:"S", s:-1, p: magnetPoleWorld(a,"S")}
  ];
  const polesB = [
    {pole:"N", s:+1, p: magnetPoleWorld(b,"N")},
    {pole:"S", s:-1, p: magnetPoleWorld(b,"S")}
  ];

  let fxA = 0;
  let fxB = 0;

  for(const pa of polesA){
    for(const pb of polesB){
      const dx = pb.p.x - pa.p.x;
      const dy = pb.p.y - pa.p.y;
      const d2 = dx*dx + dy*dy + soft*soft;
      const d = Math.sqrt(d2);
      // like poles -> repulsion, unlike -> attraction
      let f = (k * pa.s * pb.s) / d2; // positive => repulsive along +dx
      f = clamp(f, -fMax, fMax);
      const ux = dx/d;

      // Force on A pole is -f * ux (because if f positive repulsive, A is pushed away)
      const fAx = -f * ux;
      const fBx = +f * ux;

      fxA += fAx;
      fxB += fBx;
    }
  }

  // clamp total
  fxA = clamp(fxA, -fMax, fMax);
  fxB = clamp(fxB, -fMax, fMax);
  return { fxA, fxB };
}

function separateAlongX(a,b, minDist){
  const dx = b.x - a.x;
  const d = Math.abs(dx);
  if(d >= minDist) return;
  const push = (minDist - d) * 0.5;
  const dir = (dx>=0) ? 1 : -1;
  if(!isBeingDragged(a.id)) a.x -= push * dir;
  if(!isBeingDragged(b.id)) b.x += push * dir;
}

// --- Attachments -------------------------------------------------------------

function attachToPole(o, magId, pole){
  const scene = state.active;
  // compute slot number for that pole
  const key = `${magId}:${pole}`;
  scene._slots = scene._slots || {};
  scene._slots[key] = (scene._slots[key] ?? 0) + 1;
  const slot = scene._slots[key];

  o.attachedTo = { magId, pole, slot };
  o.vx = 0; o.vy = 0;
  updateAttachedPosition(o);
}

function detach(o){
  o.attachedTo = null;
}

function updateAttachedPosition(o){
  if(!o.attachedTo) return;
  const mag = getObj(o.attachedTo.magId);
  if(!mag) return;
  const p = magnetPoleWorld(mag, o.attachedTo.pole);

  // offset stack: a little beside the pole, alternating up/down
  const s = o.attachedTo.slot;
  const side = (s%2===0) ? 1 : -1;
  const row = Math.floor((s-1)/2);
  const offY = side * (18 + row*16);
  const offX = (o.attachedTo.pole==="N") ? -18 : 18;

  // rotate offset with magnet rotation
  const off = localToWorld(mag, (o.attachedTo.pole==="N") ? -mag.w/2+18 : mag.w/2-18, offY);
  o.x = off.x + (o.type==="nail" ? offX*0.3 : 0);
  o.y = off.y;
  o.rot = mag.rot;
  updateTransform(o);
}

// --- UI / Tasks --------------------------------------------------------------

function buildStepper(){
  const el = document.getElementById("stepper");
  el.innerHTML = "";
  state.meta.steps.forEach((name,i)=>{
    const b = document.createElement("button");
    b.className = "step" + (i===state.sceneIndex ? " active" : "");
    const letter = String.fromCharCode(65 + i);
    b.textContent = `${letter}. ${name}`;
    b.addEventListener("click", ()=> setScene(i));
    el.appendChild(b);
  });
}

function renderSidePanel(){
  const scene = state.active;

  // materials (scene)
  const mats = document.getElementById("materials");
  mats.innerHTML = "";
  for(const m of scene.materials){
    const li = document.createElement("li");
    li.textContent = m;
    mats.appendChild(li);
  }

  // checklist
  const cl = document.getElementById("checklist");
  cl.innerHTML = "";
  scene.checked = scene.checked || scene.checklist.map(()=>false);
  scene.checklist.forEach((txt, idx)=>{
    const row = document.createElement("div");
    row.className = "checkItem";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!scene.checked[idx];
    cb.id = `cl_${scene.id}_${idx}`;
    cb.addEventListener("change", ()=>{ scene.checked[idx] = cb.checked; });
    const lab = document.createElement("label");
    lab.htmlFor = cb.id;
    lab.textContent = txt;
    row.append(cb, lab);
    cl.appendChild(row);
  });

  // tasks
  renderTasks();

  // merksatz + model
  document.getElementById("merksatz").textContent = scene.merksatz;
  document.getElementById("modelNote").textContent = scene.modelNote || "";

  // subtitle
  const letter = String.fromCharCode(65 + state.sceneIndex);
  document.getElementById("subtitle").textContent = `Experiment ${letter} von ${String.fromCharCode(64 + state.meta.steps.length)}`;
}


function renderLearn(){
  const scene = state.active;
  const letter = String.fromCharCode(65 + state.sceneIndex);
  const title = document.getElementById("learnTitle");
  const list = document.getElementById("learnList");
  if(!title || !list) return;

  title.textContent = `Was lernst du in Experiment ${letter}?`;
  list.innerHTML = "";
  const learns = scene.learn || [];
  for(const g of learns){
    const li = document.createElement("li");
    li.textContent = g;
    list.appendChild(li);
  }
}

function renderTasks(){
  const scene = state.active;
  scene.answers = scene.answers || {};
  const wrap = document.getElementById("tasks");
  wrap.innerHTML = "";

  for(const t of scene.tasks){
    const card = document.createElement("div");
    card.className = "taskCard";
    const h = document.createElement("h3");
    h.textContent = t.title;
    card.appendChild(h);

    const p = document.createElement("div");
    p.className = "muted";
    p.textContent = t.prompt;
    card.appendChild(p);

    if(t.type==="text"){
      const f = document.createElement("div"); f.className="field";
      const ta = document.createElement("textarea");
      ta.placeholder = t.placeholder || "";
      ta.value = scene.answers[t.id] || "";
      ta.addEventListener("input", ()=> scene.answers[t.id] = ta.value);
      f.appendChild(ta);
      card.appendChild(f);
    }

    if(t.type==="textcheck"){
      const f = document.createElement("div"); f.className="field";
      const ta = document.createElement("textarea");
      ta.placeholder = t.placeholder || "";
      ta.value = scene.answers[t.id] || "";
      ta.addEventListener("input", ()=> scene.answers[t.id] = ta.value);
      f.appendChild(ta);
      card.appendChild(f);
    }

    if(t.type==="mcq"){
      const box = document.createElement("div");
      box.className = "optRow";
      const val = scene.answers[t.id];
      t.options.forEach((opt, idx)=>{
        const row = document.createElement("label");
        row.className = "opt";
        const r = document.createElement("input");
        r.type = "radio";
        r.name = t.id;
        r.value = String(idx);
        r.checked = String(val) === String(idx);
        r.addEventListener("change", ()=> scene.answers[t.id] = idx);
        const s = document.createElement("span");
        s.textContent = opt;
        row.append(r,s);
        box.appendChild(row);
      });
      card.appendChild(box);
    }

    if(t.type==="matrix"){
      const m = document.createElement("div");
      m.className = "matrix";
      m.innerHTML = `<div class="head">Kombination</div><div class="head">Wirkung</div>`;
      for(const row of t.rows){
        const lab = document.createElement("div");
        lab.className = "rowLabel";
        lab.textContent = row.label;

        const sel = document.createElement("select");
        sel.setAttribute("aria-label", row.label);
        const empty = document.createElement("option");
        empty.value = "";
        empty.textContent = "…";
        sel.appendChild(empty);
        for(const opt of t.options){
          const o = document.createElement("option");
          o.value = opt; o.textContent = opt;
          sel.appendChild(o);
        }
        const key = `${t.id}:${row.key}`;
        sel.value = scene.answers[key] || "";
        sel.addEventListener("change", ()=> scene.answers[key] = sel.value);

        m.append(lab, sel);
      }
      card.appendChild(m);
    }

    wrap.appendChild(card);
  }
}

function checkTasks(){
  const scene = state.active;
  scene.answers = scene.answers || {};
  let ok = 0, total = 0;
  const msgs = [];

  for(const t of scene.tasks){
    if(t.type==="mcq"){
      total++;
      const a = scene.answers[t.id];
      if(a === t.correct){
        ok++;
        msgs.push("✓ " + t.feedback.ok);
      } else {
        msgs.push("• " + t.feedback.wrong);
      }
    }
    if(t.type==="matrix"){
      total++;
      let all = true;
      for(const row of t.rows){
        const key = `${t.id}:${row.key}`;
        const a = scene.answers[key] || "";
        if(a !== t.correct[row.key]) all = false;
      }
      if(all){
        ok++;
        msgs.push("✓ Tabelle stimmt: gleiche Pole stoßen ab, ungleiche ziehen an.");
      } else {
        msgs.push("• Tipp: gleiche Pole (N–N oder S–S) → stoßen, ungleiche (N–S) → ziehen.");
      }
    }
    if(t.type==="textcheck"){
      total++;
      const txt = (scene.answers[t.id] || "").toLowerCase();
      const hit = t.keywords.some(k => txt.includes(k));
      if(hit){
        ok++;
        msgs.push("✓ Gute Formulierung!");
      } else {
        msgs.push("• Tipp: Nutze eines der Wörter: " + t.keywords.join(" / "));
      }
    }
  }

  const fb = document.getElementById("taskFeedback");
  fb.hidden = false;

  const ratio = total ? ok/total : 1;
  fb.className = "note " + (ratio>0.66 ? "ok" : (ratio>0.33 ? "" : "warn"));
  fb.textContent = (total ? `Ergebnis: ${ok} von ${total} Aufgaben passen gut. ` : "") + msgs.join(" ");
}

function setPanelOpen(open){
  const panel = document.getElementById("panel");
  panel.dataset.open = open ? "1" : "0";
  document.getElementById("panelToggle").textContent = open ? "Aufgaben ▼" : "Aufgaben ▲";
}

// --- Interaction (Pointer Events) -------------------------------------------

function attachPointerHandlers(){
  const stage = document.getElementById("stage");
  stage.onpointerdown = onDown;
  stage.onpointermove = onMove;
  stage.onpointerup = onUp;
  stage.onpointercancel = onUp;
}

function svgPoint(evt){
  const svg = document.getElementById("stage");
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function findObjFromEvent(evt){
  const g = evt.target.closest("[data-id]");
  if(!g) return null;
  const id = g.getAttribute("data-id");
  return getObj(id);
}

function isBeingDragged(id){
  return state.dragging && state.dragging.id === id;
}

function onDown(evt){
  const o = findObjFromEvent(evt);
  if(!o) return;

  // select (update previous selection outline too)
  const prevId = state.selectedId;
  state.selectedId = o.id;
  if(prevId && prevId !== o.id){
    const prev = getObj(prevId);
    if(prev) updateTransform(prev);
  }
  updateTransform(o);

  const handle = evt.target.getAttribute("data-handle");
  const scene = state.active;

  if(handle==="rot" && o.rotatable){
    evt.preventDefault();
    const p = svgPoint(evt);
    const ang = Math.atan2(p.y - o.y, p.x - o.x);
    state.dragging = { mode:"rotate", id:o.id, baseRot:o.rot, startAng: ang, pointerId: evt.pointerId };
    evt.target.setPointerCapture(evt.pointerId);
    return;
  }

  if(!o.draggable) return;

  evt.preventDefault();
  // detach if attached and user grabs it
  if(o.attachedTo){
    detach(o);
  }

  const p = svgPoint(evt);
  state.dragging = { mode:"move", id:o.id, dx:o.x - p.x, dy:o.y - p.y, pointerId: evt.pointerId };
  evt.target.setPointerCapture(evt.pointerId);
}

function onMove(evt){
  if(!state.dragging || evt.pointerId !== state.dragging.pointerId) return;
  const o = getObj(state.dragging.id);
  if(!o) return;

  const p = svgPoint(evt);

  if(state.dragging.mode==="move"){
    o.x = clamp(p.x + state.dragging.dx, STAGE.pad, STAGE.w - STAGE.pad);
    o.y = clamp(p.y + state.dragging.dy, STAGE.pad, STAGE.h - STAGE.pad);
    o.vx = 0; o.vy = 0;

    // if dragged off track, release track
    if(o.track){
      // allow a little vertical freedom before detaching
      if(Math.abs(o.y - o.track.y) > 40){
        o.track = null;
        toast("Vom Rollenweg gelöst.");
      } else {
        o.y = o.track.y;
      }
    }
    updateTransform(o);
  }

  if(state.dragging.mode==="rotate"){
    const ang = Math.atan2(p.y - o.y, p.x - o.x);
    const delta = ang - state.dragging.startAng;
    o.rot = state.dragging.baseRot + deg(delta);
    updateTransform(o);
  }
}

function onUp(evt){
  if(!state.dragging || evt.pointerId !== state.dragging.pointerId) return;
  const o = getObj(state.dragging.id);
  const scene = state.active;

  state.dragging = null;

  if(!o) return;

  // snap rotation for some scenes
  if(o.type==="magnet" && scene.id!=="strength"){
    // snap to 0 or 180 for easier comparisons
    o.rot = snapAngle(o.rot, [0,180]);
    updateTransform(o);
  } else if(o.type==="magnet" && o.lockAngles){
    o.rot = snapAngle(o.rot, [0,180]);
    updateTransform(o);
  }

  // try to snap to rollers track (if present in scene)
  if(scene.id==="mutual"){
    const trackDef = { xmin: 520, xmax: 840, pencilY: 410, pencilH: 26, snapY: 58,
      yFor:(obj)=> (410 - 26/2) - (obj.h/2) - 2 };
    const snapped = trySnapToTrack(o, trackDef, ["block","magnet"]);
    if(snapped){
      // Nur eins darf gleichzeitig rollen
      const block = getObj("block1");
      const mag = getObj("mag2");
      if(o.id === "block1" && mag){ mag.track = null; mag.vx = 0; mag.vy = 0; updateTransform(mag); toast("Block rollt (Magnet bleibt stehen)."); }
      if(o.id === "mag2" && block){ block.track = null; block.vx = 0; block.vy = 0; updateTransform(block); toast("Magnet rollt (Block bleibt stehen)."); }
    }
  }
  if(scene.id==="two"){
    const trackDef = { xmin: 470, xmax: 900, pencilY: 420, pencilH: 26, snapY: 58,
      yFor:(obj)=> (420 - 26/2) - (obj.h/2) - 2 };
    const snapped = trySnapToTrack(o, trackDef, ["magnet"]);
    if(snapped) toast("Rastet auf den Rollen ein.");
  }

  // after releasing, re-attach if close (step 1)
  if(scene.id==="strength"){
    // attachments happen in tick, but a quick update feels better
    scene.physics(0);
  }
}

function snapAngle(angle, snaps){
  // normalize 0..360
  let a = ((angle%360)+360)%360;
  let best = snaps[0], bestD = 1e9;
  for(const s of snaps){
    const d = Math.min(Math.abs(a-s), 360-Math.abs(a-s));
    if(d<bestD){ bestD=d; best=s; }
  }
  return best;
}

function trySnapToTrack(o, trackDef, allowedTypes){
  if(!allowedTypes.includes(o.type)) return false;

  const yTarget = trackDef.yFor(o);
  const nearY = Math.abs(o.y - yTarget) < (trackDef.snapY ?? 48);
  const inX = o.x > trackDef.xmin-40 && o.x < trackDef.xmax+40;
  if(!nearY || !inX) return false;

  o.track = { xmin: trackDef.xmin, xmax: trackDef.xmax, y: yTarget };
  o.y = yTarget;
  o.vx = 0; o.vy = 0;
  updateTransform(o);
  return true;
}

// --- Controls ----------------------------------------------------------------

function bindUI(){
  document.getElementById("resetBtn").addEventListener("click", resetAll);

  const help = document.getElementById("helpModal");
  document.getElementById("helpBtn").addEventListener("click", ()=> help.hidden=false);
  document.getElementById("closeHelp").addEventListener("click", ()=> help.hidden=true);

  document.getElementById("checkBtn").addEventListener("click", checkTasks);
  document.getElementById("nextStep").addEventListener("click", ()=> setScene(state.sceneIndex+1));

  document.getElementById("panelToggle").addEventListener("click", ()=>{
    const panel = document.getElementById("panel");
    setPanelOpen(panel.dataset.open !== "1");
  });

  document.getElementById("nudgeBtn").addEventListener("click", ()=>{
    if(state.active.id!=="poles") return;
    const m = getObj("magH");
    m.hanging.omega += (Math.random()>0.5 ? 1 : -1) * 240;
    toast("Magnet wurde angestoßen.");
  });

  document.getElementById("flipBtn").addEventListener("click", ()=>{
    const o = getObj(state.selectedId);
    if(!o || o.type!=="magnet") { toast("Tippe zuerst einen Magneten an."); return; }
    o.rot = (snapAngle(o.rot,[0,180])===0) ? 180 : 0;
    updateTransform(o);
    toast("Magnet gedreht.");
  });

  // start with panel open on desktop, closed on mobile
  setPanelOpen(window.matchMedia("(min-width: 900px)").matches);
  window.addEventListener("resize", ()=>{
    if(window.matchMedia("(min-width: 900px)").matches) setPanelOpen(true);
  });
}

// --- Scene management --------------------------------------------------------

function setScene(i){
  const n = state.meta.steps.length;
  state.sceneIndex = clamp(i, 0, n-1);
  state.active = state.scenes[state.sceneIndex];
  state.selectedId = null;

  // clear feedback area when switching
  const fb = document.getElementById("taskFeedback");
  fb.hidden = true; fb.textContent = "";

  buildStepper();
  renderSidePanel();
  renderLearn();
  renderScene();
}

function resetAll(){

  // rebuild scenes fresh (resets objects, checks, answers)
  state.scenes = makeScenes();
  for(const s of state.scenes){
    s.objects = s.initObjects();
  }
  state.active = state.scenes[0];
  state.sceneIndex = 0;
  state.selectedId = null;
  hideToast();

  buildStepper();
  renderSidePanel();
  renderLearn();
  renderScene();
  toast("Alles zurückgesetzt.");
}

// --- Accessors ---------------------------------------------------------------

function getObj(id){
  return state.active.objects.find(o=>o.id===id) || null;
}

// --- Tick --------------------------------------------------------------------

function tick(t){
  if(!state.lastT) state.lastT = t;
  const dt = clamp((t - state.lastT)/1000, 0, 0.033);
  state.lastT = t;

  // hide toast after time
  if(state.toast.until && t > state.toast.until){
    state.toast.until = 0;
    hideToast();
  }

  const scene = state.active;

  // update attached items positions
  for(const o of scene.objects){
    if(o.attachedTo && !isBeingDragged(o.id)){
      updateAttachedPosition(o);
    }
  }

  // run scene physics
  scene.physics?.(dt);

  requestAnimationFrame(tick);
}

// --- Init --------------------------------------------------------------------

function init(){
  document.getElementById("title").textContent = state.meta.title;
  buildGrid();
  attachPointerHandlers();
  bindUI();

  state.scenes = makeScenes();
  for(const s of state.scenes){
    s.objects = s.initObjects();
  }
  state.active = state.scenes[0];

  buildStepper();
  renderSidePanel();
  renderLearn();
  renderScene();

  requestAnimationFrame(tick);
}

init();
